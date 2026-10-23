// GET /api/follow-gate/[gateId]/check?sessionToken=...
//
// Dual-mode verification:
//   1. If session already verified (webhook path) → return unlocked content immediately.
//   2. Otherwise → call IG Graph API to check if visitor is following.
//
// The browser polls this every 5 seconds after the visitor clicks "I followed".
import { NextRequest, NextResponse } from 'next/server';
import {
  getGate,
  getSession,
  checkFollowViaApi,
  getCreatorAccessToken,
  markSessionVerified,
} from '@/lib/follow-gate/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gateId: string }> }
) {
  try {
    const { gateId } = await params;
    const sessionToken = request.nextUrl.searchParams.get('sessionToken');
    const visitorIgUserId = request.nextUrl.searchParams.get('visitorIgUserId');
    const visitorIgUsername = request.nextUrl.searchParams.get('visitorIgUsername');

    if (!sessionToken) {
      return NextResponse.json({ error: 'sessionToken required' }, { status: 400 });
    }

    // Fetch session — validates non-expired
    const session = await getSession(sessionToken);
    if (!session || session.gateId !== gateId) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
    }

    // ── Path 1: Already verified (webhook beat us) ─────────────────────────────
    if (session.followVerified) {
      const gate = await getGate(gateId);
      return NextResponse.json({
        followVerified: true,
        unlockedContent: gate?.unlockedContent ?? null,
        expiresAt: session.expiresAt,
      });
    }

    // ── Path 2: Visitor hasn't provided IG user id yet ─────────────────────────
    if (!visitorIgUserId) {
      return NextResponse.json({
        followVerified: false,
        expiresAt: session.expiresAt,
        message: 'Waiting for visitor IG authentication',
      });
    }

    // ── Path 3: Poll via Graph API ─────────────────────────────────────────────
    const gate = await getGate(gateId);
    if (!gate) return NextResponse.json({ error: 'Gate not found' }, { status: 404 });

    const accessToken = await getCreatorAccessToken(gate.workspaceId, gate.igUserId);
    if (!accessToken) {
      // Cannot verify — degrade gracefully (mark as verified manually for now)
      // In production, require creator to reconnect IG.
      logger.warn('No access token for follow check — cannot verify', {
        gateId,
        igUserId: gate.igUserId,
      });
      return NextResponse.json({
        followVerified: false,
        error: 'Instagram not connected',
        expiresAt: session.expiresAt,
      });
    }

    const result = await checkFollowViaApi(gate.igUserId, visitorIgUserId, accessToken);

    if (result.isFollowing) {
      await markSessionVerified(
        sessionToken,
        visitorIgUserId,
        visitorIgUsername ?? '',
        'polling'
      );

      return NextResponse.json({
        followVerified: true,
        unlockedContent: gate.unlockedContent,
        expiresAt: session.expiresAt,
      });
    }

    return NextResponse.json({
      followVerified: false,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/follow-gate/[gateId]/check error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
