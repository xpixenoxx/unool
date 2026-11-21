import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { refreshPlatformConnectionToken } from '@/lib/services/automation/tokenRefresh';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function isAuthorizedCronRequest(request: NextRequest): Promise<{
  authorized: boolean;
  misconfigured?: boolean;
}> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true };
  }

  const qstashSignature = request.headers.get('upstash-signature');
  if (qstashSignature && config.QSTASH_CURRENT_SIGNING_KEY && config.QSTASH_NEXT_SIGNING_KEY) {
    try {
      const receiver = new Receiver({
        currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
      });
      const rawBody = await request.clone().text();
      const configuredUrl = `${config.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '')}/api/cron/refresh-tokens`;
      let isValid = false;
      try {
        isValid = await receiver.verify({
          signature: qstashSignature,
          body: rawBody,
          url: configuredUrl,
          clockTolerance: 300,
        });
      } catch {
        isValid = false;
      }
      if (!isValid && request.url && request.url !== configuredUrl) {
        try {
          isValid = await receiver.verify({
            signature: qstashSignature,
            body: rawBody,
            url: request.url,
            clockTolerance: 300,
          });
        } catch {
          isValid = false;
        }
      }
      if (isValid) {
        return { authorized: true };
      }
    } catch (err) {
      logger.warn('Failed to verify QStash signature on refresh-tokens cron route', { error: err });
    }
  }

  if (!cronSecret && (!config.QSTASH_CURRENT_SIGNING_KEY || !config.QSTASH_NEXT_SIGNING_KEY)) {
    return { authorized: false, misconfigured: true };
  }

  return { authorized: false };
}

/**
 * GET/POST /api/cron/refresh-tokens
 * Daily health check for expiring platform OAuth tokens (bounded to <=15 rows per run
 * so execution stays well inside Cloudflare Workers Free 50-subrequest limit).
 */
async function handleRefreshTokens(request: NextRequest) {
  const authCheck = await isAuthorizedCronRequest(request);
  if (authCheck.misconfigured) {
    return NextResponse.json({ error: 'Server misconfigured: CRON_SECRET not set' }, { status: 500 });
  }
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const threshold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('status', 'connected')
      .not('expires_at', 'is', null)
      .lte('expires_at', threshold)
      .neq('refresh_token_encrypted', '')
      .not('refresh_token_encrypted', 'is', null)
      .order('expires_at', { ascending: true })
      .limit(15);

    if (error) {
      logger.error('Failed to query expiring platform tokens', { error });
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    const candidates = rows || [];
    let refreshed = 0;
    let failed = 0;

    for (const row of candidates) {
      const outcome = await refreshPlatformConnectionToken(row, {
        failureStatus: 'expired',
        sendExpiryAlert: true,
      });
      if (outcome.ok) refreshed++;
      else failed++;
    }

    logger.info('Completed refresh-tokens cron run', {
      processed: candidates.length,
      refreshed,
      failed,
    });

    return NextResponse.json({
      processed: candidates.length,
      refreshed,
      failed,
    });
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    logger.error('refresh-tokens cron job failed', { error: errorObj });
    return NextResponse.json({ error: errorObj.message }, { status: 500 });
  }
}

export const GET = handleRefreshTokens;
export const POST = handleRefreshTokens;
