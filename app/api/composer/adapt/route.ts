import { NextRequest, NextResponse } from 'next/server';
import { PostAdapter, PlatformType, AdaptedPost } from '@/lib/ai/PostAdapter';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { getCurrentUsage, checkLimit, getLimitsForTier, Tier } from '@/lib/limits/freeTier';
import { trackAiUsage } from '@/lib/limits/enforcer';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { getCurrentAuth } from '@/lib/auth/server';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
const postRepository = new SupabasePostRepository();
const profileRepository = new SupabaseProfileRepository();

export async function POST(request: NextRequest) {
  const traceId = crypto.randomUUID();

  try {
    const auth = await getCurrentAuth(request);

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, workspaceId } = auth;

    const body = await request.json();
    const { content, profileId } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get profile for context - if not provided, find one for the workspace
    let profileContext: { profileName?: string; profileHeadline?: string } = {};
    let resolvedProfileId = profileId;

    if (!resolvedProfileId) {
      const workspaceProfile = await profileRepository.findByWorkspaceId(workspaceId);
      console.log('[DEBUG Composer] findByWorkspaceId result:', { workspaceId, workspaceProfile: workspaceProfile ? { id: workspaceProfile.id, name: workspaceProfile.name } : null });
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

    // Ensure we have a valid profile ID
    if (!resolvedProfileId) {
      return NextResponse.json(
        { error: 'No profile found for workspace. Create a profile first.' },
        { status: 400 }
      );
    }

    // Check free tier limits
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('plan_tier')
      .eq('id', workspaceId)
      .single();

    const tier = (workspace?.plan_tier as Tier) || 'free';
    const limits = getLimitsForTier(tier);
    const usage = await getCurrentUsage(supabase, workspaceId, userId);

    const postsLimit = checkLimit('postsPerMonth', usage, limits);
    const tokensLimit = checkLimit('aiTokensPerMonth', usage, limits);

    if (!postsLimit.allowed) {
      return NextResponse.json(
        { error: 'Monthly post limit exceeded', limit: postsLimit },
        { status: 429 }
      );
    }

    if (!tokensLimit.allowed) {
      return NextResponse.json(
        { error: 'Monthly AI token limit exceeded', limit: tokensLimit },
        { status: 429 }
      );
    }

    logger.info('Composer adaptation requested', { traceId, workspaceId, contentLength: content.length });

    // Adapt content for all platforms
    const results = await PostAdapter.adaptForAllPlatforms(content.trim(), profileContext);

    const variants: Record<PlatformType, AdaptedPost> = {} as Record<PlatformType, AdaptedPost>;
    const platforms: PlatformType[] = ['linkedin', 'x', 'threads'];
    let totalTokensIn = 0;
    let totalTokensOut = 0;

    for (const platform of platforms) {
      const result = results[platform];
      if (!result.ok) {
        logger.error('Adaptation failed for platform', { platform, error: result.error });
        return NextResponse.json(
          { error: `Failed to adapt for ${platform}: ${result.error}` },
          { status: 500 }
        );
      }
      variants[platform] = result.value;
      totalTokensIn += content.length + JSON.stringify(profileContext).length;
      totalTokensOut += result.value.content.length;
    }

    // Create post with variants in database
    const post = await postRepository.create({
      profileId: resolvedProfileId || '', // Use resolved profile ID
      workspaceId,
      content: content.trim(),
      adaptationPromptVersion: PostAdapter['PROMPT_VERSION'],
    });

    // Create variants
    for (const platform of platforms) {
      const adapted = variants[platform];
      await postRepository.createVariant({
        postId: post.id,
        platform,
        adaptedContent: adapted.content,
        mediaUrls: [],
        characterCount: adapted.characterCount,
        hashtagStrategy: adapted.hashtags,
        firstCommentHint: adapted.firstCommentHint || undefined,
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
      postId: post.id,
      platforms: Object.keys(variants),
    });

    return NextResponse.json({
      postId: post.id,
      variants: {
        linkedin: {
          content: variants.linkedin.content,
          characterCount: variants.linkedin.characterCount,
          hashtags: variants.linkedin.hashtags,
          firstCommentHint: variants.linkedin.firstCommentHint,
        },
        x: {
          content: variants.x.content,
          characterCount: variants.x.characterCount,
          hashtags: variants.x.hashtags,
          firstCommentHint: variants.x.firstCommentHint,
        },
        threads: {
          content: variants.threads.content,
          characterCount: variants.threads.characterCount,
          hashtags: variants.threads.hashtags,
          firstCommentHint: variants.threads.firstCommentHint,
        },
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Composer adaptation API error', { traceId, error: err, errorString: error });
    return NextResponse.json({ error: 'Adaptation failed', details: err.message }, { status: 500 });
  }
}