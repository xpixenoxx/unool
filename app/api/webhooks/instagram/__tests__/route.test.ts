import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    META_WEBHOOK_VERIFY_TOKEN: 'test_verify_token_123',
    META_WEBHOOK_SECRET: 'test_secret_456',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
    NODE_ENV: 'test',
  },
}));

const mockVerifyMetaSignature = vi.fn();
vi.mock('@/lib/webhooks/verify', () => ({
  verifyMetaSignature: (...args: unknown[]) => mockVerifyMetaSignature(...args),
}));

const mockSupabaseQuery: any = {
  select: () => mockSupabaseQuery,
  insert: () => Promise.resolve({ error: null }),
  update: () => mockSupabaseQuery,
  eq: () => mockSupabaseQuery,
  single: () => Promise.resolve({ data: null }),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => mockSupabaseQuery,
  }),
}));

import { GET, POST } from '../route';

describe('Instagram Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyMetaSignature.mockResolvedValue(true);
  });

  describe('GET (verification)', () => {
    it('returns challenge when verify_token matches', async () => {
      const url = 'https://unool.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=test_verify_token_123&hub.challenge=test_challenge_abc';
      const request = new NextRequest(url);

      const response = await GET(request);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('test_challenge_abc');
    });

    it('returns 403 when verify_token does not match', async () => {
      const url = 'https://unool.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge_abc';
      const request = new NextRequest(url);

      const response = await GET(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Verification failed');
    });

    it('returns 403 when mode is not subscribe', async () => {
      const url = 'https://unool.com/api/webhooks/instagram?hub.mode=unsubscribe&hub.verify_token=test_verify_token_123&hub.challenge=test_challenge_abc';
      const request = new NextRequest(url);

      const response = await GET(request);
      expect(response.status).toBe(403);
    });
  });

  describe('POST (webhook event)', () => {
    it('rejects missing signature with 401', async () => {
      const request = new NextRequest('https://unool.com/api/webhooks/instagram', {
        method: 'POST',
        body: JSON.stringify({ object: 'instagram' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Missing signature');
    });

    it('rejects invalid HMAC signatures with 401', async () => {
      mockVerifyMetaSignature.mockResolvedValue(false);

      const request = new NextRequest('https://unool.com/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=invalid_hash',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ object: 'instagram' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Invalid signature');
    });

    it('returns 400 when body is invalid JSON', async () => {
      const request = new NextRequest('https://unool.com/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=valid_hash',
        },
        body: 'invalid-json{{{',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid JSON');
    });

    it('skips non-instagram object payloads gracefully and returns 200', async () => {
      const request = new NextRequest('https://unool.com/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=valid_hash',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ object: 'page', entry: [] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.received).toBe(true);
    });

    it('returns 200 immediately for valid comment payload', async () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'ig_user_123',
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_999',
                  text: 'Love this breakdown! Where can I get the guide?',
                  from: { id: 'user_456', username: 'alex_dev' },
                  media: { id: 'media_888' },
                  created_time: '2026-10-14T10:00:00Z',
                },
              },
            ],
          },
        ],
      };

      const request = new NextRequest('https://unool.com/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=valid_hash',
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.received).toBe(true);
    });

    it('handles reply-to-reply comments by skipping processing and returning 200', async () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'ig_user_123',
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_999',
                  parent_id: 'parent_comment_111',
                  text: 'Replying to another comment',
                  from: { id: 'user_456', username: 'alex_dev' },
                },
              },
            ],
          },
        ],
      };

      const request = new NextRequest('https://unool.com/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=valid_hash',
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.received).toBe(true);
    });
  });
});
