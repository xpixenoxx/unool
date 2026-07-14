import { config } from '@/lib/config/schema';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export type PlanTier = 'free' | 'pro' | 'team';

export interface FreeTierLimits {
  postsPerMonth: number;
  aiTokensPerDay: number;
  connectedAccounts: number;
  teamMembers: number;
  scheduledPosts: number;
  apiCallsPerMonth: number;
}

export const TIER_LIMITS: Record<PlanTier, FreeTierLimits> = {
  free: {
    postsPerMonth: 12,
    aiTokensPerDay: 50_000,
    connectedAccounts: 3,
    teamMembers: 1,
    scheduledPosts: 5,
    apiCallsPerMonth: 1_000,
  },
  pro: {
    postsPerMonth: Infinity,
    aiTokensPerDay: 500_000,
    connectedAccounts: 10,
    teamMembers: 5,
    scheduledPosts: Infinity,
    apiCallsPerMonth: 100_000,
  },
  team: {
    postsPerMonth: Infinity,
    aiTokensPerDay: 2_000_000,
    connectedAccounts: 50,
    teamMembers: 20,
    scheduledPosts: Infinity,
    apiCallsPerMonth: 1_000_000,
  },
};

export interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  tier: PlanTier;
}

export interface UsageContext {
  workspaceId: string;
  userId: string;
  tier: PlanTier;
}

async function getCurrentPeriodStart(period: 'day' | 'month'): Promise<Date> {
  const now = new Date();
  if (period === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function checkPostLimit(context: UsageContext): Promise<UsageCheck> {
  const limits = TIER_LIMITS[context.tier];
  const periodStart = await getCurrentPeriodStart('month');

  const { data, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', context.workspaceId)
    .gte('created_at', periodStart.toISOString())
    .in('status', ['published', 'scheduled']);

  if (error) throw error;

  const current = data?.length || 0;
  const limit = limits.postsPerMonth;

  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
    resetAt: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1),
    tier: context.tier,
  };
}

export async function checkAiTokenLimit(context: UsageContext): Promise<UsageCheck> {
  const limits = TIER_LIMITS[context.tier];
  const periodStart = await getCurrentPeriodStart('day');

  const { data, error } = await supabase
    .from('ai_usage')
    .select('tokens_in, tokens_out')
    .eq('workspace_id', context.workspaceId)
    .gte('created_at', periodStart.toISOString());

  if (error) throw error;

  const current = (data || []).reduce((sum, row) => sum + (row.tokens_in || 0) + (row.tokens_out || 0), 0);
  const limit = limits.aiTokensPerDay;

  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
    resetAt: new Date(periodStart.getTime() + 24 * 60 * 60 * 1000),
    tier: context.tier,
  };
}

export async function checkConnectedAccountsLimit(context: UsageContext): Promise<UsageCheck> {
  const limits = TIER_LIMITS[context.tier];

  const { data, error } = await supabase
    .from('platform_connections')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', context.workspaceId)
    .eq('status', 'connected');

  if (error) throw error;

  const current = data?.length || 0;
  const limit = limits.connectedAccounts;

  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
    resetAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // No automatic reset
    tier: context.tier,
  };
}

export async function checkTeamMembersLimit(context: UsageContext): Promise<UsageCheck> {
  const limits = TIER_LIMITS[context.tier];

  const { data, error } = await supabase
    .from('workspace_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', context.workspaceId);

  if (error) throw error;

  const current = data?.length || 0;
  const limit = limits.teamMembers;

  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
    resetAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    tier: context.tier,
  };
}

export async function checkScheduledPostsLimit(context: UsageContext): Promise<UsageCheck> {
  const limits = TIER_LIMITS[context.tier];
  const periodStart = await getCurrentPeriodStart('month');

  const { data, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', context.workspaceId)
    .eq('status', 'scheduled')
    .gte('created_at', periodStart.toISOString());

  if (error) throw error;

  const current = data?.length || 0;
  const limit = limits.scheduledPosts;

  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
    resetAt: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1),
    tier: context.tier,
  };
}

export async function checkApiCallsLimit(context: UsageContext): Promise<UsageCheck> {
  const limits = TIER_LIMITS[context.tier];
  const periodStart = await getCurrentPeriodStart('month');

  const { data, error } = await supabase
    .from('api_usage')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', context.workspaceId)
    .gte('created_at', periodStart.toISOString());

  if (error) throw error;

  const current = data?.length || 0;
  const limit = limits.apiCallsPerMonth;

  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
    resetAt: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1),
    tier: context.tier,
  };
}

export async function checkAllLimits(context: UsageContext): Promise<Record<string, UsageCheck>> {
  const [posts, aiTokens, connectedAccounts, teamMembers, scheduledPosts, apiCalls] = await Promise.all([
    checkPostLimit(context),
    checkAiTokenLimit(context),
    checkConnectedAccountsLimit(context),
    checkTeamMembersLimit(context),
    checkScheduledPostsLimit(context),
    checkApiCallsLimit(context),
  ]);

  return {
    posts,
    aiTokens,
    connectedAccounts,
    teamMembers,
    scheduledPosts,
    apiCalls,
  };
}

export function getLimitErrorMessage(check: UsageCheck, feature: string): string {
  const tierNames: Record<PlanTier, string> = {
    free: 'Free',
    pro: 'Pro',
    team: 'Team',
  };

  if (check.limit === Infinity) return '';

  const upgradeUrl = '/dashboard/settings?tab=billing';

  return `You've reached your ${tierNames[check.tier]} plan limit for ${feature} (${check.current}/${check.limit}). Limits reset on ${check.resetAt.toLocaleDateString()}. <a href="${upgradeUrl}" class="underline">Upgrade</a> for higher limits.`;
}

export async function recordAiUsage(
  workspaceId: string,
  userId: string,
  tokensIn: number,
  tokensOut: number,
  capability: string,
  model: string
): Promise<void> {
  const { error } = await supabase.from('ai_usage').insert({
    workspace_id: workspaceId,
    user_id: userId,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    capability,
    model,
    cost_usd: (tokensIn + tokensOut) * 0.000003, // Rough estimate
  });

  if (error) {
    logger.error('Failed to record AI usage', { error });
  }
}

export async function recordApiCall(workspaceId: string, endpoint: string): Promise<void> {
  const { error } = await supabase.from('api_usage').insert({
    workspace_id: workspaceId,
    endpoint,
  });

  if (error) {
    logger.error('Failed to record API call', { error });
  }
}