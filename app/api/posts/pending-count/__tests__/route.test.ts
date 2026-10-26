import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetCurrentAuth, mockFrom } = vi.hoisted(() => ({
  mockGetCurrentAuth: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: (req: any) => mockGetCurrentAuth(req),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

import { GET } from '../route';

describe('/api/posts/pending-count route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns count: 0 when unauthorized', async () => {
    mockGetCurrentAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/posts/pending-count');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ count: 0, drafts: 0, scheduled: 0, publishing: 0 });
  });

  it('correctly aggregates drafts, scheduled, and publishing posts', async () => {
    mockGetCurrentAuth.mockResolvedValue({ workspaceId: 'ws-123', userId: 'user-123' });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((field: string, val: any) => {
              if (field === 'workspace_id') {
                return {
                  eq: vi.fn().mockImplementation((statusField: string, statusVal: string) => {
                    if (statusVal === 'draft') return Promise.resolve({ count: 4, error: null });
                    if (statusVal === 'scheduled') return Promise.resolve({ count: 1, error: null });
                    if (statusVal === 'publishing') return Promise.resolve({ count: 0, error: null });
                    return Promise.resolve({ count: 0, error: null });
                  }),
                };
              }
              return { eq: vi.fn().mockResolvedValue({ count: 0, error: null }) };
            }),
          }),
        };
      }
      return {};
    });

    const req = new NextRequest('http://localhost:3000/api/posts/pending-count');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.drafts).toBe(4);
    expect(data.scheduled).toBe(1);
    expect(data.publishing).toBe(0);
    expect(data.count).toBe(5);
  });

  it('handles database errors gracefully and returns safe fallback', async () => {
    mockGetCurrentAuth.mockResolvedValue({ workspaceId: 'ws-123', userId: 'user-123' });

    mockFrom.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const req = new NextRequest('http://localhost:3000/api/posts/pending-count');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ count: 0, drafts: 0, scheduled: 0, publishing: 0 });
  });
});
