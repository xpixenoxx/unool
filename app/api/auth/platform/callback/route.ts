import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';

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

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=missing_code_or_state', request.url)
    );
  }

  // Parse state: oauth_{workspaceId}_{platform}
  const stateParts = state.split('_');
  if (stateParts.length < 3 || stateParts[0] !== 'oauth') {
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=invalid_state_format', request.url)
    );
  }

  const workspaceId = stateParts[1];
  const platform = stateParts[2] as 'linkedin' | 'x' | 'threads';

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=unsupported_platform&platform=${platform}`, request.url)
    );
  }

  try {
    // Exchange code for token
    const tokenResponse = await adapter.exchangeCodeForToken(code);

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
      platform,
      platformUserId: profile.platformUserId,
      username: profile.username,
      accessToken: accessTokenEncrypted,
      refreshToken: refreshTokenEncrypted || '',
      expiresAt,
      scopes: tokenResponse.scope ? tokenResponse.scope.split(' ') : adapter.authConfig.scopes,
    });

    logger.info('Platform connected successfully', { platform, workspaceId, platformUserId: profile.platformUserId });

    return NextResponse.redirect(
      new URL(`/dashboard/settings?connected=${platform}`, request.url)
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('OAuth callback failed', { error: err, platform, state });
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=callback_failed&platform=${platform}`, request.url)
    );
  }
}