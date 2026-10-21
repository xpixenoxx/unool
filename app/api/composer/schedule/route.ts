import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';
import { scheduleService } from '@/lib/services/ScheduleService';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { logger } from '@/lib/logger';
import type { ScheduleStrategy } from '@/lib/repositories/interfaces/IPostRepository';
import { PlatformType, PLATFORM_SPECS } from '@/lib/ai/PostAdapter';
import { ContentGuard } from '@/lib/ai/ContentGuard';

const profileRepository = new SupabaseProfileRepository();

export const maxDuration = 120;

/**
 * POST /api/composer/schedule
 * Accepts the reviewed/approved arc and creates all scheduled posts + QStash tasks.
 */
export async function POST(request: NextRequest) {
  return planEnforcement.scheduling(request, async (request) => {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { workspaceId } = auth;

    const body = await request.json();
    const {
      arcTitle,
      coreStory,
      storyType,
      weekStartDate,       // ISO string "2026-10-12"
      userTimezone,        // e.g. "Asia/Kolkata"
      posts,               // Array of posts from the arc review screen
      scheduleMode,        // 'arc' | 'single'
    } = body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'No posts provided to schedule' }, { status: 400 });
    }

    const profile = await profileRepository.findByWorkspaceId(workspaceId);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please create a profile first.' },
        { status: 400 }
      );
    }

    if (scheduleMode === 'arc' || (arcTitle && coreStory && weekStartDate)) {
      // ── Full Arc Scheduling ──────────────────────────────────────────────
      if (!weekStartDate) {
        return NextResponse.json({ error: 'weekStartDate required for arc scheduling' }, { status: 400 });
      }

      const weekStart = new Date(weekStartDate);
      if (isNaN(weekStart.getTime())) {
        return NextResponse.json({ error: 'Invalid weekStartDate' }, { status: 400 });
      }

      // Validate all post times are within 7 days and guard post content
      for (const post of posts) {
        if (typeof post.day !== 'number' || post.day < 0 || post.day > 6) {
          return NextResponse.json({ error: `Invalid day value: ${post.day}` }, { status: 400 });
        }
        for (const pf of (post.platforms ?? [])) {
          if (!pf.content) continue;
          const validation = ContentGuard.validateForBroadcast(pf.content, { route: 'composer/schedule/arc' });
          if (!validation.safe) {
            return NextResponse.json(ContentGuard.blockedResponse(validation.violation), { status: 400 });
          }
        }
      }

      const result = await scheduleService.scheduleArc({
        workspaceId,
        profileId: profile.id,
        arcTitle: arcTitle || 'My Weekly Arc',
        coreStory: coreStory || '',
        storyType: storyType || 'shipped',
        weekStartDate: weekStart,
        userTimezone: userTimezone || 'UTC',
        posts: posts.map((p: any) => ({
          day: p.day,
          scheduledHour: p.scheduledHour ?? 9,
          scheduledMinute: p.scheduledMinute ?? 0,
          strategy: (p.strategy ?? 'cascading') as ScheduleStrategy,
          platforms: (p.platforms ?? []).map((pf: any) => {
            const rawContent = pf.content || '';
            const validation = ContentGuard.validateForBroadcast(rawContent, { route: 'composer/schedule/arc' });
            let sanitized = ContentGuard.sanitizeOutput(validation.safe ? validation.sanitizedContent : rawContent);
            const spec = PLATFORM_SPECS[pf.platform as PlatformType];
            const maxChars = spec?.maxChars ?? 3000;
            if (sanitized.length > maxChars) {
              sanitized = sanitized.slice(0, maxChars);
            }
            return {
              platform: pf.platform as PlatformType,
              content: sanitized,
              hashtags: ContentGuard.filterHashtags(pf.hashtags ?? []),
              firstCommentHint: pf.firstCommentHint,
              mediaUrls: (pf.mediaUrls && pf.mediaUrls.length > 0)
                ? pf.mediaUrls.map((m: any) => typeof m === 'string' ? { url: m, type: 'image' } : { url: m.url, type: m.type || (/\.(mp4|mov|webm)$/i.test(m.url) ? 'video' : /\.(pdf|ppt|pptx)$/i.test(m.url) ? 'document' : 'image') })
                : (p.imageUrls && p.imageUrls.length > 0
                    ? p.imageUrls.map((u: string) => ({
                        url: u,
                        type: /\.(mp4|mov|webm)$/i.test(u) ? 'video' : /\.(pdf|ppt|pptx)$/i.test(u) ? 'document' : 'image',
                      }))
                    : (p.imageUrl ? [{
                        url: p.imageUrl,
                        type: /\.(mp4|mov|webm)$/i.test(p.imageUrl) ? 'video' : /\.(pdf|ppt|pptx)$/i.test(p.imageUrl) ? 'document' : 'image',
                      }] : [])),
              schedulingOffsetMinutes: pf.schedulingOffsetMinutes ?? 0,
            };
          }),
          arcBeat: p.arcBeat ?? '',
        })),
      });

      logger.info('Arc scheduled successfully', {
        arcId: result.arc.id,
        postCount: result.posts.length,
        workspaceId,
      });

      return NextResponse.json({
        success: true,
        arcId: result.arc.id,
        scheduledPosts: result.posts.map(p => ({
          postId: p.postId,
          scheduledAt: p.scheduledAt.toISOString(),
          platforms: p.variantResults.map(v => ({
            variantId: v.variantId,
            platform: v.platform,
            scheduledAt: v.scheduledAt.toISOString(),
          })),
        })),
      });
    }

    // ── Single Post Scheduling ─────────────────────────────────────────────
    const singlePost = posts[0];
    if (!singlePost.scheduledAt) {
      return NextResponse.json({ error: 'scheduledAt is required for single post scheduling' }, { status: 400 });
    }

    const scheduledAt = new Date(singlePost.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt timestamp' }, { status: 400 });
    }

    if (scheduledAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'scheduledAt must be in the future' }, { status: 400 });
    }

    for (const p of (singlePost.platforms ?? [])) {
      if (!p.content) continue;
      const validation = ContentGuard.validateForBroadcast(p.content, { route: 'composer/schedule/single' });
      if (!validation.safe) {
        return NextResponse.json(ContentGuard.blockedResponse(validation.violation), { status: 400 });
      }
    }

    const result = await scheduleService.schedulePost({
      workspaceId,
      profileId: profile.id,
      baseScheduledAt: scheduledAt,
      strategy: (singlePost.strategy ?? 'simultaneous') as ScheduleStrategy,
      platforms: (singlePost.platforms ?? []).map((p: any) => {
        const rawContent = p.content || '';
        const validation = ContentGuard.validateForBroadcast(rawContent, { route: 'composer/schedule/single' });
        let sanitized = ContentGuard.sanitizeOutput(validation.safe ? validation.sanitizedContent : rawContent);
        const spec = PLATFORM_SPECS[p.platform as PlatformType];
        const maxChars = spec?.maxChars ?? 3000;
        if (sanitized.length > maxChars) {
          sanitized = sanitized.slice(0, maxChars);
        }
        return {
          platform: p.platform as PlatformType,
          content: sanitized,
          hashtags: ContentGuard.filterHashtags(p.hashtags ?? []),
          firstCommentHint: p.firstCommentHint,
          autoFirstComment: p.autoFirstComment,
          mediaUrls: p.mediaUrls,
          schedulingOffsetMinutes: p.schedulingOffsetMinutes ?? 0,
        };
      }),
    });

    return NextResponse.json({
      success: true,
      postId: result.postId,
      scheduledAt: result.scheduledAt.toISOString(),
      platforms: result.variantResults.map(v => ({
        variantId: v.variantId,
        platform: v.platform,
        scheduledAt: v.scheduledAt.toISOString(),
      })),
    });
  });
}
