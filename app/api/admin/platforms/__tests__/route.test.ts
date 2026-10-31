import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabaseAdminRepository', () => ({
  adminRepository: {
    logAdminAction: vi.fn(),
  },
}));

const mockFrom = vi.fn();
const mockListUsers = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (...args: any[]) => mockFrom(...args),
    auth: {
      admin: {
        listUsers: (...args: any[]) => mockListUsers(...args),
      },
    },
  })),
}));

import { GET, DELETE } from '../route';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

describe('Admin Platforms API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/platforms', () => {
    it('returns platform connections with resolved user and workspace information and full platformStats', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co' },
      } as any);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'platform_connections') {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'conn-1',
                    workspace_id: 'ws-1',
                    user_id: 'user-1',
                    platform: 'pinterest',
                    username: 'shruthibramha2006',
                    status: 'connected',
                    expires_at: '2026-11-30T00:00:00Z',
                    created_at: '2026-10-31T00:00:00Z',
                    updated_at: '2026-10-31T00:00:00Z',
                    workspaces: { id: 'ws-1', name: 'My Workspace', owner_id: 'user-1' },
                  },
                  {
                    id: 'conn-2',
                    workspace_id: 'ws-2',
                    user_id: null,
                    platform: 'linkedin',
                    username: 'alex_growth',
                    status: 'connected',
                    expires_at: null,
                    created_at: '2026-10-30T00:00:00Z',
                    updated_at: '2026-10-30T00:00:00Z',
                    workspaces: { id: 'ws-2', name: 'Acme Agency', owner_id: 'user-2' },
                  },
                ],
                error: null,
              }),
            })),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { id: 'user-1', email: 'shruthibramha2006@gmail.com', full_name: 'Shruthi Bramha' },
              ],
              error: null,
            }),
          };
        }
        if (table === 'workspaces') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { id: 'ws-1', name: 'My Workspace', owner_id: 'user-1' },
                { id: 'ws-2', name: 'Acme Agency', owner_id: 'user-2' },
              ],
              error: null,
            }),
          };
        }
        if (table === 'workspace_members') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { workspace_id: 'ws-1', user_id: 'user-1', role: 'owner' },
                { workspace_id: 'ws-2', user_id: 'user-2', role: 'owner' },
              ],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      mockListUsers.mockResolvedValue({
        data: {
          users: [
            {
              id: 'user-2',
              email: 'alex@acme.com',
              user_metadata: { full_name: 'Alex Vance' },
            },
          ],
        },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/admin/platforms');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.total).toBe(2);
      expect(json.platformStats).toEqual({ pinterest: 1, linkedin: 1 });
      expect(json.data).toHaveLength(2);

      // Verify user 1 (Pinterest) has full real user identity
      const pinterestConn = json.data.find((c: any) => c.platform === 'pinterest');
      expect(pinterestConn).toBeDefined();
      expect(pinterestConn.userName).toBe('Shruthi Bramha');
      expect(pinterestConn.userEmail).toBe('shruthibramha2006@gmail.com');
      expect(pinterestConn.userId).toBe('user-1');
      expect(pinterestConn.workspaceName).toBe('My Workspace');

      // Verify user 2 (LinkedIn via workspace owner resolution)
      const linkedinConn = json.data.find((c: any) => c.platform === 'linkedin');
      expect(linkedinConn).toBeDefined();
      expect(linkedinConn.userName).toBe('Alex Vance');
      expect(linkedinConn.userEmail).toBe('alex@acme.com');
      expect(linkedinConn.userId).toBe('user-2');
    });

    it('filters connections when platform param is passed without collapsing global platformStats', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co' },
      } as any);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'platform_connections') {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'conn-1',
                    workspace_id: 'ws-1',
                    platform: 'pinterest',
                    username: 'pin_user',
                    status: 'connected',
                    created_at: '2026-10-31T00:00:00Z',
                  },
                  {
                    id: 'conn-2',
                    workspace_id: 'ws-2',
                    platform: 'linkedin',
                    username: 'li_user',
                    status: 'connected',
                    created_at: '2026-10-30T00:00:00Z',
                  },
                ],
                error: null,
              }),
            })),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });

      const req = new NextRequest('http://localhost:3000/api/admin/platforms?platform=pinterest');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      // Data list is filtered to pinterest only
      expect(json.data).toHaveLength(1);
      expect(json.data[0].platform).toBe('pinterest');
      expect(json.filteredTotal).toBe(1);
      expect(json.total).toBe(2);
      // BUT global platformStats retains all platforms so top distribution metrics stay intact!
      expect(json.platformStats).toEqual({ pinterest: 1, linkedin: 1 });
    });
  });

  describe('DELETE /api/admin/platforms', () => {
    it('deletes connection by ID and logs admin action', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co' },
      } as any);

      const mockDelete = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'platform_connections') {
          return { delete: mockDelete };
        }
        return {};
      });

      const req = new NextRequest('http://localhost:3000/api/admin/platforms?id=conn-1', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
      expect(adminRepository.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'platform_disconnect',
        'platform_connection',
        'conn-1',
        {}
      );
    });
  });
});
