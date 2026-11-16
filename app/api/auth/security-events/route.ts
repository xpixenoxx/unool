import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/security-events
 * Returns recent workspace/account security events cleanly (owner/admin see workspace scope,
 * other roles see only their own actor events). Falls back cleanly if the migration hasn't run.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const adminCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin']);

    try {
      let query = supabaseAdmin
        .from('workspace_security_events')
        .select('id, event_type, actor_user_id, metadata, created_at')
        .eq('workspace_id', auth.workspaceId)
        .order('created_at', { ascending: false })
        .limit(15);

      if (!adminCheck.allowed) {
        query = query.eq('actor_user_id', auth.userId);
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json(
          { events: [], source: 'pre-migration' },
          { status: 200, headers: NO_STORE_HEADERS }
        );
      }

      const events = (data || []).map((row) => ({
        id: row.id,
        eventType: row.event_type,
        actorUserId: row.actor_user_id,
        metadata: (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>,
        createdAt: row.created_at,
      }));

      return NextResponse.json(
        { events, source: 'table' },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    } catch {
      return NextResponse.json(
        { events: [], source: 'pre-migration' },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }
  } catch (err) {
    logger.error('GET /api/auth/security-events failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to load security events.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

