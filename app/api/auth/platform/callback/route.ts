import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';
import { verifyAndConsumeOAuthState, parseOAuthCookie, parseAndConsumePKCECookie } from '@/lib/auth/oauth-state';
import { SUPPORTED_PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/repositories/interfaces/IPlatformRepository';

const platformRepository = new SupabasePlatformRepository();

export const dynamic = 'force-dynamic';

/**
 * Build a redirect URL that respects the returnUrl from OAuth state.
 * Falls back to /dashboard/settings if no returnUrl is available.
 */
function buildRedirectUrl(request: NextRequest, returnUrl: string | undefined, params: Record<string, string>): string {
  const fallback = returnUrl || '/dashboard/settings';
  const url = new URL(fallback, request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // --- Early error: OAuth provider returned an error ---
  if (error) {
    logger.warn('OAuth provider error', { error, errorDescription, state });
    // Try to extract returnUrl from cookie state even for provider errors
    const cookieHeader = request.headers.get('cookie');
    const cookieState = parseOAuthCookie(cookieHeader);
    const returnUrl = cookieState?.data?.returnUrl;
    const redirectUrl = buildRedirectUrl(request, returnUrl, {
      error: 'oauth_error',
      description: errorDescription || '',
    });
    const response = NextResponse.redirect(redirectUrl);
    response.headers.append('Set-Cookie', 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    return response;
  }

  if (!code) {
    logger.warn('OAuth callback missing code parameter');
    const cookieHeader = request.headers.get('cookie');
    const cookieState = parseOAuthCookie(cookieHeader);
    const returnUrl = cookieState?.data?.returnUrl;
    return NextResponse.redirect(
      buildRedirectUrl(request, returnUrl, { error: 'missing_code' })
    );
  }

  // Get state from cookie (not URL parameter for security)
  const cookieHeader = request.headers.get('cookie');
  const cookieState = parseOAuthCookie(cookieHeader);
  const effectiveState = cookieState?.state || state;

  if (!effectiveState) {
    logger.warn('OAuth callback missing state', { hasCode: !!code, hasCookieState: !!cookieState });
    return NextResponse.redirect(
      buildRedirectUrl(request, cookieState?.data?.returnUrl, { error: 'missing_state' })
    );
  }

  // Verify and consume state from Redis or Cookie fallback
  const verified = await verifyAndConsumeOAuthState(effectiveState, cookieHeader);
  if (!verified) {
    logger.warn('OAuth state verification failed', { state: effectiveState.slice(0, 8) + '...' });
    return NextResponse.redirect(
      buildRedirectUrl(request, cookieState?.data?.returnUrl, { error: 'invalid_state' })
    );
  }

  const { workspaceId, userId, platform: platformFromState, returnUrl } = verified;

  // Validate platform is supported
  if (!SUPPORTED_PLATFORMS.includes(platformFromState as (typeof SUPPORTED_PLATFORMS)[number])) {
    logger.warn('Unsupported platform in OAuth callback', { platform: platformFromState });
    return NextResponse.redirect(
      buildRedirectUrl(request, returnUrl, { error: 'unsupported_platform', platform: platformFromState })
    );
  }

  const platform = platformFromState as Platform;

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    return NextResponse.redirect(
      buildRedirectUrl(request, returnUrl, { error: 'unsupported_platform', platform })
    );
  }

  // Get PKCE verifier from cookie for X/Twitter
  let codeVerifier: string | undefined;
  if (platform === 'x') {
    const pkceCookie = parseAndConsumePKCECookie(request.headers.get('cookie'), effectiveState);
    if (pkceCookie) {
      codeVerifier = pkceCookie;
    } else {
      logger.warn('Missing PKCE verifier for X OAuth', { state: effectiveState.slice(0, 8) + '...' });
    }
  }

  try {
    // Exchange code for token
    logger.info('Exchanging OAuth code for token', { platform, workspaceId, userId });
    const tokenResponse = platform === 'x' && codeVerifier
      ? await adapter.exchangeCodeForToken(code, codeVerifier)
      : await adapter.exchangeCodeForToken(code);

    logger.info('Token exchange successful', {
      platform,
      hasAccessToken: !!tokenResponse.accessToken,
      hasRefreshToken: !!tokenResponse.refreshToken,
      expiresIn: tokenResponse.expiresIn,
    });

    // Get user profile
    const profile = await adapter.getUserProfile(tokenResponse.accessToken);
    logger.info('User profile fetched', {
      platform,
      platformUserId: profile.platformUserId,
      username: profile.username,
    });

    // Encrypt tokens
    const accessTokenEncrypted = await encryptToken(tokenResponse.accessToken);
    const refreshTokenEncrypted = tokenResponse.refreshToken
      ? await encryptToken(tokenResponse.refreshToken)
      : undefined;

    const expiresAt = tokenResponse.expiresIn
      ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
      : undefined;

    // Safety check: Resolve the real workspaceId from the database.
    // The OAuth state might have passed a userId instead of workspaceId,
    // or an incorrect/stale workspaceId. We must verify and correct it.
    let finalWorkspaceId = workspaceId;
    const { createClient } = await import('@supabase/supabase-js');
    const { config } = await import('@/lib/config/schema');
    const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
    
    // Check 1: Does the workspaceId exist as an actual workspace?
    const { data: existingWorkspace } = await adminSupabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .single();
    
    if (!existingWorkspace) {
      // workspaceId is NOT a valid workspace — it might be a userId.
      // Look up the user's actual workspace from workspace_members.
      const { data: member } = await adminSupabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', workspaceId)
        .single();
      
      if (member?.workspace_id) {
        finalWorkspaceId = member.workspace_id;
        logger.info('Resolved workspaceId from userId (workspaceId was not a valid workspace)', {
          userId: workspaceId,
          workspaceId: finalWorkspaceId,
        });
      } else {
        // Last resort: check if there's a workspace owned by this user
        const { data: ownedWorkspace } = await adminSupabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', workspaceId)
          .single();
        
        if (ownedWorkspace?.id) {
          finalWorkspaceId = ownedWorkspace.id;
          logger.info('Resolved workspaceId from owned workspace', {
            userId: workspaceId,
            workspaceId: finalWorkspaceId,
          });
        } else {
          logger.warn('Could not resolve valid workspaceId — using original value', {
            workspaceId,
          });
        }
      }
    } else {
      logger.debug('WorkspaceId verified as existing workspace', { workspaceId: finalWorkspaceId });
    }

    // Save or update platform connection
    const savedConnection = await platformRepository.create({
      workspaceId: finalWorkspaceId,
      userId,
      platform,
      platformUserId: profile.platformUserId,
      username: profile.username,
      accessToken: accessTokenEncrypted,
      refreshToken: refreshTokenEncrypted || '',
      expiresAt,
      scopes: tokenResponse.scope ? tokenResponse.scope.split(' ') : adapter.authConfig.scopes,
    });

    logger.info('Platform connected successfully', {
      platform,
      workspaceId: finalWorkspaceId,
      platformUserId: profile.platformUserId,
      connectionId: savedConnection.id,
    });

    // Build success redirect URL
    const successUrl = buildRedirectUrl(request, returnUrl, { connected: platform });
    
    const response = NextResponse.redirect(successUrl);
    response.headers.append('Set-Cookie', 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    if (platform === 'x') {
      response.headers.append('Set-Cookie', `pkce_${effectiveState}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
    }

    return response;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('OAuth callback failed', {
      error: err,
      platform,
      workspaceId,
      state: effectiveState.slice(0, 8) + '...',
    });
    const errorMsg = encodeURIComponent(err.message?.slice(0, 200) || 'unknown');
    return NextResponse.redirect(
      buildRedirectUrl(request, returnUrl, {
        error: 'callback_failed',
        platform,
        detail: errorMsg,
      })
    );
  }
}