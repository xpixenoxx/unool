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
      const { content, profileId } = body;

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

      // Fetch active platform connections for this workspace
      const { SupabasePlatformRepository } = await import('@/lib/repositories/supabase/SupabasePlatformRepository');
      const platformRepo = new SupabasePlatformRepository();
      const connections = await platformRepo.findByWorkspaceId(workspaceId);
      const activePlatforms = connections
        .filter(c => c.status === 'connected')
        .map(c => c.platform as PlatformType);

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
        await postRepository.createVariant({
          postId: post.id,
          platform,
          adaptedContent: rawContent,
          mediaUrls: [],
          characterCount: rawContent.length,
          hashtagStrategy: [],
          firstCommentHint: undefined,
        });
      }

      logger.info('Broadcast variants created, triggering publish', {
        traceId,
        postId: post.id,
      });

      // Trigger publish to all platforms immediately
      const results = await publishService.publishToAllPlatforms(post.id, workspaceId);

      return NextResponse.json({
        success: true,
        postId: post.id,
        results,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Broadcast API error', { traceId, error: err });
      return NextResponse.json({ error: 'Broadcast failed', details: err.message }, { status: 500 });
    }
  });
}
