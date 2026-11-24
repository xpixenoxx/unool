import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';
import { SUPPORTED_PLATFORMS } from '@/lib/platforms';
import { invalidateOverviewCache } from '@/lib/cache/overviewCache';
import { invalidateConnectionsCache } from '@/lib/cache/connectionsCache';

const platformRepository = new SupabasePlatformRepository();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const traceId = crypto.randomUUID();
  const { platform } = await params;

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin', 'editor']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Insufficient workspace permissions to disconnect channels.' },
        { status: 403 }
      );
    }

    if (!SUPPORTED_PLATFORMS.includes(platform as (typeof SUPPORTED_PLATFORMS)[number])) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const connectionId = request.nextUrl.searchParams.get('connectionId');
    const connections = await platformRepository.findByWorkspaceId(auth.workspaceId);
    const matchingConns = connections.filter((c) => {
      if (c.platform !== platform) return false;
      if (connectionId) return c.id === connectionId;
      return true;
    });
    
    if (matchingConns.length === 0) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    for (const conn of matchingConns) {
      await platformRepository.disconnect(conn.id);
    }

    try {
      const { supabaseAdmin } = await import('@/lib/supabase/admin');
      await supabaseAdmin.from('workspace_security_events').insert({
        workspace_id: auth.workspaceId,
        actor_user_id: auth.userId,
        event_type: 'channel_disconnected',
        metadata: {
          platform,
          disconnectedCount: matchingConns.length,
          connectionId: connectionId || null,
        },
      });
    } catch {
      // Non-fatal audit insert pre-migration
    }

    invalidateOverviewCache(auth.workspaceId);
    await invalidateConnectionsCache(auth.workspaceId);

    logger.info('Platform disconnected', { traceId, workspaceId: auth.workspaceId, platform, connectionId: connectionId || 'all' });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to disconnect platform', { traceId, platform, error: err });
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}