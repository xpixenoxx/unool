import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface ThreadsAutomationTarget {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cfg: Record<string, any>;
  connectionId: string;
  threadsUserId: string;
  username?: string;
}

type ThreadsConnRow = {
  id: string;
  workspace_id: string;
  platform_user_id?: string | null;
  username?: string | null;
  updated_at?: string | null;
};

function parseTs(value?: string | null): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Resolve which workspace/config/connection should handle a webhook event for a Threads user.
 * When multiple workspaces connect the same Threads account, ranks matches by latest
 * config/connection `updated_at` so the actively connected workspace receives events & logs.
 */
export async function resolveThreadsAutomationTarget(
  threadsUserId?: string,
  rootOwnerUsername?: string
): Promise<ThreadsAutomationTarget | null> {
  if (!threadsUserId && !rootOwnerUsername) return null;

  // 1. Connected Threads accounts matching user ID or handle (newest first)
  let connQuery = supabaseAdmin
    .from('platform_connections')
    .select('id, workspace_id, platform_user_id, username, updated_at')
    .eq('platform', 'threads')
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(20);

  if (threadsUserId && rootOwnerUsername) {
    connQuery = connQuery.or(`platform_user_id.eq.${threadsUserId},username.eq.${rootOwnerUsername}`);
  } else if (threadsUserId) {
    connQuery = connQuery.eq('platform_user_id', threadsUserId);
  } else if (rootOwnerUsername) {
    connQuery = connQuery.eq('username', rootOwnerUsername);
  }

  const { data: initialConns } = await connQuery;
  const conns = (initialConns as ThreadsConnRow[] | null) || [];

  const candidateConns = new Map<string, ThreadsConnRow>();
  for (const c of conns) {
    if (!candidateConns.has(c.workspace_id)) {
      candidateConns.set(c.workspace_id, c);
    }
  }

  // 2. Enabled configs explicitly bound to this threads_user_id (newest first)
  if (threadsUserId) {
    const { data: exactCfgs } = await supabaseAdmin
      .from('threads_automation_config')
      .select('*')
      .eq('threads_user_id', threadsUserId)
      .eq('enabled', true)
      .order('updated_at', { ascending: false })
      .limit(20);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matches: Array<{ cfg: Record<string, any>; conn: ThreadsConnRow; recency: number; order: number }> = [];
    for (let i = 0; i < (exactCfgs || []).length; i++) {
      const exact = exactCfgs![i];
      let conn = candidateConns.get(exact.workspace_id);
      if (!conn) {
        const { data: wsConns } = await supabaseAdmin
          .from('platform_connections')
          .select('id, workspace_id, platform_user_id, username, updated_at')
          .eq('workspace_id', exact.workspace_id)
          .eq('platform', 'threads')
          .eq('status', 'connected')
          .order('updated_at', { ascending: false })
          .limit(1);
        conn = (wsConns as ThreadsConnRow[] | null)?.[0];
      }
      if (conn?.id) {
        const recency = Math.max(parseTs(exact.updated_at), parseTs(conn.updated_at));
        matches.push({ cfg: exact, conn, recency, order: i });
      }
    }

    if (matches.length > 0) {
      matches.sort((a, b) => (b.recency - a.recency) || (a.order - b.order));
      const winner = matches[0];
      return {
        cfg: winner.cfg,
        connectionId: winner.conn.id,
        threadsUserId: threadsUserId || winner.conn.platform_user_id || winner.cfg.threads_user_id,
        username: winner.conn.username || undefined,
      };
    }
  }

  // 3. Fallback by matched workspace (already ordered newest connection first)
  for (const [workspaceId, conn] of candidateConns) {
    const { data: wsCfgs } = await supabaseAdmin
      .from('threads_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('enabled', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    const cfg = wsCfgs?.[0];
    if (cfg) {
      return {
        cfg,
        connectionId: conn.id,
        threadsUserId: threadsUserId || conn.platform_user_id || cfg.threads_user_id,
        username: conn.username || undefined,
      };
    }

    // 4. Fallback: workspaces.settings.threads_automation
    try {
      const { data: wsRows } = await supabaseAdmin
        .from('workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .limit(1);
      const wsSettings = (wsRows?.[0]?.settings as Record<string, unknown> | undefined) || {};
      const thSettings = wsSettings.threads_automation as Record<string, unknown> | undefined;
      if (thSettings && thSettings.enabled === true) {
        return {
          cfg: {
            ...thSettings,
            workspace_id: (thSettings.workspace_id as string | undefined) || workspaceId,
            threads_user_id: threadsUserId || conn.platform_user_id || String(thSettings.threads_user_id || ''),
          },
          connectionId: conn.id,
          threadsUserId: threadsUserId || conn.platform_user_id || String(thSettings.threads_user_id || ''),
          username: conn.username || undefined,
        };
      }
    } catch (wsErr) {
      logger.debug('Threads workspace settings fallback lookup failed', {
        workspaceId,
        error: wsErr instanceof Error ? wsErr.message : String(wsErr),
      });
    }
  }

  return null;
}
