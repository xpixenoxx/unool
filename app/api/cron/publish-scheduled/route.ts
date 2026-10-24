import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '@/lib/services/ScheduleService';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET/POST /api/cron/publish-scheduled
 * Scans for any scheduled posts whose scheduled_at timestamp has passed and
 * automatically dispatches and publishes them.
 * Triggered automatically by Vercel Cron or on-demand by client self-healing.
 */
async function handlePublishScheduled(request: NextRequest) {
  // Check CRON_SECRET if configured
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
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
