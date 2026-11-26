import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockGetUser,
  mockVerifyWorkspaceAccess,
  mockEnforcePlanLimits,
  mockIsAutomationEnabledServer,
  mockFrom,
  mockR2Send,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockVerifyWorkspaceAccess: vi.fn(),
  mockEnforcePlanLimits: vi.fn(),
  mockIsAutomationEnabledServer: vi.fn(),
  mockFrom: vi.fn(),
  mockR2Send: vi.fn(),
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  verifyWorkspaceAccess: mockVerifyWorkspaceAccess,
}));

vi.mock('@/lib/entitlements', () => ({
  enforcePlanLimits: mockEnforcePlanLimits,
}));

vi.mock('@/lib/feature-flags-server', () => ({
  isAutomationEnabledServer: mockIsAutomationEnabledServer,
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/storage/r2', () => ({
  getR2Client: vi.fn(),
  getBucketName: vi.fn(),
}));

import { PUT } from '../route';
import { POST as uploadPOST } from '../upload/route';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBucketName, getR2Client } from '@/lib/storage/r2';

describe('/api/brand-materials & /api/brand-materials/upload', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
    } as any);
    vi.mocked(getR2Client).mockReturnValue({ send: mockR2Send } as any);
    vi.mocked(getBucketName).mockReturnValue('post-media-bucket');
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockVerifyWorkspaceAccess.mockResolvedValue(true);
    mockIsAutomationEnabledServer.mockResolvedValue(true);
    mockEnforcePlanLimits.mockResolvedValue({
      allowed: true,
      checks: {},
      workspacePlan: { planId: 'creator' },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 400 on invalid JSON payload in PUT', async () => {
    const req = new NextRequest('http://localhost/api/brand-materials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    });

    const res = await PUT(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid request payload');
  });

  it('returns 403 PLAN_LIMIT_EXCEEDED with clear error message when creating a new page over plan limit', async () => {
    mockEnforcePlanLimits.mockResolvedValue({
      allowed: false,
      checks: {
        brand_voices: {
          allowed: false,
          limit: 1,
          current: 1,
          remaining: 0,
          message: 'Limit reached: Brand voices (1/1)',
        },
      },
      workspacePlan: { planId: 'creator' },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'brand_materials_pages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new NextRequest('http://localhost/api/brand-materials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: 'ws-1',
        platform: 'facebook',
        slug: 'post-mwx2erao',
        title: 'My Photo Page',
        materials: [],
        linked_posts: ['fb_post_1'],
      }),
    });

    const res = await PUT(req);
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.code).toBe('PLAN_LIMIT_EXCEEDED');
    expect(json.error).toBe('Limit reached: Brand voices (1/1)');
  });

  it('saves Facebook page with photo, deduplicates data URI thumbnailUrl, and preserves linked_posts in pages', async () => {
    let capturedUpsertPayload: any = null;
    const savedRow = {
      id: 'page-1',
      workspace_id: 'ws-1',
      slug: 'post-mwx2erao',
      title: 'Photo Launch',
      materials: [{ id: 'm1', type: 'image', title: 'Pic', url: 'data:image/png;base64,AAA' }],
      theme: { accentColor: '#8B5CF6', template: 'the-voice', linked_posts: ['fb_post_1'] },
      is_published: true,
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'brand_materials_pages') {
        return {
          select: vi.fn().mockImplementation((cols: string) => {
            if (cols === 'id') {
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              };
            }
            return {
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [savedRow], error: null }),
              }),
            };
          }),
          upsert: vi.fn().mockImplementation((payload: any) => {
            capturedUpsertPayload = payload;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: savedRow, error: null }),
              }),
            };
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { subdomain: 'usha', name: 'Usha', theme: { template: 'the-voice' } },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'facebook_automation_config') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'workspaces') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { settings: {} }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new NextRequest('http://localhost/api/brand-materials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: 'ws-1',
        platform: 'facebook',
        slug: 'post-mwx2erao',
        title: 'Photo Launch',
        materials: [
          {
            id: 'm1',
            type: 'image',
            title: 'Pic',
            url: 'data:image/png;base64,AAA',
            thumbnailUrl: 'data:image/png;base64,AAA',
          },
        ],
        linked_posts: ['fb_post_1'],
        theme: { linked_posts: ['fb_post_1'] },
      }),
    });

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.slug).toBe('post-mwx2erao');
    expect(json.pageUrl).toBe('https://usha.unool.co/post-mwx2erao');
    expect(capturedUpsertPayload.materials[0].thumbnailUrl).toBeUndefined();
    expect(json.pages[0].linked_posts).toEqual(['fb_post_1']);
  });

  it('uploads photo to R2 via PutObjectCommand without requiring CF_R2_MEDIA_PUBLIC_URL', async () => {
    process.env.CF_R2_ACCOUNT_ID = 'acct';
    process.env.CF_R2_ACCESS_KEY_ID = 'key';
    process.env.CF_R2_SECRET_ACCESS_KEY = 'secret';
    delete process.env.CF_R2_MEDIA_PUBLIC_URL;
    delete process.env.CF_R2_PUBLIC_URL;
    mockR2Send.mockResolvedValue({});

    const bytes = new Uint8Array([1, 2, 3]);
    const mockFile = {
      name: 'photo.jpg',
      type: 'image/jpeg',
      size: bytes.byteLength,
      arrayBuffer: async () => bytes.buffer,
    };

    const req = {
      formData: async () => ({
        get: (field: string) => (field === 'file' ? mockFile : null),
      }),
    } as unknown as NextRequest;

    const res = await uploadPOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.type).toBe('image');
    expect(json.url).toMatch(/^\/api\/media\/materials\//);
    expect(mockR2Send).toHaveBeenCalledTimes(1);
  });

  it('returns 413 instead of bloated base64 when R2 is unconfigured and file exceeds 1.5 MB', async () => {
    delete process.env.CF_R2_ACCOUNT_ID;
    delete process.env.CF_R2_ACCESS_KEY_ID;
    delete process.env.CF_R2_SECRET_ACCESS_KEY;

    const bigBytes = new Uint8Array(1.6 * 1024 * 1024);
    const mockFile = {
      name: 'big.jpg',
      type: 'image/jpeg',
      size: bigBytes.byteLength,
      arrayBuffer: async () => bigBytes.buffer,
    };

    const req = {
      formData: async () => ({
        get: (field: string) => (field === 'file' ? mockFile : null),
      }),
    } as unknown as NextRequest;

    const res = await uploadPOST(req);
    const json = await res.json();

    expect(res.status).toBe(413);
    expect(json.error).toContain('too large for inline upload');
  });
});
