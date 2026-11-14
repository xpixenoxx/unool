import { config } from '@/lib/config/schema';
import { decryptToken } from '@/lib/crypto/encryption';
import { getPlatformAdapter } from '@/lib/platforms';
import { extractNormalizedEngagement, UniversalEngagement } from './normalize';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';



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
    const { data: connections, error: connError } = await supabaseAdmin
      .from('platform_connections')
      .select('id, platform, access_token_encrypted, status')
      .eq('workspace_id', workspaceId)
      .eq('status', 'connected');

    if (connError || !connections || connections.length === 0) {
      return result;
    }

    // Map connections by ID and platform
    const connectionMap = new Map<string, { id: string; platform: string; token: string }>();
    for (const conn of connections) {
      try {
        const decrypted = await decryptToken(conn.access_token_encrypted);
        connectionMap.set(conn.id, { id: conn.id, platform: conn.platform, token: decrypted });
      } catch (err) {
        logger.warn('Failed to decrypt connection token for engagement sync', { connectionId: conn.id, platform: conn.platform });
      }
    }

    if (connectionMap.size === 0) {
      return result;
    }

    // 2. Fetch platform_posts for published posts in this workspace
    const fetchLimit = Math.max(maxPosts * 3, 100);
    let query = supabaseAdmin
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
      .limit(fetchLimit);

    if (postIds && postIds.length > 0) {
      query = query.in('post_variant.post_id', postIds);
    }

    const { data: rawPPosts, error: ppError } = await query;
    if (ppError || !rawPPosts || rawPPosts.length === 0) {
      return result;
    }

    // Partition posts by platform to ensure multi-platform balance
    // (Prevents one active platform like Threads from starving LinkedIn, Bluesky, Facebook, etc.)
    const postsByPlatform = new Map<string, any[]>();
    for (const pp of rawPPosts as any[]) {
      const variantObj = Array.isArray(pp.post_variant) ? pp.post_variant[0] : pp.post_variant;
      const p = String(variantObj?.platform || '').toLowerCase();
      if (!postsByPlatform.has(p)) {
        postsByPlatform.set(p, []);
      }
      postsByPlatform.get(p)!.push(pp);
    }

    const selectedPosts: any[] = [];
    const maxPerPlatform = Math.max(Math.floor(maxPosts / Math.max(postsByPlatform.size, 1)), 10);

    for (const [, platPosts] of postsByPlatform.entries()) {
      platPosts.sort((a, b) => {
        const aSynced = a.engagement?.syncedAt ? new Date(a.engagement.syncedAt).getTime() : 0;
        const bSynced = b.engagement?.syncedAt ? new Date(b.engagement.syncedAt).getTime() : 0;
        if (!aSynced && bSynced) return -1;
        if (aSynced && !bSynced) return 1;
        return (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0);
      });
      selectedPosts.push(...platPosts.slice(0, maxPerPlatform));
    }

    const pPosts = selectedPosts.length > 0 ? selectedPosts : rawPPosts.slice(0, maxPosts);

    const now = Date.now();
    const thirtyMinutesAgo = now - 30 * 60 * 1000;

    // 3. Sync each platform post with timeout protection
    await Promise.all(
      pPosts.map(async (pp: any) => {
        const platformPostId = pp.platform_post_id;
        let connInfo = connectionMap.get(pp.platform_connection_id);
        const platform = connInfo?.platform || (pp.post_variant?.platform as string);

        // Fallback: If connection ID changed or was unlinked (e.g. user reconnected account),
        // resolve the active connection for this platform in the workspace
        if (!connInfo && platform) {
          for (const conn of connectionMap.values()) {
            if (conn.platform === platform) {
              connInfo = conn;
              break;
            }
          }
        }

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
          // Fetch engagement with 6s timeout per platform
          const fetchPromise = adapter.getEngagement(connInfo.token, platformPostId);
          const timeoutPromise = new Promise<Record<string, unknown>>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 6000)
          );

          const rawEngagement = await Promise.race([fetchPromise, timeoutPromise]);
          const rawObj = rawEngagement && typeof rawEngagement === 'object' ? rawEngagement : {};
          const hasFreshMetrics =
            Object.keys(rawObj).length > 0 &&
            (Number(rawObj.likes ?? rawObj.like_count ?? 0) > 0 ||
              Number(rawObj.comments ?? rawObj.comments_count ?? rawObj.replies ?? 0) > 0 ||
              Number(rawObj.shares ?? rawObj.reposts ?? 0) > 0 ||
              Number(rawObj.views ?? 0) > 0 ||
              rawObj.hasRealData === true);

          const prevNormalized = extractNormalizedEngagement(pp.engagement);
          const freshNormalized = extractNormalizedEngagement({
            ...rawObj,
            syncedAt: new Date().toISOString(),
          });

          // If fresh fetch has positive metrics, update; otherwise preserve valid historical metrics
          const normalized = hasFreshMetrics
            ? freshNormalized
            : prevNormalized.hasRealData
            ? prevNormalized
            : freshNormalized;

          // Persist to Supabase
          const updatedPayload = {
            ...(pp.engagement || {}),
            ...(hasFreshMetrics ? rawObj : {}),
            syncedAt: new Date().toISOString(),
            _normalized: normalized,
          };

          const updateFields: Record<string, unknown> = { engagement: updatedPayload };
          if (connInfo.id && pp.platform_connection_id !== connInfo.id) {
            updateFields.platform_connection_id = connInfo.id;
          }

          await supabaseAdmin
            .from('platform_posts')
            .update(updateFields)
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
