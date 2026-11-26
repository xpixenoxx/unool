import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { loadTodayIntelligence } from '@/lib/services/automation/todayIntelligence';
import { queueService } from '@/lib/services/QueueService';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/automation/intelligence?workspaceId=xxx
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const intelligence = await loadTodayIntelligence(workspaceId);
    return NextResponse.json(intelligence);
  } catch (error) {
    logger.error('GET /api/automation/intelligence error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/automation/intelligence — 1-click Dead-Letter Queue Replay
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const workspaceId = body.workspaceId || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (body.action !== 'replay_dead_letters') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const { data: failedJobs } = await supabaseAdmin
      .from('instagram_outbound_jobs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'needs_review')
      .order('updated_at', { ascending: false })
      .limit(25);

    const jobs = Array.isArray(failedJobs) ? failedJobs : [];
    let replayed = 0;

    for (const job of jobs) {
      const payload = (job.payload || {}) as Record<string, any>;
      await supabaseAdmin
        .from('instagram_outbound_jobs')
        .update({
          status: 'queued',
          retry_count: 0,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (queueService.isAvailable()) {
        const msgId = await queueService.enqueueInstagramOutboundTask({
          jobId: `replay_${job.id}_${Date.now()}`,
          jobType: job.job_type,
          workspaceId,
          connectionId: job.connection_id || payload.connectionId || '',
          commentId: payload.commentId || payload.commentEvent?.commentId || (job.job_type === 'comment_reply' ? job.target_id : undefined),
          mediaId: payload.mediaId || payload.commentEvent?.mediaId,
          commentText: payload.commentText || payload.commentEvent?.text,
          commenterUsername: payload.commenterUsername || payload.commentEvent?.username,
          commentTimestamp: payload.commentTimestamp || payload.commentEvent?.timestamp,
          messageId: payload.messageId || payload.dmEvent?.messageId || (job.job_type === 'dm_reply' ? job.target_id : undefined),
          senderId: payload.senderId || payload.dmEvent?.senderId,
          senderUsername: payload.senderUsername || payload.dmEvent?.senderUsername,
          dmText: payload.dmText || payload.dmEvent?.text,
        });
        if (msgId) replayed++;
      } else {
        replayed++;
      }
    }

    return NextResponse.json({ success: true, totalFound: jobs.length, replayed });
  } catch (error) {
    logger.error('POST /api/automation/intelligence error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
