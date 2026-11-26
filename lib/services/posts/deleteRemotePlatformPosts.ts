import { decryptToken } from '@/lib/crypto/encryption';
import { getPlatformAdapter } from '@/lib/platforms';
import { supportsRemotePostDeletion } from '@/lib/platforms/deletionSupport';
import { canonicalPlatformId } from '@/lib/analytics/platformCapabilities';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface RemoteDeleteSuccess {
  variantId: string;
  platformPostRecordId: string;
  platform: string;
  platformPostId: string;
}

export interface RemoteDeleteFailure {
  variantId: string;
  platform: string;
  platformPostId: string;
  error: string;
}

export interface RemoteDeleteUnsupported {
  variantId: string;
  platform: string;
  reason: string;
}

export interface RemoteDeleteSummary {
  deleted: RemoteDeleteSuccess[];
  failed: RemoteDeleteFailure[];
  unsupported: RemoteDeleteUnsupported[];
}

interface VariantInput {
  id: string;
  platform?: string | null;
  platform_connection_id?: string | null;
}

/**
 * Deletes live published posts on remote social platforms for the specified post variants.
 * Never throws on individual platform failures; returns structured per-variant outcomes.
 */
export async function deleteRemotePlatformPosts(
  workspaceId: string,
  variants: VariantInput[]
): Promise<RemoteDeleteSummary> {
  const summary: RemoteDeleteSummary = {
    deleted: [],
    failed: [],
    unsupported: [],
  };

  const variantIds = variants.map((v) => v.id).filter(Boolean);
  if (variantIds.length === 0) {
    return summary;
  }

  const variantById = new Map<string, VariantInput>();
  for (const v of variants) {
    variantById.set(v.id, v);
  }

  const { data: platformPosts, error: ppError } = await supabaseAdmin
    .from('platform_posts')
    .select('id, post_variant_id, platform_connection_id, platform_post_id')
    .in('post_variant_id', variantIds)
    .not('platform_post_id', 'is', null);

  if (ppError) {
    logger.warn('Failed to load platform_posts for remote deletion', {
      workspaceId,
      error: ppError.message,
    });
    return summary;
  }

  if (!platformPosts || platformPosts.length === 0) {
    return summary;
  }

  const { data: connections, error: connError } = await supabaseAdmin
    .from('platform_connections')
    .select('id, platform, access_token_encrypted, status')
    .eq('workspace_id', workspaceId)
    .eq('status', 'connected');

  if (connError) {
    logger.warn('Failed to load platform_connections for remote deletion', {
      workspaceId,
      error: connError.message,
    });
  }

  const connectionById = new Map<string, { id: string; platform: string; tokenEncrypted: string }>();
  const connectionByPlatform = new Map<string, { id: string; platform: string; tokenEncrypted: string }>();

  for (const conn of connections || []) {
    if (!conn.access_token_encrypted) continue;
    const canonical = canonicalPlatformId(conn.platform);
    const entry = {
      id: conn.id,
      platform: canonical,
      tokenEncrypted: conn.access_token_encrypted,
    };
    connectionById.set(conn.id, entry);
    if (!connectionByPlatform.has(canonical)) {
      connectionByPlatform.set(canonical, entry);
    }
  }

  const decryptedTokens = new Map<string, string>();

  for (const pp of platformPosts as Array<{
    id: string;
    post_variant_id: string;
    platform_connection_id?: string | null;
    platform_post_id?: string | null;
  }>) {
    const platformPostId = typeof pp.platform_post_id === 'string' ? pp.platform_post_id.trim() : '';
    if (!platformPostId) continue;

    const variant = variantById.get(pp.post_variant_id);
    const targetConnId = pp.platform_connection_id || variant?.platform_connection_id || undefined;
    let conn = targetConnId ? connectionById.get(targetConnId) : undefined;
    const rawPlatform = variant?.platform || conn?.platform || '';
    const platform = canonicalPlatformId(rawPlatform);

    if (!conn && platform) {
      conn = connectionByPlatform.get(platform);
    }

    if (!platform || !supportsRemotePostDeletion(platform)) {
      summary.unsupported.push({
        variantId: pp.post_variant_id,
        platform: platform || 'unknown',
        reason:
          platform === 'instagram'
            ? 'Instagram API does not support deleting published posts.'
            : 'Platform does not support remote post deletion.',
      });
      continue;
    }

    const adapter = getPlatformAdapter(platform);
    if (!adapter || typeof adapter.deletePost !== 'function') {
      summary.unsupported.push({
        variantId: pp.post_variant_id,
        platform,
        reason: 'Platform adapter does not support remote post deletion.',
      });
      continue;
    }

    if (!conn) {
      summary.failed.push({
        variantId: pp.post_variant_id,
        platform,
        platformPostId,
        error: `No active ${platform} connection found for this workspace.`,
      });
      continue;
    }

    let accessToken = decryptedTokens.get(conn.id);
    if (!accessToken) {
      try {
        accessToken = await decryptToken(conn.tokenEncrypted);
        decryptedTokens.set(conn.id, accessToken);
      } catch (decErr) {
        summary.failed.push({
          variantId: pp.post_variant_id,
          platform,
          platformPostId,
          error: decErr instanceof Error ? decErr.message : 'Failed to decrypt access token',
        });
        continue;
      }
    }

    try {
      await adapter.deletePost(accessToken, platformPostId);
      summary.deleted.push({
        variantId: pp.post_variant_id,
        platformPostRecordId: pp.id,
        platform,
        platformPostId,
      });
      logger.info('Deleted remote platform post', {
        workspaceId,
        platform,
        platformPostId,
        variantId: pp.post_variant_id,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('Remote platform post deletion failed', {
        workspaceId,
        platform,
        platformPostId,
        variantId: pp.post_variant_id,
        error: msg,
      });
      summary.failed.push({
        variantId: pp.post_variant_id,
        platform,
        platformPostId,
        error: msg,
      });
    }
  }

  return summary;
}
