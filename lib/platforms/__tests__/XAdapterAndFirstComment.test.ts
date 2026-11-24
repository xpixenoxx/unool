import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { xAdapter } from '@/lib/platforms/XAdapter';
import { postFirstComment } from '@/lib/platforms/firstComment';

const {
  mockFindPostById,
  mockFindVariantsByPostId,
  mockCancelScheduledTask,
  mockAdminFrom,
} = vi.hoisted(() => ({
  mockFindPostById: vi.fn(),
  mockFindVariantsByPostId: vi.fn(),
  mockCancelScheduledTask: vi.fn(),
  mockAdminFrom: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: vi.fn(),
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabasePostRepository', () => ({
  SupabasePostRepository: class {
    findById = mockFindPostById;
    findVariantsByPostId = mockFindVariantsByPostId;
  },
}));

vi.mock('@/lib/services/QueueService', () => ({
  queueService: {
    cancelScheduledTask: mockCancelScheduledTask,
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: mockAdminFrom,
  },
}));

import { DELETE as deletePostRoute } from '@/app/api/publish/[postId]/route';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';

describe('Phase 1 — X Media Upload, Multi-Platform First Comment & QStash Cleanup', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentAuth).mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
    } as any);
    vi.mocked(requireWorkspaceRole).mockResolvedValue({
      allowed: true,
      membership: { workspaceId: 'ws-1', userId: 'user-1', role: 'owner', status: 'active', isOwner: true },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('uploads images to X API v2 chunked media endpoints and attaches media_ids to tweet', async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];

    globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      calls.push({ url, method, body: init?.body });

      if (url === 'https://cdn.unool.co/card.png') {
        const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
        return new Response(bytes, {
          status: 200,
          headers: { 'content-type': 'image/png', 'content-length': String(bytes.byteLength) },
        });
      }

      if (url.endsWith('/2/media/upload/initialize')) {
        return new Response(JSON.stringify({ data: { id: 'media_987654' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      if (url.endsWith('/2/media/upload/media_987654/append')) {
        return new Response(null, { status: 204 });
      }

      if (url.endsWith('/2/media/upload/media_987654/finalize')) {
        return new Response(JSON.stringify({ data: { id: 'media_987654' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      if (url.endsWith('/2/tweets')) {
        return new Response(JSON.stringify({ data: { id: 'tweet_12345' } }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        });
      }

      return new Response('Not found', { status: 404 });
    });

    const result = await xAdapter.publish('x_access_token', {
      content: 'Shipping Zero-Form Voice DNA today.',
      mediaUrls: ['https://cdn.unool.co/card.png'],
    });

    expect(result.platformPostId).toBe('tweet_12345');
    expect(result.platformUrl).toBe('https://x.com/i/web/status/tweet_12345');

    const tweetCall = calls.find((c) => c.url.endsWith('/2/tweets'));
    expect(tweetCall).toBeDefined();
    expect(JSON.parse(String(tweetCall!.body))).toEqual({
      text: 'Shipping Zero-Form Voice DNA today.',
      media: { media_ids: ['media_987654'] },
    });
  });

  it('supports postFirstComment across Instagram, X, LinkedIn, and Threads', async () => {
    const requests: Array<{ url: string; body?: string }> = [];

    globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const bodyStr = typeof init?.body === 'string' ? init.body : undefined;
      requests.push({ url, body: bodyStr });

      // Instagram comment
      if (url.includes('graph.instagram.com') && url.endsWith('/comments')) {
        return new Response(JSON.stringify({ id: 'ig_comment_1' }), { status: 200 });
      }
      // X reply
      if (url === 'https://api.twitter.com/2/tweets') {
        return new Response(JSON.stringify({ data: { id: 'x_reply_1' } }), { status: 201 });
      }
      // LinkedIn comment
      if (url.includes('api.linkedin.com/rest/socialActions/')) {
        return new Response(JSON.stringify({ id: 'li_comment_1' }), {
          status: 201,
          headers: { 'x-restli-id': 'li_comment_1' },
        });
      }
      // Threads container -> status -> publish
      if (url === 'https://graph.threads.net/v1.0/me/threads') {
        return new Response(JSON.stringify({ id: 'th_container_1' }), { status: 200 });
      }
      if (url.includes('graph.threads.net/v1.0/th_container_1')) {
        return new Response(JSON.stringify({ status: 'FINISHED' }), { status: 200 });
      }
      if (url === 'https://graph.threads.net/v1.0/me/threads_publish') {
        return new Response(JSON.stringify({ id: 'th_reply_1' }), { status: 200 });
      }

      return new Response('{}', { status: 200 });
    });

    await postFirstComment('ig_tok', 'ig_post_1', 'Full breakdown in bio', 'instagram');
    await postFirstComment('x_tok', 'x_post_1', 'Thread link here', 'x');
    await postFirstComment('li_tok', 'urn:li:share:999', 'Case study link below', 'linkedin', {
      platformUserId: 'abc123',
    });
    await postFirstComment('th_tok', 'th_post_1', 'Bonus notes here', 'threads');

    expect(requests.some((r) => r.url.includes('graph.instagram.com'))).toBe(true);
    const xReq = requests.find((r) => r.url === 'https://api.twitter.com/2/tweets');
    expect(JSON.parse(xReq!.body!)).toEqual({
      text: 'Thread link here',
      reply: { in_reply_to_tweet_id: 'x_post_1' },
    });
    const liReq = requests.find((r) => r.url.includes('api.linkedin.com/rest/socialActions/'));
    expect(JSON.parse(liReq!.body!)).toEqual({
      actor: 'urn:li:person:abc123',
      object: 'urn:li:share:999',
      message: { text: 'Case study link below' },
    });
    expect(requests.some((r) => r.url === 'https://graph.threads.net/v1.0/me/threads_publish')).toBe(true);
  });

  it('cancels parent and variant QStash message IDs before deleting a scheduled post', async () => {
    mockFindPostById.mockResolvedValue({
      id: 'post-sched-1',
      workspaceId: 'ws-1',
      qstashMessageId: 'qmsg_parent_1',
    });
    mockFindVariantsByPostId.mockResolvedValue([
      { id: 'var-1', qstashMessageId: 'qmsg_var_1' },
      { id: 'var-2', qstashMessageId: 'qmsg_var_2' },
    ]);
    mockCancelScheduledTask.mockResolvedValue(undefined);

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'posts') {
        return {
          delete: () => ({
            eq: () => ({
              eq: async () => ({ error: null }),
            }),
          }),
        };
      }
      return {
        delete: () => ({
          in: async () => ({ error: null }),
        }),
      };
    });

    const req = new NextRequest('http://localhost:3000/api/publish/post-sched-1', {
      method: 'DELETE',
    });
    const res = await deletePostRoute(req, { params: Promise.resolve({ postId: 'post-sched-1' }) });
    expect(res.status).toBe(200);

    expect(mockCancelScheduledTask).toHaveBeenCalledTimes(3);
    expect(mockCancelScheduledTask).toHaveBeenCalledWith('qmsg_parent_1');
    expect(mockCancelScheduledTask).toHaveBeenCalledWith('qmsg_var_1');
    expect(mockCancelScheduledTask).toHaveBeenCalledWith('qmsg_var_2');
  });
});
