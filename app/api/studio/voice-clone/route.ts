import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import {
  checkVoiceCloneRateLimit,
  cloneCreatorVoiceForWorkspace,
  isVoiceClonePlatform,
} from '@/lib/ai/voiceCloning';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();
const platformRepository = new SupabasePlatformRepository();

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/studio/voice-clone
 * Returns current Voice Fingerprint status and connected voice-capable social accounts.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profile, connections] = await Promise.all([
      profileRepository.findByWorkspaceId(auth.workspaceId),
      platformRepository.findByWorkspaceId(auth.workspaceId),
    ]);

    const connectedVoiceChannels = connections
      .filter((c) => c.status === 'connected' && isVoiceClonePlatform(c.platform))
      .map((c) => ({
        id: c.id,
        platform: c.platform,
        username: c.username,
        displayName: c.displayName || null,
      }));

    const studioProfile = profile?.studioProfile || null;
    const voiceFingerprint = studioProfile?.voiceFingerprint || null;

    return NextResponse.json({
      profile: studioProfile,
      voiceFingerprint,
      hasVoiceFingerprint: Boolean(voiceFingerprint),
      connectedVoiceChannels,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to fetch voice clone status', { error: err });
    return NextResponse.json({ error: 'Failed to fetch voice clone status' }, { status: 500 });
  }
}

/**
 * POST /api/studio/voice-clone
 * Ingests top 20 historical posts from connected LinkedIn/X/Instagram (+ optional pasted sample posts)
 * and synthesizes the workspace's StudioProfile + quantitative VoiceFingerprint in <15s.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, [
      'owner',
      'admin',
      'editor',
    ]);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Insufficient workspace permissions to calibrate AI Voice.' },
        { status: 403 }
      );
    }

    const rateCheck = checkVoiceCloneRateLimit(auth.workspaceId, 15, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Voice calibration rate limit reached. Try again shortly.',
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: rateCheck.resetTime,
        },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const preferredPlatform =
      typeof body?.platform === 'string' && isVoiceClonePlatform(body.platform)
        ? body.platform.toLowerCase()
        : undefined;
    const preferredConnectionId =
      typeof body?.connectionId === 'string' && body.connectionId.trim()
        ? body.connectionId.trim()
        : undefined;
    const forceOverwrite = body?.forceOverwrite === true;

    const rawSamples = Array.isArray(body?.samplePosts) ? body.samplePosts : [];
    const samplePosts = rawSamples
      .filter((item: unknown): item is string => typeof item === 'string')
      .map((s: string) => s.slice(0, 3000).trim())
      .filter((s: string) => s.length >= 18)
      .slice(0, 20);

    // Ensure at least one connected voice channel or sample post exists when none is passed
    if (samplePosts.length === 0) {
      const connections = await platformRepository.findByWorkspaceId(auth.workspaceId);
      const hasVoiceChannel = connections.some(
        (c) => c.status === 'connected' && isVoiceClonePlatform(c.platform)
      );
      if (!hasVoiceChannel) {
        return NextResponse.json(
          {
            error:
              'Connect LinkedIn, X, or Instagram (or paste sample posts) to clone your writing voice.',
            code: 'NO_VOICE_SOURCE',
          },
          { status: 400 }
        );
      }
    }

    const result = await cloneCreatorVoiceForWorkspace({
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      preferredPlatform,
      preferredConnectionId,
      samplePosts,
      forceOverwrite,
    });

    return NextResponse.json({
      success: true,
      profile: result.profile,
      voiceFingerprint: result.voiceFingerprint,
      postsAnalyzed: result.postsAnalyzed,
      sourcePlatforms: result.sourcePlatforms,
      confidence: result.confidence,
      skippedManualOverwrite: result.skippedManualOverwrite,
      durationMs: result.durationMs,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Voice clone execution failed', { error: err });
    return NextResponse.json({ error: 'Failed to clone writing voice' }, { status: 500 });
  }
}
