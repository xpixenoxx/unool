/**
 * POST /api/auth/signup
 *
 * Step 1 of 2 for signup.
 * Does NOT create a Supabase user yet.
 *
 * Flow:
 *  1. Validate name, email, password.
 *  2. Rate-limit by IP + email.
 *  3. Check email isn't already a verified Supabase user.
 *  4. Hash the password with Argon2id.
 *  5. Issue a signed OTP challenge storing {name, password_hash} in metadata.
 *  6. Send OTP email via Resend.
 *  7. Return generic success (no enumeration).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { issueSignupOtp } from '@/lib/auth/otp';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { sendOtpEmail } from '@/lib/auth/email';
import { checkOtpGenerateLimit, getClientIp } from '@/lib/auth/rate-limits';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  name:     z.string().min(1, 'Name is required').max(100),
  email:    z.string().email('Invalid email address'),
  password: z.string(),
});

// Identical wording whether the email exists or not — prevents account enumeration
const SUCCESS_RESPONSE = {
  success: true,
  message: 'If this email is not already registered, you will receive a verification code.',
};

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

    const { name, email, password } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    // Rate-limit by IP + email
    const { allowed, retryAfterMs } = await checkOtpGenerateLimit(`${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    // Validate password strength BEFORE any DB work
    const pwError = validatePassword(password);
    if (pwError) {
      return NextResponse.json({ success: false, message: pwError }, { status: 400 });
    }

    // Check if email is already a verified account — return generic success to avoid enumeration
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList?.users?.find(u => u.email === emailLower);
    if (existingUser?.email_confirmed_at) {
      // Already verified — silently return success (no enumeration)
      logger.info('Signup attempt for already-verified email', { email: emailLower });
      return NextResponse.json(SUCCESS_RESPONSE, { status: 200 });
    }

    // If a previous unverified user record exists in Supabase, delete it
    // (they never completed OTP — now we handle pending state in OTP table instead)
    if (existingUser && !existingUser.email_confirmed_at) {
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      
      // Also forcibly cleanup dangling public schema tables in case ON DELETE CASCADE is missing
      await supabaseAdmin.from('users').delete().eq('email', emailLower);
    }

    // Hash the password with Argon2id
    const passwordHash = await hashPassword(password);

    // Issue OTP — no Supabase user is created here
    const { otp } = await issueSignupOtp({
      email:        emailLower,
      name:         name.trim(),
      passwordHash,
    });

    // Send OTP email
    await sendOtpEmail({ to: emailLower, otp, purpose: 'signup' });

    logger.info('Signup OTP sent (user not yet created)', { email: emailLower });
    return NextResponse.json(SUCCESS_RESPONSE, { status: 200 });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Signup endpoint error', { error: new Error(errorMsg) });
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({
      success: false,
      message: isDev ? `[DEV ERROR] ${errorMsg}` : 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
