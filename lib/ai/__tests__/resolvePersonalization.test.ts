import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveAiPersonalization } from '../resolvePersonalization';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

function makeTableQuery(result: { data: any; error: any }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

describe('resolveAiPersonalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('short-circuits to disabled when disablePersonalization is true', async () => {
    const res = await resolveAiPersonalization({
      userId: 'user-1',
      workspaceId: 'ws-1',
      disablePersonalization: true,
      bodyStudioProfile: { role: 'Founder' },
    });

    expect(res).toEqual({ enabled: false, studioProfile: null });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('honors explicit user_preferences.ai_personalization_enabled = false opt-out', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_preferences') {
        return makeTableQuery({ data: { ai_personalization_enabled: false }, error: null });
      }
      if (table === 'studio_profiles') {
        return makeTableQuery({ data: { profile_data: { role: 'Writer' } }, error: null });
      }
      return makeTableQuery({ data: { settings: { studio_profile: { role: 'WS' } } }, error: null });
    });

    const res = await resolveAiPersonalization({
      userId: 'user-1',
      workspaceId: 'ws-1',
      bodyStudioProfile: { role: 'BodyOverride' },
    });

    expect(res).toEqual({ enabled: false, studioProfile: null });
  });

  it('falls back to workspaces.settings.preferences when user_preferences table query errors pre-migration', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_preferences') {
        return makeTableQuery({ data: null, error: { message: 'relation "user_preferences" does not exist' } });
      }
      if (table === 'workspaces') {
        return makeTableQuery({
          data: { settings: { preferences: { ai_personalization_enabled: false } } },
          error: null,
        });
      }
      return makeTableQuery({ data: null, error: null });
    });

    const res = await resolveAiPersonalization({
      userId: 'user-1',
      workspaceId: 'ws-1',
      profileStudioProfile: { role: 'Creator' },
    });

    expect(res).toEqual({ enabled: false, studioProfile: null });
  });

  it('prefers dedicated studio_profiles over workspace/profile fallback when enabled', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_preferences') {
        return makeTableQuery({ data: { ai_personalization_enabled: true }, error: null });
      }
      if (table === 'studio_profiles') {
        return makeTableQuery({ data: { profile_data: { role: 'DedicatedStudioRole' } }, error: null });
      }
      if (table === 'workspaces') {
        return makeTableQuery({
          data: { settings: { studio_profile: { role: 'WorkspaceFallbackRole' } } },
          error: null,
        });
      }
      return makeTableQuery({ data: null, error: null });
    });

    const res = await resolveAiPersonalization({
      userId: 'user-1',
      workspaceId: 'ws-1',
      profileStudioProfile: { role: 'ProfileRole' },
    });

    expect(res).toEqual({
      enabled: true,
      studioProfile: { role: 'DedicatedStudioRole' },
    });
  });

  it('gives highest priority to explicit bodyStudioProfile when personalization is enabled', async () => {
    mockFrom.mockImplementation(() => makeTableQuery({ data: null, error: null }));

    const res = await resolveAiPersonalization({
      userId: 'user-1',
      workspaceId: 'ws-1',
      bodyStudioProfile: { role: 'ExplicitRequestProfile' },
      profileStudioProfile: { role: 'ProfileRole' },
    });

    expect(res).toEqual({
      enabled: true,
      studioProfile: { role: 'ExplicitRequestProfile' },
    });
  });

  it('fails open with profileStudioProfile fallback if DB throws unexpectedly', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('DB connection unavailable');
    });

    const res = await resolveAiPersonalization({
      userId: 'user-1',
      workspaceId: 'ws-1',
      profileStudioProfile: { role: 'FallbackProfile' },
    });

    expect(res).toEqual({
      enabled: true,
      studioProfile: { role: 'FallbackProfile' },
    });
  });
});
