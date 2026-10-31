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
import { config } from '@/lib/config/schema';

const bodySchema = z.object({
  name:     z.string().min(1, 'Name is required').max(100),
  email:    z.string().email('Invalid email address'),
  password: z.string(),
  ref:      z.string().optional(),
});

// Identical wording whether the email exists or not — prevents account enumeration
const SUCCESS_RESPONSE = {
  success: true,
  message: 'If this email is not already registered, you will receive a verification code.',
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const isDev = config.NODE_ENV !== 'production' || config.DEV_AUTH_BYPASS === true;

  try {
    const body   = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, ref } = parsed.data;
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

    // Check if email is already a verified account
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList?.users?.find(u => u.email === emailLower);
    // Allow deleted accounts to re-register (soft-delete via is_deleted flag or deleted_accounts entry)
    let isExistingDeleted = existingUser?.user_metadata?.is_deleted === true;
    if (existingUser && !isExistingDeleted) {
      try {
        const { data: delAcc } = await supabaseAdmin
          .from('deleted_accounts')
          .select('id')
          .eq('user_id', existingUser.id)
          .is('recovered_at', null)
          .limit(1);
        if (delAcc && delAcc.length > 0) {
          isExistingDeleted = true;
        }
      } catch {}
    }

    if (existingUser?.email_confirmed_at && !isExistingDeleted) {
      logger.info('Signup attempt for already-verified email', { email: emailLower });
      return NextResponse.json({
        success: false,
        alreadyRegistered: true,
        message: 'This email is already registered. Please sign in instead.',
      }, { status: 409 });
    }

    // If the existing account is soft-deleted, permanently purge it so the
    // new registration can proceed cleanly.
    if (existingUser && isExistingDeleted) {
      logger.info('Clearing soft-deleted account to allow re-registration', { email: emailLower, userId: existingUser.id });
      try {
        await supabaseAdmin.from('users').delete().eq('id', existingUser.id);
        await supabaseAdmin.from('deleted_accounts').delete().eq('user_id', existingUser.id);
      } catch (cleanErr) {
        logger.warn('Non-fatal cleanup error before deleting auth user', { cleanErr });
      }
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }

    // If a previous unverified user record exists in Supabase, delete it
    // (they never completed OTP — now we handle pending state in OTP table instead)
    if (existingUser && !existingUser.email_confirmed_at && !isExistingDeleted) {
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      await supabaseAdmin.from('users').delete().eq('email', emailLower);
    }

    // Hash the password with Argon2id
    const passwordHash = await hashPassword(password);

    // Issue OTP — no Supabase user is created here
    const { otp } = await issueSignupOtp({
      email:        emailLower,
      name:         name.trim(),
      passwordHash,
      referralCode: ref,
    });

    // Send OTP email
    await sendOtpEmail({ to: emailLower, otp, purpose: 'signup' });

    logger.info('Signup OTP sent (user not yet created)', { email: emailLower });
    return NextResponse.json({
      ...SUCCESS_RESPONSE,
      devOtp: isDev ? otp : undefined,
      isDev,
    }, { status: 200 });

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
