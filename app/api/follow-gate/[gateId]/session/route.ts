// POST /api/follow-gate/[gateId]/session
// Creates a new visitor session for a gate (called when visitor lands on gate).
// Returns sessionToken — browser uses this to poll for verification.
import { NextRequest, NextResponse } from 'next/server';
import { getGate, createSession } from '@/lib/follow-gate/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ gateId: string }> }
) {
  try {
    const { gateId } = await params;

    const gate = await getGate(gateId);
    if (!gate) return NextResponse.json({ error: 'Gate not found' }, { status: 404 });
    if (!gate.isActive) return NextResponse.json({ error: 'Gate is not active' }, { status: 410 });

    const session = await createSession(gateId, gate.workspaceId);

    return NextResponse.json({
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      gateId,
      igUsername: gate.igUsername,
      ctaText: gate.ctaText,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/follow-gate/[gateId]/session error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
