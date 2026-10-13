import { NextRequest, NextResponse } from 'next/server';
import { publishService } from '@/lib/services/PublishService';
import { logger } from '@/lib/logger';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';

import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { config } from '@/lib/config/schema';

export const maxDuration = 300; // 5 minutes (max allowed on Vercel Pro/Hobby for long-running publish tasks)

const postRepository = new SupabasePostRepository();

export async function POST(request: NextRequest) {
  return planEnforcement.createPost(request, async (request) => {
    try {
      const body = await request.json();
      const { postId, workspaceId, drafts, mediaItems } = body;

      if (!postId) {
        return NextResponse.json(
          { error: 'postId is required' },
          { status: 400 }
        );
      }

      // Look up post to get the guaranteed correct workspaceId
      const post = await postRepository.findById(postId);
      if (!post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      const resolvedWorkspaceId = post.workspaceId || workspaceId;
      if (!resolvedWorkspaceId) {
        return NextResponse.json(
          { error: 'Could not resolve workspaceId for post' },
          { status: 400 }
        );
      }

      const existingVariants = await postRepository.findVariantsByPostId(postId);

      // If media items are provided and variants have missing or outdated media, optimize and associate
      if (Array.isArray(mediaItems) && mediaItems.length > 0) {
        const { optimizeMediaForPlatform } = await import('@/lib/media/ImageOptimizer');
        const normalizedMedia = mediaItems.map((m: any) => {
          if (typeof m === 'string') return { url: m, type: 'image' as const };
          return { url: m.url as string, type: (m.type || 'image') as 'image' | 'video' };
        }).filter((m: any) => Boolean(m.url));

        for (const variant of existingVariants) {
          if (!variant.mediaUrls || variant.mediaUrls.length === 0) {
            try {
              const optimized = await optimizeMediaForPlatform(normalizedMedia, variant.platform);
              await postRepository.updateVariant(variant.id, {
                mediaUrls: optimized,
              });
            } catch (optErr) {
              logger.warn('Failed to optimize media for variant in publish route', { variantId: variant.id, platform: variant.platform, error: optErr });
            }
          }
        }
      }

      // If edited drafts were provided from the composer, save updates before publishing
      if (Array.isArray(drafts) && drafts.length > 0) {
        for (const d of drafts) {
          if (d.platform && d.content) {
            const targetVariant = existingVariants.find(v => v.platform === d.platform);
            if (targetVariant) {
              await postRepository.updateVariant(targetVariant.id, {
                adaptedContent: d.content,
                characterCount: d.content.length,
                hashtagStrategy: d.hashtags || targetVariant.hashtagStrategy,
              });
            }
          }
        }
      }

      // Try enqueuing via QStash if token is configured
      let enqueued = false;
      if (config.QSTASH_TOKEN) {
        try {
          const { queueService } = await import('@/lib/services/QueueService');
          const messageId = await queueService.enqueuePublishTask(postId, resolvedWorkspaceId);
          if (messageId) {
            enqueued = true;
          }
        } catch (queueErr) {
          logger.warn('Failed to enqueue publish task to QStash, using fallback', { postId, error: queueErr });
        }
      }

      // If QStash was not configured or failed to enqueue, use Next.js background execution
      if (!enqueued) {
        logger.info('Publishing via background execution (QStash not active)', { postId, workspaceId: resolvedWorkspaceId });
        try {
          const { after } = await import('next/server');
          if (typeof after === 'function') {
            after(async () => {
              try {
                logger.info('Background publish running via after()', { postId, workspaceId: resolvedWorkspaceId });
                await publishService.publishToAllPlatforms(postId, resolvedWorkspaceId);
              } catch (bgError) {
                const bgErr = bgError instanceof Error ? bgError : new Error(String(bgError));
                logger.error('Background publish failed', { postId, workspaceId: resolvedWorkspaceId, error: bgErr });
              }
            });
          } else {
            publishService.publishToAllPlatforms(postId, resolvedWorkspaceId).catch(err => {
              const e = err instanceof Error ? err : new Error(String(err));
              logger.error('Direct background publish failed', { postId, workspaceId: resolvedWorkspaceId, error: e });
            });
          }
        } catch {
          publishService.publishToAllPlatforms(postId, resolvedWorkspaceId).catch(err => {
            const e = err instanceof Error ? err : new Error(String(err));
            logger.error('Direct background publish failed', { postId, workspaceId: resolvedWorkspaceId, error: e });
          });
        }
      }

      return NextResponse.json({
        success: true,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Publish API error', { error: err });
      return NextResponse.json(
        { error: 'Failed to publish post' },
        { status: 500 }
      );
    }
  });
}