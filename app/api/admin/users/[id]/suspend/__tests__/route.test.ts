import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabaseAdminRepository', () => ({
  adminRepository: {
    suspendUser: vi.fn(),
  },
}));

import { POST } from '../route';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

describe('Admin User Suspend API - POST /api/admin/users/[id]/suspend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated or non-admin requests', async () => {
    vi.mocked(requireAdmin).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) as any
    );

    const req = new NextRequest('http://localhost:3000/api/admin/users/user-123/suspend', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Terms violation' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'user-123' }) });

    expect(res.status).toBe(403);
    expect(adminRepository.suspendUser).not.toHaveBeenCalled();
  });

  it('suspends user with permanent duration when durationHours is null or permanent', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      admin: { userId: 'admin-1', email: 'admin@unool.co' },
    } as any);
    vi.mocked(adminRepository.suspendUser).mockResolvedValue(true);

    const req = new NextRequest('http://localhost:3000/api/admin/users/user-123/suspend', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Severe fraud', durationHours: null }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'user-123' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.durationHours).toBeNull();
    expect(adminRepository.suspendUser).toHaveBeenCalledWith('user-123', 'admin-1', 'Severe fraud', null);
  });

  it('suspends user for 24 hours when durationHours is 24', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      admin: { userId: 'admin-1', email: 'admin@unool.co' },
    } as any);
    vi.mocked(adminRepository.suspendUser).mockResolvedValue(true);

    const req = new NextRequest('http://localhost:3000/api/admin/users/user-123/suspend', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Spam activity', durationHours: 24 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'user-123' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.durationHours).toBe(24);
    expect(adminRepository.suspendUser).toHaveBeenCalledWith('user-123', 'admin-1', 'Spam activity', 24);
  });

  it('suspends user for 72 hours when durationHours is 72', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      admin: { userId: 'admin-1', email: 'admin@unool.co' },
    } as any);
    vi.mocked(adminRepository.suspendUser).mockResolvedValue(true);

    const req = new NextRequest('http://localhost:3000/api/admin/users/user-456/suspend', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Suspicious login activity', durationHours: 72 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'user-456' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.durationHours).toBe(72);
    expect(adminRepository.suspendUser).toHaveBeenCalledWith('user-456', 'admin-1', 'Suspicious login activity', 72);
  });

  it('suspends user with custom hours (e.g. 36 hours as string or number)', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      admin: { userId: 'admin-1', email: 'admin@unool.co' },
    } as any);
    vi.mocked(adminRepository.suspendUser).mockResolvedValue(true);

    const req = new NextRequest('http://localhost:3000/api/admin/users/user-789/suspend', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Custom cooldown', durationHours: '36' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'user-789' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.durationHours).toBe(36);
    expect(adminRepository.suspendUser).toHaveBeenCalledWith('user-789', 'admin-1', 'Custom cooldown', 36);
  });

  it('returns 500 when repository throws an error', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      admin: { userId: 'admin-1', email: 'admin@unool.co' },
    } as any);
    vi.mocked(adminRepository.suspendUser).mockRejectedValue(new Error('Auth DB error'));

    const req = new NextRequest('http://localhost:3000/api/admin/users/user-123/suspend', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Spam' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'user-123' }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to suspend user');
  });
});

