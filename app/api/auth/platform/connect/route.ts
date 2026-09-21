import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { generateOAuthState, storeOAuthState, createOAuthCookie, RedisConfigError } from '@/lib/auth/oauth-state';
import { getAuthContext } from '@/lib/auth/context';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');
  let workspaceId = searchParams.get('workspaceId');
  const returnUrl = searchParams.get('returnUrl') || undefined;
  const errorRedirect = returnUrl || '/onboarding/connect/add';

  if (!workspaceId) {
    // Try getAuthContext first (has dev bypass + proper workspace resolution)
    try {
      const authCtx = await getAuthContext();
      if (authCtx) {
        workspaceId = authCtx.workspaceId;
      }
    } catch (e) {
      logger.warn('getAuthContext failed, falling back to getCurrentAuth', { error: e instanceof Error ? e.message : String(e) });
    }

    // Fallback to request-based auth
    if (!workspaceId) {
      const auth = await getCurrentAuth(request);
      if (auth) {
        workspaceId = auth.workspaceId;
      }
    }
  }

  if (!platform || !workspaceId) {
    logger.warn('Platform connect: missing params', { platform, hasWorkspace: String(!!workspaceId) });
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
  const cookies: string[] = [createOAuthCookie(state)];

  if (typeof authUrlResult === 'string') {
    authUrl = authUrlResult;
  } else {
    // Promise<{ url: string; pkceCookie?: string }>
    const result = await authUrlResult;
    authUrl = result.url;
    if (result.pkceCookie) {
      cookies.push(result.pkceCookie);
    }
  }

  logger.info('Platform connect: redirecting to OAuth', { platform, authUrl: authUrl.substring(0, 80) });

  const response = NextResponse.redirect(authUrl);
  cookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));

  return response;
}