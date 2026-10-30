import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabaseAdminRepository', () => ({
  adminRepository: {
    listDeletedAndSuspendedProfiles: vi.fn(),
    recoverProfileOrAccount: vi.fn(),
  },
}));

import { GET, POST } from '../route';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

describe('Admin Recovery API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/recovery', () => {
    it('returns unauthorized when requireAdmin fails', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const req = new NextRequest('http://localhost:3000/api/admin/recovery');
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it('returns recovery items with counts when authorized', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'super_admin' },
      } as any);

      vi.mocked(adminRepository.listDeletedAndSuspendedProfiles).mockResolvedValue([
        {
          id: 'del-1',
          type: 'deleted',
          profileId: 'p-1',
          userId: 'u-1',
          subdomain: 'johndoe',
          name: 'John Doe',
          email: 'john@example.com',
          avatarUrl: null,
          workspaceId: 'w-1',
          reason: 'Profile marked as deleted',
          timestamp: '2026-10-25T10:00:00Z',
        },
        {
          id: 'susp-2',
          type: 'suspended',
          profileId: 'p-2',
          userId: 'u-2',
          subdomain: 'alice',
          name: 'Alice',
          email: 'alice@example.com',
          avatarUrl: null,
          workspaceId: 'w-2',
          reason: 'Account suspended / banned by admin',
          timestamp: '2099-01-01T00:00:00Z',
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/admin/recovery');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.total).toBe(2);
      expect(data.deletedCount).toBe(1);
      expect(data.suspendedCount).toBe(1);
      expect(data.items).toHaveLength(2);
    });
  });

  describe('POST /api/admin/recovery', () => {
    it('returns 400 if neither profileId nor userId is provided', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'super_admin' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Either profileId or userId must be provided');
    });

    it('successfully triggers recovery for deleted profile or suspended user', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'super_admin' },
      } as any);

      vi.mocked(adminRepository.recoverProfileOrAccount).mockResolvedValue(true);

      const req = new NextRequest('http://localhost:3000/api/admin/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: 'p-1',
          userId: 'u-1',
          type: 'deleted',
        }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(adminRepository.recoverProfileOrAccount).toHaveBeenCalledWith({
        profileId: 'p-1',
        userId: 'u-1',
        adminUserId: 'admin-1',
      });
    });
  });
});
