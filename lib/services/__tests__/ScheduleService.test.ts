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
  });
});
