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
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    createdAt: string;
    updatedAt: string;
  }>;
  usageStats: {
    postsThisMonth: number;
    postsLimit: number;
    profileViews: number;
    linkClicks: number;
  };
  planTier: 'free' | 'pro' | 'enterprise';
  userId: string;
  workspaceId: string;
}> {
  const auth = await getAuthContext();
  if (!auth) {
    return {
      profile: null,
      recentPosts: [],
      usageStats: { postsThisMonth: 0, postsLimit: 12, profileViews: 0, linkClicks: 0 },
      planTier: 'free',
      userId: '',
      workspaceId: '',
    };
  }

  const { userId, workspaceId } = auth;

  // Fetch workspace for plan tier
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single();

  const tier = (workspace?.plan as Tier) || 'free';
  const limits = getLimitsForTier(tier);

  // Fetch profile
  const profile = await profileRepository.findByWorkspaceId(workspaceId);

  // Fetch recent posts
  const posts = await postRepository.findByWorkspaceId(workspaceId, { limit: 10 });
  const recentPosts = posts.slice(0, 10).map((post) => ({
    id: post.id,
    content: post.content,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  // Get usage stats
  const usage = await getCurrentUsage(supabaseAdmin, workspaceId, userId);

  return {
    profile: profile
      ? {
          subdomain: profile.subdomain,
          name: profile.name,
          headline: profile.headline,
          status: profile.subdomain ? 'published' : 'draft',
          updatedAt: profile.updatedAt.toISOString(),
          links: profile.links,
          proofPoints: profile.proofPoints,
        }
      : null,
    recentPosts,
    usageStats: {
      postsThisMonth: usage.postsThisMonth,
      postsLimit: limits.postsPerMonth,
      profileViews: 0,
      linkClicks: 0,
    },
    planTier: tier,
    userId,
    workspaceId,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}