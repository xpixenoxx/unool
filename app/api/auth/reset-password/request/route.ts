import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { issueOtp, isResendCoolingDown } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/auth/email';
import { checkOtpGenerateLimit, getClientIp } from '@/lib/auth/rate-limits';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.errors[0].message }, { status: 400 });
    }
    const emailLower = parsed.data.email.toLowerCase().trim();

    const { allowed, retryAfterMs } = await checkOtpGenerateLimit(`reset:${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const user = userList?.users?.find(u => u.email === emailLower);
    
    // Do not reveal if user exists. We always simulate a successful return.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a verification code has been sent.',
        nextResendAt: new Date(Date.now() + 60 * 1000).toISOString(),
      }, { status: 200 });
    }

    const coolingDown = await isResendCoolingDown(user.id, 'reset');
    if (coolingDown) {
      return NextResponse.json(
        { success: false, message: 'A code was already sent. Please wait 60 seconds before requesting another.' },
        { status: 429 }
      );
    }

    const { otp, nextResendAt } = await issueOtp(user.id, 'reset');
    // Using string mapping internally if 'reset' is not explicitly supported 
    // by sendOtpEmail yet, we will update email.ts next.
    await sendOtpEmail({ to: emailLower, otp, purpose: 'reset' as any });

    logger.info('Reset OTP sent', { userId: user.id });
    return NextResponse.json({
      success: true,
      message: 'If an account exists, a verification code has been sent.',
      nextResendAt: nextResendAt.toISOString(),
    }, { status: 200 });

  } catch (err) {
    logger.error('Reset request error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
