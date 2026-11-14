import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hmacSha256Hex } from '../verify';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockConfig: Record<string, string | undefined> = {
  FACEBOOK_WEBHOOK_SECRET: 'fb_secret_123',
  FACEBOOK_CLIENT_SECRET: 'fb_app_secret_456',
  META_WEBHOOK_SECRET: undefined,
  THREADS_WEBHOOK_SECRET: 'threads_secret_789',
};

vi.mock('@/lib/config/schema', () => ({
  get config() {
    return mockConfig;
  },
}));

import { verifyWebhookSignature, extractWebhookSignature } from '../verify';

describe('Webhook Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Facebook webhook signature verification', () => {
    it('verifies valid Facebook signature with FACEBOOK_WEBHOOK_SECRET', async () => {
      const payload = JSON.stringify({ object: 'page', entry: [] });
      const secret = 'fb_secret_123';
      const digest = await hmacSha256Hex(payload, secret);
      const signature = `sha256=${digest}`;

      const isValid = await verifyWebhookSignature(payload, signature, 'facebook');
      expect(isValid).toBe(true);
    });

    it('verifies valid Facebook signature when falling back to FACEBOOK_CLIENT_SECRET', async () => {
      mockConfig.FACEBOOK_WEBHOOK_SECRET = undefined;
      const payload = JSON.stringify({ object: 'page', entry: [] });
      const secret = 'fb_app_secret_456';
      const digest = await hmacSha256Hex(payload, secret);
      const signature = `sha256=${digest}`;

      const isValid = await verifyWebhookSignature(payload, signature, 'facebook');
      expect(isValid).toBe(true);
      mockConfig.FACEBOOK_WEBHOOK_SECRET = 'fb_secret_123';
    });

    it('rejects tampered Facebook signature', async () => {
      const payload = JSON.stringify({ object: 'page', entry: [] });
      const signature = 'sha256=invalidhexsignature000000000000000000000000000000000000000000000000';

      const isValid = await verifyWebhookSignature(payload, signature, 'facebook');
      expect(isValid).toBe(false);
    });

    it('extracts signature header for Facebook', () => {
      const req = new Request('https://unool.co/api/webhooks/platform?platform=facebook', {
        headers: {
          'x-hub-signature-256': 'sha256=abc123',
        },
      });

      const extracted = extractWebhookSignature(req, 'facebook');
      expect(extracted).toBe('sha256=abc123');
    });
  });
});

