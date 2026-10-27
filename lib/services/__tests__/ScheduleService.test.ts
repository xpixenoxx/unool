import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleService } from '../ScheduleService';
import { publishService } from '../PublishService';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';

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

describe('ScheduleService.processDueScheduledPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const updateStatusSpy = vi.spyOn(SupabasePostRepository.prototype, 'updateStatus').mockResolvedValue(mockPost);

    vi.spyOn(publishService, 'publishToAllPlatforms').mockResolvedValue({
      instagram: { success: true, platformPostId: 'ig-123' },
    } as any);

    const result = await scheduleService.processDueScheduledPosts('ws-test');

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    expect(updateStatusSpy).toHaveBeenCalledWith('post-due-1', 'publishing');
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
    const updateStatusSpy = vi.spyOn(SupabasePostRepository.prototype, 'updateStatus').mockResolvedValue(mockStuckPost);

    vi.spyOn(publishService, 'publishToAllPlatforms').mockResolvedValue({
      bluesky: { success: true, platformPostId: 'bsky-123' },
      linkedin: { success: true, platformPostId: 'li-123' },
    } as any);

    const result = await scheduleService.processDueScheduledPosts('ws-test');

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    expect(publishService.publishToAllPlatforms).toHaveBeenCalledWith('post-stuck-1', 'ws-test');
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

    vi.spyOn(SupabasePostRepository.prototype, 'createVariant').mockImplementation(async (input: any) => ({
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
    }));

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

    vi.spyOn(SupabasePostRepository.prototype, 'createVariant').mockImplementation(async (input: any) => ({
      id: `var-${Math.random().toString(36).slice(2, 7)}`,
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
    }));

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
});
