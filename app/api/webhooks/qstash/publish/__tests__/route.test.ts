import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockFindById,
  mockFindVariantsByPostId,
  mockFindVariantById,
  mockPublishToAllPlatforms,
  mockPublishPost,
  mockEnqueueScheduledPublishTask,
  mockFrom,
  mockReceiverVerify,
} = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockFindVariantsByPostId: vi.fn(),
  mockFindVariantById: vi.fn(),
  mockPublishToAllPlatforms: vi.fn(),
  mockPublishPost: vi.fn(),
  mockEnqueueScheduledPublishTask: vi.fn(),
  mockFrom: vi.fn(),
  mockReceiverVerify: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabasePostRepository', () => ({
  SupabasePostRepository: vi.fn().mockImplementation(() => ({
    findById: mockFindById,
    findVariantsByPostId: mockFindVariantsByPostId,
    findVariantById: mockFindVariantById,
  })),
}));

vi.mock('@/lib/services/PublishService', () => ({
  publishService: {
    publishToAllPlatforms: mockPublishToAllPlatforms,
    publishPost: mockPublishPost,
  },
}));

vi.mock('@/lib/services/QueueService', () => ({
  queueService: {
    enqueueScheduledPublishTask: mockEnqueueScheduledPublishTask,
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    from: mockFrom,
  })),
}));

vi.mock('@upstash/qstash', () => ({
  Receiver: vi.fn().mockImplementation(() => ({
    verify: mockReceiverVerify,
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    QSTASH_CURRENT_SIGNING_KEY: undefined,
    QSTASH_NEXT_SIGNING_KEY: undefined,
    NEXT_PUBLIC_APP_URL: 'https://app.unool.co',
    SUPABASE_URL: 'https://supabase.local',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  },
}));

import { POST } from '../route';

describe('/api/webhooks/qstash/publish route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { settings: {} } }),
        }),
      }),
    });
  });

  it('skips scheduled dispatch if post is already published (delayed QStash defense)', async () => {
    mockFindById.mockResolvedValue({
      id: 'post-1',
      workspaceId: 'ws-1',
      status: 'published',
    });

    const req = new NextRequest('https://app.unool.co/api/webhooks/qstash/publish', {
      method: 'POST',
      body: JSON.stringify({
        postId: 'post-1',
        workspaceId: 'ws-1',
        isScheduled: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe('already_published');
    expect(mockPublishToAllPlatforms).not.toHaveBeenCalled();
  });

  it('skips publish if workspace queue is on hold', async () => {
    mockFindById.mockResolvedValue({
      id: 'post-1',
      workspaceId: 'ws-1',
      status: 'scheduled',
    });

    const futureHold = new Date(Date.now() + 3600_000).toISOString();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { settings: { queue_held_until: futureHold } },
          }),
        }),
      }),
    });

    const req = new NextRequest('https://app.unool.co/api/webhooks/qstash/publish', {
      method: 'POST',
      body: JSON.stringify({
        postId: 'post-1',
        workspaceId: 'ws-1',
        isScheduled: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe('queue_held');
    expect(mockPublishToAllPlatforms).not.toHaveBeenCalled();
  });

  it('publishes scheduled flight plan post and enqueues first-comments for published variants', async () => {
    mockFindById.mockResolvedValue({
      id: 'flightplan-post-1',
      workspaceId: 'ws-1',
      status: 'scheduled',
    });

    mockPublishToAllPlatforms.mockResolvedValue({
      instagram: { success: true, platformPostId: 'ig-post-99' },
      x: { success: true, platformPostId: 'x-post-88' },
    });

    mockFindVariantsByPostId.mockResolvedValue([
      {
        id: 'var-ig',
        postId: 'flightplan-post-1',
        platform: 'instagram',
        status: 'published',
        platformPostId: 'ig-post-99',
        autoFirstComment: 'Check bio link for details!',
      },
      {
        id: 'var-x',
        postId: 'flightplan-post-1',
        platform: 'x',
        status: 'published',
        platformPostId: 'x-post-88',
        autoFirstComment: null,
      },
    ]);

    mockEnqueueScheduledPublishTask.mockResolvedValue('msg-fc-1');

    const req = new NextRequest('https://app.unool.co/api/webhooks/qstash/publish', {
      method: 'POST',
      body: JSON.stringify({
        postId: 'flightplan-post-1',
        workspaceId: 'ws-1',
        isScheduled: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockPublishToAllPlatforms).toHaveBeenCalledWith('flightplan-post-1', 'ws-1');

    // Verify first-comment was enqueued for the variant with autoFirstComment
    expect(mockEnqueueScheduledPublishTask).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 'flightplan-post-1',
        workspaceId: 'ws-1',
        variantId: 'first-comment:var-ig:ig-post-99',
        autoFirstComment: 'Check bio link for details!',
      })
    );
  });
});
