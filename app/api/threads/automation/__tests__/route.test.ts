import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Hoist shared mock fns so vi.mock factories can reference them ---
const { mockGetUser, mockVerifyWorkspaceAccess, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockVerifyWorkspaceAccess: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  verifyWorkspaceAccess: mockVerifyWorkspaceAccess,
}));

vi.mock('@/lib/feature-flags-server', () => ({
  isAutomationEnabledServer: vi.fn(),
}));

vi.mock('@/lib/services/automation/linkResolver', () => ({
  resolveCreatorDeliveryLink: vi.fn(),
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

import { GET, PUT } from '../route';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAutomationEnabledServer } from '@/lib/feature-flags-server';
import { resolveCreatorDeliveryLink } from '@/lib/services/automation/linkResolver';

// Helper: build mock Supabase chain for threads_automation_config SELECT
// Route calls: .select('*').eq('workspace_id', id).limit(1).maybeSingle()
function makeThreadsConfigSelect(resolvedValue: { data: any; error: any }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
        }),
      }),
    }),
  };
}

// Helper: build mock for workspaces SELECT
// Route calls: .select('settings').eq('id', id).maybeSingle()
function makeWorkspacesSelect(resolvedValue: { data: any; error: any }) {
  return vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    }),
  });
}

// Helper: platform_connections SELECT
// Route calls: .select('platform_user_id').eq(...).eq(...).eq(...).limit(1).maybeSingle()
function makePlatformConnectionsSelect(resolvedValue: { data: any; error: any }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
            }),
          }),
        }),
      }),
    }),
  };
}

describe('/api/threads/automation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-apply static mock implementations after vi.resetAllMocks() from setup
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
    } as any);
    vi.mocked(isAutomationEnabledServer).mockResolvedValue(true);
    vi.mocked(resolveCreatorDeliveryLink).mockResolvedValue('https://creator.unool.co/bio');
  });

  describe('GET', () => {
    it('returns 401 if unauthenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest('http://localhost:3000/api/threads/automation?workspaceId=ws-1');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 if workspaceId is missing', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
      const req = new NextRequest('http://localhost:3000/api/threads/automation');
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('returns 403 if workspace access denied', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
      mockVerifyWorkspaceAccess.mockResolvedValue(false);
      const req = new NextRequest('http://localhost:3000/api/threads/automation?workspaceId=ws-1');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('returns config from workspaces.settings fallback when table has no row', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
      mockVerifyWorkspaceAccess.mockResolvedValue(true);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'threads_automation_config') {
          return makeThreadsConfigSelect({ data: null, error: null });
        }
        if (table === 'workspaces') {
          return {
            select: makeWorkspacesSelect({
              data: {
                settings: {
                  threads_automation: {
                    enabled: true,
                    max_replies_per_hour: 45,
                    custom_instructions: 'Custom fallback instructions',
                  },
                },
              },
              error: null,
            }),
          };
        }
        return {};
      });

      const req = new NextRequest('http://localhost:3000/api/threads/automation?workspaceId=ws-1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.enabled).toBe(true);
      expect(data.maxRepliesPerHour).toBe(45);
      expect(data.customInstructions).toBe('Custom fallback instructions');
    });
  });

  describe('PUT', () => {
    it('returns 400 when workspaceId is missing in body', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
      const req = new NextRequest('http://localhost:3000/api/threads/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(400);
    });

    it('updates existing row by ID without requiring onConflict constraints', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
      mockVerifyWorkspaceAccess.mockResolvedValue(true);

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'row-123' }, error: null }),
          }),
        }),
      });

      const mockWorkspaceUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'threads_automation_config') {
          return {
            ...makeThreadsConfigSelect({ data: { id: 'row-123', threads_user_id: 'th-1' }, error: null }),
            update: mockUpdate,
          };
        }
        if (table === 'workspaces') {
          return {
            select: makeWorkspacesSelect({ data: { settings: {} }, error: null }),
            update: mockWorkspaceUpdate,
          };
        }
        if (table === 'platform_connections') {
          return makePlatformConnectionsSelect({ data: { platform_user_id: 'th-user' }, error: null });
        }
        return {};
      });

      const req = new NextRequest('http://localhost:3000/api/threads/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws-123',
          enabled: true,
          maxRepliesPerHour: 25,
          customInstructions: 'Never mention competitors.',
        }),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('falls back seamlessly to workspaces.settings if table does not exist', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
      mockVerifyWorkspaceAccess.mockResolvedValue(true);

      const mockWorkspaceUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'threads_automation_config') {
          return makeThreadsConfigSelect({
            data: null,
            error: { code: '42P01', message: 'relation "threads_automation_config" does not exist' },
          });
        }
        if (table === 'workspaces') {
          return {
            select: makeWorkspacesSelect({ data: { settings: {} }, error: null }),
            update: mockWorkspaceUpdate,
          };
        }
        if (table === 'platform_connections') {
          return makePlatformConnectionsSelect({ data: null, error: null });
        }
        return {};
      });

      const req = new NextRequest('http://localhost:3000/api/threads/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws-456',
          enabled: true,
          maxRepliesPerHour: 30,
        }),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockWorkspaceUpdate).toHaveBeenCalled();
    });
  });
});
