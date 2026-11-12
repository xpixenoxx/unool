import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { scheduleService } from '@/lib/services/ScheduleService';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function isAuthorizedCronRequest(request: NextRequest): Promise<{
  authorized: boolean;
  misconfigured?: boolean;
}> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  // 1. Standard Bearer CRON_SECRET verification (Vercel Cron / manual trigger)
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true };
  }

  // 2. Upstash QStash Cron Schedule signature verification
  const qstashSignature = request.headers.get('upstash-signature');
  if (qstashSignature && config.QSTASH_CURRENT_SIGNING_KEY && config.QSTASH_NEXT_SIGNING_KEY) {
    try {
      const receiver = new Receiver({
        currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
      });
      const rawBody = await request.clone().text();
      const configuredUrl = `${config.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '')}/api/cron/publish-scheduled`;
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
      logger.warn('Failed to verify QStash signature on cron route', { error: err });
    }
  }

  if (!cronSecret && (!config.QSTASH_CURRENT_SIGNING_KEY || !config.QSTASH_NEXT_SIGNING_KEY)) {
    return { authorized: false, misconfigured: true };
  }

  return { authorized: false };
}

/**
 * GET/POST /api/cron/publish-scheduled
 * Scans for any scheduled posts whose scheduled_at timestamp has passed and
 * automatically dispatches and publishes them.
 * Triggered automatically by Vercel Cron, Upstash QStash Schedule, or on-demand self-healing.
 */
async function handlePublishScheduled(request: NextRequest) {
  const authCheck = await isAuthorizedCronRequest(request);
  if (authCheck.misconfigured) {
    logger.error('CRON_SECRET environment variable is not set — rejecting cron request');
    return NextResponse.json(
      { error: 'Server misconfigured: CRON_SECRET not set' },
      { status: 500 }
    );
  }
  if (!authCheck.authorized) {
    logger.warn('Cron request rejected: invalid or missing authorization header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || undefined;

  try {
    logger.info('Starting publish-scheduled cron job', { workspaceId });
    const result = await scheduleService.processDueScheduledPosts(workspaceId);

    logger.info('Finished publish-scheduled cron job', {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
    });

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    logger.error('publish-scheduled cron job failed with error', { error: errorObj });
    return NextResponse.json(
      { ok: false, error: errorObj.message },
      { status: 500 }
    );
  }
}

export const GET = handlePublishScheduled;
export const POST = handlePublishScheduled;
