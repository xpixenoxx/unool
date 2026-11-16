import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockGetCurrentAuth,
  mockCheckRateLimit,
  mockListUserWorkspaces,
  mockVerifyWorkspaceAccess,
  mockGetWorkspaceMembership,
  mockRequireWorkspaceRole,
  mockGetFeatureFlagsServer,
  mockFrom,
  mockGetUserById,
  mockRpc,
} = vi.hoisted(() => ({
  mockGetCurrentAuth: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockListUserWorkspaces: vi.fn(),
  mockVerifyWorkspaceAccess: vi.fn(),
  mockGetWorkspaceMembership: vi.fn(),
  mockRequireWorkspaceRole: vi.fn(),
  mockGetFeatureFlagsServer: vi.fn(),
  mockFrom: vi.fn(),
  mockGetUserById: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: mockGetCurrentAuth,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  listUserWorkspaces: mockListUserWorkspaces,
  verifyWorkspaceAccess: mockVerifyWorkspaceAccess,
  getWorkspaceMembership: mockGetWorkspaceMembership,
  requireWorkspaceRole: mockRequireWorkspaceRole,
}));

vi.mock('@/lib/feature-flags-server', () => ({
  getFeatureFlagsServer: mockGetFeatureFlagsServer,
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  },
}));

import { GET as exportGet } from '@/app/api/user/export/route';
import { GET as prefsGet, PATCH as prefsPatch } from '@/app/api/user/preferences/route';
import { GET as keysGet } from '@/app/api/keys/route';
import { POST as switchWorkspacePost } from '@/app/api/workspace/switch/route';
import { POST as transferOwnershipPost } from '@/app/api/workspace/transfer-ownership/route';

describe('User & Workspace Settings API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 10, reset: 60 });
    mockGetFeatureFlagsServer.mockResolvedValue({ public_api_enabled: false });
  });

  describe('GET /api/user/export', () => {
    it('blocks unauthenticated and impersonated requests and returns sanitized JSON attachment', async () => {
      mockGetCurrentAuth.mockResolvedValueOnce(null);
      expect((await exportGet(new NextRequest('http://localhost:3000/api/user/export'))).status).toBe(401);

      mockGetCurrentAuth.mockResolvedValueOnce({
        userId: 'user-12345678',
        workspaceId: 'ws-1',
        email: 'creator@example.com',
        isImpersonated: true,
      });
      const impRes = await exportGet(new NextRequest('http://localhost:3000/api/user/export'));
      expect(impRes.status).toBe(403);
      expect((await impRes.json()).code).toBe('IMPERSONATION_BLOCKED');

      mockGetCurrentAuth.mockResolvedValueOnce({
        userId: 'user-12345678',
        workspaceId: 'ws-1',
        email: 'creator@example.com',
        isImpersonated: false,
      });
      mockGetUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-12345678',
            email: 'creator@example.com',
            created_at: '2026-01-01T00:00:00Z',
            user_metadata: { full_name: 'Asha' },
          },
        },
        error: null,
      });
      mockListUserWorkspaces.mockResolvedValueOnce([
        { workspaceId: 'ws-1', name: 'Asha Studio', role: 'owner' },
      ]);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users' || table === 'user_preferences') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: [{ id: 'p-1', subdomain: 'asha', studio_profile: { role: 'Educator' } }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'platform_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'c-1', platform: 'linkedin', platform_username: 'asha', is_active: true }],
                error: null,
              }),
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      });

      const okRes = await exportGet(new NextRequest('http://localhost:3000/api/user/export'));
      const jsonText = await okRes.text();
      const parsed = JSON.parse(jsonText);

      expect(okRes.status).toBe(200);
      expect(okRes.headers.get('content-disposition')).toContain('unool-export-user-123.json');
      expect(okRes.headers.get('cache-control')).toContain('no-store');
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.studioProfile).toEqual({ role: 'Educator' });
      expect(parsed.profiles[0]).not.toHaveProperty('studio_profile');
      expect(parsed.connectedChannels).toHaveLength(1);
    });
  });

  describe('/api/user/preferences', () => {
    it('returns default regional and notification preferences cleanly when pre-migration tables are absent', async () => {
      mockGetCurrentAuth.mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'creator@example.com',
        isImpersonated: false,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_preferences') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'relation "user_preferences" does not exist' },
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'workspaces') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      settings: {
                        preferences: {
                          timezone: 'Asia/Kolkata',
                          currencyDisplay: 'INR',
                          aiPersonalizationEnabled: false,
                        },
                      },
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await prefsGet(new NextRequest('http://localhost:3000/api/user/preferences'));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.preferences.timezone).toBe('Asia/Kolkata');
      expect(body.preferences.aiPersonalizationEnabled).toBe(false);
    });

    it('validates and persists updated regional + AI preferences via PATCH', async () => {
      mockGetCurrentAuth.mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'creator@example.com',
        isImpersonated: false,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_preferences') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    timezone: 'America/New_York',
                    time_format: '24h',
                    date_format: 'YYYY-MM-DD',
                    currency_display: 'USD',
                    ai_personalization_enabled: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { settings: {} }, error: null }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      const req = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          timezone: 'America/New_York',
          timeFormat: '24h',
          dateFormat: 'YYYY-MM-DD',
          currencyDisplay: 'USD',
          aiPersonalizationEnabled: false,
        }),
      });
      const res = await prefsPatch(req);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.preferences).toEqual(
        expect.objectContaining({
          timezone: 'America/New_York',
          timeFormat: '24h',
          dateFormat: 'YYYY-MM-DD',
          currencyDisplay: 'USD',
          aiPersonalizationEnabled: false,
        })
      );
    });
  });

  describe('GET /api/keys feature-flag gate', () => {
    it('returns 503 FEATURE_DISABLED when public_api_enabled flag is false', async () => {
      mockGetFeatureFlagsServer.mockResolvedValueOnce({ public_api_enabled: false });
      const res = await keysGet(new NextRequest('http://localhost:3000/api/keys'));
      const body = await res.json();
      expect(res.status).toBe(503);
      expect(body.code).toBe('FEATURE_DISABLED');
    });
  });

  describe('POST /api/workspace/switch', () => {
    it('validates UUID format, rejects non-members, and sets active_workspace_id HttpOnly cookie', async () => {
      mockGetCurrentAuth.mockResolvedValue({
        userId: 'user-1',
        workspaceId: '11111111-1111-4111-8111-111111111111',
        email: 'u@example.com',
        isImpersonated: false,
      });

      const badReq = new NextRequest('http://localhost:3000/api/workspace/switch', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: 'not-a-uuid' }),
      });
      expect((await switchWorkspacePost(badReq)).status).toBe(400);

      mockVerifyWorkspaceAccess.mockResolvedValueOnce(false);
      const forbiddenReq = new NextRequest('http://localhost:3000/api/workspace/switch', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: '22222222-2222-4222-8222-222222222222' }),
      });
      expect((await switchWorkspacePost(forbiddenReq)).status).toBe(403);

      mockVerifyWorkspaceAccess.mockResolvedValueOnce(true);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: '22222222-2222-4222-8222-222222222222', name: 'Studio Two' },
                error: null,
              }),
            }),
          }),
        }),
      });
      const okReq = new NextRequest('http://localhost:3000/api/workspace/switch', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: '22222222-2222-4222-8222-222222222222' }),
      });
      const okRes = await switchWorkspacePost(okReq);
      expect(okRes.status).toBe(200);
      expect(okRes.cookies.get('active_workspace_id')?.value).toBe(
        '22222222-2222-4222-8222-222222222222'
      );
    });
  });

  describe('POST /api/workspace/transfer-ownership', () => {
    it('blocks impersonated sessions and non-owners from transferring ownership', async () => {
      mockGetCurrentAuth.mockResolvedValueOnce({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'u@example.com',
        isImpersonated: true,
      });
      const impRes = await transferOwnershipPost(
        new NextRequest('http://localhost:3000/api/workspace/transfer-ownership', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: '33333333-3333-4333-8333-333333333333' }),
        })
      );
      expect(impRes.status).toBe(403);
      expect((await impRes.json()).code).toBe('IMPERSONATION_BLOCKED');

      mockGetCurrentAuth.mockResolvedValueOnce({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'u@example.com',
        isImpersonated: false,
      });
      mockRequireWorkspaceRole.mockResolvedValueOnce({
        allowed: false,
        reason: 'insufficient_role',
        role: 'admin',
      });
      const nonOwnerRes = await transferOwnershipPost(
        new NextRequest('http://localhost:3000/api/workspace/transfer-ownership', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: '33333333-3333-4333-8333-333333333333' }),
        })
      );
      expect(nonOwnerRes.status).toBe(403);
    });
  });
});