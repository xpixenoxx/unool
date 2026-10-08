import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { generateOAuthState, storeOAuthState, createOAuthCookie } from '@/lib/auth/oauth-state';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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

    const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
    const { data: member } = await adminClient
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
  const errorRedirect = returnUrl || '/dashboard';

  // workspaceId and userId are passed by the frontend — trust them directly
  // to avoid redundant auth round-trips.
  let workspaceId = searchParams.get('workspaceId');
  let userId = searchParams.get('userId');

  if (!workspaceId || !userId) {
    const resolved = await resolveAuth(request);
    workspaceId = workspaceId || resolved.workspaceId;
    userId = userId || resolved.userId;
  }

  if (!platform || !workspaceId || !userId) {
    logger.warn('Platform connect: missing params', { platform, hasWorkspace: !!workspaceId, hasUser: !!userId });
    return NextResponse.redirect(new URL(`${errorRedirect}?error=missing_params`, request.url));
  }

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    logger.warn('Platform connect: unsupported platform', { platform });
    return NextResponse.redirect(new URL(`${errorRedirect}?error=unsupported_platform&platform=${platform}`, request.url));
  }

  // Platforms with custom connect flows (e.g. Bluesky uses app-password, not OAuth).
  const testAuthUrl = adapter.getAuthUrl('test');
  const resolvedTestUrl = typeof testAuthUrl === 'string' ? testAuthUrl : '';
  if (!resolvedTestUrl) {
    logger.info('Platform connect: custom flow platform, redirecting to dashboard', { platform });
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('connect', platform);
    return NextResponse.redirect(dashboardUrl);
  }

  // Generate cryptographically secure state
  const state = generateOAuthState(workspaceId, platform);

  // Store in Redis + build cookie in parallel
  const [, authUrlResult] = await Promise.all([
    storeOAuthState(state, workspaceId, userId, platform, returnUrl),
    Promise.resolve(adapter.getAuthUrl(state)),
  ]);

  let authUrl: string;
  const resCookies: string[] = [createOAuthCookie(state, workspaceId, userId, platform, returnUrl)];

  if (typeof authUrlResult === 'string') {
    authUrl = authUrlResult;
  } else {
    const result = await authUrlResult;
    authUrl = result.url;
    if (result.pkceCookie) {
      resCookies.push(result.pkceCookie);
    }
  }

  logger.info('Platform connect: redirecting to OAuth', { platform, authUrl: authUrl.substring(0, 100) });

  const response = NextResponse.redirect(authUrl);
  resCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));

  return response;
}