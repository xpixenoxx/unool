import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { getPlanContext, enforcePlanLimit } from '@/lib/middleware/plan-enforcement-middleware';
import { validateUrlForFetch } from '@/lib/utils/url-validation';

export interface PlatformConnectContext {
  userId: string;
  workspaceId: string;
}

/**
 * Shared authentication, workspace authorization, RBAC, and plan-limit gate for
 * all custom credential/token `/api/auth/platform/[provider]/connect` endpoints.
 */
export async function resolvePlatformConnectContext(
  request: NextRequest,
  bodyWorkspaceId?: unknown
): Promise<{ context: PlatformConnectContext } | { error: NextResponse }> {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return {
      error: NextResponse.json({ error: 'Unauthorized: Sign in required' }, { status: 401 }),
    };
  }

  const requestedWorkspaceId =
    typeof bodyWorkspaceId === 'string' && bodyWorkspaceId.trim().length > 0
      ? bodyWorkspaceId.trim()
      : auth.workspaceId;

  if (!requestedWorkspaceId) {
    return {
      error: NextResponse.json({ error: 'No active workspace found' }, { status: 400 }),
    };
  }

  const roleCheck = await requireWorkspaceRole(auth.userId, requestedWorkspaceId, [
    'owner',
    'admin',
    'editor',
  ]);
  if (!roleCheck.allowed) {
    return {
      error: NextResponse.json(
        {
          error: 'Forbidden: You do not have permission to connect channels in this workspace',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      ),
    };
  }

  const planContext = await getPlanContext(auth.userId, requestedWorkspaceId);
  if (planContext) {
    const limitCheck = await enforcePlanLimit(request, 'connect_channel', planContext);
    if (!limitCheck.allowed) {
      return {
        error: NextResponse.json(
          {
            error:
              limitCheck.error?.reason ||
              limitCheck.error?.message ||
              'Connected channel limit reached for your current plan. Upgrade to connect more accounts.',
            code: limitCheck.error?.code || 'PLAN_LIMIT_REACHED',
            limit: limitCheck.error?.limit,
            current: limitCheck.error?.currentUsage,
            upgradeUrl: '/dashboard/billing',
          },
          { status: 403, headers: limitCheck.headers }
        ),
      };
    }
  }

  return {
    context: {
      userId: auth.userId,
      workspaceId: requestedWorkspaceId,
    },
  };
}

/**
 * Normalizes and SSRF-validates a user-supplied self-hosted instance URL
 * (e.g., Mastodon, Lemmy, Listmonk). Blocks loopback, link-local metadata,
 * RFC1918 private ranges, and non-HTTPS schemes.
 */
export async function validateExternalInstanceUrl(
  rawUrl: string
): Promise<{ ok: true; origin: string; hostname: string } | { ok: false; error: string }> {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Instance URL is required' };
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: 'Invalid instance URL format' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'Instance URL must use https://' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: 'Instance URL must not include embedded credentials' };
  }

  const origin = `${parsed.protocol}//${parsed.host}`;
  const ssrfResult = await validateUrlForFetch(origin);
  if (!ssrfResult.allowed) {
    return { ok: false, error: ssrfResult.reason || 'Instance URL is not allowed' };
  }

  return {
    ok: true,
    origin,
    hostname: parsed.hostname.toLowerCase(),
  };
}

/**
 * Validates a full user-supplied webhook URL (preserving path and query string)
 * to ensure it uses HTTPS, carries no embedded credentials, and passes SSRF checks.
 */
export async function validateHttpsWebhookUrl(
  rawUrl: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Webhook URL is required' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: 'Invalid webhook URL format' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'Webhook URL must use https://' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: 'Webhook URL must not include embedded credentials' };
  }

  const ssrfResult = await validateUrlForFetch(parsed.toString());
  if (!ssrfResult.allowed) {
    return { ok: false, error: ssrfResult.reason || 'Webhook URL is not allowed' };
  }

  return { ok: true, url: parsed.toString() };
}