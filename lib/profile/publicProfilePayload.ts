import { unstable_cache } from 'next/cache';
import type { NextRequest } from 'next/server';
import type { Profile, ProfileLink, ProofPoint, ProfileTheme } from '@/lib/repositories/interfaces/IProfileRepository';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { normalizeFacebookUrl } from '@/lib/platforms/facebookUrl';
import { getPlanContext } from '@/lib/middleware/plan-enforcement-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { analytics, extractTrackingFromRequest } from '@/lib/analytics/track';
import { normalizeTemplateId } from '@/lib/profile/templateNormalization';
import { normalizeHex } from '@/lib/profile/contrast';
import { sanitizeHref } from '@/lib/validation/profileSchemas';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

export interface PublicProfileRecentActivity {
  id: string;
  content: string;
  publishedAt: string | null;
  platforms: Array<{
    platform: string;
    url: string;
    adaptedContent: string;
  }>;
}

export interface PublicProfileApiPayload {
  id: string;
  workspaceId: string;
  workspace_id: string;
  userId: string;
  user_id: string;
  subdomain: string | null;
  name: string | null;
  headline: string | null;
  bio: string | null;
  role: string | null;
  company: string | null;
  avatarUrl: string | null;
  avatar_url: string | null;
  location: string | null;
  timezone: string | null;
  availabilityBadge: string | null;
  email?: string;
  links: ProfileLink[];
  proofPoints: ProofPoint[];
  proof_points: ProofPoint[];
  proofs: ProofPoint[];
  openTo: string[];
  open_to: string[];
  socialHandles: Record<string, string>;
  seo: {
    title: string;
    description: string;
    image: string | null;
  };
  theme: ProfileTheme & {
    template: string;
    preset: string;
    accentColor: string;
    customCss: null;
  };
  hideBadge: boolean;
  whiteLabel: boolean;
  features: {
    badge_removal: boolean;
    white_label: boolean;
  };
  visibility: 'public' | 'private' | 'unlisted';
  recentActivity: PublicProfileRecentActivity | null;
  createdAt: Date | string;
  created_at: Date | string;
  updatedAt: Date | string;
  updated_at: Date | string;
}

function sanitizeLinks(links: ProfileLink[] | undefined): ProfileLink[] {
  if (!Array.isArray(links)) return [];
  const safe: ProfileLink[] = [];
  for (const link of links) {
    if (!link || typeof link.label !== 'string') continue;
    const cleanUrl = sanitizeHref(link.url, { allowMailto: true });
    if (!cleanUrl) continue;
    safe.push({
      ...link,
      label: link.label.trim(),
      url: cleanUrl,
    });
  }
  return safe;
}

function sanitizeProofs(proofs: ProofPoint[] | undefined): ProofPoint[] {
  if (!Array.isArray(proofs)) return [];
  return proofs
    .filter((p) => p && typeof p.value === 'string' && p.value.trim().length > 0)
    .map((p) => ({
      ...p,
      type: (p.type || 'metric').trim(),
      value: p.value.trim(),
      url: sanitizeHref(p.url, { allowMailto: false }) ?? undefined,
    }));
}

async function fetchLatestRecentActivity(profile: Profile): Promise<PublicProfileRecentActivity | null> {
  try {
    const postRepo = new SupabasePostRepository();
    const platformRepo = new SupabasePlatformRepository();

    let recentPosts = await postRepo.findByProfileId(profile.id, { status: 'published', limit: 1 });
    if (recentPosts.length === 0 && profile.workspaceId) {
      recentPosts = await postRepo.findByWorkspaceId(profile.workspaceId, { status: 'published', limit: 1 });
    }

    if (recentPosts.length === 0) {
      let candidatePosts = await postRepo.findByProfileId(profile.id, { limit: 5 });
      if (candidatePosts.length === 0 && profile.workspaceId) {
        candidatePosts = await postRepo.findByWorkspaceId(profile.workspaceId, { limit: 5 });
      }
      for (const p of candidatePosts) {
        const vs = await postRepo.findVariantsByPostId(p.id);
        if (vs.some((v) => v.status === 'published')) {
          recentPosts = [p];
          break;
        }
      }
    }

    const latestPost = recentPosts[0] ?? null;
    if (!latestPost) return null;

    const variants = await postRepo.findVariantsByPostId(latestPost.id);
    const publishedVariants = variants.filter((v) => v.status === 'published');

    const platformItems = await Promise.all(
      publishedVariants.map(async (v) => {
        const platformPosts = await platformRepo.findPlatformPostsByVariant(v.id);
        const rawUrl = platformPosts[0]?.platformUrl ?? (v as unknown as { platformUrl?: string }).platformUrl;
        const rawPostId = platformPosts[0]?.platformPostId ?? (v as unknown as { platformPostId?: string }).platformPostId;
        let liveUrl = rawUrl;
        if (v.platform?.toLowerCase() === 'facebook') {
          liveUrl = normalizeFacebookUrl(rawUrl, rawPostId);
        } else if (!liveUrl) {
          liveUrl = `https://${v.platform}.com`;
        }
        return {
          platform: v.platform,
          url: liveUrl,
          adaptedContent: v.adaptedContent,
        };
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

    return {
      id: latestPost.id,
      content: latestPost.content,
      publishedAt:
        latestPost.publishedAt?.toISOString() ??
        latestPost.updatedAt?.toISOString() ??
        latestPost.createdAt?.toISOString() ??
        null,
      platforms: effectivePlatforms,
    };
  } catch {
    return null;
  }
}

export async function serializePublicProfile(profile: Profile): Promise<PublicProfileApiPayload> {
  const [recentActivity, planCtx] = await Promise.all([
    fetchLatestRecentActivity(profile),
    profile.workspaceId
      ? getPlanContext(profile.userId, profile.workspaceId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const hideBadge = Boolean(planCtx?.features?.badge_removal || planCtx?.features?.white_label);
  const whiteLabel = Boolean(planCtx?.features?.white_label);

  const normalizedTemplate = normalizeTemplateId(
    profile.theme?.template || profile.theme?.preset || 'lone'
  );
  const accentColor = normalizeHex(profile.theme?.accentColor || profile.theme?.primaryColor, '#2563EB');

  const cleanLinks = sanitizeLinks(profile.links);
  const cleanProofs = sanitizeProofs(profile.proofPoints);
  const cleanConversationUrl = sanitizeHref(profile.theme?.conversationUrl, { allowMailto: true }) ?? undefined;
  const cleanBookingUrl = sanitizeHref(profile.theme?.bookingUrl, { allowMailto: false }) ?? undefined;

  const basePayload: PublicProfileApiPayload = {
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
    avatarUrl: sanitizeHref(profile.avatarUrl, { allowMailto: false }),
    avatar_url: sanitizeHref(profile.avatarUrl, { allowMailto: false }),
    location: profile.location || profile.theme?.location || null,
    timezone: profile.timezone || profile.theme?.timezone || null,
    availabilityBadge: profile.availabilityBadge || profile.theme?.availabilityBadge || null,
    links: cleanLinks,
    proofPoints: cleanProofs,
    proof_points: cleanProofs,
    proofs: cleanProofs,
    openTo: profile.openTo || [],
    open_to: profile.openTo || [],
    socialHandles: profile.socialHandles || {},
    seo: {
      title:
        profile.seo?.title ||
        (profile.name ? `${profile.name} (@${profile.subdomain}) • Unool` : `@${profile.subdomain} • Unool`),
      description:
        profile.seo?.description ||
        profile.headline ||
        profile.bio ||
        `Explore ${profile.name || profile.subdomain}'s links on Unool.`,
      image: profile.seo?.image || profile.avatarUrl || null,
    },
    theme: {
      ...profile.theme,
      template: normalizedTemplate,
      preset: profile.theme?.preset || 'minimal',
      accentColor,
      conversationUrl: cleanConversationUrl,
      bookingUrl: cleanBookingUrl,
      customCss: null,
    },
    hideBadge,
    whiteLabel,
    features: {
      badge_removal: hideBadge,
      white_label: whiteLabel,
    },
    visibility: profile.visibility || 'public',
    recentActivity,
    createdAt: profile.createdAt,
    created_at: profile.createdAt,
    updatedAt: profile.updatedAt,
    updated_at: profile.updatedAt,
  };

  // Security: strictly omit email unless the creator explicitly opted into public email display
  if (profile.showEmail === true && profile.email) {
    basePayload.email = profile.email;
  }

  return basePayload;
}

export async function resolveAuthorizedPublicProfile(
  subdomain: string,
  viewerAuth?: { userId?: string; workspaceId?: string } | null
): Promise<
  | { status: 'found'; profile: Profile; payload: PublicProfileApiPayload; isOwner: boolean }
  | { status: 'not_found' }
> {
  const clean = subdomain.trim().toLowerCase();
  if (!clean) return { status: 'not_found' };

  const profile = await profileRepository.findBySubdomain(clean);
  if (!profile) {
    return { status: 'not_found' };
  }

  const isOwner = Boolean(
    viewerAuth &&
    ((viewerAuth.workspaceId && viewerAuth.workspaceId === profile.workspaceId) ||
      (viewerAuth.userId && viewerAuth.userId === profile.userId))
  );

  if (profile.visibility === 'private' && !isOwner) {
    if (!viewerAuth?.userId || !profileRepository.isViewerAllowed) {
      return { status: 'not_found' };
    }
    const allowed = await profileRepository.isViewerAllowed(profile.id, viewerAuth.userId);
    if (!allowed) {
      return { status: 'not_found' };
    }
  }

  const payload = await serializePublicProfile(profile);
  return { status: 'found', profile, payload, isOwner };
}

export async function getCachedPublicProfileForSsr(subdomain: string): Promise<PublicProfileApiPayload | null> {
  const clean = subdomain.trim().toLowerCase();
  const cachedFn = unstable_cache(
    async () => {
      const profile = await profileRepository.findBySubdomain(clean);
      if (!profile || profile.visibility === 'private') {
        return null;
      }
      return serializePublicProfile(profile);
    },
    [`public-profile-ssr:${clean}`],
    {
      revalidate: 60,
      tags: [`profile:${clean}`],
    }
  );
  return cachedFn();
}

export async function recordPublicProfileView(
  profile: Profile,
  request: NextRequest | { headers: Headers; url: string; nextUrl?: { searchParams: URLSearchParams } },
  isOwner: boolean
): Promise<void> {
  if (isOwner) return;

  const nextUrl = 'nextUrl' in request && request.nextUrl
    ? request.nextUrl
    : new URL(request.url, 'https://unool.co');
  const isPreview = nextUrl.searchParams.get('preview') === 'true' || request.headers.get('x-preview') === 'true';
  if (isPreview) return;

  const { ipHash, referrer, userAgent } = extractTrackingFromRequest(request as Request);
  const clientReferrer = nextUrl.searchParams.get('ref') || nextUrl.searchParams.get('referrer');
  const effectiveReferrer = clientReferrer || referrer || undefined;
  const isBot = userAgent
    ? /bot|crawler|spider|crawling|slurp|facebookexternalhit|whatsapp|preview|headless|googlebot|bingbot/i.test(userAgent)
    : false;

  if (isBot || !profile.workspaceId) return;

  try {
    await supabaseAdmin.rpc('increment_profile_views', { profile_id: profile.id });
  } catch {
    // Non-critical RPC counter
  }

  try {
    const resolvedIpHash = await ipHash;
    const templateUsed = normalizeTemplateId(profile.theme?.template || 'lone');
    await analytics.profileView({
      workspaceId: profile.workspaceId,
      profileId: profile.id,
      userId: profile.userId,
      sessionId: request.headers.get('x-session-id') || undefined,
      referrer: effectiveReferrer,
      userAgent: userAgent || undefined,
      ipHash: resolvedIpHash || undefined,
      template: templateUsed,
      subdomain: profile.subdomain ?? undefined,
    });
  } catch (trackErr) {
    logger.warn('Failed to track profile view', { error: String(trackErr), subdomain: profile.subdomain });
  }
}
