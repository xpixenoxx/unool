import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { generateOAuthState, storeOAuthState, createOAuthCookie } from '@/lib/auth/oauth-state';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { getPlanContext } from '@/lib/middleware/plan-enforcement-middleware';
import { sanitizeRelativeReturnUrl, buildSafeRedirectUrl } from '@/lib/auth/redirect';

export const dynamic = 'force-dynamic';

/**
 * Platforms that use a custom (non-OAuth-redirect) connect flow.
 * These are handled entirely on the frontend via dialogs and never
 * need a server-side OAuth redirect — so we skip the expensive
 * adapter.getAuthUrl() probe and redirect to dashboard immediately.
 */
const CUSTOM_FLOW_PLATFORMS = new Set([
  'bluesky',
  'mastodon',
  'slack',
  'twitch',
  'telegram',
  'skool',
  'warpcast',
  'mewe',
  'nostr',
  'medium',
  'lemmy',
  'listmonk',
  'hashnode',
  'devto',
  'manual',
]);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');
  const rawReturnUrl = searchParams.get('returnUrl');
  const returnUrl = rawReturnUrl ? sanitizeRelativeReturnUrl(rawReturnUrl, '/dashboard') : undefined;
  const addAccount = searchParams.get('addAccount') === 'true';
  const reconnectConnectionId = searchParams.get('reconnectConnectionId');
  const errorRedirect = returnUrl || '/dashboard';

  // Always resolve the authenticated user from verified internal header or Supabase SSR session
  const auth = await getCurrentAuth(request);
  const userId = auth?.userId ?? null;

  if (!userId) {
    logger.warn('Platform connect: unauthenticated request', { platform });
    return NextResponse.redirect(buildSafeRedirectUrl(request.url, errorRedirect, { error: 'unauthorized' }));
  }

  const requestedWorkspaceId = searchParams.get('workspaceId');
  const workspaceId = requestedWorkspaceId || auth?.workspaceId || null;

  if (!platform || !workspaceId) {
    logger.warn('Platform connect: missing params', { platform, hasWorkspace: !!workspaceId, hasUser: !!userId });
    return NextResponse.redirect(buildSafeRedirectUrl(request.url, errorRedirect, { error: 'missing_params' }));
  }

  const roleCheck = await requireWorkspaceRole(userId, workspaceId, ['owner', 'admin', 'editor']);
  if (!roleCheck.allowed) {
    logger.warn('Platform connect: workspace role/access denied', {
      userId,
      workspaceId,
      platform,
      reason: roleCheck.reason,
      role: roleCheck.role,
    });
    const errCode = roleCheck.reason === 'insufficient_role' ? 'insufficient_role' : 'forbidden_workspace';
    return NextResponse.redirect(buildSafeRedirectUrl(request.url, errorRedirect, { error: errCode }));
  }

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    logger.warn('Platform connect: unsupported platform', { platform });
    return NextResponse.redirect(
      buildSafeRedirectUrl(request.url, errorRedirect, { error: 'unsupported_platform', platform })
    );
  }

  // Enforce plan channel limit across connected accounts (allow reconnecting an existing account)
  try {
    const planCtx = await getPlanContext(userId, workspaceId);
    const channelLimit = planCtx?.limits?.channels;
    if (planCtx && typeof channelLimit === 'number' && channelLimit > 0 && !reconnectConnectionId) {
      const { data: connectedRows } = await supabaseAdmin
        .from('platform_connections')
        .select('id, platform')
        .eq('workspace_id', workspaceId)
        .eq('status', 'connected');

      const activeAccounts = connectedRows || [];
      const connectedPlatforms = new Set(activeAccounts.map((r: { platform: string }) => r.platform));
      const isImplicitReconnect = !addAccount && connectedPlatforms.has(platform);

      if (!isImplicitReconnect && activeAccounts.length >= channelLimit) {
        logger.warn('Platform connect: channel limit reached for plan', {
          workspaceId,
          plan: planCtx.plan,
          connectedCount: activeAccounts.length,
          channelLimit,
          platform,
          addAccount,
        });
        return NextResponse.redirect(
          buildSafeRedirectUrl(request.url, errorRedirect, {
            error: 'channel_limit_exceeded',
            limit: String(channelLimit),
            plan: planCtx.plan,
          })
        );
      }
    }
  } catch (limitErr) {
    logger.warn('Platform connect: failed to check channel limit', { error: limitErr, workspaceId });
  }

  // Ensure adapter has credentials configured before redirecting to provider
  if (!adapter.authConfig.clientId) {
    logger.error('Platform connect: missing client ID credentials', { platform });
    return NextResponse.redirect(
      buildSafeRedirectUrl(request.url, errorRedirect, {
        error: 'missing_credentials',
        platform,
        detail: `missing_${platform}_client_id`,
      })
    );
  }

  // Platforms with custom connect flows are handled entirely on the frontend.
  // Using a static set avoids a wasteful double adapter.getAuthUrl() probe call.
  if (CUSTOM_FLOW_PLATFORMS.has(platform)) {
    logger.info('Platform connect: custom flow platform, redirecting to dashboard', { platform });
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('connect', platform);
    return NextResponse.redirect(dashboardUrl);
  }

  // Derive the effective redirect URI.
  // If explicitly configured for this platform in env, respect it.
  // Otherwise, default to the caller's origin (so localhost, preview, and prod all redirect back to themselves).
  const explicitPlatformRedirect = platform === 'facebook'
    ? (config.FACEBOOK_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI)
    : undefined;
  const effectiveRedirectUri = explicitPlatformRedirect || `${request.nextUrl.origin}/api/auth/platform/callback`;

  // Generate cryptographically secure state
  const state = generateOAuthState(workspaceId, platform);

  // Store OAuth state in Redis + generate auth URL in parallel (zero wasted round-trips)
  const [, authUrlResult] = await Promise.all([
    storeOAuthState(state, workspaceId, userId, platform, returnUrl, effectiveRedirectUri),
    Promise.resolve(
      typeof (adapter as any).getAuthUrl === 'function' && platform === 'facebook'
        ? (adapter as any).getAuthUrl(state, effectiveRedirectUri)
        : adapter.getAuthUrl(state)
    ),
  ]);

  let authUrl: string;
  const resCookies: string[] = [createOAuthCookie(state, workspaceId, userId, platform, returnUrl, effectiveRedirectUri)];

  if (typeof authUrlResult === 'string') {
    authUrl = authUrlResult;
  } else {
    const result = await authUrlResult;
    authUrl = result.url;
    if (result.pkceCookie) {
      resCookies.push(result.pkceCookie);
    }
  }

  if (addAccount && platform === 'youtube') {
    try {
      const parsed = new URL(authUrl);
      parsed.searchParams.set('prompt', 'select_account consent');
      authUrl = parsed.toString();
    } catch {
      // keep generated authUrl as-is
    }
  }

  logger.info('Platform connect: redirecting to OAuth', { platform, authUrl: authUrl.substring(0, 100) });

  const response = NextResponse.redirect(authUrl);
  resCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));

  return response;
}
