import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetCurrentAuth = vi.fn();
const mockVerifyWorkspaceAccess = vi.fn();
const mockEnforcePlanLimits = vi.fn();
const mockLoadWorkspaceSignalAnalytics = vi.fn();

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: (...args: unknown[]) => mockGetCurrentAuth(...args),
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  verifyWorkspaceAccess: (...args: unknown[]) => mockVerifyWorkspaceAccess(...args),
}));

vi.mock('@/lib/plan-enforcement', () => ({
  enforcePlanLimits: (...args: unknown[]) => mockEnforcePlanLimits(...args),
  getWorkspacePlanInfo: vi.fn().mockResolvedValue({
    planId: 'pro',
    planName: 'Pro',
    limits: { analytics_retention_days: 365 },
    features: { csv_export: true },
  }),
}));

vi.mock('@/lib/analytics/signalDataLoader', async importOriginal => {
  const orig = await importOriginal<typeof import('@/lib/analytics/signalDataLoader')>();
  return {
    ...orig,
    loadWorkspaceSignalAnalytics: (...args: unknown[]) => mockLoadWorkspaceSignalAnalytics(...args),
  };
});

vi.mock('@/lib/services/analytics/syncEngagement', () => ({
  syncWorkspaceEngagement: vi.fn().mockResolvedValue({
    syncedCount: 1,
    failedCount: 0,
    skippedCount: 0,
    unsupportedCount: 0,
    expiredTokenCount: 0,
    rateLimitedCount: 0,
    postsEngagement: {},
    errors: [],
  }),
}));

vi.mock('@/lib/services/ScheduleService', () => ({
  scheduleService: { processDueScheduledPosts: vi.fn().mockResolvedValue({ processed: 0 }) },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('Signal API Authorization, Isolation & Export Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests across /api/signal/analytics, /api/signal/export, /api/signal/posts/[postId], and /api/profile/analytics', async () => {
    mockGetCurrentAuth.mockResolvedValue(null);

    const { GET: getAnalytics } = await import('@/app/api/signal/analytics/route');
    const { GET: getExport } = await import('@/app/api/signal/export/route');
    const { GET: getPostDetail } = await import('@/app/api/signal/posts/[postId]/route');
    const { GET: getProfileAnalytics } = await import('@/app/api/profile/analytics/route');

    const resA = await getAnalytics(new NextRequest('http://localhost:3000/api/signal/analytics'));
    const resE = await getExport(new NextRequest('http://localhost:3000/api/signal/export'));
    const resP = await getPostDetail(new NextRequest('http://localhost:3000/api/signal/posts/p1'), {
      params: Promise.resolve({ postId: 'p1' }),
    });
    const resPA = await getProfileAnalytics(
      new NextRequest('http://localhost:3000/api/profile/analytics?workspaceId=victim-ws')
    );

    expect(resA.status).toBe(401);
    expect(resE.status).toBe(401);
    expect(resP.status).toBe(401);
    expect(resPA.status).toBe(401);
  });

  it('blocks cross-tenant workspaceId access with 403 Forbidden', async () => {
    mockGetCurrentAuth.mockResolvedValue({ userId: 'user-1', workspaceId: 'ws-own' });
    mockVerifyWorkspaceAccess.mockResolvedValue(false);

    const { GET: getAnalytics } = await import('@/app/api/signal/analytics/route');
    const { GET: getExport } = await import('@/app/api/signal/export/route');
    const { GET: getProfileAnalytics } = await import('@/app/api/profile/analytics/route');

    const resA = await getAnalytics(
      new NextRequest('http://localhost:3000/api/signal/analytics?workspaceId=ws-victim')
    );
    const resE = await getExport(
      new NextRequest('http://localhost:3000/api/signal/export?workspaceId=ws-victim')
    );
    const resPA = await getProfileAnalytics(
      new NextRequest('http://localhost:3000/api/profile/analytics?workspaceId=ws-victim')
    );

    expect(resA.status).toBe(403);
    expect(resE.status).toBe(403);
    expect(resPA.status).toBe(403);
  });

  it('enforces plan csv_export entitlement on /api/signal/export and exports CSV cleanly when allowed', async () => {
    mockGetCurrentAuth.mockResolvedValue({ userId: 'user-1', workspaceId: 'ws-1' });
    const { GET: getExport } = await import('@/app/api/signal/export/route');

    // Plan denies CSV export
    mockEnforcePlanLimits.mockResolvedValueOnce({
      allowed: false,
      workspacePlan: { planName: 'Spark' },
      checks: { csv_export: { allowed: false, message: 'CSV export requires Pro plan' } },
    });

    const denied = await getExport(new NextRequest('http://localhost:3000/api/signal/export'));
    expect(denied.status).toBe(403);
    const deniedJson = await denied.json();
    expect(deniedJson.code).toBe('PLAN_LIMIT_EXCEEDED');

    // Plan allows CSV export
    mockEnforcePlanLimits.mockResolvedValueOnce({
      allowed: true,
      workspacePlan: { planName: 'Pro' },
      checks: { csv_export: { allowed: true } },
    });

    mockLoadWorkspaceSignalAnalytics.mockResolvedValueOnce({
      analytics: {
        meta: { effectiveRange: '30d' },
        posts: [
          {
            id: 'p-1',
            content: '=HYPERLINK("bad") Growth note',
            effectiveStatus: 'published',
            originKind: 'studio',
            hookType: 'question',
            wordCount: 5,
            hasMedia: false,
            publishedAt: '2026-11-15T10:00:00Z',
            createdAt: '2026-11-15T09:00:00Z',
            variants: [
              {
                id: 'v-1',
                canonicalPlatform: 'linkedin',
                accountLabel: 'Founder LI',
                platformAccountId: 'li-1',
                status: 'published',
                views: null,
                likes: 12,
                comments: 3,
                shares: 1,
                saves: 0,
                clicks: 0,
                totalEngagements: 16,
                engagementRate: null,
                syncStatus: 'synced',
                platformUrl: 'https://linkedin.com/feed/update/1',
                adaptedContent: 'Adapted copy',
              },
            ],
          },
        ],
      },
      rawPosts: [],
      rawVariantsByPost: {},
    });

    const okRes = await getExport(new NextRequest('http://localhost:3000/api/signal/export?range=30d'));
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get('Content-Type')).toContain('text/csv');
    const csvText = await okRes.text();
    expect(csvText).toContain('post_id,variant_id');
    expect(csvText).toContain('linkedin,Founder LI,published,N/A,12,3,1,0,0,16,N/A');
  });
});
