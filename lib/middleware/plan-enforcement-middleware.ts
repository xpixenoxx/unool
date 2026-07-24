import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  PlanLimits,
  PlanFeatures,
  PlanAction,
  WorkspacePlanInfo,
  enforcePlanLimits,
  clearPlanCache,
  getEffectiveLimit,
  isFeatureEnabled,
} from '@/lib/plan-enforcement';
import { logger } from '@/lib/logger';

export interface PlanEnforcementContext {
  userId: string;
  workspaceId: string;
  plan: string;
  features: PlanFeatures;
  limits: PlanLimits;
}

export interface PlanEnforcementResult {
  allowed: boolean;
  error?: {
    code: string;
    message: string;
    plan: string;
    reason?: string;
    limit?: number;
    currentUsage?: number;
  };
  headers?: Record<string, string>;
}

async function getPlanContext(userId: string, workspaceId: string): Promise<PlanEnforcementContext | null> {
  // Get user's current plan from profiles table
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    logger.warn('Failed to get user plan', { userId, error: profileError });
  }

  const plan = (profile?.plan as string) || 'free';

  // Get workspace features
  const { data: workspace, error: wsError } = await supabaseAdmin
    .from('workspaces')
    .select('features')
    .eq('id', workspaceId)
    .single();

  if (wsError) {
    logger.warn('Failed to get workspace features', { workspaceId, error: wsError });
  }

  // Get plan info to get default limits/features
  const { data: planInfo } = await supabaseAdmin
    .from('plans')
    .select('limits, features')
    .eq('id', plan)
    .single();

  const features: PlanFeatures = (workspace?.features as PlanFeatures) || planInfo?.features || {};
  const limits: PlanLimits = planInfo?.limits || {};

  return {
    userId,
    workspaceId,
    plan,
    features,
    limits,
  };
}

function checkFeatureGate(features: PlanFeatures, action: PlanAction): { allowed: boolean; reason?: string } {
  const featureMap: Record<PlanAction, keyof PlanFeatures> = {
    create_post: 'posts_per_month',
    create_profile: 'profiles',
    invite_member: 'team_seats',
    use_ai: 'ai_adaptations_per_month',
    upload_media: 'media_uploads_per_month',
    api_access: 'api_access',
    custom_domain: 'custom_domain',
    analytics: 'analytics_retention_days',
    scheduling: 'analytics_retention_days',
    team_collaboration: 'team_seats',
    white_label: 'custom_domain',
    priority_support: 'custom_domain',
    api_keys: 'api_access',
    webhooks: 'api_access',
    export_data: 'analytics_retention_days',
  };

  const featureKey = featureMap[action];
  if (!featureKey) return { allowed: true };

  const value = features[featureKey];
  const allowed = value === true || (typeof value === 'number' && value > 0);

  return {
    allowed,
    reason: allowed ? undefined : `Feature '${action}' not available in current plan`,
  };
}

async function checkQuota(
  action: PlanAction,
  userId: string,
  workspaceId: string,
  plan: string
): Promise<{ allowed: boolean; limit: number; currentUsage: number; reason?: string }> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  // Get plan limits from database
  const { data: planData } = await supabaseAdmin
    .from('plans')
    .select('limits')
    .eq('id', plan)
    .single();

  const limits = planData?.limits as PlanLimits | undefined;

  // Map action to table and limit
  const actionConfig: Record<
    PlanAction,
    { table: string; limitKey: keyof PlanLimits; timeWindow: Date }
  > = {
    create_post: { table: 'posts', limitKey: 'posts_per_month', timeWindow: monthStart },
    create_profile: { table: 'profiles', limitKey: 'profiles', timeWindow: new Date(0) },
    invite_member: { table: 'workspace_members', limitKey: 'team_seats', timeWindow: new Date(0) },
    use_ai: { table: 'ai_usage', limitKey: 'ai_adaptations_per_month', timeWindow: monthStart },
    upload_media: { table: 'media_uploads', limitKey: 'media_uploads_per_month', timeWindow: monthStart },
    api_access: { table: 'api_calls', limitKey: 'api_access', timeWindow: dayStart },
    custom_domain: { table: 'profiles', limitKey: 'custom_domain', timeWindow: new Date(0) },
    analytics: { table: 'analytics', limitKey: 'analytics_retention_days', timeWindow: new Date(0) },
    scheduling: { table: 'posts', limitKey: 'posts_per_month', timeWindow: monthStart },
    team_collaboration: { table: 'workspace_members', limitKey: 'team_seats', timeWindow: new Date(0) },
    white_label: { table: 'profiles', limitKey: 'custom_domain', timeWindow: new Date(0) },
    priority_support: { table: 'profiles', limitKey: 'custom_domain', timeWindow: new Date(0) },
    api_keys: { table: 'api_keys', limitKey: 'api_access', timeWindow: new Date(0) },
    webhooks: { table: 'webhooks', limitKey: 'api_access', timeWindow: new Date(0) },
    export_data: { table: 'exports', limitKey: 'analytics_retention_days', timeWindow: new Date(0) },
  };

  const config = actionConfig[action];
  if (!config) return { allowed: true, limit: -1, currentUsage: 0 };

  const limit = limits?.[config.limitKey] as number | boolean | undefined;
  if (limit === true || limit === -1 || limit === undefined) {
    return { allowed: true, limit: -1, currentUsage: 0 };
  }

  let currentUsage = 0;
  if (config.timeWindow > new Date(0)) {
    // Time-windowed query
    const { count } = await supabaseAdmin
      .from(config.table)
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', config.timeWindow.toISOString());
    currentUsage = count || 0;
  } else {
    // Total count
    const { count } = await supabaseAdmin
      .from(config.table)
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);
    currentUsage = count || 0;
  }

  const numericLimit = typeof limit === 'number' ? limit : -1;
  if (numericLimit === -1) return { allowed: true, limit: -1, currentUsage: 0 };

  return {
    allowed: currentUsage < numericLimit,
    limit: numericLimit,
    currentUsage,
    reason: currentUsage >= numericLimit ? `Limit reached: ${config.limitKey} (${currentUsage}/${numericLimit})` : undefined,
  };
}

function createPlanLimitError(plan: string, action: PlanAction, reason: string, details?: { limit?: number; currentUsage?: number }) {
  return {
    code: 'PLAN_LIMIT_EXCEEDED',
    message: reason,
    plan,
    reason,
    limit: details?.limit,
    currentUsage: details?.currentUsage,
  };
}

export async function enforcePlanLimit(
  request: NextRequest,
  action: PlanAction,
  context: PlanEnforcementContext
): Promise<PlanEnforcementResult> {
  const { userId, workspaceId, plan, features, limits } = context;

  // Check feature gate
  const featureCheck = checkFeatureGate(features, action);
  if (!featureCheck.allowed) {
    return {
      allowed: false,
      error: createPlanLimitError(plan, action, featureCheck.reason || 'Feature not available in current plan'),
      headers: {
        'X-Plan-Limit': 'feature-gate',
        'X-Current-Plan': plan,
      },
    };
  }

  // Check quota for tracked actions
  const quotaCheck = await checkQuota(action, userId, workspaceId, plan);
  if (!quotaCheck.allowed) {
    return {
      allowed: false,
      error: createPlanLimitError(plan, action, quotaCheck.reason || 'Quota exceeded', {
        limit: quotaCheck.limit,
        currentUsage: quotaCheck.currentUsage,
      }),
      headers: {
        'X-Plan-Limit': 'quota',
        'X-Current-Plan': plan,
        'X-Quota-Limit': String(quotaCheck.limit),
        'X-Quota-Usage': String(quotaCheck.currentUsage),
      },
    };
  }

  // All checks passed
  return {
    allowed: true,
    headers: {
      'X-Current-Plan': plan,
      'X-Quota-Limit': String(quotaCheck.limit ?? getEffectiveLimit(limits, actionConfig[action]?.limitKey) ?? -1),
      'X-Quota-Usage': String(quotaCheck.currentUsage ?? 0),
    },
  };
}

// Action config for quota checking (same as in checkQuota)
const actionConfig: Record<PlanAction, { limitKey: keyof PlanLimits }> = {
  create_post: { limitKey: 'posts_per_month' },
  create_profile: { limitKey: 'profiles' },
  invite_member: { limitKey: 'team_seats' },
  use_ai: { limitKey: 'ai_adaptations_per_month' },
  upload_media: { limitKey: 'media_uploads_per_month' },
  api_access: { limitKey: 'api_access' },
  custom_domain: { limitKey: 'custom_domain' },
  analytics: { limitKey: 'analytics_retention_days' },
  scheduling: { limitKey: 'posts_per_month' },
  team_collaboration: { limitKey: 'team_seats' },
  white_label: { limitKey: 'custom_domain' },
  priority_support: { limitKey: 'custom_domain' },
  api_keys: { limitKey: 'api_access' },
  webhooks: { limitKey: 'api_access' },
  export_data: { limitKey: 'analytics_retention_days' },
};

export async function withPlanEnforcement(
  request: NextRequest,
  action: PlanAction,
  handler: (request: NextRequest, context: PlanEnforcementContext) => Promise<NextResponse>
): Promise<NextResponse> {
  // Extract user/workspace from headers (set by middleware.ts)
  const userId = request.headers.get('x-user-id') || '';
  const workspaceId = request.headers.get('x-workspace-id') || '';

  if (!userId || !workspaceId) {
    logger.warn('Plan enforcement: missing user/workspace context', { userId, workspaceId });
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Get plan context
  const context = await getPlanContext(userId, workspaceId);
  if (!context) {
    return NextResponse.json(
      { error: 'Failed to retrieve plan information' },
      { status: 500 }
    );
  }

  // Enforce plan limits
  const enforcement = await enforcePlanLimit(request, action, context);

  if (!enforcement.allowed) {
    return NextResponse.json(
      {
        error: enforcement.error?.message || 'Plan limit exceeded',
        code: enforcement.error?.code,
        plan: enforcement.error?.plan,
        limit: enforcement.error?.limit,
        currentUsage: enforcement.error?.currentUsage,
      },
      {
        status: 403,
        headers: enforcement.headers,
      }
    );
  }

  // Add plan context headers to request for downstream use
  const enrichedHeaders = new Headers(request.headers);
  enrichedHeaders.set('x-plan-tier', context.plan);
  enrichedHeaders.set('x-user-id', userId);
  enrichedHeaders.set('x-workspace-id', workspaceId);

  // Create new request with enriched headers
  const enrichedRequest = new NextRequest(request.url, {
    method: request.method,
    headers: enrichedHeaders,
    body: request.body,
    cache: request.cache,
    credentials: request.credentials,
    integrity: request.integrity,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
  });

  // Call the handler with enriched request
  const response = await handler(enrichedRequest, context);

  // Add enforcement headers to response
  if (enforcement.headers) {
    Object.entries(enforcement.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export function createPlanEnforcementMiddleware(action: PlanAction) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest, context: PlanEnforcementContext) => Promise<NextResponse>
  ) => {
    return withPlanEnforcement(request, action, handler);
  };
}

// Pre-configured middleware for common actions
export const planEnforcement = {
  createPost: createPlanEnforcementMiddleware('create_post'),
  createProfile: createPlanEnforcementMiddleware('create_profile'),
  inviteMember: createPlanEnforcementMiddleware('invite_member'),
  useAI: createPlanEnforcementMiddleware('use_ai'),
  uploadMedia: createPlanEnforcementMiddleware('upload_media'),
  apiAccess: createPlanEnforcementMiddleware('api_access'),
  customDomain: createPlanEnforcementMiddleware('custom_domain'),
  analytics: createPlanEnforcementMiddleware('analytics'),
  scheduling: createPlanEnforcementMiddleware('scheduling'),
  teamCollaboration: createPlanEnforcementMiddleware('team_collaboration'),
  whiteLabel: createPlanEnforcementMiddleware('white_label'),
  prioritySupport: createPlanEnforcementMiddleware('priority_support'),
  apiKeys: createPlanEnforcementMiddleware('api_keys'),
  webhooks: createPlanEnforcementMiddleware('webhooks'),
  exportData: createPlanEnforcementMiddleware('export_data'),
};