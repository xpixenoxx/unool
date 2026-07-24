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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        workspace_id,
        user_id,
        subdomain,
        name,
        headline,
        bio,
        role,
        company,
        links,
        proof_points,
        theme,
        source_url,
        extraction_prompt_version,
        version,
        created_at,
        updated_at
      `)
      .eq('subdomain', subdomain)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      const err = new Error(error.message);
      logger.error('Public profile fetch failed', { error: err, subdomain });
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }

    // Increment view count async
    try {
      await supabase.rpc('increment_profile_views', { profile_id: profile.id });
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

    return NextResponse.json({
      ...profile,
      links: profile.links || [],
      proofPoints: profile.proof_points || [],
      theme: profile.theme || { preset: 'minimal' },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Public profile API error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}