import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabaseAdminRepository', () => ({
  adminRepository: {
    listAllUsers: vi.fn(),
    listAdminUsers: vi.fn(),
    createAdminUser: vi.fn(),
    getAdminUserByEmail: vi.fn(),
    logAdminAction: vi.fn(),
    invalidateUsersCache: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: vi.fn(),
      },
    },
  },
}));

import { GET } from '../route';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

describe('Admin Users API - GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      admin: { userId: 'admin-1', email: 'admin@unool.co' },
    } as any);
  });

  it('rejects unauthenticated requests', async () => {
    vi.mocked(requireAdmin).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) as any
    );

    const req = new NextRequest('http://localhost:3000/api/admin/users');
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(adminRepository.listAllUsers).not.toHaveBeenCalled();
  });

  it('passes search, page, pageSize, sortBy, sortOrder to listAllUsers', async () => {
    vi.mocked(adminRepository.listAllUsers).mockResolvedValue({
      data: [{ id: 'u-1', email: 'searchuser@example.com', createdAt: '2026-01-01', workspaceCount: 1, plan: 'creator' }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    const req = new NextRequest('http://localhost:3000/api/admin/users?search=searchuser&page=1&pageSize=20&sortBy=email&sortOrder=asc');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(adminRepository.listAllUsers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      search: 'searchuser',
      sortBy: 'email',
      sortOrder: 'asc',
    });

    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.data[0].email).toBe('searchuser@example.com');
  });

  it('trims search query and defaults invalid page numbers', async () => {
    vi.mocked(adminRepository.listAllUsers).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });

    const req = new NextRequest('http://localhost:3000/api/admin/users?search=%20%20hello%40domain.com%20%20&page=-5&pageSize=500');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(adminRepository.listAllUsers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100, // Capped at 100
      search: 'hello@domain.com',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });
});
