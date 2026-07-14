import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';
import { verifyAndConsumeOAuthState, parseOAuthCookie, parseAndConsumePKCECookie } from '@/lib/auth/oauth-state';

const platformRepository = new SupabasePlatformRepository();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    logger.warn('OAuth error', { error, errorDescription, state });
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=oauth_error&description=${encodeURIComponent(errorDescription || '')}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=missing_code', request.url)
    );
  }

  // Get state from cookie (not URL parameter for security)
  const cookieState = parseOAuthCookie(request.headers.get('cookie'));
  const effectiveState = cookieState || state;

  if (!effectiveState) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=missing_state', request.url)
    );
  }

  // Verify and consume state from Redis
  const verified = await verifyAndConsumeOAuthState(effectiveState);
  if (!verified) {
    logger.warn('OAuth state verification failed', { state: effectiveState.slice(0, 8) + '...' });
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=invalid_state', request.url)
    );
  }

  const { workspaceId, platform } = verified;
  const platformType = platform as 'linkedin' | 'x' | 'threads';

  const adapter = getPlatformAdapter(platformType);
  if (!adapter) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=unsupported_platform&platform=${platform}`, request.url)
    );
  }

  // Get PKCE verifier from cookie for X/Twitter
  let codeVerifier: string | undefined;
  if (platformType === 'x') {
    const pkceCookie = parseAndConsumePKCECookie(request.headers.get('cookie'), effectiveState);
    if (pkceCookie) {
      codeVerifier = pkceCookie;
    } else {
      logger.warn('Missing PKCE verifier for X OAuth', { state: effectiveState.slice(0, 8) + '...' });
    }
  }

  try {
    // Exchange code for token
    const tokenResponse = platformType === 'x' && codeVerifier
      ? await adapter.exchangeCodeForToken(code, codeVerifier)
      : await adapter.exchangeCodeForToken(code);

    // Get user profile
    const profile = await adapter.getUserProfile(tokenResponse.accessToken);

    // Encrypt tokens
    const accessTokenEncrypted = await encryptToken(tokenResponse.accessToken);
    const refreshTokenEncrypted = tokenResponse.refreshToken
      ? await encryptToken(tokenResponse.refreshToken)
      : undefined;

    const expiresAt = tokenResponse.expiresIn
      ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
      : undefined;

    // Save or update platform connection
    await platformRepository.create({
      workspaceId,
      platform: platformType,
      platformUserId: profile.platformUserId,
      username: profile.username,
      accessToken: accessTokenEncrypted,
      refreshToken: refreshTokenEncrypted || '',
      expiresAt,
      scopes: tokenResponse.scope ? tokenResponse.scope.split(' ') : adapter.authConfig.scopes,
    });

    logger.info('Platform connected successfully', { platform: platformType, workspaceId, platformUserId: profile.platformUserId });

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      new URL(`/dashboard/settings?connected=${platformType}`, request.url)
    );
    response.headers.append('Set-Cookie', 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    if (platformType === 'x') {
      response.headers.append('Set-Cookie', `pkce_${effectiveState}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
    }

    return response;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('OAuth callback failed', { error: err, platform: platformType, state: effectiveState });
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=callback_failed&platform=${platformType}`, request.url)
    );
  }
}