/**
 * POST /api/auth/signin/verify-otp
 *
 * Step 2 of sign-in: verify the sign-in OTP.
 * On success: creates a Supabase session and sets secure HTTP-only cookies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { verifyOtp } from '@/lib/auth/otp';
import { checkOtpVerifyLimit, getClientIp } from '@/lib/auth/rate-limits';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findUserByEmail } from '@/lib/auth/findUserByEmail';

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
      return NextResponse.json({ success: false, message: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, otp } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    // Rate limit
    const { allowed, retryAfterMs } = await checkOtpVerifyLimit(`${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many verification attempts. Please wait.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    // Fetch user
    const user = await findUserByEmail(emailLower);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid or expired code.' }, { status: 400 });
    }

    // Check if account is deleted or suspended before verifying OTP
    const userRecord = user as Record<string, any>;
    let isDeleted    = user.user_metadata?.is_deleted === true;
    if (!isDeleted) {
      try {
        const { data: delAcc } = await supabaseAdmin
          .from('deleted_accounts')
          .select('id')
          .eq('user_id', user.id)
          .is('recovered_at', null)
          .limit(1);
        if (delAcc && delAcc.length > 0) {
          isDeleted = true;
        }
      } catch {}
    }
    const bannedUntil = userRecord.banned_until;
    const isSuspended = !isDeleted && !!(bannedUntil && new Date(bannedUntil) > new Date());

    if (isDeleted) {
      logger.warn('OTP verify attempt on deleted account', { email: emailLower, userId: user.id });
      return NextResponse.json(
        {
          success: false,
          code: 'account_deleted',
          message: 'Session creation failed. Contact Unool team',
          error: 'Session creation failed. Contact Unool team',
          contactUrl: 'https://unool.co/contact',
        },
        { status: 403 }
      );
    }

    if (isSuspended) {
      logger.warn('OTP verify attempt on suspended account', { email: emailLower, userId: user.id });
      return NextResponse.json(
        {
          success: false,
          code: 'account_suspended',
          message: 'Account suspended. Contact Unool team',
          error: 'Account suspended. Contact Unool team',
          contactUrl: 'https://unool.co/contact',
        },
        { status: 403 }
      );
    }

    // Verify OTP
    const result = await verifyOtp(user.id, 'signin', otp);

    if (!result.success) {
      const messages: Record<string, string> = {
        expired:      'This code has expired. Please sign in again to receive a new one.',
        max_attempts: 'Too many incorrect attempts. Please sign in again.',
        used:         'This code has already been used.',
        not_found:    'Invalid or expired code.',
        invalid:      'Incorrect code. Please check and try again.',
      };
      return NextResponse.json(
        { success: false, message: messages[result.reason] ?? 'Invalid or expired code.' },
        { status: 400 }
      );
    }

    // ── Create a Supabase session for this user ───────────────────────────────
    // Primary strategy: magiclink token exchange via admin.generateLink + verifyOtp.
    // Universally compatible with both OAuth-linked and email/password accounts,
    // without clobbering passwords or failing on GoTrue identities check.
    const cookieStore = await cookies();
    let sessionData: any = null;
    const cookiesToSet: { name: string; value: string; options: any }[] = [];

    const supabaseSSR = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet: Array<{ name: string; value: string; options?: any }>) {
          toSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            cookiesToSet.push({ name, value, options });
          });
        },
      },
    });

    const normalizedEmail = user.email ? user.email.toLowerCase().trim() : emailLower;
    let linkError: any = null;
    try {
      const linkResult = await supabaseAdmin?.auth?.admin?.generateLink?.({
        type: 'magiclink',
        email: normalizedEmail,
      });
      linkError = linkResult?.error;
      const linkData = linkResult?.data;

      const tokenHash = (linkData?.properties as Record<string, unknown> | undefined)?.hashed_token as
        | string
        | undefined;

      if (!linkError && tokenHash && supabaseSSR?.auth?.verifyOtp) {
        const otpResult = await supabaseSSR.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'magiclink',
        });

        if (!otpResult?.error && otpResult?.data?.session) {
          sessionData = otpResult.data;
        } else if (otpResult?.error) {
          logger.warn('Signin verify-otp magiclink verifyOtp failed, trying fallback', {
            error: otpResult.error.message,
            userId: user.id,
          });
        }
      } else if (linkError) {
        logger.warn('Signin verify-otp generateLink failed, trying fallback', {
          error: linkError.message,
          userId: user.id,
        });
      }
    } catch (genErr) {
      logger.warn('Signin verify-otp generateLink threw exception, trying fallback', {
        error: genErr instanceof Error ? genErr.message : String(genErr),
        userId: user.id,
      });
    }

    // Fallback strategy: temporary password update + signInWithPassword
    if (!sessionData?.session) {
      const crypto = await import('crypto');
      const tempPassword = crypto.randomBytes(32).toString('base64');

      const updateResult = await supabaseAdmin?.auth?.admin?.updateUserById?.(user.id, {
        password: tempPassword,
      });
      const updateError = updateResult?.error;

      if (updateError) {
        logger.error('Failed to prepare session', { error: updateError, userId: user.id });
        return NextResponse.json({ success: false, message: 'Session creation failed.' }, { status: 500 });
      }

      const passResult = await supabaseSSR?.auth?.signInWithPassword?.({
        email: normalizedEmail,
        password: tempPassword,
      });
      const passSignInData = passResult?.data;
      const passSignInError = passResult?.error;

      if (passSignInError || !passSignInData?.session) {
        logger.error('Session exchange error', { error: passSignInError || linkError, userId: user.id });
        return NextResponse.json({ success: false, message: 'Session creation failed.' }, { status: 500 });
      }

      sessionData = passSignInData;
    }

    logger.info('Signin OTP verified, session created', { userId: user.id });
    // Return the session tokens in the response body so the browser Supabase client
    // can call setSession() and make authenticated requests using Bearer tokens.
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
    
    // Apply cookies to the response with their original options (maxAge, etc.)
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    
    return response;

  } catch (err) {
    logger.error('Signin verify-otp error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
