import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  verifyCustomDomainTxtRecord,
  provisionCloudflareCustomHostname,
  removeCloudflareCustomHostname,
} from '@/lib/domains/cloudflareCustomDomains';

const {
  mockGetCurrentAuth,
  mockRequireWorkspaceRole,
  mockClearMembershipCache,
  mockFindPostById,
} = vi.hoisted(() => ({
  mockGetCurrentAuth: vi.fn(),
  mockRequireWorkspaceRole: vi.fn(),
  mockClearMembershipCache: vi.fn(),
  mockFindPostById: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: mockGetCurrentAuth,
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  requireWorkspaceRole: mockRequireWorkspaceRole,
  clearWorkspaceMembershipCache: mockClearMembershipCache,
  listUserWorkspaces: vi.fn().mockResolvedValue([]),
  normalizeWorkspaceRole: (r: unknown) => {
    const s = String(r || 'viewer').toLowerCase();
    return ['owner', 'admin', 'editor', 'viewer'].includes(s) ? s : 'viewer';
  },
}));

vi.mock('@/lib/repositories/supabase/SupabasePostRepository', () => ({
  SupabasePostRepository: class {
    findById = mockFindPostById;
    findVariantsByPostId = vi.fn().mockResolvedValue([]);
  },
}));

import { DELETE as deletePostById } from '@/app/api/publish/[postId]/route';

describe('Phase 3 — Cloudflare-Native Custom Domains & Workspace RBAC', () => {
  const originalFetch = globalThis.fetch;
  const originalZoneId = process.env.CLOUDFLARE_ZONE_ID;
  const originalApiToken = process.env.CLOUDFLARE_API_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentAuth.mockResolvedValue({ userId: 'u-viewer', workspaceId: 'ws-1' });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalZoneId === undefined) delete process.env.CLOUDFLARE_ZONE_ID;
    else process.env.CLOUDFLARE_ZONE_ID = originalZoneId;
    if (originalApiToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
    else process.env.CLOUDFLARE_API_TOKEN = originalApiToken;
  });

  it('verifies TXT records over Cloudflare DNS-over-HTTPS (1.1.1.1 edge fallback)', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('cloudflare-dns.com/dns-query') && url.includes('_unool-challenge.bio.founder.dev')) {
        return new Response(
          JSON.stringify({
            Status: 0,
            Answer: [
              {
                name: '_unool-challenge.bio.founder.dev.',
                type: 16,
                data: '"unool-verify=abc999def000"',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/dns-json' } }
        );
      }
      return new Response(JSON.stringify({ Answer: [] }), { status: 200 });
    });

    const verified = await verifyCustomDomainTxtRecord(
      'bio.founder.dev',
      'unool-verify=abc999def000',
      { forceDoh: true }
    );
    expect(verified).toBe(true);

    const wrongToken = await verifyCustomDomainTxtRecord(
      'bio.founder.dev',
      'unool-verify=wrong',
      { forceDoh: true }
    );
    expect(wrongToken).toBe(false);
  });

  it('provisions and removes Cloudflare for SaaS Custom Hostnames when zone credentials are set', async () => {
    process.env.CLOUDFLARE_ZONE_ID = 'zone_test_123';
    process.env.CLOUDFLARE_API_TOKEN = 'cf_tok_secret';

    const methods: string[] = [];
    globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';
      methods.push(`${method}:${url}`);

      if (method === 'GET' && url.includes('/custom_hostnames?hostname=bio.founder.dev')) {
        // First lookup during provision returns empty; second lookup during remove returns existing ID
        if (methods.filter((m) => m.startsWith('GET:')).length === 1) {
          return new Response(JSON.stringify({ success: true, result: [] }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            success: true,
            result: [{ id: 'cf_ch_77', hostname: 'bio.founder.dev', status: 'active', ssl: { status: 'active' } }],
          }),
          { status: 200 }
        );
      }

      if (method === 'POST' && url.endsWith('/zones/zone_test_123/custom_hostnames')) {
        return new Response(
          JSON.stringify({
            success: true,
            result: {
              id: 'cf_ch_77',
              hostname: 'bio.founder.dev',
              status: 'pending',
              ssl: { status: 'pending_validation' },
            },
          }),
          { status: 200 }
        );
      }

      if (method === 'DELETE' && url.endsWith('/zones/zone_test_123/custom_hostnames/cf_ch_77')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      return new Response('{}', { status: 404 });
    });

    const created = await provisionCloudflareCustomHostname('bio.founder.dev');
    expect(created?.id).toBe('cf_ch_77');
    expect(created?.sslStatus).toBe('pending_validation');

    const removed = await removeCloudflareCustomHostname('bio.founder.dev');
    expect(removed).toBe(true);
  });

  it('blocks viewer workspace members from deleting posts (403 Forbidden)', async () => {
    mockFindPostById.mockResolvedValue({
      id: 'post-protected-1',
      workspaceId: 'ws-1',
      qstashMessageId: null,
    });
    mockRequireWorkspaceRole.mockResolvedValue({
      allowed: false,
      reason: 'insufficient_role',
      role: 'viewer',
    });

    const req = new NextRequest('http://localhost:3000/api/publish/post-protected-1', {
      method: 'DELETE',
    });
    const res = await deletePostById(req, { params: Promise.resolve({ postId: 'post-protected-1' }) });
    expect(res.status).toBe(403);
  });
});
