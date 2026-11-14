import { NextRequest, NextResponse } from 'next/server';
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
import { getPlan, normalizePlanId, PLANS_FALLBACK } from '@/lib/billing/plans';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface PlanEnforcementContext {
  userId: string;
  workspaceId: string;
  plan: string;
  rawPlan?: string;
  planStatus?: string;
  isExpired?: boolean;
  features: PlanFeatures;
  limits: PlanLimits;
  templateCount: number;
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

export async function getPlanContext(userId: string, workspaceId: string): Promise<PlanEnforcementContext | null> {

  // Read the plan from the workspaces table — this is where upgrades are stored.
  let workspace: { plan: string; plan_status?: string; plan_expires_at?: string | null; features?: unknown } | null = null;
  let resolvedWsId = workspaceId;

  // First try direct workspace ID lookup
  const { data: wsById, error: wsError } = await supabaseAdmin
    .from('workspaces')
    .select('plan, plan_status, plan_expires_at, features')
    .eq('id', workspaceId)
    .single();

  if (!wsError && wsById) {
    workspace = wsById;
  } else {
    // Fallback: workspaceId might actually be a user UUID — look up the workspace via workspace_members
    logger.warn('Direct workspace lookup failed, trying via user membership', { workspaceId, userId, error: wsError });

    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .single();

    if (member?.workspace_id) {
      resolvedWsId = member.workspace_id;
      const { data: wsFromMember } = await supabaseAdmin
        .from('workspaces')
        .select('plan, plan_status, plan_expires_at, features')
        .eq('id', member.workspace_id)
        .single();

      if (wsFromMember) {
        workspace = wsFromMember;
      }
    }
  }

  // If we still can't find the workspace, degrade gracefully to free tier (spark)
  if (!workspace) {
    logger.warn('Could not resolve workspace — defaulting to spark tier', { workspaceId, userId });
    workspace = { plan: 'spark', plan_status: 'active' };
  }

  let rawPlan = normalizePlanId((workspace.plan as string) || 'spark');
  let planStatus = workspace.plan_status || 'active';
  let planExpiresAt = workspace.plan_expires_at;

  // ── Ground-truth cross-check: query active subscription from subscriptions table ──
  // Matches app/api/billing/current ground-truth logic. If the workspace has an active,
  // non-expired subscription (e.g. Pro), respect it and auto-heal the workspaces row.
  try {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_id, status, current_period_end')
      .eq('workspace_id', resolvedWsId)
      .maybeSingle();

    if (sub && sub.status === 'active') {
      const isSubExpired = Boolean(
        sub.current_period_end && new Date(sub.current_period_end) < new Date()
      );
      if (!isSubExpired && sub.plan_id) {
        rawPlan = normalizePlanId(sub.plan_id);
        planStatus = 'active';
        planExpiresAt = sub.current_period_end;

        // Auto-heal workspaces row asynchronously if out of sync
        if (
          workspace.plan !== sub.plan_id ||
          workspace.plan_status !== 'active' ||
          workspace.plan_expires_at !== sub.current_period_end
        ) {
          Promise.resolve(
            supabaseAdmin
              .from('workspaces')
              .update({
                plan: sub.plan_id,
                plan_status: 'active',
                plan_expires_at: sub.current_period_end,
                updated_at: new Date().toISOString(),
              })
              .eq('id', resolvedWsId)
          )
            .then(() => { })
            .catch((healErr: unknown) => {
              logger.warn('Auto-heal workspace from active subscription failed', {
                error: healErr,
                workspaceId: resolvedWsId,
              });
            });
        }
      }
    } else if (rawPlan === 'spark' && userId) {
      // Fallback: check by user_id if workspace_id didn't yield a subscription
      const { data: userSub } = await supabaseAdmin
        .from('subscriptions')
        .select('plan_id, status, current_period_end')
        .eq('user_id', userId)
        .maybeSingle();

      if (userSub && userSub.status === 'active') {
        const isUserSubExpired = Boolean(
          userSub.current_period_end && new Date(userSub.current_period_end) < new Date()
        );
        if (!isUserSubExpired && userSub.plan_id) {
          rawPlan = normalizePlanId(userSub.plan_id);
          planStatus = 'active';
          planExpiresAt = userSub.current_period_end;
        }
      }
    }
  } catch (subErr) {
    logger.warn('Failed to query subscriptions table in plan enforcement', {
      error: subErr,
      workspaceId: resolvedWsId,
    });
  }

  const isInactiveStatus = planStatus !== 'active' && planStatus !== 'trialing';
  const isExpired = Boolean(planExpiresAt && new Date(planExpiresAt) < new Date());

  // Enforce subscription lifecycle: if a paid plan is cancelled/expired/past_due/paused, downgrade effective entitlements to Spark (Free)
  let effectivePlan = rawPlan;
  if (rawPlan !== 'spark' && (isInactiveStatus || isExpired)) {
    logger.warn('Workspace paid plan is inactive or expired — enforcing Spark (Free) tier limits', {
      workspaceId: resolvedWsId,
      rawPlan,
      planStatus,
      planExpiresAt,
    });
    effectivePlan = 'spark';
  }

  const fallbackDef = getPlan(effectivePlan) || PLANS_FALLBACK.spark;

  // Get plan limits/features from the plans table (if seeded)
  const { data: planInfo } = await supabaseAdmin
    .from('plans')
    .select('limits, features')
    .eq('id', effectivePlan)
    .single();

  const dbFeatures = (planInfo?.features || {}) as Record<string, unknown>;
  const dbLimits = (planInfo?.limits || {}) as Record<string, unknown>;
  const wsFeatures = (!isInactiveStatus && !isExpired && workspace.features && typeof workspace.features === 'object')
    ? (workspace.features as Record<string, unknown>)
    : {};

  // Always start with canonical PLANS_FALLBACK ground truth so unseeded DB or missing keys never allow unlimited bypass
  const canonicalLimits: PlanLimits = {
    ...fallbackDef.limits,
    profiles: fallbackDef.limits.workspaces,
    ai_adaptations_per_month: fallbackDef.limits.ai_credits_per_month,
    template_count: fallbackDef.templateCount,
  };

  const canonicalFeatures: PlanFeatures = {
    ...fallbackDef.features,
    posts_per_month: fallbackDef.limits.posts_per_month,
    channels: fallbackDef.limits.channels,
    profiles: fallbackDef.limits.workspaces,
    workspaces: fallbackDef.limits.workspaces,
    team_seats: fallbackDef.limits.team_seats,
    ai_credits_per_month: fallbackDef.limits.ai_credits_per_month,
    ai_adaptations_per_month: fallbackDef.limits.ai_credits_per_month,
    ig_comments_per_month: fallbackDef.limits.ig_comments_per_month,
    linkedin_comments_per_month: fallbackDef.limits.linkedin_comments_per_month,
    brand_voices: fallbackDef.limits.brand_voices,
    analytics_retention_days: fallbackDef.limits.analytics_retention_days,
    template_count: fallbackDef.templateCount,
  };

  const mergedLimits: PlanLimits = {
    ...canonicalLimits,
    ...dbLimits,
  };
  if (mergedLimits.ai_adaptations_per_month === undefined) {
    mergedLimits.ai_adaptations_per_month = mergedLimits.ai_credits_per_month;
  }
  if (mergedLimits.profiles === undefined) {
    mergedLimits.profiles = mergedLimits.workspaces;
  }

  const features: PlanFeatures = {
    ...canonicalFeatures,
    ...dbFeatures,
    ...wsFeatures,
  } as PlanFeatures;

  const templateCount = typeof mergedLimits.template_count === 'number'
    ? mergedLimits.template_count
    : fallbackDef.templateCount;

  return {
    userId,
    workspaceId: resolvedWsId,
    plan: effectivePlan,
    rawPlan,
    planStatus,
    isExpired,
    features,
    limits: mergedLimits,
    templateCount,
  };
}

function checkFeatureGate(
  features: PlanFeatures,
  limits: PlanLimits,
  action: PlanAction
): { allowed: boolean; reason?: string } {
  const featureMap: Record<PlanAction, keyof PlanFeatures> = {
    create_post: 'posts_per_month',
    create_profile: 'workspaces',
    invite_member: 'team_seats',
    use_ai: 'ai_credits_per_month',
    upload_media: 'media_uploads_per_month',
    connect_channel: 'channels',
    ig_comment_reply: 'ig_comments_per_month',
    linkedin_comment_reply: 'linkedin_comments_per_month',
    brand_voice: 'brand_voices',
    api_access: 'api_access',
    custom_domain: 'custom_domain',
    analytics: 'analytics_retention_days',
    scheduling: 'posts_per_month',
    team_collaboration: 'team_seats',
    white_label: 'white_label',
    priority_support: 'priority_support',
    api_keys: 'api_access',
    webhooks: 'api_access',
    export_data: 'csv_export',
    csv_export: 'csv_export',
    flightplan_ai: 'flightplan_ai',
    content_humanizer: 'content_humanizer',
    first_comment: 'first_comment',
    dm_concierge: 'dm_concierge',
    dm_concierge_full: 'dm_concierge_full',
    lead_scoring: 'lead_scoring',
    auto_hide_spam: 'auto_hide_spam',
    approval_workflows: 'approval_workflows',
    follow_to_unlock: 'follow_to_unlock',
    badge_removal: 'badge_removal',
  };

  const featureKey = featureMap[action];
  if (!featureKey) return { allowed: true };

  // Check features first, then limits.
  const featureValue = features[featureKey as keyof PlanFeatures];
  const limitValue = limits[featureKey as keyof PlanLimits];
  const value = featureValue !== undefined ? featureValue : limitValue;

  if (value === undefined) return { allowed: true };

  // -1 = unlimited, true = enabled, positive number = has quota (allowed at gate level)
  // false or 0 = explicitly disabled
  const allowed =
    value === true ||
    value === -1 ||
    (typeof value === 'number' && value > 0);

  return {
    allowed,
    reason: allowed ? undefined : `Feature '${action}' is not available on your current plan`,
  };
}


async function checkQuota(
  action: PlanAction,
  userId: string,
  workspaceId: string,
  plan: string,
  contextLimits?: PlanLimits
): Promise<{ allowed: boolean; limit: number; currentUsage: number; reason?: string }> {

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const fallbackDef = getPlan(plan) || PLANS_FALLBACK.spark;
  const limits: PlanLimits = contextLimits || {
    ...fallbackDef.limits,
    profiles: fallbackDef.limits.workspaces,
    ai_adaptations_per_month: fallbackDef.limits.ai_credits_per_month,
  };

  // Map action to table and limit
  const actionConfigMap: Partial<Record<
    PlanAction,
    { table: string; limitKey: keyof PlanLimits; timeWindow: Date; filterStatus?: string | string[]; filterBool?: [string, boolean] }
  >> = {
    create_post: { table: 'posts', limitKey: 'posts_per_month', timeWindow: monthStart, filterStatus: ['published', 'scheduled'] },
    scheduling: { table: 'posts', limitKey: 'posts_per_month', timeWindow: monthStart, filterStatus: ['published', 'scheduled'] },
    create_profile: { table: 'profiles', limitKey: 'workspaces', timeWindow: new Date(0) },
    invite_member: { table: 'workspace_members', limitKey: 'team_seats', timeWindow: new Date(0) },
    team_collaboration: { table: 'workspace_members', limitKey: 'team_seats', timeWindow: new Date(0) },
    use_ai: { table: 'ai_usage', limitKey: 'ai_credits_per_month', timeWindow: monthStart },
    upload_media: { table: 'media_uploads', limitKey: 'media_uploads_per_month', timeWindow: monthStart },
    connect_channel: { table: 'platform_connections', limitKey: 'channels', timeWindow: new Date(0), filterStatus: 'connected' },
    ig_comment_reply: { table: 'instagram_comment_logs', limitKey: 'ig_comments_per_month', timeWindow: monthStart, filterBool: ['replied', true] },
    linkedin_comment_reply: { table: 'linkedin_comment_logs', limitKey: 'linkedin_comments_per_month', timeWindow: monthStart },
    brand_voice: { table: 'brand_materials_pages', limitKey: 'brand_voices', timeWindow: new Date(0) },
  };

  const targetConfig = actionConfigMap[action];
  if (!targetConfig) return { allowed: true, limit: -1, currentUsage: 0 };

  let limit = limits[targetConfig.limitKey] as number | boolean | undefined;
  if (targetConfig.limitKey === 'ai_credits_per_month' && limit === undefined) {
    limit = limits.ai_adaptations_per_month;
  }
  if (targetConfig.limitKey === 'workspaces' && limit === undefined) {
    limit = limits.profiles;
  }

  if (limit === true || limit === -1 || limit === undefined) {
    return { allowed: true, limit: -1, currentUsage: 0 };
  }

  const numericLimit = typeof limit === 'number' ? limit : 0;
  if (numericLimit <= 0) {
    return {
      allowed: false,
      limit: 0,
      currentUsage: 0,
      reason: `Feature '${action}' is not available on your current plan`,
    };
  }

  let currentUsage = 0;
  try {
    let query = supabaseAdmin
      .from(targetConfig.table)
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    if (targetConfig.filterStatus) {
      if (Array.isArray(targetConfig.filterStatus)) {
        query = query.in('status', targetConfig.filterStatus);
      } else {
        query = query.eq('status', targetConfig.filterStatus);
      }
    }

    if (targetConfig.filterBool) {
      query = query.eq(targetConfig.filterBool[0], targetConfig.filterBool[1]);
    }

    if (targetConfig.timeWindow > new Date(0)) {
      query = query.gte('created_at', targetConfig.timeWindow.toISOString());
    }

    const { count } = await query;
    currentUsage = count || 0;
  } catch {
    currentUsage = 0;
  }

  return {
    allowed: currentUsage < numericLimit,
    limit: numericLimit,
    currentUsage,
    reason: currentUsage >= numericLimit ? `Limit reached: ${targetConfig.limitKey} (${currentUsage}/${numericLimit})` : undefined,
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
  const featureCheck = checkFeatureGate(features, limits, action);
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
  const quotaCheck = await checkQuota(action, userId, workspaceId, plan, limits);
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
      'X-Quota-Limit': String(quotaCheck.limit ?? (actionConfig[action] ? getEffectiveLimit(limits, actionConfig[action]!.limitKey) : -1) ?? -1),
      'X-Quota-Usage': String(quotaCheck.currentUsage ?? 0),
    },
  };
}

// Action config for quota headers
const actionConfig: Partial<Record<PlanAction, { limitKey: keyof PlanLimits }>> = {
  create_post: { limitKey: 'posts_per_month' },
  create_profile: { limitKey: 'workspaces' },
  invite_member: { limitKey: 'team_seats' },
  use_ai: { limitKey: 'ai_credits_per_month' },
  upload_media: { limitKey: 'media_uploads_per_month' },
  connect_channel: { limitKey: 'channels' },
  ig_comment_reply: { limitKey: 'ig_comments_per_month' },
  linkedin_comment_reply: { limitKey: 'linkedin_comments_per_month' },
  brand_voice: { limitKey: 'brand_voices' },
  api_access: { limitKey: 'api_access' },
  custom_domain: { limitKey: 'custom_domain' },
  analytics: { limitKey: 'analytics_retention_days' },
  scheduling: { limitKey: 'posts_per_month' },
  team_collaboration: { limitKey: 'team_seats' },
};

export async function withPlanEnforcement(
  request: NextRequest,
  action: PlanAction,
  handler: (request: NextRequest, context: PlanEnforcementContext) => Promise<NextResponse>
): Promise<NextResponse> {
  // Extract user/workspace from headers (set by middleware.ts)
  let userId = request.headers.get('x-user-id') || '';
  let workspaceId = request.headers.get('x-workspace-id') || '';

  if (!userId || !workspaceId) {
    // Fallback: resolve via getCurrentAuth if headers are missing
    const { getCurrentAuth } = await import('@/lib/auth/server');
    const auth = await getCurrentAuth(request);

    if (auth) {
      userId = auth.userId;
      workspaceId = auth.workspaceId;
    }

    if (!userId || !workspaceId) {
      logger.warn('Plan enforcement: missing user/workspace context', { userId, workspaceId });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
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
  connectChannel: createPlanEnforcementMiddleware('connect_channel'),
  igCommentReply: createPlanEnforcementMiddleware('ig_comment_reply'),
  linkedinCommentReply: createPlanEnforcementMiddleware('linkedin_comment_reply'),
  brandVoice: createPlanEnforcementMiddleware('brand_voice'),
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
  csvExport: createPlanEnforcementMiddleware('csv_export'),
  flightplanAI: createPlanEnforcementMiddleware('flightplan_ai'),
  contentHumanizer: createPlanEnforcementMiddleware('content_humanizer'),
  firstComment: createPlanEnforcementMiddleware('first_comment'),
  dmConcierge: createPlanEnforcementMiddleware('dm_concierge'),
  dmConciergeFull: createPlanEnforcementMiddleware('dm_concierge_full'),
  leadScoring: createPlanEnforcementMiddleware('lead_scoring'),
  autoHideSpam: createPlanEnforcementMiddleware('auto_hide_spam'),
  approvalWorkflows: createPlanEnforcementMiddleware('approval_workflows'),
  followToUnlock: createPlanEnforcementMiddleware('follow_to_unlock'),
  badgeRemoval: createPlanEnforcementMiddleware('badge_removal'),
};
