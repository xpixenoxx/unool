import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { analytics, extractTrackingFromRequest } from '@/lib/analytics/track';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';

// Create a public Supabase client with ANON_KEY that respects RLS
const supabasePublic = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

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

    // Use the public (ANON_KEY) client which respects RLS
    // Only profiles with visibility = 'public' will be returned
    const { data: profile, error } = await supabasePublic
      .from('profiles')
      .select('*')
      .eq('subdomain', subdomain)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // At this point, RLS guarantees the profile is public (visibility = 'public')
    // No need for additional visibility checks

    // Increment view count async (fire-and-forget, fallback to ignoring errors)
    try {
      await supabasePublic.rpc('increment_profile_views', { profile_id: profile.id });
    } catch {
      // Ignore view count errors
    }

    // Track profile view analytics (fire-and-forget)
    const { ipHash, referrer, userAgent } = extractTrackingFromRequest(request);
    const resolvedIpHash = await ipHash;
    analytics.profileView({
      workspaceId: profile.workspace_id,
      profileId: profile.id,
      userId: profile.user_id,
      sessionId: request.headers.get('x-session-id') || undefined,
      referrer: referrer || undefined,
      userAgent: userAgent || undefined,
      ipHash: resolvedIpHash || undefined,
    });

    // ── Fetch latest published broadcast for the "Recent Activity" section ──
    let recentActivity = null;
    try {
      const postRepo = new SupabasePostRepository();
      const platformRepo = new SupabasePlatformRepository();

      let recentPosts = await postRepo.findByProfileId(profile.id, { status: 'published', limit: 1 });
      if (recentPosts.length === 0 && profile.workspace_id) {
        recentPosts = await postRepo.findByWorkspaceId(profile.workspace_id, { status: 'published', limit: 1 });
      }
      const latestPost = recentPosts[0] ?? null;

      if (latestPost) {
        const variants = await postRepo.findVariantsByPostId(latestPost.id);
        const publishedVariants = variants.filter(v => v.status === 'published');

        const platformItems = await Promise.all(
          publishedVariants.map(async v => {
            const platformPosts = await platformRepo.findPlatformPostsByVariant(v.id);
            const liveUrl = platformPosts[0]?.platformUrl ?? (v as any).platformUrl ?? `https://${v.platform}.com`;
            return { platform: v.platform, url: liveUrl, adaptedContent: v.adaptedContent };
          })
        );

        recentActivity = {
          id: latestPost.id,
          content: latestPost.content,
          publishedAt: latestPost.publishedAt?.toISOString() ?? null,
          platforms: platformItems.filter(Boolean),
        };
      }
    } catch {
      // Non-critical — fail silently so the profile always loads
    }

    // Build response WITHOUT email (P0-T5: strip email from public response)
    // The email field is never included in the public profile response
    const response = {
      id: profile.id,
      workspaceId: profile.workspace_id,
      userId: profile.user_id,
      subdomain: profile.subdomain,
      name: profile.name,
      headline: profile.headline,
      bio: profile.bio,
      role: profile.role,
      company: profile.company,
      avatarUrl: profile.avatar_url,
      links: profile.links || [],
      proofs: profile.proof_points || [],
      openTo: profile.open_to || [],
      theme: profile.theme || { preset: 'minimal' },
      visibility: profile.visibility,
      recentActivity,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    return NextResponse.json(response, { headers: rateLimitHeaders });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Public profile API error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}