import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { Plan } from '@/lib/repositories/interfaces/IAdminRepository';
import { getPlan, type PlanId } from '@/lib/billing/plans';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';



// ============================================================
// TYPES
// ============================================================

export interface PlanLimits {
  posts_per_month?: number;
  profiles?: number;
  api_access?: boolean;
  team_seats?: number;
  ai_adaptations_per_month?: number;
  media_uploads_per_month?: number;
  analytics_retention_days?: number;
  custom_domain?: boolean;
}

export interface PlanFeatures {
  posts_per_month?: number;
  profiles?: number;
  api_access?: boolean;
  analytics_retention_days?: number;
  custom_domain?: boolean;
  team_seats?: number;
  ai_adaptations_per_month?: number;
  media_uploads_per_month?: number;
}

export interface WorkspacePlanInfo {
  planId: string;
  planName: string;
  planStatus: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';
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
  | 'export_data';

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
    return await redis.get<CachedPlan>(`plan:`);
  } catch { return null; }
}

async function setCachedPlanInRedis(planId: string, plan: Plan): Promise<void> {
  const redis = getRedisForCache();
  if (!redis) return;
  try {
    const cached: CachedPlan = { plan, expiresAt: Date.now() + PLAN_CACHE_TTL * 1000 };
    await redis.set(`plan:`, cached, { ex: PLAN_CACHE_TTL });
  } catch { /* non-fatal */ }
}

async function getPlanFromCache(planId: string): Promise<Plan | null> {
  // Check Redis cache first
  const cached = await getCachedPlanFromRedis(planId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.plan;
  }

  // Cache miss — fetch from DB
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error || !data) {
    const planDef = getPlan(planId as PlanId);
    if (!planDef) return null;
    const fallbackPlan: Plan = {
      id: planDef.id,
      name: planDef.name,
      description: planDef.tagline,
      priceMonthlyUsd: (planDef.pricing?.USD?.monthly || 0) / 100,
      priceYearlyUsd: (planDef.pricing?.USD?.annual || 0) / 100,
      features: planDef.features as unknown as Record<string, unknown>,
      limits: planDef.limits as unknown as Record<string, unknown>,
      isActive: true,
      sortOrder: planDef.sortOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setCachedPlanInRedis(planId, fallbackPlan);
    return fallbackPlan;
  }

  const plan: Plan = {
    id: data.id,
    name: data.name,
    description: data.description,
    priceMonthlyUsd: data.price_monthly_usd,
    priceYearlyUsd: data.price_yearly_usd,
    features: data.features || {},
    limits: data.limits || {},
    isActive: data.is_active,
    sortOrder: data.sort_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  await setCachedPlanInRedis(planId, plan);
  return plan;
}

export function clearPlanCache(workspaceId: string): void {
  const redis = getRedisForCache();
  if (redis) redis.del(`plan:`).catch(() => {});
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

    const plan = await getPlanFromCache(ws.plan);
    if (!plan) return null;

    return {
      planId: plan.id,
      planName: plan.name,
      planStatus: ws.plan_status || 'active',
      planExpiresAt: ws.plan_expires_at,
      limits: plan.limits as PlanLimits,
      features: plan.features as PlanFeatures,
    };
  }

  // The view should have plan_limits and plan_features computed
  const plan = await getPlanFromCache(data.plan);
  if (!plan) return null;

  return {
    planId: data.plan,
    planName: plan.name,
    planStatus: data.plan_status || 'active',
    planExpiresAt: data.plan_expires_at,
    limits: (data.plan_limits || plan.limits) as PlanLimits,
    features: (data.plan_features || plan.features) as PlanFeatures,
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
      .eq('status', 'published')
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
  action: 'create_post' | 'create_profile' | 'invite_member' | 'use_ai' | 'upload_media' | 'api_access' | 'custom_domain'
): Promise<PlanEnforcementResult> {
  const planInfo = await getWorkspacePlanInfo(workspaceId);

  if (!planInfo) {
    // No plan info found - default to free tier limits
    return {
      allowed: false,
      checks: {},
      workspacePlan: {
        planId: 'free',
        planName: 'Free',
        planStatus: 'active',
        planExpiresAt: null,
        limits: {},
        features: {},
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

  switch (action) {
    case 'create_post': {
      const limit = planInfo.limits.posts_per_month;
      if (usage.postsThisMonth === null) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify usage (service error). Please try again.' } }, workspacePlan: planInfo };
      }
      checks.posts_per_month = checkLimit(
        'Posts per month',
        usage.postsThisMonth,
        limit,
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      );
      break;
    }
    case 'create_profile': {
      const limit = planInfo.limits.profiles;
      if (usage.profiles === null) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify usage (service error). Please try again.' } }, workspacePlan: planInfo };
      }
      checks.profiles = checkLimit('Profiles', usage.profiles, limit);
      break;
    }
    case 'invite_member': {
      const limit = planInfo.limits.team_seats;
      if (usage.teamMembers === null) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify usage (service error). Please try again.' } }, workspacePlan: planInfo };
      }
      checks.team_seats = checkLimit('Team seats', usage.teamMembers, limit);
      break;
    }
    case 'use_ai': {
      const limit = planInfo.limits.ai_adaptations_per_month;
      if (usage.aiAdaptationsThisMonth === null) {
        return { allowed: false, checks: { usage_error: { allowed: false, limit: 0, current: 0, remaining: 0, message: 'Unable to verify usage (service error). Please try again.' } }, workspacePlan: planInfo };
      }
      checks.ai_adaptations_per_month = checkLimit(
        'AI adaptations per month',
        usage.aiAdaptationsThisMonth,
        limit,
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      );
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
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      );
      break;
    }
    case 'api_access': {
      const hasAccess = planInfo.features.api_access === true || planInfo.limits.api_access === true;
      checks.api_access = {
        allowed: hasAccess,
        limit: hasAccess ? -1 : 0,
        current: usage.apiCallsToday ?? 0,
        remaining: hasAccess ? -1 : 0,
        message: hasAccess ? undefined : 'API access not included in your plan',
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
        message: hasAccess ? undefined : 'Custom domain not included in your plan',
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
  action: 'create_post' | 'create_profile' | 'invite_member' | 'use_ai' | 'upload_media' | 'api_access' | 'custom_domain';
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
