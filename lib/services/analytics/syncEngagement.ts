import { config } from '@/lib/config/schema';
import { decryptToken } from '@/lib/crypto/encryption';
import { getPlatformAdapter } from '@/lib/platforms';
import {
  extractExtendedEngagement,
  extractNormalizedEngagement,
  UniversalEngagement,
} from './normalize';
import { isPublishOnlyPlatform, canonicalPlatformId } from '@/lib/analytics/platformCapabilities';
import { TokenExpiredError } from '@/lib/utils/retry';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  skippedCount: number;
  unsupportedCount: number;
  expiredTokenCount: number;
  rateLimitedCount: number;
  postsEngagement: Record<string, UniversalEngagement>; // keyed by platform_post.id
  errors: Array<{ platform: string; platformPostId: string; code: string; message: string }>;
}

const inflightWorkspaceSyncs = new Map<string, Promise<SyncResult>>();

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === 'PGRST204' ||
    e.code === '42703' ||
    String(e.message || '').includes('sync_status') ||
    String(e.message || '').includes('last_synced_at')
  );
}

function sanitizeSyncError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err || 'Sync failed');
  return msg
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]')
    .slice(0, 220);
}

/**
 * Synchronizes real engagement metrics from social platform APIs directly into platform_posts table.
 * Coalesces concurrent requests per (workspaceId, forceRefresh) to prevent redundant external API bursts.
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
  const inflightKey = !postIds || postIds.length === 0
    ? `${workspaceId}:${forceRefresh ? 'force' : 'auto'}`
    : null;

  if (inflightKey && inflightWorkspaceSyncs.has(inflightKey)) {
    return inflightWorkspaceSyncs.get(inflightKey)!;
  }

  const runPromise = (async (): Promise<SyncResult> => {
    const result: SyncResult = {
      syncedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      unsupportedCount: 0,
      expiredTokenCount: 0,
      rateLimitedCount: 0,
      postsEngagement: {},
      errors: [],
    };

    try {
      // 1. Fetch all connected platforms for this workspace (multi-account aware)
      const { data: connections, error: connError } = await supabaseAdmin
        .from('platform_connections')
        .select('id, platform, access_token_encrypted, status')
        .eq('workspace_id', workspaceId)
        .eq('status', 'connected');

      if (connError || !connections || connections.length === 0) {
        return result;
      }

      const connectionMap = new Map<string, { id: string; platform: string; token: string }>();
      for (const conn of connections) {
        try {
          const decrypted = await decryptToken(conn.access_token_encrypted);
          connectionMap.set(conn.id, {
            id: conn.id,
            platform: canonicalPlatformId(conn.platform),
            token: decrypted,
          });
        } catch {
          logger.warn('Failed to decrypt connection token for engagement sync', {
            connectionId: conn.id,
            platform: conn.platform,
          });
        }
      }

      if (connectionMap.size === 0) {
        return result;
      }

      // 2. Fetch platform_posts for published posts in this workspace
      const fetchLimit = Math.max(maxPosts * 3, 120);
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
            platform_connection_id,
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

      // Partition posts by platform to ensure multi-platform fairness
      const postsByPlatform = new Map<string, any[]>();
      for (const pp of rawPPosts as any[]) {
        const variantObj = Array.isArray(pp.post_variant) ? pp.post_variant[0] : pp.post_variant;
        const p = canonicalPlatformId(String(variantObj?.platform || ''));
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
      const snapshotsToInsert: Array<Record<string, unknown>> = [];

      const updatePlatformPostSafe = async (ppId: string, fields: Record<string, unknown>) => {
        const { error: upErr } = await supabaseAdmin
          .from('platform_posts')
          .update(fields)
          .eq('id', ppId);
        if (upErr && isMissingColumnError(upErr)) {
          const fallbackFields = { ...fields };
          delete fallbackFields.sync_status;
          delete fallbackFields.sync_error;
          delete fallbackFields.last_synced_at;
          await supabaseAdmin.from('platform_posts').update(fallbackFields).eq('id', ppId);
        }
      };

      // 3. Sync each platform post with timeout protection
      await Promise.all(
        pPosts.map(async (pp: any) => {
          const platformPostId = pp.platform_post_id;
          const variantObj = Array.isArray(pp.post_variant) ? pp.post_variant[0] : pp.post_variant;
          const targetConnId = pp.platform_connection_id || variantObj?.platform_connection_id;
          let connInfo = targetConnId ? connectionMap.get(targetConnId) : undefined;
          const platform = canonicalPlatformId(
            connInfo?.platform || String(variantObj?.platform || '')
          );

          // Skip publish-only channels cleanly without wasting network timeouts
          if (isPublishOnlyPlatform(platform)) {
            result.unsupportedCount++;
            result.postsEngagement[pp.id] = extractNormalizedEngagement(pp.engagement);
            return;
          }

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

          const lastSyncedStr = pp.engagement?.syncedAt || pp.engagement?._lastSyncedAt;
          const lastSyncedMs = lastSyncedStr ? new Date(lastSyncedStr).getTime() : 0;
          if (!forceRefresh && lastSyncedMs > thirtyMinutesAgo) {
            result.skippedCount++;
            result.postsEngagement[pp.id] = extractNormalizedEngagement(pp.engagement);
            return;
          }

          const adapter = getPlatformAdapter(platform);
          if (!adapter || typeof adapter.getEngagement !== 'function') {
            result.unsupportedCount++;
            result.postsEngagement[pp.id] = extractNormalizedEngagement(pp.engagement);
            return;
          }

          try {
            const fetchPromise = adapter.getEngagement(connInfo.token, platformPostId);
            const timeoutPromise = new Promise<Record<string, unknown>>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 6000)
            );

            const rawEngagement = await Promise.race([fetchPromise, timeoutPromise]);
            const rawObj = rawEngagement && typeof rawEngagement === 'object' ? rawEngagement : {};
            const nowIso = new Date().toISOString();

            const freshNormalized = extractNormalizedEngagement({
              ...rawObj,
              syncedAt: nowIso,
            });
            const prevNormalized = extractNormalizedEngagement(pp.engagement);
            const freshExt = extractExtendedEngagement({ ...rawObj, syncedAt: nowIso });
            const prevExt = extractExtendedEngagement(pp.engagement);

            const hasFreshPositiveSignal =
              Object.keys(rawObj).length > 0 &&
              (freshExt.total > 0 ||
                freshExt.views > 0 ||
                freshExt.clicks > 0 ||
                freshExt.saves > 0 ||
                rawObj.hasRealData === true ||
                Object.keys(rawObj).some(k => !k.startsWith('_') && typeof rawObj[k] === 'number'));

            const normalized = hasFreshPositiveSignal
              ? freshNormalized
              : prevNormalized.hasRealData
              ? prevNormalized
              : freshNormalized;
            const activeExt = hasFreshPositiveSignal
              ? freshExt
              : prevExt.hasRealData
              ? prevExt
              : freshExt;

            const updatedPayload: Record<string, unknown> = {
              ...(pp.engagement || {}),
              ...(hasFreshPositiveSignal ? rawObj : {}),
              syncedAt: nowIso,
              _lastSyncedAt: nowIso,
              _syncError: null,
              _normalized: normalized,
            };

            const updateFields: Record<string, unknown> = {
              engagement: updatedPayload,
              sync_status: 'synced',
              sync_error: null,
              last_synced_at: nowIso,
            };
            if (connInfo.id && pp.platform_connection_id !== connInfo.id) {
              updateFields.platform_connection_id = connInfo.id;
            }

            await updatePlatformPostSafe(pp.id, updateFields);

            if (
              hasFreshPositiveSignal &&
              (freshExt.total !== prevExt.total ||
                freshExt.views !== prevExt.views ||
                freshExt.clicks !== prevExt.clicks)
            ) {
              snapshotsToInsert.push({
                workspace_id: workspaceId,
                platform_post_id: pp.id,
                post_id: variantObj?.post_id ?? null,
                platform,
                platform_connection_id: connInfo.id,
                captured_at: nowIso,
                likes: activeExt.likes,
                comments: activeExt.comments,
                shares: activeExt.shares,
                saves: activeExt.saves,
                clicks: activeExt.clicks,
                views: activeExt.views > 0 ? activeExt.views : null,
                total_engagements: activeExt.total,
                raw_metrics: rawObj,
              });
            }

            result.syncedCount++;
            result.postsEngagement[pp.id] = normalized;
          } catch (syncErr) {
            const nowIso = new Date().toISOString();
            const safeMsg = sanitizeSyncError(syncErr);
            const isExpired = syncErr instanceof TokenExpiredError || /token.*expired|401/i.test(safeMsg);
            const isRateLimited = /429|rate.?limit/i.test(safeMsg);
            const syncStatus = isExpired ? 'token_expired' : isRateLimited ? 'rate_limited' : 'error';

            if (isExpired) result.expiredTokenCount++;
            else if (isRateLimited) result.rateLimitedCount++;
            result.failedCount++;
            result.errors.push({ platform, platformPostId, code: syncStatus, message: safeMsg });

            const preservedPayload = {
              ...(pp.engagement || {}),
              _syncError: safeMsg,
              _syncErrorCode: syncStatus,
              _lastAttemptAt: nowIso,
            };
            await updatePlatformPostSafe(pp.id, {
              engagement: preservedPayload,
              sync_status: syncStatus,
              sync_error: safeMsg,
            }).catch(() => {});

            result.postsEngagement[pp.id] = extractNormalizedEngagement(pp.engagement);
          }
        })
      );

      if (snapshotsToInsert.length > 0 && typeof config !== 'undefined') {
        try {
          await supabaseAdmin.from('post_engagement_snapshots').insert(snapshotsToInsert);
        } catch {
          // Table may not yet exist if migration pending
        }
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Workspace engagement sync encountered an unexpected error', { error: err });
      return result;
    }
  })();

  if (inflightKey) {
    inflightWorkspaceSyncs.set(inflightKey, runPromise);
    runPromise.finally(() => {
      inflightWorkspaceSyncs.delete(inflightKey);
    });
  }

  return runPromise;
}
