import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/services/QueueService', () => ({
  queueService: {
    enqueueScheduledPublishTask: vi.fn().mockResolvedValue('msg-123'),
    cancelScheduledTask: vi.fn().mockResolvedValue(true),
  },
}));

// Real SupabasePostRepository running against an in-memory CAS-faithful posts table.
vi.mock('@/lib/supabase/admin', async () => {
  const { fakeSupabase } = await import('@/lib/repositories/supabase/__tests__/fakePostsDb');
  return { supabaseAdmin: fakeSupabase };
});

import { scheduleService } from '../ScheduleService';
import { publishService } from '../PublishService';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabaseWorkspaceRepository } from '@/lib/repositories/supabase/SupabaseWorkspaceRepository';
import { fakePostsDb, resetFakePostsDb, postRow } from '@/lib/repositories/supabase/__tests__/fakePostsDb';

describe('ScheduleService.processDueScheduledPosts concurrency (BUG-026)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetFakePostsDb([postRow()]);
    vi.spyOn(SupabaseWorkspaceRepository.prototype, 'findById').mockResolvedValue({
      id: 'ws-test', name: 'WS', ownerId: 'u', plan: 'pro', settings: {}, createdAt: new Date(),
    } as any);
    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledVariants').mockResolvedValue([]);
  });

  it('two overlapping workers that both read the same due post publish it exactly once', async () => {
    // Both workers read the post as "scheduled" before either claims it.
    const duePost = {
      id: 'post-1', profileId: 'prof-1', workspaceId: 'ws-test', content: 'hello',
      status: 'scheduled' as const, scheduledAt: new Date(Date.now() - 60_000), publishedAt: null,
      adaptationPromptVersion: null, version: 1, qstashMessageId: null,
      scheduleStrategy: 'simultaneous' as const, arcId: null, createdAt: new Date(), updatedAt: new Date(),
    };
    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledPosts').mockResolvedValue([duePost]);

    const publishSpy = vi.spyOn(publishService, 'publishToAllPlatforms').mockResolvedValue({
      linkedin: { success: true, platformPostId: 'li-1' },
    } as any);

    const [r1, r2] = await Promise.all([
      scheduleService.processDueScheduledPosts('ws-test'),
      scheduleService.processDueScheduledPosts('ws-test'),
    ]);

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(r1.processed + r2.processed).toBe(1);
    expect(r1.succeeded + r2.succeeded).toBe(1);
    expect(fakePostsDb.rows[0].status).toBe('publishing');
  });

  it('skips publishing when the claim is lost (claim returns null)', async () => {
    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledPosts').mockResolvedValue([
      {
        id: 'post-1', profileId: 'prof-1', workspaceId: 'ws-test', content: 'x',
        status: 'scheduled', scheduledAt: new Date(Date.now() - 1000), publishedAt: null,
        adaptationPromptVersion: null, version: 1, qstashMessageId: null,
        scheduleStrategy: 'simultaneous', arcId: null, createdAt: new Date(), updatedAt: new Date(),
      },
    ]);
    vi.spyOn(SupabasePostRepository.prototype, 'claimForPublishing').mockResolvedValue(null);
    const publishSpy = vi.spyOn(publishService, 'publishToAllPlatforms');

    const result = await scheduleService.processDueScheduledPosts('ws-test');

    expect(publishSpy).not.toHaveBeenCalled();
    expect(result.processed).toBe(0);
  });

  it('skips publishing when the claim query throws', async () => {
    vi.spyOn(SupabasePostRepository.prototype, 'findDueScheduledPosts').mockResolvedValue([
      {
        id: 'post-1', profileId: 'prof-1', workspaceId: 'ws-test', content: 'x',
        status: 'scheduled', scheduledAt: new Date(Date.now() - 1000), publishedAt: null,
        adaptationPromptVersion: null, version: 1, qstashMessageId: null,
        scheduleStrategy: 'simultaneous', arcId: null, createdAt: new Date(), updatedAt: new Date(),
      },
    ]);
    vi.spyOn(SupabasePostRepository.prototype, 'claimForPublishing').mockRejectedValue(new Error('db down'));
    const publishSpy = vi.spyOn(publishService, 'publishToAllPlatforms');

    const result = await scheduleService.processDueScheduledPosts('ws-test');
    expect(publishSpy).not.toHaveBeenCalled();
    expect(result.processed).toBe(0);
  });
});
