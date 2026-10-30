import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';
import { Result, ok, err } from '@/lib/shared/Result';
import { decryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import {
  getPlatformAdapter,
  type PublishInput,
} from '@/lib/platforms';
import type { Platform } from '@/lib/repositories/interfaces/IPostRepository';
import { TokenExpiredError } from '@/lib/utils/retry';
import { getPlatformLimit } from '@/lib/config/platformLimits';

const platformRepository = new SupabasePlatformRepository();
const postRepository = new SupabasePostRepository();

export interface PublishJobInput {
  postVariantId: string;
  platform: Platform;
  workspaceId: string;
}

export interface PublishJobResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
}

export class PublishService {
  async publishPost(input: PublishJobInput): Promise<Result<PublishJobResult, Error>> {
    const adapter = getPlatformAdapter(input.platform);
    if (!adapter) {
      await postRepository.updateVariant(input.postVariantId, {
        status: 'failed',
        error: { code: 'UNSUPPORTED_PLATFORM', message: `Unsupported platform: ${input.platform}` },
      });
      return err(new Error(`Unsupported platform: ${input.platform}`));
    }

    // Get platform connection for workspace
    const connection = await platformRepository.findByWorkspaceAndPlatform(input.workspaceId, input.platform);

    let isKickStreamReady = false;
    if (input.platform === 'kick' && connection?.accessTokenEncrypted) {
      try {
        const decrypted = await decryptToken(connection.accessTokenEncrypted);
        const parsed = JSON.parse(decrypted);
        if (parsed?.streamUrl && parsed?.streamKey) {
          isKickStreamReady = true;
        }
      } catch {
        // Stream credentials not present or failed to decrypt
      }
    }

    if (!connection || (connection.status !== 'connected' && !isKickStreamReady)) {
      const errorMsg = `No active connection for ${input.platform}. Please connect this platform in settings.`;
      await postRepository.updateVariant(input.postVariantId, {
        status: 'failed',
        error: { code: 'NO_CONNECTION', message: errorMsg },
      });
      return err(new Error(errorMsg));
    }

    // Auto-heal connection status in DB if Kick stream credentials are ready
    if (input.platform === 'kick' && isKickStreamReady && connection.status !== 'connected') {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
        await adminSupabase
          .from('platform_connections')
          .update({ status: 'connected', updated_at: new Date().toISOString() })
          .eq('id', connection.id);
      } catch {}
    }

    // Get post variant with adapted content
    const variant = await postRepository.findVariantById(input.postVariantId);
    if (!variant) {
      return err(new Error(`Post variant not found: ${input.postVariantId}`));
    }

    // If variant is marked as failed due to unresolvable media validation, do not attempt to publish
    if (variant.status === 'failed' && variant.error?.code === 'MEDIA_VALIDATION_FAILED') {
      logger.info('Variant is already marked as failed due to media validation, skipping publish', { variantId: variant.id, platform: variant.platform });
      return ok({
        success: false,
        error: variant.error?.message || 'Variant marked as failed prior to publishing',
      });
    }

    // Decrypt access token
    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.accessTokenEncrypted);
    } catch (error) {
      const decryptionError = error instanceof Error ? error : new Error(String(error));
      logger.error('Token decryption failed', { error: decryptionError, connectionId: connection.id });
      await postRepository.updateVariant(input.postVariantId, {
        status: 'failed',
        error: { code: 'DECRYPTION_FAILED', message: 'Failed to decrypt access token. Please reconnect account.' },
      });
      return err(new Error('Failed to decrypt access token'));
    }

    // Prepare publish input
    // Normalize mediaUrls — DB may contain either PostMedia objects {url,type} or legacy plain strings
    const mediaUrls: string[] = (variant.mediaUrls || [])
      .map((m: any) => {
        if (typeof m === 'string') return m as string;
        if (m && typeof m === 'object' && typeof m.url === 'string') return m.url;
        return null;
      })
      .filter((u): u is string => typeof u === 'string' && u.length > 0);

    const publishInput: PublishInput = {
      content: variant.adaptedContent,
      mediaUrls,
      firstComment: variant.firstCommentHint || undefined,
      platformUserId: connection.platformUserId || undefined,
      username: connection.username || undefined,
    };

    logger.info('PublishService: prepared publish input', {
      platform: input.platform,
      mediaCount: mediaUrls.length,
      mediaUrls: mediaUrls.map(u => u.substring(0, 80)),
    });

    const limit = getPlatformLimit(input.platform);
    if (limit.requiresMedia && mediaUrls.length === 0) {
      const friendlyName = input.platform.charAt(0).toUpperCase() + input.platform.slice(1);
      const errMsg = `${friendlyName} requires an image to be uploaded. Please attach media to publish to this platform.`;
      await postRepository.updateVariant(input.postVariantId, {
        status: 'failed',
        error: { code: 'MEDIA_REQUIRED', message: errMsg },
      });
      return ok({
        success: false,
        error: errMsg,
      });
    }

    // Attempt publish with automatic token refresh on 401
    const attemptPublish = async (currentAccessToken: string, hasRetried: boolean): Promise<PublishJobResult> => {
      try {
        const result = await adapter.publish(currentAccessToken, publishInput);

        // Save platform post record
        await platformRepository.createPlatformPost({
          postVariantId: input.postVariantId,
          platformConnectionId: connection.id,
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
          engagement: {},
        });

        // Update variant status
        await postRepository.updateVariant(input.postVariantId, {
          status: 'published',
          platformPostId: result.platformPostId,
        });

        logger.info('Post published successfully', {
          platform: input.platform,
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
        });

        return {
          success: true,
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Check if this is a token expiry error and we haven't retried yet
        if (!hasRetried && err instanceof TokenExpiredError) {
          logger.info('Token expired, attempting refresh', { platform: input.platform, connectionId: connection.id });

          const refreshResult = await this.refreshPlatformToken(connection.id);
          if (refreshResult.ok) {
            // Retry with new token
            try {
              const newAccessToken = await decryptToken(refreshResult.value);
              return await attemptPublish(newAccessToken, true);
            } catch (decryptError) {
              const decryptErr = decryptError instanceof Error ? decryptError : new Error(String(decryptError));
              logger.error('Failed to decrypt refreshed token', { error: decryptErr });
            }
          } else {
            logger.error('Token refresh failed', { error: refreshResult.error, connectionId: connection.id });
            // Mark connection as error
            await platformRepository.updateStatus(connection.id, 'error');
          }
        }

        // Update variant with error
        await postRepository.updateVariant(input.postVariantId, {
          status: 'failed',
          error: { code: 'PUBLISH_FAILED', message: err.message },
        });

        logger.error('Publish failed', { error: err, platform: input.platform });

        return {
          success: false,
          error: err.message,
        };
      }
    };

    return ok(await attemptPublish(accessToken, false));
  }

  async publishToAllPlatforms(
    postId: string,
    workspaceId: string
  ): Promise<Record<Platform, PublishJobResult>> {
    // Lookup post to ensure guaranteed workspaceId
    const post = await postRepository.findById(postId);
    const resolvedWorkspaceId = post?.workspaceId || workspaceId;

    // Ensure parent post status is set to 'publishing' immediately
    await postRepository.updateStatus(postId, 'publishing');

    // Get all variants for this post
    const variants = await postRepository.findVariantsByPostId(postId);
    const results: Record<string, PublishJobResult> = {};

    // Mark non-published variants as 'publishing' so UI reflects progress in real time
    for (const v of variants) {
      if (v.status !== 'published') {
        await postRepository.updateVariant(v.id, { status: 'publishing', error: null });
        v.status = 'publishing';
        v.error = null;
      }
    }

    // Publish each variant to its platform in parallel
    logger.info('PublishService: publishing to all platforms', {
      postId,
      workspaceId: resolvedWorkspaceId,
      variantCount: variants.length,
      platforms: variants.map(v => v.platform),
    });

    const publishPromises = variants.map(async (variant) => {
      if (variant.status === 'published') {
        logger.info(`PublishService: variant ${variant.platform} already published — skipping duplicate dispatch`, {
          postId,
          variantId: variant.id,
        });
        return {
          platform: variant.platform,
          result: ok({
            success: true,
            platformPostId: variant.platformPostId || undefined,
          }),
        };
      }

      logger.info(`PublishService: starting publish for ${variant.platform}`, {
        postId,
        variantId: variant.id,
        platform: variant.platform,
      });
      const result = await this.publishPost({
        postVariantId: variant.id,
        platform: variant.platform,
        workspaceId: resolvedWorkspaceId,
      });
      const jobResult = result.ok ? result.value : { success: false, error: result.error?.message };
      logger.info(`PublishService: finished publish for ${variant.platform}`, {
        postId,
        platform: variant.platform,
        success: jobResult.success,
        error: jobResult.success ? undefined : jobResult.error,
      });
      return { platform: variant.platform, result };
    });

    const publishedResults = await Promise.all(publishPromises);

    for (const { platform, result } of publishedResults) {
      results[platform] = result.ok ? result.value : { success: false, error: result.error?.message };
    }

    // Update parent post status based on variant results
    const hasAnySuccess = Object.values(results).some((r: any) => r.success);
    const hasAnyAttempt = Object.keys(results).length > 0;
    
    if (hasAnyAttempt) {
      const overallStatus = hasAnySuccess ? 'published' : 'failed';
      await postRepository.updateStatus(postId, overallStatus);
    }

    return results as Record<Platform, PublishJobResult>;
  }

  async refreshPlatformToken(connectionId: string): Promise<Result<string, Error>> {
    const connection = await platformRepository.findById(connectionId);
    if (!connection || !connection.refreshTokenEncrypted) {
      return err(new Error('Connection not found or no refresh token'));
    }

    const adapter = getPlatformAdapter(connection.platform);
    if (!adapter) {
      return err(new Error(`Unsupported platform: ${connection.platform}`));
    }

    try {
      let refreshToken: string;
      try {
        refreshToken = await decryptToken(connection.refreshTokenEncrypted);
      } catch {
        return err(new Error('Failed to decrypt refresh token'));
      }

      const tokenResponse = await adapter.refreshAccessToken(refreshToken);

      // Encrypt new tokens (preserving Kick stream settings)
      const { encryptToken } = await import('@/lib/crypto/encryption');
      let finalAccessTokenToEncrypt = tokenResponse.accessToken;
      if (connection.platform === 'kick') {
        try {
          const oldDecrypted = await decryptToken(connection.accessTokenEncrypted);
          const parsed = JSON.parse(oldDecrypted);
          if (parsed && typeof parsed === 'object' && (parsed.streamUrl || parsed.streamKey)) {
            finalAccessTokenToEncrypt = JSON.stringify({
              accessToken: tokenResponse.accessToken,
              streamUrl: parsed.streamUrl,
              streamKey: parsed.streamKey,
            });
          }
        } catch {}
      }
      const accessTokenEncrypted = await encryptToken(finalAccessTokenToEncrypt);
      const refreshTokenEncrypted = tokenResponse.refreshToken
        ? await encryptToken(tokenResponse.refreshToken)
        : connection.refreshTokenEncrypted;
      const expiresAt = tokenResponse.expiresIn
        ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
        : undefined;

      await platformRepository.update(connectionId, {
        accessTokenEncrypted,
        refreshTokenEncrypted,
        expiresAt,
        status: 'connected',
      });

      return ok(accessTokenEncrypted);
    } catch (error) {
      const refreshError = error instanceof Error ? error : new Error(String(error));
      logger.error('Token refresh failed', { error: refreshError, connectionId });
      await platformRepository.updateStatus(connectionId, 'error');
      return err(refreshError);
    }
  }

  async disconnectPlatform(connectionId: string): Promise<void> {
    const connection = await platformRepository.findById(connectionId);
    if (!connection) return;

    // Try to revoke token on platform side
    const adapter = getPlatformAdapter(connection.platform);
    if (adapter) {
      try {
        await decryptToken(connection.accessTokenEncrypted);
        // Note: Not all platforms support token revocation via API
        // This would be platform-specific
      } catch {
        // Ignore errors during revocation
      }
    }

    await platformRepository.delete(connectionId);
  }
}

export const publishService = new PublishService();