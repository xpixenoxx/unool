import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as authServer from '@/lib/auth/server';
import * as planMiddleware from '@/lib/middleware/plan-enforcement-middleware';

const {
  mockFindByWorkspaceId,
  mockFindBySubdomain,
  mockCreateProfile,
  mockUpdateProfile,
  mockIsViewerAllowed,
  mockListViewers,
  mockAddViewer,
  mockRemoveViewer,
  mockAdaptForPlatforms,
  mockPostCreate,
  mockCreateVariant,
  mockPlatformFindByWs,
  mockResolveTxt,
} = vi.hoisted(() => ({
  mockFindByWorkspaceId: vi.fn(),
  mockFindBySubdomain: vi.fn(),
  mockCreateProfile: vi.fn(),
  mockUpdateProfile: vi.fn(),
  mockIsViewerAllowed: vi.fn(),
  mockListViewers: vi.fn(),
  mockAddViewer: vi.fn(),
  mockRemoveViewer: vi.fn(),
  mockAdaptForPlatforms: vi.fn(),
  mockPostCreate: vi.fn(),
  mockCreateVariant: vi.fn(),
  mockPlatformFindByWs: vi.fn(),
  mockResolveTxt: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabaseProfileRepository', () => ({
  SupabaseProfileRepository: class {
    findByWorkspaceId = mockFindByWorkspaceId;
    findBySubdomain = mockFindBySubdomain;
    create = mockCreateProfile;
    update = mockUpdateProfile;
    isViewerAllowed = mockIsViewerAllowed;
    listViewers = mockListViewers;
    addViewer = mockAddViewer;
    removeViewer = mockRemoveViewer;
  },
}));

vi.mock('@/lib/repositories/supabase/SupabasePostRepository', () => ({
  SupabasePostRepository: class {
    findByWorkspaceId = vi.fn().mockResolvedValue([]);
    create = mockPostCreate;
    createVariant = mockCreateVariant;
  },
}));

vi.mock('@/lib/repositories/supabase/SupabasePlatformRepository', () => ({
  SupabasePlatformRepository: class {
    findByWorkspaceId = mockPlatformFindByWs;
  },
}));

vi.mock('@/lib/ai/PostAdapter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/PostAdapter')>();
  return {
    ...actual,
    PostAdapter: {
      ...actual.PostAdapter,
      adaptForPlatforms: mockAdaptForPlatforms,
    },
  };
});

vi.mock('dns', () => ({
  default: { promises: { resolveTxt: mockResolveTxt } },
  promises: { resolveTxt: mockResolveTxt },
}));

vi.mock('dns/promises', () => ({
  default: { resolveTxt: mockResolveTxt },
  resolveTxt: mockResolveTxt,
}));

vi.mock('@/lib/auth/findUserByEmail', () => ({
  findUserByEmail: vi.fn().mockResolvedValue({ id: 'viewer-user-2', email: 'viewer@unool.co' }),
}));

vi.mock('@/lib/limits/enforcer', () => ({
  trackAiUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/media/ImageOptimizer', () => ({
  optimizeMediaForPlatform: vi.fn(async (items) => items),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  },
}));

import { GET as getProfile, POST as postProfile } from '@/app/api/profile/route';
import { POST as claimSubdomain } from '@/app/api/subdomains/claim/route';
import { POST as postDomain, PUT as verifyDomain } from '@/app/api/profile/domain/route';
import { resolveAuthorizedPublicProfile, serializePublicProfile } from '@/lib/profile/publicProfilePayload';
import { POST as postComposerAdapt } from '@/app/api/composer/adapt/route';

describe('Profile & Composer API Contracts (PROF-API)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authServer, 'getCurrentAuth').mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
    });
    vi.spyOn(planMiddleware, 'getPlanContext').mockResolvedValue({
      plan: 'spark',
      templateCount: 5,
      features: { custom_domain: false, badge_removal: false, white_label: false },
    } as any);
  });

  it('GET /api/profile returns 401 when unauthenticated', async () => {
    vi.spyOn(authServer, 'getCurrentAuth').mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/profile');
    const res = await getProfile(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/profile rejects javascript: XSS link URLs with 400', async () => {
    const req = new NextRequest('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alex',
        links: [{ label: 'Bad', url: 'javascript:alert(1)' }],
      }),
    });
    const res = await postProfile(req);
    expect(res.status).toBe(400);
  });

  it('POST /api/profile returns 403 PLAN_UPGRADE_REQUIRED when Spark user selects locked Pro template or hides footer badge', async () => {
    const reqTemplate = new NextRequest('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alex',
        theme: { template: 'the-studio' },
      }),
    });
    const res1 = await postProfile(reqTemplate);
    expect(res1.status).toBe(403);
    const body1 = await res1.json();
    expect(body1.code).toBe('PLAN_UPGRADE_REQUIRED');

    const reqBadge = new NextRequest('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alex',
        theme: {
          template: 'lone',
          sectionVisibility: {
            proofs: true,
            openTo: true,
            activity: true,
            contactCta: true,
            footerBadge: false,
          },
        },
      }),
    });
    const res2 = await postProfile(reqBadge);
    expect(res2.status).toBe(403);
    const body2 = await res2.json();
    expect(body2.code).toBe('PLAN_UPGRADE_REQUIRED');
  });

  it('POST /api/profile propagates 409 VERSION_CONFLICT on optimistic lock collision', async () => {
    mockFindByWorkspaceId.mockResolvedValue({
      id: 'prof-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      subdomain: 'alex',
      version: 5,
      theme: { template: 'lone', preset: 'minimal', accentColor: '#2563EB' },
    });
    mockUpdateProfile.mockRejectedValue(new Error('VERSION_CONFLICT'));

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alex Updated', version: 4 }),
    });
    const res = await postProfile(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe('VERSION_CONFLICT');
  });

  it('POST /api/subdomains/claim rejects reserved names and conflicts, succeeds when available', async () => {
    const reqReserved = new NextRequest('http://localhost/api/subdomains/claim', {
      method: 'POST',
      body: JSON.stringify({ subdomain: 'admin' }),
    });
    expect((await claimSubdomain(reqReserved)).status).toBe(400);

    mockFindBySubdomain.mockResolvedValue({ id: 'other-prof', workspaceId: 'ws-other' });
    mockFindByWorkspaceId.mockResolvedValue({ id: 'prof-1', workspaceId: 'ws-1', version: 1 });
    const reqTaken = new NextRequest('http://localhost/api/subdomains/claim', {
      method: 'POST',
      body: JSON.stringify({ subdomain: 'taken-handle' }),
    });
    expect((await claimSubdomain(reqTaken)).status).toBe(409);

    mockFindBySubdomain.mockResolvedValue(null);
    mockUpdateProfile.mockResolvedValue({
      id: 'prof-1',
      subdomain: 'alex-new',
      version: 2,
    });
    const reqOk = new NextRequest('http://localhost/api/subdomains/claim', {
      method: 'POST',
      body: JSON.stringify({ subdomain: 'alex-new' }),
    });
    const resOk = await claimSubdomain(reqOk);
    expect(resOk.status).toBe(200);
    expect((await resOk.json()).subdomain).toBe('alex-new');
  });

  it('Custom domain API gates Spark plan with 403 and verifies TXT DNS on Pro plan', async () => {
    const reqBlocked = new NextRequest('http://localhost/api/profile/domain', {
      method: 'POST',
      body: JSON.stringify({ domain: 'bio.alex.dev' }),
    });
    expect((await postDomain(reqBlocked)).status).toBe(403);

    vi.spyOn(planMiddleware, 'getPlanContext').mockResolvedValue({
      plan: 'pro',
      templateCount: 16,
      features: { custom_domain: true, badge_removal: true, white_label: false },
    } as any);

    mockFindByWorkspaceId.mockResolvedValue({
      id: 'prof-1',
      workspaceId: 'ws-1',
      subdomain: 'alex',
      customDomain: 'bio.alex.dev',
      customDomainVerificationToken: 'token-123',
      customDomainVerifiedAt: null,
      version: 2,
    });

    mockResolveTxt.mockResolvedValue([['unool-verify=token-123']]);
    mockUpdateProfile.mockResolvedValue({
      id: 'prof-1',
      customDomain: 'bio.alex.dev',
      customDomainVerifiedAt: new Date().toISOString(),
    });

    const resVerify = await verifyDomain(new NextRequest('http://localhost/api/profile/domain', { method: 'PUT' }));
    expect(resVerify.status).toBe(200);
    const data = await resVerify.json();
    expect(data.verified).toBe(true);
  });

  it('resolveAuthorizedPublicProfile hides email by default and enforces private viewer allowlist', async () => {
    const baseProfile = {
      id: 'prof-priv',
      workspaceId: 'ws-1',
      userId: 'user-1',
      subdomain: 'secret-founder',
      name: 'Secret Founder',
      headline: 'Stealth',
      bio: 'Confidential',
      role: 'Founder',
      company: 'Stealth Co',
      avatarUrl: null,
      email: 'private@stealth.co',
      showEmail: false,
      visibility: 'private',
      links: [{ id: '1', label: 'Bad', url: 'javascript:alert(1)' }],
      proofPoints: [],
      openTo: [],
      theme: { template: 'lone', preset: 'minimal', accentColor: '#2563EB' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    // Never leaks email or javascript: links even when serialized
    const serialized = await serializePublicProfile(baseProfile);
    expect(serialized.email).toBeUndefined();
    expect(serialized.links).toEqual([]);

    mockFindBySubdomain.mockResolvedValue(baseProfile);
    mockIsViewerAllowed.mockResolvedValue(false);

    // Anonymous / unauthorized viewer gets not_found on private profile
    expect((await resolveAuthorizedPublicProfile('secret-founder', null)).status).toBe('not_found');
    expect((await resolveAuthorizedPublicProfile('secret-founder', { userId: 'stranger' })).status).toBe('not_found');

    // Allowed viewer gets profile
    mockIsViewerAllowed.mockResolvedValue(true);
    expect((await resolveAuthorizedPublicProfile('secret-founder', { userId: 'viewer-2' })).status).toBe('found');

    // Owner always gets profile
    mockIsViewerAllowed.mockResolvedValue(false);
    expect((await resolveAuthorizedPublicProfile('secret-founder', { userId: 'user-1' })).status).toBe('found');
  });

  it('POST /api/composer/adapt auto-provisions profile instead of 400 gate and rejects foreign profileId', async () => {
    vi.spyOn(planMiddleware.planEnforcement, 'useAI').mockImplementation((async (req: NextRequest, handler: any) => {
      return handler(req, { plan: 'pro' });
    }) as any);

    // 1. Foreign profileId rejected with 403
    mockFindByWorkspaceId.mockResolvedValue({ id: 'ws1-prof', workspaceId: 'ws-1', name: 'Owner' });
    const foreignReq = new NextRequest('http://localhost/api/composer/adapt', {
      method: 'POST',
      body: JSON.stringify({
        content: 'We shipped our Q2 release with faster builds and zero downtime today!',
        profileId: 'foreign-prof-999',
        selectedPlatforms: ['x'],
      }),
    });
    expect((await postComposerAdapt(foreignReq)).status).toBe(403);

    // 2. When workspace has no profile yet, auto-provisions and adapts without 400 error
    mockFindByWorkspaceId.mockResolvedValue(null);
    mockCreateProfile.mockResolvedValue({
      id: 'auto-prof-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      subdomain: 'user-1-auto',
      name: 'Creator',
      studioProfile: null,
    });
    mockPlatformFindByWs.mockResolvedValue([
      { id: 'conn-1', platform: 'x', status: 'connected' },
    ]);
    mockAdaptForPlatforms.mockResolvedValue({
      x: {
        ok: true,
        value: { content: 'Shipped Q2 release today!', characterCount: 25, hashtags: [] },
      },
    });
    mockPostCreate.mockResolvedValue({ id: 'post-1' });
    mockCreateVariant.mockResolvedValue({ id: 'var-1', platform: 'x', platformConnectionId: 'conn-1' });

    const newReq = new NextRequest('http://localhost/api/composer/adapt', {
      method: 'POST',
      body: JSON.stringify({
        content: 'We shipped our Q2 release with faster builds and zero downtime today!',
        selectedPlatforms: ['x'],
      }),
    });
    const okRes = await postComposerAdapt(newReq);
    expect(okRes.status).toBe(200);
    expect(mockCreateProfile).toHaveBeenCalledTimes(1);
    const data = await okRes.json();
    expect(data.postId).toBe('post-1');
  });
});
