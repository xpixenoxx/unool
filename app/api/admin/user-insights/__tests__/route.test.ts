import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabaseAdminRepository', () => ({
  adminRepository: {
    getUserPlanDistribution: vi.fn(),
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

import { GET, formatSeconds } from '../route';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

describe('Admin User Insights API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatSeconds helper', () => {
    it('formats seconds into readable strings', () => {
      expect(formatSeconds(0)).toBe('0s');
      expect(formatSeconds(45)).toBe('45s');
      expect(formatSeconds(125)).toBe('2m 5s');
      expect(formatSeconds(3665)).toBe('1h 1m');
      expect(formatSeconds(90000)).toBe('1d 1h 0m');
      // With live seconds precision enabled
      expect(formatSeconds(3665, true)).toBe('1h 1m 5s');
      expect(formatSeconds(90015, true)).toBe('1d 1h 0m 15s');
    });
  });

  describe('GET /api/admin/user-insights', () => {
    it('returns time spent breakdown across sections and overall in Unool', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co' },
      } as any);

      vi.mocked(adminRepository.getUserPlanDistribution).mockResolvedValue({
        total: 2,
        newUsersLast30Days: 1,
        byPlan: { free: 1, pro: 1 },
        planDetails: [
          { plan: 'free', count: 1, percentage: 50 },
          { plan: 'pro', count: 1, percentage: 50 },
        ],
        registrationsLast30Days: [],
        recentUsers: [
          { id: 'user-1', email: 'user1@example.com', plan: 'free', createdAt: '2026-01-01', isSuspended: false },
        ],
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_section_time') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { user_id: 'user-1', section: 'studio', duration_seconds: 300 },
                { user_id: 'user-1', section: 'flightplan', duration_seconds: 150 },
                { user_id: 'user-2', section: 'referrals', duration_seconds: 100 },
              ],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      });

      mockListUsers.mockResolvedValue({
        data: {
          users: [
            {
              id: 'user-1',
              user_metadata: {
                section_time_spent: { overview: 50, studio: 300, flightplan: 150 },
              },
            },
          ],
        },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/admin/user-insights');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.timeSpentStats).toBeDefined();
      expect(data.timeSpentStats.overallSeconds).toBeGreaterThan(0);
      expect(data.timeSpentStats.formattedOverall).toBeDefined();
      expect(data.timeSpentStats.liveNowUsersCount).toBeDefined();
      expect(data.timeSpentStats.sections).toBeDefined();

      const studioStat = data.timeSpentStats.sections.find((s: any) => s.section === 'studio');
      expect(studioStat).toBeDefined();
      expect(studioStat.totalSeconds).toBe(300);
      expect(studioStat.name).toBe('Studio');

      const flightplanStat = data.timeSpentStats.sections.find((s: any) => s.section === 'flightplan');
      expect(flightplanStat).toBeDefined();
      expect(flightplanStat.totalSeconds).toBe(150);

      const referralsStat = data.timeSpentStats.sections.find((s: any) => s.section === 'referrals');
      expect(referralsStat).toBeDefined();
      expect(referralsStat.totalSeconds).toBe(100);

      // Verify user augmentation in recentUsers
      expect(data.userBreakdown.recentUsers[0].totalTimeSeconds).toBeDefined();
      expect(data.userBreakdown.recentUsers[0].topSection).toBe('Studio');
    });

    it('shows zero time for users who have not yet flushed any live heartbeats (no synthetic baseline)', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co' },
      } as any);

      vi.mocked(adminRepository.getUserPlanDistribution).mockResolvedValue({
        total: 1,
        newUsersLast30Days: 1,
        byPlan: { free: 1 },
        planDetails: [{ plan: 'free', count: 1, percentage: 100 }],
        registrationsLast30Days: [],
        recentUsers: [
          { id: 'user-new', email: 'creator@unool.co', plan: 'free', createdAt: '2026-10-01T00:00:00Z', isSuspended: false },
        ],
      });

      // No user_section_time table rows and no metadata heartbeats
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_section_time') {
          return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      });

      // User exists in auth.users with registration date, but section_time_spent is empty (no heartbeats yet)
      mockListUsers.mockResolvedValue({
        data: {
          users: [
            {
              id: 'user-new',
              created_at: '2026-10-01T00:00:00Z',
              last_sign_in_at: '2026-10-02T10:00:00Z',
              user_metadata: {},
            },
          ],
        },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/admin/user-insights');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      // No real heartbeats = 0s. Only real measured browsing time counts.
      expect(data.timeSpentStats.overallSeconds).toBe(0);
      expect(data.timeSpentStats.trackedUsersCount).toBe(0);
      // All sections should show 0s for users with no live heartbeats
      const studioStat = data.timeSpentStats.sections.find((s: any) => s.section === 'studio');
      expect(studioStat?.totalSeconds).toBe(0);
    });

    it('correctly aggregates published posts by platform without requiring workspace_id on post_variants', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co' },
      } as any);

      vi.mocked(adminRepository.getUserPlanDistribution).mockResolvedValue({
        total: 1,
        newUsersLast30Days: 1,
        byPlan: { free: 1 },
        planDetails: [],
        registrationsLast30Days: [],
        recentUsers: [],
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'post_variants') {
          return {
            select: vi.fn((cols: string) => {
              expect(cols).not.toContain('workspace_id');
              return {
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { platform: 'linkedin' },
                    { platform: 'linkedin' },
                    { platform: 'bluesky' },
                    { platform: 'instagram' },
                  ],
                  error: null,
                }),
              };
            }),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      });

      mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });

      const req = new NextRequest('http://localhost:3000/api/admin/user-insights');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.postsByPlatform).toEqual({
        linkedin: 2,
        bluesky: 1,
        instagram: 1,
      });
    });
  });
});

