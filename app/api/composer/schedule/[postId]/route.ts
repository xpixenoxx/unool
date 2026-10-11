import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { scheduleService } from '@/lib/services/ScheduleService';
import { logger } from '@/lib/logger';

/**
 * DELETE /api/composer/schedule/[postId]
 * Cancels a scheduled post and its QStash tasks. Resets to draft.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await params;
  const { workspaceId } = auth;

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  try {
    await scheduleService.cancelScheduledPost(postId, workspaceId);
    logger.info('Scheduled post cancelled via API', { postId, workspaceId });
    return NextResponse.json({ success: true, postId, status: 'cancelled' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to cancel scheduled post', { postId, error: err });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/composer/schedule/[postId]
 * Reschedules a post to a new time. Cancels old QStash tasks and re-enqueues.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await params;
  const { workspaceId } = auth;
  const body = await request.json();
  const { newScheduledAt } = body;

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  if (!newScheduledAt) {
    return NextResponse.json({ error: 'newScheduledAt is required' }, { status: 400 });
  }

  const newTime = new Date(newScheduledAt);
  if (isNaN(newTime.getTime()) || newTime.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: 'newScheduledAt must be a valid future timestamp' },
      { status: 400 }
    );
  }

  try {
    await scheduleService.reschedulePost(postId, workspaceId, newTime);
    logger.info('Post rescheduled via API', { postId, newScheduledAt: newTime.toISOString(), workspaceId });
    return NextResponse.json({
      success: true,
      postId,
      newScheduledAt: newTime.toISOString(),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to reschedule post', { postId, error: err });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
