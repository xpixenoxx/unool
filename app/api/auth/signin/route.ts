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
import { issueOtp, isResendCoolingDown } from '@/lib/auth/otp';
import { verifyPassword } from '@/lib/auth/password';
import { getUserPasswordHash } from '@/lib/auth/credentials';
import { sendOtpEmail } from '@/lib/auth/email';
import { checkOtpGenerateLimit, getClientIp } from '@/lib/auth/rate-limits';
import { logger } from '@/lib/logger';
import { createServerClient } from '@supabase/ssr';
import { config } from '@/lib/config/schema';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findUserByEmail } from '@/lib/auth/findUserByEmail';

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
    const user = await findUserByEmail(emailLower);
    if (!user) {
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

    // Retrieve password hash from user_credentials table (with legacy user_metadata fallback + lazy migration)
    const { hash: storedHash } = await getUserPasswordHash({
      id: user.id,
      user_metadata: user.user_metadata,
    });
    if (!storedHash) {
      // This user signed up via OAuth / magic link — no password set
      const isGoogleUser =
        (user as any).app_metadata?.provider === 'google' ||
        (user as any).identities?.some((i: any) => i.provider === 'google');

      if (isGoogleUser) {
        return NextResponse.json(
          {
            success: false,
            code: 'oauth_account',
            message: 'This account is linked with Google. Please click "Continue with Google" or reset your password to sign in.',
          },
          { status: 401 }
        );
      }

      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    // Argon2id verification (timing-safe internally)
    const passwordValid = await verifyPassword(storedHash, password);
    if (!passwordValid) {
      logger.warn('Failed signin attempt', { email: emailLower, ip });
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    // Check if account is deleted or suspended (only after password is verified)
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
      logger.warn('Signin attempt on deleted account', { email: emailLower, userId: user.id });
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
      logger.warn('Signin attempt on suspended account', { email: emailLower, userId: user.id });
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

      // Primary strategy: magiclink token exchange via admin.generateLink + verifyOtp.
      // This works universally for all accounts (including Google OAuth users who have no
      // password identity in GoTrue) without mutating the user's password or triggering GoTrue 400.
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
            logger.warn('Direct signin magiclink verifyOtp failed, trying fallback', {
              error: otpResult.error.message,
              userId: user.id,
            });
          }
        } else if (linkError) {
          logger.warn('Direct signin generateLink failed, trying fallback', {
            error: linkError.message,
            userId: user.id,
          });
        }
      } catch (genErr) {
        logger.warn('Direct signin generateLink threw exception, trying fallback', {
          error: genErr instanceof Error ? genErr.message : String(genErr),
          userId: user.id,
        });
      }

      // Fallback strategy: temporary password update + signInWithPassword (for legacy environments)
      if (!sessionData?.session) {
        const tempPassword = crypto.randomBytes(32).toString('base64');
        const updateResult = await supabaseAdmin?.auth?.admin?.updateUserById?.(user.id, {
          password: tempPassword,
        });
        const updateError = updateResult?.error;

        if (updateError) {
          logger.error('Failed to prepare session (signin direct)', { error: updateError, userId: user.id });
          return NextResponse.json({ success: false, message: 'Session creation failed.' }, { status: 500 });
        }

        const passResult = await supabaseSSR?.auth?.signInWithPassword?.({
          email: normalizedEmail,
          password: tempPassword,
        });
        const passSignInData = passResult?.data;
        const passSignInError = passResult?.error;

        if (passSignInError || !passSignInData?.session) {
          logger.error('Session exchange error (signin direct)', {
            error: passSignInError || linkError,
            userId: user.id,
          });
          return NextResponse.json({ success: false, message: 'Session creation failed.' }, { status: 500 });
        }

        sessionData = passSignInData;
      }

      logger.info('Direct signin complete (MFA disabled)', { userId: user.id });

      const response = NextResponse.json(
        {
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
        },
        { status: 200 }
      );

      // Apply cookies to the response with their original options (maxAge, etc.)
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    }

  } catch (err) {
    logger.error('Signin endpoint error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
