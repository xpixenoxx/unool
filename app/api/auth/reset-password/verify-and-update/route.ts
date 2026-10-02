import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyOtp } from '@/lib/auth/otp';
import { hashPassword } from '@/lib/auth/password';
import { checkOtpVerifyLimit, getClientIp } from '@/lib/auth/rate-limits';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, otp, password } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    const { allowed, retryAfterMs } = await checkOtpVerifyLimit(`reset:${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many verification attempts. Please wait.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const user = userList?.users?.find(u => u.email === emailLower);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid or expired code.' }, { status: 400 });
    }

    const result = await verifyOtp(user.id, 'reset', otp);
    if (!result.success) {
      return NextResponse.json({ success: false, message: 'Invalid or expired code.' }, { status: 400 });
    }

    const newHash = await hashPassword(password);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        password_hash: newHash,
      },
    });

    if (updateError) {
      logger.error('Failed to update password', { error: updateError, userId: user.id });
      return NextResponse.json({ success: false, message: 'Failed to reset password.' }, { status: 500 });
    }

    logger.info('Password reset successfully completed', { userId: user.id });
    return NextResponse.json({ success: true, message: 'Password has been reset successfully.' }, { status: 200 });

  } catch (err) {
    logger.error('Reset password verify error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
