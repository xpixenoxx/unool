import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { logger } from '@/lib/logger';
import { getPlatformAdapter, SUPPORTED_PLATFORMS } from '@/lib/platforms';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { refreshPlatformConnectionToken } from '@/lib/services/automation/tokenRefresh';
import {
  getCachedConnectionsPayload,
  setCachedConnectionsPayload,
  invalidateConnectionsCache,
} from '@/lib/cache/connectionsCache';

export const dynamic = 'force-dynamic';

const CUSTOM_FLOW_SET = new Set([
  'bluesky', 'mastodon', 'slack', 'twitch', 'telegram', 'skool',
  'warpcast', 'mewe', 'nostr', 'medium', 'lemmy', 'listmonk',
  'hashnode', 'devto', 'manual',
]);

function getConfiguredPlatforms(): Record<string, boolean> {
  const configured: Record<string, boolean> = {};
  for (const p of SUPPORTED_PLATFORMS) {
    if (CUSTOM_FLOW_SET.has(p)) {
      configured[p] = true;
    } else {
      configured[p] = Boolean(getPlatformAdapter(p)?.authConfig?.clientId);
    }
  }
  return configured;
}

async function tryRefreshToken(row: Record<string, any>): Promise<boolean> {
  const outcome = await refreshPlatformConnectionToken(row, {
    failureStatus: 'expired',
    sendExpiryAlert: true,
  });
  return outcome.ok;
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

    const bypassCache = request.nextUrl.searchParams.get('fresh') === '1';
    if (!bypassCache) {
      const cachedPayload = await getCachedConnectionsPayload<Record<string, unknown>>(auth.workspaceId);
      if (cachedPayload) {
        return NextResponse.json({
          ...cachedPayload,
          userId: auth.userId,
          cached: true,
        });
      }
    }

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
            tryRefreshToken(row).then((refreshed) => ({
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

      let refreshTimedOut = false;
      // Await refreshes (bounded) — Workers drop un-awaited work after the response is sent.
      if (refreshPromises.length > 0) {
        const settled = await Promise.race([
          Promise.allSettled(refreshPromises),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        if (!settled) {
          refreshTimedOut = true;
        } else {
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

      const configuredPlatforms = getConfiguredPlatforms();
      const totalFound = allAccounts.length;
      const responseData = {
        connections: result,
        accounts: allAccounts,
        totalFound,
        dependencyCounts,
        configuredPlatforms,
      };
      if (!refreshTimedOut) {
        await setCachedConnectionsPayload(auth.workspaceId, responseData, 30);
      }
      logger.info('Platform connections fetched', { traceId, workspaceId: auth.workspaceId, totalFound, debug });
      return NextResponse.json({
        ...responseData,
        userId: auth.userId,
      });
    }

    const configuredPlatforms = getConfiguredPlatforms();
    const totalFound = allAccounts.length;
    const emptyResponseData = {
      connections: result,
      accounts: allAccounts,
      totalFound,
      dependencyCounts,
      configuredPlatforms,
    };
    await setCachedConnectionsPayload(auth.workspaceId, emptyResponseData, 30);
    logger.info('Platform connections fetched', { traceId, workspaceId: auth.workspaceId, totalFound, debug });
    return NextResponse.json({
      ...emptyResponseData,
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
    await invalidateConnectionsCache(auth.workspaceId);

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
