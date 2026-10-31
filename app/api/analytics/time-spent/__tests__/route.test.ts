import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { normalizeSectionName } from '../route';

const mockGetUser = vi.fn();
const mockCreateServerClient = vi.fn();
const mockGetUserById = vi.fn();
const mockUpdateUserById = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: any[]) => mockCreateServerClient(...args),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'existing-time-1', duration_seconds: 60 },
              error: null,
            }),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    auth: {
      admin: {
        getUserById: (...args: any[]) => mockGetUserById(...args),
        updateUserById: (...args: any[]) => mockUpdateUserById(...args),
      },
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
  })),
}));

import { POST } from '../route';

describe('Analytics Time-Spent Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });
    mockGetUserById.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-1',
          user_metadata: { section_time_spent: { overview: 60 } },
        },
      },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({ error: null });
  });

  describe('normalizeSectionName', () => {
    it('correctly maps raw pathnames and section names', () => {
      expect(normalizeSectionName('/dashboard')).toBe('overview');
      expect(normalizeSectionName('/dashboard/flightplan')).toBe('flightplan');
      expect(normalizeSectionName('flight-plan')).toBe('flightplan');
      expect(normalizeSectionName('/dashboard/studio')).toBe('studio');
      expect(normalizeSectionName('/dashboard/referrals')).toBe('referrals');
      expect(normalizeSectionName('referral')).toBe('referrals');
      expect(normalizeSectionName('/dashboard/signal')).toBe('signal');
      expect(normalizeSectionName('/dashboard/automation')).toBe('automation');
      expect(normalizeSectionName('/dashboard/unlock-gates')).toBe('unlock-gates');
      expect(normalizeSectionName('/dashboard/profile')).toBe('profile');
      expect(normalizeSectionName('/dashboard/billing')).toBe('billing');
      expect(normalizeSectionName('/dashboard/settings')).toBe('settings');
      expect(normalizeSectionName('/dashboard/composer')).toBe('composer');
    });
  });

  describe('POST /api/analytics/time-spent', () => {
    it('returns 401 when no session is present', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const req = new NextRequest('http://localhost:3000/api/analytics/time-spent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'flightplan', durationSeconds: 30 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('successfully records time spent for authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-1', email: 'user@unool.co' } },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/analytics/time-spent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'studio', durationSeconds: 45 }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.section).toBe('studio');
      expect(data.durationSeconds).toBe(45);
      expect(mockUpdateUserById).toHaveBeenCalled();
    });

    it('rejects invalid payload duration', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-1' } },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/analytics/time-spent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'overview', durationSeconds: -5 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
