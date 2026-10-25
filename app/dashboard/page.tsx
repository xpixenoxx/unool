import { Suspense } from 'react';
import { getAuthContext } from '@/lib/auth/context';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { getCurrentUsage, getLimitsForTier, Tier } from '@/lib/limits/freeTier';
import DashboardClient from './DashboardClient';

const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
const profileRepository = new SupabaseProfileRepository();
const postRepository = new SupabasePostRepository();

const overviewMemoryCache = new Map<string, { data: any; expiry: number }>();

async function getDashboardData(): Promise<{
  profile: {
    subdomain: string | null;
    name: string | null;
    headline: string | null;
    status: 'published' | 'draft';
    updatedAt: string | null;
    links: Array<{ label: string; url: string; type: string }>;
    proofPoints: Array<{ type: string; value: string }>;
  } | null;
  recentPosts: Array<{
    id: string;
    content: string;
    status: 'draft' | 'scheduled' | 'published' | 'failed' | 'publishing';
    createdAt: string;
    updatedAt: string;
  }>;
  usageStats: {
    postsThisMonth: number;
    postsLimit: number;
    profileViews: number;
    profileViewsThisWeek?: number;
    linkClicks: number;
    linkClicksThisWeek?: number;
  };
  connections: Record<string, { status: 'connected' | 'not_connected' | 'expired' }>;
  planTier: 'free' | 'pro' | 'enterprise';
  userId: string;
  workspaceId: string;
}> {
  const auth = await getAuthContext();
  if (!auth) {
    return {
      profile: null,
      recentPosts: [],
      usageStats: { postsThisMonth: 0, postsLimit: 12, profileViews: 0, profileViewsThisWeek: 0, linkClicks: 0, linkClicksThisWeek: 0 },
      connections: {},
      planTier: 'free',
      userId: '',
      workspaceId: '',
    };
  }

  const { userId, workspaceId } = auth;

  // ── Fast In-Memory Cache (15s TTL) for 0ms Route Switching ──────────────
  const cached = overviewMemoryCache.get(workspaceId);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);

  // ─── All DB fetches in parallel — cuts SSR time by ~70-80% ──────────────
  // Previously these ran one-after-another (sequential waterfall).
  // Now they all fire at the same time and we wait for the slowest one.
  const [
    workspaceResult,
    profile,
    postsResult,
    usage,
    connectionsResult,
    viewsThisWeekResult,
    clicksThisWeekResult,
  ] = await Promise.all([
    // 1. Workspace plan tier
    supabaseAdmin
      .from('workspaces')
      .select('plan')
      .eq('id', workspaceId)
      .single(),

    // 2. Profile
    profileRepository.findByWorkspaceId(workspaceId),

    // 3. Recent posts
    postRepository.findByWorkspaceId(workspaceId, { limit: 10 }),

    // 4. Usage stats (internally also runs its queries in parallel)
    getCurrentUsage(supabaseAdmin, workspaceId, userId),

    // 5. Platform connections (lightweight)
    supabaseAdmin
      .from('platform_connections')
      .select('platform, expires_at, status')
      .eq('workspace_id', workspaceId),

    // 6. Profile views this week (for accurate SSR card matching the "views this week" subtitle)
    supabaseAdmin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'profile_view')
      .gte('created_at', thisWeekStart.toISOString()),

    // 7. Link clicks this week (for accurate SSR card matching the "Link clicks this week" subtitle)
    supabaseAdmin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'link_click')
      .gte('created_at', thisWeekStart.toISOString()),
  ]);

  const tier = (workspaceResult.data?.plan as Tier) || 'free';
  const limits = getLimitsForTier(tier);

  const recentPosts = postsResult.slice(0, 10).map((post) => ({
    id: post.id,
    content: post.content,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  const connections: Record<string, { status: 'connected' | 'not_connected' | 'expired' }> = {};
  if (connectionsResult.data) {
    for (const c of connectionsResult.data) {
      const isExpired =
        c.status === 'expired' ||
        c.status === 'error' ||
        (c.expires_at && new Date(c.expires_at) <= new Date());
      connections[c.platform] = { status: isExpired ? 'expired' : 'connected' };
    }
  }

  const result = {
    profile: profile
      ? {
          subdomain: profile.subdomain,
          name: profile.name,
          headline: profile.headline,
          status: (profile.subdomain ? 'published' : 'draft') as 'published' | 'draft',
          updatedAt: profile.updatedAt.toISOString(),
          links: profile.links,
          proofPoints: profile.proofPoints,
        }
      : null,
    recentPosts,
    usageStats: {
      postsThisMonth: usage.postsThisMonth,
      postsLimit: limits.postsPerMonth,
      profileViews: usage.profileViews || 0,
      profileViewsThisWeek: viewsThisWeekResult.count ?? usage.profileViews ?? 0,
      linkClicks: usage.linkClicks || 0,
      linkClicksThisWeek: clicksThisWeekResult.count ?? 0,
    },
    connections,
    planTier: tier,
    userId,
    workspaceId,
  };

  overviewMemoryCache.set(workspaceId, { data: result, expiry: Date.now() + 15_000 });
  return result;
}

import DashboardLoading from './loading';

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();
    return (
      <Suspense fallback={<DashboardLoading />}>
        <DashboardClient data={data} />
      </Suspense>
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return (
      <div className="p-8 text-red-500">
        <h1>Dashboard Error</h1>
        <pre>{err.name}: {err.message}</pre>
        <pre>{err.stack}</pre>
      </div>
    );
  }
}