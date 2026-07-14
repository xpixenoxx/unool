import { logger } from '@/lib/logger';
import { Result, ok, err } from '@/lib/shared/Result';
import { decryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import {
  getPlatformAdapter,
  type PublishInput,
} from '@/lib/platforms';
import type { Platform } from '@/lib/repositories/interfaces/IPostRepository';

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
      return err(new Error(`Unsupported platform: ${input.platform}`));
    }

    // Get platform connection for workspace
    const connection = await platformRepository.findByWorkspaceAndPlatform(input.workspaceId, input.platform);
    if (!connection || connection.status !== 'connected') {
      return err(new Error(`No active connection for ${input.platform}`));
    }

    // Get post variant with adapted content
    const variant = await postRepository.findVariantById(input.postVariantId);
    if (!variant) {
      return err(new Error(`Post variant not found: ${input.postVariantId}`));
    }

    // Decrypt access token
    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.accessTokenEncrypted);
    } catch (error) {
      const decryptionError = error instanceof Error ? error : new Error(String(error));
      logger.error('Token decryption failed', { error: decryptionError, connectionId: connection.id });
      return err(new Error('Failed to decrypt access token'));
    }

    // Prepare publish input
    const publishInput: PublishInput = {
      content: variant.adaptedContent,
      mediaUrls: variant.mediaUrls.map(m => m.url),
      firstComment: variant.firstCommentHint || undefined,
    };

    try {
      logger.info('Publishing post', {
        platform: input.platform,
        postVariantId: input.postVariantId,
        workspaceId: input.workspaceId,
      });

      const result = await adapter.publish(accessToken, publishInput);

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

      return ok({
        success: true,
        platformPostId: result.platformPostId,
        platformUrl: result.platformUrl,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Publish failed', { error: err, platform: input.platform });

      // Update variant with error
      await postRepository.updateVariant(input.postVariantId, {
        status: 'failed',
        error: { code: 'PUBLISH_FAILED', message: err.message },
      });

      return ok({
        success: false,
        error: err.message,
      });
    }
  }

  async publishToAllPlatforms(
    postId: string,
    workspaceId: string
  ): Promise<Record<Platform, PublishJobResult>> {
    // Get all variants for this post
    const variants = await postRepository.findVariantsByPostId(postId);
    const results: Record<string, PublishJobResult> = {};

    // Publish each variant to its platform
    for (const variant of variants) {
      const result = await this.publishPost({
        postVariantId: variant.id,
        platform: variant.platform,
        workspaceId,
      });

      results[variant.platform] = result.ok ? result.value : { success: false, error: result.error?.message };
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

      // Encrypt new tokens
      const { encryptToken } = await import('@/lib/crypto/encryption');
      const accessTokenEncrypted = await encryptToken(tokenResponse.accessToken);
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