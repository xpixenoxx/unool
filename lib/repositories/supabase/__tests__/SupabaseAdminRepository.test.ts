import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockRpc, mockAuthAdmin } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockAuthAdmin: {
    listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
    getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      admin: mockAuthAdmin,
    },
  }),
}));

import { SupabaseAdminRepository } from '../SupabaseAdminRepository';

describe('SupabaseAdminRepository - getAnalyticsSummary', () => {
  let repository: SupabaseAdminRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseAdminRepository();
  });

  it('resolves real profile names, subdomains, and avatars for top profiles', async () => {
    const mockEvents = [
      {
        event_type: 'profile_view',
        profile_id: 'prof-1111-2222-3333-4444',
        created_at: new Date().toISOString(),
        event_data: {},
      },
      {
        event_type: 'profile_view',
        profile_id: 'prof-1111-2222-3333-4444',
        created_at: new Date().toISOString(),
        event_data: {},
      },
      {
        event_type: 'profile_view',
        profile_id: 'prof-5555-6666-7777-8888',
        created_at: new Date().toISOString(),
        event_data: {},
      },
    ];

    const mockProfileRows = [
      {
        id: 'prof-1111-2222-3333-4444',
        name: 'Priya Sharma',
        subdomain: 'priya',
        avatar_url: 'https://example.com/priya.png',
      },
      {
        id: 'prof-5555-6666-7777-8888',
        name: null,
        subdomain: 'creatorpro',
        avatar_url: null,
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'analytics_events') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
          }),
        };
      }
      if (table === 'workspaces') {
        return {
          select: vi.fn().mockResolvedValue({ count: 5, error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockImplementation((columns: string, options?: any) => {
            if (options?.head) {
              return {
                limit: vi.fn().mockReturnValue(Promise.resolve({ count: 10 })),
              };
            }
            return {
              in: vi.fn().mockResolvedValue({ data: mockProfileRows, error: null }),
            };
          }),
        };
      }
      if (table === 'posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 25, error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });

    const summary = await repository.getAnalyticsSummary();

    expect(summary.totalProfileViews).toBe(3);
    expect(summary.topProfiles).toHaveLength(2);

    // Profile 1: Most viewed (2 views)
    expect(summary.topProfiles[0]).toEqual({
      profileId: 'prof-1111-2222-3333-4444',
      name: 'Priya Sharma',
      subdomain: 'priya',
      avatarUrl: 'https://example.com/priya.png',
      handle: '@priya',
      views: 2,
    });

    // Profile 2: 1 view, name is null so falls back to @subdomain
    expect(summary.topProfiles[1]).toEqual({
      profileId: 'prof-5555-6666-7777-8888',
      name: '@creatorpro',
      subdomain: 'creatorpro',
      avatarUrl: null,
      handle: '@creatorpro',
      views: 1,
    });
  });

  it('handles unknown or deleted profiles gracefully without failing', async () => {
    const mockEvents = [
      {
        event_type: 'profile_view',
        profile_id: 'prof-unknown-1234',
        created_at: new Date().toISOString(),
        event_data: {},
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'analytics_events') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
          }),
        };
      }
      if (table === 'workspaces') {
        return {
          select: vi.fn().mockImplementation((columns: string, options?: any) => {
            if (options?.head) {
              return Promise.resolve({ count: 1, error: null });
            }
            return {
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockImplementation((columns: string, options?: any) => {
            if (options?.head) {
              return {
                limit: vi.fn().mockReturnValue(Promise.resolve({ count: 1 })),
              };
            }
            return {
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }),
        };
      }
      if (table === 'posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });

    const summary = await repository.getAnalyticsSummary();

    expect(summary.topProfiles).toHaveLength(1);
    expect(summary.topProfiles[0].name).toBe('Profile (prof-unk)');
    expect(summary.topProfiles[0].profileId).toBe('prof-unknown-1234');
    expect(summary.topProfiles[0].views).toBe(1);
  });
});
