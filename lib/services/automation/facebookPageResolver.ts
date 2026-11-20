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

type ConnRow = { id: string; workspace_id: string; scopes: string[] | null; access_token_encrypted?: string };

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
  let { data: conns } = await supabaseAdmin
    .from('platform_connections')
    .select('id, workspace_id, scopes')
    .eq('platform', 'facebook')
    .eq('status', 'connected')
    .contains('scopes', [tag])
    .order('updated_at', { ascending: false })
    .limit(20);

  // 2. Fallback: legacy untagged connections — discover + tag lazily
  if (!conns || conns.length === 0) {
    conns = await tagLegacyConnections(pageId);
  }

  // 3. Config explicitly bound to this page (supports configs whose connection tag is missing)
  const { data: exactCfgs } = await supabaseAdmin
    .from('facebook_automation_config')
    .select('*')
    .eq('page_id', pageId)
    .eq('enabled', true)
    .limit(5);

  const candidateWorkspaces = new Map<string, string>(); // workspaceId -> connectionId
  for (const c of conns || []) {
    if (!candidateWorkspaces.has(c.workspace_id)) candidateWorkspaces.set(c.workspace_id, c.id);
  }

  for (const exact of exactCfgs || []) {
    let connectionId = candidateWorkspaces.get(exact.workspace_id);
    if (!connectionId) {
      const { data: wsConn } = await supabaseAdmin
        .from('platform_connections')
        .select('id')
        .eq('workspace_id', exact.workspace_id)
        .eq('platform', 'facebook')
        .eq('status', 'connected')
        .order('updated_at', { ascending: false })
        .limit(1);
      connectionId = wsConn?.[0]?.id;
    }
    if (connectionId) return { cfg: exact, connectionId };
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
    if (!cfg) continue;

    if (PLACEHOLDER_PAGE_IDS.has(cfg.page_id || '')) {
      await supabaseAdmin
        .from('facebook_automation_config')
        .update({ page_id: pageId })
        .eq('workspace_id', workspaceId);
      cfg.page_id = pageId;
    }
    return { cfg, connectionId };
  }

  return null;
}
