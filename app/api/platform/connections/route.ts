import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';
import { SUPPORTED_PLATFORMS } from '@/lib/platforms';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';

const platformRepository = new SupabasePlatformRepository();

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

    debug.push(`auth_ok:uid=${auth.userId.slice(0,8)}:wid=${auth.workspaceId.slice(0,8)}`);
    logger.info('Platform connections fetch: Auth resolved', { traceId, userId: auth.userId, workspaceId: auth.workspaceId });

    // Strategy 1: Try with the resolved workspaceId and userId
    let connections = await platformRepository.findByWorkspaceAndUser(auth.workspaceId, auth.userId);
    debug.push(`s1:count=${connections.length}`);

    // Strategy 2: If no connections found and userId !== workspaceId, try userId as workspaceId
    if (connections.length === 0 && auth.userId !== auth.workspaceId) {
      const fallbackConnections = await platformRepository.findByWorkspaceAndUser(auth.userId, auth.userId);
      debug.push(`s2:count=${fallbackConnections.length}`);
      if (fallbackConnections.length > 0) {
        connections = fallbackConnections;
        const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
        for (const conn of fallbackConnections) {
          try {
            await adminSupabase
              .from('platform_connections')
              .update({ workspace_id: auth.workspaceId, updated_at: new Date().toISOString() })
              .eq('id', conn.id);
            debug.push(`s2:fixed:${conn.platform}`);
          } catch (fixErr) {
            debug.push(`s2:fix_err:${conn.platform}`);
          }
        }
      }
    }

    // Strategy 3: Brute-force — just find ALL connections for this user regardless of workspace
    if (connections.length === 0) {
      const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      const { data: allByUser, error: allErr } = await adminSupabase
        .from('platform_connections')
        .select('*')
        .eq('user_id', auth.userId);
      
      debug.push(`s3:byUserId:count=${allByUser?.length || 0}:err=${allErr?.message || 'none'}`);
      
      if (allByUser && allByUser.length > 0) {
        connections = allByUser.map((row: any) => ({
          id: row.id,
          workspaceId: row.workspace_id,
          userId: row.user_id,
          platform: row.platform,
          platformUserId: row.platform_user_id,
          username: row.username,
          accessTokenEncrypted: row.access_token_encrypted,
          refreshTokenEncrypted: row.refresh_token_encrypted,
          expiresAt: row.expires_at ? new Date(row.expires_at) : null,
          scopes: row.scopes || [],
          status: row.status,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }));
      }

      // Strategy 4: Find ALL connections in the workspace regardless of user
      if (connections.length === 0) {
        const { data: allByWs, error: wsErr } = await adminSupabase
          .from('platform_connections')
          .select('*')
          .eq('workspace_id', auth.workspaceId);
        
        debug.push(`s4:byWsId:count=${allByWs?.length || 0}:err=${wsErr?.message || 'none'}`);
        
        if (allByWs && allByWs.length > 0) {
          // Check what user_id they have
          for (const row of allByWs) {
            debug.push(`s4:row:uid=${(row.user_id || 'null').toString().slice(0,8)}:p=${row.platform}`);
          }
          connections = allByWs.map((row: any) => ({
            id: row.id,
            workspaceId: row.workspace_id,
            userId: row.user_id,
            platform: row.platform,
            platformUserId: row.platform_user_id,
            username: row.username,
            accessTokenEncrypted: row.access_token_encrypted,
            refreshTokenEncrypted: row.refresh_token_encrypted,
            expiresAt: row.expires_at ? new Date(row.expires_at) : null,
            scopes: row.scopes || [],
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          }));
        }
      }

      // Strategy 5: Dump ALL records in the table (emergency debug)
      if (connections.length === 0) {
        const { data: allRecords, error: allRecErr } = await adminSupabase
          .from('platform_connections')
          .select('id, workspace_id, user_id, platform')
          .limit(10);
        
        debug.push(`s5:allRecords:count=${allRecords?.length || 0}:err=${allRecErr?.message || 'none'}`);
        if (allRecords) {
          for (const r of allRecords) {
            debug.push(`s5:row:wid=${r.workspace_id?.slice(0,8)}:uid=${(r.user_id || 'null').toString().slice(0,8)}:p=${r.platform}`);
          }
        }
      }
    }

    // Initialize result with all supported platforms
    const result: Record<string, { platform: string; status: string; username?: string; connectedAt?: string; expiresAt?: string }> = {};
    for (const platform of SUPPORTED_PLATFORMS) {
      result[platform] = { platform, status: 'not_connected' };
    }

    for (const conn of connections) {
      const now = new Date();
      const expiresAt = conn.expiresAt ? new Date(conn.expiresAt) : null;
      const isExpired = expiresAt && expiresAt <= now;

      result[conn.platform] = {
        platform: conn.platform,
        status: isExpired ? 'expired' : 'connected',
        username: conn.username ?? undefined,
        connectedAt: conn.createdAt?.toISOString(),
        expiresAt: conn.expiresAt?.toISOString(),
      };
    }

    logger.info('Platform connections fetched', { traceId, workspaceId: auth.workspaceId, totalFound: connections.length, debug });
    return NextResponse.json({ connections: result, debug });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    debug.push(`error:${err.message}`);
    logger.error('Failed to fetch platform connections', { traceId, error: err, debug });
    return NextResponse.json({ error: 'Failed to fetch connections', debug }, { status: 500 });
  }
}