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
import { supabaseAdmin } from '@/lib/supabase/admin';
import { normalizePlanId, type PlanId } from '@/lib/billing/plans';
import { getPlanContext } from '@/lib/middleware/plan-enforcement-middleware';

const platformRepository = new SupabasePlatformRepository();
const postRepository = new SupabasePostRepository();

/**
 * Per-plan monthly X (Twitter) post safety caps to protect unit economics
 * against X API v2 pay-per-use link-post pricing ($0.015 text / $0.20 link).
 */
export const X_MONTHLY_POST_CAPS: Record<PlanId, number> = {
  spark: 10,
  creator: 30,
  pro: 100,
  studio: 300,
};

export function estimateXPostCostUsd(content: string): { costUsd: number; hasLink: boolean } {
  const hasLink = /https?:\/\/\S+/i.test(content || '');
  return {
    costUsd: hasLink ? 0.20 : 0.015,
    hasLink,
  };
}

export interface PublishJobInput {
  postVariantId: string;
  platform: Platform;
  workspaceId: string;
  platformConnectionId?: string | null;
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

    // Load variant first so we can resolve its exact target platformConnectionId (if any)
    const variant = await postRepository.findVariantById(input.postVariantId);
    if (!variant) {
      return err(new Error(`Post variant not found: ${input.postVariantId}`));
    }

    // Resolve connection: honor explicit platformConnectionId (on input or variant) strictly without cross-account fallback
    const targetConnectionId = input.platformConnectionId ?? variant.platformConnectionId ?? null;
    let connection = null;
    if (targetConnectionId) {
      const candidate = await platformRepository.findById(targetConnectionId);
      if (candidate && candidate.workspaceId === input.workspaceId && candidate.platform === input.platform) {
        connection = candidate;
      }
    } else {
      connection = await platformRepository.findByWorkspaceAndPlatform(input.workspaceId, input.platform);
    }

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
        await supabaseAdmin
          .from('platform_connections')
          .update({ status: 'connected', updated_at: new Date().toISOString() })
          .eq('id', connection.id);
      } catch {}
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
      firstComment: variant.autoFirstComment || undefined,
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

    // Enforce X (Twitter) API monthly cost protection cap per workspace plan
    if (input.platform === 'x' || (input.platform as string) === 'twitter') {
      try {
        const planCtx = await getPlanContext(connection.userId || '', input.workspaceId);
        const planId = normalizePlanId(planCtx?.plan || 'spark');
        const xMonthlyCap = X_MONTHLY_POST_CAPS[planId] ?? X_MONTHLY_POST_CAPS.spark;

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { count: xPublishedThisMonth } = await supabaseAdmin
          .from('platform_posts')
          .select('id', { count: 'exact', head: true })
          .eq('platform_connection_id', connection.id)
          .gte('published_at', monthStart.toISOString());

        if ((xPublishedThisMonth || 0) >= xMonthlyCap) {
          const capErrMsg = `Monthly X (Twitter) publishing cap reached (${xPublishedThisMonth}/${xMonthlyCap} posts on ${planId.toUpperCase()} plan) to protect against X API pay-per-use overages. Upgrade your plan for a higher X publishing allowance.`;
          logger.warn('X API monthly cost protection cap triggered', {
            workspaceId: input.workspaceId,
            planId,
            xPublishedThisMonth,
            xMonthlyCap,
          });
          await postRepository.updateVariant(input.postVariantId, {
            status: 'failed',
            error: { code: 'X_API_COST_CAP_EXCEEDED', message: capErrMsg },
          });
          return ok({
            success: false,
            error: capErrMsg,
          });
        }
      } catch (xCapErr) {
        logger.warn('Failed to verify X monthly post cap — continuing publish', { error: xCapErr });
      }
    }

    // Attempt publish with automatic token refresh on 401
    const attemptPublish = async (currentAccessToken: string, hasRetried: boolean): Promise<PublishJobResult> => {
      try {
        const result = await adapter.publish(currentAccessToken, publishInput);

        const engagementMeta: Record<string, unknown> = {};
        if (input.platform === 'x' || (input.platform as string) === 'twitter') {
          const xCost = estimateXPostCostUsd(publishInput.content);
          engagementMeta.estimated_x_api_cost_usd = xCost.costUsd;
          engagementMeta.has_link = xCost.hasLink;
        }

        // Save platform post record
        await platformRepository.createPlatformPost({
          postVariantId: input.postVariantId,
          platformConnectionId: connection.id,
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
          engagement: engagementMeta,
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
  ): Promise<Record<string, PublishJobResult>> {
    // Lookup post to ensure guaranteed workspaceId
    const post = await postRepository.findById(postId);
    const resolvedWorkspaceId = post?.workspaceId || workspaceId;

    // Ensure parent post status is set to 'publishing' immediately
    await postRepository.updateStatus(postId, 'publishing');

    // Get all variants for this post
    const variants = await postRepository.findVariantsByPostId(postId);
    const results: Record<string, PublishJobResult> = {};

    const platformCounts = new Map<Platform, number>();
    for (const v of variants) {
      platformCounts.set(v.platform, (platformCounts.get(v.platform) || 0) + 1);
    }

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
      const resultKey =
        (platformCounts.get(variant.platform) || 0) > 1
          ? `${variant.platform}:${variant.platformConnectionId || variant.id}`
          : variant.platform;

      if (variant.status === 'published') {
        logger.info(`PublishService: variant ${variant.platform} already published — skipping duplicate dispatch`, {
          postId,
          variantId: variant.id,
        });
        return {
          resultKey,
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
        platformConnectionId: variant.platformConnectionId ?? undefined,
      });
      const result = await this.publishPost({
        postVariantId: variant.id,
        platform: variant.platform,
        platformConnectionId: variant.platformConnectionId,
        workspaceId: resolvedWorkspaceId,
      });
      const jobResult = result.ok ? result.value : { success: false, error: result.error?.message };
      logger.info(`PublishService: finished publish for ${variant.platform}`, {
        postId,
        platform: variant.platform,
        platformConnectionId: variant.platformConnectionId ?? undefined,
        success: jobResult.success,
        error: jobResult.success ? undefined : jobResult.error,
      });
      return { resultKey, result };
    });

    const publishedResults = await Promise.all(publishPromises);

    for (const { resultKey, result } of publishedResults) {
      results[resultKey] = result.ok ? result.value : { success: false, error: result.error?.message };
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
