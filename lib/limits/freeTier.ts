import { SupabaseClient } from '@supabase/supabase-js';

export interface FreeTierLimits {
  postsPerMonth: number;
  aiTokensPerMonth: number;
  connectedAccounts: number;
  scheduledPosts: number;
  teamMembers: number;
  apiCallsPerDay: number;
}

export const FREE_TIER_LIMITS: FreeTierLimits = {
  postsPerMonth: 12,
  aiTokensPerMonth: 50_000,
  connectedAccounts: 3,
  scheduledPosts: 5,
  teamMembers: 1,
  apiCallsPerDay: 100,
};

export const PRO_TIER_LIMITS: FreeTierLimits = {
  postsPerMonth: 300,
  aiTokensPerMonth: 500_000,
  connectedAccounts: 10,
  scheduledPosts: 100,
  teamMembers: 5,
  apiCallsPerDay: 5_000,
};

export const ENTERPRISE_TIER_LIMITS: FreeTierLimits = {
  postsPerMonth: 10_000,
  aiTokensPerMonth: 5_000_000,
  connectedAccounts: 50,
  scheduledPosts: 1_000,
  teamMembers: 50,
  apiCallsPerDay: 100_000,
};

export type Tier = 'free' | 'pro' | 'enterprise';

export function getLimitsForTier(tier: Tier): FreeTierLimits {
  switch (tier) {
    case 'pro': return PRO_TIER_LIMITS;
    case 'enterprise': return ENTERPRISE_TIER_LIMITS;
    default: return FREE_TIER_LIMITS;
  }
}

export interface UsageSnapshot {
  postsThisMonth: number;
  aiTokensThisMonth: number;
  connectedAccounts: number;
  scheduledPosts: number;
  teamMembers: number;
  apiCallsToday: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetAt: Date;
  message?: string;
}

export function checkLimit(
  type: keyof FreeTierLimits,
  usage: UsageSnapshot,
  limits: FreeTierLimits
): LimitCheckResult {
  const limit = limits[type];
  const usageKey = mapLimitTypeToUsageKey(type);
  const used = usage[usageKey] ?? 0;
  const remaining = Math.max(0, limit - used);
  const allowed = used < limit;

  let resetAt: Date;
  const now = new Date();
  if (type.includes('Month')) {
    // Use UTC to avoid DST issues
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    resetAt = nextMonth;
  } else if (type.includes('Day')) {
    // Use UTC midnight
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
    resetAt = tomorrow;
  } else {
    // For static limits like connectedAccounts - 30 days from now in UTC
    resetAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  }

  return {
    allowed,
    limit,
    used,
    remaining,
    resetAt,
    message: allowed ? undefined : `You've reached your ${type} limit (${limit}). Upgrade to continue.`,
  };
}

function mapLimitTypeToUsageKey(type: keyof FreeTierLimits): keyof UsageSnapshot {
  const mapping: Record<keyof FreeTierLimits, keyof UsageSnapshot> = {
    postsPerMonth: 'postsThisMonth',
    aiTokensPerMonth: 'aiTokensThisMonth',
    connectedAccounts: 'connectedAccounts',
    scheduledPosts: 'scheduledPosts',
    teamMembers: 'teamMembers',
    apiCallsPerDay: 'apiCallsToday',
  };
  return mapping[type] ?? 'postsThisMonth';
}

// Async function to fetch current usage
export async function getCurrentUsage(
  supabase: SupabaseClient,
  workspaceId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string
): Promise<UsageSnapshot> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    { count: postsThisMonth },
    { data: aiUsage },
    { count: connectedAccounts },
    { count: scheduledPosts },
    { count: teamMembers },
    { count: apiCallsToday },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', monthStart.toISOString()),

    supabase
      .from('ai_usage')
      .select('tokens_in, tokens_out')
      .eq('workspace_id', workspaceId)
      .gte('created_at', monthStart.toISOString()),

    supabase
      .from('platform_connections')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'connected'),

    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', monthStart.toISOString()),

    supabase
      .from('workspace_members')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),

    supabase
      .from('api_calls')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', dayStart.toISOString()),
  ]);

  const aiTokensThisMonth = aiUsage?.reduce((sum: number, u: { tokens_in?: number; tokens_out?: number }) => sum + (u.tokens_in || 0) + (u.tokens_out || 0), 0) || 0;

  return {
    postsThisMonth: postsThisMonth || 0,
    aiTokensThisMonth,
    connectedAccounts: connectedAccounts || 0,
    scheduledPosts: scheduledPosts || 0,
    teamMembers: teamMembers || 0,
    apiCallsToday: apiCallsToday || 0,
  };
}