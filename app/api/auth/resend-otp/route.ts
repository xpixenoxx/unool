/**
 * POST /api/auth/resend-otp
 *
 * Resends an OTP for signup or signin, subject to the 60-second cooldown.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { issueOtp, isResendCoolingDown } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/auth/email';
import { checkOtpGenerateLimit, getClientIp } from '@/lib/auth/rate-limits';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  email:   z.string().email(),
  purpose: z.enum(['signup', 'signin']),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, purpose } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    // Rate limit
    const { allowed, retryAfterMs } = await checkOtpGenerateLimit(`resend:${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    // Look up user
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const foundUser = userList?.users?.find(u => u.email === emailLower);
    if (!foundUser) {
      // Same response regardless — no enumeration
      return NextResponse.json({
        success:      true,
        message:      'If this email is registered, a new code will be sent.',
        nextResendAt: new Date(Date.now() + 60_000).toISOString(),
      }, { status: 200 });
    }

    const userId = foundUser.id;

    // Enforce 60-second cooldown
    const coolingDown = await isResendCoolingDown(userId, purpose);
    if (coolingDown) {
      return NextResponse.json(
        { success: false, message: 'Please wait 60 seconds before requesting another code.' },
        { status: 429 }
      );
    }

    const { otp, nextResendAt } = await issueOtp(userId, purpose);
    await sendOtpEmail({ to: emailLower, otp, purpose });

    logger.info('OTP resent', { userId, purpose });
    return NextResponse.json({
      success:      true,
      message:      'A new verification code has been sent.',
      nextResendAt: nextResendAt.toISOString(),
    }, { status: 200 });

  } catch (err) {
    logger.error('Resend OTP endpoint error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
