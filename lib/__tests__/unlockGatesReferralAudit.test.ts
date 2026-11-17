import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockState = vi.hoisted(() => ({
  authUser: null as { userId: string; workspaceId: string } | null,
  ssrUser: null as { id: string; email?: string } | null,
  hasAccess: true,
  automationFlag: true,
  workspaceRow: {
    id: 'ws-1',
    owner_id: 'user-1',
    plan: 'spark',
    plan_status: 'active',
    plan_expires_at: null as string | null,
    features: null as Record<string, unknown> | null,
    settings: {} as Record<string, unknown>,
  },
  subscriptionRow: null as Record<string, unknown> | null,
  planRow: null as Record<string, unknown> | null,
  referralCodeRow: null as Record<string, unknown> | null,
  referralRow: null as Record<string, unknown> | null,
  followGateRow: null as Record<string, unknown> | null,
  paymentOrderRow: null as Record<string, unknown> | null,
  counts: {
    ai_usage: 0,
    posts: 0,
    profiles: 1,
    workspace_members: 1,
    media_uploads: 0,
    api_calls: 0,
    platform_connections: 0,
    instagram_comment_logs: 0,
    instagram_dm_logs: 0,
    brand_materials_pages: 0,
  } as Record<string, number>,
  dbOps: [] as Array<{ table: string; op: string; payload?: unknown; col?: string; val?: unknown }>,
  rpcCalls: [] as Array<{ fn: string; params: unknown }>,
  authDeleteUser: vi.fn(),
  authListUsers: vi.fn(),
  authUpdateUserById: vi.fn(),
  authGenerateLink: vi.fn(),
  ssrVerifyOtp: vi.fn(),
}));

function makeAdminChain(table: string) {
  let pendingUpdate: unknown = null;
  const eqFilters: Record<string, unknown> = {};
  const chain: any = {
    select: () => chain,
    eq: (col: string, val: unknown) => {
      eqFilters[col] = val;
      if (chain._isDelete) {
        mockState.dbOps.push({ table, op: 'delete_eq', col, val });
      }
      return chain;
    },
    in: () => chain,
    is: () => chain,
    gte: () => chain,
    lt: () => chain,
    or: () => chain,
    order: () => chain,
    limit: () => chain,
    insert: (payload: unknown) => {
      mockState.dbOps.push({ table, op: 'insert', payload });
      return chain;
    },
    upsert: (payload: unknown) => {
      mockState.dbOps.push({ table, op: 'upsert', payload });
      return chain;
    },
    update: (payload: unknown) => {
      pendingUpdate = payload;
      mockState.dbOps.push({ table, op: 'update', payload });
      return chain;
    },
    delete: () => {
      chain._isDelete = true;
      mockState.dbOps.push({ table, op: 'delete' });
      return chain;
    },
    single: async () => {
      if (table === 'workspaces' || table === 'workspace_admin_view') {
        return { data: { ...mockState.workspaceRow }, error: null };
      }
      if (table === 'plans') {
        return { data: mockState.planRow, error: mockState.planRow ? null : { message: 'none' } };
      }
      if (table === 'referral_codes') {
        const created = mockState.referralCodeRow || {
          id: 'rc-1',
          user_id: 'user-1',
          workspace_id: 'ws-1',
          code: 'UNO1234',
          click_count: 0,
          signup_count: 0,
          conversion_count: 0,
          rewards_earned: 0,
          credits_used: 0,
          months_earned: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { data: created, error: null };
      }
      if (table === 'follow_gates') {
        return { data: mockState.followGateRow, error: null };
      }
      if (table === 'payment_orders') {
        return { data: mockState.paymentOrderRow, error: null };
      }
      return { data: null, error: null };
    },
    maybeSingle: async () => {
      if (table === 'workspaces') return { data: { ...mockState.workspaceRow }, error: null };
      if (table === 'subscriptions') return { data: mockState.subscriptionRow, error: null };
      if (table === 'referral_codes') return { data: mockState.referralCodeRow, error: null };
      if (table === 'referrals') return { data: mockState.referralRow, error: null };
      if (table === 'follow_gates') return { data: mockState.followGateRow, error: null };
      if (table === 'profiles') return { data: { name: 'Creator One' }, error: null };
      return { data: null, error: null };
    },
    then: (resolve: (v: unknown) => void) => {
      if (table === 'referrals' && pendingUpdate && mockState.referralRow) {
        const claimed = { ...mockState.referralRow, ...(pendingUpdate as object) };
        return Promise.resolve({ data: [claimed], error: null }).then(resolve);
      }
      if (table === 'payment_orders' && pendingUpdate && mockState.paymentOrderRow) {
        return Promise.resolve({ data: [{ id: 'po-1' }], error: null }).then(resolve);
      }
      if (table === 'referral_codes') {
        const rows = mockState.referralCodeRow ? [mockState.referralCodeRow] : [];
        return Promise.resolve({ data: rows, count: rows.length, error: null }).then(resolve);
      }
      if (table === 'referrals') {
        const rows = mockState.referralRow ? [mockState.referralRow] : [];
        return Promise.resolve({ data: rows, count: rows.length, error: null }).then(resolve);
      }
      if (table === 'workspaces') {
        return Promise.resolve({ data: [mockState.workspaceRow], count: 1, error: null }).then(resolve);
      }
      const count = mockState.counts[table] ?? 0;
      return Promise.resolve({ data: [], count, error: null }).then(resolve);
    },
  };
  return chain;
}

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (table: string) => makeAdminChain(table),
    rpc: async (fn: string, params: unknown) => {
      mockState.rpcCalls.push({ fn, params });
      return { data: null, error: { message: 'rpc not mocked — use fallback' } };
    },
    auth: {
      admin: {
        getUserById: async (id: string) => ({
          data: {
            user: {
              id,
              email: 'target@unool.co',
              banned_until: null,
              user_metadata: { full_name: 'Target User' },
            },
          },
          error: null,
        }),
        updateUserById: (...args: unknown[]) => mockState.authUpdateUserById(...args),
        generateLink: (...args: unknown[]) => mockState.authGenerateLink(...args),
        deleteUser: (...args: unknown[]) => mockState.authDeleteUser(...args),
        listUsers: (...args: unknown[]) => mockState.authListUsers(...args),
      },
      getUser: async () => ({ data: { user: mockState.ssrUser }, error: null }),
    },
  },
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: async () => mockState.authUser,
}));

vi.mock('@/lib/auth/workspaceAccess', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/workspaceAccess')>();
  return {
    ...actual,
    verifyWorkspaceAccess: async () => mockState.hasAccess,
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: mockState.ssrUser } }),
    },
  }),
  getUser: async () => mockState.ssrUser,
}));

vi.mock('@/lib/feature-flags-server', () => ({
  isAutomationEnabledServer: async () => mockState.automationFlag,
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      verifyOtp: (...args: unknown[]) => mockState.ssrVerifyOtp(...args),
    },
  }),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    get: () => undefined,
    set: vi.fn(),
  }),
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    AI_DEFAULT_MODEL: 'llama-3.3-70b-versatile',
    RATE_LIMIT_AI_PER_MIN: 20,
    RATE_LIMIT_PUBLISH_PER_MIN: 30,
    RATE_LIMIT_AUTH_PER_HOUR: 10,
  },
}));

vi.mock('@/lib/auth/account-switch-token', () => ({
  createAccountSwitchToken: () => 'fresh-switch-tok',
  verifyAccountSwitchToken: () => ({ userId: 'user-2', email: 'target@unool.co', securityVersion: 1 }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('Unlock Gates, Referral & Product Architecture Audit Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.authUpdateUserById.mockResolvedValue({ data: { user: {} }, error: null });
    mockState.authGenerateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'mock-hashed-token' } },
      error: null,
    });
    mockState.ssrVerifyOtp.mockResolvedValue({
      data: {
        session: { access_token: 'tok', refresh_token: 'rtok', expires_at: 9999999999 },
        user: { id: 'user-2', email: 'target@unool.co' },
      },
      error: null,
    });
    mockState.authDeleteUser.mockResolvedValue({ error: null });
    mockState.authListUsers.mockResolvedValue({ data: { users: [] }, error: null });
    mockState.authUser = { userId: 'user-1', workspaceId: 'ws-1' };
    mockState.ssrUser = { id: 'user-1', email: 'creator@unool.co' };
    mockState.hasAccess = true;
    mockState.automationFlag = true;
    mockState.workspaceRow = {
      id: 'ws-1',
      owner_id: 'user-1',
      plan: 'spark',
      plan_status: 'active',
      plan_expires_at: null,
      features: null,
      settings: {},
    };
    mockState.subscriptionRow = null;
    mockState.planRow = null;
    mockState.referralCodeRow = null;
    mockState.referralRow = null;
    mockState.followGateRow = null;
    mockState.paymentOrderRow = null;
    mockState.counts = {
      ai_usage: 0,
      posts: 0,
      profiles: 1,
      workspace_members: 1,
      media_uploads: 0,
      api_calls: 0,
      platform_connections: 0,
      instagram_comment_logs: 0,
      instagram_dm_logs: 0,
      brand_materials_pages: 0,
    };
    mockState.dbOps = [];
    mockState.rpcCalls = [];
  });

  // ── 1. Wave 1 P0 Auth & Middleware Security ─────────────────────────────
  it('F-UG-01: middleware strips spoofed x-user-id / x-workspace-id on public /api/auth and dot-containing API paths', async () => {
    const { middleware } = await import('@/middleware');
    const authReq = new NextRequest('https://app.unool.co/api/auth/switch-account', {
      headers: {
        'x-user-id': 'victim-user',
        'x-workspace-id': 'victim-ws',
      },
    });
    const authRes = await middleware(authReq);
    expect(authRes.headers.get('x-middleware-request-x-user-id')).toBeNull();
    expect(authRes.headers.get('x-middleware-request-x-workspace-id')).toBeNull();

    const dotReq = new NextRequest('https://app.unool.co/api/profile/export.json', {
      headers: {
        'x-user-id': 'victim-user',
        'x-workspace-id': 'victim-ws',
      },
    });
    const dotRes = await middleware(dotReq);
    expect(dotRes.headers.get('x-middleware-request-x-user-id')).toBeNull();
  });

  it('F-UG-02: GET switch-account returns 401 without session, and POST uses magiclink verifyOtp without overwriting user password', async () => {
    const { GET, POST } = await import('@/app/api/auth/switch-account/route');
    mockState.authUser = null;
    const getRes = await GET(new NextRequest('https://app.unool.co/api/auth/switch-account'));
    expect(getRes.status).toBe(401);

    const postRes = await POST(
      new NextRequest('https://app.unool.co/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ switchToken: 'valid-token' }),
      })
    );
    expect(postRes.status).toBe(200);
    expect(mockState.authGenerateLink).toHaveBeenCalledWith({
      type: 'magiclink',
      email: 'target@unool.co',
    });
    expect(mockState.ssrVerifyOtp).toHaveBeenCalledWith({
      token_hash: 'mock-hashed-token',
      type: 'magiclink',
    });
    expect(mockState.authUpdateUserById).not.toHaveBeenCalled();
  });

  // ── 2. Wave 1 P0 IDOR & GDPR ─────────────────────────────────────────────
  it('F-UG-03: /api/profile/analytics blocks unauthenticated requests (401) and cross-workspace IDOR (403)', async () => {
    const { GET } = await import('@/app/api/profile/analytics/route');

    mockState.authUser = null;
    const res401 = await GET(new NextRequest('https://app.unool.co/api/profile/analytics?workspaceId=ws-victim'));
    expect(res401.status).toBe(401);

    mockState.authUser = { userId: 'attacker', workspaceId: 'ws-attacker' };
    mockState.hasAccess = false;
    const res403 = await GET(new NextRequest('https://app.unool.co/api/profile/analytics?workspaceId=ws-victim'));
    expect(res403.status).toBe(403);
  }, 15000);

  it('F-UG-04: /api/onboarding enforces session auth (401) and workspace membership (403)', async () => {
    const { GET } = await import('@/app/api/onboarding/route');
    mockState.authUser = null;
    const res401 = await GET(new NextRequest('https://app.unool.co/api/onboarding?workspaceId=ws-victim'));
    expect(res401.status).toBe(401);

    mockState.authUser = { userId: 'attacker', workspaceId: 'ws-attacker' };
    mockState.hasAccess = false;
    const res403 = await GET(new NextRequest('https://app.unool.co/api/onboarding?workspaceId=ws-victim'));
    expect(res403.status).toBe(403);
  });

  it('F-UG-05: /api/user/delete requires explicit DELETE confirmation, uses referrals.referrer_user_id, and purges referral_rewards and users', async () => {
    const { DELETE } = await import('@/app/api/user/delete/route');
    const unconfirmedRes = await DELETE(
      new NextRequest('https://app.unool.co/api/user/delete', { method: 'DELETE' })
    );
    expect(unconfirmedRes.status).toBe(400);

    const req = new NextRequest('https://app.unool.co/api/user/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: 'DELETE' }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const referralDeletes = mockState.dbOps.filter((o) => o.table === 'referrals' && o.op === 'delete_eq');
    expect(referralDeletes.some((d) => d.col === 'referrer_user_id')).toBe(true);
    expect(referralDeletes.some((d) => d.col === 'referrer_id')).toBe(false);
    expect(mockState.dbOps.some((o) => o.table === 'referral_rewards' && o.op === 'delete')).toBe(true);
    expect(mockState.dbOps.some((o) => o.table === 'users' && o.op === 'delete')).toBe(true);
  });

  // ── 3. Wave 2 Follow-Gate Soft-Sunset, IDOR, XSS & Policy ───────────────
  it('F-UG-06: Follow-Gate standalone creation returns 410 sunset, GET enforces workspace isolation, PATCH/Card reject javascript: XSS', async () => {
    const { POST } = await import('@/app/api/follow-gate/route');
    const postRes = await POST();
    expect(postRes.status).toBe(410);

    const { GET, PATCH } = await import('@/app/api/follow-gate/[gateId]/route');
    mockState.followGateRow = {
      id: 'gate-victim',
      workspace_id: 'ws-victim',
      title: 'VIP',
      ig_username: 'victim',
      ig_user_id: 'ig-1',
      unlocked_content: { type: 'link', label: 'Open', url: 'https://unool.co' },
      cta_text: 'Follow',
      is_active: true,
      view_count: 0,
      unlock_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const getRes = await GET(
      new NextRequest('https://app.unool.co/api/follow-gate/gate-victim?workspaceId=ws-attacker'),
      { params: Promise.resolve({ gateId: 'gate-victim' }) }
    );
    expect(getRes.status).toBe(403);

    mockState.followGateRow.workspace_id = 'ws-attacker';
    const xssPatch = await PATCH(
      new NextRequest('https://app.unool.co/api/follow-gate/gate-victim', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws-attacker',
          unlockedContent: { type: 'link', label: 'Bad', url: 'javascript:alert(1)' },
        }),
      }),
      { params: Promise.resolve({ gateId: 'gate-victim' }) }
    );
    expect(xssPatch.status).toBe(400);

    const { sanitizeHttpHref } = await import('@/lib/follow-gate/url');
    expect(sanitizeHttpHref('javascript:alert(document.cookie)')).toBeNull();
    expect(sanitizeHttpHref('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeHttpHref('https://example.com/resource')).toBe('https://example.com/resource');
  });

  it('F-UG-07: In-DM Follow Gate honors custom followAskMessage and enforces admin flag + monthly IG quota', async () => {
    const {
      formatFollowGatePublicAsk,
      checkFollowGateDmEligibility,
    } = await import('@/lib/services/automation/followGatePolicy');

    expect(formatFollowGatePublicAsk('Hey! Follow {{handle}} & DM SENDME', '@creator')).toBe(
      'Hey! Follow @creator & DM SENDME'
    );
    expect(formatFollowGatePublicAsk(null, '@creator')).toContain('@creator');

    mockState.automationFlag = false;
    const flagBlocked = await checkFollowGateDmEligibility('ws-1', 'user-1');
    expect(flagBlocked.allowed).toBe(false);

    mockState.automationFlag = true;
    mockState.counts.instagram_comment_logs = 200;
    mockState.counts.instagram_dm_logs = 50; // Spark limit = 250
    const quotaBlocked = await checkFollowGateDmEligibility('ws-1', 'user-1');
    expect(quotaBlocked.allowed).toBe(false);
  });

  // ── 4. Unified Entitlements, Referral Bonus AI Credits & LinkedIn Quota ──
  it('F-UG-08: Referral bonus AI credits extend Spark AI quota and debit when used over base monthly limit', async () => {
    const { enforcePlanLimits, trackAiUsage } = await import('@/lib/entitlements');

    // Exhaust base Spark 25/mo quota, zero bonus credits -> blocked
    mockState.counts.ai_usage = 25;
    mockState.referralCodeRow = { rewards_earned: 0, credits_used: 0 };
    const blocked = await enforcePlanLimits('ws-1', 'use_ai');
    expect(blocked.allowed).toBe(false);

    // Grant 10 referral bonus credits -> allowed (10 remaining above base 25)
    mockState.referralCodeRow = { rewards_earned: 10, credits_used: 0 };
    const allowed = await enforcePlanLimits('ws-1', 'use_ai');
    expect(allowed.allowed).toBe(true);
    expect(allowed.checks.ai_credits_per_month.remaining).toBe(10);

    // Executing AI usage while over base monthly limit consumes 1 bonus credit
    await trackAiUsage('ws-1', 'user-1', 100, 150, 'studio-ideas', 'llama');
    expect(mockState.rpcCalls.some((r) => r.fn === 'consume_referral_ai_credit')).toBe(true);
    const debitUpdate = mockState.dbOps.find(
      (o) => o.table === 'referral_codes' && o.op === 'update' && (o.payload as any)?.credits_used === 1
    );
    expect(debitUpdate).toBeDefined();
  });

  it('F-UG-09: Unified LinkedIn comment quota parses workspaces.settings.linkedin_comment_logs accurately', async () => {
    const { enforcePlanLimits } = await import('@/lib/entitlements');
    const nowIso = new Date().toISOString();
    mockState.workspaceRow.settings = {
      linkedin_comment_logs: Array.from({ length: 50 }, (_, idx) => ({
        id: `li-${idx}`,
        auto_replied: true,
        created_at: nowIso,
      })),
    };

    const res = await enforcePlanLimits('ws-1', 'linkedin_comment_reply');
    expect(res.allowed).toBe(false);
    expect(res.checks.linkedin_comments_per_month.current).toBe(50);
    expect(res.checks.linkedin_comments_per_month.limit).toBe(50);
  });

  it('F-UG-10: Studio Ideas enforces AI quota & FB Automation PUT enforces admin kill-switch', async () => {
    const { POST: studioIdeasPOST } = await import('@/app/api/studio/ideas/route');
    mockState.counts.ai_usage = 25;
    mockState.referralCodeRow = { rewards_earned: 0, credits_used: 0 };
    const ideaRes = await studioIdeasPOST(
      new NextRequest('https://app.unool.co/api/studio/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    );
    expect(ideaRes.status).toBe(403);

    const { PUT: fbPUT } = await import('@/app/api/facebook/automation/route');
    mockState.automationFlag = false;
    const fbRes = await fbPUT(
      new NextRequest('https://app.unool.co/api/facebook/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: 'ws-1', enabled: true }),
      })
    );
    expect(fbRes.status).toBe(403);
  });

  // ── 5. Referrals End-to-End, Spark 30d Creator, Refund Reversal & Admin ───
  it('F-UG-11: GET /api/referrals ensures code before stats, /r/[code] deduplicates clicks, Conversion grants 30d Creator to Spark, Refund reverses', async () => {
    const { GET: getReferralsGET } = await import('@/app/api/referrals/route');
    const refGetRes = await getReferralsGET(
      new NextRequest('https://app.unool.co/api/referrals?workspaceId=ws-1')
    );
    expect(refGetRes.status).toBe(200);
    const refData = await refGetRes.json();
    expect(refData.code?.code).toBeTruthy();

    // /r/[code] + /api/referrals/click deduplication via unool_ref_clicked cookie
    const { POST: clickPOST } = await import('@/app/api/referrals/click/route');
    mockState.referralCodeRow = {
      id: 'rc-1',
      user_id: 'user-1',
      workspace_id: 'ws-1',
      code: 'UNO1234',
      click_count: 1,
      signup_count: 0,
      conversion_count: 0,
      rewards_earned: 0,
      credits_used: 0,
      months_earned: 0,
    };
    const dedupReq = new NextRequest('https://app.unool.co/api/referrals/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'unool_ref_clicked=UNO1234',
      },
      body: JSON.stringify({ code: 'UNO1234' }),
    });
    const dedupRes = await clickPOST(dedupReq);
    expect(dedupRes.status).toBe(200);
    const dedupJson = await dedupRes.json();
    expect(dedupJson.deduplicated).toBe(true);

    // Spark referrer receives real 30-day Creator plan upgrade upon referral conversion
    mockState.referralRow = {
      id: 'ref-1',
      referrer_user_id: 'user-1',
      referred_user_id: 'referred-u-1',
      referral_code: 'UNO1234',
      status: 'signed_up',
    };
    const { recordReferralConversion } = await import('@/lib/referrals/service');
    await recordReferralConversion('referred-u-1');

    const creatorUpgrade = mockState.dbOps.find(
      (o) => o.table === 'workspaces' && o.op === 'update' && (o.payload as any)?.plan === 'creator'
    );
    expect(creatorUpgrade).toBeDefined();
    const creatorSubUpsert = mockState.dbOps.find(
      (o) => o.table === 'subscriptions' && o.op === 'upsert' && (o.payload as any)?.plan_id === 'creator'
    );
    expect(creatorSubUpsert).toBeDefined();

    // Refund reverses referral conversion & downgrades Spark trial back to spark
    mockState.dbOps = [];
    mockState.referralRow = {
      id: 'ref-1',
      referrer_user_id: 'user-1',
      referred_user_id: 'referred-u-1',
      referral_code: 'UNO1234',
      status: 'rewarded',
    };
    mockState.subscriptionRow = {
      id: 'sub-trial-1',
      plan_id: 'creator',
      amount_paise: 0,
      status: 'active',
      metadata: { source: 'referral_reward', referred_user_id: 'referred-u-1' },
      current_period_end: new Date(Date.now() + 86400000).toISOString(),
    };
    mockState.referralCodeRow = {
      conversion_count: 1,
      months_earned: 1,
      rewards_earned: 1000,
      credits_used: 0,
    };
    const { revokeReferralConversionOnRefund } = await import('@/lib/referrals/service');
    const rev = await revokeReferralConversionOnRefund('referred-u-1', 'ord-1');
    expect(rev.revoked).toBe(true);
    expect(
      mockState.dbOps.some(
        (o) => o.table === 'workspaces' && o.op === 'update' && (o.payload as any)?.plan === 'spark'
      )
    ).toBe(true);

    // Admin repository reports real clickCount (never signup * 3) and performs zero upserts during GET
    mockState.dbOps = [];
    mockState.referralCodeRow = {
      id: 'rc-1',
      user_id: 'user-1',
      workspace_id: 'ws-1',
      code: 'UNO1234',
      click_count: 2,
      signup_count: 5,
      conversion_count: 0,
      rewards_earned: 1000,
      months_earned: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { SupabaseAdminRepository } = await import('@/lib/repositories/supabase/SupabaseAdminRepository');
    const adminRepo = new SupabaseAdminRepository();
    const adminList = await adminRepo.listReferralCodes();
    expect(adminList.data[0].clickCount).toBe(2);
    expect(mockState.dbOps.some((o) => o.table === 'referral_codes' && o.op === 'upsert')).toBe(false);
  });

  it('Canonical tier summary helper matches PLANS_FALLBACK across Spark, Creator, Pro, Studio & aliases', async () => {
    const { getLimitsForTier } = await import('@/lib/entitlements');
    expect(getLimitsForTier('free')).toEqual(getLimitsForTier('spark'));
    expect(getLimitsForTier('spark')).toEqual({
      postsPerMonth: 15,
      aiTokensPerMonth: 50_000,
      connectedAccounts: 2,
      scheduledPosts: 15,
      teamMembers: 1,
      apiCallsPerDay: 0,
    });
    expect(getLimitsForTier('creator').connectedAccounts).toBe(4);
    expect(getLimitsForTier('creator').aiTokensPerMonth).toBe(300_000);
    expect(getLimitsForTier('pro').connectedAccounts).toBe(8);
    expect(getLimitsForTier('enterprise')).toEqual(getLimitsForTier('studio'));
    expect(getLimitsForTier('studio').aiTokensPerMonth).toBe(-1);
    expect(getLimitsForTier('studio').apiCallsPerDay).toBe(100_000);
  });
});
