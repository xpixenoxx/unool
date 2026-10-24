import { logger } from '@/lib/logger';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { queueService } from '@/lib/services/QueueService';
import { publishService } from '@/lib/services/PublishService';
import type {
  Post,
  PostVariant,
  ContentArc,
  StoryType,
  ScheduleStrategy,
} from '@/lib/repositories/interfaces/IPostRepository';
import type { PlatformType } from '@/lib/ai/PostAdapter';
import { optimizeMediaForPlatform } from '@/lib/media/ImageOptimizer';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const postRepository = new SupabasePostRepository();

// ── Types ─────────────────────────────────────────────────────────────────

export interface SchedulePostInput {
  workspaceId: string;
  profileId: string;
  baseScheduledAt: Date;     // The "anchor" time for this post
  strategy: ScheduleStrategy;
  platforms: Array<{
    platform: PlatformType;
    content: string;
    hashtags: string[];
    firstCommentHint?: string;
    autoFirstComment?: string;
    mediaUrls?: Array<{ url: string; type: 'image' | 'video' }>;
    schedulingOffsetMinutes?: number;  // For cascading: offset from base time
  }>;
  arcId?: string;            // Link post to a content arc
  postId?: string;           // Reuse existing post if scheduling from draft
}

export interface ScheduleArcInput {
  workspaceId: string;
  profileId: string;
  arcTitle: string;
  coreStory: string;
  storyType: StoryType;
  weekStartDate: Date;       // The Monday of the target week
  posts: Array<{
    day: number;             // 0 = Monday, 6 = Sunday
    scheduledHour: number;   // Local hour
    scheduledMinute: number;
    strategy: ScheduleStrategy;
    platforms: SchedulePostInput['platforms'];
    arcBeat: string;
  }>;
  userTimezone: string;      // e.g. "Asia/Kolkata"
}

export interface ScheduleResult {
  postId: string;
  scheduledAt: Date;
  variantResults: Array<{
    variantId: string;
    platform: string;
    scheduledAt: Date;
    qstashMessageId: string | null;
  }>;
}

export interface ScheduleArcResult {
  arc: ContentArc;
  posts: ScheduleResult[];
}

// ── Helper: compute scheduled timestamp ──────────────────────────────────

function computeScheduledAt(
  weekStart: Date,
  dayOffset: number,
  hour: number,
  minute: number,
  timezone: string
): Date {
  try {
    // Extract base year, month, day in UTC from the ISO representation of weekStart
    const isoDate = weekStart.toISOString().slice(0, 10);
    const [startY, startM, startD] = isoDate.split('-').map(Number);

    // Calculate the target day for this offset (dayOffset: 0 = Mon, 1 = Tue, ..., 6 = Sun)
    const targetDayUtcMs = Date.UTC(startY, startM - 1, startD + dayOffset, 0, 0, 0);
    const targetDayDate = new Date(targetDayUtcMs);
    const targetYear = targetDayDate.getUTCFullYear();
    const targetMonth = targetDayDate.getUTCMonth() + 1;
    const targetDay = targetDayDate.getUTCDate();

    // Target timestamp as UTC milliseconds
    const targetLocalMs = Date.UTC(targetYear, targetMonth - 1, targetDay, hour, minute, 0);

    const getLocalMs = (date: Date): number => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(date);
      const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
      let h = parseInt(p.hour, 10);
      if (h === 24) h = 0;
      return Date.UTC(
        parseInt(p.year, 10),
        parseInt(p.month, 10) - 1,
        parseInt(p.day, 10),
        h,
        parseInt(p.minute, 10),
        parseInt(p.second, 10)
      );
    };

    // First approximation: treat targetLocalMs as UTC and measure offset
    const initialGuess = new Date(targetLocalMs);
    const localMsAtGuess = getLocalMs(initialGuess);
    const offset = localMsAtGuess - targetLocalMs;
    const correctedMs = targetLocalMs - offset;

    // Refinement step to guarantee exact match across daylight saving boundaries
    const refinedLocalMs = getLocalMs(new Date(correctedMs));
    const refinedOffset = refinedLocalMs - targetLocalMs;
    return new Date(correctedMs - refinedOffset);
  } catch {
    // Fallback: simple UTC calculation
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + dayOffset);
    d.setUTCHours(hour, minute, 0, 0);
    return d;
  }
}

// ── Main ScheduleService class ────────────────────────────────────────────

export class ScheduleService {
  /**
   * Schedules a single post (with multiple platform variants).
   * If strategy is 'cascading', each variant fires at baseScheduledAt + offsetMinutes.
   * If strategy is 'simultaneous', all variants fire at exactly baseScheduledAt.
   */
  async schedulePost(input: SchedulePostInput): Promise<ScheduleResult> {
    // 1. Create or update the parent post record
    let post: Post | null = null;
    if (input.postId) {
      const existing = await postRepository.findById(input.postId);
      if (existing && existing.workspaceId === input.workspaceId) {
        post = await postRepository.update(existing.id, {
          content: input.platforms[0]?.content ?? existing.content,
          status: 'scheduled',
          scheduledAt: input.baseScheduledAt,
          scheduleStrategy: input.strategy,
          arcId: input.arcId ?? existing.arcId,
        });
        const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
        await admin.from('post_variants').delete().eq('post_id', existing.id);
      }
    }

    if (!post) {
      post = await postRepository.create({
        profileId: input.profileId,
        workspaceId: input.workspaceId,
        content: input.platforms[0]?.content ?? '',
        adaptationPromptVersion: input.arcId ? 'schedule-engine-v1' : 'schedule-engine-v1',
      });
    }

    const variantResults: ScheduleResult['variantResults'] = [];

    // 2. For each platform variant, create the variant and enqueue
    for (const platformInput of input.platforms) {
      const variantScheduledAt = input.strategy === 'cascading' && platformInput.schedulingOffsetMinutes
        ? new Date(input.baseScheduledAt.getTime() + platformInput.schedulingOffsetMinutes * 60_000)
        : input.baseScheduledAt;

      const normalizedMedia = (platformInput.mediaUrls ?? []).filter(m => Boolean(m.url));
      const finalMedia = await optimizeMediaForPlatform(normalizedMedia, platformInput.platform);

      const variant = await postRepository.createVariant({
        postId: post.id,
        platform: platformInput.platform,
        adaptedContent: platformInput.content,
        mediaUrls: finalMedia,
        characterCount: platformInput.content.length,
        hashtagStrategy: platformInput.hashtags,
        firstCommentHint: platformInput.firstCommentHint,
      });

      // 3. Enqueue the delayed QStash task
      const qstashMessageId = await queueService.enqueueScheduledPublishTask({
        postId: post.id,
        workspaceId: input.workspaceId,
        variantId: input.strategy === 'cascading' ? variant.id : undefined,
        scheduledAt: variantScheduledAt,
        autoFirstComment: platformInput.autoFirstComment,
      });

      // 4. Update variant with scheduled state and QStash messageId
      await postRepository.updateVariant(variant.id, {
        status: 'scheduled',
        scheduledAt: variantScheduledAt,
        qstashMessageId,
        autoFirstComment: platformInput.autoFirstComment,
      });

      variantResults.push({
        variantId: variant.id,
        platform: platformInput.platform,
        scheduledAt: variantScheduledAt,
        qstashMessageId,
      });
    }

    // 5. For simultaneous mode: enqueue ONE combined task for all variants
    if (input.strategy === 'simultaneous' && input.platforms.length > 0) {
      const combinedMessageId = await queueService.enqueueScheduledPublishTask({
        postId: post.id,
        workspaceId: input.workspaceId,
        scheduledAt: input.baseScheduledAt,
      });
      await postRepository.update(post.id, {
        status: 'scheduled',
        scheduledAt: input.baseScheduledAt,
        qstashMessageId: combinedMessageId,
        scheduleStrategy: 'simultaneous',
        arcId: input.arcId,
      });
    } else {
      // Cascading: update post status without a single combined message
      await postRepository.update(post.id, {
        status: 'scheduled',
        scheduledAt: input.baseScheduledAt,
        scheduleStrategy: 'cascading',
        arcId: input.arcId,
      });
    }

    logger.info('Post scheduled successfully', {
      postId: post.id,
      strategy: input.strategy,
      baseScheduledAt: input.baseScheduledAt.toISOString(),
      variantCount: variantResults.length,
    });

    return { postId: post.id, scheduledAt: input.baseScheduledAt, variantResults };
  }

  /**
   * Schedules a full 7-day content arc.
   * Creates a content_arc record and links all posts to it.
   */
  async scheduleArc(input: ScheduleArcInput): Promise<ScheduleArcResult> {
    // 1. Create the content arc record
    const endDate = new Date(input.weekStartDate);
    endDate.setDate(endDate.getDate() + 6);

    const arc = await postRepository.createContentArc({
      workspaceId: input.workspaceId,
      profileId: input.profileId,
      title: input.arcTitle,
      coreStory: input.coreStory,
      storyType: input.storyType,
      startDate: input.weekStartDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });

    // 2. Schedule each post in the arc
    const scheduledPosts: ScheduleResult[] = [];

    for (const arcPost of input.posts) {
      let baseScheduledAt = computeScheduledAt(
        input.weekStartDate,
        arcPost.day,
        arcPost.scheduledHour,
        arcPost.scheduledMinute,
        input.userTimezone
      );

      // Guard: Never schedule a post in the past
      if (baseScheduledAt.getTime() <= Date.now()) {
        logger.warn('Arc post scheduled time is in the past, bumping forward', {
          original: baseScheduledAt.toISOString(),
          arcBeat: arcPost.arcBeat,
        });
        // Bump to at least 5 minutes in the future
        baseScheduledAt = new Date(Date.now() + 5 * 60 * 1000);
      }

      const result = await this.schedulePost({
        workspaceId: input.workspaceId,
        profileId: input.profileId,
        baseScheduledAt,
        strategy: arcPost.strategy,
        platforms: arcPost.platforms,
        arcId: arc.id,
      });

      scheduledPosts.push(result);
    }

    logger.info('Content arc scheduled', {
      arcId: arc.id,
      postCount: scheduledPosts.length,
      weekStart: input.weekStartDate.toISOString(),
    });

    return { arc, posts: scheduledPosts };
  }

  /**
   * Cancels all pending scheduled variants and QStash tasks for a post.
   * Resets the post and its variants back to 'draft'.
   */
  async cancelScheduledPost(postId: string, workspaceId: string): Promise<void> {
    const post = await postRepository.findById(postId);
    if (!post || post.workspaceId !== workspaceId) {
      throw new Error(`Post ${postId} not found or access denied`);
    }

    // Cancel the combined QStash message (simultaneous mode)
    if (post.qstashMessageId) {
      await queueService.cancelScheduledTask(post.qstashMessageId);
    }

    // Cancel per-variant QStash messages (cascading mode)
    const variants = await postRepository.findVariantsByPostId(postId);
    for (const variant of variants) {
      if (variant.qstashMessageId && variant.status === 'scheduled') {
        await queueService.cancelScheduledTask(variant.qstashMessageId);
      }
      if (variant.status === 'scheduled') {
        await postRepository.updateVariant(variant.id, {
          status: 'draft',
          scheduledAt: null,
          qstashMessageId: null,
        });
      }
    }

    // Reset the post itself
    await postRepository.update(postId, {
      status: 'draft',
      scheduledAt: null,
      qstashMessageId: null,
    });

    logger.info('Scheduled post cancelled', { postId });
  }

  /**
   * Reschedules a post to a new time. Cancels the existing schedule and creates a new one.
   */
  async reschedulePost(
    postId: string,
    workspaceId: string,
    newScheduledAt: Date
  ): Promise<void> {
    const post = await postRepository.findById(postId);
    if (!post || post.workspaceId !== workspaceId) {
      throw new Error(`Post ${postId} not found or access denied`);
    }

    const variants = await postRepository.findVariantsByPostId(postId);

    // Cancel existing QStash tasks
    if (post.qstashMessageId) {
      await queueService.cancelScheduledTask(post.qstashMessageId);
    }
    for (const variant of variants) {
      if (variant.qstashMessageId) {
        await queueService.cancelScheduledTask(variant.qstashMessageId);
      }
    }

    // Re-enqueue based on existing strategy
    if (post.scheduleStrategy === 'simultaneous') {
      const newMessageId = await queueService.enqueueScheduledPublishTask({
        postId,
        workspaceId,
        scheduledAt: newScheduledAt,
      });
      await postRepository.update(postId, {
        status: 'scheduled',
        scheduledAt: newScheduledAt,
        qstashMessageId: newMessageId,
      });
      for (const variant of variants) {
        await postRepository.updateVariant(variant.id, {
          status: 'scheduled',
          scheduledAt: newScheduledAt,
          qstashMessageId: null,
        });
      }
    } else {
      // Cascading: re-enqueue each variant with proportional offset preserved
      const baseOffset = post.scheduledAt ? post.scheduledAt.getTime() : Date.now();
      for (const variant of variants) {
        const originalOffset = variant.scheduledAt
          ? variant.scheduledAt.getTime() - baseOffset
          : 0;
        const newVariantTime = new Date(newScheduledAt.getTime() + originalOffset);
        const newMsgId = await queueService.enqueueScheduledPublishTask({
          postId,
          workspaceId,
          variantId: variant.id,
          scheduledAt: newVariantTime,
          autoFirstComment: variant.autoFirstComment ?? undefined,
        });
        await postRepository.updateVariant(variant.id, {
          status: 'scheduled',
          scheduledAt: newVariantTime,
          qstashMessageId: newMsgId,
        });
      }
      await postRepository.update(postId, {
        status: 'scheduled',
        scheduledAt: newScheduledAt,
      });
    }

    logger.info('Post rescheduled', { postId, newScheduledAt: newScheduledAt.toISOString() });
  }

  /**
   * Scans the database for any posts or variants scheduled in the past that have
   * not yet been published, and immediately dispatches them via PublishService.
   * Self-heals when QStash is unconfigured, delayed, or missed.
   */
  async processDueScheduledPosts(workspaceId?: string): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: Array<{ postId: string; error: string }>;
  }> {
    const now = new Date();
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ postId: string; error: string }>,
    };

    try {
      // 1. Process posts whose scheduled_at has arrived
      const duePosts = await postRepository.findDueScheduledPosts(now, workspaceId);

      for (const post of duePosts) {
        // Prevent concurrent double-execution: atomically transition to 'publishing'
        try {
          await postRepository.updateStatus(post.id, 'publishing');
        } catch {
          continue; // Another worker or request picked it up
        }

        results.processed++;
        logger.info('Publishing due scheduled post', {
          postId: post.id,
          scheduledAt: post.scheduledAt?.toISOString(),
          workspaceId: post.workspaceId,
        });

        try {
          const publishResult = await publishService.publishToAllPlatforms(post.id, post.workspaceId);
          const anySuccess = Object.values(publishResult).some((r: any) => r.success);
          if (anySuccess) {
            results.succeeded++;
            logger.info('Due scheduled post published successfully', { postId: post.id });
          } else {
            results.failed++;
            const errStr = Object.values(publishResult).map((r: any) => r.error).filter(Boolean).join('; ') || 'All platform publishes failed';
            results.errors.push({ postId: post.id, error: errStr });
            logger.error('Due scheduled post failed across all platforms', { postId: post.id, error: new Error(errStr) });
          }
        } catch (publishErr) {
          results.failed++;
          const message = publishErr instanceof Error ? publishErr.message : String(publishErr);
          results.errors.push({ postId: post.id, error: message });
          await postRepository.updateStatus(post.id, 'failed');
          logger.error('Exception publishing due scheduled post', {
            postId: post.id,
            error: publishErr instanceof Error ? publishErr : new Error(String(publishErr)),
          });
        }
      }

      // 2. Also check for any standalone scheduled variants (e.g. cascading offsets) whose parent post is not already handled
      const dueVariants = await postRepository.findDueScheduledVariants(now, workspaceId);
      for (const variant of dueVariants) {
        if (variant.status !== 'scheduled') continue;

        // Find parent post to get workspaceId
        const parentPost = await postRepository.findById(variant.postId);
        if (!parentPost) continue;
        if (parentPost.status === 'published' && variant.status === 'scheduled') {
          // Cascading variant that was delayed after initial post publish
          try {
            await postRepository.updateVariant(variant.id, { status: 'publishing' });
            results.processed++;
            const variantRes = await publishService.publishPost({
              postVariantId: variant.id,
              platform: variant.platform,
              workspaceId: parentPost.workspaceId,
            });
            if (variantRes.ok && variantRes.value.success) {
              results.succeeded++;
            } else {
              results.failed++;
              const err = variantRes.ok ? variantRes.value.error : variantRes.error?.message;
              results.errors.push({ postId: variant.postId, error: err || 'Variant publish failed' });
            }
          } catch (varErr) {
            results.failed++;
            const msg = varErr instanceof Error ? varErr.message : String(varErr);
            results.errors.push({ postId: variant.postId, error: msg });
          }
        }
      }
    } catch (err) {
      logger.error('Failed while processing due scheduled posts', {
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }

    return results;
  }

  /**
   * Gets the scheduled posts for a workspace in a date range (for the Week Canvas).
   * Automatically processes any overdue posts first so the canvas stays accurate.
   */
  async getWeekCanvas(workspaceId: string, weekStart: Date): Promise<{
    post: Post;
    variants: PostVariant[];
  }[]> {
    // Self-heal: process any scheduled posts that have become due
    await this.processDueScheduledPosts(workspaceId).catch(err => {
      logger.warn('Non-fatal error self-healing due posts in getWeekCanvas', { error: String(err) });
    });

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const posts = await postRepository.findScheduledByWorkspace(workspaceId, weekStart, weekEnd);
    const postIds = posts.map(p => p.id);
    const allVariants = await postRepository.findVariantsByPostIds(postIds);

    const variantsByPostId = new Map<string, PostVariant[]>();
    for (const v of allVariants) {
      if (!variantsByPostId.has(v.postId)) variantsByPostId.set(v.postId, []);
      variantsByPostId.get(v.postId)!.push(v);
    }

    return posts.map(post => ({
      post,
      variants: variantsByPostId.get(post.id) ?? [],
    }));
  }
}

export const scheduleService = new ScheduleService();

