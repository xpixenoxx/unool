import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';
import { SUPPORTED_PLATFORMS } from '@/lib/platforms';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';

/**
 * Proactively refresh an expired access token using the stored refresh token.
 * Returns true if refresh succeeded (row updated in DB), false otherwise.
 */
async function tryRefreshToken(row: Record<string, any>, adminSupabase: any): Promise<boolean> {
  try {
    const { getPlatformAdapter } = await import('@/lib/platforms');
    const { decryptToken, encryptToken } = await import('@/lib/crypto/encryption');

    const adapter = getPlatformAdapter(row.platform);
    if (!adapter) return false;

    const refreshTokenEncrypted = row.refresh_token_encrypted || row.refresh_token;
    if (!refreshTokenEncrypted) return false;

    const refreshToken = await decryptToken(refreshTokenEncrypted);
    const tokenResponse = await adapter.refreshAccessToken(refreshToken);

    // Encrypt the new tokens
    const newAccessTokenEncrypted = await encryptToken(tokenResponse.accessToken);
    const newRefreshTokenEncrypted = tokenResponse.refreshToken
      ? await encryptToken(tokenResponse.refreshToken)
      : refreshTokenEncrypted; // Keep original if no new refresh token returned
    const newExpiresAt = tokenResponse.expiresIn
      ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
      : null;

    // Update the DB row with fresh tokens
    await adminSupabase
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

    // Mark connection as expired so user knows to reconnect
    await adminSupabase
      .from('platform_connections')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', row.id);

    return false;
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

    const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // Strategies 1 & 2: run in parallel — query by workspace_id and by userId-as-workspace_id simultaneously
    const needsBothQueries = auth.userId !== auth.workspaceId;
    const [s1Result, s2Result] = await Promise.all([
      adminSupabase.from('platform_connections').select('*').eq('workspace_id', auth.workspaceId),
      needsBothQueries
        ? adminSupabase.from('platform_connections').select('*').eq('workspace_id', auth.userId)
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
      const { data: memberships } = await adminSupabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', auth.userId);

      if (memberships && memberships.length > 0) {
        // Fetch all member workspaces in parallel
        const memberResults = await Promise.all(
          memberships
            .filter((m) => m.workspace_id !== auth.workspaceId && m.workspace_id !== auth.userId)
            .map((m) =>
              adminSupabase
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

    const result: Record<string, { platform: string; status: string; username?: string; connectedAt?: string; expiresAt?: string }> = {};
    for (const platform of SUPPORTED_PLATFORMS) {
      result[platform] = { platform, status: 'not_connected' };
    }

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
          // PublishService marked this connection as broken — user must reconnect
          status = 'expired';
        } else if (accessTokenExpired && !hasRefreshToken) {
          // Access token expired and no refresh token — truly expired
          status = 'expired';
        } else if (accessTokenExpired && hasRefreshToken) {
          // Access token expired but we have a refresh token — proactively refresh
          // Show as connected optimistically; the refresh runs in the background
          status = 'connected';
          refreshPromises.push(
            tryRefreshToken(row, adminSupabase).then((refreshed) => ({
              platform: row.platform,
              refreshed,
            }))
          );
        } else {
          status = 'connected';
        }

        result[row.platform] = {
          platform: row.platform,
          status,
          username: row.username || undefined,
          connectedAt: row.created_at,
          expiresAt: row.expires_at || undefined,
        };
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

    const totalFound = rows?.length || 0;
    logger.info('Platform connections fetched', { traceId, workspaceId: auth.workspaceId, totalFound, debug });
    return NextResponse.json({ connections: result, totalFound, userId: auth.userId, debug });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    debug.push(`error:${err.message}`);
    logger.error('Failed to fetch platform connections', { traceId, error: err, debug });
    return NextResponse.json({ error: 'Failed to fetch connections', debug }, { status: 500 });
  }
}