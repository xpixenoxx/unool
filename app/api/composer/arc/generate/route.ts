import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';
import { generateWeekArc, detectStoryType } from '@/lib/ai/WeekArcGenerator';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';
import type { PlatformType } from '@/lib/ai/PostAdapter';

const profileRepository = new SupabaseProfileRepository();

export const maxDuration = 120; // Arc generation can take up to 2 minutes

export async function POST(request: NextRequest) {
  return planEnforcement.useAI(request, async (request) => {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { workspaceId, userId } = auth;

    const body = await request.json();
    const {
      coreStory,
      whatChanged = '',
      whatWentWrong = '',
      oneRealNumber = '',
      audienceTimezone = 'UTC',
      weekStartDate,        // ISO date string e.g. "2026-10-12"
      selectedPlatforms,
    } = body;

    if (!coreStory || typeof coreStory !== 'string' || coreStory.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide a more detailed story (at least 20 characters)' },
        { status: 400 }
      );
    }

    if (!weekStartDate) {
      return NextResponse.json({ error: 'weekStartDate is required' }, { status: 400 });
    }

    // Get user's profile and connected platforms
    const profile = await profileRepository.findByWorkspaceId(workspaceId);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please create a profile first.' },
        { status: 400 }
      );
    }

    const platformRepo = new SupabasePlatformRepository();
    const connections = await platformRepo.findByWorkspaceId(workspaceId);
    let connectedPlatforms = connections
      .filter(c => c.status === 'connected')
      .map(c => c.platform as PlatformType);

    const isPreviewOnly = connectedPlatforms.length === 0;
    if (isPreviewOnly) {
      // Allow users to generate and preview their week arc before connecting accounts
      connectedPlatforms = ['linkedin', 'threads', 'x'];
    }

    if (selectedPlatforms && Array.isArray(selectedPlatforms) && selectedPlatforms.length > 0) {
      const validSelected = (selectedPlatforms as PlatformType[]).filter(p =>
        isPreviewOnly || connectedPlatforms.includes(p)
      );
      if (validSelected.length > 0) {
        connectedPlatforms = validSelected;
      }
    }

    logger.info('Generating week arc', {
      workspaceId,
      storyLength: coreStory.length,
      connectedPlatforms,
      audienceTimezone,
      weekStartDate,
    });

    const userFirstName = profile.name?.split(' ')[0] ?? 'Creator';

    const arc = await generateWeekArc({
      coreStory: coreStory.trim(),
      followUps: {
        whatChanged: whatChanged.trim(),
        whatWentWrong: whatWentWrong.trim(),
        oneRealNumber: oneRealNumber.trim(),
      },
      connectedPlatforms,
      audienceTimezone,
      userFirstName,
      weekStartDate,
    });

    if (!arc) {
      logger.error('Arc generation failed', { workspaceId });
      return NextResponse.json(
        { error: 'Failed to generate week plan. Please try again.' },
        { status: 500 }
      );
    }

    const storyType = detectStoryType(coreStory);

    return NextResponse.json({
      success: true,
      arc,
      isPreviewOnly,
      metadata: {
        storyType,
        weekStartDate,
        profileId: profile.id,
        connectedPlatforms,
        isPreviewOnly,
      },
    });
  });
}
