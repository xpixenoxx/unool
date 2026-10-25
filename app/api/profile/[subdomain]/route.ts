import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { analytics, extractTrackingFromRequest } from '@/lib/analytics/track';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';

const profileRepository = new SupabaseProfileRepository();
const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// Upstash Redis for rate limiting (optional - gracefully degrades if not configured)
async function checkRateLimit(request: NextRequest): Promise<{ limited: boolean; headers: Record<string, string> }> {
  const url = config.UPSTASH_REDIS_REST_URL;
  const token = config.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return { limited: false, headers: {} };
  }

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const key = `ratelimit:profile:${ip}`;

    const response = await fetch(`${url}/incr/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return { limited: false, headers: {} };
    }

    const count = await response.json() as number;
    const limit = 60; // 60 requests per minute
    const remaining = Math.max(0, limit - count);

    const headers = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil((Date.now() + 60000) / 1000).toString(),
    };

    if (count > limit) {
      return { limited: true, headers: { ...headers, 'Retry-After': '60' } };
    }

    return { limited: false, headers };
  } catch {
    // Fail open on rate limiter errors
    return { limited: false, headers: {} };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params;

    if (!subdomain || subdomain.length < 2) {
      return NextResponse.json({ error: 'Invalid subdomain' }, { status: 400 });
    }

    // Rate limiting check
    const { limited, headers: rateLimitHeaders } = await checkRateLimit(request);
    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    // Fetch profile using repository with service_role key to ensure reliability
    const profile = await profileRepository.findBySubdomain(subdomain);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: rateLimitHeaders });
    }

    // Enforce visibility check: private profiles return 404 for public requests
    if (profile.visibility === 'private') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: rateLimitHeaders });
    }

    // Increment view count async (fire-and-forget, fallback to ignoring errors)
    try {
      await supabaseAdmin.rpc('increment_profile_views', { profile_id: profile.id });
    } catch {
      // Ignore view count errors
    }

    // Track profile view analytics (reliable, awaited server-side tracking)
    const isPreview = request.nextUrl.searchParams.get('preview') === 'true' || request.headers.get('x-preview') === 'true';
    const { ipHash, referrer, userAgent } = extractTrackingFromRequest(request);
    const clientReferrer = request.nextUrl.searchParams.get('ref') || request.nextUrl.searchParams.get('referrer');
    const effectiveReferrer = clientReferrer || referrer || undefined;
    const isBot = userAgent ? /bot|crawler|spider|crawling|slurp|facebookexternalhit|whatsapp|preview|headless/i.test(userAgent) : false;

    if (!isPreview && !isBot && profile.workspaceId) {
      try {
        const resolvedIpHash = await ipHash;
        await analytics.profileView({
          workspaceId: profile.workspaceId,
          profileId: profile.id,
          userId: profile.userId,
          sessionId: request.headers.get('x-session-id') || undefined,
          referrer: effectiveReferrer,
          userAgent: userAgent || undefined,
          ipHash: resolvedIpHash || undefined,
        });
      } catch (trackErr) {
        logger.warn('Failed to track profile view', { error: trackErr, subdomain });
      }
    }

    // ── Fetch latest published broadcast for the "Recent Activity" section ──
    let recentActivity = null;
    try {
      const postRepo = new SupabasePostRepository();
      const platformRepo = new SupabasePlatformRepository();

      let recentPosts = await postRepo.findByProfileId(profile.id, { status: 'published', limit: 1 });
      if (recentPosts.length === 0 && profile.workspaceId) {
        recentPosts = await postRepo.findByWorkspaceId(profile.workspaceId, { status: 'published', limit: 1 });
      }

      // If no post has explicit status='published', check for recent posts that have published variants or recent posts
      if (recentPosts.length === 0) {
        let candidatePosts = await postRepo.findByProfileId(profile.id, { limit: 5 });
        if (candidatePosts.length === 0 && profile.workspaceId) {
          candidatePosts = await postRepo.findByWorkspaceId(profile.workspaceId, { limit: 5 });
        }
        for (const p of candidatePosts) {
          const vs = await postRepo.findVariantsByPostId(p.id);
          if (vs.some(v => v.status === 'published')) {
            recentPosts = [p];
            break;
          }
        }
        // Fallback to the latest candidate post in workspace
        if (recentPosts.length === 0 && candidatePosts.length > 0) {
          recentPosts = [candidatePosts[0]];
        }
      }

      const latestPost = recentPosts[0] ?? null;

      if (latestPost) {
        const variants = await postRepo.findVariantsByPostId(latestPost.id);
        const publishedVariants = variants.filter(v => v.status === 'published');
        const targetVariants = publishedVariants.length > 0 ? publishedVariants : variants;

        const platformItems = await Promise.all(
          targetVariants.map(async v => {
            const platformPosts = await platformRepo.findPlatformPostsByVariant(v.id);
            const liveUrl = platformPosts[0]?.platformUrl ?? (v as any).platformUrl ?? `https://${v.platform}.com`;
            return { platform: v.platform, url: liveUrl, adaptedContent: v.adaptedContent };
          })
        );

        const effectivePlatforms = platformItems.filter(Boolean);
        if (effectivePlatforms.length === 0) {
          effectivePlatforms.push({
            platform: 'manual',
            url: `https://unool.co/u/${profile.subdomain}?activity=1`,
            adaptedContent: latestPost.content,
          });
        }

        recentActivity = {
          id: latestPost.id,
          content: latestPost.content,
          publishedAt: latestPost.publishedAt?.toISOString() ?? latestPost.updatedAt?.toISOString() ?? latestPost.createdAt?.toISOString() ?? null,
          platforms: effectivePlatforms,
        };
      }
    } catch {
      // Non-critical — fail silently so the profile always loads
    }

    // Build response WITHOUT email (P0-T5: strip email from public response)
    // The email field is never included in the public profile response
    const response = {
      id: profile.id,
      workspaceId: profile.workspaceId,
      workspace_id: profile.workspaceId,
      userId: profile.userId,
      user_id: profile.userId,
      subdomain: profile.subdomain,
      name: profile.name,
      headline: profile.headline,
      bio: profile.bio,
      role: profile.role,
      company: profile.company,
      avatarUrl: profile.avatarUrl,
      avatar_url: profile.avatarUrl,
      links: profile.links || [],
      proofPoints: profile.proofPoints || [],
      proof_points: profile.proofPoints || [],
      proofs: profile.proofPoints || [],
      openTo: profile.openTo || [],
      open_to: profile.openTo || [],
      theme: {
        template: (profile.theme as any)?.template || (profile.theme as any)?.preset || 'lone',
        preset: (profile.theme as any)?.preset || 'minimal',
        accentColor: (profile.theme as any)?.accentColor || 'var(--color-primary)',
        customCss: (profile.theme as any)?.customCss || null,
        ...profile.theme,
      },
      visibility: profile.visibility || 'public',
      recentActivity,
      createdAt: profile.createdAt,
      created_at: profile.createdAt,
      updatedAt: profile.updatedAt,
      updated_at: profile.updatedAt,
    };

    return NextResponse.json(response, { headers: rateLimitHeaders });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Public profile API error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}