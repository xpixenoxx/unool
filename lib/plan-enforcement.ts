import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { Plan } from '@/lib/repositories/interfaces/IAdminRepository';
import { getPlan, normalizePlanId, PLANS_FALLBACK, type PlanId } from '@/lib/billing/plans';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';



// ============================================================
// TYPES
// ============================================================

export interface PlanLimits {
  posts_per_month?: number;
  channels?: number;
  profiles?: number;
  workspaces?: number;
  api_access?: boolean;
  team_seats?: number;
  ai_adaptations_per_month?: number;
  ai_credits_per_month?: number;
  ig_comments_per_month?: number;
  linkedin_comments_per_month?: number;
  brand_voices?: number;
  media_uploads_per_month?: number;
  analytics_retention_days?: number;
  custom_domain?: boolean;
  template_count?: number;
}

export interface PlanFeatures {
  posts_per_month?: number;
  channels?: number;
  profiles?: number;
  workspaces?: number;
  api_access?: boolean;
  analytics_retention_days?: number;
  custom_domain?: boolean;
  badge_removal?: boolean;
  dm_concierge?: boolean;
  dm_concierge_full?: boolean;
  lead_scoring?: boolean;
  follow_to_unlock?: boolean;
  flightplan_ai?: boolean;
  first_comment?: boolean;
  content_humanizer?: boolean;
  auto_hide_spam?: boolean;
  csv_export?: boolean;
  white_label?: boolean;
  approval_workflows?: boolean;
  priority_support?: boolean;
  team_seats?: number;
  ai_adaptations_per_month?: number;
  ai_credits_per_month?: number;
  ig_comments_per_month?: number;
  linkedin_comments_per_month?: number;
  brand_voices?: number;
  media_uploads_per_month?: number;
  template_count?: number;
}

export interface WorkspacePlanInfo {
  planId: string;
  planName: string;
  planStatus: 'active' | 'past_due' | 'canceled' | 'cancelled' | 'expired' | 'trialing' | 'paused';
  planExpiresAt: string | null;
  limits: PlanLimits;
  features: PlanFeatures;
}

export interface UsageSnapshot {
  postsThisMonth: number | null;
  profiles: number | null;
  teamMembers: number | null;
  aiAdaptationsThisMonth: number | null;
  mediaUploadsThisMonth: number | null;
  apiCallsToday: number | null;
  connectedChannels?: number | null;
  igCommentsThisMonth?: number | null;
  linkedinCommentsThisMonth?: number | null;
  brandVoices?: number | null;
}

export interface LimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  resetAt?: string;
  message?: string;
}

export interface PlanEnforcementResult {
  allowed: boolean;
  checks: Record<string, LimitCheckResult>;
  workspacePlan: WorkspacePlanInfo;
}

export type PlanAction =
  | 'create_post'
  | 'create_profile'
  | 'invite_member'
  | 'use_ai'
  | 'upload_media'
  | 'api_access'
  | 'custom_domain'
  | 'analytics'
  | 'scheduling'
  | 'team_collaboration'
  | 'white_label'
  | 'priority_support'
  | 'api_keys'
  | 'webhooks'
  | 'export_data'
  | 'connect_channel'
  | 'ig_comment_reply'
  | 'linkedin_comment_reply'
  | 'brand_voice'
  | 'flightplan_ai'
  | 'content_humanizer'
  | 'first_comment'
  | 'dm_concierge'
  | 'dm_concierge_full'
  | 'lead_scoring'
  | 'auto_hide_spam'
  | 'csv_export'
  | 'approval_workflows'
  | 'follow_to_unlock'
  | 'badge_removal';

// ============================================================
// PLAN CACHE (in-memory, short TTL)
// ============================================================

interface CachedPlan {
  plan: Plan;
  expiresAt: number;
}

// Redis-backed plan cache — works across all serverless instances (unlike in-memory Map)
const PLAN_CACHE_TTL = 60; // seconds
let _redisPlanCache: import('@upstash/redis').Redis | null = null;

function getRedisForCache(): import('@upstash/redis').Redis | null {
  if (_redisPlanCache) return _redisPlanCache;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  // Lazy import to avoid module-level side effects
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');
    _redisPlanCache = new Redis({ url, token });
  } catch {
    return null;
  }
  return _redisPlanCache;
}

async function getCachedPlanFromRedis(planId: string): Promise<CachedPlan | null> {
  const redis = getRedisForCache();
  if (!redis) return null;
  try {
    return await redis.get<CachedPlan>(`plan:${planId}`);
  } catch { return null; }
}

async function setCachedPlanInRedis(planId: string, plan: Plan): Promise<void> {
  const redis = getRedisForCache();
  if (!redis) return;
  try {
    const cached: CachedPlan = { plan, expiresAt: Date.now() + PLAN_CACHE_TTL * 1000 };
    await redis.set(`plan:${planId}`, cached, { ex: PLAN_CACHE_TTL });
  } catch { /* non-fatal */ }
}

async function getPlanFromCache(planId: string): Promise<Plan | null> {
  const normalizedId = normalizePlanId(planId);
  const planDef = getPlan(normalizedId) || PLANS_FALLBACK.spark;

  // Check Redis cache first
  const cached = await getCachedPlanFromRedis(normalizedId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.plan;
  }

  // Cache miss — fetch from DB
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', normalizedId)
    .single();

  if (error || !data) {
    const fallbackPlan: Plan = {
      id: planDef.id,
      name: planDef.name,
      description: planDef.tagline,
      priceMonthlyUsd: (planDef.pricing?.USD?.monthly || 0) / 100,
      priceYearlyUsd: (planDef.pricing?.USD?.annual || 0) / 100,
      features: { ...planDef.features, template_count: planDef.templateCount } as unknown as Record<string, unknown>,
      limits: {
        ...planDef.limits,
        profiles: planDef.limits.workspaces,
        ai_adaptations_per_month: planDef.limits.ai_credits_per_month,
        template_count: planDef.templateCount,
      } as unknown as Record<string, unknown>,
      isActive: true,
      sortOrder: planDef.sortOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setCachedPlanInRedis(normalizedId, fallbackPlan);
    return fallbackPlan;
  }

  const mergedLimits = {
    ...planDef.limits,
    profiles: planDef.limits.workspaces,
    ai_adaptations_per_month: planDef.limits.ai_credits_per_month,
    template_count: planDef.templateCount,
    ...(data.limits || {}),
  };

  const mergedFeatures = {
    ...planDef.features,
    template_count: planDef.templateCount,
    ...(data.features || {}),
  };

  const plan: Plan = {
    id: data.id,
    name: data.name || planDef.name,
    description: data.description || planDef.tagline,
    priceMonthlyUsd: data.price_monthly_usd ?? (planDef.pricing?.USD?.monthly || 0) / 100,
    priceYearlyUsd: data.price_yearly_usd ?? (planDef.pricing?.USD?.annual || 0) / 100,
    features: mergedFeatures,
    limits: mergedLimits,
    isActive: data.is_active ?? true,
    sortOrder: data.sort_order ?? planDef.sortOrder,
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
  };

  await setCachedPlanInRedis(normalizedId, plan);
  return plan;
}

export function clearPlanCache(planOrWorkspaceId: string): void {
  const redis = getRedisForCache();
  if (redis) {
    redis.del(`plan:${planOrWorkspaceId}`).catch(() => {});
    for (const pid of ['spark', 'free', 'creator', 'pro', 'studio']) {
      redis.del(`plan:${pid}`).catch(() => {});
    }
  }
}

// ============================================================
// WORKSPACE PLAN INFO
// ============================================================

export async function getWorkspacePlanInfo(workspaceId: string): Promise<WorkspacePlanInfo | null> {
  // Use the admin view which has all the computed fields
  const { data, error } = await supabaseAdmin
    .from('workspace_admin_view')
    .select('plan, plan_status, plan_expires_at, plan_limits, plan_features')
    .eq('id', workspaceId)
    .single();

  if (error || !data) {
    // Fallback: get basic workspace info and look up plan
    const { data: ws } = await supabaseAdmin
      .from('workspaces')
      .select('plan, plan_status, plan_expires_at')
      .eq('id', workspaceId)
      .single();

    if (!ws) return null;

    let normalizedPlan = normalizePlanId(ws.plan);
    let planStatus = ws.plan_status || 'active';
    let planExpiresAt = ws.plan_expires_at;

    // Cross-check subscriptions table if workspace row shows spark or expired
    const isExpired = Boolean(planExpiresAt && new Date(planExpiresAt) < new Date());
    if (normalizedPlan === 'spark' || planStatus !== 'active' || isExpired) {
      try {
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('plan_id, status, current_period_end')
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        if (sub && sub.status === 'active') {
          const isSubExpired = Boolean(sub.current_period_end && new Date(sub.current_period_end) < new Date());
          if (!isSubExpired && sub.plan_id) {
            normalizedPlan = normalizePlanId(sub.plan_id);
            planStatus = 'active';
            planExpiresAt = sub.current_period_end;
          }
        }
      } catch {
        // fallback to workspace values
      }
    }

    const plan = await getPlanFromCache(normalizedPlan);
    if (!plan) return null;

    return {
      planId: plan.id,
      planName: plan.name,
      planStatus: planStatus,
      planExpiresAt: planExpiresAt,
      limits: plan.limits as PlanLimits,
      features: plan.features as PlanFeatures,
    };
  }

  const normalizedPlan = normalizePlanId(data.plan);
  // The view should have plan_limits and plan_features computed, merged over canonical defaults
  const plan = await getPlanFromCache(normalizedPlan);
  if (!plan) return null;

  return {
    planId: normalizedPlan,
    planName: plan.name,
    planStatus: data.plan_status || 'active',
    planExpiresAt: data.plan_expires_at,
    limits: { ...(plan.limits as PlanLimits), ...(data.plan_limits || {}) } as PlanLimits,
    features: { ...(plan.features as PlanFeatures), ...(data.plan_features || {}) } as PlanFeatures,
  };
}

// ============================================================
// USAGE TRACKING
// ============================================================

export async function getUsageSnapshot(workspaceId: string): Promise<UsageSnapshot> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Track which queries succeed/fail for graceful degradation
  const results = await Promise.allSettled([
    supabaseAdmin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in('status', ['published', 'scheduled'])
      .gte('created_at', monthStart.toISOString()),

    supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),

    supabaseAdmin
      .from('workspace_members')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),

    supabaseAdmin
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', monthStart.toISOString()),

    supabaseAdmin
      .from('media_uploads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', monthStart.toISOString()),

    supabaseAdmin
      .from('api_calls')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', dayStart.toISOString()),

    supabaseAdmin
      .from('platform_connections')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'connected'),

    supabaseAdmin
      .from('instagram_comment_logs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('auto_replied', true)
      .gte('created_at', monthStart.toISOString()),

    supabaseAdmin
      .from('brand_materials_pages')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
  ]);

  // Extract counts — null means query failed (unknown usage), not zero
  const safeCount = (result: PromiseSettledResult<{ count: number | null; error: { message: string } | null }>): number | null => {
    if (result.status === 'rejected') {
      logger.warn('Usage query threw unexpectedly', { error: String(result.reason) });
      return null;
    }
    if (result.value.error) {
      logger.warn('Usage query failed', { error: result.value.error.message });
      return null;
    }
    return result.value.count ?? 0;
  };

  return {
    postsThisMonth: safeCount(results[0]),
    profiles: safeCount(results[1]),
    teamMembers: safeCount(results[2]),
    aiAdaptationsThisMonth: safeCount(results[3]),
    mediaUploadsThisMonth: safeCount(results[4]),
    apiCallsToday: safeCount(results[5]),
    connectedChannels: safeCount(results[6]),
    igCommentsThisMonth: safeCount(results[7]),
    linkedinCommentsThisMonth: 0,
    brandVoices: safeCount(results[8]),
  };
}

// ============================================================
// LIMIT CHECKING
// ============================================================

function checkLimit(
  featureName: string,
  current: number,
  limit: number | undefined,
  resetAt?: string
): LimitCheckResult {
  // -1 means unlimited
  if (limit === -1 || limit === undefined) {
    return {
      allowed: true,
      limit: -1,
      current,
      remaining: -1,
      resetAt,
    };
  }

  const remaining = Math.max(0, limit - current);
  return {
    allowed: current < limit,
    limit,
    current,
    remaining,
    resetAt,
    message: current >= limit
      ? `Limit reached: ${featureName} (${current}/${limit})`
      : undefined,
  };
}

export async function enforcePlanLimits(
  workspaceId: string,
  action: PlanAction
): Promise<PlanEnforcementResult> {
  const planInfo = await getWorkspacePlanInfo(workspaceId);

  if (!planInfo) {
    // No plan info found - default to free tier limits
    return {
      allowed: false,
      checks: {},
      workspacePlan: {
        planId: 'spark',
        planName: 'Spark',
        planStatus: 'active',
        planExpiresAt: null,
        limits: PLANS_FALLBACK.spark.limits,
        features: PLANS_FALLBACK.spark.features,
      },
    };
  }

  // Check if plan is active
  if (planInfo.planStatus !== 'active' && planInfo.planStatus !== 'trialing') {
    return {
      allowed: false,
      checks: {
        plan_status: {
          allowed: false,
          limit: 0,
          current: 0,
          remaining: 0,
          message: `Plan is ${planInfo.planStatus}. Please upgrade or contact support.`,
        },
      },
      workspacePlan: planInfo,
    };
  }

  // Check plan expiration
  if (planInfo.planExpiresAt && new Date(planInfo.planExpiresAt) < new Date()) {
    return {
      allowed: false,
      checks: {
        plan_expired: {
          allowed: false,
          limit: 0,
          current: 0,
          remaining: 0,
          message: 'Plan has expired. Please renew your subscription.',
        },
      },
      workspacePlan: planInfo,
    };
  }

  const usage = await getUsageSnapshot(workspaceId);
  const checks: Record<string, LimitCheckResult> = {};
  const nextMonthIso = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

  switch (action) {
    case 'create_post':
    case 'scheduling': {
      const limit = planInfo.limits.posts_per_month;
      if (usage.postsThisMonth === null) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify usage (service error). Please try again.' } }, workspacePlan: planInfo };
      }
      checks.posts_per_month = checkLimit(
        'Posts per month',
        usage.postsThisMonth,
        limit,
        nextMonthIso
      );
      break;
    }
    case 'create_profile': {
      const limit = planInfo.limits.profiles ?? planInfo.limits.workspaces;
      if (usage.profiles === null) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify usage (service error). Please try again.' } }, workspacePlan: planInfo };
      }
      checks.profiles = checkLimit('Profiles', usage.profiles, limit);
      break;
    }
    case 'invite_member':
    case 'team_collaboration': {
      const limit = planInfo.limits.team_seats;
      if (usage.teamMembers === null) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify usage (service error). Please try again.' } }, workspacePlan: planInfo };
      }
      checks.team_seats = checkLimit('Team seats', usage.teamMembers, limit);
      break;
    }
    case 'use_ai': {
      const limit = planInfo.limits.ai_credits_per_month ?? planInfo.limits.ai_adaptations_per_month;
      if (usage.aiAdaptationsThisMonth === null) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify usage (service error). Please try again.' } }, workspacePlan: planInfo };
      }
      checks.ai_adaptations_per_month = checkLimit(
        'AI credits per month',
        usage.aiAdaptationsThisMonth,
        limit,
        nextMonthIso
      );
      break;
    }
    case 'connect_channel': {
      const limit = planInfo.limits.channels;
      if (usage.connectedChannels === null || usage.connectedChannels === undefined) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify connected channels.' } }, workspacePlan: planInfo };
      }
      checks.channels = checkLimit('Connected channels', usage.connectedChannels, limit);
      break;
    }
    case 'ig_comment_reply': {
      const limit = planInfo.limits.ig_comments_per_month;
      const current = usage.igCommentsThisMonth ?? 0;
      checks.ig_comments_per_month = checkLimit('Instagram comments per month', current, limit, nextMonthIso);
      break;
    }
    case 'linkedin_comment_reply': {
      const limit = planInfo.limits.linkedin_comments_per_month;
      const current = usage.linkedinCommentsThisMonth ?? 0;
      checks.linkedin_comments_per_month = checkLimit('LinkedIn comments per month', current, limit, nextMonthIso);
      break;
    }
    case 'brand_voice': {
      const limit = planInfo.limits.brand_voices;
      const current = usage.brandVoices ?? 0;
      checks.brand_voices = checkLimit('Brand voices', current, limit);
      break;
    }
    case 'upload_media': {
      const limit = planInfo.limits.media_uploads_per_month;
      if (usage.mediaUploadsThisMonth === null) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify usage (service error). Please try again.' } }, workspacePlan: planInfo };
      }
      checks.media_uploads_per_month = checkLimit(
        'Media uploads per month',
        usage.mediaUploadsThisMonth,
        limit,
        nextMonthIso
      );
      break;
    }
    case 'api_access':
    case 'api_keys':
    case 'webhooks': {
      const hasAccess = planInfo.features.api_access === true || planInfo.limits.api_access === true;
      checks.api_access = {
        allowed: hasAccess,
        limit: hasAccess ? -1 : 0,
        current: usage.apiCallsToday ?? 0,
        remaining: hasAccess ? -1 : 0,
        message: hasAccess ? undefined : 'API access not included in your plan (Studio required)',
      };
      break;
    }
    case 'custom_domain': {
      const hasAccess = planInfo.features.custom_domain === true || planInfo.limits.custom_domain === true;
      checks.custom_domain = {
        allowed: hasAccess,
        limit: hasAccess ? -1 : 0,
        current: 0,
        remaining: hasAccess ? -1 : 0,
        message: hasAccess ? undefined : 'Custom domain not included in your plan (Pro or Studio required)',
      };
      break;
    }
    case 'flightplan_ai':
    case 'content_humanizer':
    case 'first_comment':
    case 'dm_concierge':
    case 'dm_concierge_full':
    case 'lead_scoring':
    case 'auto_hide_spam':
    case 'csv_export':
    case 'export_data':
    case 'white_label':
    case 'priority_support':
    case 'approval_workflows':
    case 'follow_to_unlock':
    case 'badge_removal': {
      const featureKey = action === 'export_data' ? 'csv_export' : action;
      const hasAccess = planInfo.features[featureKey as keyof PlanFeatures] === true;
      checks[featureKey] = {
        allowed: hasAccess,
        limit: hasAccess ? -1 : 0,
        current: 0,
        remaining: hasAccess ? -1 : 0,
        message: hasAccess ? undefined : `Feature '${featureKey}' is not included in your current plan (${planInfo.planName}).`,
      };
      break;
    }
  }

  const allowed = Object.values(checks).every(c => c.allowed);

  return {
    allowed,
    checks,
    workspacePlan: planInfo,
  };
}

// ============================================================
// MIDDLEWARE HELPERS
// ============================================================

export interface PlanEnforcementOptions {
  action: PlanAction;
  errorMessage?: string;
}

export function withPlanEnforcement(
  handler: (request: Request, context: { workspaceId: string; userId: string }) => Promise<Response>,
  options: PlanEnforcementOptions
) {
  return async (request: Request, context: { workspaceId: string; userId: string }): Promise<Response> => {
    const enforcement = await enforcePlanLimits(context.workspaceId, options.action);

    if (!enforcement.allowed) {
      // Find the failed check for error message
      const failedCheck = Object.entries(enforcement.checks).find(([, v]) => !v.allowed);
      const message = options.errorMessage || failedCheck?.[1]?.message || 'Plan limit exceeded';

      return new Response(
        JSON.stringify({
          error: message,
          code: 'PLAN_LIMIT_EXCEEDED',
          plan: enforcement.workspacePlan,
          checks: enforcement.checks,
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Plan-Limit': 'exceeded',
            'X-Plan-Id': enforcement.workspacePlan.planId,
          },
        }
      );
    }

    // Add plan info to response headers for debugging
    const response = await handler(request, context);

    // Add rate limit headers
    const firstCheck = Object.values(enforcement.checks)[0];
    if (firstCheck) {
      response.headers.set('X-Plan-Limit-Remaining', String(firstCheck.remaining));
      response.headers.set('X-Plan-Limit-Limit', String(firstCheck.limit));
      if (firstCheck.resetAt) {
        response.headers.set('X-Plan-Limit-Reset', firstCheck.resetAt);
      }
    }

    return response;
  };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function getEffectiveLimit(planLimits: PlanLimits, feature: keyof PlanLimits): number | boolean | undefined {
  return planLimits[feature];
}

export function isFeatureEnabled(planFeatures: PlanFeatures, feature: keyof PlanFeatures): boolean {
  return planFeatures[feature] === true;
}

export function getPlanDisplayInfo(plan: Plan) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceMonthly: plan.priceMonthlyUsd / 100,
    priceYearly: plan.priceYearlyUsd / 100,
    features: plan.features,
    limits: plan.limits,
  };
}

// clearPlanCache is exported directly from its definition above
