import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

const { mockGetFlags, mockSetFlag } = vi.hoisted(() => ({
  mockGetFlags: vi.fn(),
  mockSetFlag: vi.fn(),
}));

vi.mock('@/lib/feature-flags-server', () => ({
  getFeatureFlagsServer: mockGetFlags,
  setFeatureFlagServer: mockSetFlag,
}));

import { GET, POST } from '../route';
import { requireAdmin } from '@/lib/auth/admin';

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

    it('returns feature flags list when authorized without granular permissions required', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'admin' },
      } as any);

      mockGetFlags.mockResolvedValue({
        automation_enabled: true,
      });

      const req = new NextRequest('http://localhost:3000/api/admin/feature-flags');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(requireAdmin).toHaveBeenCalledWith(req);
      expect(data.flags).toEqual([
        { flag_key: 'automation_enabled', flag_value: true },
      ]);
    });
  });

  describe('POST /api/admin/feature-flags', () => {
    it('validates request body', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'admin' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ flag_key: '' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('updates flag via setFeatureFlagServer', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'admin' },
      } as any);

      mockSetFlag.mockResolvedValue(true);

      const req = new NextRequest('http://localhost:3000/api/admin/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ flag_key: 'automation_enabled', flag_value: false }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSetFlag).toHaveBeenCalledWith(
        'automation_enabled',
        false,
        'admin@unool.co'
      );
    });
  });
});
