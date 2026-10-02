/**
 * POST /api/auth/signin
 *
 * Step 1 of sign-in: validate email + password, then issue an OTP.
 *
 * Flow:
 *  1. Rate-limit by IP.
 *  2. Validate input.
 *  3. Fetch user from Supabase by email.
 *  4. Read password_hash from user_metadata and verify with Argon2id.
 *  5. On credential match: issue OTP, send email.
 *  6. On credential mismatch: return generic "invalid credentials" (no enumeration).
 *  7. If account is not email-confirmed: return appropriate message.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { issueOtp, isResendCoolingDown } from '@/lib/auth/otp';
import { verifyPassword } from '@/lib/auth/password';
import { sendOtpEmail } from '@/lib/auth/email';
import { checkOtpGenerateLimit, getClientIp } from '@/lib/auth/rate-limits';
import { logger } from '@/lib/logger';
import { createServerClient } from '@supabase/ssr';
import { config } from '@/lib/config/schema';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const bodySchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const INVALID_MSG = 'Invalid email or password.';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    // Rate limit
    const { allowed, retryAfterMs } = await checkOtpGenerateLimit(`signin:${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    // Fetch user by email
    const { data: userList, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();
    const user = userList?.users?.find(u => u.email === emailLower);
    if (fetchError || !user) {
      // Constant-time: still run a dummy hash compare to avoid timing oracle
      await verifyPassword('$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy', password);
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    // Check if account is email-confirmed
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, message: 'Please verify your email before signing in.' },
        { status: 403 }
      );
    }

    // Retrieve password hash from user_metadata
    const storedHash: string | undefined = user.user_metadata?.password_hash;
    if (!storedHash) {
      // This user signed up via OAuth / magic link — no password set
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    // Argon2id verification (timing-safe internally)
    const passwordValid = await verifyPassword(storedHash, password);
    if (!passwordValid) {
      logger.warn('Failed signin attempt', { email: emailLower, ip });
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    // Check if MFA is enabled
    const mfaEnabled = user.user_metadata?.mfa_enabled === true;
    
    if (mfaEnabled) {
      // Check cooldown before re-issuing OTP
      const coolingDown = await isResendCoolingDown(user.id, 'signin');
      if (coolingDown) {
        return NextResponse.json(
          { success: false, message: 'A code was already sent. Please wait 60 seconds before requesting another.' },
          { status: 429 }
        );
      }
  
      // Issue and email OTP
      const { otp, nextResendAt } = await issueOtp(user.id, 'signin');
      await sendOtpEmail({ to: emailLower, otp, purpose: 'signin' });
  
      logger.info('Signin OTP sent', { userId: user.id });
      return NextResponse.json({
        success:      true,
        message:      'A verification code has been sent to your email.',
        nextResendAt: nextResendAt.toISOString(),
      }, { status: 200 });
    } else {
      // ── MFA disabled: Create session directly ──────────────────────────────
      const tempPassword = crypto.randomBytes(32).toString('base64');
  
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: tempPassword
      });
  
      if (updateError) {
        logger.error('Failed to prepare session (signin direct)', { error: updateError, userId: user.id });
        return NextResponse.json({ success: false, message: 'Session creation failed.' }, { status: 500 });
      }

      const cookieStore = await cookies();
      let sessionData: any = null;
      
      const supabaseSSR = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(toSet) { 
            toSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      });

      const { data: signInData, error: signInError } = await supabaseSSR.auth.signInWithPassword({
        email: emailLower,
        password: tempPassword,
      });
      sessionData = signInData;

      if (signInError) {
        logger.error('Session exchange error (signin direct)', { error: signInError, userId: user.id });
        return NextResponse.json({ success: false, message: 'Session creation failed.' }, { status: 500 });
      }

      logger.info('Direct signin complete (MFA disabled)', { userId: user.id });
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Signed in successfully.', 
        redirectTo: '/dashboard',
        session: {
          access_token: sessionData?.session?.access_token,
          refresh_token: sessionData?.session?.refresh_token,
          expires_at: sessionData?.session?.expires_at,
          user: {
            id: sessionData?.user?.id,
            email: sessionData?.user?.email,
          },
        },
      }, { status: 200 });
      
      cookieStore.getAll().forEach(({ name, value }) => {
        const existing = cookieStore.get(name);
        if (existing) response.cookies.set(name, value, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
      });
      
      return response;
    }

  } catch (err) {
    logger.error('Signin endpoint error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
