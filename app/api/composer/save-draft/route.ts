import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { PostAdapter, PlatformType } from '@/lib/ai/PostAdapter';
import { optimizeMediaForPlatform } from '@/lib/media/ImageOptimizer';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { logger } from '@/lib/logger';

const postRepository = new SupabasePostRepository();
const profileRepository = new SupabaseProfileRepository();

export async function POST(request: NextRequest) {
  const traceId = crypto.randomUUID();

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, userId } = auth;
    const body = await request.json();
    const {
      postId,
      content,
      mode = 'ai',
      drafts = [],
      mediaItems = [],
      selectedPlatforms = [],
    } = body;

    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    // Normalize media items
    const normalizedMedia = (mediaItems || [])
      .map((m: any) => {
        if (typeof m === 'string') return { url: m, type: 'image' as const };
        return { url: m.url as string, type: (m.type || 'image') as 'image' | 'video' | 'document' };
      })
      .filter((m: any) => Boolean(m.url));

    let activePostId = postId;

    if (activePostId) {
      // Verify workspace ownership
      const existing = await postRepository.findById(activePostId);
      if (!existing || existing.workspaceId !== workspaceId) {
        return NextResponse.json({ error: 'Draft not found or forbidden' }, { status: 404 });
      }

      // Update post record
      await postRepository.update(activePostId, {
        content: trimmedContent || existing.content,
        status: 'draft',
      });

      // Update or create variants
      const existingVariants = await postRepository.findVariantsByPostId(activePostId);

      if (Array.isArray(drafts) && drafts.length > 0) {
        for (const d of drafts) {
          if (!d.platform) continue;
          const targetVariant = existingVariants.find(v => v.platform === d.platform);
          const platformMedia = await optimizeMediaForPlatform(normalizedMedia, d.platform as PlatformType);

          if (targetVariant) {
            await postRepository.updateVariant(targetVariant.id, {
              status: 'draft',
              adaptedContent: d.content ?? targetVariant.adaptedContent,
              characterCount: (d.content ?? targetVariant.adaptedContent).length,
              hashtagStrategy: d.hashtags || targetVariant.hashtagStrategy,
              firstCommentHint: d.firstCommentHint || targetVariant.firstCommentHint,
              mediaUrls: platformMedia.length > 0 ? platformMedia : targetVariant.mediaUrls,
            });
          } else {
            await postRepository.createVariant({
              postId: activePostId,
              platform: d.platform,
              adaptedContent: d.content || trimmedContent,
              characterCount: (d.content || trimmedContent).length,
              hashtagStrategy: d.hashtags || [],
              firstCommentHint: d.firstCommentHint || undefined,
              mediaUrls: platformMedia,
              status: 'draft',
            });
          }
        }
      } else if (Array.isArray(selectedPlatforms) && selectedPlatforms.length > 0) {
        for (const p of selectedPlatforms) {
          const targetVariant = existingVariants.find(v => v.platform === p);
          const platformMedia = await optimizeMediaForPlatform(normalizedMedia, p as PlatformType);

          if (targetVariant) {
            await postRepository.updateVariant(targetVariant.id, {
              status: 'draft',
              adaptedContent: trimmedContent || targetVariant.adaptedContent,
              characterCount: (trimmedContent || targetVariant.adaptedContent).length,
              mediaUrls: platformMedia.length > 0 ? platformMedia : targetVariant.mediaUrls,
            });
          } else {
            await postRepository.createVariant({
              postId: activePostId,
              platform: p,
              adaptedContent: trimmedContent,
              characterCount: trimmedContent.length,
              hashtagStrategy: [],
              mediaUrls: platformMedia,
              status: 'draft',
            });
          }
        }
      }
    } else {
      // Create new draft post
      const workspaceProfile = await profileRepository.findByWorkspaceId(workspaceId);

      const newPost = await postRepository.create({
        profileId: workspaceProfile?.id || '',
        workspaceId,
        content: trimmedContent,
        adaptationPromptVersion: mode === 'quick' ? 'direct-broadcast' : PostAdapter['PROMPT_VERSION'],
      });

      activePostId = newPost.id;

      if (Array.isArray(drafts) && drafts.length > 0) {
        for (const d of drafts) {
          if (!d.platform) continue;
          const platformMedia = await optimizeMediaForPlatform(normalizedMedia, d.platform as PlatformType);
          await postRepository.createVariant({
            postId: activePostId,
            platform: d.platform,
            adaptedContent: d.content || trimmedContent,
            characterCount: (d.content || trimmedContent).length,
            hashtagStrategy: d.hashtags || [],
            firstCommentHint: d.firstCommentHint || undefined,
            mediaUrls: platformMedia,
            status: 'draft',
          });
        }
      } else if (Array.isArray(selectedPlatforms) && selectedPlatforms.length > 0) {
        for (const p of selectedPlatforms) {
          const platformMedia = await optimizeMediaForPlatform(normalizedMedia, p as PlatformType);
          await postRepository.createVariant({
            postId: activePostId,
            platform: p,
            adaptedContent: trimmedContent,
            characterCount: trimmedContent.length,
            hashtagStrategy: [],
            mediaUrls: platformMedia,
            status: 'draft',
          });
        }
      }
    }

    logger.info('Post saved as draft successfully', { traceId, postId: activePostId, workspaceId });
    return NextResponse.json({ success: true, postId: activePostId });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to save post as draft', { traceId, error: err });
    return NextResponse.json({ error: 'Failed to save draft', details: err.message }, { status: 500 });
  }
}
