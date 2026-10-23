// POST /api/follow-gate — create a new follow gate
// GET  /api/follow-gate — list gates for current workspace
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { createGate, listGates } from '@/lib/follow-gate/service';
import { logger } from '@/lib/logger';
import type { CreateGateInput } from '@/lib/follow-gate/types';

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

export async function POST(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { workspaceId, title, description, igUsername, igUserId: bodyIgUserId, unlockedContent, ctaText, thumbnailUrl } = body as CreateGateInput & { igUserId?: string };

    if (!workspaceId || !title || !igUsername || !unlockedContent) {
      return NextResponse.json({ error: 'Missing required fields: workspaceId, title, igUsername, unlockedContent' }, { status: 400 });
    }

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Resolve igUserId server-side if not provided by client
    let igUserId = bodyIgUserId;
    if (!igUserId) {
      const { createClient } = await import('@supabase/supabase-js');
      const { config } = await import('@/lib/config/schema');
      const adminDb = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      const { data: conn } = await adminDb
        .from('platform_connections')
        .select('platform_user_id')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'instagram')
        .eq('username', igUsername)
        .eq('status', 'connected')
        .single();
      igUserId = (conn as Record<string, unknown> | null)?.platform_user_id as string ?? '';
    }

    if (!igUserId) {
      return NextResponse.json({ error: 'Could not resolve Instagram user ID. Ensure @' + igUsername + ' is connected.' }, { status: 400 });
    }

    // Validate unlockedContent
    if (!unlockedContent.type || !unlockedContent.label) {
      return NextResponse.json({ error: 'unlockedContent must have type and label' }, { status: 400 });
    }
    if (['link', 'file', 'video'].includes(unlockedContent.type) && !unlockedContent.url) {
      return NextResponse.json({ error: `unlockedContent.url required for type ${unlockedContent.type}` }, { status: 400 });
    }

    const gate = await createGate({
      workspaceId,
      title,
      description,
      igUsername,
      igUserId,
      unlockedContent,
      ctaText,
      thumbnailUrl,
    });

    logger.info('Follow gate created', { gateId: gate.id, workspaceId });
    return NextResponse.json({ gate }, { status: 201 });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/follow-gate error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
