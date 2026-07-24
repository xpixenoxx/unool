import { NextRequest, NextResponse } from 'next/server';
import { enforcePlanLimits, PlanAction, clearPlanCache, PlanEnforcementResult, WorkspacePlanInfo } from '@/lib/plan-enforcement';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';

export interface PlanEnforcementOptions {
  action: PlanAction;
  errorMessage?: string;
  /**
   * Custom handler to get auth context if not using standard middleware headers
   */
  getAuthContext?: (request: NextRequest) => Promise<{ userId: string; workspaceId: string } | null>;
}

/**
 * Plan enforcement wrapper for API routes
 * Usage:
 *   export const POST = withPlanEnforcement(async (request, context) => {
 *     // Your handler logic here
 *   }, { action: 'create_post' });
 */
export function withPlanEnforcement(
  handler: (request: NextRequest, context: { userId: string; workspaceId: string }) => Promise<NextResponse>,
  options: PlanEnforcementOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const traceId = crypto.randomUUID?.() ?? `trace-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      // Get auth context - use custom getter or default
      const auth = options.getAuthContext
        ? await options.getAuthContext(request)
        : await getCurrentAuth(request);

      if (!auth) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      const { userId, workspaceId } = auth;

      // Enforce plan limits - only for actions supported by enforcePlanLimits
      let enforcement: PlanEnforcementResult;
      if (isEnforceAction(options.action)) {
        enforcement = await enforcePlanLimits(workspaceId, options.action);
      } else {
        // For actions not in enforcePlanLimits (analytics, scheduling, etc.), allow by default
        // These are feature-gate only actions checked elsewhere
        logger.info('Plan action not enforced by core middleware', { action: options.action });
        enforcement = {
          allowed: true,
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

      if (!enforcement.allowed) {
        // Find the failed check for detailed error message
        const failedCheck = Object.entries(enforcement.checks).find(([, v]) => !v.allowed);
        const message = options.errorMessage || failedCheck?.[1]?.message || 'Plan limit exceeded';

        logger.warn('Plan limit exceeded', {
          traceId,
          userId,
          workspaceId,
          action: options.action,
          plan: enforcement.workspacePlan.planName,
          failedCheck: failedCheck?.[0],
        });

        return NextResponse.json(
          {
            error: message,
            code: 'PLAN_LIMIT_EXCEEDED',
            plan: {
              id: enforcement.workspacePlan.planId,
              name: enforcement.workspacePlan.planName,
              features: enforcement.workspacePlan.features,
              limits: enforcement.workspacePlan.limits,
            },
            checks: enforcement.checks,
          },
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'X-Plan-Limit': 'exceeded',
              'X-Plan-Id': enforcement.workspacePlan.planId,
              'X-Plan-Name': enforcement.workspacePlan.planName,
            },
          }
        );
      }

      logger.info('Plan enforcement passed', {
        traceId,
        userId,
        workspaceId,
        action: options.action,
        plan: enforcement.workspacePlan.planName,
      });

      // Call the handler with auth context
      const response = await handler(request, { userId, workspaceId });

      // Add plan info headers to successful response
      const firstCheck = Object.values(enforcement.checks)[0];
      if (firstCheck) {
        response.headers.set('X-Plan-Limit-Remaining', String(firstCheck.remaining));
        response.headers.set('X-Plan-Limit-Limit', String(firstCheck.limit));
        if (firstCheck.resetAt) {
          response.headers.set('X-Plan-Limit-Reset', firstCheck.resetAt);
        }
      }
      response.headers.set('X-Plan-Id', enforcement.workspacePlan.planId);
      response.headers.set('X-Plan-Name', enforcement.workspacePlan.planName);

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Plan enforcement error', { traceId, error: err, stack: err.stack });
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Standalone function to check plan limits without wrapping a handler
 * Useful for checking limits before performing an action in the middle of a handler
 */
export async function checkPlanLimit(
  request: NextRequest,
  action: PlanAction
): Promise<{ allowed: boolean; response?: NextResponse; userId?: string; workspaceId?: string }> {
  const auth = await getCurrentAuth(request);

  if (!auth) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  const { userId, workspaceId } = auth;

  // Only check actions supported by enforcePlanLimits
  if (!isEnforceAction(action)) {
    return { allowed: true, userId, workspaceId };
  }

  const enforcement = await enforcePlanLimits(workspaceId, action);

  if (!enforcement.allowed) {
    const failedCheck = Object.entries(enforcement.checks).find(([, v]) => !v.allowed);
    const message = failedCheck?.[1]?.message || 'Plan limit exceeded';

    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: message,
          code: 'PLAN_LIMIT_EXCEEDED',
          plan: {
            id: enforcement.workspacePlan.planId,
            name: enforcement.workspacePlan.planName,
            features: enforcement.workspacePlan.features,
            limits: enforcement.workspacePlan.limits,
          },
          checks: enforcement.checks,
        },
        {
          status: 403,
          headers: {
            'X-Plan-Limit': 'exceeded',
            'X-Plan-Id': enforcement.workspacePlan.planId,
            'X-Plan-Name': enforcement.workspacePlan.planName,
          },
        }
      ),
      userId,
      workspaceId,
    };
  }

  return { allowed: true, userId, workspaceId };
}

/**
 * Clear plan cache - call this after plan changes (e.g., upgrade/downgrade)
 */
export { clearPlanCache };

/**
 * Helper to create a handler that checks multiple plan actions
 * Useful for handler that might perform multiple actions
 */
export function withMultiPlanEnforcement(
  handler: (request: NextRequest, context: { userId: string; workspaceId: string }) => Promise<NextResponse>,
  actions: PlanAction[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await getCurrentAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { userId, workspaceId } = auth;

    // Check all actions - fail fast on first failure
    for (const action of actions) {
      if (!isEnforceAction(action)) continue;

      const enforcement = await enforcePlanLimits(workspaceId, action);
      if (!enforcement.allowed) {
        const failedCheck = Object.entries(enforcement.checks).find(([, v]) => !v.allowed);
        return NextResponse.json(
          {
            error: failedCheck?.[1]?.message || `Plan limit exceeded for action: ${action}`,
            code: 'PLAN_LIMIT_EXCEEDED',
            action,
            plan: {
              id: enforcement.workspacePlan.planId,
              name: enforcement.workspacePlan.planName,
              features: enforcement.workspacePlan.features,
              limits: enforcement.workspacePlan.limits,
            },
            checks: enforcement.checks,
          },
          {
            status: 403,
            headers: {
              'X-Plan-Limit': 'exceeded',
              'X-Plan-Id': enforcement.workspacePlan.planId,
              'X-Plan-Name': enforcement.workspacePlan.planName,
            },
          }
        );
      }
    }

    // All checks passed
    return await handler(request, { userId, workspaceId });
  };
}

/**
 * Type predicate to check if action is supported by enforcePlanLimits
 */
function isEnforceAction(action: PlanAction): action is 'create_post' | 'create_profile' | 'invite_member' | 'use_ai' | 'upload_media' | 'api_access' | 'custom_domain' {
  return [
    'create_post',
    'create_profile',
    'invite_member',
    'use_ai',
    'upload_media',
    'api_access',
    'custom_domain',
  ].includes(action);
}

/**
 * Plan action to HTTP endpoint mapping for easy reference
 */
export const PLAN_ACTION_ENDPOINTS: Record<string, PlanAction[]> = {
  '/api/composer/adapt': ['use_ai'],
  '/api/composer/generate': ['use_ai'],
  '/api/publish': ['create_post'],
  '/api/profile': ['create_profile'],
  '/api/workspace/members': ['invite_member'],
  '/api/media/upload': ['upload_media'],
  '/api/keys': ['api_access'],
  '/api/sync': ['api_access'],
};