import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { logger } from '@/lib/logger';
import { SUPPORTED_PLATFORMS } from '@/lib/platforms';
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

      // Best-effort email notification when a previously connected platform transitions to expired,
      // respecting the user's notify_token_expiry preference.
      if (row.status === 'connected' && row.user_id) {
        try {
          let shouldNotify = true;
          const { data: prefRow, error: prefErr } = await supabaseAdmin
            .from('user_preferences')
            .select('notify_token_expiry')
            .eq('user_id', row.user_id)
            .limit(1)
            .maybeSingle();

          if (!prefErr && prefRow && prefRow.notify_token_expiry === false) {
            shouldNotify = false;
          } else {
            const { data: wsRow } = await supabaseAdmin
              .from('workspaces')
              .select('settings')
              .eq('id', row.workspace_id)
              .limit(1)
              .maybeSingle();
            const wsPrefs = (wsRow?.settings as Record<string, any> | undefined)?.preferences;
            if (wsPrefs?.notifyTokenExpiry === false || wsPrefs?.notify_token_expiry === false) {
              shouldNotify = false;
            }
          }

          if (shouldNotify) {
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
      logger.warn('Platform connections fetch: Unauthorized', { traceId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    debug.push(`auth:uid=${auth.userId.slice(0, 8)}:wid=${auth.workspaceId.slice(0, 8)}`);

    // Strictly scope platform connections to the active authorized workspace (no cross-workspace bleed)
    const { data: rows, error: rowsErr } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', auth.workspaceId);

    debug.push(`ws:wid=${auth.workspaceId.slice(0, 8)}:count=${rows?.length || 0}:err=${rowsErr?.message || 'none'}`);

    // Compute scheduled post dependency counts per platform (best-effort)
    const dependencyCounts: Record<string, { scheduledPosts: number }> = {};
    try {
      const { data: scheduledPosts } = await supabaseAdmin
        .from('posts')
        .select('id, post_variants(platform, status)')
        .eq('workspace_id', auth.workspaceId)
        .in('status', ['scheduled', 'queued']);

      if (scheduledPosts) {
        for (const post of scheduledPosts as any[]) {
          const variants = Array.isArray(post.post_variants) ? post.post_variants : [];
          for (const v of variants) {
            if (v?.platform && v.status !== 'published' && v.status !== 'cancelled') {
              const p = String(v.platform);
              dependencyCounts[p] = {
                scheduledPosts: (dependencyCounts[p]?.scheduledPosts || 0) + 1,
              };
            }
          }
        }
      }
    } catch {
      // Non-fatal dependency lookup
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
      needsReconnect?: boolean;
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
      // Collect refresh promises for connections with expired access tokens.
      // NOTE: Cloudflare Workers cancel un-awaited work once the response is sent, so these
      // must be awaited (bounded by a timeout below) instead of fire-and-forget.
      const refreshPromises: Promise<{ platform: string; refreshed: boolean; entry?: ConnectedAccountEntry }>[] = [];
      const { decryptToken } = await import('@/lib/crypto/encryption');

      for (const row of rows) {
        const now = new Date();
        const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
        const hasRefreshToken = Boolean(row.refresh_token_encrypted || row.refresh_token);
        const accessTokenExpired = expiresAt && expiresAt <= now;
        const dbStatus = row.status as string;

        // Determine connection status
        let status: string;
        let needsRefresh = false;

        if (dbStatus === 'error' || dbStatus === 'revoked') {
          // If voluntarily disconnected (revoked), show as not_connected so UI displays clean Connect state;
          // error indicates a publishing auth failure requiring reconnect.
          status = dbStatus === 'revoked' ? 'not_connected' : 'expired';
        } else if (accessTokenExpired && !hasRefreshToken) {
          // Access token expired and no refresh token — truly expired
          status = 'expired';
        } else if (accessTokenExpired && hasRefreshToken) {
          // Access token expired but we have a refresh token — refresh now (awaited below)
          status = 'connected';
          needsRefresh = true;
        } else {
          status = 'connected';
        }

        // Detect tokens that can no longer be decrypted (e.g. encrypted with a retired key).
        // Reported to the UI as "reconnect required" — derived only, never persisted, so a
        // temporary key misconfiguration can't permanently flag healthy connections.
        let needsReconnect = false;
        if (dbStatus === 'error' && status === 'expired') needsReconnect = true;

        let streamConfigured: boolean | undefined = undefined;
        if (row.platform === 'kick' && row.access_token_encrypted) {
          try {
            const decrypted = await decryptToken(row.access_token_encrypted);
            const parsed = JSON.parse(decrypted);
            streamConfigured = Boolean(parsed.streamKey && parsed.streamUrl);
          } catch {
            streamConfigured = false;
          }
        }

        if (row.platform === 'kick' && streamConfigured) {
          status = 'connected';
          needsReconnect = false;
          if (row.status !== 'connected') {
            await supabaseAdmin
              .from('platform_connections')
              .update({ status: 'connected', updated_at: new Date().toISOString() })
              .eq('id', row.id);
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
          needsReconnect: needsReconnect || undefined,
        };

        if (needsRefresh) {
          refreshPromises.push(
            tryRefreshToken(row, supabaseAdmin).then((refreshed) => ({
              platform: row.platform,
              refreshed,
              entry: accountEntry,
            }))
          );
        }

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

      // Await refreshes (bounded) — Workers drop un-awaited work after the response is sent.
      if (refreshPromises.length > 0) {
        const settled = await Promise.race([
          Promise.allSettled(refreshPromises),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        if (settled) {
          for (const r of settled) {
            if (r.status === 'fulfilled' && !r.value.refreshed) {
              logger.warn('Token refresh failed for platform', { platform: r.value.platform, traceId });
              if (r.value.entry) r.value.entry.status = 'expired';
              const accts = accountsByPlatform[r.value.platform] || [];
              if (result[r.value.platform]) {
                result[r.value.platform].status = accts.some((a) => a.status === 'connected') ? 'connected' : 'expired';
              }
            }
          }
        }
        debug.push(`refresh_awaited:${refreshPromises.length}${settled ? '' : ':timeout'}`);
      }
    }

    const totalFound = allAccounts.length;
    logger.info('Platform connections fetched', { traceId, workspaceId: auth.workspaceId, totalFound, debug });
    return NextResponse.json({
      connections: result,
      accounts: allAccounts,
      totalFound,
      dependencyCounts,
      userId: auth.userId,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    debug.push(`error:${err.message}`);
    logger.error('Failed to fetch platform connections', { traceId, error: err, debug });
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
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

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, [
      'owner',
      'admin',
      'editor',
    ]);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Forbidden: Only owners, admins, or editors can disconnect channels.' },
        { status: 403 }
      );
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
