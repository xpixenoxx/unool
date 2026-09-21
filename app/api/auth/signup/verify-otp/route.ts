/**
 * POST /api/auth/signup/verify-otp
 *
 * Step 2 of 2 for signup.
 * Called AFTER the user submits their 6-digit OTP.
 *
 * Flow:
 *  1. Rate-limit.
 *  2. Verify the OTP (looks up by email in auth_otp_challenges).
 *  3. Extract {name, password_hash} from the OTP challenge metadata.
 *  4. Create the Supabase user (email already confirmed — no magic link needed).
 *  5. Stamp the password_hash into user_metadata.
 *  6. Return success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifySignupOtp } from '@/lib/auth/otp';
import { checkOtpVerifyLimit, getClientIp } from '@/lib/auth/rate-limits';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

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

    const { email, otp } = parsed.data;
    const emailLower     = email.toLowerCase().trim();

    // Rate limit verify attempts
    const { allowed, retryAfterMs } = await checkOtpVerifyLimit(`${ip}:${emailLower}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many verification attempts. Please wait.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
      );
    }

    // Verify OTP — this looks up the pending challenge by email (no user_id)
    const result = await verifySignupOtp(emailLower, otp);

    if (!result.success) {
      const messages: Record<string, string> = {
        expired:      'This code has expired. Please request a new one.',
        max_attempts: 'Too many incorrect attempts. Please request a new code.',
        used:         'This code has already been used.',
        not_found:    'Invalid or expired code.',
        invalid:      'Incorrect code. Please try again.',
      };
      const isDev = process.env.NODE_ENV !== 'production';
      return NextResponse.json(
        { success: false, message: isDev ? `[DEV: ${result.reason}] ${messages[result.reason]}` : (messages[result.reason] ?? 'Invalid or expired code.') },
        { status: 400 }
      );
    }

    // ── OTP verified! Now create the Supabase user for the first time ─────────
    const { name, password_hash } = result.metadata as { name: string; password_hash: string };

    if (!name || !password_hash) {
      logger.error('Missing metadata in verified OTP challenge', { email: emailLower });
      return NextResponse.json({ success: false, message: 'Verification data lost. Please sign up again.' }, { status: 500 });
    }

    // Create the user with email already confirmed (no email needed from Supabase)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email:         emailLower,
      email_confirm: true,    // ✅ mark as verified immediately
      user_metadata: {
        full_name:     name,
        password_hash: password_hash,
      },
    });

    if (createError) {
      const errMsg = createError.message?.toLowerCase() ?? '';
      // If the user already exists (duplicate OTP submit or leftover unverified user)
      if (errMsg.includes('already') || errMsg.includes('duplicate')) {
        // Try to update the existing user instead
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = userList?.users?.find(u => u.email === emailLower);
        if (existingUser) {
          // Update their metadata and confirm their email
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            email_confirm: true,
            user_metadata: {
              full_name:     name,
              password_hash: password_hash,
            },
          });
          logger.info('Signup: updated existing unverified user', { userId: existingUser.id, email: emailLower });
          return await logUserInAndRedirect(existingUser.id, emailLower);
        }
        // If they already existed and were verified: just tell them to sign in
        return NextResponse.json({ success: true, message: 'Account already verified. You can sign in.' }, { status: 200 });
      }
      logger.error('Failed to create user after OTP verification', { error: new Error(createError.message), email: emailLower });
      return NextResponse.json({ success: false, message: `Account creation failed: ${createError.message}` }, { status: 500 });
    }

    logger.info('Signup complete — Supabase user created', {
      userId: userData?.user?.id,
      email:  emailLower,
    });

    return await logUserInAndRedirect(userData.user.id, emailLower);

  } catch (err) {
    logger.error('Signup verify-otp error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Helper to log the user in using a temporary password and set the session cookies
// before scrambling the password again.
async function logUserInAndRedirect(userId: string, email: string) {
  try {
    const crypto = await import('crypto');
    const tempPassword = crypto.randomBytes(32).toString('base64');
    
    await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword });
    
    const response = NextResponse.json({
      success: true,
      message: 'Account verified!',
      redirectTo: '/onboarding/start'
    }, { status: 200 });

    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(toSet) { 
          toSet.forEach(({ name, value, options }) => {
            // Must mutate both request cookies and response cookies in Next.js
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data: signInData, error: signInError } = await supabaseSSR.auth.signInWithPassword({ email: email, password: tempPassword });

    if (signInError) {
      throw signInError;
    }

    await supabaseAdmin.auth.admin.updateUserById(userId, { 
      password: crypto.randomBytes(32).toString('base64') 
    });

    // Return session tokens in the body so the browser-side Supabase client
    // can call setSession() and have a real, working session for subsequent requests.
    return NextResponse.json({
      success: true,
      message: 'Account verified!',
      redirectTo: '/onboarding/start',
      session: {
        access_token: signInData.session?.access_token,
        refresh_token: signInData.session?.refresh_token,
        expires_at: signInData.session?.expires_at,
        user: {
          id: signInData.user?.id,
          email: signInData.user?.email,
        },
      },
    }, { status: 200, headers: response.headers });
  } catch (error) {
    logger.error('Auto-login failed after signup', { error: error instanceof Error ? error : new Error(String(error)), userId });
    // Fall back to just telling them to sign in
    return NextResponse.json({
      success: true,
      message: 'Account verified! You can now sign in.',
    }, { status: 200 });
  }
}
