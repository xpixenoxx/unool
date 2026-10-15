import { NextRequest, NextResponse } from 'next/server';
import { PostAdapter, PlatformType, AdaptedPost, AdaptationContext, buildOnboardingPrompt } from '@/lib/ai/PostAdapter';
import { buildStudioContext } from '@/lib/ai/studioContext';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { trackAiUsage } from '@/lib/limits/enforcer';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { getCurrentAuth } from '@/lib/auth/server';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';
import { optimizeMediaForPlatform } from '@/lib/media/ImageOptimizer';
import { ContentGuard } from '@/lib/ai/ContentGuard';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
const postRepository = new SupabasePostRepository();
const profileRepository = new SupabaseProfileRepository();

export const maxDuration = 300; // 5 minutes max execution duration

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
      const { content, profileId, mediaItems, selectedPlatforms, postId: existingPostId } = body;

      if (!content || typeof content !== 'string' || !content.trim()) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
      }

      // ─── ContentGuard: validate input before any AI call ───────────────
      const guard = ContentGuard.validateInput(content, { route: 'composer/adapt' });
      if (!guard.safe) {
        logger.warn('ContentGuard blocked composer input', {
          code: guard.violation.code,
          internal: guard.violation.internal,
          workspaceId,
          traceId,
        });
        return NextResponse.json(ContentGuard.blockedResponse(guard.violation), { status: 400 });
      }
      const safeContent = guard.sanitizedContent;

      // Load profile strictly server-side from authenticated workspace
      const targetProfile = await profileRepository.findByWorkspaceId(workspaceId);
      const profileContext: AdaptationContext = {};
      const resolvedProfileId = targetProfile?.id || profileId;

      if (targetProfile) {
        profileContext.profileName = targetProfile.name || undefined;
        profileContext.profileHeadline = targetProfile.headline || undefined;
      }

      // Check if personalization is toggled off by user
      const disablePersonalization = Boolean(body.disablePersonalization);
      let profileApplied = false;

      if (!disablePersonalization) {
        const effectiveProfile = targetProfile?.studioProfile || targetProfile?.onboardingAnswers;
        if (effectiveProfile) {
          const studioContext = buildStudioContext(effectiveProfile);
          if (studioContext) {
            profileContext.studioProfile = effectiveProfile;
            profileContext.studioContext = studioContext;
            profileApplied = true;
          }
        }
      } else {
        profileContext.disablePersonalization = true;
      }

      // Server-side only logging (Zero personal text)
      logger.info('Composer adaptation studio profile applied', {
        workspaceId,
        applied: profileApplied,
      });

      // Ensure we have a valid profile ID
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
        // Fetch active platform connections for this workspace
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

      // Strip platforms that have no AI adaptation spec (e.g. 'manual') to avoid crashes
      const { PLATFORM_SPECS } = await import('@/lib/ai/PostAdapter');
      activePlatforms = activePlatforms.filter(p => p in PLATFORM_SPECS);

      if (activePlatforms.length === 0) {
        return NextResponse.json(
          { error: 'None of the connected platforms support AI adaptation' },
          { status: 400 }
        );
      }

      logger.info('Composer adaptation requested', { traceId, workspaceId, contentLength: content.length, activePlatforms });

      // Adapt content for all connected platforms
      const results = await PostAdapter.adaptForPlatforms(safeContent, activePlatforms, profileContext);

      const variants: Record<PlatformType, AdaptedPost> = {} as Record<PlatformType, AdaptedPost>;
      let totalTokensIn = 0;
      let totalTokensOut = 0;
      const failedPlatforms: string[] = [];

      for (const platform of activePlatforms) {
        const result = results[platform];
        if (!result.ok) {
          logger.error('Adaptation failed for platform', { platform, error: result.error });
          failedPlatforms.push(platform);
          continue;
        }
        variants[platform] = result.value;
        totalTokensIn += content.length + JSON.stringify(profileContext).length;
        totalTokensOut += result.value.content.length;
      }

      // Only fail if ALL platforms failed
      if (Object.keys(variants).length === 0) {
        return NextResponse.json(
          { error: `Failed to adapt for all platforms: ${failedPlatforms.join(', ')}` },
          { status: 500 }
        );
      }

      // Create post with variants in database (reuse existing postId if provided on retries)
      let activePostId = existingPostId;
      if (!activePostId) {
        const post = await postRepository.create({
          profileId: resolvedProfileId || '',
          workspaceId,
          content: content.trim(),
          adaptationPromptVersion: PostAdapter['PROMPT_VERSION'],
        });
        activePostId = post.id;
      }

      // Create variants — only for platforms that were successfully adapted
      const successfulPlatforms = Object.keys(variants) as PlatformType[];
      for (const platform of successfulPlatforms) {
        const adapted = variants[platform];

        let status: 'draft' | 'failed' | 'published' = 'draft';
        let errorObj: any = null;
        const normalizedMedia = (mediaItems || []).map((m: any) => {
          if (typeof m === 'string') {
            return { url: m, type: 'image' as const };
          }
          return { url: m.url as string, type: (m.type || 'image') as 'image' | 'video' };
        }).filter((m: any) => Boolean(m.url));

        const hasVideo = normalizedMedia.some((m: any) => m.type === 'video');
        const hasImage = normalizedMedia.some((m: any) => m.type === 'image');

        if (platform === 'threads' && hasVideo) {
          status = 'failed';
          errorObj = { code: 'UNSUPPORTED_MEDIA', message: 'Threads does not support video uploads.' };
        } else if (platform === 'pinterest' && hasVideo) {
          status = 'failed';
          errorObj = { code: 'UNSUPPORTED_MEDIA', message: 'Pinterest does not support video uploads.' };
        } else if (platform === 'pinterest' && !hasImage) {
          status = 'failed';
          errorObj = { code: 'MEDIA_REQUIRED', message: 'Pinterest requires at least one image to create a Pin.' };
        } else if (platform === 'dribbble' && !hasImage) {
          status = 'failed';
          errorObj = { code: 'MEDIA_REQUIRED', message: 'Dribbble requires an image to create a Shot.' };
        }

        const finalMedia = await optimizeMediaForPlatform(normalizedMedia, platform);

        await postRepository.createVariant({
          postId: activePostId,
          platform,
          adaptedContent: adapted.content,
          mediaUrls: finalMedia,
          characterCount: adapted.characterCount,
          hashtagStrategy: adapted.hashtags,
          firstCommentHint: adapted.firstCommentHint || undefined,
          status,
          error: errorObj,
        });
      }

      // Track AI usage (approximate)
      await trackAiUsage(
        workspaceId,
        userId,
        Math.ceil(totalTokensIn / 4),
        Math.ceil(totalTokensOut / 4),
        'post-adaptation',
        config.AI_DEFAULT_MODEL
      );

      logger.info('Composer adaptation completed', {
        traceId,
        postId: activePostId,
        platforms: Object.keys(variants),
      });

      // Build dynamic response with all variants
      const responseVariants: Record<string, { content: string; characterCount: number; hashtags: string[]; firstCommentHint?: string }> = {};
      for (const [platform, adapted] of Object.entries(variants)) {
        responseVariants[platform] = {
          content: adapted.content,
          characterCount: adapted.characterCount,
          hashtags: adapted.hashtags,
          firstCommentHint: adapted.firstCommentHint ?? undefined,
        };
      }

      return NextResponse.json({
        postId: activePostId,
        variants: responseVariants,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Composer adaptation API error', { traceId, error: err, errorString: error });
      return NextResponse.json({ error: 'Adaptation failed', details: err.message }, { status: 500 });
    }
  });
}