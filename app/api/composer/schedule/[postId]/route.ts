import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { scheduleService } from '@/lib/services/ScheduleService';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { logger } from '@/lib/logger';

const postRepository = new SupabasePostRepository();

/**
 * GET /api/composer/schedule/[postId]
 * Returns a post and its variants shaped as a CanvasPost.
 */
export async function GET(
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
    const post = await postRepository.findById(postId);
    if (!post || post.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Post not found or access denied' }, { status: 404 });
    }

    const variants = await postRepository.findVariantsByPostId(postId);
    const effectiveStatus = (post.status === 'published' || variants.some(v => v.status === 'published'))
      ? 'published'
      : post.status;

    const canvasPost = {
      postId: post.id,
      content: post.content,
      status: effectiveStatus,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      scheduleStrategy: post.scheduleStrategy,
      arcId: post.arcId,
      createdAt: post.createdAt.toISOString(),
      platforms: variants.map(v => ({
        variantId: v.id,
        platform: v.platform,
        content: v.adaptedContent,
        status: v.status,
        scheduledAt: v.scheduledAt?.toISOString() ?? null,
        autoFirstComment: v.autoFirstComment,
        firstCommentHint: v.firstCommentHint,
        error: v.error,
        mediaUrls: v.mediaUrls ?? [],
        hashtags: v.hashtagStrategy ?? [],
      })),
    };

    return NextResponse.json({ success: true, post: canvasPost });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get post for canvas', { postId, error: err });
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 });
  }
}

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
    const post = await postRepository.findById(postId);
    if (!post || post.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Post not found or access denied' }, { status: 404 });
    }

    const variants = await postRepository.findVariantsByPostId(postId);
    if (post.status === 'published' || variants.some(v => v.status === 'published')) {
      return NextResponse.json(
        { error: 'Cannot delete or cancel a post that has already been published' },
        { status: 400 }
      );
    }

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
      { error: 'Cannot schedule posts for past dates or past time periods' },
      { status: 400 }
    );
  }

  // Enforce ongoing week and upcoming week restriction
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(mondayThisWeek.getDate() + diffToMonday);
  mondayThisWeek.setHours(0, 0, 0, 0);

  // End of upcoming week is Sunday 23:59:59.999 (14 days from Monday 00:00:00 - 1ms)
  const endOfUpcomingWeek = new Date(mondayThisWeek.getTime() + 14 * 24 * 60 * 60 * 1000 - 1);

  if (newTime.getTime() > endOfUpcomingWeek.getTime()) {
    return NextResponse.json(
      { error: 'Posts can only be rescheduled for the ongoing week and the upcoming week' },
      { status: 400 }
    );
  }

  try {
    const post = await postRepository.findById(postId);
    if (!post || post.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Post not found or access denied' }, { status: 404 });
    }

    const variants = await postRepository.findVariantsByPostId(postId);
    if (post.status === 'published' || variants.some(v => v.status === 'published')) {
      return NextResponse.json(
        { error: 'Cannot reschedule a post that has already been published' },
        { status: 400 }
      );
    }

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
