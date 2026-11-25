import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { decryptToken } from '@/lib/crypto/encryption';
import { facebookAdapter } from '@/lib/platforms/FacebookAdapter';

export interface FacebookAutomationTarget {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cfg: Record<string, any>;
  connectionId: string;
}

const PLACEHOLDER_PAGE_IDS = new Set(['', 'default_page']);
const MAX_LEGACY_SCAN = 25;

type ConnRow = { id: string; workspace_id: string; scopes: string[] | null; updated_at?: string; access_token_encrypted?: string };

/**
 * Connections created before page tagging existed have no `fb_page_id:<id>` scope.
 * Tag them lazily (once) by asking Facebook which pages the token manages.
 */
async function tagLegacyConnections(pageId: string): Promise<ConnRow[]> {
  const { data: rows } = await supabaseAdmin
    .from('platform_connections')
    .select('id, workspace_id, scopes, access_token_encrypted')
    .eq('platform', 'facebook')
    .eq('status', 'connected')
    .limit(200);

  const legacy = (rows || []).filter(
    (r: ConnRow) => !(r.scopes || []).some((s) => s.startsWith('fb_page_id:'))
  ).slice(0, MAX_LEGACY_SCAN);

  const matches: ConnRow[] = [];
  for (const row of legacy) {
    try {
      if (!row.access_token_encrypted) continue;
      const userToken = await decryptToken(row.access_token_encrypted);
      const pages = await facebookAdapter.getUserPages(userToken);
      if (!pages.length) continue;
      const tags = pages.map((p) => `fb_page_id:${p.id}`);
      const scopes = Array.from(new Set([...(row.scopes || []), ...tags]));
      await supabaseAdmin.from('platform_connections').update({ scopes }).eq('id', row.id);
      row.scopes = scopes;
      if (pages.some((p) => p.id === pageId)) matches.push(row);
    } catch (err) {
      logger.debug('Facebook legacy connection page scan failed', {
        connectionId: row.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return matches;
}

/**
 * Resolve which workspace/config/connection should handle a webhook event for a Facebook page.
 * Works for any number of workspaces, pages per workspace, and legacy connections.
 */
export async function resolveFacebookAutomationTarget(pageId: string): Promise<FacebookAutomationTarget | null> {
  const tag = `fb_page_id:${pageId}`;

  // 1. Connections that own this page (newest first)
  const { data: initialConns } = await supabaseAdmin
    .from('platform_connections')
    .select('id, workspace_id, scopes, updated_at')
    .eq('platform', 'facebook')
    .eq('status', 'connected')
    .contains('scopes', [tag])
    .order('updated_at', { ascending: false })
    .limit(20);

  let conns: ConnRow[] = (initialConns as ConnRow[] | null) || [];

  // 2. Fallback: legacy untagged connections — discover + tag lazily
  if (conns.length === 0) {
    conns = await tagLegacyConnections(pageId);
  }

  // 3. Config explicitly bound to this page (newest updated_at first so active workspace wins when shared)
  const { data: exactCfgs } = await supabaseAdmin
    .from('facebook_automation_config')
    .select('*')
    .eq('page_id', pageId)
    .eq('enabled', true)
    .order('updated_at', { ascending: false })
    .limit(20);

  const candidateWorkspaces = new Map<string, string>(); // workspaceId -> connectionId
  const connRecency = new Map<string, number>(); // workspaceId -> timestamp ms
  for (const c of conns || []) {
    if (!candidateWorkspaces.has(c.workspace_id)) {
      candidateWorkspaces.set(c.workspace_id, c.id);
      const ts = c.updated_at ? Date.parse(c.updated_at) : 0;
      connRecency.set(c.workspace_id, Number.isFinite(ts) ? ts : 0);
    }
  }

  const exactMatches: Array<{ cfg: Record<string, any>; connectionId: string; recency: number; order: number }> = [];
  for (let i = 0; i < (exactCfgs || []).length; i++) {
    const exact = exactCfgs![i];
    let connectionId = candidateWorkspaces.get(exact.workspace_id);
    if (!connectionId) {
      const { data: wsConn } = await supabaseAdmin
        .from('platform_connections')
        .select('id, updated_at')
        .eq('workspace_id', exact.workspace_id)
        .eq('platform', 'facebook')
        .eq('status', 'connected')
        .order('updated_at', { ascending: false })
        .limit(1);
      connectionId = wsConn?.[0]?.id;
      if (connectionId && wsConn?.[0]?.updated_at) {
        const ts = Date.parse(wsConn[0].updated_at);
        if (Number.isFinite(ts)) connRecency.set(exact.workspace_id, ts);
      }
    }
    if (connectionId) {
      const cfgTs = exact.updated_at ? Date.parse(exact.updated_at) : 0;
      const connTs = connRecency.get(exact.workspace_id) || 0;
      exactMatches.push({
        cfg: exact,
        connectionId,
        recency: Math.max(Number.isFinite(cfgTs) ? cfgTs : 0, connTs),
        order: i,
      });
    }
  }

  if (exactMatches.length > 0) {
    exactMatches.sort((a, b) => (b.recency - a.recency) || (a.order - b.order));
    return { cfg: exactMatches[0].cfg, connectionId: exactMatches[0].connectionId };
  }

  // 4. Enabled config in a workspace that owns this page; heal placeholder page_id
  for (const [workspaceId, connectionId] of candidateWorkspaces) {
    const { data: cfgs } = await supabaseAdmin
      .from('facebook_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('enabled', true)
      .limit(1);
    const cfg = cfgs?.[0];
    if (cfg) {
      if (PLACEHOLDER_PAGE_IDS.has(cfg.page_id || '')) {
        await supabaseAdmin
          .from('facebook_automation_config')
          .update({ page_id: pageId })
          .eq('workspace_id', workspaceId);
        cfg.page_id = pageId;
      }
      return { cfg, connectionId };
    }

    // 5. Fallback: workspaces.settings.facebook_automation (mirrors PUT /api/facebook/automation & facebookOutbound.ts)
    try {
      const { data: wsRows } = await supabaseAdmin
        .from('workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .limit(1);
      const wsSettings = (wsRows?.[0]?.settings as Record<string, unknown> | undefined) || {};
      const fbSettings = wsSettings.facebook_automation as Record<string, unknown> | undefined;
      if (fbSettings && fbSettings.enabled === true) {
        return {
          cfg: {
            ...fbSettings,
            workspace_id: (fbSettings.workspace_id as string | undefined) || workspaceId,
            page_id: PLACEHOLDER_PAGE_IDS.has(String(fbSettings.page_id || '')) ? pageId : String(fbSettings.page_id),
          },
          connectionId,
        };
      }
    } catch (wsErr) {
      logger.debug('Facebook workspace settings fallback lookup failed', {
        workspaceId,
        error: wsErr instanceof Error ? wsErr.message : String(wsErr),
      });
    }
  }

  return null;
}
