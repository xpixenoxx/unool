/**
 * POST /api/auth/signup
 *
 * Registers a new user.
 * Flow:
 *  1. Validate name, email, password.
 *  2. Check rate limit.
 *  3. Hash the password with Argon2id.
 *  4. Create the user in Supabase auth (email_confirm = false).
 *     If the user already exists, silently re-use that account (no enumeration).
 *  5. Generate and store a hashed OTP.
 *  6. Send OTP email via Resend.
 *  7. Return success (identical response whether email exists or not).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { issueOtp } from '@/lib/auth/otp';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { sendOtpEmail } from '@/lib/auth/email';
import { checkOtpGenerateLimit, getClientIp } from '@/lib/auth/rate-limits';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  name:     z.string().min(1, 'Name is required').max(100),
  email:    z.string().email('Invalid email address'),
  password: z.string(),
});

const SUCCESS_RESPONSE = {
  success: true,
  message: 'If this email is not already registered, you will receive a verification code.',
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    // Rate limit by IP + email
    const { allowed, retryAfterMs } = await checkOtpGenerateLimit(`${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    // Validate password BEFORE hitting the DB
    const pwError = validatePassword(password);
    if (pwError) {
      return NextResponse.json({ success: false, message: pwError }, { status: 400 });
    }

    // Hash the password with Argon2id
    const passwordHash = await hashPassword(password);

    // ── Try to create the user ───────────────────────────────────────────────
    let userId: string | null = null;

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email:         emailLower,
      email_confirm: false,          // unverified until OTP is entered
      user_metadata: {
        full_name:     name.trim(),
        password_hash: passwordHash, // stored in metadata; used by /api/auth/signin
      },
    });

    if (createError) {
      const msg = createError.message?.toLowerCase() ?? '';
      const alreadyExists =
        msg.includes('already registered') ||
        msg.includes('already been registered') ||
        msg.includes('duplicate') ||
        msg.includes('already exists');

      if (alreadyExists) {
        // User already exists — look them up silently (no enumeration to caller)
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === emailLower);
        if (existingUser) {
          userId = existingUser.id;
        }
      } else {
        logger.error('Signup create user error', { error: createError, email: emailLower });
        // Return generic success to avoid leaking implementation details
        return NextResponse.json(SUCCESS_RESPONSE, { status: 200 });
      }
    } else {
      userId = userData?.user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json(SUCCESS_RESPONSE, { status: 200 });
    }

    // Issue OTP and email it
    const { otp } = await issueOtp(userId, 'signup');
    await sendOtpEmail({ to: emailLower, otp, purpose: 'signup' });

    logger.info('Signup OTP sent', { userId, email: emailLower });
    return NextResponse.json(SUCCESS_RESPONSE, { status: 200 });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Signup endpoint error', { error: new Error(errorMsg) });

    // In dev: expose the real error so we can debug. Remove in production.
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({
      success: false,
      message: isDev ? `[DEV ERROR] ${errorMsg}` : 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
