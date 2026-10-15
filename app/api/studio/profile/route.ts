import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { validateStudioProfile, StudioProfile } from '@/lib/config/studioOnboarding';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

/**
 * GET /api/studio/profile
 * Retrieves the current user's Studio profile ({ role, doing, audience, tone, style, interests, completedAt }).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);

    if (!profile) {
      return NextResponse.json({
        profile: null,
        isCompleted: false,
      });
    }

    const studioProfile: StudioProfile | null = profile.studioProfile || null;
    const isCompleted = Boolean(studioProfile && studioProfile.role && studioProfile.completedAt);

    return NextResponse.json({
      profile: studioProfile,
      isCompleted,
      profileId: profile.id,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get studio profile', { error: err });
    return NextResponse.json({ error: 'Failed to fetch studio profile' }, { status: 500 });
  }
}

/**
 * PUT /api/studio/profile
 * Validates and updates the current user's Studio profile.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    // Support payload directly or nested inside { profile: ... }
    const profileData = body.profile ? body.profile : body;

    // Validate server-side
    const validation = validateStudioProfile(profileData);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid profile data' }, { status: 400 });
    }

    const businessDomain = String(profileData.businessDomain || profileData.doing || '').trim();
    const doing = String(profileData.doing || profileData.businessDomain || '').trim();

    // Cleaned studio profile
    const cleanedProfile: StudioProfile = {
      role: String(profileData.role).trim(),
      businessStage: profileData.businessStage ? String(profileData.businessStage).trim() : undefined,
      businessDomain: businessDomain || undefined,
      workInterests: profileData.workInterests ? String(profileData.workInterests).trim() : undefined,
      doing: doing || businessDomain,
      audience: String(profileData.audience).trim(),
      tone: String(profileData.tone).trim(),
      style: String(profileData.style).trim(),
      interests: (profileData.interests as string[]).map((i) => String(i).trim()),
      completedAt: profileData.completedAt || new Date().toISOString(),
    };

    let profile = await profileRepository.findByWorkspaceId(auth.workspaceId);

    if (!profile) {
      // Create initial profile for workspace
      const tempSubdomain = `user-${auth.userId.substring(0, 8)}-${Date.now().toString(36)}`;
      profile = await profileRepository.create({
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        subdomain: tempSubdomain,
      });
    }

    const updated = await profileRepository.update(
      profile.id,
      {
        studioProfile: cleanedProfile,
        onboardingCompleted: true,
        // Also map to onboardingAnswers for backwards compatibility with legacy consumers
        onboardingAnswers: {
          persona: cleanedProfile.role,
          focus: cleanedProfile.doing,
          audience: [cleanedProfile.audience],
          tone: [cleanedProfile.tone],
          custom: {
            style: cleanedProfile.style,
            interests: cleanedProfile.interests.join(', '),
          },
        },
      },
      profile.version
    );

    return NextResponse.json({
      success: true,
      profile: updated.studioProfile || cleanedProfile,
      isCompleted: true,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update studio profile', { error: err });
    return NextResponse.json({ error: 'Failed to update studio profile' }, { status: 500 });
  }
}
