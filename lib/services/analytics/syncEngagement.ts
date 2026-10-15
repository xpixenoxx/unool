import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { decryptToken } from '@/lib/crypto/encryption';
import { getPlatformAdapter } from '@/lib/platforms';
import { extractNormalizedEngagement, UniversalEngagement } from './normalize';
import { logger } from '@/lib/logger';

const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

interface SyncResult {
  syncedCount: number;
  failedCount: number;
  skippedCount: number;
  postsEngagement: Record<string, UniversalEngagement>; // keyed by platform_post.id
}

/**
 * Synchronizes real engagement metrics from social platform APIs directly into platform_posts table.
 */
export async function syncWorkspaceEngagement(
  workspaceId: string,
  options: {
    maxPosts?: number;
    forceRefresh?: boolean;
    postIds?: string[];
  } = {}
): Promise<SyncResult> {
  const { maxPosts = 25, forceRefresh = false, postIds } = options;
  const result: SyncResult = {
    syncedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    postsEngagement: {},
  };

  try {
    // 1. Fetch all connected platforms for this workspace
    const { data: connections, error: connError } = await admin
      .from('platform_connections')
      .select('id, platform, access_token_encrypted, status')
      .eq('workspace_id', workspaceId)
      .eq('status', 'connected');

    if (connError || !connections || connections.length === 0) {
      return result;
    }

    // Map connections by ID and platform
    const connectionMap = new Map<string, { platform: string; token: string }>();
    for (const conn of connections) {
      try {
        const decrypted = await decryptToken(conn.access_token_encrypted);
        connectionMap.set(conn.id, { platform: conn.platform, token: decrypted });
      } catch (err) {
        logger.warn('Failed to decrypt connection token for engagement sync', { connectionId: conn.id, platform: conn.platform });
      }
    }

    if (connectionMap.size === 0) {
      return result;
    }

    // 2. Fetch platform_posts for published posts in this workspace
    let query = admin
      .from('platform_posts')
      .select(`
        id,
        post_variant_id,
        platform_connection_id,
        platform_post_id,
        platform_url,
        engagement,
        created_at,
        post_variant:post_variant_id!inner(
          post_id,
          platform,
          post:post_id!inner(workspace_id, status)
        )
      `)
      .eq('post_variant.post.workspace_id', workspaceId)
      .not('platform_post_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(maxPosts);

    if (postIds && postIds.length > 0) {
      query = query.in('post_variant.post_id', postIds);
    }

    const { data: pPosts, error: ppError } = await query;
    if (ppError || !pPosts || pPosts.length === 0) {
      return result;
    }

    const now = Date.now();
    const thirtyMinutesAgo = now - 30 * 60 * 1000;

    // 3. Sync each platform post with timeout protection
    await Promise.all(
      pPosts.map(async (pp: any) => {
        const platformPostId = pp.platform_post_id;
        const connInfo = connectionMap.get(pp.platform_connection_id);
        const platform = connInfo?.platform || (pp.post_variant?.platform as string);

        if (!platformPostId || !connInfo) {
          result.skippedCount++;
          result.postsEngagement[pp.id] = extractNormalizedEngagement(pp.engagement);
          return;
        }

        // Check if recently synced
        const lastSyncedAt = pp.engagement?.syncedAt ? new Date(pp.engagement.syncedAt).getTime() : 0;
        if (!forceRefresh && lastSyncedAt > thirtyMinutesAgo) {
          result.skippedCount++;
          result.postsEngagement[pp.id] = extractNormalizedEngagement(pp.engagement);
          return;
        }

        const adapter = getPlatformAdapter(platform);
        if (!adapter || typeof adapter.getEngagement !== 'function') {
          result.skippedCount++;
          result.postsEngagement[pp.id] = extractNormalizedEngagement(pp.engagement);
          return;
        }

        try {
          // Fetch engagement with 4s timeout per platform
          const fetchPromise = adapter.getEngagement(connInfo.token, platformPostId);
          const timeoutPromise = new Promise<Record<string, unknown>>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 4000)
          );

          const rawEngagement = await Promise.race([fetchPromise, timeoutPromise]);
          const normalized = extractNormalizedEngagement({
            ...rawEngagement,
            syncedAt: new Date().toISOString(),
          });

          // Persist to Supabase
          const updatedPayload = {
            ...(pp.engagement || {}),
            ...rawEngagement,
            syncedAt: new Date().toISOString(),
            _normalized: normalized,
          };

          await admin
            .from('platform_posts')
            .update({ engagement: updatedPayload })
            .eq('id', pp.id);

          result.syncedCount++;
          result.postsEngagement[pp.id] = normalized;
        } catch (syncErr) {
          result.failedCount++;
          // Fallback to existing engagement
          result.postsEngagement[pp.id] = extractNormalizedEngagement(pp.engagement);
        }
      })
    );

    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Workspace engagement sync encountered an unexpected error', { error: err });
    return result;
  }
}
