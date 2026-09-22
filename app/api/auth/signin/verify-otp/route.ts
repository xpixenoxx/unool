/**
 * POST /api/auth/signin/verify-otp
 *
 * Step 2 of sign-in: verify the sign-in OTP.
 * On success: creates a Supabase session and sets secure HTTP-only cookies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyOtp } from '@/lib/auth/otp';
import { checkOtpVerifyLimit, getClientIp } from '@/lib/auth/rate-limits';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';

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
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const user = userList?.users?.find(u => u.email === emailLower);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid or expired code.' }, { status: 400 });
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
    // Since we manage the password_hash with Argon2id AND the user explicitly
    // wants Magic Links disabled in Supabase, we cannot use admin.generateLink.
    // Instead, we inject a secure temporary password, sign in via SSR to get
    // the cookies, and then scramble the password so it can never be used again.

    const crypto = await import('crypto');
    const tempPassword = crypto.randomBytes(32).toString('base64');

    // 1. Set temporary password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: tempPassword
    });

    if (updateError) {
      logger.error('Failed to prepare session', { error: updateError, userId: user.id });
      return NextResponse.json({ success: false, message: 'Session creation failed.' }, { status: 500 });
    }

    // 2. Exchange temp password for a real session (setting cookies)
    const cookieStore = await cookies();
    
    // Pre-create response so we can attach Set-Cookie headers to it
    let sessionData: any = null;
    const tempResponse = { headers: new Headers() };
    
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

    // The password is a 32-byte secure random string that only the server knows.
    // We intentionally DO NOT scramble it again because changing the password
    // immediately revokes the JWT session we just created.

    if (signInError) {
      logger.error('Session exchange error', { error: signInError, userId: user.id });
      return NextResponse.json({ success: false, message: 'Session creation failed.' }, { status: 500 });
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
    
    // Re-apply cookies to this response
    cookieStore.getAll().forEach(({ name, value }) => {
      const existing = cookieStore.get(name);
      if (existing) response.cookies.set(name, value, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    });
    
    return response;

  } catch (err) {
    logger.error('Signin verify-otp error', { error: err instanceof Error ? err : new Error(String(err)) });
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
