import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';

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

    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectTo || `${config.NEXT_PUBLIC_APP_URL}/auth/callback?redirect=/dashboard`,
      },
    });

    if (error) {
      logger.error('Supabase magic link error', { error, traceId, email });
      return NextResponse.json(
        { error: 'Failed to send magic link. Please try again.' },
        { status: 500, headers: rateLimitHeaders(remaining, reset) }
      );
    }

    logger.info('Magic link sent', { traceId, email });
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