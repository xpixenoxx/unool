import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const { mockRequireAdmin, mockFrom, mockRedisPing } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockFrom: vi.fn(),
  mockRedisPing: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    ping = mockRedisPing;
  },
}));

import { GET } from '../route';

describe('GET /api/admin/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the admin guard response when caller is unauthorized', async () => {
    mockRequireAdmin.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost:3000/api/admin/health');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('probes database connectivity and returns connected health summary for admins', async () => {
    mockRequireAdmin.mockResolvedValue({
      admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'admin' },
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'ws-1' }], error: null }),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/health');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkedAt).toEqual(expect.any(String));
    expect(body.database.status).toBe('connected');
    expect(body.database.error).toBeNull();
    expect(body.cashfree).toEqual(
      expect.objectContaining({
        status: expect.stringMatching(/^(configured|not_configured)$/),
      })
    );
    expect(body.authEngine).toEqual(
      expect.objectContaining({
        status: expect.stringMatching(/^(hardened|attention_needed)$/),
      })
    );
  });

  it('reports degraded database status when Supabase query returns an error', async () => {
    mockRequireAdmin.mockResolvedValue({
      admin: { userId: 'admin-1', email: 'admin@unool.co', role: 'admin' },
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'connection refused' },
        }),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/health');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.database.status).toBe('degraded');
    expect(body.database.error).toBe('connection refused');
  });
});

