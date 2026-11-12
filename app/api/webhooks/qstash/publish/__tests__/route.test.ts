import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockFindById,
  mockFindVariantsByPostId,
  mockFindVariantById,
  mockClaimForPublishing,
  mockClaimVariantForPublishing,
  mockUpdateStatus,
  mockPublishToAllPlatforms,
  mockPublishPost,
  mockEnqueueScheduledPublishTask,
  mockFrom,
  mockReceiverVerify,
} = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockFindVariantsByPostId: vi.fn(),
  mockFindVariantById: vi.fn(),
  mockClaimForPublishing: vi.fn(),
  mockClaimVariantForPublishing: vi.fn(),
  mockUpdateStatus: vi.fn(),
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
    claimForPublishing: mockClaimForPublishing,
    claimVariantForPublishing: mockClaimVariantForPublishing,
    updateStatus: mockUpdateStatus,
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
    mockClaimForPublishing.mockResolvedValue({ id: 'claimed' });
    mockClaimVariantForPublishing.mockResolvedValue({ id: 'claimed-var' });
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

    // Verify first-comment was enqueued ONLY for the variant with autoFirstComment (never firstCommentHint)
    expect(mockEnqueueScheduledPublishTask).toHaveBeenCalledTimes(1);
    expect(mockEnqueueScheduledPublishTask).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 'flightplan-post-1',
        workspaceId: 'ws-1',
        variantId: 'first-comment:var-ig:ig-post-99',
        autoFirstComment: 'Check bio link for details!',
      })
    );
  });

  it('does NOT auto-post unapproved firstCommentHint when autoFirstComment is null (BUG-02)', async () => {
    mockFindById.mockResolvedValue({
      id: 'flightplan-post-2',
      workspaceId: 'ws-1',
      status: 'scheduled',
    });

    mockPublishToAllPlatforms.mockResolvedValue({
      linkedin: { success: true, platformPostId: 'li-post-77' },
    });

    mockFindVariantsByPostId.mockResolvedValue([
      {
        id: 'var-li',
        postId: 'flightplan-post-2',
        platform: 'linkedin',
        status: 'published',
        platformPostId: 'li-post-77',
        autoFirstComment: null,
        firstCommentHint: 'Unapproved AI hint that must not be posted',
      },
    ]);

    const req = new NextRequest('https://app.unool.co/api/webhooks/qstash/publish', {
      method: 'POST',
      body: JSON.stringify({
        postId: 'flightplan-post-2',
        workspaceId: 'ws-1',
        isScheduled: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockEnqueueScheduledPublishTask).not.toHaveBeenCalled();
  });

  it('skips scheduled publish if atomic claimForPublishing is lost to a concurrent worker (BUG-16)', async () => {
    mockFindById.mockResolvedValue({
      id: 'post-race-1',
      workspaceId: 'ws-1',
      status: 'scheduled',
    });
    mockClaimForPublishing.mockResolvedValueOnce(null);

    const req = new NextRequest('https://app.unool.co/api/webhooks/qstash/publish', {
      method: 'POST',
      body: JSON.stringify({
        postId: 'post-race-1',
        workspaceId: 'ws-1',
        isScheduled: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe('already_claimed');
    expect(mockPublishToAllPlatforms).not.toHaveBeenCalled();
  });

  it('returns HTTP 502 on transient platform failure so QStash retries work (BUG-17)', async () => {
    mockFindById.mockResolvedValue({
      id: 'post-transient-fail',
      workspaceId: 'ws-1',
      status: 'scheduled',
    });
    mockPublishToAllPlatforms.mockResolvedValue({
      linkedin: { success: false, error: '503 Service Unavailable from LinkedIn API' },
    });
    mockFindVariantsByPostId.mockResolvedValue([]);

    const req = new NextRequest('https://app.unool.co/api/webhooks/qstash/publish', {
      method: 'POST',
      body: JSON.stringify({
        postId: 'post-transient-fail',
        workspaceId: 'ws-1',
        isScheduled: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.retryable).toBe(true);
  });

  it('returns HTTP 200 (no retry) when failure is permanent (e.g. No active connection)', async () => {
    mockFindById.mockResolvedValue({
      id: 'post-perm-fail',
      workspaceId: 'ws-1',
      status: 'scheduled',
    });
    mockPublishToAllPlatforms.mockResolvedValue({
      linkedin: {
        success: false,
        error: 'No active connection for linkedin. Please connect this platform in settings.',
      },
    });
    mockFindVariantsByPostId.mockResolvedValue([]);

    const req = new NextRequest('https://app.unool.co/api/webhooks/qstash/publish', {
      method: 'POST',
      body: JSON.stringify({
        postId: 'post-perm-fail',
        workspaceId: 'ws-1',
        isScheduled: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
