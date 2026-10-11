import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';
import { scheduleService } from '@/lib/services/ScheduleService';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { logger } from '@/lib/logger';
import type { ScheduleStrategy } from '@/lib/repositories/interfaces/IPostRepository';
import type { PlatformType } from '@/lib/ai/PostAdapter';

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

      // Validate all post times are within 7 days
      for (const post of posts) {
        if (typeof post.day !== 'number' || post.day < 0 || post.day > 6) {
          return NextResponse.json({ error: `Invalid day value: ${post.day}` }, { status: 400 });
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
          platforms: (p.platforms ?? []).map((pf: any) => ({
            platform: pf.platform as PlatformType,
            content: pf.content,
            hashtags: pf.hashtags ?? [],
            firstCommentHint: pf.firstCommentHint,
            autoFirstComment: pf.autoFirstComment,
            mediaUrls: pf.mediaUrls,
            schedulingOffsetMinutes: pf.schedulingOffsetMinutes ?? 0,
          })),
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

    const result = await scheduleService.schedulePost({
      workspaceId,
      profileId: profile.id,
      baseScheduledAt: scheduledAt,
      strategy: (singlePost.strategy ?? 'simultaneous') as ScheduleStrategy,
      platforms: (singlePost.platforms ?? []).map((p: any) => ({
        platform: p.platform as PlatformType,
        content: p.content,
        hashtags: p.hashtags ?? [],
        firstCommentHint: p.firstCommentHint,
        autoFirstComment: p.autoFirstComment,
        mediaUrls: p.mediaUrls,
        schedulingOffsetMinutes: p.schedulingOffsetMinutes ?? 0,
      })),
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
