import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabaseAdminRepository', () => ({
  adminRepository: {
    logAdminAction: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

import { GET, POST } from '../route';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

describe('Admin Feature Flags API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/feature-flags', () => {
    it('returns unauthorized when admin check fails', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const req = new NextRequest('http://localhost:3000/api/admin/feature-flags');
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it('returns feature flags list when authorized', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'super_admin' },
      } as any);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { flag_key: 'automation_enabled', flag_value: true },
            ],
            error: null,
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/feature-flags');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.flags).toHaveLength(1);
      expect(data.flags[0].flag_key).toBe('automation_enabled');
      expect(data.flags[0].flag_value).toBe(true);
    });
  });

  describe('POST /api/admin/feature-flags', () => {
    it('validates request body', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'super_admin' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ flag_key: '' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('updates flag and logs admin action', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'super_admin' },
      } as any);

      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { flag_key: 'automation_enabled', flag_value: false },
              error: null,
            }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ flag_key: 'automation_enabled', flag_value: false }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.flag.flag_value).toBe(false);
      expect(adminRepository.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'feature_flag_update',
        'admin_feature_flags',
        'automation_enabled',
        { flag_key: 'automation_enabled', flag_value: false }
      );
    });
  });
});
