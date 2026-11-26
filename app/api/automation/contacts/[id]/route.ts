import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// PATCH /api/automation/contacts/[id] — Update tags, pause/resume AI, VIP flag, opt-out
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const workspaceId = body.workspaceId || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (Array.isArray(body.tags)) {
      patch.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 20);
    }
    if (typeof body.is_vip === 'boolean') patch.is_vip = body.is_vip;
    if (typeof body.opted_out === 'boolean') {
      patch.opted_out = body.opted_out;
      patch.opted_out_at = body.opted_out ? new Date().toISOString() : null;
    }
    if (body.pauseAiHours === 0 || body.resumeAi === true) {
      patch.ai_paused_until = null;
    } else if (typeof body.pauseAiHours === 'number' && body.pauseAiHours > 0) {
      patch.ai_paused_until = new Date(Date.now() + body.pauseAiHours * 60 * 60 * 1000).toISOString();
    } else if ('ai_paused_until' in body) {
      patch.ai_paused_until = body.ai_paused_until;
    }

    const { data, error } = await supabaseAdmin
      .from('workspace_contacts')
      .update(patch)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data });
  } catch (error) {
    logger.error('PATCH /api/automation/contacts/[id] error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/automation/contacts/[id]?workspaceId=xxx — GDPR / DPDP Contact Erasure
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await supabaseAdmin
      .from('workspace_contacts')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, erased: true });
  } catch (error) {
    logger.error('DELETE /api/automation/contacts/[id] error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
