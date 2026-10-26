import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { scheduleService } from '@/lib/services/ScheduleService';
import { logger } from '@/lib/logger';

/**
 * GET /api/composer/schedule/week
 * Returns all scheduled posts for the current 7-day window.
 * Query params: weekStart (ISO date string, defaults to this Monday)
 */
export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { workspaceId } = auth;

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get('weekStart');

  let weekStart: Date;
  if (weekStartParam) {
    // If param is YYYY-MM-DD or contains date prefix, extract date components directly
    const dateMatch = weekStartParam.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const [, y, m, d] = dateMatch.map(Number);
      weekStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    } else {
      weekStart = new Date(weekStartParam);
      if (isNaN(weekStart.getTime())) {
        return NextResponse.json({ error: 'Invalid weekStart date' }, { status: 400 });
      }
      weekStart.setUTCHours(0, 0, 0, 0);
    }
  } else {
    // Default to this Monday (UTC)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon...
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToMonday, 0, 0, 0, 0));
  }

  try {
    const canvas = await scheduleService.getWeekCanvas(workspaceId, weekStart);

    // Look up platform_posts for published variants to get live platform URLs
    const allVariants = canvas.flatMap(({ variants }) => variants);
    const publishedVariantIds = allVariants
      .filter(v => v.status === 'published')
      .map(v => v.id);

    const variantPlatformUrls = new Map<string, string>();
    if (publishedVariantIds.length > 0) {
      try {
        const { SupabasePlatformRepository } = await import('@/lib/repositories/supabase/SupabasePlatformRepository');
        const platformRepo = new SupabasePlatformRepository();
        const platformPosts = await platformRepo.findPlatformPostsByVariantIds(publishedVariantIds);
        for (const pp of platformPosts) {
          if (pp.platformUrl) {
            variantPlatformUrls.set(pp.postVariantId, pp.platformUrl);
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch platform_posts for week canvas', { error: String(err) });
      }
    }

    // Shape the response for the frontend
    const posts = canvas.map(({ post, variants }) => {
      const effectiveStatus = (post.status === 'published' || variants.some(v => v.status === 'published'))
        ? 'published'
        : post.status;

      return {
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
          platformUrl: variantPlatformUrls.get(v.id) || null,
          platformPostId: v.platformPostId || null,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      weekStart: weekStart.toISOString(),
      weekEnd: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      posts,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to fetch week canvas', { workspaceId, error: err });
    return NextResponse.json({ error: 'Failed to load schedule' }, { status: 500 });
  }
}
