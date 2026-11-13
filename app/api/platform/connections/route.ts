import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';
import { SUPPORTED_PLATFORMS } from '@/lib/platforms';
import { config } from '@/lib/config/schema';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Proactively refresh an expired access token using the stored refresh token.
 * Returns true if refresh succeeded (row updated in DB), false otherwise.
 */
async function tryRefreshToken(row: Record<string, any>, supabaseAdmin: any): Promise<boolean> {
  try {
    const { getPlatformAdapter } = await import('@/lib/platforms');
    const { decryptToken, encryptToken } = await import('@/lib/crypto/encryption');

    const adapter = getPlatformAdapter(row.platform);
    if (!adapter) return false;

    const refreshTokenEncrypted = row.refresh_token_encrypted || row.refresh_token;
    if (!refreshTokenEncrypted) return false;

    const refreshToken = await decryptToken(refreshTokenEncrypted);
    const tokenResponse = await adapter.refreshAccessToken(refreshToken);

    // Encrypt the new tokens (preserving Kick stream settings if present)
    let finalAccessTokenToEncrypt = tokenResponse.accessToken;
    if (row.platform === 'kick') {
      try {
        const oldEncrypted = row.access_token_encrypted || row.access_token;
        if (oldEncrypted) {
          const oldDecrypted = await decryptToken(oldEncrypted);
          const parsed = JSON.parse(oldDecrypted);
          if (parsed && typeof parsed === 'object' && (parsed.streamUrl || parsed.streamKey)) {
            finalAccessTokenToEncrypt = JSON.stringify({
              accessToken: tokenResponse.accessToken,
              streamUrl: parsed.streamUrl,
              streamKey: parsed.streamKey,
            });
          }
        }
      } catch {}
    }

    const newAccessTokenEncrypted = await encryptToken(finalAccessTokenToEncrypt);
    const newRefreshTokenEncrypted = tokenResponse.refreshToken
      ? await encryptToken(tokenResponse.refreshToken)
      : refreshTokenEncrypted; // Keep original if no new refresh token returned
    const newExpiresAt = tokenResponse.expiresIn
      ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
      : null;

    // Update the DB row with fresh tokens
    await supabaseAdmin
      .from('platform_connections')
      .update({
        access_token_encrypted: newAccessTokenEncrypted,
        refresh_token_encrypted: newRefreshTokenEncrypted,
        expires_at: newExpiresAt?.toISOString(),
        status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    logger.info('Proactive token refresh succeeded', {
      platform: row.platform,
      connectionId: row.id,
      newExpiresIn: tokenResponse.expiresIn,
    });

    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('Proactive token refresh failed', {
      platform: row.platform,
      connectionId: row.id,
      error: err.message,
    });

    // For Kick: do not mark connection as expired if it has live stream credentials configured
    let hasKickStream = false;
    if (row.platform === 'kick' && row.access_token_encrypted) {
      try {
        const { decryptToken } = await import('@/lib/crypto/encryption');
        const decrypted = await decryptToken(row.access_token_encrypted);
        const parsed = JSON.parse(decrypted);
        if (parsed?.streamUrl && parsed?.streamKey) {
          hasKickStream = true;
        }
      } catch {}
    }

    if (!hasKickStream) {
      await supabaseAdmin
        .from('platform_connections')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', row.id);

      // Best-effort email notification when a previously connected platform transitions to expired (P1-3)
      if (row.status === 'connected' && row.user_id) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
          const email = authUser?.user?.email;
          if (email) {
            const { sendTokenExpiredAlertEmail } = await import('@/lib/auth/email');
            await sendTokenExpiredAlertEmail({
              to: email,
              platform: row.platform,
              username: row.username || undefined,
            });
          }
        } catch {
          // Non-fatal alert dispatch
        }
      }
    } else {
      await supabaseAdmin
        .from('platform_connections')
        .update({ status: 'connected', updated_at: new Date().toISOString() })
        .eq('id', row.id);
    }

    return hasKickStream;
  }
}

export async function GET(request: NextRequest) {
  const traceId = crypto.randomUUID();
  const debug: string[] = [];

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      debug.push('auth_null');
      logger.warn('Platform connections fetch: Unauthorized', { traceId });
      return NextResponse.json({ error: 'Unauthorized', debug }, { status: 401 });
    }

    debug.push(`auth:uid=${auth.userId.slice(0, 8)}:wid=${auth.workspaceId.slice(0, 8)}`);

    

    // Strategies 1 & 2: run in parallel — query by workspace_id and by userId-as-workspace_id simultaneously
    const needsBothQueries = auth.userId !== auth.workspaceId;
    const [s1Result, s2Result] = await Promise.all([
      supabaseAdmin.from('platform_connections').select('*').eq('workspace_id', auth.workspaceId),
      needsBothQueries
        ? supabaseAdmin.from('platform_connections').select('*').eq('workspace_id', auth.userId)
        : Promise.resolve({ data: null, error: null }),
    ]);

    let rows = s1Result.data;
    debug.push(`s1:wid=${auth.workspaceId.slice(0, 8)}:count=${rows?.length || 0}:err=${s1Result.error?.message || 'none'}`);

    if ((!rows || rows.length === 0) && s2Result.data && s2Result.data.length > 0) {
      rows = s2Result.data;
      debug.push(`s2:uid_as_wid=${auth.userId.slice(0, 8)}:count=${rows.length}`);
    }

    // Strategy 3: Check all workspaces the user belongs to (only if still empty)
    if (!rows || rows.length === 0) {
      const { data: memberships } = await supabaseAdmin
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', auth.userId);

      if (memberships && memberships.length > 0) {
        // Fetch all member workspaces in parallel
        const memberResults = await Promise.all(
          memberships
            .filter((m) => m.workspace_id !== auth.workspaceId && m.workspace_id !== auth.userId)
            .map((m) =>
              supabaseAdmin
                .from('platform_connections')
                .select('*')
                .eq('workspace_id', m.workspace_id)
                .then((r) => ({ workspaceId: m.workspace_id, data: r.data }))
            )
        );

        const found = memberResults.find((r) => r.data && r.data.length > 0);
        if (found) {
          rows = found.data;
          debug.push(`s3:found_in_member_ws=${found.workspaceId.slice(0, 8)}:count=${rows?.length || 0}`);
        }
      }
    }

    interface ConnectedAccountEntry {
      id: string;
      platform: string;
      platformUserId?: string;
      username?: string;
      displayName?: string;
      avatarUrl?: string;
      status: string;
      connectedAt?: string;
      expiresAt?: string;
      streamConfigured?: boolean;
    }

    const result: Record<string, {
      platform: string;
      status: string;
      username?: string;
      displayName?: string;
      connectedAt?: string;
      expiresAt?: string;
      streamConfigured?: boolean;
      accounts?: ConnectedAccountEntry[];
    }> = {};
    for (const platform of SUPPORTED_PLATFORMS) {
      result[platform] = { platform, status: 'not_connected', accounts: [] };
    }

    const accountsByPlatform: Record<string, ConnectedAccountEntry[]> = {};
    const allAccounts: ConnectedAccountEntry[] = [];
    const statusPriority: Record<string, number> = { connected: 3, expired: 2, not_connected: 1 };

    if (rows && rows.length > 0) {
      // Collect refresh promises for connections with expired access tokens
      const refreshPromises: Promise<{ platform: string; refreshed: boolean }>[] = [];

      for (const row of rows) {
        const now = new Date();
        const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
        const hasRefreshToken = Boolean(row.refresh_token_encrypted || row.refresh_token);
        const accessTokenExpired = expiresAt && expiresAt <= now;
        const dbStatus = row.status as string;

        // Determine connection status
        let status: string;

        if (dbStatus === 'error' || dbStatus === 'revoked') {
          // If voluntarily disconnected (revoked), show as not_connected so UI displays clean Connect state;
          // error indicates a publishing auth failure requiring reconnect.
          status = dbStatus === 'revoked' ? 'not_connected' : 'expired';
        } else if (accessTokenExpired && !hasRefreshToken) {
          // Access token expired and no refresh token — truly expired
          status = 'expired';
        } else if (accessTokenExpired && hasRefreshToken) {
          // Access token expired but we have a refresh token — proactively refresh
          // Show as connected optimistically; the refresh runs in the background
          status = 'connected';
          refreshPromises.push(
            tryRefreshToken(row, supabaseAdmin).then((refreshed) => ({
              platform: row.platform,
              refreshed,
            }))
          );
        } else {
          status = 'connected';
        }

        let streamConfigured: boolean | undefined = undefined;
        if (row.platform === 'kick' && row.access_token_encrypted) {
          try {
            const { decryptToken } = await import('@/lib/crypto/encryption');
            const decrypted = await decryptToken(row.access_token_encrypted);
            const parsed = JSON.parse(decrypted);
            streamConfigured = Boolean(parsed.streamKey && parsed.streamUrl);
          } catch {
            streamConfigured = false;
          }
        }

        if (row.platform === 'kick' && streamConfigured) {
          status = 'connected';
          if (row.status !== 'connected') {
            supabaseAdmin
              .from('platform_connections')
              .update({ status: 'connected', updated_at: new Date().toISOString() })
              .eq('id', row.id)
              .then();
          }
        }

        const accountEntry: ConnectedAccountEntry = {
          id: row.id as string,
          platform: row.platform,
          platformUserId: (row.platform_user_id as string | null) || undefined,
          username: row.username || undefined,
          displayName: (row.display_name as string | null) || undefined,
          avatarUrl: (row.avatar_url as string | null) || undefined,
          status,
          connectedAt: row.created_at,
          expiresAt: row.expires_at || undefined,
          streamConfigured,
        };

        if (status !== 'not_connected') {
          const list = accountsByPlatform[row.platform] ?? [];
          list.push(accountEntry);
          accountsByPlatform[row.platform] = list;
          allAccounts.push(accountEntry);
        }

        const current = result[row.platform];
        const currentPriority = current ? (statusPriority[current.status] ?? 0) : 0;
        const incomingPriority = statusPriority[status] ?? 0;

        if (!current || incomingPriority >= currentPriority) {
          result[row.platform] = {
            platform: row.platform,
            status,
            username: row.username || current?.username || undefined,
            displayName: (row.display_name as string | null) || current?.displayName || undefined,
            connectedAt: row.created_at || current?.connectedAt,
            expiresAt: row.expires_at || current?.expiresAt || undefined,
            streamConfigured: streamConfigured ?? current?.streamConfigured,
            accounts: accountsByPlatform[row.platform] || [],
          };
        } else {
          result[row.platform] = {
            ...current,
            accounts: accountsByPlatform[row.platform] || [],
          };
        }
      }

      // Run all token refreshes in parallel (fire-and-forget with logging)
      // We don't block the response — the tokens get refreshed in the background.
      // On the next page load or publish, the tokens will be fresh.
      if (refreshPromises.length > 0) {
        Promise.allSettled(refreshPromises).then((results) => {
          for (const r of results) {
            if (r.status === 'fulfilled' && !r.value.refreshed) {
              logger.warn('Background token refresh failed for platform', {
                platform: r.value.platform,
                traceId,
              });
            }
          }
        });
        debug.push(`refresh_queued:${refreshPromises.length}`);
      }
    }

    const totalFound = allAccounts.length;
    logger.info('Platform connections fetched', { traceId, workspaceId: auth.workspaceId, totalFound, debug });
    return NextResponse.json({
      connections: result,
      accounts: allAccounts,
      totalFound,
      userId: auth.userId,
      debug,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    debug.push(`error:${err.message}`);
    logger.error('Failed to fetch platform connections', { traceId, error: err, debug });
    return NextResponse.json({ error: 'Failed to fetch connections', debug }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const traceId = crypto.randomUUID();
  const connectionId = request.nextUrl.searchParams.get('connectionId');

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
    }

    const { SupabasePlatformRepository } = await import('@/lib/repositories/supabase/SupabasePlatformRepository');
    const { invalidateOverviewCache } = await import('@/lib/cache/overviewCache');
    const platformRepository = new SupabasePlatformRepository();

    const conn = await platformRepository.findById(connectionId);
    if (!conn || conn.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    await platformRepository.disconnect(conn.id);
    invalidateOverviewCache(auth.workspaceId);

    logger.info('Platform account disconnected', {
      traceId,
      workspaceId: auth.workspaceId,
      platform: conn.platform,
      connectionId: conn.id,
    });

    return NextResponse.json({ success: true, connectionId: conn.id, platform: conn.platform });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to disconnect platform account', { traceId, connectionId, error: err });
    return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 });
  }
}
