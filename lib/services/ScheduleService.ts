import { logger } from '@/lib/logger';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabaseWorkspaceRepository } from '@/lib/repositories/supabase/SupabaseWorkspaceRepository';
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
import { config } from '@/lib/config/schema';
import { supabaseAdmin } from '@/lib/supabase/admin';

const postRepository = new SupabasePostRepository();
const workspaceRepository = new SupabaseWorkspaceRepository();

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
  arcBeat?: string;          // Narrative beat label (e.g. "Hook", "Proof")
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
  idempotencyKey?: string;   // Client-supplied key to prevent duplicate arc creation
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

export function computeScheduledAt(
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
  } catch (tzError) {
    logger.error('computeScheduledAt: timezone conversion failed, falling back to UTC. Post may publish at wrong time!', {
      timezone,
      requestedTime: { year: weekStart.getUTCFullYear(), month: weekStart.getUTCMonth() + 1, day: weekStart.getUTCDate() + dayOffset, hour, minute },
      error: tzError instanceof Error ? tzError : new Error(String(tzError)),
    });
    // Fallback: treat as UTC — this is incorrect but prevents a crash
    // TODO: Use Temporal API or date-fns-tz for reliable timezone handling
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
          arcBeat: input.arcBeat ?? existing.arcBeat,
        });
        
        await supabaseAdmin.from('post_variants').delete().eq('post_id', existing.id);
      }
    }

    if (!post) {
      post = await postRepository.create({
        profileId: input.profileId,
        workspaceId: input.workspaceId,
        content: input.platforms[0]?.content ?? '',
        adaptationPromptVersion: input.arcId ? 'schedule-engine-v1' : 'schedule-engine-v1',
        arcBeat: input.arcBeat ?? null,
      });
    }

    // 2. Prepare all variant inputs (media optimization runs in parallel)
    const preparedVariants = await Promise.all(
      input.platforms.map(async (platformInput) => {
        const variantScheduledAt = input.strategy === 'cascading' && platformInput.schedulingOffsetMinutes
          ? new Date(input.baseScheduledAt.getTime() + platformInput.schedulingOffsetMinutes * 60_000)
          : input.baseScheduledAt;

        const normalizedMedia = (platformInput.mediaUrls ?? []).filter(m => Boolean(m.url));
        const finalMedia = await optimizeMediaForPlatform(normalizedMedia, platformInput.platform);

        return {
          platformInput,
          variantScheduledAt,
          createInput: {
            postId: post.id,
            platform: platformInput.platform,
            adaptedContent: platformInput.content,
            mediaUrls: finalMedia,
            characterCount: platformInput.content.length,
            hashtagStrategy: platformInput.hashtags,
            firstCommentHint: platformInput.firstCommentHint,
            autoFirstComment: platformInput.autoFirstComment ?? null,
            status: 'scheduled' as const,
            scheduledAt: variantScheduledAt,
          },
        };
      })
    );

    // 3. Batch-insert all variants in a single DB round-trip (BUG-13 fix)
    const createdVariants = postRepository.createVariantsBatch
      ? await postRepository.createVariantsBatch(preparedVariants.map(pv => pv.createInput))
      : await Promise.all(preparedVariants.map(pv => postRepository.createVariant(pv.createInput)));

    // 4. In cascading mode, enqueue per-variant QStash tasks
    const variantResults = await Promise.all(
      createdVariants.map(async (variant, idx) => {
        const { platformInput, variantScheduledAt } = preparedVariants[idx];
        let qstashMessageId: string | null = null;

        if (input.strategy === 'cascading') {
          qstashMessageId = await queueService.enqueueScheduledPublishTask({
            postId: post.id,
            workspaceId: input.workspaceId,
            variantId: variant.id,
            scheduledAt: variantScheduledAt,
            autoFirstComment: platformInput.autoFirstComment,
          });

          if (qstashMessageId) {
            await postRepository.updateVariant(variant.id, {
              qstashMessageId,
              autoFirstComment: platformInput.autoFirstComment,
            });
          }
        }

        return {
          variantId: variant.id,
          platform: platformInput.platform,
          scheduledAt: variantScheduledAt,
          qstashMessageId,
        };
      })
    );

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
        arcBeat: input.arcBeat,
      });
    } else {
      // Cascading: update post status without a single combined message
      await postRepository.update(post.id, {
        status: 'scheduled',
        scheduledAt: input.baseScheduledAt,
        scheduleStrategy: 'cascading',
        arcId: input.arcId,
        arcBeat: input.arcBeat,
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
   * Schedules a full 7-day content arc concurrently.
   * Creates a content_arc record and links all posts to it.
   * Enforces idempotency when idempotencyKey is supplied so double-submits
   * or network retries return the existing arc without duplicating posts.
   */
  async scheduleArc(input: ScheduleArcInput): Promise<ScheduleArcResult> {
    if (input.idempotencyKey) {
      const existingArc = await postRepository.findContentArcByIdempotencyKey(
        input.workspaceId,
        input.idempotencyKey
      );
      if (existingArc) {
        const existingPosts = await postRepository.findPostsByArcId(existingArc.id);
        if (existingPosts.length > 0) {
          const allVariants = await postRepository.findVariantsByPostIds(
            existingPosts.map(p => p.id)
          );
          const variantsByPostId = new Map<string, PostVariant[]>();
          for (const v of allVariants) {
            if (!variantsByPostId.has(v.postId)) variantsByPostId.set(v.postId, []);
            variantsByPostId.get(v.postId)!.push(v);
          }
          const shapedResults: ScheduleResult[] = existingPosts.map(p => ({
            postId: p.id,
            scheduledAt: p.scheduledAt ?? p.createdAt,
            variantResults: (variantsByPostId.get(p.id) ?? []).map(v => ({
              variantId: v.id,
              platform: v.platform,
              scheduledAt: v.scheduledAt ?? p.scheduledAt ?? p.createdAt,
              qstashMessageId: v.qstashMessageId ?? p.qstashMessageId ?? null,
            })),
          }));
          shapedResults.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
          logger.info('Idempotent scheduleArc hit — returning existing arc and posts', {
            arcId: existingArc.id,
            idempotencyKey: input.idempotencyKey,
            postCount: shapedResults.length,
          });
          return { arc: existingArc, posts: shapedResults };
        }
      }
    }

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
      idempotencyKey: input.idempotencyKey ?? null,
    });

    // 2. Schedule each post in the arc in parallel
    const scheduledPosts = await Promise.all(
      input.posts.map(async (arcPost) => {
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
            day: arcPost.day,
          });
          if (arcPost.day === 0) {
            // Today's post whose time has passed: bump to 5 minutes from now
            baseScheduledAt = new Date(Date.now() + 5 * 60 * 1000);
          } else {
            // Future day: keep on its target day relative to today
            const futureDay = new Date();
            futureDay.setDate(futureDay.getDate() + arcPost.day);
            baseScheduledAt = computeScheduledAt(
              futureDay,
              0,
              arcPost.scheduledHour ?? 9,
              arcPost.scheduledMinute ?? 0,
              input.userTimezone
            );
            if (baseScheduledAt.getTime() <= Date.now()) {
              baseScheduledAt = new Date(Date.now() + (arcPost.day * 24 * 60 * 60 * 1000) + 5 * 60 * 1000);
            }
          }
        }

        return this.schedulePost({
          workspaceId: input.workspaceId,
          profileId: input.profileId,
          baseScheduledAt,
          strategy: arcPost.strategy,
          platforms: arcPost.platforms,
          arcId: arc.id,
          arcBeat: arcPost.arcBeat,
        });
      })
    );

    // Sort by scheduledAt for deterministic ordering
    scheduledPosts.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

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

    // BUG-19: Bounded parallel execution — cap at 5 concurrent publishes so a cron
    // flush with many due posts does not exhaust the serverless concurrency budget.
    // Each publish attempt is self-contained (claim → publish → first-comment), so
    // parallel execution is safe as long as the atomic claim prevents double-work.
    const CONCURRENCY = 5;

    /** Run tasks from `queue` with at most `limit` in-flight at once. */
    async function runBounded<T>(
      queue: Array<() => Promise<T>>,
      limit: number,
    ): Promise<T[]> {
      const output: T[] = [];
      const inFlight = new Set<Promise<void>>();
      for (const task of queue) {
        const p = (async () => { output.push(await task()); })();
        inFlight.add(p);
        p.finally(() => inFlight.delete(p));
        if (inFlight.size >= limit) await Promise.race(inFlight);
      }
      await Promise.all(inFlight);
      return output;
    }

    try {
      // 1. Process posts whose scheduled_at has arrived — bounded parallel
      const duePosts = await postRepository.findDueScheduledPosts(now, workspaceId);

      // Pre-load workspace hold state per unique workspaceId to avoid N+1 queries
      const wsHoldCache = new Map<string, Date | null>();
      const uniqueWsIds = [...new Set(duePosts.map(p => p.workspaceId))];
      await Promise.all(uniqueWsIds.map(async (wsId) => {
        try {
          const ws = await workspaceRepository.findById(wsId);
          const heldUntil = (ws?.settings as Record<string, unknown> | null)?.queue_held_until;
          wsHoldCache.set(wsId, heldUntil ? new Date(heldUntil as string) : null);
        } catch {
          wsHoldCache.set(wsId, null);
        }
      }));

      const postTasks = duePosts.map((post) => async () => {
        // Check queue hold
        const holdUntil = wsHoldCache.get(post.workspaceId);
        if (holdUntil && holdUntil > now) {
          logger.info('Skipping due post because queue is held for workspace', {
            postId: post.id, workspaceId: post.workspaceId, heldUntil: holdUntil.toISOString(),
          });
          return;
        }

        // Atomic claim — only the winner proceeds
        try {
          const claimed =
            post.status === 'publishing'
              ? await postRepository.claimForPublishing(post.id, 'publishing', new Date(Date.now() - 5 * 60 * 1000))
              : await postRepository.claimForPublishing(post.id, 'scheduled');
          if (!claimed) {
            logger.info('Skipping due post: claim lost to another worker', { postId: post.id });
            return;
          }
        } catch (claimErr) {
          logger.warn('Failed to claim due post for publishing, skipping', { postId: post.id, error: claimErr });
          return;
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

            // Dispatch auto first-comments (only when explicitly set via autoFirstComment)
            if (config.QSTASH_TOKEN) {
              try {
                const variants = await postRepository.findVariantsByPostId(post.id);
                await Promise.all(variants.map(async (v) => {
                  const comment = v.autoFirstComment;
                  if (v.status === 'published' && comment && v.platformPostId) {
                    await queueService.enqueueScheduledPublishTask({
                      postId: post.id,
                      workspaceId: post.workspaceId,
                      variantId: `first-comment:${v.id}:${v.platformPostId}`,
                      scheduledAt: new Date(Date.now() + 90_000),
                      autoFirstComment: comment,
                    });
                  }
                }));
              } catch (fcErr) {
                logger.warn('Failed to dispatch first comment in processDueScheduledPosts', { postId: post.id, error: fcErr });
              }
            }
          } else {
            results.failed++;
            const errStr = Object.values(publishResult).map((r: any) => r.error).filter(Boolean).join('; ') || 'All platform publishes failed';
            results.errors.push({ postId: post.id, error: errStr });
            await postRepository.updateStatus(post.id, 'failed');
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
      });

      await runBounded(postTasks, CONCURRENCY);

      // 2. Standalone scheduled variants (cascading offsets) — also bounded parallel
      const dueVariants = await postRepository.findDueScheduledVariants(now, workspaceId);

      // Pre-fetch parent posts in bulk (avoid N+1 for variants)
      const variantPostIds = [...new Set(
        dueVariants
          .filter(v => v.status === 'scheduled' || v.status === 'publishing')
          .map(v => v.postId)
      )];
      const parentPostMap = new Map<string, Post>();
      await Promise.all(variantPostIds.map(async (pid) => {
        const p = await postRepository.findById(pid);
        if (p) parentPostMap.set(pid, p);
      }));

      // Augment wsHoldCache with any workspaceIds from variants not already in cache
      const variantWsIds = [...new Set(
        [...parentPostMap.values()].map(p => p.workspaceId).filter(id => !wsHoldCache.has(id))
      )];
      await Promise.all(variantWsIds.map(async (wsId) => {
        try {
          const ws = await workspaceRepository.findById(wsId);
          const heldUntil = (ws?.settings as Record<string, unknown> | null)?.queue_held_until;
          wsHoldCache.set(wsId, heldUntil ? new Date(heldUntil as string) : null);
        } catch {
          wsHoldCache.set(wsId, null);
        }
      }));

      const variantTasks = dueVariants
        .filter(v => v.status === 'scheduled' || v.status === 'publishing')
        .map((variant) => async () => {
          const parentPost = parentPostMap.get(variant.postId);
          if (!parentPost) return;
          if (workspaceId && parentPost.workspaceId !== workspaceId) return;

          // Check queue hold
          const holdUntil = wsHoldCache.get(parentPost.workspaceId);
          if (holdUntil && holdUntil > now) {
            logger.info('Skipping due variant because queue is held for workspace', {
              variantId: variant.id, workspaceId: parentPost.workspaceId,
            });
            return;
          }

          if (parentPost.status !== 'published' && parentPost.scheduleStrategy !== 'cascading') return;

          try {
            const claimed =
              variant.status === 'publishing'
                ? await postRepository.claimVariantForPublishing(
                    variant.id,
                    'publishing',
                    new Date(Date.now() - 5 * 60 * 1000),
                  )
                : await postRepository.claimVariantForPublishing(variant.id, 'scheduled');
            if (!claimed) {
              logger.info('Skipping due variant: claim lost to another worker', { variantId: variant.id });
              return;
            }

            results.processed++;
            const variantRes = await publishService.publishPost({
              postVariantId: variant.id,
              platform: variant.platform,
              workspaceId: parentPost.workspaceId,
            });
            if (variantRes.ok && variantRes.value.success) {
              results.succeeded++;
              if (config.QSTASH_TOKEN && variant.autoFirstComment && variantRes.value.platformPostId) {
                try {
                  await queueService.enqueueScheduledPublishTask({
                    postId: parentPost.id,
                    workspaceId: parentPost.workspaceId,
                    variantId: `first-comment:${variant.id}:${variantRes.value.platformPostId}`,
                    scheduledAt: new Date(Date.now() + 90_000),
                    autoFirstComment: variant.autoFirstComment,
                  });
                } catch (fcErr) {
                  logger.warn('Failed to dispatch first comment for cascading variant', { variantId: variant.id, error: fcErr });
                }
              }
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
        });

      await runBounded(variantTasks, CONCURRENCY);

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
    // Safe timezone buffer: from 1 day prior to 8 days after to safely encompass all timezones (UTC-12 to UTC+14)
    const weekStartBuffer = new Date(weekStart.getTime() - 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 8 * 24 * 60 * 60 * 1000);

    const posts = await postRepository.findScheduledByWorkspace(workspaceId, weekStartBuffer, weekEnd);
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

