import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';

// GET: Diagnostic endpoint to check SMTP/email delivery health
export async function GET() {
  const traceId = crypto.randomUUID();
  const diagnostics: Record<string, unknown> = {
    traceId,
    supabaseUrl: config.SUPABASE_URL,
    anonKeyPresent: !!config.SUPABASE_ANON_KEY && config.SUPABASE_ANON_KEY !== 'test-anon-key',
    anonKeyPrefix: config.SUPABASE_ANON_KEY?.slice(0, 20) + '...',
    appUrl: config.NEXT_PUBLIC_APP_URL,
    timestamp: new Date().toISOString(),
  };

  try {
    // Test Supabase auth connectivity
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    const { data: settings, error: settingsError } = await supabase.auth.getSession();
    diagnostics.authConnectivity = settingsError ? `ERROR: ${settingsError.message}` : 'OK';
    diagnostics.sessionCheck = settings ? 'Reachable' : 'Unreachable';
  } catch (err) {
    diagnostics.authConnectivity = `EXCEPTION: ${err instanceof Error ? err.message : 'Unknown'}`;
  }

  diagnostics.recommendation = 
    'If magic link returns 200 but no email arrives, you need to configure custom SMTP in Supabase Dashboard → Authentication → SMTP Settings. ' +
    'Supabase built-in email has a ~3-4 emails/hour rate limit and silently drops emails beyond that.';

  return NextResponse.json(diagnostics);
}

export async function POST(request: NextRequest) {
  const traceId = crypto.randomUUID();
  logger.info('Magic link request', { traceId });

  const { success, remaining, reset } = await checkRateLimit(request, 'magicLink');
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: rateLimitHeaders(remaining, reset) }
    );
  }

  try {
    const body = await request.json();
    const { email, redirectTo } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400, headers: rateLimitHeaders(remaining, reset) }
      );
    }

    // IMPORTANT: Always route through /auth/callback for code exchange.
    // The frontend may send a full URL like "http://localhost:3000/dashboard"
    // but emailRedirectTo MUST point to the auth callback page.
    // If the redirect URL isn't in Supabase's allowed redirect list, 
    // Supabase silently drops the email (returns 200 but sends nothing).
    let finalRedirect = '/dashboard';
    if (redirectTo) {
      try {
        // Extract just the pathname from full URLs like "http://localhost:3000/dashboard"
        const url = new URL(redirectTo);
        finalRedirect = url.pathname + url.search;
      } catch {
        // If it's already a relative path, use as-is
        finalRedirect = redirectTo;
      }
    }
    const emailRedirectTo = `${config.NEXT_PUBLIC_APP_URL}/auth/callback?redirect=${encodeURIComponent(finalRedirect)}`;

    // Use anon key client to call signInWithOtp which SENDS the email
    // admin.generateLink only generates the link but does NOT send email
    // IMPORTANT: Enforce PKCE flow so Supabase redirects with ?code= instead of #access_token=
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: { flowType: 'pkce' },
    });
    logger.info('Calling signInWithOtp', {
      traceId,
      email,
      emailRedirectTo,
      supabaseUrl: config.SUPABASE_URL,
      anonKeyPresent: !!config.SUPABASE_ANON_KEY && config.SUPABASE_ANON_KEY !== 'test-anon-key',
    });

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    });

    // Log the FULL response — Supabase often returns { data: {}, error: null }
    // even when the email is NOT actually delivered (silent failure)
    logger.info('signInWithOtp full response', {
      traceId,
      email,
      otpData: JSON.stringify(data),
      otpError: error ? JSON.stringify(error) : null,
      hasError: !!error,
    });

    if (error) {
      logger.error('Supabase magic link error', {
        error: new Error(error.message),
        traceId,
        email,
        errorStatus: error.status,
        errorName: error.name,
      });
      return NextResponse.json(
        { error: `Failed to send magic link: ${error.message}` },
        { status: 500, headers: rateLimitHeaders(remaining, reset) }
      );
    }

    // WARNING: Supabase returns success even if email is NOT delivered.
    // This happens when:
    // 1. Built-in SMTP rate limit exceeded (~3-4/hour)
    // 2. No custom SMTP configured
    // 3. Email provider silently rejects
    logger.info('Magic link OTP call succeeded (does NOT guarantee email delivery)', {
      traceId,
      email,
      warning: 'Supabase returns 200 even if email is not delivered. Check Supabase Dashboard → Auth → SMTP settings.',
    });

    return NextResponse.json(
      { success: true, message: 'Magic link sent. Check your email.' },
      { headers: rateLimitHeaders(remaining, reset) }
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error('Magic link endpoint error', { error, traceId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: rateLimitHeaders(remaining, reset) }
    );
  }
}