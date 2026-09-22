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

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      logger.warn('Platform connections fetch: Unauthorized (getCurrentAuth returned null)', { traceId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Platform connections fetch: Auth resolved', { traceId, userId: auth.userId, workspaceId: auth.workspaceId });

    // Strategy 1: Try with the resolved workspaceId and userId
    let connections = await platformRepository.findByWorkspaceAndUser(auth.workspaceId, auth.userId);
    
    logger.info('Platform connections fetch: Strategy 1 (workspaceId + userId)', {
      traceId,
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      count: connections.length,
    });

    // Strategy 2: If no connections found and userId !== workspaceId, try userId as workspaceId
    // This handles the case where the OAuth callback stored userId instead of workspaceId
    if (connections.length === 0 && auth.userId !== auth.workspaceId) {
      const fallbackConnections = await platformRepository.findByWorkspaceAndUser(auth.userId, auth.userId);
      logger.info('Platform connections fetch: Strategy 2 (userId as workspaceId)', {
        traceId,
        userId: auth.userId,
        count: fallbackConnections.length,
      });
      if (fallbackConnections.length > 0) {
        connections = fallbackConnections;
        // Fix the mismatched workspace_id in the database so future queries work correctly
        const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
        for (const conn of fallbackConnections) {
          try {
            await adminSupabase
              .from('platform_connections')
              .update({ workspace_id: auth.workspaceId, updated_at: new Date().toISOString() })
              .eq('id', conn.id);
            logger.info('Fixed workspace_id for platform connection', {
              traceId,
              connectionId: conn.id,
              platform: conn.platform,
              oldWorkspaceId: auth.userId,
              newWorkspaceId: auth.workspaceId,
            });
          } catch (fixErr) {
            logger.warn('Failed to fix workspace_id for platform connection', {
              traceId,
              connectionId: conn.id,
              error: fixErr instanceof Error ? fixErr.message : String(fixErr),
            });
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

    logger.info('Platform connections fetched', { traceId, workspaceId: auth.workspaceId, totalFound: connections.length });
    return NextResponse.json({ connections: result });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to fetch platform connections', { traceId, error: err });
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}