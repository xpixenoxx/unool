import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitHeaders as getRateLimitHeaders } from '@/lib/rate-limit';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';
import {
  resolveAuthorizedPublicProfile,
  recordPublicProfileView,
} from '@/lib/profile/publicProfilePayload';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const rateLimitResult = await checkRateLimit(request, 'profileView');
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.reset);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    const { subdomain } = await params;

    if (!subdomain || subdomain.length < 2) {
      return NextResponse.json({ error: 'Invalid subdomain' }, { status: 400, headers: rateLimitHeaders });
    }

    // Optional viewer authentication for private allowlisted viewers & owner view exemption
    let viewerAuth: { userId: string; workspaceId: string } | null = null;
    try {
      viewerAuth = await getCurrentAuth(request);
    } catch {
      viewerAuth = null;
    }

    const activityParam = request.nextUrl.searchParams.get('activity');
    const result = await resolveAuthorizedPublicProfile(subdomain, viewerAuth, activityParam);
    if (result.status !== 'found') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: rateLimitHeaders });
    }

    await recordPublicProfileView(result.profile, request, result.isOwner);

    const headers = new Headers(rateLimitHeaders);
    if (result.profile.visibility === 'unlisted') {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    if (result.profile.visibility === 'private') {
      headers.set('Cache-Control', 'private, no-store');
    } else {
      headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }

    return NextResponse.json(result.payload, { headers });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Public profile API error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
