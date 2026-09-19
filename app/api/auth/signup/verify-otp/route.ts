/**
 * POST /api/auth/signup/verify-otp
 *
 * Verifies the signup OTP. On success:
 *  - Marks the Supabase auth user as email_confirmed.
 *  - The handle_new_user trigger then creates workspace + profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyOtp } from '@/lib/auth/otp';
import { checkOtpVerifyLimit, getClientIp } from '@/lib/auth/rate-limits';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

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

    const { email, otp } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    // Rate limit verify attempts by IP + email
    const { allowed, retryAfterMs } = await checkOtpVerifyLimit(`${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many verification attempts. Please wait.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    // Look up user
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const foundUser = userList?.users?.find(u => u.email === emailLower);
    if (!foundUser) {
      // Don't reveal user existence
      return NextResponse.json({ success: false, message: 'Invalid or expired code.' }, { status: 400 });
    }
    const userId = foundUser.id;

    // Verify OTP
    const result = await verifyOtp(userId, 'signup', otp);

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

    // Confirm the email in Supabase (triggers handle_new_user)
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (confirmError) {
      logger.error('Failed to confirm user email', { error: confirmError, userId });
      return NextResponse.json({ success: false, message: 'Verification failed. Please try again.' }, { status: 500 });
    }

    logger.info('Signup OTP verified, account confirmed', { userId, email: emailLower });
    return NextResponse.json({ success: true, message: 'Account verified! You can now sign in.' }, { status: 200 });

  } catch (err) {
    logger.error('Signup verify-otp error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
