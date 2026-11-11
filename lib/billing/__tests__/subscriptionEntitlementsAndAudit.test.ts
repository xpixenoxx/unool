import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// ── Mock Supabase Admin & Server Auth ───────────────────────────────────────
const mockState = {
  workspace: {
    id: 'ws-test-1',
    plan: 'spark',
    plan_status: 'active',
    plan_expires_at: null as string | null,
    features: null as Record<string, unknown> | null,
    owner_id: 'user-test-1',
  },
  planRow: null as Record<string, unknown> | null,
  counts: {
    posts: 0,
    profiles: 1,
    workspace_members: 1,
    ai_usage: 0,
    media_uploads: 0,
    api_calls: 0,
    platform_connections: 0,
    instagram_comment_logs: 0,
    linkedin_comment_logs: 0,
    brand_materials_pages: 0,
    platform_posts: 0,
  } as Record<string, number>,
  deletedTables: [] as string[],
  authUserDeleted: false,
};

function createChainableQuery(table: string) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    gte: () => chain,
    lt: () => chain,
    or: () => chain,
    order: () => chain,
    limit: () => chain,
    insert: () => chain,
    upsert: () => chain,
    update: (payload: any) => {
      if (table === 'workspaces' && payload?.plan) {
        mockState.workspace.plan = payload.plan;
        if ('plan_status' in payload) mockState.workspace.plan_status = payload.plan_status;
        if ('plan_expires_at' in payload) mockState.workspace.plan_expires_at = payload.plan_expires_at;
      }
      return chain;
    },
    delete: () => {
      mockState.deletedTables.push(table);
      return chain;
    },
    single: async () => {
      if (table === 'workspaces' || table === 'workspace_admin_view') {
        return { data: { ...mockState.workspace }, error: null };
      }
      if (table === 'plans') {
        return { data: mockState.planRow, error: mockState.planRow ? null : { message: 'not found' } };
      }
      if (table === 'instagram_automation_config') {
        return { data: { id: 'cfg-1', workspace_id: mockState.workspace.id }, error: null };
      }
      return { data: null, error: null };
    },
    maybeSingle: async () => {
      if (table === 'workspaces') return { data: { ...mockState.workspace }, error: null };
      return { data: null, error: null };
    },
    then: (resolve: any) => {
      const count = mockState.counts[table] ?? 0;
      const rows = table === 'workspaces' ? [{ id: mockState.workspace.id }] : [];
      return Promise.resolve({ data: rows, count, error: null }).then(resolve);
    },
  };
  return chain;
}

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (table: string) => createChainableQuery(table),
    rpc: async () => ({ data: null, error: null }),
    auth: {
      admin: {
        deleteUser: async () => {
          mockState.authUserDeleted = true;
          return { data: {}, error: null };
        },
        getUserById: async () => ({
          data: { user: { id: 'user-test-1', email: 'creator@unool.co' } },
          error: null,
        }),
      },
    },
  },
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: async () => ({
    userId: 'user-test-1',
    workspaceId: 'ws-test-1',
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'user-test-1', email: 'creator@unool.co' } },
      }),
    },
  }),
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  verifyWorkspaceAccess: async () => true,
}));

vi.mock('@/lib/feature-flags-server', () => ({
  isAutomationEnabledServer: async () => true,
}));

import { PLANS_FALLBACK, getPlan, normalizePlanId } from '@/lib/billing/plans';
import { getPlanContext, enforcePlanLimit } from '@/lib/middleware/plan-enforcement-middleware';
import { enforcePlanLimits } from '@/lib/plan-enforcement';
import { activateWorkspacePlan, cancelSubscription } from '@/lib/billing/subscription';
import { isTemplateAllowedForPlan } from '@/components/profile/templates/registry';
import { whopAdapter } from '@/lib/platforms/WhopAdapter';
import { PLATFORM_CAPABILITIES, getPlatformCapability } from '@/lib/platforms';
import { X_MONTHLY_POST_CAPS, estimateXPostCostUsd } from '@/lib/services/PublishService';
import { sanitizeOutboundLinks } from '@/lib/services/InstagramCommentAutomation';
import { velocityThrottle } from '@/lib/services/automation/velocity';
import { verifyMetaSignedRequest } from '@/lib/webhooks/metaSignedRequest';
import { POST as humanizePOST } from '@/app/api/composer/humanize/route';
import { POST as flightplanPOST } from '@/app/api/flightplan/generate/route';
import { POST as arcGeneratePOST } from '@/app/api/composer/arc/generate/route';
import { POST as schedulePOST } from '@/app/api/composer/schedule/route';
import { PUT as igAutomationPUT } from '@/app/api/instagram/automation/route';
import { PUT as profilePUT } from '@/app/api/profile/route';
import { DELETE as userDeleteRoute } from '@/app/api/user/delete/route';
import { POST as metaDataDeletionPOST, GET as metaDataDeletionGET } from '@/app/api/webhooks/meta/data-deletion/route';
import { POST as metaDeauthorizePOST } from '@/app/api/webhooks/meta/deauthorize/route';

function makeSignedRequest(payload: Record<string, unknown>, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${sig}.${encodedPayload}`;
}

describe('Pricing, Subscription Tier Entitlements & Audit Verification Suite', () => {
  beforeEach(() => {
    mockState.workspace = {
      id: 'ws-test-1',
      plan: 'spark',
      plan_status: 'active',
      plan_expires_at: null,
      features: null,
      owner_id: 'user-test-1',
    };
    mockState.planRow = null;
    mockState.counts = {
      posts: 0,
      profiles: 1,
      workspace_members: 1,
      ai_usage: 0,
      media_uploads: 0,
      api_calls: 0,
      platform_connections: 0,
      instagram_comment_logs: 0,
      linkedin_comment_logs: 0,
      brand_materials_pages: 0,
      platform_posts: 0,
    };
    mockState.deletedTables = [];
    mockState.authUserDeleted = false;
  });

  // ── 1. Canonical Plan Configuration Integrity ────────────────────────────
  describe('1. Canonical Plan Configuration & Pricing Integrity', () => {
    it('preserves exact pricing and limits for Spark (Free), Creator, Pro, and Studio', () => {
      expect(PLANS_FALLBACK.spark.pricing.INR.monthly).toBe(0);
      expect(PLANS_FALLBACK.creator.pricing.INR.monthly).toBe(79900); // ₹799
      expect(PLANS_FALLBACK.pro.pricing.INR.monthly).toBe(199900);    // ₹1,999
      expect(PLANS_FALLBACK.studio.pricing.INR.monthly).toBe(499900); // ₹4,999

      expect(PLANS_FALLBACK.spark.limits).toEqual({
        posts_per_month: 15,
        channels: 2,
        ai_credits_per_month: 25,
        ig_comments_per_month: 250,
        linkedin_comments_per_month: 50,
        team_seats: 1,
        brand_voices: 0,
        analytics_retention_days: 30,
        workspaces: 1,
      });

      expect(PLANS_FALLBACK.creator.limits).toEqual({
        posts_per_month: -1,
        channels: 4,
        ai_credits_per_month: 150,
        ig_comments_per_month: 500,
        linkedin_comments_per_month: 250,
        team_seats: 1,
        brand_voices: 1,
        analytics_retention_days: 90,
        workspaces: 1,
      });

      expect(PLANS_FALLBACK.pro.limits).toEqual({
        posts_per_month: -1,
        channels: 8,
        ai_credits_per_month: 500,
        ig_comments_per_month: 3000,
        linkedin_comments_per_month: 1500,
        team_seats: 3,
        brand_voices: 5,
        analytics_retention_days: 365,
        workspaces: 1,
      });

      expect(PLANS_FALLBACK.studio.limits).toEqual({
        posts_per_month: -1,
        channels: -1,
        ai_credits_per_month: -1,
        ig_comments_per_month: -1,
        linkedin_comments_per_month: -1,
        team_seats: 10,
        brand_voices: -1,
        analytics_retention_days: -1,
        workspaces: 3,
      });
    });

    it('normalizes legacy "free" tier alias to "spark" so unseeded DB never allows unlimited bypass', async () => {
      expect(normalizePlanId('free')).toBe('spark');
      expect(getPlan('free')?.id).toBe('spark');

      mockState.workspace.plan = 'free';
      const ctx = await getPlanContext('user-test-1', 'ws-test-1');
      expect(ctx?.plan).toBe('spark');
      expect(ctx?.limits.posts_per_month).toBe(15);
      expect(ctx?.limits.channels).toBe(2);
      expect(ctx?.limits.ai_credits_per_month).toBe(25);
    });
  });

  // ── 2. FREE (Spark) Tier Enforcement ─────────────────────────────────────
  describe('2. FREE (Spark) User Entitlements & Restrictions', () => {
    it('allows all promised Free benefits within configured limits', async () => {
      mockState.workspace.plan = 'spark';
      const req = new NextRequest('http://localhost:3000/api/test');
      const ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;

      // Promised Free benefits
      expect((await enforcePlanLimit(req, 'create_post', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'connect_channel', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'use_ai', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'ig_comment_reply', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'follow_to_unlock', ctx)).allowed).toBe(true);
      expect(isTemplateAllowedForPlan('lone', ctx.templateCount)).toBe(true);
      expect(isTemplateAllowedForPlan('lover', ctx.templateCount)).toBe(true);
    });

    it('blocks Free users from Creator/Pro/Studio-exclusive features', async () => {
      mockState.workspace.plan = 'spark';
      const req = new NextRequest('http://localhost:3000/api/test');
      const ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;

      expect((await enforcePlanLimit(req, 'dm_concierge', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'dm_concierge_full', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'auto_hide_spam', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'flightplan_ai', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'content_humanizer', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'first_comment', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'lead_scoring', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'custom_domain', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'csv_export', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'white_label', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'api_access', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'brand_voice', ctx)).allowed).toBe(false);
      expect(isTemplateAllowedForPlan('the-studio', ctx.templateCount)).toBe(false);
    });

    it('blocks Free users when exceeding Free numeric quotas (15 posts, 2 channels, 25 AI credits, 250 IG comments)', async () => {
      mockState.workspace.plan = 'spark';
      const req = new NextRequest('http://localhost:3000/api/test');
      const ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;

      mockState.counts.posts = 15;
      expect((await enforcePlanLimit(req, 'create_post', ctx)).allowed).toBe(false);

      mockState.counts.platform_connections = 2;
      expect((await enforcePlanLimit(req, 'connect_channel', ctx)).allowed).toBe(false);

      mockState.counts.ai_usage = 25;
      expect((await enforcePlanLimit(req, 'use_ai', ctx)).allowed).toBe(false);

      mockState.counts.instagram_comment_logs = 250;
      expect((await enforcePlanLimit(req, 'ig_comment_reply', ctx)).allowed).toBe(false);
    });
  });

  // ── 3. CREATOR Tier Enforcement ──────────────────────────────────────────
  describe('3. CREATOR User Entitlements & Restrictions', () => {
    it('grants all Creator benefits (unlimited posts, 4 channels, 150 AI credits, DM concierge, badge removal, 16 templates)', async () => {
      mockState.workspace.plan = 'creator';
      const req = new NextRequest('http://localhost:3000/api/test');
      const ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;

      // Even with 500 posts this month, Creator has unlimited posts (-1)
      mockState.counts.posts = 500;
      expect((await enforcePlanLimit(req, 'create_post', ctx)).allowed).toBe(true);

      // 3 channels connected -> 4th is allowed on Creator
      mockState.counts.platform_connections = 3;
      expect((await enforcePlanLimit(req, 'connect_channel', ctx)).allowed).toBe(true);

      // 100 AI credits used -> allowed up to 150 on Creator
      mockState.counts.ai_usage = 100;
      expect((await enforcePlanLimit(req, 'use_ai', ctx)).allowed).toBe(true);

      // Creator features enabled
      expect((await enforcePlanLimit(req, 'dm_concierge', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'auto_hide_spam', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'badge_removal', ctx)).allowed).toBe(true);
      expect(isTemplateAllowedForPlan('the-studio', ctx.templateCount)).toBe(true);
    });

    it('blocks Creator users from Pro-exclusive features and enforces Creator limits', async () => {
      mockState.workspace.plan = 'creator';
      const req = new NextRequest('http://localhost:3000/api/test');
      const ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;

      // Pro-only features must be denied on Creator
      expect((await enforcePlanLimit(req, 'flightplan_ai', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'content_humanizer', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'first_comment', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'dm_concierge_full', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'lead_scoring', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'custom_domain', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'csv_export', ctx)).allowed).toBe(false);

      // Creator numeric limits enforced
      mockState.counts.platform_connections = 4;
      expect((await enforcePlanLimit(req, 'connect_channel', ctx)).allowed).toBe(false);

      mockState.counts.ai_usage = 150;
      expect((await enforcePlanLimit(req, 'use_ai', ctx)).allowed).toBe(false);

      mockState.counts.instagram_comment_logs = 500;
      expect((await enforcePlanLimit(req, 'ig_comment_reply', ctx)).allowed).toBe(false);

      mockState.counts.workspace_members = 1;
      expect((await enforcePlanLimit(req, 'invite_member', ctx)).allowed).toBe(false);
    });
  });

  // ── 4. PRO & STUDIO Tier Enforcement ─────────────────────────────────────
  describe('4. PRO & STUDIO User Entitlements & Restrictions', () => {
    it('grants Pro users all Pro-exclusive benefits and enforces Pro limits (8 channels, 500 AI credits, 3 seats)', async () => {
      mockState.workspace.plan = 'pro';
      const req = new NextRequest('http://localhost:3000/api/test');
      const ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;

      expect((await enforcePlanLimit(req, 'flightplan_ai', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'content_humanizer', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'first_comment', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'dm_concierge_full', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'lead_scoring', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'custom_domain', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'csv_export', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'priority_support', ctx)).allowed).toBe(true);

      // Studio-only features remain blocked for Pro
      expect((await enforcePlanLimit(req, 'white_label', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'api_access', ctx)).allowed).toBe(false);
      expect((await enforcePlanLimit(req, 'approval_workflows', ctx)).allowed).toBe(false);

      // Pro numeric limits enforced at threshold
      mockState.counts.platform_connections = 8;
      expect((await enforcePlanLimit(req, 'connect_channel', ctx)).allowed).toBe(false);

      mockState.counts.ai_usage = 500;
      expect((await enforcePlanLimit(req, 'use_ai', ctx)).allowed).toBe(false);

      mockState.counts.workspace_members = 3;
      expect((await enforcePlanLimit(req, 'invite_member', ctx)).allowed).toBe(false);
    });

    it('grants Studio users white-label, API access, approval workflows, and 3 workspaces', async () => {
      mockState.workspace.plan = 'studio';
      const req = new NextRequest('http://localhost:3000/api/test');
      const ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;

      expect((await enforcePlanLimit(req, 'white_label', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'api_access', ctx)).allowed).toBe(true);
      expect((await enforcePlanLimit(req, 'approval_workflows', ctx)).allowed).toBe(true);

      mockState.counts.profiles = 2;
      expect((await enforcePlanLimit(req, 'create_profile', ctx)).allowed).toBe(true);
      mockState.counts.profiles = 3;
      expect((await enforcePlanLimit(req, 'create_profile', ctx)).allowed).toBe(false);
    });
  });

  // ── 5. Subscription Lifecycle Transitions & Direct API Enforcement ───────
  describe('5. Upgrades, Downgrades, Cancellations, Expirations & Direct API Route Enforcement', () => {
    it('updates permissions immediately across upgrades, immediate cancellations, and expirations', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');

      // Start on Spark
      let ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;
      expect((await enforcePlanLimit(req, 'flightplan_ai', ctx)).allowed).toBe(false);

      // Upgrade to Pro
      await activateWorkspacePlan('ws-test-1', 'pro', 'monthly');
      ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;
      expect(ctx.plan).toBe('pro');
      expect((await enforcePlanLimit(req, 'flightplan_ai', ctx)).allowed).toBe(true);

      // Cancel immediately -> downgrades to Spark
      await cancelSubscription('ws-test-1', true);
      ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;
      expect(ctx.plan).toBe('spark');
      expect((await enforcePlanLimit(req, 'flightplan_ai', ctx)).allowed).toBe(false);

      // Expired Pro subscription -> automatically enforces Spark limits
      mockState.workspace.plan = 'pro';
      mockState.workspace.plan_status = 'active';
      mockState.workspace.plan_expires_at = new Date(Date.now() - 86400_000).toISOString();
      ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;
      expect(ctx.plan).toBe('spark');
      expect(ctx.isExpired).toBe(true);
      expect((await enforcePlanLimit(req, 'flightplan_ai', ctx)).allowed).toBe(false);

      // Failed payment / past_due status -> enforces Spark limits in middleware and blocks in enforcePlanLimits
      mockState.workspace.plan = 'creator';
      mockState.workspace.plan_status = 'past_due';
      mockState.workspace.plan_expires_at = null;
      ctx = (await getPlanContext('user-test-1', 'ws-test-1'))!;
      expect(ctx.plan).toBe('spark');
      const directCheck = await enforcePlanLimits('ws-test-1', 'create_post');
      expect(directCheck.allowed).toBe(false);
    });

    it('blocks direct API requests that attempt to bypass subscription tier gates', async () => {
      mockState.workspace.plan = 'spark';

      // 1. POST /api/composer/humanize (Pro+ only for AI rewrite)
      const humanizeReq = new NextRequest('http://localhost:3000/api/composer/humanize', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-id': 'user-test-1', 'x-workspace-id': 'ws-test-1' },
        body: JSON.stringify({ content: 'Delve into this seamless tapestry of innovation.', diagnoseOnly: false }),
      });
      const humanizeRes = await humanizePOST(humanizeReq);
      expect(humanizeRes.status).toBe(403);

      // 2. POST /api/flightplan/generate (Pro+ only)
      const fpReq = new NextRequest('http://localhost:3000/api/flightplan/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-id': 'user-test-1', 'x-workspace-id': 'ws-test-1' },
        body: JSON.stringify({ content: 'Launch week story', numberOfDays: 5 }),
      });
      const fpRes = await flightplanPOST(fpReq);
      expect(fpRes.status).toBe(403);

      // 3. POST /api/composer/arc/generate (Pro+ only)
      const arcReq = new NextRequest('http://localhost:3000/api/composer/arc/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-id': 'user-test-1', 'x-workspace-id': 'ws-test-1' },
        body: JSON.stringify({ coreStory: 'We shipped v2 today' }),
      });
      const arcRes = await arcGeneratePOST(arcReq);
      expect(arcRes.status).toBe(403);

      // 4. POST /api/composer/schedule batch overflow (14 used + 3 in batch > 15 Spark limit)
      mockState.counts.posts = 14;
      const schedReq = new NextRequest('http://localhost:3000/api/composer/schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-id': 'user-test-1', 'x-workspace-id': 'ws-test-1' },
        body: JSON.stringify({
          posts: [
            { day: 0, platforms: [{ platform: 'linkedin', content: 'Post 1' }] },
            { day: 1, platforms: [{ platform: 'linkedin', content: 'Post 2' }] },
          ],
        }),
      });
      const schedRes = await schedulePOST(schedReq);
      expect(schedRes.status).toBe(403);

      // 5. PUT /api/instagram/automation enabling DM Concierge on Spark -> 403
      const igReq = new NextRequest('http://localhost:3000/api/instagram/automation', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workspaceId: 'ws-test-1', dmAutoReplyEnabled: true }),
      });
      const igRes = await igAutomationPUT(igReq);
      expect(igRes.status).toBe(403);

      // 6. PUT /api/instagram/automation enabling Follow-to-Unlock on Spark -> 200 (Free benefit!)
      const igFollowReq = new NextRequest('http://localhost:3000/api/instagram/automation', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workspaceId: 'ws-test-1', requireFollowForDm: true }),
      });
      const igFollowRes = await igAutomationPUT(igFollowReq);
      expect(igFollowRes.status).toBe(200);

      // 7. PUT /api/profile selecting a paid template on Spark -> 403
      const profReq = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Creator', theme: { template: 'the-studio' } }),
      });
      const profRes = await profilePUT(profReq);
      expect(profRes.status).toBe(403);
    });
  });

  // ── 6. Audit Technical Fixes Verification ────────────────────────────────
  describe('6. Product Audit Technical Fixes (C-1 through C-9 & P1-4)', () => {
    it('C-1 / P0-1: calculates next-hour velocity bucket delay with jitter for rate-limited IG jobs', () => {
      const delaySec = velocityThrottle.getSecondsUntilNextHourBucket(30, 120);
      expect(delaySec).toBeGreaterThanOrEqual(90);
      expect(delaySec).toBeLessThanOrEqual(3720);
    });

    it('C-2 / P0-2 & C-9 / P2-4: WhopAdapter.publish throws explicit error instead of returning fake success', async () => {
      await expect(
        whopAdapter.publish('token', { content: 'Test Whop post' })
      ).rejects.toThrow(/Whop API does not support programmatic post creation/i);

      expect(getPlatformCapability('whop')?.publishMode).toBe('unsupported');
      expect(getPlatformCapability('whop')?.supportsDirectPublish).toBe(false);
      expect(getPlatformCapability('instagram')?.publishMode).toBe('native');
      expect(Object.keys(PLATFORM_CAPABILITIES).length).toBe(27);
    });

    it('C-3 / P0-3: enforces X API per-plan monthly caps and estimates link vs text post costs', () => {
      expect(X_MONTHLY_POST_CAPS).toEqual({
        spark: 10,
        creator: 30,
        pro: 100,
        studio: 300,
      });
      expect(estimateXPostCostUsd('Just shipping code today')).toEqual({ costUsd: 0.015, hasLink: false });
      expect(estimateXPostCostUsd('Check out https://unool.co/launch')).toEqual({ costUsd: 0.20, hasLink: true });
    });

    it('C-5 / P0-4: verifies Meta HMAC-SHA256 signed_request and processes data-deletion & deauthorize callbacks', async () => {
      const secret = 'test_meta_app_secret_123';
      process.env.META_APP_SECRET = secret;

      const validSignedReq = makeSignedRequest(
        { user_id: '17841400000000001', algorithm: 'HMAC-SHA256', issued_at: 1700000000 },
        secret
      );
      const forgedSignedReq = makeSignedRequest(
        { user_id: '17841400000000001', algorithm: 'HMAC-SHA256' },
        'wrong_secret'
      );

      expect(verifyMetaSignedRequest(validSignedReq, [secret])?.user_id).toBe('17841400000000001');
      expect(verifyMetaSignedRequest(forgedSignedReq, [secret])).toBeNull();

      // POST /api/webhooks/meta/data-deletion with valid signed_request
      const delReq = new NextRequest('http://localhost:3000/api/webhooks/meta/data-deletion', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ signed_request: validSignedReq }).toString(),
      });
      const delRes = await metaDataDeletionPOST(delReq);
      expect(delRes.status).toBe(200);
      const delJson = await delRes.json();
      expect(delJson.confirmation_code).toMatch(/^del_17841400000000001_/);
      expect(delJson.url).toContain(delJson.confirmation_code);

      // GET status endpoint
      const statusReq = new NextRequest(delJson.url);
      const statusRes = await metaDataDeletionGET(statusReq);
      expect(statusRes.status).toBe(200);

      // POST /api/webhooks/meta/deauthorize with forged signed_request -> 403
      const badDeauthReq = new NextRequest('http://localhost:3000/api/webhooks/meta/deauthorize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signed_request: forgedSignedReq }),
      });
      const badDeauthRes = await metaDeauthorizePOST(badDeauthReq);
      expect(badDeauthRes.status).toBe(403);
    });

    it('C-6 / P0-5: DELETE /api/user/delete purges all workspace & user tables and deletes the auth user', async () => {
      const req = new NextRequest('http://localhost:3000/api/user/delete', { method: 'DELETE' });
      const res = await userDeleteRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.deleted).toBe(true);
      expect(mockState.authUserDeleted).toBe(true);
      expect(mockState.deletedTables).toContain('instagram_comment_logs');
      expect(mockState.deletedTables).toContain('instagram_dm_logs');
      expect(mockState.deletedTables).toContain('brand_materials_pages');
      expect(mockState.deletedTables).toContain('profiles');
      expect(mockState.deletedTables).toContain('subscriptions');
      expect(mockState.deletedTables).toContain('workspaces');
    });

    it('P1-4: sanitizeOutboundLinks strips prompt-injected phishing URLs while preserving allowlisted creator URLs', () => {
      const creatorLink = 'https://creator.gumroad.com/l/playbook';
      const injectedReply = 'Here is the link you requested: https://evil-phishing.xyz/steal-creds and also https://creator.gumroad.com/l/playbook!';
      const sanitized = sanitizeOutboundLinks(injectedReply, [creatorLink], creatorLink);

      expect(sanitized).not.toContain('evil-phishing.xyz');
      expect(sanitized).toContain(creatorLink);

      // Also preserves *.unool.co links automatically
      const unoolReply = 'Unlock it at https://arjun.unool.co/guide right now!';
      expect(sanitizeOutboundLinks(unoolReply, [])).toBe(unoolReply);
    });
  });
});

