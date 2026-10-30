import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockRpc, mockAuthAdmin } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockAuthAdmin: {
    listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
    getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    updateUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
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
        links: [],
      },
      {
        id: 'prof-5555-6666-7777-8888',
        name: null,
        subdomain: 'creatorpro',
        avatar_url: null,
        links: [],
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

  it('aggregates real link clicks and associates them with profiles', async () => {
    const mockEvents = [
      {
        event_type: 'link_click',
        profile_id: 'prof-1111-2222-3333-4444',
        created_at: new Date().toISOString(),
        event_data: {
          link_url: 'https://instagram.com/priyasharma',
          link_type: 'instagram',
          link_text: 'My Instagram',
        },
      },
      {
        event_type: 'link_click',
        profile_id: 'prof-1111-2222-3333-4444',
        created_at: new Date().toISOString(),
        event_data: {
          link_url: 'https://instagram.com/priyasharma',
          link_type: 'instagram',
          link_text: 'My Instagram',
        },
      },
      {
        event_type: 'profile_cta_click',
        profile_id: 'prof-5555-6666-7777-8888',
        created_at: new Date().toISOString(),
        event_data: {
          link_url: 'https://calendly.com/creatorpro',
          cta_type: 'schedule',
        },
      },
    ];

    const mockProfileRows = [
      {
        id: 'prof-1111-2222-3333-4444',
        name: 'Priya Sharma',
        subdomain: 'priya',
        avatar_url: 'https://example.com/priya.png',
        links: [
          { label: 'My Instagram', url: 'https://instagram.com/priyasharma', type: 'instagram' },
        ],
      },
      {
        id: 'prof-5555-6666-7777-8888',
        name: 'Creator Studio',
        subdomain: 'creatorpro',
        avatar_url: null,
        links: [
          { label: 'Book a Call', url: 'https://calendly.com/creatorpro', type: 'calendly' },
        ],
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
                limit: vi.fn().mockReturnValue(Promise.resolve({ count: 2 })),
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
            eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
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

    expect(summary.totalLinkClicks).toBe(3);
    expect(summary.topLinks).toHaveLength(2);

    // Link 1: 2 clicks on Priya's instagram
    expect(summary.topLinks[0]).toEqual({
      url: 'https://instagram.com/priyasharma',
      linkType: 'instagram',
      title: 'My Instagram',
      clicks: 2,
      profileId: 'prof-1111-2222-3333-4444',
      profileName: 'Priya Sharma',
      profileSubdomain: 'priya',
      profileAvatarUrl: 'https://example.com/priya.png',
    });

    // Link 2: 1 click on Creator Studio's calendly (title resolved from profile links)
    expect(summary.topLinks[1]).toEqual({
      url: 'https://calendly.com/creatorpro',
      linkType: 'schedule',
      title: 'Book a Call',
      clicks: 1,
      profileId: 'prof-5555-6666-7777-8888',
      profileName: 'Creator Studio',
      profileSubdomain: 'creatorpro',
      profileAvatarUrl: null,
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

describe('SupabaseAdminRepository - Recovery Management', () => {
  let repository: SupabaseAdminRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseAdminRepository();
  });

  it('lists soft-deleted profiles and suspended users', async () => {
    // Deleted profiles mock
    const mockDeletedProfiles = [
      {
        id: 'prof-del-1',
        user_id: 'user-del-1',
        workspace_id: 'ws-1',
        subdomain: 'deletedcreator',
        name: 'Deleted Creator',
        avatar_url: 'https://example.com/del.png',
        deleted_at: '2026-10-25T10:00:00Z',
        updated_at: '2026-10-25T10:00:00Z',
      },
    ];

    // Suspended users mock
    const mockSuspendedUsers = [
      {
        id: 'user-susp-2',
        email: 'suspended@agency.io',
        banned_until: '2099-01-01T00:00:00Z',
      },
    ];

    mockAuthAdmin.getUserById.mockResolvedValue({
      data: { user: { id: 'user-del-1', email: 'deleted@creator.com' } },
      error: null,
    });

    mockAuthAdmin.listUsers.mockResolvedValue({
      data: { users: mockSuspendedUsers },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'deleted_accounts') {
        return {
          select: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === 'admin_audit_log' || table === 'admin_audit_logs') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({ data: mockDeletedProfiles, error: null }),
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'prof-susp-2',
                  user_id: 'user-susp-2',
                  workspace_id: 'ws-2',
                  subdomain: 'suspendeduser',
                  name: 'Suspended User',
                  avatar_url: null,
                  deleted_at: null,
                },
              ],
              error: null,
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });

    const items = await repository.listDeletedAndSuspendedProfiles();

    expect(items).toHaveLength(2);
    expect(items.find((i) => i.type === 'deleted')?.subdomain).toBe('deletedcreator');
    expect(items.find((i) => i.type === 'deleted')?.email).toBe('deleted@creator.com');
    expect(items.find((i) => i.type === 'suspended')?.subdomain).toBe('suspendeduser');
    expect(items.find((i) => i.type === 'suspended')?.email).toBe('suspended@agency.io');
  });

  it('recovers soft-deleted profile and unsuspends user account', async () => {
    const mockProfileUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockDeletedAccountsUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { update: mockProfileUpdate };
      }
      if (table === 'deleted_accounts') {
        return { update: mockDeletedAccountsUpdate };
      }
      if (table === 'admin_audit_log' || table === 'admin_audit_logs') {
        return { insert: mockInsert };
      }
      return {};
    });

    mockAuthAdmin.getUserById.mockResolvedValue({
      data: { user: { id: 'user-del-1', user_metadata: { is_deleted: true } } },
      error: null,
    });
    mockAuthAdmin.updateUserById.mockResolvedValue({ data: { user: null }, error: null });

    const result = await repository.recoverProfileOrAccount({
      profileId: 'prof-del-1',
      userId: 'user-del-1',
      adminUserId: 'admin-123',
    });

    expect(result).toBe(true);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: null,
      })
    );
    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith(
      'user-del-1',
      expect.objectContaining({
        ban_duration: 'none',
        user_metadata: expect.objectContaining({
          is_deleted: false,
          deleted_at: null,
          deleted_reason: null,
        }),
      })
    );
  });

  it('lists deleted accounts directly from auth.users when not in profiles or deleted_accounts', async () => {
    mockAuthAdmin.listUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-del-auth',
            email: 'authdeleted@company.com',
            user_metadata: {
              is_deleted: true,
              deleted_reason: 'Account closed by admin',
              deleted_at: '2026-10-28T12:00:00Z',
            },
          },
        ],
      },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'deleted_accounts') {
        return {
          select: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({ data: [], error: null }),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    });

    const items = await repository.listDeletedAndSuspendedProfiles();

    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('deleted');
    expect(items[0].userId).toBe('user-del-auth');
    expect(items[0].email).toBe('authdeleted@company.com');
    expect(items[0].reason).toBe('Account closed by admin');
  });

  it('recovers deleted user account even when no profileId is provided', async () => {
    const mockAuthAdminUpdate = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
    mockAuthAdmin.getUserById.mockResolvedValue({
      data: { user: { id: 'user-del-only', user_metadata: { is_deleted: true } } },
      error: null,
    });
    mockAuthAdmin.updateUserById = mockAuthAdminUpdate;

    const mockProfileUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return { update: mockProfileUpdate };
      if (table === 'deleted_accounts') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const result = await repository.recoverProfileOrAccount({
      userId: 'user-del-only',
      type: 'deleted',
      adminUserId: 'admin-123',
    });

    expect(result).toBe(true);
    expect(mockAuthAdminUpdate).toHaveBeenCalledWith(
      'user-del-only',
      expect.objectContaining({
        ban_duration: 'none',
        user_metadata: expect.objectContaining({
          is_deleted: false,
          deleted_at: null,
          deleted_reason: null,
        }),
      })
    );
  });

  describe('getUserPlanDistribution', () => {
    let repository: SupabaseAdminRepository;

    beforeEach(() => {
      vi.clearAllMocks();
      repository = new SupabaseAdminRepository();
    });

    it('calculates plan distribution, 30d signups, and excludes deleted users', async () => {
      const now = new Date();
      const recentSignup = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const oldSignup = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();

      const mockUsers = [
        {
          id: 'user-pro-1',
          email: 'pro@unool.co',
          created_at: recentSignup,
          user_metadata: {},
        },
        {
          id: 'user-free-1',
          email: 'free@unool.co',
          created_at: recentSignup,
          user_metadata: {},
        },
        {
          id: 'user-old-1',
          email: 'old@unool.co',
          created_at: oldSignup,
          user_metadata: {},
        },
        {
          id: 'user-deleted-1',
          email: 'deleted@unool.co',
          created_at: recentSignup,
          user_metadata: { is_deleted: true },
        },
      ];

      mockAuthAdmin.listUsers.mockResolvedValue({
        data: { users: mockUsers },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'workspace_members') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { user_id: 'user-pro-1', workspaces: [{ plan: 'pro' }] },
                  { user_id: 'user-free-1', workspaces: [{ plan: 'free' }] },
                ],
                error: null,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const distribution = await repository.getUserPlanDistribution();

      expect(distribution.total).toBe(3);
      expect(distribution.newUsersLast30Days).toBe(2);
      expect(distribution.byPlan['pro']).toBe(1);
      expect(distribution.byPlan['free']).toBe(2);
      expect(distribution.planDetails).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ plan: 'free', count: 2 }),
          expect.objectContaining({ plan: 'pro', count: 1 }),
        ])
      );
      expect(distribution.registrationsLast30Days).toHaveLength(30);
      expect(distribution.recentUsers).toHaveLength(3);
    });
  });
});
