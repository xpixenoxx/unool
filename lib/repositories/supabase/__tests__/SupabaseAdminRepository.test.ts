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
      userId: null,
      userEmail: null,
      name: 'Priya Sharma',
      subdomain: 'priya',
      avatarUrl: 'https://example.com/priya.png',
      handle: '@priya',
      views: 2,
    });

    // Profile 2: 1 view, name is null so falls back to @subdomain
    expect(summary.topProfiles[1]).toEqual({
      profileId: 'prof-5555-6666-7777-8888',
      userId: null,
      userEmail: null,
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

  it('suspends user with duration in hours and logs admin action', async () => {
    const userId = '00000000-0000-0000-0000-000000000001';
    mockAuthAdmin.getUserById.mockResolvedValue({
      data: { user: { id: userId, user_metadata: { role: 'creator' } } },
      error: null,
    });
    mockAuthAdmin.updateUserById.mockResolvedValue({ data: { user: null }, error: null });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'admin_audit_log' || table === 'admin_audit_logs') {
        return { insert: mockInsert };
      }
      return {};
    });

    const result = await repository.suspendUser(userId, 'admin-999', 'Spam activity', 24);

    expect(result).toBe(true);
    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        ban_duration: '24h',
        user_metadata: expect.objectContaining({
          role: 'creator',
          suspended_reason: 'Spam activity',
          suspended_duration_hours: 24,
          suspended_is_permanent: false,
        }),
      })
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user_suspend',
        target_id: userId,
        metadata: expect.objectContaining({
          durationHours: 24,
          isPermanent: false,
        }),
      })
    );
  });

  it('suspends user permanently when duration is null or permanent', async () => {
    mockAuthAdmin.getUserById.mockResolvedValue({
      data: { user: { id: 'user-perm-suspend', user_metadata: {} } },
      error: null,
    });
    mockAuthAdmin.updateUserById.mockResolvedValue({ data: { user: null }, error: null });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'admin_audit_log' || table === 'admin_audit_logs') {
        return { insert: mockInsert };
      }
      return {};
    });

    const result = await repository.suspendUser('user-perm-suspend', 'admin-999', 'Severe terms breach', null);

    expect(result).toBe(true);
    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith(
      'user-perm-suspend',
      expect.objectContaining({
        ban_duration: '876000h',
        user_metadata: expect.objectContaining({
          suspended_reason: 'Severe terms breach',
          suspended_duration_hours: null,
          suspended_is_permanent: true,
        }),
      })
    );
  });

  it('unsuspends user, clears ban duration and metadata', async () => {
    mockAuthAdmin.getUserById.mockResolvedValue({
      data: {
        user: {
          id: 'user-to-unsuspend',
          user_metadata: {
            suspended_at: '2026-10-30T10:00:00Z',
            suspended_reason: 'Cooldown',
            suspended_until: '2026-10-31T10:00:00Z',
            suspended_duration_hours: 24,
          },
        },
      },
      error: null,
    });
    mockAuthAdmin.updateUserById.mockResolvedValue({ data: { user: null }, error: null });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'admin_audit_log' || table === 'admin_audit_logs') {
        return { insert: mockInsert };
      }
      return {};
    });

    const result = await repository.unsuspendUser('user-to-unsuspend', 'admin-999');

    expect(result).toBe(true);
    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith(
      'user-to-unsuspend',
      expect.objectContaining({
        ban_duration: 'none',
        user_metadata: expect.objectContaining({
          suspended_at: null,
          suspended_reason: null,
          suspended_until: null,
          suspended_duration_hours: null,
          suspended_is_permanent: null,
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
      expect(distribution.byPlan['spark']).toBe(2);
      expect(distribution.byPlan['free']).toBe(2);
      expect(distribution.planDetails).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ plan: 'spark', count: 2 }),
          expect.objectContaining({ plan: 'pro', count: 1 }),
        ])
      );
      expect(distribution.registrationsLast30Days).toHaveLength(30);
      expect(distribution.recentUsers).toHaveLength(3);
    });
  });

  describe('SupabaseAdminRepository - Workspaces live metrics', () => {
    let repository: SupabaseAdminRepository;

    beforeEach(() => {
      vi.clearAllMocks();
      repository = new SupabaseAdminRepository();
    });

    it('aggregates real member count, profile count excluding soft-deleted, and posts this month in listWorkspaces', async () => {
      const mockWorkspaces = [
        {
          id: 'ws-1',
          name: 'My Workspace 1',
          plan: 'free',
          plan_status: 'active',
          plan_expires_at: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          trial_ends_at: null,
          created_at: '2026-10-30T00:00:00Z',
          updated_at: '2026-10-30T00:00:00Z',
        },
        {
          id: 'ws-2',
          name: 'My Workspace 2',
          plan: 'creator',
          plan_status: 'active',
          plan_expires_at: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          trial_ends_at: null,
          created_at: '2026-10-29T00:00:00Z',
          updated_at: '2026-10-29T00:00:00Z',
        },
      ];

      const mockMembers = [
        { workspace_id: 'ws-1' },
        { workspace_id: 'ws-1' },
        { workspace_id: 'ws-2' },
      ];

      const mockProfiles = [
        { workspace_id: 'ws-1', deleted_at: null },
        { workspace_id: 'ws-1', deleted_at: '2026-10-25T10:00:00Z' },
        { workspace_id: 'ws-2', deleted_at: null },
      ];

      const mockPosts = [
        { workspace_id: 'ws-1' },
        { workspace_id: 'ws-1' },
        { workspace_id: 'ws-1' },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({ data: mockWorkspaces, error: null, count: 2 }),
              }),
            }),
          };
        }
        if (table === 'workspace_members') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
            }),
          };
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
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

      const result = await repository.listWorkspaces({ page: 1, pageSize: 20 });

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);

      const ws1 = result.data.find((w) => w.id === 'ws-1')!;
      expect(ws1.memberCount).toBe(2);
      expect(ws1.profileCount).toBe(1);
      expect(ws1.postsThisMonth).toBe(3);

      const ws2 = result.data.find((w) => w.id === 'ws-2')!;
      expect(ws2.memberCount).toBe(1);
      expect(ws2.profileCount).toBe(1);
      expect(ws2.postsThisMonth).toBe(0);
    });

    it('resolves ownerId, ownerName, and ownerEmail in listWorkspaces', async () => {
      const mockWorkspaces = [
        {
          id: 'ws-owner-test',
          name: 'My Workspace',
          owner_id: 'user-123',
          plan: 'free',
          plan_status: 'active',
          plan_expires_at: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          trial_ends_at: null,
          created_at: '2026-10-30T00:00:00Z',
          updated_at: '2026-10-30T00:00:00Z',
        },
      ];

      const mockMembers = [
        { workspace_id: 'ws-owner-test', user_id: 'user-123', role: 'owner' },
      ];

      const mockUsers = [
        { id: 'user-123', email: 'owner@example.com', full_name: 'Alice Owner' },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({ data: mockWorkspaces, error: null, count: 1 }),
              }),
            }),
          };
        }
        if (table === 'workspace_members') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
            }),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      });

      const result = await repository.listWorkspaces({ page: 1, pageSize: 20 });
      expect(result.data).toHaveLength(1);
      const ws = result.data[0];
      expect(ws.ownerId).toBe('user-123');
      expect(ws.ownerName).toBe('Alice Owner');
      expect(ws.ownerEmail).toBe('owner@example.com');
    });
    it('computes live counts for getWorkspaceById', async () => {
      const mockWorkspace = {
        id: 'ws-single',
        name: 'Single Workspace',
        plan: 'pro',
        plan_status: 'active',
        plan_expires_at: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        trial_ends_at: null,
        created_at: '2026-10-27T00:00:00Z',
        updated_at: '2026-10-27T00:00:00Z',
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockWorkspace, error: null }),
              }),
            }),
          };
        }
        if (table === 'workspace_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 4, error: null }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ count: 2, error: null }),
              }),
            }),
          };
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 12, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        };
      });

      const ws = await repository.getWorkspaceById('ws-single');
      expect(ws).not.toBeNull();
      expect(ws?.id).toBe('ws-single');
      expect(ws?.memberCount).toBe(4);
      expect(ws?.profileCount).toBe(2);
      expect(ws?.postsThisMonth).toBe(12);
    });
  });

  describe('SupabaseAdminRepository - listAllUsers (Searchbar & Pagination)', () => {
    let repository: SupabaseAdminRepository;

    const sampleUsers = [
      {
        id: 'u-1',
        email: 'alice@domain.com',
        created_at: '2026-01-01T10:00:00Z',
        user_metadata: { full_name: 'Alice Wonder' },
      },
      {
        id: 'u-2',
        email: 'bob@example.com',
        created_at: '2026-02-01T10:00:00Z',
        user_metadata: { name: 'Bob Builder' },
      },
      {
        id: 'u-3',
        email: 'charlie@domain.com',
        created_at: '2026-03-01T10:00:00Z',
        user_metadata: { full_name: 'Charlie Chaplin' },
      },
      {
        id: 'u-4',
        email: 'deleted@domain.com',
        created_at: '2026-04-01T10:00:00Z',
        user_metadata: { is_deleted: true },
      },
      {
        id: 'u-5',
        email: 'dave@domain.com',
        created_at: '2026-05-01T10:00:00Z',
        banned_until: '2099-01-01T00:00:00Z',
        user_metadata: { full_name: 'Dave Suspended' },
      },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
      repository = new SupabaseAdminRepository();
      repository.invalidateUsersCache();

      mockAuthAdmin.listUsers.mockResolvedValue({
        data: { users: sampleUsers },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'workspace_members') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { user_id: 'u-1', workspaces: { plan: 'creator' } },
                  { user_id: 'u-2', workspaces: [{ plan: 'pro' }] },
                  { user_id: 'u-3', workspaces: null },
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
    });

    it('returns all active users paginated with exact total count, excluding soft-deleted', async () => {
      const result = await repository.listAllUsers({ page: 1, pageSize: 10 });
      expect(result.total).toBe(4); // u-1, u-2, u-3, u-5 (u-4 is deleted)
      expect(result.data.length).toBe(4);
      expect(result.data.some((u) => u.id === 'u-4')).toBe(false);

      // Check workspace plan extraction (both object and array foreign key shapes)
      const u1 = result.data.find((u) => u.id === 'u-1');
      expect(u1?.plan).toBe('creator');
      expect(u1?.workspaceCount).toBe(1);

      const u2 = result.data.find((u) => u.id === 'u-2');
      expect(u2?.plan).toBe('pro');
      expect(u2?.workspaceCount).toBe(1);

      const u5 = result.data.find((u) => u.id === 'u-5');
      expect(u5?.suspended).toBe(true);
    });

    it('accurately searches by partial email (substring, case-insensitive)', async () => {
      const result = await repository.listAllUsers({ search: 'BOB' });
      expect(result.total).toBe(1);
      expect(result.data[0].email).toBe('bob@example.com');
    });

    it('accurately searches by whitespace-padded email', async () => {
      const result = await repository.listAllUsers({ search: '   alice@domain.com   ' });
      expect(result.total).toBe(1);
      expect(result.data[0].email).toBe('alice@domain.com');
    });

    it('searches by user id', async () => {
      const result = await repository.listAllUsers({ search: 'u-3' });
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe('u-3');
      expect(result.data[0].email).toBe('charlie@domain.com');
    });

    it('searches by user_metadata name', async () => {
      const result = await repository.listAllUsers({ search: 'Chaplin' });
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe('u-3');
    });

    it('returns empty results when no user matches search', async () => {
      const result = await repository.listAllUsers({ search: 'nonexistent@nowhere.com' });
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(0);
    });

    it('sorts by createdAt asc and desc properly', async () => {
      const descResult = await repository.listAllUsers({ sortBy: 'createdAt', sortOrder: 'desc' });
      expect(descResult.data[0].id).toBe('u-5'); // newest

      const ascResult = await repository.listAllUsers({ sortBy: 'createdAt', sortOrder: 'asc' });
      expect(ascResult.data[0].id).toBe('u-1'); // oldest
    });

    it('sorts by email properly', async () => {
      const emailAsc = await repository.listAllUsers({ sortBy: 'email', sortOrder: 'asc' });
      expect(emailAsc.data[0].email).toBe('alice@domain.com');
      expect(emailAsc.data[emailAsc.data.length - 1].email).toBe('dave@domain.com');
    });

    it('uses cache and invalidates on invalidateUsersCache', async () => {
      await repository.listAllUsers();
      expect(mockAuthAdmin.listUsers).toHaveBeenCalledTimes(1);

      // Second call uses cache
      await repository.listAllUsers();
      expect(mockAuthAdmin.listUsers).toHaveBeenCalledTimes(1);

      // Invalidate cache
      repository.invalidateUsersCache();
      await repository.listAllUsers();
      expect(mockAuthAdmin.listUsers).toHaveBeenCalledTimes(2);
    });
  });

  describe('SupabaseAdminRepository - updateWorkspacePlan and updateWorkspacePlanStatus', () => {
    let repository: SupabaseAdminRepository;

    beforeEach(() => {
      vi.clearAllMocks();
      repository = new SupabaseAdminRepository();
    });

    it('updates workspace plan directly without calling non-existent RPC', async () => {
      const mockWorkspaceRow = {
        id: 'ws-123',
        name: 'Test Workspace',
        plan: 'pro',
        plan_status: 'active',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-11-14T00:00:00Z',
      };

      const workspaceUpdateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockWorkspaceRow, error: null }),
          }),
        }),
      });

      const subscriptionUpdateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return { update: workspaceUpdateSpy };
        }
        if (table === 'subscriptions') {
          return { update: subscriptionUpdateSpy };
        }
        return {};
      });

      const result = await repository.updateWorkspacePlan('ws-123', 'PRO', 'admin-1');

      expect(mockRpc).not.toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('workspaces');
      expect(workspaceUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ plan: 'pro' })
      );
      expect(mockFrom).toHaveBeenCalledWith('subscriptions');
      expect(subscriptionUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ plan_id: 'pro' })
      );
      expect(result).not.toBeNull();
      expect(result?.plan).toBe('pro');
    });

    it('updates workspace plan status and normalizes "cancelled" to "canceled" for workspaces and "cancelled" for subscriptions', async () => {
      const mockWorkspaceRow = {
        id: 'ws-456',
        name: 'Another Workspace',
        plan: 'pro',
        plan_status: 'canceled',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-11-14T00:00:00Z',
      };

      const workspaceUpdateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockWorkspaceRow, error: null }),
          }),
        }),
      });

      const subscriptionUpdateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return { update: workspaceUpdateSpy };
        }
        if (table === 'subscriptions') {
          return { update: subscriptionUpdateSpy };
        }
        return {};
      });

      const result = await repository.updateWorkspacePlanStatus('ws-456', 'cancelled', 'admin-1');

      expect(mockRpc).not.toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('workspaces');
      expect(workspaceUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ plan_status: 'canceled' })
      );
      expect(mockFrom).toHaveBeenCalledWith('subscriptions');
      expect(subscriptionUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' })
      );
      expect(result).not.toBeNull();
      expect(result?.planStatus).toBe('canceled');
    });
  });
});
