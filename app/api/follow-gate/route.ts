// POST /api/follow-gate — create a new follow gate
// GET  /api/follow-gate — list gates for current workspace
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { listGates } from '@/lib/follow-gate/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const gates = await listGates(workspaceId);
    return NextResponse.json({ gates });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/follow-gate error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Standalone unlock gate creation has been sunset. Configure the In-DM Follow Gate inside Dashboard -> Automation -> Instagram instead.',
      code: 'FEATURE_SUNSET',
      redirectTo: '/dashboard/automation?tab=instagram&section=follow-gate',
    },
    { status: 410 }
  );
}
