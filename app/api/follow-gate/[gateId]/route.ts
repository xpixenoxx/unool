// GET/PATCH/DELETE /api/follow-gate/[gateId]
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { getGate, updateGate, deleteGate, toggleGate } from '@/lib/follow-gate/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gateId: string }> }
) {
  try {
    const { gateId } = await params;
    const gate = await getGate(gateId);
    if (!gate) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ gate });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/follow-gate/[gateId] error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gateId: string }> }
) {
  try {
    const { gateId } = await params;
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { workspaceId, isActive, ...updates } = body;

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Handle toggle separately
    if (typeof isActive === 'boolean') {
      await toggleGate(gateId, workspaceId, isActive);
    }

    // Handle other field updates
    const hasOtherUpdates = Object.keys(updates).length > 0;
    if (hasOtherUpdates) {
      const gate = await updateGate(gateId, workspaceId, updates);
      return NextResponse.json({ gate });
    }

    const gate = await getGate(gateId);
    return NextResponse.json({ gate });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('PATCH /api/follow-gate/[gateId] error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gateId: string }> }
) {
  try {
    const { gateId } = await params;
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await deleteGate(gateId, workspaceId);
    logger.info('Follow gate deleted', { gateId, workspaceId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('DELETE /api/follow-gate/[gateId] error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
