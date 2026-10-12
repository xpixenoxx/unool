import { NextRequest, NextResponse } from 'next/server';
import { PostAdapter, PlatformType, PostSequence } from '@/lib/ai/PostAdapter';
import { logger } from '@/lib/logger';
import { trackAiUsage } from '@/lib/limits/enforcer';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { getCurrentAuth } from '@/lib/auth/server';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';
import { optimizeMediaForPlatform } from '@/lib/media/ImageOptimizer';
import { config } from '@/lib/config/schema';

const postRepository = new SupabasePostRepository();
const profileRepository = new SupabaseProfileRepository();

export const maxDuration = 300; // 5 mins for multi-post generation

export async function POST(request: NextRequest) {
  return planEnforcement.useAI(request, async (request) => {
    const traceId = crypto.randomUUID();

    try {
      const auth = await getCurrentAuth(request);
      if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { userId, workspaceId } = auth;
      const body = await request.json();
      const { content, profileId, numberOfDays, selectedPlatforms, scheduleDates, mediaItemsByDay } = body;

      if (!content || typeof content !== 'string' || !content.trim()) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
      }

      const numDays = Math.min(Math.max(numberOfDays || 3, 1), 14);

      // Resolve profile
      let profileContext: { profileName?: string; profileHeadline?: string } = {};
      let resolvedProfileId = profileId;

      if (!resolvedProfileId) {
        const workspaceProfile = await profileRepository.findByWorkspaceId(workspaceId);
        if (workspaceProfile) {
          resolvedProfileId = workspaceProfile.id;
          profileContext = {
            profileName: workspaceProfile.name || undefined,
            profileHeadline: workspaceProfile.headline || undefined,
          };
        }
      } else {
        const profile = await profileRepository.findById(profileId);
        if (profile) {
          profileContext = {
            profileName: profile.name || undefined,
            profileHeadline: profile.headline || undefined,
          };
        }
      }

      if (!resolvedProfileId) {
        return NextResponse.json(
          { error: 'No profile found for workspace. Create a profile first.' },
          { status: 400 }
        );
      }

      // Resolve platforms
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

      logger.info('Flight Plan generation requested', {
        traceId, workspaceId, contentLength: content.length, numDays, activePlatforms,
      });

      // Generate sequences for all platforms
      const sequenceResults = await PostAdapter.generateFlightPlan(
        content.trim(),
        activePlatforms,
        numDays,
        profileContext
      );

      // Check for failures
      for (const platform of activePlatforms) {
        const result = sequenceResults[platform];
        if (!result.ok) {
          logger.error('Flight Plan generation failed for platform', { platform, error: result.error });
          return NextResponse.json(
            { error: `Failed to generate for ${platform}: ${result.error}` },
            { status: 500 }
          );
        }
      }

      // Create posts in the database — one post per day
      const createdPosts: Array<{
        dayIndex: number;
        postId: string;
        scheduledAt: string | null;
        variants: Record<string, { content: string; characterCount: number; hashtags: string[]; hookSummary: string; angle: string; firstCommentHint?: string | null }>;
      }> = [];

      for (let day = 0; day < numDays; day++) {
        // Determine scheduled date for this day
        const scheduledAt = scheduleDates?.[day]
          ? new Date(scheduleDates[day])
          : null;

        // Get the first platform's content for the base post content
        const firstPlatform = activePlatforms[0];
        const dayContent = sequenceResults[firstPlatform].ok
          ? (sequenceResults[firstPlatform] as { ok: true; value: PostSequence }).value.posts[day]?.content || content.trim()
          : content.trim();

        // Create the post
        const post = await postRepository.create({
          profileId: resolvedProfileId || '',
          workspaceId,
          content: dayContent,
          adaptationPromptVersion: PostAdapter['PROMPT_VERSION'],
        });

        // If scheduled, update status
        if (scheduledAt) {
          await postRepository.update(post.id, {
            status: 'scheduled',
            scheduledAt,
          });
        }

        // Create variants for each platform
        const dayVariants: Record<string, { content: string; characterCount: number; hashtags: string[]; hookSummary: string; angle: string; firstCommentHint?: string | null }> = {};

        for (const platform of activePlatforms) {
          const seq = sequenceResults[platform];
          if (!seq.ok) continue;

          const dayPost = (seq as { ok: true; value: PostSequence }).value.posts[day];
          if (!dayPost) continue;

          // Get media for this day
          const dayMedia = mediaItemsByDay?.[day] || [];
          const normalizedMedia = dayMedia.map((m: any) => {
            if (typeof m === 'string') {
              return { url: m, type: 'image' as const };
            }
            return { url: m.url as string, type: (m.type || 'image') as 'image' | 'video' };
          }).filter((m: any) => Boolean(m.url));

          const finalMedia = await optimizeMediaForPlatform(normalizedMedia, platform);

          await postRepository.createVariant({
            postId: post.id,
            platform,
            adaptedContent: dayPost.content,
            mediaUrls: finalMedia,
            characterCount: dayPost.characterCount,
            hashtagStrategy: dayPost.hashtags,
            firstCommentHint: dayPost.firstCommentHint || undefined,
            status: 'draft',
          });

          dayVariants[platform] = {
            content: dayPost.content,
            characterCount: dayPost.characterCount,
            hashtags: dayPost.hashtags,
            hookSummary: dayPost.hookSummary,
            angle: dayPost.angle,
            firstCommentHint: dayPost.firstCommentHint,
          };
        }

        createdPosts.push({
          dayIndex: day,
          postId: post.id,
          scheduledAt: scheduledAt?.toISOString() || null,
          variants: dayVariants,
        });
      }

      // Track AI usage
      const totalTokensIn = content.length * activePlatforms.length;
      const totalTokensOut = createdPosts.reduce(
        (sum, p) => sum + Object.values(p.variants).reduce((vs, v) => vs + v.characterCount, 0),
        0
      );

      await trackAiUsage(
        workspaceId,
        userId,
        Math.ceil(totalTokensIn / 4),
        Math.ceil(totalTokensOut / 4),
        'flight-plan-generation',
        config.AI_DEFAULT_MODEL
      );

      logger.info('Flight Plan generation completed', {
        traceId,
        totalPosts: createdPosts.length,
        platforms: activePlatforms,
      });

      return NextResponse.json({
        success: true,
        posts: createdPosts,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Flight Plan API error', { traceId, error: err, errorString: error });
      return NextResponse.json({ error: 'Flight Plan generation failed', details: err.message }, { status: 500 });
    }
  });
}
