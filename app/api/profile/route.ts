import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { logger } from '@/lib/logger';

import { supabaseAdmin } from '@/lib/supabase/admin';

const profileRepository = new SupabaseProfileRepository();

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile for this workspace
    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    // Retrieve the user's email from their login credentials
    let userEmail: string | undefined = undefined;
    try {
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', auth.userId)
        .single();
      userEmail = userRecord?.email;

      if (!userEmail) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(auth.userId);
        userEmail = authUser?.user?.email;
      }
    } catch {
      // Non-blocking fallback
    }

    // Normalize field names for templates
    const normalizedProfile = {
      ...profile,
      email: userEmail || (profile as any).email || null,
      proofs: profile.proofPoints || [],
      onboarding_completed: profile.onboardingCompleted ?? false,
      onboardingCompleted: profile.onboardingCompleted ?? false,
      onboarding_answers: profile.onboardingAnswers ?? null,
      onboardingAnswers: profile.onboardingAnswers ?? null,
      studio_profile: profile.studioProfile ?? null,
      studioProfile: profile.studioProfile ?? null,
    };

    return NextResponse.json({ profile: normalizedProfile });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Get profile failed', { error: err });
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, workspaceId } = auth;

    const body = await request.json();
    const {
      name,
      headline,
      bio,
      role,
      company,
      avatarUrl,
      links,
      proofPoints,
      theme,
      subdomain,
      visibility,
      openTo,
      onboardingCompleted,
      onboarding_completed,
      onboardingAnswers,
      onboarding_answers,
    } = body;

    const finalOnboardingCompleted =
      onboardingCompleted !== undefined
        ? onboardingCompleted
        : onboarding_completed !== undefined
        ? onboarding_completed
        : undefined;

    const finalOnboardingAnswers =
      onboardingAnswers !== undefined
        ? onboardingAnswers
        : onboarding_answers !== undefined
        ? onboarding_answers
        : undefined;

    // Get existing profile or create new
    let profile = await profileRepository.findByWorkspaceId(workspaceId);

    if (profile) {
      // Update existing profile - no plan limit needed for updates
      profile = await profileRepository.update(profile.id, {
        name,
        headline,
        bio,
        role,
        company,
        avatarUrl,
        links,
        proofPoints,
        theme,
        subdomain: subdomain || undefined,
        visibility,
        openTo,
        onboardingCompleted: finalOnboardingCompleted,
        onboardingAnswers: finalOnboardingAnswers,
      }, profile.version);
    } else {
      // Creating a new profile - generate a temporary subdomain if none provided
      const tempSubdomain = subdomain || `user-${userId.substring(0, 8)}-${Date.now().toString(36)}`;

      profile = await profileRepository.create({
        workspaceId,
        userId,
        subdomain: tempSubdomain,
        sourceUrl: body.sourceUrl,
        extractionPromptVersion: body.extractionPromptVersion,
      });

      // Update with full data
      profile = await profileRepository.update(profile.id, {
        name,
        headline,
        bio,
        role,
        company,
        avatarUrl,
        links,
        proofPoints,
        theme,
        subdomain: subdomain || tempSubdomain,
        visibility,
        openTo,
      }, 1);
    }

    // Check subdomain uniqueness if provided and different from current
    if (subdomain && subdomain !== profile.subdomain) {
      const existing = await profileRepository.findBySubdomain(subdomain);
      if (existing && existing.id !== profile.id) {
        return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
      }
      // Update subdomain
      profile = await profileRepository.update(profile.id, { subdomain }, profile.version);
    }

    return NextResponse.json({ profile });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message === 'VERSION_CONFLICT') {
      return NextResponse.json({ error: 'Profile was modified, please refresh and try again' }, { status: 409 });
    }
    // Handle PostgreSQL unique constraint violation (23505)
    const pgError = error as any;
    if (pgError?.code === '23505' && pgError?.constraint === 'profiles_subdomain_active_unique') {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
    }
    logger.error('Update profile failed', { error: err });
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Alias to PUT for creation - will check create_profile limit
  return PUT(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = auth;

    // Get the profile first
    const profile = await profileRepository.findByWorkspaceId(workspaceId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Delete the profile
    await profileRepository.delete(profile.id);

    return NextResponse.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Delete profile failed', { error: err });
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}