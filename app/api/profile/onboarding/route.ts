import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

/**
 * GET /api/profile/onboarding
 * Fetches the user's Studio onboarding status and saved answers.
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
        onboarding_completed: false,
        onboardingCompleted: false,
        answers: null,
        onboarding_answers: null,
      });
    }

    return NextResponse.json({
      onboarding_completed: profile.onboardingCompleted ?? false,
      onboardingCompleted: profile.onboardingCompleted ?? false,
      answers: profile.onboardingAnswers ?? null,
      onboarding_answers: profile.onboardingAnswers ?? null,
      profileId: profile.id,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get onboarding profile', { error: err });
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
  }
}

/**
 * PUT /api/profile/onboarding
 * Updates the user's onboarding answers and/or completion flag.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      onboarding_completed,
      onboardingCompleted,
      answers,
      onboarding_answers,
      skipped,
    } = body;

    const isCompleted =
      onboarding_completed !== undefined
        ? Boolean(onboarding_completed)
        : onboardingCompleted !== undefined
        ? Boolean(onboardingCompleted)
        : skipped !== undefined
        ? Boolean(skipped)
        : true;

    const finalAnswers = answers !== undefined ? answers : onboarding_answers !== undefined ? onboarding_answers : undefined;

    let profile = await profileRepository.findByWorkspaceId(auth.workspaceId);

    if (!profile) {
      // Create initial profile for this workspace if one doesn't exist yet
      const tempSubdomain = `user-${auth.userId.substring(0, 8)}-${Date.now().toString(36)}`;
      profile = await profileRepository.create({
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        subdomain: tempSubdomain,
      });
    }

    // Update profile with onboarding answers and flag
    const updated = await profileRepository.update(
      profile.id,
      {
        onboardingCompleted: isCompleted,
        ...(finalAnswers !== undefined ? { onboardingAnswers: finalAnswers } : {}),
      },
      profile.version
    );

    return NextResponse.json({
      success: true,
      onboarding_completed: updated.onboardingCompleted ?? isCompleted,
      onboardingCompleted: updated.onboardingCompleted ?? isCompleted,
      answers: updated.onboardingAnswers ?? finalAnswers ?? null,
      onboarding_answers: updated.onboardingAnswers ?? finalAnswers ?? null,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update onboarding profile', { error: err });
    return NextResponse.json({ error: 'Failed to update onboarding profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
