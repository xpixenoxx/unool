import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { generateOAuthState, storeOAuthState, createOAuthCookie } from '@/lib/auth/oauth-state';
import { createServerClient } from '@supabase/ssr';
import { config } from '@/lib/config/schema';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { getPlanContext } from '@/lib/middleware/plan-enforcement-middleware';

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

/**
 * Resolve workspaceId + userId using the fastest available method.
 * Priority:
 *  1. x-user-id header injected by middleware (fastest — no extra DB call)
 *  2. Cookie-based SSR session (one Supabase call + one DB call, run in parallel)
 */
async function resolveAuth(request: NextRequest): Promise<{ userId: string | null; workspaceId: string | null }> {
  // Fast path: middleware injects x-user-id
  const headerUserId = request.headers.get('x-user-id');
  const headerWorkspaceId = request.headers.get('x-workspace-id');

  if (headerUserId && headerWorkspaceId) {
    return { userId: headerUserId, workspaceId: headerWorkspaceId };
  }

  // Slower path: resolve from cookies
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const supabaseSSR = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return allCookies; },
        setAll() { /* read-only */ },
      },
    });

    const { data: { user } } = await supabaseSSR.auth.getUser();
    if (!user) return { userId: null, workspaceId: null };

    // If middleware gave us just the userId, use it and look up workspace
    const uid = headerUserId || user.id;

    
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', uid)
      .single();

    return {
      userId: uid,
      workspaceId: member?.workspace_id || uid,
    };
  } catch {
    return { userId: null, workspaceId: null };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');
  const returnUrl = searchParams.get('returnUrl') || undefined;
  const addAccount = searchParams.get('addAccount') === 'true';
  const reconnectConnectionId = searchParams.get('reconnectConnectionId');
  const errorRedirect = returnUrl || '/dashboard';

  // Always resolve the authenticated user from session/middleware — never trust userId query param
  const resolved = await resolveAuth(request);
  const userId = resolved.userId;

  if (!userId) {
    logger.warn('Platform connect: unauthenticated request', { platform });
    return NextResponse.redirect(new URL(`${errorRedirect}?error=unauthorized`, request.url));
  }

  const requestedWorkspaceId = searchParams.get('workspaceId');
  let workspaceId = resolved.workspaceId;

  if (requestedWorkspaceId) {
    const hasAccess = await verifyWorkspaceAccess(userId, requestedWorkspaceId);
    if (!hasAccess) {
      logger.warn('Platform connect: workspace access denied', { userId, requestedWorkspaceId, platform });
      return NextResponse.redirect(new URL(`${errorRedirect}?error=forbidden_workspace`, request.url));
    }
    workspaceId = requestedWorkspaceId;
  }

  if (!platform || !workspaceId) {
    logger.warn('Platform connect: missing params', { platform, hasWorkspace: !!workspaceId, hasUser: !!userId });
    return NextResponse.redirect(new URL(`${errorRedirect}?error=missing_params`, request.url));
  }

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    logger.warn('Platform connect: unsupported platform', { platform });
    return NextResponse.redirect(new URL(`${errorRedirect}?error=unsupported_platform&platform=${platform}`, request.url));
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
          new URL(`${errorRedirect}?error=channel_limit_exceeded&limit=${channelLimit}&plan=${planCtx.plan}`, request.url)
        );
      }
    }
  } catch (limitErr) {
    logger.warn('Platform connect: failed to check channel limit', { error: limitErr, workspaceId });
  }

  // Ensure adapter has credentials configured before redirecting to provider
  if (!adapter.authConfig.clientId) {
    logger.error('Platform connect: missing client ID credentials', { platform });
    const redirectUrl = new URL(errorRedirect, request.url);
    redirectUrl.searchParams.set('error', 'missing_credentials');
    redirectUrl.searchParams.set('platform', platform);
    redirectUrl.searchParams.set('detail', `missing_${platform}_client_id`);
    return NextResponse.redirect(redirectUrl);
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
