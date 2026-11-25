import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdapter } from '@/lib/platforms';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';
import { verifyAndConsumeOAuthState, parseOAuthCookie, parseAndConsumePKCECookie } from '@/lib/auth/oauth-state';
import { SUPPORTED_PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/repositories/interfaces/IPlatformRepository';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { invalidateOverviewCache } from '@/lib/cache/overviewCache';
import { invalidateConnectionsCache } from '@/lib/cache/connectionsCache';
import { getPlanContext } from '@/lib/middleware/plan-enforcement-middleware';
import { buildSafeRedirectUrl } from '@/lib/auth/redirect';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';

const platformRepository = new SupabasePlatformRepository();

export const dynamic = 'force-dynamic';

/**
 * Build a safe relative redirect URL that respects the returnUrl from OAuth state.
 * Falls back to /dashboard if no valid relative returnUrl is available.
 */
function buildRedirectUrl(request: NextRequest, returnUrl: string | undefined, params: Record<string, string>): string {
  return buildSafeRedirectUrl(request.url, returnUrl, params, '/dashboard');
}

function clearOAuthCookies(response: NextResponse, effectiveState?: string | null, platform?: string): NextResponse {
  response.headers.append('Set-Cookie', 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  if (effectiveState && (platform === 'x' || platform === 'kick' || !platform)) {
    response.headers.append(
      'Set-Cookie',
      `pkce_${effectiveState}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
    );
  }
  return response;
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
    return clearOAuthCookies(
      NextResponse.redirect(buildRedirectUrl(request, returnUrl, { error: 'missing_code' })),
      cookieState?.state
    );
  }

  // Get state from cookie and/or URL parameter; if both are present they must match (CSRF defense)
  const cookieHeader = request.headers.get('cookie');
  const cookieState = parseOAuthCookie(cookieHeader);
  if (state && cookieState?.state && state !== cookieState.state) {
    logger.warn('OAuth callback state mismatch between URL and signed cookie', {
      urlState: state.slice(0, 8) + '...',
      cookieState: cookieState.state.slice(0, 8) + '...',
    });
    return clearOAuthCookies(
      NextResponse.redirect(
        buildRedirectUrl(request, cookieState?.data?.returnUrl, { error: 'invalid_state' })
      ),
      state
    );
  }
  const effectiveState = state || cookieState?.state;

  if (!effectiveState) {
    logger.warn('OAuth callback missing state', { hasCode: !!code, hasCookieState: !!cookieState });
    return clearOAuthCookies(
      NextResponse.redirect(
        buildRedirectUrl(request, cookieState?.data?.returnUrl, { error: 'missing_state' })
      )
    );
  }

  // Verify and consume state from Redis or Cookie fallback
  const verified = await verifyAndConsumeOAuthState(effectiveState, cookieHeader);
  if (!verified) {
    logger.warn('OAuth state verification failed', { state: effectiveState.slice(0, 8) + '...' });
    return clearOAuthCookies(
      NextResponse.redirect(
        buildRedirectUrl(request, cookieState?.data?.returnUrl, { error: 'invalid_state' })
      ),
      effectiveState
    );
  }

  const {
    workspaceId,
    userId,
    platform: platformFromState,
    returnUrl,
    redirectUri: storedRedirectUri,
    codeVerifier: stateCodeVerifier,
    reconnectConnectionId,
  } = verified;

  // Validate platform is supported
  if (!SUPPORTED_PLATFORMS.includes(platformFromState as (typeof SUPPORTED_PLATFORMS)[number])) {
    logger.warn('Unsupported platform in OAuth callback', { platform: platformFromState });
    return clearOAuthCookies(
      NextResponse.redirect(
        buildRedirectUrl(request, returnUrl, { error: 'unsupported_platform', platform: platformFromState })
      ),
      effectiveState
    );
  }

  const platform = platformFromState as Platform;

  const adapter = getPlatformAdapter(platform);
  if (!adapter) {
    return clearOAuthCookies(
      NextResponse.redirect(
        buildRedirectUrl(request, returnUrl, { error: 'unsupported_platform', platform })
      ),
      effectiveState,
      platform
    );
  }

  // Get PKCE verifier from OAuth state (Redis/cookie) or PKCE cookie for X/Twitter and Kick
  let codeVerifier: string | undefined;
  if (platform === 'x' || platform === 'kick') {
    codeVerifier =
      stateCodeVerifier ||
      parseAndConsumePKCECookie(request.headers.get('cookie'), effectiveState) ||
      undefined;
    if (!codeVerifier) {
      logger.warn(`Missing PKCE verifier for ${platform} OAuth`, { state: effectiveState.slice(0, 8) + '...' });
      return clearOAuthCookies(
        NextResponse.redirect(
          buildRedirectUrl(request, returnUrl, { error: 'invalid_state', platform })
        ),
        effectiveState,
        platform
      );
    }
  }

  try {
    // Exchange code for token using the exact storedRedirectUri across ALL OAuth platforms
    logger.info('Exchanging OAuth code for token', { platform, workspaceId, userId });
    const tokenResponse =
      platform === 'x' || platform === 'kick'
        ? await adapter.exchangeCodeForToken(code, codeVerifier, storedRedirectUri)
        : platform === 'facebook' && storedRedirectUri
          ? await adapter.exchangeCodeForToken(code, storedRedirectUri)
          : await adapter.exchangeCodeForToken(code, undefined, storedRedirectUri);

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

    // Run workspace existence check + active member lookup in PARALLEL (saves one DB round-trip)
    const [workspaceResult, memberResult] = await Promise.all([
      supabaseAdmin.from('workspaces').select('id').eq('id', workspaceId).limit(1).maybeSingle(),
      supabaseAdmin
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', workspaceId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (workspaceResult.data) {
      // workspaceId is already a valid workspace — nothing to do
      logger.debug('WorkspaceId verified as existing workspace', { workspaceId: finalWorkspaceId });
    } else if (memberResult.data?.workspace_id) {
      // workspaceId was actually the userId — resolved via active membership
      finalWorkspaceId = memberResult.data.workspace_id;
      logger.info('Resolved workspaceId from userId (workspaceId was not a valid workspace)', {
        userId: workspaceId,
        workspaceId: finalWorkspaceId,
      });
    } else {
      // Last resort: check if there's a workspace owned by this user
      const { data: ownedWorkspace } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('owner_id', workspaceId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (ownedWorkspace?.id) {
        finalWorkspaceId = ownedWorkspace.id;
        logger.info('Resolved workspaceId from owned workspace', {
          userId: workspaceId,
          workspaceId: finalWorkspaceId,
        });
      } else {
        logger.warn('Could not resolve valid workspaceId — rejecting OAuth callback', {
          workspaceId,
          userId,
        });
        return NextResponse.redirect(
          buildRedirectUrl(request, returnUrl, { error: 'forbidden_workspace', platform })
        );
      }
    }

    const roleCheck = await requireWorkspaceRole(userId, finalWorkspaceId, ['owner', 'admin', 'editor']);
    if (!roleCheck.allowed) {
      logger.warn('OAuth callback blocked: insufficient workspace role', {
        userId,
        workspaceId: finalWorkspaceId,
        platform,
        reason: roleCheck.reason,
        role: roleCheck.role,
      });
      return NextResponse.redirect(
        buildRedirectUrl(request, returnUrl, { error: 'forbidden_workspace', platform })
      );
    }


    // Preserve existing Kick stream settings if reconnecting the same Kick account
    let finalAccessTokenToEncrypt = tokenResponse.accessToken;
    if (platform === 'kick') {
      try {
        const existingConn = await platformRepository.findByWorkspacePlatformAndUser(
          finalWorkspaceId,
          'kick',
          profile.platformUserId
        );
        if (existingConn?.accessTokenEncrypted) {
          const { decryptToken } = await import('@/lib/crypto/encryption');
          const decrypted = await decryptToken(existingConn.accessTokenEncrypted);
          try {
            const parsed = JSON.parse(decrypted);
            if (parsed && typeof parsed === 'object' && (parsed.streamUrl || parsed.streamKey)) {
              finalAccessTokenToEncrypt = JSON.stringify({
                accessToken: tokenResponse.accessToken,
                streamUrl: parsed.streamUrl,
                streamKey: parsed.streamKey,
              });
              logger.info('Preserved Kick stream settings during OAuth reconnect', { workspaceId: finalWorkspaceId });
            }
          } catch {
            // Not JSON payload
          }
        }
      } catch (preserveErr) {
        logger.warn('Could not check existing Kick stream settings on reconnect', { preserveErr });
      }
    }

    const finalAccessTokenEncrypted = await encryptToken(finalAccessTokenToEncrypt);

    const baseScopes = tokenResponse.scope ? tokenResponse.scope.split(' ') : adapter.authConfig.scopes;
    const finalScopes = [...baseScopes];
    const connectionMetadata: Record<string, unknown> = {};

    if (platform === 'instagram') {
      connectionMetadata.auth_method = 'instagram_login';
      if (profile.instagramBusinessAccountId) {
        connectionMetadata.instagram_business_account_id = profile.instagramBusinessAccountId;
        const aliasTag = `ig_business_id:${profile.instagramBusinessAccountId}`;
        if (!finalScopes.includes(aliasTag)) {
          finalScopes.push(aliasTag);
        }
      }
      if (profile.accountType) {
        connectionMetadata.account_type = profile.accountType;
      }
    }

    let facebookPages: Array<{ id: string; name: string; accessToken: string }> = [];
    if (platform === 'facebook') {
      try {
        const { facebookAdapter } = await import('@/lib/platforms/FacebookAdapter');
        facebookPages = await facebookAdapter.getUserPages(tokenResponse.accessToken);
        if (facebookPages.length > 0) {
          connectionMetadata.page_id = facebookPages[0].id;
          connectionMetadata.page_name = facebookPages[0].name;
          connectionMetadata.page_ids = facebookPages.map((p) => p.id);
          for (const page of facebookPages) {
            const pageTag = `fb_page_id:${page.id}`;
            if (!finalScopes.includes(pageTag)) {
              finalScopes.push(pageTag);
            }
          }
        }
      } catch (pageErr) {
        logger.warn('Failed to fetch Facebook pages during OAuth callback', {
          error: pageErr instanceof Error ? pageErr.message : String(pageErr),
          platformUserId: profile.platformUserId,
        });
      }
    }

    // Enforce plan channel limit before creating a new account connection (allow reconnecting an existing account)
    const planCtx = await getPlanContext(userId, finalWorkspaceId);
    const channelLimit = planCtx?.limits?.channels;
    let targetReconnectRow: Awaited<ReturnType<typeof platformRepository.findByWorkspaceId>>[number] | undefined;
    if (reconnectConnectionId) {
      const existingConnections = await platformRepository.findByWorkspaceId(finalWorkspaceId);
      targetReconnectRow = existingConnections.find(
        (c) => c.id === reconnectConnectionId && c.platform === platform
      );
      if (planCtx && typeof channelLimit === 'number' && channelLimit > 0 && !targetReconnectRow) {
        const activeConnections = existingConnections.filter((c) => c.status === 'connected');
        const isReconnectingSameAccount = activeConnections.some(
          (c) => c.platform === platform && c.platformUserId === profile.platformUserId
        );
        if (!isReconnectingSameAccount && activeConnections.length >= channelLimit) {
          logger.warn('OAuth callback blocked: channel limit reached for plan', {
            workspaceId: finalWorkspaceId,
            plan: planCtx.plan,
            connectedCount: activeConnections.length,
            channelLimit,
            platform,
          });
          return clearOAuthCookies(
            NextResponse.redirect(
              buildRedirectUrl(request, returnUrl, {
                error: 'channel_limit_exceeded',
                limit: String(channelLimit),
                plan: planCtx.plan,
              })
            ),
            effectiveState,
            platform
          );
        }
      }
    } else if (planCtx && typeof channelLimit === 'number' && channelLimit > 0) {
      const existingConnections = await platformRepository.findByWorkspaceId(finalWorkspaceId);
      const activeConnections = existingConnections.filter((c) => c.status === 'connected');
      const isReconnectingSameAccount = activeConnections.some(
        (c) => c.platform === platform && c.platformUserId === profile.platformUserId
      );
      if (!isReconnectingSameAccount && activeConnections.length >= channelLimit) {
        logger.warn('OAuth callback blocked: channel limit reached for plan', {
          workspaceId: finalWorkspaceId,
          plan: planCtx.plan,
          connectedCount: activeConnections.length,
          channelLimit,
          platform,
        });
        return clearOAuthCookies(
          NextResponse.redirect(
            buildRedirectUrl(request, returnUrl, {
              error: 'channel_limit_exceeded',
              limit: String(channelLimit),
              plan: planCtx.plan,
            })
          ),
          effectiveState,
          platform
        );
      }
    }

    // Save or update platform connection
    const savedConnection = await platformRepository.create({
      workspaceId: finalWorkspaceId,
      userId,
      platform,
      platformUserId: profile.platformUserId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      accessToken: finalAccessTokenEncrypted,
      refreshToken: refreshTokenEncrypted || '',
      expiresAt,
      scopes: finalScopes,
      metadata: Object.keys(connectionMetadata).length > 0 ? connectionMetadata : undefined,
    });

    // If reconnecting a specific broken/expired row and the provider returned a different user ID,
    // revoke the old broken row so no ghost broken pill lingers alongside the fresh connection.
    if (
      targetReconnectRow &&
      targetReconnectRow.id !== savedConnection.id &&
      targetReconnectRow.status !== 'connected'
    ) {
      try {
        await platformRepository.disconnect(targetReconnectRow.id);
      } catch {
        // Non-fatal cleanup
      }
    }

    logger.info('Platform connected successfully', {
      platform,
      workspaceId: finalWorkspaceId,
      platformUserId: profile.platformUserId,
      connectionId: savedConnection.id,
    });

    // For Instagram: subscribe the user's account to our webhook fields
    // Make webhook subscription synchronous — automation won't work without it
    if (platform === 'instagram') {
      try {
        const { InstagramCommentAutomation } = await import('@/lib/services/InstagramCommentAutomation');
        const subscribed = await InstagramCommentAutomation.subscribeAccountToWebhook(
          tokenResponse.accessToken,
          profile.platformUserId
        );
        if (!subscribed) {
          logger.warn('Instagram webhook subscription returned false — automation may not work', {
            platformUserId: profile.platformUserId,
          });
        } else {
          logger.info('Instagram webhook subscription successful', { platformUserId: profile.platformUserId });
        }
      } catch (webhookError) {
        // Non-fatal: account is connected, but automation features need manual re-enable
        logger.error('Failed to subscribe Instagram account to webhook — user should reconnect to enable automation', {
          error: webhookError instanceof Error ? webhookError : new Error(String(webhookError)),
          platformUserId: profile.platformUserId,
        });
        // Continue — don't block the OAuth callback for a non-critical feature
      }
    }

    // For Facebook: subscribe the connected page(s) to our webhook fields (feed + messages)
    // This is CRITICAL — without it Meta will not send any webhook events to the app
    if (platform === 'facebook' && facebookPages.length > 0) {
      try {
        const { facebookAdapter } = await import('@/lib/platforms/FacebookAdapter');
        for (const page of facebookPages) {
          try {
            // page.accessToken is already the page-scoped access token
            await facebookAdapter.subscribePageWebhook(page.accessToken, page.id);
            logger.info('Facebook page webhook subscription successful', { pageId: page.id, pageName: page.name });
          } catch (pageErr) {
            logger.warn('Failed to subscribe Facebook page to webhook', {
              pageId: page.id,
              error: pageErr instanceof Error ? pageErr.message : String(pageErr),
            });
          }
        }
        // Also backfill facebook_automation_config.page_id if it was set to 'default_page'
        await supabaseAdmin
          .from('facebook_automation_config')
          .update({ page_id: facebookPages[0].id })
          .eq('workspace_id', finalWorkspaceId)
          .eq('page_id', 'default_page');
      } catch (webhookError) {
        logger.error('Failed to subscribe Facebook pages to webhook — user should reconnect to enable automation', {
          error: webhookError instanceof Error ? webhookError : new Error(String(webhookError)),
          platformUserId: profile.platformUserId,
        });
      }
    }

    // Invalidate dashboard overview & connections caches so the newly connected platform shows immediately
    try {
      invalidateOverviewCache(finalWorkspaceId);
      await invalidateConnectionsCache(finalWorkspaceId);
    } catch {
      /* silent */
    }

    // Build success redirect URL (signal zero-form voice cloning for text-first social channels)
    const shouldTriggerVoiceClone =
      platform === 'linkedin' ||
      platform === 'x' ||
      platform === 'instagram' ||
      platform === 'threads' ||
      platform === 'bluesky';

    const successUrl = buildRedirectUrl(request, returnUrl, {
      connected: platform,
      ...(shouldTriggerVoiceClone
        ? { voiceClone: 'auto', connectionId: savedConnection.id }
        : {}),
    });

    return clearOAuthCookies(NextResponse.redirect(successUrl), effectiveState, platform);
  } catch (error) {
    // Supabase PostgrestError is a plain object (not instanceof Error), so String(error)
    // would produce "[object Object]". Properly extract the message from any shape.
    let errMsg: string;
    if (error instanceof Error) {
      errMsg = error.message;
    } else if (error !== null && typeof error === 'object') {
      const pgErr = error as { message?: string; details?: string; code?: string };
      errMsg = pgErr.message || pgErr.details || JSON.stringify(error);
    } else {
      errMsg = String(error);
    }
    logger.error('OAuth callback failed', {
      error: errMsg,
      platform,
      workspaceId,
      state: effectiveState.slice(0, 8) + '...',
    });
    const errorMsg = (errMsg.slice(0, 300) || 'unknown').trim();
    return clearOAuthCookies(
      NextResponse.redirect(
        buildRedirectUrl(request, returnUrl, {
          error: 'callback_failed',
          platform,
          detail: errorMsg,
        })
      ),
      effectiveState,
      platform
    );
  }
}
