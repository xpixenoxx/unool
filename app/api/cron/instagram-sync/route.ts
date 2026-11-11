import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;



/**
 * GET /api/cron/instagram-sync
 * Fallback comment polling path when Meta webhooks are delayed or dropped.
 * Triggered daily via Vercel Cron (compliant with Hobby plan restrictions),
 * or sub-daily via external cron (cron-job.org / QStash) using CRON_SECRET.
 * Finds all workspaces with Instagram automation enabled and calls the sync
 * route for each.
 */
export async function GET(request: NextRequest) {
  // CRON_SECRET must be set — fail closed if missing
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error('CRON_SECRET environment variable is not set — rejecting instagram-sync cron request');
    return NextResponse.json({ error: 'Server misconfigured: CRON_SECRET not set' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all workspaces that have Instagram automation enabled
    const { data: configs, error } = await supabaseAdmin
      .from('instagram_automation_config')
      .select('workspace_id')
      .eq('enabled', true);

    if (error) {
      logger.error('instagram-sync cron: failed to fetch enabled workspaces', { error });
      return NextResponse.json({ ok: false, error: 'DB error' }, { status: 500 });
    }

    if (!configs || configs.length === 0) {
      logger.info('instagram-sync cron: no workspaces with automation enabled');
      return NextResponse.json({ ok: true, synced: 0 });
    }

    const appUrl = config.NEXT_PUBLIC_APP_URL || 'https://unool.com';
    const results: Array<{ workspaceId: string; ok: boolean; message?: string }> = [];

    for (const row of configs) {
      const workspaceId = row.workspace_id as string;
      try {
        const res = await fetch(`${appUrl}/api/instagram/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cronSecret}`,
          },
          body: JSON.stringify({ workspaceId }),
        });
        const data = await res.json().catch(() => ({}));
        results.push({ workspaceId, ok: !!data.ok, message: data.message });
        logger.info('instagram-sync cron: synced workspace', {
          workspaceId,
          repliesPosted: data.repliesPosted,
          newComments: data.newCommentsProcessed,
        });
      } catch (err) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        logger.error('instagram-sync cron: sync failed for workspace', { workspaceId, error: errObj });
        results.push({ workspaceId, ok: false, message: errObj.message });
      }
    }

    // Drain any deferred/queued jobs in instagram_outbound_jobs that are within Meta's 7-day window
    let drainedJobs = 0;
    try {
      const minWindowIso = new Date(Date.now() - (6 * 24 + 23) * 60 * 60 * 1000).toISOString();
      const { data: queuedJobs } = await supabaseAdmin
        .from('instagram_outbound_jobs')
        .select('*')
        .eq('status', 'queued')
        .gte('created_at', minWindowIso)
        .order('created_at', { ascending: true })
        .limit(25);

      if (queuedJobs && queuedJobs.length > 0) {
        const { queueService } = await import('@/lib/services/QueueService');
        for (const job of queuedJobs) {
          const payload = (job.payload || {}) as Record<string, unknown>;
          const jobParams = {
            jobId: (payload.jobId as string) || `ig-${job.job_type}-${job.target_id}`,
            jobType: job.job_type as 'comment_reply' | 'dm_reply',
            workspaceId: job.workspace_id as string,
            connectionId: (payload.connectionId as string) || '',
            commentId: (payload.commentId as string) || (job.job_type === 'comment_reply' ? job.target_id : undefined),
            mediaId: payload.mediaId as string | undefined,
            commentText: payload.commentText as string | undefined,
            commenterUsername: payload.commenterUsername as string | undefined,
            commentTimestamp: (payload.commentTimestamp as string) || job.created_at,
            messageId: (payload.messageId as string) || (job.job_type === 'dm_reply' ? job.target_id : undefined),
            senderId: payload.senderId as string | undefined,
            senderUsername: payload.senderUsername as string | undefined,
            dmText: payload.dmText as string | undefined,
          };

          if (queueService.isAvailable()) {
            const msgId = await queueService.enqueueInstagramOutboundTask(jobParams);
            if (msgId) drainedJobs++;
          } else {
            const res = await fetch(`${appUrl}/api/webhooks/qstash/instagram-outbound`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(jobParams),
            });
            if (res.ok) drainedJobs++;
          }
        }
      }
    } catch (drainErr) {
      logger.warn('instagram-sync cron: failed to drain queued outbound jobs', { error: drainErr });
    }

    return NextResponse.json({ ok: true, synced: results.length, drainedJobs, results });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('instagram-sync cron: unexpected error', { error: err });
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
