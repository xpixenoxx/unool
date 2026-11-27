import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  referralCodes: [] as Record<string, any>[],
  referrals: [] as Record<string, any>[],
  referralRewards: [] as Record<string, any>[],
  profiles: [] as Record<string, any>[],
  workspaces: [] as Record<string, any>[],
  workspaceMembers: [] as Record<string, any>[],
  users: [] as Record<string, any>[],
  subscriptions: [] as Record<string, any>[],
  cookiesMap: new Map<string, string>(),
  oauthSessionUser: null as Record<string, any> | null,
};

function makeTableBuilder(table: string) {
  let op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  let payload: any = null;
  const eqFilters: Array<[string, any]> = [];
  const inFilters: Array<[string, any[]]> = [];

  const getStore = (): Record<string, any>[] => {
    switch (table) {
      case 'referral_codes':
        return state.referralCodes;
      case 'referrals':
        return state.referrals;
      case 'referral_rewards':
        return state.referralRewards;
      case 'profiles':
        return state.profiles;
      case 'workspaces':
        return state.workspaces;
      case 'workspace_members':
        return state.workspaceMembers;
      case 'users':
        return state.users;
      case 'subscriptions':
        return state.subscriptions;
      default:
        return [];
    }
  };

  const matchRows = () => {
    const store = getStore();
    return store.filter((row) => {
      for (const [k, v] of eqFilters) {
        if (v === null) {
          if (row[k] !== null && row[k] !== undefined) return false;
        } else if (row[k] !== v) {
          return false;
        }
      }
      for (const [k, vals] of inFilters) {
        if (!vals.includes(row[k])) return false;
      }
      return true;
    });
  };

  const execute = () => {
    const store = getStore();
    if (op === 'insert') {
      const items = Array.isArray(payload) ? payload : [payload];
      const inserted = items.map((item, idx) => {
        if (table === 'referrals' && store.some((r) => r.referred_user_id === item.referred_user_id)) {
          return null;
        }
        const row = {
          id: item.id || `${table}-${store.length + idx + 1}`,
          click_count: 0,
          signup_count: 0,
          conversion_count: 0,
          rewards_earned: 0,
          credits_used: 0,
          months_earned: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item,
        };
        store.push(row);
        return row;
      });
      if (inserted.some((r) => r === null)) {
        return { data: null, error: { code: '23505', message: 'duplicate key value' } };
      }
      return { data: Array.isArray(payload) ? inserted : inserted[0], error: null };
    }
    if (op === 'upsert') {
      const row = {
        id: payload.id || `${table}-${store.length + 1}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...payload,
      };
      const existingIdx = store.findIndex(
        (r) =>
          (payload.id && r.id === payload.id) ||
          (table === 'subscriptions' && payload.workspace_id && r.workspace_id === payload.workspace_id)
      );
      if (existingIdx >= 0) {
        store[existingIdx] = { ...store[existingIdx], ...row };
        return { data: store[existingIdx], error: null };
      }
      store.push(row);
      return { data: row, error: null };
    }
    if (op === 'update') {
      const matched = matchRows();
      for (const r of matched) {
        Object.assign(r, payload);
      }
      return { data: matched, error: null };
    }
    const matched = matchRows();
    return { data: matched, count: matched.length, error: null };
  };

  const builder: Record<string, any> = {
    select: () => builder,
    insert: (p: any) => {
      op = 'insert';
      payload = p;
      return builder;
    },
    update: (p: any) => {
      op = 'update';
      payload = p;
      return builder;
    },
    upsert: (p: any) => {
      op = 'upsert';
      payload = p;
      return builder;
    },
    delete: () => {
      op = 'delete';
      return builder;
    },
    eq: (col: string, val: any) => {
      eqFilters.push([col, val]);
      return builder;
    },
    is: (col: string, val: any) => {
      eqFilters.push([col, val]);
      return builder;
    },
    in: (col: string, vals: any[]) => {
      inFilters.push([col, vals]);
      return builder;
    },
    or: () => builder,
    not: () => builder,
    gte: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    maybeSingle: async () => {
      const res = execute();
      const row = Array.isArray(res.data) ? (res.data[0] ?? null) : res.data;
      return { data: row, error: res.error };
    },
    single: async () => {
      const res = execute();
      const row = Array.isArray(res.data) ? (res.data[0] ?? null) : res.data;
      return { data: row, error: res.error };
    },
    then: (onFulfilled: any, onRejected: any) => Promise.resolve(execute()).then(onFulfilled, onRejected),
  };

  return builder;
}

const mockSupabaseAdmin = {
  from: (table: string) => makeTableBuilder(table),
  rpc: async (fn: string, args: Record<string, any>) => {
    if (fn === 'increment_referral_click') {
      const code = String(args.target_code || '').trim().toUpperCase();
      const row = state.referralCodes.find((r) => r.code === code);
      if (!row) return { data: [], error: null };
      row.click_count = (row.click_count || 0) + 1;
      return { data: [row], error: null };
    }
    if (fn === 'apply_referral_signup_reward') {
      const code = String(args.target_code || '').trim().toUpperCase();
      const row = state.referralCodes.find((r) => r.code === code);
      if (!row) return { data: [], error: null };
      row.signup_count = (row.signup_count || 0) + 1;
      row.rewards_earned = (row.rewards_earned || 0) + Number(args.reward_credits || 0);
      return { data: [{ user_id: row.user_id, rewards_earned: row.rewards_earned }], error: null };
    }
    if (fn === 'adjust_referral_conversion_rewards') {
      const code = String(args.target_code || '').trim().toUpperCase();
      const row = state.referralCodes.find((r) => r.code === code);
      if (!row) return { data: [], error: null };
      row.conversion_count = Math.max(0, (row.conversion_count || 0) + Number(args.delta_conversions || 0));
      row.rewards_earned = Math.max(
        row.credits_used || 0,
        (row.rewards_earned || 0) + Number(args.delta_credits || 0)
      );
      row.months_earned = Math.max(0, (row.months_earned || 0) + Number(args.delta_months || 0));
      return { data: [row], error: null };
    }
    if (fn === 'consume_referral_ai_credit') {
      const row = state.referralCodes.find((r) => r.user_id === args.target_user_id);
      const amt = Number(args.credit_amount || 1);
      if (!row || (row.rewards_earned || 0) - (row.credits_used || 0) < amt) {
        return { data: false, error: null };
      }
      row.credits_used = (row.credits_used || 0) + amt;
      state.referralRewards.push({
        id: `rew-${state.referralRewards.length + 1}`,
        user_id: args.target_user_id,
        credits: -amt,
        reason: 'ai_credit_consumed',
      });
      return { data: true, error: null };
    }
    return { data: null, error: { message: 'unsupported rpc' } };
  },
};

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseAdmin,
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      exchangeCodeForSession: async () => ({
        data: { session: { user: state.oauthSessionUser } },
        error: null,
      }),
      getUser: async () => ({
        data: { user: state.oauthSessionUser },
        error: null,
      }),
    },
  }),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      state.cookiesMap.has(name) ? { name, value: state.cookiesMap.get(name)! } : undefined,
    getAll: () => Array.from(state.cookiesMap.entries()).map(([name, value]) => ({ name, value })),
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      if (options?.maxAge === 0) {
        state.cookiesMap.delete(name);
      } else {
        state.cookiesMap.set(name, value);
      }
    },
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 19, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({}),
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NEXT_PUBLIC_APP_URL: 'https://unool.co',
    NODE_ENV: 'test',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('Production Referral System End-to-End Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.referralCodes = [];
    state.referrals = [];
    state.referralRewards = [];
    state.profiles = [];
    state.workspaces = [];
    state.workspaceMembers = [];
    state.users = [];
    state.subscriptions = [];
    state.cookiesMap.clear();
    state.oauthSessionUser = null;
  });

  it('resolves creator subdomain aliases (?ref=myhandle & /r/myhandle) to canonical referral code and tracks clicks + signups', async () => {
    state.workspaces.push({
      id: 'ws-creator',
      owner_id: 'user-creator',
      name: 'Creator WS',
      plan: 'spark',
    });
    state.profiles.push({
      id: 'prof-1',
      user_id: 'user-creator',
      workspace_id: 'ws-creator',
      subdomain: 'alex-studio',
      name: 'Alex Studio',
      deleted_at: null,
    });

    const { GET: referralRedirectGET } = await import('@/app/r/[code]/route');
    const redirectRes = await referralRedirectGET(
      new NextRequest('https://unool.co/r/alex-studio'),
      { params: Promise.resolve({ code: 'alex-studio' }) }
    );

    expect(redirectRes.status).toBe(307);
    expect(state.referralCodes.length).toBe(1);
    const generatedCode = state.referralCodes[0].code;
    expect(generatedCode).toMatch(/^ALEX[A-Z0-9]{4}$/);
    expect(state.referralCodes[0].click_count).toBe(1);
    expect(redirectRes.headers.get('location')).toContain(`ref=${generatedCode}`);

    // Subsequent signup with either the subdomain alias OR canonical code attributes 200 AI credits once
    const { recordReferralSignup } = await import('@/lib/referrals/service');
    await recordReferralSignup('new-user-1', 'alex-studio');
    await recordReferralSignup('new-user-1', generatedCode); // idempotent duplicate guard

    expect(state.referrals.length).toBe(1);
    expect(state.referrals[0].referrer_user_id).toBe('user-creator');
    expect(state.referrals[0].referral_code).toBe(generatedCode);
    expect(state.referralCodes[0].signup_count).toBe(1);
    expect(state.referralCodes[0].rewards_earned).toBe(200);
  });

  it('attributes Google OAuth signups even when public.handle_new_user() trigger already inserted users/workspaces, while blocking returning logins', async () => {
    state.referralCodes.push({
      id: 'rc-ref',
      user_id: 'referrer-1',
      workspace_id: 'ws-ref',
      code: 'KERASW42',
      click_count: 1,
      signup_count: 0,
      conversion_count: 0,
      rewards_earned: 0,
      credits_used: 0,
      months_earned: 0,
    });

    // Simulate public.handle_new_user() DB trigger having ALREADY inserted user + workspace + member
    const nowIso = new Date().toISOString();
    state.users.push({ id: 'google-new-1', email: 'newgoogle@example.com', full_name: 'New Google' });
    state.workspaces.push({ id: 'ws-google-1', owner_id: 'google-new-1', name: 'My Workspace', plan: 'spark' });
    state.workspaceMembers.push({ workspace_id: 'ws-google-1', user_id: 'google-new-1', role: 'owner' });

    state.oauthSessionUser = {
      id: 'google-new-1',
      email: 'newgoogle@example.com',
      created_at: nowIso,
      last_sign_in_at: nowIso,
      user_metadata: { full_name: 'New Google' },
    };

    const { GET: oauthCallbackGET } = await import('@/app/auth/callback/route');
    const res = await oauthCallbackGET(
      new NextRequest('https://unool.co/auth/callback?code=pkce-123&redirect=/dashboard&ref=KERASW42')
    );

    expect(res.status).toBe(307);
    expect(state.referrals.length).toBe(1);
    expect(state.referrals[0].referred_user_id).toBe('google-new-1');
    expect(state.referrals[0].referral_code).toBe('KERASW42');
    expect(state.referralCodes[0].signup_count).toBe(1);
    expect(state.referralCodes[0].rewards_earned).toBe(200);
    // New OAuth user also got their own referral code generated automatically
    expect(state.referralCodes.some((c) => c.user_id === 'google-new-1')).toBe(true);

    // Returning Google OAuth user (account created 5 days ago, logging in today with a stale unool_ref cookie)
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    state.cookiesMap.set('unool_ref', 'KERASW42');
    state.users.push({ id: 'google-old-1', email: 'old@example.com', full_name: 'Old User' });
    state.workspaces.push({ id: 'ws-old-1', owner_id: 'google-old-1', name: 'Old WS', plan: 'spark' });
    state.workspaceMembers.push({ workspace_id: 'ws-old-1', user_id: 'google-old-1', role: 'owner' });
    state.oauthSessionUser = {
      id: 'google-old-1',
      email: 'old@example.com',
      created_at: fiveDaysAgo,
      last_sign_in_at: new Date().toISOString(),
      user_metadata: { full_name: 'Old User' },
    };

    await oauthCallbackGET(new NextRequest('https://unool.co/auth/callback?code=pkce-old&redirect=/dashboard'));
    expect(state.referrals.some((r) => r.referred_user_id === 'google-old-1')).toBe(false);
    expect(state.referralCodes[0].signup_count).toBe(1);
  });

  it('extends paid workspace plan_expires_at by 30 days on conversion even when subscriptions row is absent, and resolves owner AI credits for team members', async () => {
    const initialExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    state.workspaces.push({
      id: 'ws-pro',
      owner_id: 'owner-pro',
      plan: 'pro',
      plan_status: 'active',
      plan_expires_at: initialExpiry.toISOString(),
    });
    state.referralCodes.push({
      id: 'rc-pro',
      user_id: 'owner-pro',
      workspace_id: 'ws-pro',
      code: 'PROUSER1',
      click_count: 3,
      signup_count: 1,
      conversion_count: 0,
      rewards_earned: 200,
      credits_used: 0,
      months_earned: 0,
    });
    state.referrals.push({
      id: 'ref-pro-1',
      referrer_user_id: 'owner-pro',
      referred_user_id: 'buyer-1',
      referral_code: 'PROUSER1',
      status: 'signed_up',
    });

    const { recordReferralConversion } = await import('@/lib/referrals/service');
    await recordReferralConversion('buyer-1');

    expect(state.referrals[0].status).toBe('rewarded');
    expect(state.referralCodes[0].conversion_count).toBe(1);
    expect(state.referralCodes[0].months_earned).toBe(1);
    expect(state.referralCodes[0].rewards_earned).toBe(1200);

    const updatedExpiryMs = new Date(state.workspaces[0].plan_expires_at).getTime();
    const expectedMinMs = initialExpiry.getTime() + 29 * 24 * 60 * 60 * 1000;
    expect(updatedExpiryMs).toBeGreaterThan(expectedMinMs);

    // Team member (not owner) querying bonus AI credits for ws-pro resolves owner-pro's 1200 credits
    const { getReferralBonusAiCredits } = await import('@/lib/entitlements');
    const balance = await getReferralBonusAiCredits('ws-pro', 'team-member-99');
    expect(balance.ownerId).toBe('owner-pro');
    expect(balance.available).toBe(1200);
  });

  it('preserves unool_ref cookie across middleware redirects and excludes refunded referrals from admin conversion counts', async () => {
    const { middleware } = await import('@/middleware');
    const dashRes = await middleware(new NextRequest('https://unool.co/dashboard?ref=usha5a03'));
    expect(dashRes.status).toBe(307);
    expect(dashRes.headers.get('location')).toContain('ref=USHA5A03');
    expect(dashRes.cookies.get('unool_ref')?.value).toBe('USHA5A03');

    state.referralCodes.push({
      id: 'rc-admin-1',
      user_id: 'owner-1',
      workspace_id: 'ws-1',
      code: 'USHA5A03',
      click_count: 5,
      signup_count: 2,
      conversion_count: 0,
      rewards_earned: 400,
      credits_used: 0,
      months_earned: 0,
    });
    state.referrals.push(
      {
        id: 'ref-a1',
        referrer_user_id: 'owner-1',
        referred_user_id: 'u-1',
        referral_code: 'USHA5A03',
        status: 'signed_up',
      },
      {
        id: 'ref-a2',
        referrer_user_id: 'owner-1',
        referred_user_id: 'u-2',
        referral_code: 'USHA5A03',
        status: 'refunded',
      }
    );
    // Even if u-1 received a free Creator voucher (without paying), Admin must NOT count signed_up/refunded as paid conversions
    state.workspaces.push({ id: 'ws-u1', owner_id: 'u-1', name: 'U1 WS', plan: 'creator' });

    const { SupabaseAdminRepository } = await import('@/lib/repositories/supabase/SupabaseAdminRepository');
    const repo = new SupabaseAdminRepository();
    const list = await repo.listReferralCodes();
    expect(list.data[0].conversionCount).toBe(0);
    expect(list.data[0].signupCount).toBe(2);
  });
});
