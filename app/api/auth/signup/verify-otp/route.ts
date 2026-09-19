/**
 * POST /api/auth/signup/verify-otp
 *
 * Step 2 of 2 for signup.
 * Called AFTER the user submits their 6-digit OTP.
 *
 * Flow:
 *  1. Rate-limit.
 *  2. Verify the OTP (looks up by email in auth_otp_challenges).
 *  3. Extract {name, password_hash} from the OTP challenge metadata.
 *  4. Create the Supabase user (email already confirmed — no magic link needed).
 *  5. Stamp the password_hash into user_metadata.
 *  6. Return success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifySignupOtp } from '@/lib/auth/otp';
import { checkOtpVerifyLimit, getClientIp } from '@/lib/auth/rate-limits';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const body   = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const emailLower     = email.toLowerCase().trim();

    // Rate limit verify attempts
    const { allowed, retryAfterMs } = await checkOtpVerifyLimit(`${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many verification attempts. Please wait.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    // Verify OTP — this looks up the pending challenge by email (no user_id)
    const result = await verifySignupOtp(emailLower, otp);

    if (!result.success) {
      const messages: Record<string, string> = {
        expired:      'This code has expired. Please request a new one.',
        max_attempts: 'Too many incorrect attempts. Please request a new code.',
        used:         'This code has already been used.',
        not_found:    'Invalid or expired code.',
        invalid:      'Incorrect code. Please try again.',
      };
      return NextResponse.json(
        { success: false, message: messages[result.reason] ?? 'Invalid or expired code.' },
        { status: 400 }
      );
    }

    // ── OTP verified! Now create the Supabase user for the first time ─────────
    const { name, password_hash } = result.metadata as { name: string; password_hash: string };

    if (!name || !password_hash) {
      logger.error('Missing metadata in verified OTP challenge', { email: emailLower });
      return NextResponse.json({ success: false, message: 'Verification data lost. Please sign up again.' }, { status: 500 });
    }

    // Create the user with email already confirmed (no email needed from Supabase)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email:         emailLower,
      email_confirm: true,    // ✅ mark as verified immediately
      user_metadata: {
        full_name:     name,
        password_hash: password_hash,
      },
    });

    if (createError) {
      // If the user already exists (duplicate OTP submit), just return success
      const alreadyExists = createError.message?.toLowerCase().includes('already');
      if (alreadyExists) {
        return NextResponse.json({ success: true, message: 'Account already verified. You can sign in.' }, { status: 200 });
      }
      logger.error('Failed to create user after OTP verification', { error: createError, email: emailLower });
      return NextResponse.json({ success: false, message: 'Account creation failed. Please try again.' }, { status: 500 });
    }

    logger.info('Signup complete — Supabase user created after OTP verification', {
      userId: userData?.user?.id,
      email:  emailLower,
    });

    return NextResponse.json({
      success: true,
      message: 'Account verified! You can now sign in.',
    }, { status: 200 });

  } catch (err) {
    logger.error('Signup verify-otp error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
