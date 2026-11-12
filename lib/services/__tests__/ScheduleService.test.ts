import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/services/QueueService', () => ({
  queueService: {
    enqueueScheduledPublishTask: vi.fn().mockResolvedValue('msg-123'),
    cancelScheduledTask: vi.fn().mockResolvedValue(true),
  },
}));

import { scheduleService } from '../ScheduleService';
import { publishService } from '../PublishService';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabaseWorkspaceRepository } from '@/lib/repositories/supabase/SupabaseWorkspaceRepository';

describe('ScheduleService.processDueScheduledPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(SupabaseWorkspaceRepository.prototype, 'findById').mockResolvedValue({
      id: 'ws-test',
      name: 'Test WS',
      ownerId: 'user-1',
      plan: 'pro',
      settings: {},
      createdAt: new Date(),
    });
  });

  it('publishes due scheduled posts and updates status to published', async () => {
    const mockPost = {
      id: 'post-due-1',
      profileId: 'prof-1',
      workspaceId: 'ws-test',
      content: 'Due post content',
      status: 'scheduled' as const,
      scheduledAt: new Date(Date.now() - 60_000),
      publishedAt: null,
      adaptationPromptVersion: null,
      version: 1,
      qstashMessageId: null,
      scheduleStrategy: 'simultaneous' as const,
      arcId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledPosts').mockResolvedValue([mockPost]);
    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledVariants').mockResolvedValue([]);
    const claimSpy = vi.spyOn(SupabasePostRepository.prototype, 'claimForPublishing').mockResolvedValue(mockPost);

    vi.spyOn(publishService, 'publishToAllPlatforms').mockResolvedValue({
      instagram: { success: true, platformPostId: 'ig-123' },
    } as any);

    const result = await scheduleService.processDueScheduledPosts('ws-test');

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    expect(claimSpy).toHaveBeenCalledWith('post-due-1', 'scheduled');
    expect(publishService.publishToAllPlatforms).toHaveBeenCalledWith('post-due-1', 'ws-test');
  });

  it('handles failures gracefully and marks post as failed', async () => {
    const mockPost = {
      id: 'post-fail-1',
      profileId: 'prof-1',
      workspaceId: 'ws-test',
      content: 'Failing due post',
      status: 'scheduled' as const,
      scheduledAt: new Date(Date.now() - 120_000),
      publishedAt: null,
      adaptationPromptVersion: null,
      version: 1,
      qstashMessageId: null,
      scheduleStrategy: 'simultaneous' as const,
      arcId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledPosts').mockResolvedValue([mockPost]);
    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledVariants').mockResolvedValue([]);
    vi.spyOn(SupabasePostRepository.prototype, 'claimForPublishing').mockResolvedValue(mockPost);
    const updateStatusSpy = vi.spyOn(SupabasePostRepository.prototype, 'updateStatus').mockResolvedValue(mockPost);

    vi.spyOn(publishService, 'publishToAllPlatforms').mockResolvedValue({
      instagram: { success: false, error: 'Token expired' },
    } as any);

    const result = await scheduleService.processDueScheduledPosts('ws-test');

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].error).toContain('Token expired');
    expect(updateStatusSpy).toHaveBeenCalledWith('post-fail-1', 'failed');
  });

  it('recovers and processes posts that were stuck in publishing', async () => {
    const mockStuckPost = {
      id: 'post-stuck-1',
      profileId: 'prof-1',
      workspaceId: 'ws-test',
      content: 'Stuck post content',
      status: 'publishing' as const,
      scheduledAt: new Date(Date.now() - 3600_000),
      publishedAt: null,
      adaptationPromptVersion: null,
      version: 1,
      qstashMessageId: null,
      scheduleStrategy: 'simultaneous' as const,
      arcId: null,
      createdAt: new Date(Date.now() - 3600_000),
      updatedAt: new Date(Date.now() - 1800_000),
    };

    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledPosts').mockResolvedValue([mockStuckPost]);
    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledVariants').mockResolvedValue([]);
    const claimSpy = vi.spyOn(SupabasePostRepository.prototype, 'claimForPublishing').mockResolvedValue(mockStuckPost);

    vi.spyOn(publishService, 'publishToAllPlatforms').mockResolvedValue({
      bluesky: { success: true, platformPostId: 'bsky-123' },
      linkedin: { success: true, platformPostId: 'li-123' },
    } as any);

    const result = await scheduleService.processDueScheduledPosts('ws-test');

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    expect(claimSpy).toHaveBeenCalledWith('post-stuck-1', 'publishing', expect.any(Date));
    expect(publishService.publishToAllPlatforms).toHaveBeenCalledWith('post-stuck-1', 'ws-test');
  });

  it('skips due scheduled posts if workspace queue is held', async () => {
    const mockHeldPost = {
      id: 'post-held-1',
      profileId: 'prof-1',
      workspaceId: 'ws-held',
      content: 'Held post content',
      status: 'scheduled' as const,
      scheduledAt: new Date(Date.now() - 60_000),
      publishedAt: null,
      adaptationPromptVersion: null,
      version: 1,
      qstashMessageId: null,
      scheduleStrategy: 'simultaneous' as const,
      arcId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledPosts').mockResolvedValue([mockHeldPost]);
    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledVariants').mockResolvedValue([]);

    // Mock workspace repository to return queue_held_until in the future
    const futureHold = new Date(Date.now() + 3600_000).toISOString();
    vi.spyOn(SupabaseWorkspaceRepository.prototype, 'findById').mockResolvedValue({
      id: 'ws-held',
      name: 'Held WS',
      ownerId: 'user-1',
      plan: 'pro',
      settings: { queue_held_until: futureHold },
      createdAt: new Date(),
    });

    const result = await scheduleService.processDueScheduledPosts('ws-held');

    expect(result.processed).toBe(0);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(0);
    expect(publishService.publishToAllPlatforms).not.toHaveBeenCalled();
  });
});

describe('ScheduleService.scheduleArc & schedulePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('schedules an arc concurrently and returns all posts', async () => {
    const mockArc = {
      id: 'arc-1',
      workspaceId: 'ws-1',
      profileId: 'prof-1',
      title: 'Weekly Launch Arc',
      coreStory: 'We launched a new feature',
      storyType: 'shipped' as const,
      startDate: '2026-11-02',
      endDate: '2026-11-08',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let postCounter = 0;
    vi.spyOn(SupabasePostRepository.prototype, 'createContentArc').mockResolvedValue(mockArc);
    vi.spyOn(SupabasePostRepository.prototype, 'create').mockImplementation(async (input: any) => ({
      id: `post-${++postCounter}`,
      profileId: input.profileId,
      workspaceId: input.workspaceId,
      content: input.content,
      status: 'draft',
      scheduledAt: null,
      publishedAt: null,
      adaptationPromptVersion: input.adaptationPromptVersion,
      version: 1,
      qstashMessageId: null,
      scheduleStrategy: 'cascading',
      arcId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // BUG-13: schedulePost uses createVariantsBatch — mock batch method
    vi.spyOn(SupabasePostRepository.prototype, 'createVariantsBatch').mockImplementation(async (inputs: any[]) =>
      inputs.map((input: any) => ({
        id: `var-${Math.random().toString(36).slice(2, 7)}`,
        postId: input.postId,
        platform: input.platform,
        adaptedContent: input.adaptedContent,
        mediaUrls: input.mediaUrls || [],
        characterCount: input.characterCount,
        hashtagStrategy: input.hashtagStrategy || [],
        firstCommentHint: input.firstCommentHint || null,
        platformPostId: null,
        status: input.status || 'scheduled',
        scheduledAt: input.scheduledAt || null,
        qstashMessageId: null,
        autoFirstComment: null,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    vi.spyOn(SupabasePostRepository.prototype, 'updateVariant').mockResolvedValue({} as any);
    vi.spyOn(SupabasePostRepository.prototype, 'update').mockImplementation(async (id: string, data: any) => ({
      id,
      ...data,
    } as any));

    const arcResult = await scheduleService.scheduleArc({
      workspaceId: 'ws-1',
      profileId: 'prof-1',
      arcTitle: 'Weekly Launch Arc',
      coreStory: 'We launched a new feature',
      storyType: 'shipped',
      weekStartDate: new Date('2026-11-02T00:00:00.000Z'),
      userTimezone: 'UTC',
      posts: Array.from({ length: 7 }, (_, i) => ({
        day: i,
        scheduledHour: 10,
        scheduledMinute: 0,
        strategy: 'cascading' as const,
        arcBeat: `Beat ${i + 1}`,
        platforms: [
          {
            platform: 'linkedin' as const,
            content: `Post day ${i} for LinkedIn`,
            hashtags: ['#BuildInPublic'],
            schedulingOffsetMinutes: 0,
          },
          {
            platform: 'x' as const,
            content: `Post day ${i} for X`,
            hashtags: ['#BuildInPublic'],
            schedulingOffsetMinutes: 30,
          },
        ],
      })),
    });

    expect(arcResult.arc.id).toBe('arc-1');
    expect(arcResult.posts.length).toBe(7);
    expect(arcResult.posts[0].variantResults.length).toBe(2);
  });

  it('enqueues only ONE combined QStash task for simultaneous posts', async () => {
    const { queueService } = await import('@/lib/services/QueueService');

    let postCounter = 0;
    vi.spyOn(SupabasePostRepository.prototype, 'create').mockImplementation(async (input: any) => ({
      id: `post-simul-${++postCounter}`,
      profileId: input.profileId,
      workspaceId: input.workspaceId,
      content: input.content,
      status: 'draft',
      scheduledAt: null,
      publishedAt: null,
      adaptationPromptVersion: input.adaptationPromptVersion,
      version: 1,
      qstashMessageId: null,
      scheduleStrategy: 'simultaneous',
      arcId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // BUG-13: schedulePost now uses createVariantsBatch; mock it too
    vi.spyOn(SupabasePostRepository.prototype, 'createVariantsBatch').mockImplementation(async (inputs: any[]) =>
      inputs.map((input: any, idx: number) => ({
        id: `var-batch-${idx}`,
        postId: input.postId,
        platform: input.platform,
        adaptedContent: input.adaptedContent,
        mediaUrls: input.mediaUrls || [],
        characterCount: input.characterCount,
        hashtagStrategy: input.hashtagStrategy || [],
        firstCommentHint: null,
        platformPostId: null,
        status: 'scheduled',
        scheduledAt: input.scheduledAt,
        qstashMessageId: null,
        autoFirstComment: null,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    vi.spyOn(SupabasePostRepository.prototype, 'update').mockResolvedValue({} as any);

    const postResult = await scheduleService.schedulePost({
      workspaceId: 'ws-simul',
      profileId: 'prof-simul',
      baseScheduledAt: new Date(Date.now() + 3600_000),
      strategy: 'simultaneous',
      platforms: [
        { platform: 'linkedin', content: 'LinkedIn post', hashtags: [] },
        { platform: 'x', content: 'X post', hashtags: [] },
        { platform: 'threads', content: 'Threads post', hashtags: [] },
      ],
    });

    expect(postResult.variantResults.length).toBe(3);
    // In simultaneous mode, enqueueScheduledPublishTask should only be called once (for the post as a whole)
    expect(queueService.enqueueScheduledPublishTask).toHaveBeenCalledTimes(1);
    expect(queueService.enqueueScheduledPublishTask).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: postResult.postId,
        workspaceId: 'ws-simul',
      })
    );
  });

  it('persists autoFirstComment on variants in simultaneous mode and arcBeat on parent post (BUG-02, BUG-03)', async () => {
    const createSpy = vi.spyOn(SupabasePostRepository.prototype, 'create').mockImplementation(async (input: any) => ({
      id: 'post-simul-fc',
      profileId: input.profileId,
      workspaceId: input.workspaceId,
      content: input.content,
      status: 'draft',
      scheduledAt: null,
      publishedAt: null,
      adaptationPromptVersion: input.adaptationPromptVersion,
      version: 1,
      qstashMessageId: null,
      scheduleStrategy: 'simultaneous',
      arcId: null,
      arcBeat: input.arcBeat ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const createVariantSpy = vi.spyOn(SupabasePostRepository.prototype, 'createVariantsBatch').mockImplementation(async (inputs: any[]) =>
      inputs.map((input: any) => ({
        id: 'var-simul-fc',
        postId: input.postId,
        platform: input.platform,
        adaptedContent: input.adaptedContent,
        mediaUrls: input.mediaUrls || [],
        characterCount: input.characterCount,
        hashtagStrategy: input.hashtagStrategy || [],
        firstCommentHint: input.firstCommentHint || null,
        platformPostId: null,
        status: 'scheduled',
        scheduledAt: input.scheduledAt,
        qstashMessageId: null,
        autoFirstComment: input.autoFirstComment || null,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    const updateSpy = vi.spyOn(SupabasePostRepository.prototype, 'update').mockResolvedValue({} as any);

    await scheduleService.schedulePost({
      workspaceId: 'ws-simul',
      profileId: 'prof-simul',
      baseScheduledAt: new Date(Date.now() + 3600_000),
      strategy: 'simultaneous',
      arcBeat: 'Proof',
      platforms: [
        {
          platform: 'linkedin',
          content: 'LinkedIn proof post',
          hashtags: ['#Proof'],
          firstCommentHint: 'AI suggestion not approved',
          autoFirstComment: 'Approved CTA link: https://unool.co',
        },
      ],
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        arcBeat: 'Proof',
      })
    );
    // createVariantsBatch receives an array — verify the first element contains the expected fields
    expect(createVariantSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          autoFirstComment: 'Approved CTA link: https://unool.co',
          firstCommentHint: 'AI suggestion not approved',
        }),
      ])
    );
    expect(updateSpy).toHaveBeenCalledWith(
      'post-simul-fc',
      expect.objectContaining({
        arcBeat: 'Proof',
        scheduleStrategy: 'simultaneous',
      })
    );
  });

  it('deduplicates scheduleArc when idempotencyKey matches an existing arc with scheduled posts (BUG-01)', async () => {
    const existingArc = {
      id: 'arc-existing-99',
      workspaceId: 'ws-1',
      profileId: 'prof-1',
      title: 'Weekly Launch Arc',
      coreStory: 'We launched a new feature',
      storyType: 'shipped' as const,
      startDate: '2026-11-02',
      endDate: '2026-11-08',
      status: 'active' as const,
      idempotencyKey: 'flightplan_2026-11-02_abc',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingPost = {
      id: 'post-existing-1',
      profileId: 'prof-1',
      workspaceId: 'ws-1',
      content: 'Day 1 content',
      status: 'scheduled' as const,
      scheduledAt: new Date('2026-11-02T10:00:00.000Z'),
      publishedAt: null,
      adaptationPromptVersion: 'schedule-engine-v1',
      version: 1,
      qstashMessageId: 'qstash-existing-1',
      scheduleStrategy: 'simultaneous' as const,
      arcId: 'arc-existing-99',
      arcBeat: 'Hook',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(SupabasePostRepository.prototype, 'findContentArcByIdempotencyKey').mockResolvedValue(existingArc);
    vi.spyOn(SupabasePostRepository.prototype, 'findPostsByArcId').mockResolvedValue([existingPost]);
    vi.spyOn(SupabasePostRepository.prototype, 'findVariantsByPostIds').mockResolvedValue([
      {
        id: 'var-existing-1',
        postId: 'post-existing-1',
        platform: 'linkedin',
        adaptedContent: 'Day 1 content',
        mediaUrls: [],
        characterCount: 13,
        hashtagStrategy: [],
        firstCommentHint: null,
        platformPostId: null,
        status: 'scheduled',
        scheduledAt: new Date('2026-11-02T10:00:00.000Z'),
        qstashMessageId: null,
        autoFirstComment: null,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const createArcSpy = vi.spyOn(SupabasePostRepository.prototype, 'createContentArc');
    const createPostSpy = vi.spyOn(SupabasePostRepository.prototype, 'create');

    const result = await scheduleService.scheduleArc({
      workspaceId: 'ws-1',
      profileId: 'prof-1',
      arcTitle: 'Weekly Launch Arc',
      coreStory: 'We launched a new feature',
      storyType: 'shipped',
      weekStartDate: new Date('2026-11-02T00:00:00.000Z'),
      userTimezone: 'UTC',
      idempotencyKey: 'flightplan_2026-11-02_abc',
      posts: [
        {
          day: 0,
          scheduledHour: 10,
          scheduledMinute: 0,
          strategy: 'simultaneous',
          arcBeat: 'Hook',
          platforms: [{ platform: 'linkedin', content: 'Day 1 content', hashtags: [] }],
        },
      ],
    });

    expect(result.arc.id).toBe('arc-existing-99');
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].postId).toBe('post-existing-1');
    expect(createArcSpy).not.toHaveBeenCalled();
    expect(createPostSpy).not.toHaveBeenCalled();
  });
});

// ── DST / Timezone precision tests ──────────────────────────────────────────────
// These tests verify that computeScheduledAt() converts a wall-clock time in a
// specific IANA timezone to the correct UTC instant, including across DST boundaries.
// A wrong conversion would cause posts to publish 1 hour early/late on transition dates.

describe('computeScheduledAt — DST boundary correctness', () => {
  it('schedules at correct UTC for US/Eastern during standard time (UTC-5)', async () => {
    const { computeScheduledAt } = await import('../ScheduleService');
    // 2026-01-07 is mid-January — EST (UTC-5), not daylight saving
    const weekStart = new Date('2026-01-05T00:00:00.000Z'); // Monday
    const result = computeScheduledAt(weekStart, 2, 9, 0, 'America/New_York');
    // Day 2 from Monday = Wednesday 2026-01-07; 09:00 EST = 14:00 UTC
    expect(result.toISOString()).toBe('2026-01-07T14:00:00.000Z');
  });

  it('schedules at correct UTC for US/Eastern during daylight saving time (UTC-4)', async () => {
    const { computeScheduledAt } = await import('../ScheduleService');
    // 2026-06-10 is mid-June — EDT (UTC-4)
    const weekStart = new Date('2026-06-08T00:00:00.000Z'); // Monday
    const result = computeScheduledAt(weekStart, 2, 9, 0, 'America/New_York');
    // Day 2 from Monday = Wednesday 2026-06-10; 09:00 EDT = 13:00 UTC
    expect(result.toISOString()).toBe('2026-06-10T13:00:00.000Z');
  });

  it('schedules at correct UTC across the US spring-forward DST boundary', async () => {
    const { computeScheduledAt } = await import('../ScheduleService');
    // US spring forward 2026: Sun 2026-03-08 at 02:00 → 03:00
    // Schedule post for Monday 2026-03-09 at 09:00 America/New_York = UTC-4 (EDT has started)
    const weekStart = new Date('2026-03-09T00:00:00.000Z');
    const result = computeScheduledAt(weekStart, 0, 9, 0, 'America/New_York');
    // 09:00 EDT = 13:00 UTC
    expect(result.toISOString()).toBe('2026-03-09T13:00:00.000Z');
  });

  it('schedules at correct UTC across the EU spring-forward DST boundary', async () => {
    const { computeScheduledAt } = await import('../ScheduleService');
    // EU spring forward 2026: Sun 2026-03-29 at 02:00 → 03:00 (CEST starts, UTC+2)
    // Schedule for Monday 2026-03-30 at 10:00 CEST = UTC+2
    const weekStart = new Date('2026-03-30T00:00:00.000Z');
    const result = computeScheduledAt(weekStart, 0, 10, 0, 'Europe/Berlin');
    // 10:00 CEST = 08:00 UTC
    expect(result.toISOString()).toBe('2026-03-30T08:00:00.000Z');
  });

  it('schedules at correct UTC for India (IST, no DST, UTC+5:30)', async () => {
    const { computeScheduledAt } = await import('../ScheduleService');
    // IST is always UTC+5:30 — no DST
    const weekStart = new Date('2026-07-06T00:00:00.000Z'); // Monday
    const result = computeScheduledAt(weekStart, 0, 10, 30, 'Asia/Kolkata');
    // 10:30 IST = 05:00 UTC
    expect(result.toISOString()).toBe('2026-07-06T05:00:00.000Z');
  });
});
