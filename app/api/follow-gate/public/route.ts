// GET /api/follow-gate/public?gateId=...
// Public endpoint — no auth. Returns gate metadata (NOT unlocked content).
// Used by the public profile to render the gate card.
import { NextRequest, NextResponse } from 'next/server';
import { getGate } from '@/lib/follow-gate/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const gateId = request.nextUrl.searchParams.get('gateId');
    if (!gateId) return NextResponse.json({ error: 'gateId required' }, { status: 400 });

    const gate = await getGate(gateId);
    if (!gate) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!gate.isActive) return NextResponse.json({ error: 'Gate inactive' }, { status: 410 });

    // Only expose public-safe fields — never expose unlocked content here
    return NextResponse.json({
      id: gate.id,
      title: gate.title,
      description: gate.description,
      igUsername: gate.igUsername,
      ctaText: gate.ctaText,
      thumbnailUrl: gate.thumbnailUrl,
      unlockCount: gate.unlockCount,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/follow-gate/public error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
