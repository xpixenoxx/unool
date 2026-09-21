import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { generateOAuthState, storeOAuthState, createOAuthCookie, RedisConfigError } from '@/lib/auth/oauth-state';
import { getAuthContext } from '@/lib/auth/context';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function resolveWorkspaceId(request: NextRequest): Promise<string | null> {
  // Method 1: getAuthContext (has dev bypass + workspace resolution)
  try {
    const authCtx = await getAuthContext();
    if (authCtx) {
      logger.info('Platform connect: resolved workspace via getAuthContext', { workspaceId: authCtx.workspaceId });
      return authCtx.workspaceId;
    }
  } catch (e) {
    logger.warn('Platform connect: getAuthContext failed', { error: e instanceof Error ? e.message : String(e) });
  }

  // Method 2: getCurrentAuth (request-based, checks headers + bearer + SSR cookie)
  try {
    const auth = await getCurrentAuth(request);
    if (auth) {
      logger.info('Platform connect: resolved workspace via getCurrentAuth', { workspaceId: auth.workspaceId });
      return auth.workspaceId;
    }
  } catch (e) {
    logger.warn('Platform connect: getCurrentAuth failed', { error: e instanceof Error ? e.message : String(e) });
  }

  // Method 3: Direct Supabase SSR cookie read (most robust fallback)
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    logger.info('Platform connect: cookie debug', { 
      cookieCount: String(allCookies.length),
      cookieNames: allCookies.map(c => c.name).join(',')
    });

    const supabaseSSR = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return allCookies; },
        setAll() { /* read-only */ },
      },
    });

    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    if (error) {
      logger.warn('Platform connect: SSR getUser error', { error: error.message });
    }
    if (user) {
      logger.info('Platform connect: found user via SSR cookies', { userId: user.id });
      
      // Look up workspace
      const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      const { data: member } = await adminClient
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      const workspaceId = member?.workspace_id || user.id;
      logger.info('Platform connect: resolved workspace via direct SSR', { workspaceId });
      return workspaceId;
    }
  } catch (e) {
    logger.warn('Platform connect: direct SSR cookie read failed', { error: e instanceof Error ? e.message : String(e) });
  }

  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');
  let workspaceId = searchParams.get('workspaceId');
  const returnUrl = searchParams.get('returnUrl') || undefined;
  const errorRedirect = returnUrl || '/onboarding/connect/add';

  if (!workspaceId) {
    workspaceId = await resolveWorkspaceId(request);
  }

  if (!platform || !workspaceId) {
    logger.warn('Platform connect: missing params after all auth methods', { 
      platform, 
      hasWorkspace: String(!!workspaceId) 
    });
    return NextResponse.redirect(
      new URL(`${errorRedirect}?error=missing_params`, request.url)
    );
  }

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    logger.warn('Platform connect: unsupported platform', { platform });
    return NextResponse.redirect(
      new URL(`${errorRedirect}?error=unsupported_platform&platform=${platform}`, request.url)
    );
  }

  // Generate cryptographically secure state
  const state = generateOAuthState(workspaceId, platform);

  // Store in Redis with TTL
  try {
    await storeOAuthState(state, workspaceId, platform, returnUrl);
  } catch (error) {
    if (error instanceof RedisConfigError || (error as Error).name === 'RedisConfigError') {
      logger.error('Platform connect: Redis unconfigured');
      return NextResponse.redirect(
        new URL(`${errorRedirect}?error=redis_unconfigured`, request.url)
      );
    }
    throw error;
  }

  // Handle PKCE for X/Twitter - getAuthUrl can return string or {url, pkceCookie}
  const authUrlResult = adapter.getAuthUrl(state);

  let authUrl: string;
  const resCookies: string[] = [createOAuthCookie(state)];

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