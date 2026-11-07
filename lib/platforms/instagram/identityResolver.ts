/**
 * lib/platforms/instagram/identityResolver.ts
 *
 * Centralized, multi-tenant Instagram account identity resolution engine.
 * Distinguishes App-Scoped User IDs (ASID), Instagram Business/Professional Account IDs (IGID),
 * and Webhook entry IDs.
 *
 * Guarantees:
 * 1. Strict multi-tenant isolation — no cross-tenant fallback or wildcards.
 * 2. Self-healing dynamic introspection — discovers and links unmapped IGIDs on first event.
 * 3. O(1) indexed persistence via metadata and scoped alias tags.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/crypto/encryption';
import { logger } from '@/lib/logger';
import { API_VERSIONS } from '@/lib/platforms/apiVersions';

export interface ResolveInstagramConnectionOptions {
  mediaId?: string;
  commentId?: string;
  senderId?: string;
}

// In-memory negative cache to prevent introspection storms on unknown IDs (TTL: 5 minutes)
const negativeCache = new Map<string, number>();
const NEGATIVE_CACHE_TTL_MS = 5 * 60 * 1000;

export function clearIdentityCache(): void {
  negativeCache.clear();
}

/**
 * Resolves an incoming webhook igUserId (or mediaId) to its owning platform_connection.
 * Returns null if the event does not belong to any active connected account.
 * NEVER routes to an unrelated fallback account.
 */
export async function resolveInstagramConnection(
  igUserId: string,
  options: ResolveInstagramConnectionOptions = {}
): Promise<any | null> {
  if (!igUserId) return null;

  // 1. Direct match: platform_user_id === igUserId
  const { data: directMatch } = await supabaseAdmin
    .from('platform_connections')
    .select('*')
    .eq('platform', 'instagram')
    .eq('platform_user_id', igUserId)
    .eq('status', 'connected')
    .limit(1);

  if (directMatch && directMatch.length > 0) {
    return directMatch[0];
  }

  // 2. Scoped alias tag match in scopes JSONB array (e.g. ['ig_business_id:178414...'])
  const aliasTag = `ig_business_id:${igUserId}`;
  try {
    const { data: scopeMatches } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('platform', 'instagram')
      .eq('status', 'connected')
      .contains('scopes', [aliasTag])
      .limit(1);

    if (scopeMatches && scopeMatches.length > 0) {
      return scopeMatches[0];
    }
  } catch (err) {
    logger.debug('JSONB scopes contains query not supported or failed', { error: err });
  }

  // 3. Metadata column match if metadata JSONB column exists
  try {
    const { data: metaMatches } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('platform', 'instagram')
      .eq('status', 'connected')
      .filter('metadata->>instagram_business_account_id', 'eq', igUserId)
      .limit(1);

    if (metaMatches && metaMatches.length > 0) {
      return metaMatches[0];
    }
  } catch (err) {
    logger.debug('Metadata filter query not supported or failed', { error: err });
  }

  // 4. Context-assisted resolution: Check if mediaId belongs to a known post or comment log
  if (options.mediaId) {
    try {
      // Check platform_posts
      const { data: postData } = await supabaseAdmin
        .from('platform_posts')
        .select('platform_connection_id')
        .eq('platform_post_id', options.mediaId)
        .limit(1);

      if (postData && postData.length > 0 && postData[0].platform_connection_id) {
        const { data: conn } = await supabaseAdmin
          .from('platform_connections')
          .select('*')
          .eq('id', postData[0].platform_connection_id)
          .eq('status', 'connected')
          .maybeSingle();

        if (conn) {
          logger.info('Resolved Instagram connection via platform_posts context', {
            igUserId,
            mediaId: options.mediaId,
            connectionId: conn.id,
            username: conn.username,
          });
          // Persist the alias for future instant lookup
          await linkInstagramBusinessAccount(conn.id, igUserId);
          return conn;
        }
      }

      // Check instagram_comment_logs
      const { data: logData } = await supabaseAdmin
        .from('instagram_comment_logs')
        .select('workspace_id')
        .eq('media_id', options.mediaId)
        .limit(1);

      if (logData && logData.length > 0 && logData[0].workspace_id) {
        const { data: conn } = await supabaseAdmin
          .from('platform_connections')
          .select('*')
          .eq('workspace_id', logData[0].workspace_id)
          .eq('platform', 'instagram')
          .eq('status', 'connected')
          .maybeSingle();

        if (conn) {
          logger.info('Resolved Instagram connection via instagram_comment_logs context', {
            igUserId,
            mediaId: options.mediaId,
            connectionId: conn.id,
            username: conn.username,
          });
          await linkInstagramBusinessAccount(conn.id, igUserId);
          return conn;
        }
      }
    } catch (ctxErr) {
      logger.debug('Context-assisted lookup encountered error', { error: ctxErr });
    }
  }

  // 5. Negative cache check before introspection
  const cachedNegativeAt = negativeCache.get(igUserId);
  if (cachedNegativeAt && Date.now() - cachedNegativeAt < NEGATIVE_CACHE_TTL_MS) {
    logger.debug('Identity resolver: igUserId recently rejected (negative cache hit)', { igUserId });
    return null;
  }

  // 6. Dynamic Self-Healing Introspection:
  // For active connected Instagram accounts, verify which account owns this igUserId by querying Meta
  try {
    const { data: allActive } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('platform', 'instagram')
      .eq('status', 'connected');

    if (allActive && allActive.length > 0) {
      for (const conn of allActive) {
        try {
          const accessToken = await decryptToken(conn.access_token_encrypted);
          if (!accessToken) continue;

          // Introspect /me for both user_id and id
          const meUrl = `https://graph.instagram.com/${API_VERSIONS.instagram}/me?fields=id,username,user_id&access_token=${encodeURIComponent(accessToken)}`;
          const meRes = await fetch(meUrl);
          if (meRes.ok) {
            const meData = await meRes.json();
            const matchedIgId = meData.user_id ? String(meData.user_id) : null;
            const matchedUserId = meData.id ? String(meData.id) : null;

            if (matchedIgId === igUserId || matchedUserId === igUserId) {
              logger.info('Self-healing identity resolver: successfully linked unmapped igUserId to connection', {
                igUserId,
                connectionId: conn.id,
                username: conn.username,
                workspaceId: conn.workspace_id,
              });
              await linkInstagramBusinessAccount(conn.id, igUserId);
              return conn;
            }
          }
        } catch (introspectionErr) {
          logger.debug('Introspection attempt for connection skipped', {
            connectionId: conn.id,
            error: introspectionErr instanceof Error ? introspectionErr.message : String(introspectionErr),
          });
        }
      }
    }
  } catch (err) {
    logger.warn('Dynamic self-healing introspection failed', { igUserId, error: err });
  }

  // 7. Strict Multi-Tenant Enforcement:
  // If NO active connection owns this igUserId, safely discard without routing to ANY other account!
  logger.warn('Unmapped Instagram webhook event discarded — zero cross-tenant fallback', {
    igUserId,
    mediaId: options.mediaId,
  });
  negativeCache.set(igUserId, Date.now());
  return null;
}

/**
 * Persists an Instagram Business/Professional Account ID alias to a connection
 * so subsequent lookups are O(1).
 */
export async function linkInstagramBusinessAccount(
  connectionId: string,
  igBusinessId: string
): Promise<void> {
  if (!connectionId || !igBusinessId) return;

  try {
    const { data: conn } = await supabaseAdmin
      .from('platform_connections')
      .select('scopes, metadata')
      .eq('id', connectionId)
      .maybeSingle();

    if (!conn) return;

    const aliasTag = `ig_business_id:${igBusinessId}`;
    const scopesList = Array.isArray(conn.scopes) ? [...conn.scopes] : [];
    let updated = false;

    if (!scopesList.includes(aliasTag)) {
      scopesList.push(aliasTag);
      updated = true;
    }

    const currentMeta = (conn.metadata && typeof conn.metadata === 'object')
      ? { ...conn.metadata }
      : {};

    if (currentMeta.instagram_business_account_id !== igBusinessId) {
      currentMeta.instagram_business_account_id = igBusinessId;
      updated = true;
    }

    if (updated) {
      // Update scopes (safe on all DB versions) and metadata (if column exists)
      const updatePayload: Record<string, unknown> = {
        scopes: scopesList,
        updated_at: new Date().toISOString(),
      };

      try {
        await supabaseAdmin
          .from('platform_connections')
          .update({ ...updatePayload, metadata: currentMeta })
          .eq('id', connectionId);
      } catch {
        // Fallback if metadata column doesn't exist
        await supabaseAdmin
          .from('platform_connections')
          .update(updatePayload)
          .eq('id', connectionId);
      }

      logger.info('Successfully linked Instagram business ID to connection', {
        connectionId,
        igBusinessId,
      });
    }
  } catch (err) {
    logger.warn('Failed to link Instagram business ID to connection', {
      connectionId,
      igBusinessId,
      error: err,
    });
  }
}
