import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';
import { generateWeekArc, detectStoryType, synthesizeFactGroundedArc, getUpcomingDaysForArc } from '@/lib/ai/WeekArcGenerator';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import type { PlatformType } from '@/lib/ai/PostAdapter';
import { config } from '@/lib/config/schema';

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

    if (!coreStory || typeof coreStory !== 'string') {
      return NextResponse.json(
        { error: 'Core story is required.' },
        { status: 400 }
      );
    }

    // ─── DEV_MOCK_ARC: Return deterministic synthesized arc for visual testing ───
    if (config.DEV_AUTH_BYPASS === true && config.DEV_MOCK_ARC === true) {
      logger.info('DEV_MOCK_ARC enabled — returning synthesized week arc for visual testing', {
        workspaceId,
        storyLength: coreStory.length,
      });

      // Get user's profile for first name (with safe fallback if Supabase is offline)
      let userFirstName = 'Creator';
      let profileId: string | undefined = undefined;
      try {
        const profile = await profileRepository.findByWorkspaceId(workspaceId);
        if (profile?.name) userFirstName = profile.name.split(' ')[0];
        profileId = profile?.id;
      } catch {
        // Safe dev fallback
      }

      // Get connected platforms (with safe fallback if Supabase is offline)
      let connectedPlatforms: PlatformType[] = ['linkedin', 'threads', 'x'];
      let isPreviewOnly = true;
      try {
        const platformRepo = new SupabasePlatformRepository();
        const connections = await platformRepo.findByWorkspaceId(workspaceId);
        const active = connections
          .filter(c => c.status === 'connected')
          .map(c => c.platform as PlatformType);
        if (active.length > 0) {
          connectedPlatforms = active;
          isPreviewOnly = false;
        }
      } catch {
        // Safe dev fallback
      }

      if (selectedPlatforms && Array.isArray(selectedPlatforms) && selectedPlatforms.length > 0) {
        const validSelected = (selectedPlatforms as PlatformType[]).filter(p =>
          isPreviewOnly || connectedPlatforms.includes(p)
        );
        if (validSelected.length > 0) {
          connectedPlatforms = validSelected;
        }
      }

      // Synthesize a deterministic week arc using the fact-grounded fallback
      const mockArc = synthesizeFactGroundedArc({
        coreStory: ContentGuard.sanitizeForAI(coreStory),
        followUps: {
          whatChanged: ContentGuard.sanitizeForAI(whatChanged || ''),
          whatWentWrong: ContentGuard.sanitizeForAI(whatWentWrong || ''),
          oneRealNumber: ContentGuard.sanitizeForAI(oneRealNumber || ''),
        },
        connectedPlatforms,
        audienceTimezone,
        userFirstName,
        weekStartDate,
      });

      if (!mockArc) {
        logger.warn('DEV_MOCK_ARC synthesis failed — falling back to AI generation');
      } else {
        const storyType = detectStoryType(coreStory);
        return NextResponse.json({
          success: true,
          arc: mockArc,
          isPreviewOnly,
          metadata: {
            storyType,
            weekStartDate,
            profileId: profileId,
            connectedPlatforms,
            isPreviewOnly,
            isMock: true,
          },
        });
      }
    }

    // ─── ContentGuard: validate core story before Week Arc generation ─────────
    const guard = ContentGuard.validateInput(coreStory, { route: 'composer/arc/generate' });
    if (!guard.safe) {
      logger.warn('ContentGuard blocked week arc coreStory input', {
        code: guard.violation.code,
        internal: guard.violation.internal,
        workspaceId,
      });
      return NextResponse.json(ContentGuard.blockedResponse(guard.violation), { status: 400 });
    }

    // ─── ContentGuard: validate followups for safety ─────────────────────────
    const combinedFollowUps = `${whatChanged} ${whatWentWrong} ${oneRealNumber}`.trim();
    if (combinedFollowUps) {
      const followUpGuard = ContentGuard.validateSocialInput(combinedFollowUps, {
        route: 'composer/arc/generate/followups',
      });
      if (!followUpGuard.safe) {
        logger.warn('ContentGuard blocked week arc followups', {
          code: followUpGuard.violation.code,
          internal: followUpGuard.violation.internal,
          workspaceId,
        });
        return NextResponse.json(ContentGuard.blockedResponse(followUpGuard.violation), {
          status: 400,
        });
      }
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
      coreStory: guard.sanitizedContent,
      followUps: {
        whatChanged: ContentGuard.sanitizeForAI(whatChanged || ''),
        whatWentWrong: ContentGuard.sanitizeForAI(whatWentWrong || ''),
        oneRealNumber: ContentGuard.sanitizeForAI(oneRealNumber || ''),
      },
      connectedPlatforms,
      audienceTimezone,
      userFirstName,
      weekStartDate,
      onboardingAnswers: profile.onboardingAnswers,
    });

    if (!arc) {
      logger.error('Arc generation failed or was blocked by safety policy', { workspaceId });
      return NextResponse.json(
        {
          error: 'This content cannot be processed into a week plan — it appears to violate our content safety guidelines or quality standards.',
          code: 'CONTENT_UNGENERATABLE',
        },
        { status: 400 }
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
