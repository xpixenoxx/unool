import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { hmacSha256Hex } from '@/lib/webhooks/verify';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockConfig: Record<string, string | undefined> = {
  META_WEBHOOK_VERIFY_TOKEN: 'meta_verify_token_123',
  FACEBOOK_WEBHOOK_SECRET: 'fb_secret_abc',
  FACEBOOK_CLIENT_SECRET: 'fb_client_secret_xyz',
  THREADS_WEBHOOK_SECRET: 'threads_secret_123',
};

vi.mock('@/lib/config/schema', () => ({
  get config() {
    return mockConfig;
  },
}));

const mockEnqueue = vi.fn().mockResolvedValue('msg_123');
vi.mock('@/lib/services/QueueService', () => ({
  queueService: {
    enqueueFacebookOutboundTask: (...args: unknown[]) => mockEnqueue(...args),
    enqueueThreadsOutboundTask: vi.fn().mockResolvedValue('threads_msg_123'),
    isAvailable: () => true,
  },
}));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (table: string) => mockFrom(table),
  },
}));

import { GET, POST } from '../route';

describe('Platform Webhooks Route (/api/webhooks/platform)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET (Meta Hub Challenge Verification)', () => {
    it('verifies GET challenge for Facebook using META_WEBHOOK_VERIFY_TOKEN', async () => {
      const url = 'https://unool.co/api/webhooks/platform?platform=facebook&hub.mode=subscribe&hub.challenge=challenge_12345&hub.verify_token=meta_verify_token_123';
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe('challenge_12345');
    });

    it('verifies GET challenge even without platform param if token matches', async () => {
      const url = 'https://unool.co/api/webhooks/platform?hub.mode=subscribe&hub.challenge=challenge_67890&hub.verify_token=meta_verify_token_123';
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe('challenge_67890');
    });

    it('rejects GET challenge with wrong token', async () => {
      const url = 'https://unool.co/api/webhooks/platform?platform=facebook&hub.mode=subscribe&hub.challenge=challenge_12345&hub.verify_token=wrong_token';
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(403);
    });
  });

  describe('POST (Facebook Inbound Comments)', () => {
    it('processes Facebook feed comment and enqueues task with valid signature', async () => {
      const payloadObj = {
        object: 'page',
        entry: [
          {
            id: '122106760341502479',
            time: 1794651608,
            changes: [
              {
                field: 'feed',
                value: {
                  item: 'comment',
                  verb: 'add',
                  comment_id: 'comment_999',
                  post_id: 'post_888',
                  message: 'Where can I get the link?',
                  from: { id: 'user_tester_1', name: 'Tester User' },
                },
              },
            ],
          },
        ],
      };

      const payloadStr = JSON.stringify(payloadObj);
      const secret = mockConfig.FACEBOOK_WEBHOOK_SECRET!;
      const digest = await hmacSha256Hex(payloadStr, secret);
      const signature = `sha256=${digest}`;

      // Mock database calls
      mockFrom.mockImplementation((table: string) => {
        if (table === 'facebook_automation_config') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'cfg_1',
                      workspace_id: 'ws_123',
                      page_id: '122106760341502479',
                      enabled: true,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'facebook_comment_logs') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null, // No existing comment (dedup passed)
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'platform_connections') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    limit: vi.fn().mockResolvedValue({
                      data: [{ id: 'conn_fb_123' }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }),
        };
      });

      const req = new NextRequest('https://unool.co/api/webhooks/platform?platform=facebook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
          'Content-Type': 'application/json',
        },
        body: payloadStr,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(mockEnqueue).toHaveBeenCalledTimes(1);
      expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
        commentId: 'comment_999',
        pageId: '122106760341502479',
        commentText: 'Where can I get the link?',
      }));
    });

    it('auto-detects facebook platform when ?platform=facebook is omitted from URL', async () => {
      const payloadObj = {
        object: 'page',
        entry: [
          {
            id: '122106760341502479',
            changes: [
              {
                field: 'feed',
                value: {
                  item: 'comment',
                  verb: 'add',
                  comment_id: 'comment_auto_1',
                  message: 'Hello from auto detect!',
                  from: { id: 'tester_2', name: 'Tester' },
                },
              },
            ],
          },
        ],
      };

      const payloadStr = JSON.stringify(payloadObj);
      const secret = mockConfig.FACEBOOK_WEBHOOK_SECRET!;
      const digest = await hmacSha256Hex(payloadStr, secret);
      const signature = `sha256=${digest}`;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'facebook_automation_config') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { workspace_id: 'ws_123', page_id: '122106760341502479', enabled: true },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'facebook_comment_logs') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        if (table === 'platform_connections') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    limit: vi.fn().mockResolvedValue({ data: [{ id: 'conn_1' }], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new NextRequest('https://unool.co/api/webhooks/platform', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
          'Content-Type': 'application/json',
        },
        body: payloadStr,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
        commentId: 'comment_auto_1',
      }));
    });

    it('rejects POST with invalid signature', async () => {
      const payloadStr = JSON.stringify({ object: 'page', entry: [] });
      const req = new NextRequest('https://unool.co/api/webhooks/platform?platform=facebook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=invalid00000000000000000000000000000000000000000000000000000000',
          'Content-Type': 'application/json',
        },
        body: payloadStr,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Invalid signature');
    });
  });
});

