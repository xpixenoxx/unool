import { NextRequest, NextResponse } from 'next/server';
import { PlatformType } from '@/lib/ai/PostAdapter';
import { logger } from '@/lib/logger';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { getCurrentAuth } from '@/lib/auth/server';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';
import { publishService } from '@/lib/services/PublishService';

const postRepository = new SupabasePostRepository();
const profileRepository = new SupabaseProfileRepository();

export const maxDuration = 300; // 5 mins max duration

export async function POST(request: NextRequest) {
  // Use createPost plan enforcement instead of useAI
  return planEnforcement.createPost(request, async (request) => {
    const traceId = crypto.randomUUID();

    try {
      const auth = await getCurrentAuth(request);

      if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = auth;

      const body = await request.json();
      const { content, profileId, mediaItems, selectedPlatforms } = body;

      if (!content || typeof content !== 'string' || !content.trim()) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
      }

      let resolvedProfileId = profileId;

      if (!resolvedProfileId) {
        const workspaceProfile = await profileRepository.findByWorkspaceId(workspaceId);
        if (workspaceProfile) {
          resolvedProfileId = workspaceProfile.id;
        }
      }

      if (!resolvedProfileId) {
        return NextResponse.json(
          { error: 'No profile found for workspace. Create a profile first.' },
          { status: 400 }
        );
      }

      let activePlatforms: PlatformType[] = [];

      if (selectedPlatforms && Array.isArray(selectedPlatforms) && selectedPlatforms.length > 0) {
        activePlatforms = selectedPlatforms as PlatformType[];
      } else {
        const { SupabasePlatformRepository } = await import('@/lib/repositories/supabase/SupabasePlatformRepository');
        const platformRepo = new SupabasePlatformRepository();
        const connections = await platformRepo.findByWorkspaceId(workspaceId);
        activePlatforms = connections
          .filter(c => c.status === 'connected')
          .map(c => c.platform as PlatformType);
      }

      if (activePlatforms.length === 0) {
        return NextResponse.json(
          { error: 'No active platform connections found' },
          { status: 400 }
        );
      }

      logger.info('Direct broadcast requested', { traceId, workspaceId, contentLength: content.length, activePlatforms });

      const rawContent = content.trim();

      // Create post in database
      const post = await postRepository.create({
        profileId: resolvedProfileId,
        workspaceId,
        content: rawContent,
        adaptationPromptVersion: 'direct-broadcast', // Special marker indicating no AI
      });

      // Create identical variants for ACTIVE platforms only
      for (const platform of activePlatforms) {
        // Normalize mediaItems to PostMedia objects with {url, type}
        const normalizedMedia = (mediaItems || []).map((m: any) => {
          if (typeof m === 'string') {
            return { url: m, type: 'image' as const };
          }
          return { url: m.url as string, type: (m.type || 'image') as 'image' | 'video' };
        }).filter((m: any) => Boolean(m.url));

        // Media validation
        let status: 'draft' | 'failed' | 'published' = 'draft';
        let errorObj: any = null;

        const hasVideo = normalizedMedia.some((m: any) => m.type === 'video');
        const hasImage = normalizedMedia.some((m: any) => m.type === 'image');

        if (platform === 'threads' && hasVideo) {
          status = 'failed';
          errorObj = { code: 'UNSUPPORTED_MEDIA', message: 'Threads does not support video uploads.' };
        } else if (platform === 'pinterest' && hasVideo) {
          status = 'failed';
          errorObj = { code: 'UNSUPPORTED_MEDIA', message: 'Pinterest does not support video uploads.' };
        } else if (platform === 'bluesky' && hasVideo) {
          status = 'failed';
          errorObj = { code: 'UNSUPPORTED_MEDIA', message: 'Bluesky does not support video uploads.' };
        }
        // You can add more platform media validations here as needed.

        await postRepository.createVariant({
          postId: post.id,
          platform,
          adaptedContent: rawContent,
          mediaUrls: normalizedMedia,
          characterCount: rawContent.length,
          hashtagStrategy: [],
          firstCommentHint: undefined,
          status,
          error: errorObj,
        });
      }

      logger.info('Broadcast variants created, triggering publish', {
        traceId,
        postId: post.id,
      });

      // We use Next.js 15 after() to run the publishing in the background
      // The maxDuration = 300 setting above ensures Vercel doesn't kill this background job
      // for up to 5 minutes, giving LinkedIn plenty of time to upload chunks.
      const { after } = await import('next/server');

      after(async () => {
        try {
          logger.info('Background publish starting', { traceId, postId: post.id });
          await publishService.publishToAllPlatforms(post.id, workspaceId);
        } catch (bgError) {
          logger.error('Background publish failed', { traceId, postId: post.id, error: bgError });
        }
      });

      return NextResponse.json({
        success: true,
        postId: post.id,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Broadcast API error', { traceId, error: err });
      return NextResponse.json({ error: 'Broadcast failed', details: err.message }, { status: 500 });
    }
  });
}
