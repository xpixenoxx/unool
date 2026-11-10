import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { quickUrlValidation } from '@/lib/utils/url-validation';
import { localToUtc } from '@/hooks/flightplan/useTimezone';

describe('Forensic Audit Root-Cause Fixes Regression Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('FIX-01: middleware strips spoofed x-user-id and x-workspace-id headers', () => {
    it('strips client-supplied x-user-id and x-workspace-id on /api/ routes when unauthenticated', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest('https://unool.co/api/profile', {
        method: 'GET',
        headers: {
          'x-user-id': 'spoofed-victim-user-id',
          'x-workspace-id': 'spoofed-victim-workspace-id',
        },
      });

      const res = await middleware(req);
      // Next.js NextResponse.next({ request: { headers } }) encodes overridden request headers
      // in x-middleware-override-headers / x-middleware-request-*
      const overrideHeaders = res.headers.get('x-middleware-override-headers') || '';
      expect(overrideHeaders).not.toContain('x-user-id');
      expect(overrideHeaders).not.toContain('x-workspace-id');
      expect(res.headers.get('x-middleware-request-x-user-id')).toBeNull();
      expect(res.headers.get('x-middleware-request-x-workspace-id')).toBeNull();
    });
  });

  describe('FIX-08: SSRF protection in url-validation.ts blocks IPv4-mapped IPv6 and private IPs', () => {
    it('blocks direct private IPv4 and metadata endpoints', () => {
      expect(quickUrlValidation('http://127.0.0.1/admin').allowed).toBe(false);
      expect(quickUrlValidation('http://169.254.169.254/latest/meta-data/').allowed).toBe(false);
      expect(quickUrlValidation('http://10.0.0.1/internal').allowed).toBe(false);
      expect(quickUrlValidation('http://192.168.1.1/router').allowed).toBe(false);
    });

    it('blocks IPv4-mapped IPv6 loopback and metadata addresses', () => {
      expect(quickUrlValidation('http://[::ffff:127.0.0.1]/').allowed).toBe(false);
      expect(quickUrlValidation('http://[::ffff:169.254.169.254]/').allowed).toBe(false);
      expect(quickUrlValidation('http://[::1]/').allowed).toBe(false);
    });

    it('allows valid public HTTPS URLs', () => {
      expect(quickUrlValidation('https://github.com/unool').allowed).toBe(true);
    });
  });

  describe('FIX-10: FlightPlan localToUtc timezone offset handling', () => {
    it('correctly converts Asia/Kolkata (+05:30) and America/New_York to UTC ISO strings', () => {
      const sampleDate = new Date(2026, 10, 10); // Nov 10, 2026
      // 15:30 IST (GMT+5:30) -> 10:00 UTC
      const istUtc = localToUtc(sampleDate, 15, 30, 'Asia/Kolkata');
      expect(istUtc).toBe('2026-11-10T10:00:00.000Z');

      // 12:00 UTC -> 12:00 UTC
      const utcResult = localToUtc(sampleDate, 12, 0, 'UTC');
      expect(utcResult).toBe('2026-11-10T12:00:00.000Z');
    });
  });

  describe('FIX-07: /api/cron/instagram-sync fails closed when CRON_SECRET is missing or mismatched', () => {
    it('returns 500 when CRON_SECRET is unset and 401 when Bearer token is invalid', async () => {
      const originalSecret = process.env.CRON_SECRET;
      try {
        delete process.env.CRON_SECRET;
        const { GET } = await import('@/app/api/cron/instagram-sync/route');
        const reqNoSecret = new NextRequest('https://unool.co/api/cron/instagram-sync');
        const res500 = await GET(reqNoSecret);
        expect(res500.status).toBe(500);

        process.env.CRON_SECRET = 'super-secret-cron-token';
        const reqBadAuth = new NextRequest('https://unool.co/api/cron/instagram-sync', {
          headers: { authorization: 'Bearer wrong-token' },
        });
        const res401 = await GET(reqBadAuth);
        expect(res401.status).toBe(401);
      } finally {
        if (originalSecret !== undefined) {
          process.env.CRON_SECRET = originalSecret;
        } else {
          delete process.env.CRON_SECRET;
        }
      }
    });
  });

  describe('FIX-13 (BUG-025): HMAC-signed OAuth state cookie verification', () => {
    it('accepts a validly signed oauth_state cookie and rejects unsigned or tampered cookies', async () => {
      const { createOAuthCookie, parseOAuthCookie } = await import('@/lib/auth/oauth-state');
      const setCookie = createOAuthCookie('oauth_state_123', 'ws_abc', 'user_xyz', 'instagram', '/dashboard');
      const cookiePair = setCookie.split(';')[0];

      const parsed = parseOAuthCookie(cookiePair);
      expect(parsed).not.toBeNull();
      expect(parsed?.state).toBe('oauth_state_123');
      expect(parsed?.data.workspaceId).toBe('ws_abc');
      expect(parsed?.data.userId).toBe('user_xyz');

      // Unsigned legacy base64 cookie must be rejected
      const forgedUnsigned = `oauth_state=${Buffer.from(
        JSON.stringify({ s: 'oauth_state_123', d: { workspaceId: 'victim_ws', userId: 'victim_user', platform: 'instagram', createdAt: Date.now() } })
      ).toString('base64')}`;
      expect(parseOAuthCookie(forgedUnsigned)).toBeNull();

      // Tampered signature must be rejected
      const tampered = cookiePair.slice(0, -2) + 'ZZ';
      expect(parseOAuthCookie(tampered)).toBeNull();
    });
  });

  describe('FIX-16 (BUG-027): Identity-scoped client cache reset on sign-out and account switch', () => {
    it('wipes registered module caches when clearAllClientCaches is called or user scope changes', async () => {
      const { registerClientCacheReset, clearAllClientCaches, syncClientCacheScope } = await import('@/lib/utils/clientCache');
      let mockCacheValue: string | null = 'user-1-cached-data';
      const unregister = registerClientCacheReset(() => {
        mockCacheValue = null;
      });

      try {
        syncClientCacheScope('user_1', 'ws_1');
        expect(mockCacheValue).toBe('user-1-cached-data');

        // Switching to user_2 must automatically wipe the cache
        syncClientCacheScope('user_2', 'ws_2');
        expect(mockCacheValue).toBeNull();

        mockCacheValue = 'user-2-cached-data';
        clearAllClientCaches();
        expect(mockCacheValue).toBeNull();
      } finally {
        unregister();
      }
    });
  });
});

