import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { analytics, extractTrackingFromRequest } from '@/lib/analytics/track';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params;

    if (!subdomain || subdomain.length < 2) {
      return NextResponse.json({ error: 'Invalid subdomain' }, { status: 400 });
    }

    // Use the Repository which has the service_role key to bypass RLS,
    // so we can manually enforce our own visibility logic.
    const profileRepository = new (await import('@/lib/repositories/supabase/SupabaseProfileRepository')).SupabaseProfileRepository();
    const profile = await profileRepository.findBySubdomain(subdomain);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check visibility / authorized viewers
    if (profile.visibility === 'private') {
      const auth = await (await import('@/lib/auth/server')).getCurrentAuth(request);
      
      if (!auth) {
        return NextResponse.json({ error: 'This profile is private. Please sign in to view it.' }, { status: 401 });
      }

      // Owner always has access
      if (auth.userId !== profile.userId) {
        const viewers = await profileRepository.getViewers(profile.id);
        const isAuthorized = viewers.some(v => v.viewerUserId === auth.userId);
        
        if (!isAuthorized) {
          return NextResponse.json({ error: 'This profile is private. You do not have permission to view it.' }, { status: 403 });
        }
      }
    }

    // Increment view count async (fire-and-forget, fallback to ignoring errors)
    try {
      const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
      await supabase.rpc('increment_profile_views', { profile_id: profile.id });
    } catch {
      // Ignore view count errors
    }

    // Track profile view analytics (fire-and-forget)
    const { ipHash, referrer, userAgent } = extractTrackingFromRequest(request);
    const resolvedIpHash = await ipHash;
    analytics.profileView({
      workspaceId: profile.workspaceId,
      profileId: profile.id,
      userId: profile.userId,
      sessionId: request.headers.get('x-session-id') || undefined,
      referrer: referrer || undefined,
      userAgent: userAgent || undefined,
      ipHash: resolvedIpHash || undefined,
    });

    return NextResponse.json({
      ...profile,
      links: profile.links || [],
      proofs: profile.proofPoints || [],
      theme: profile.theme || { preset: 'minimal' },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Public profile API error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}