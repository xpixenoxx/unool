import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { generateOAuthState, storeOAuthState, createOAuthCookie, RedisConfigError } from '@/lib/auth/oauth-state';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');
  const workspaceId = searchParams.get('workspaceId');

  if (!platform || !workspaceId) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=missing_params', request.url)
    );
  }

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=unsupported_platform&platform=${platform}`, request.url)
    );
  }

  // Generate cryptographically secure state
  const state = generateOAuthState(workspaceId, platform);

  // Store in Redis with TTL
  try {
    await storeOAuthState(state, workspaceId, platform);
  } catch (error) {
    if (error instanceof RedisConfigError || (error as Error).name === 'RedisConfigError') {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=redis_unconfigured', request.url)
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

  const response = NextResponse.redirect(authUrl);
  cookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));

  return response;
}