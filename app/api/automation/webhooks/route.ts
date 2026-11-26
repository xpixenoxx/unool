import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { dispatchWorkspaceWebhooks } from '@/lib/services/automation/leadSync';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/automation/webhooks?workspaceId=xxx
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data } = await supabaseAdmin
      .from('automation_webhooks')
      .select('id, name, target_type, url, events, listmonk_list_id, is_active, last_status_code, last_triggered_at, last_error, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ webhooks: data || [] });
  } catch (error) {
    logger.error('GET /api/automation/webhooks error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/automation/webhooks — Create webhook/Listmonk sync OR send a live test ping
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const workspaceId = body.workspaceId || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (body.action === 'test') {
      const result = await dispatchWorkspaceWebhooks(workspaceId, 'lead.captured', {
        test: true,
        username: 'unool_test_lead',
        email: 'test@example.com',
        intentScore: 88,
      });
      return NextResponse.json({ success: true, ...result });
    }

    const name = String(body.name || '').trim();
    const targetType = body.target_type === 'listmonk' ? 'listmonk' : 'webhook';
    const url = targetType === 'listmonk' ? 'listmonk://connected' : String(body.url || '').trim();

    if (!name) return NextResponse.json({ error: 'Webhook name is required' }, { status: 400 });
    if (targetType === 'webhook' && !/^https:\/\//i.test(url)) {
      return NextResponse.json({ error: 'Webhook URL must start with https://' }, { status: 400 });
    }

    const events =
      Array.isArray(body.events) && body.events.length > 0
        ? body.events
        : ['lead.captured', 'dm.replied', 'link.clicked', 'vip.detected'];

    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const signingSecret =
      body.signing_secret?.trim() ||
      `whsec_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;

    const { data, error } = await supabaseAdmin
      .from('automation_webhooks')
      .insert({
        workspace_id: workspaceId,
        name,
        target_type: targetType,
        url,
        signing_secret: signingSecret,
        events,
        listmonk_list_id: body.listmonk_list_id ? Number(body.listmonk_list_id) : null,
        is_active: true,
      })
      .select('id, name, target_type, url, events, listmonk_list_id, is_active, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ webhook: data, signingSecret }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/automation/webhooks error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/automation/webhooks?workspaceId=xxx&id=yyy
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const workspaceId = sp.get('workspaceId') || auth.workspaceId;
    const id = sp.get('id');
    if (!workspaceId || !id) return NextResponse.json({ error: 'workspaceId and id required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await supabaseAdmin
      .from('automation_webhooks')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('DELETE /api/automation/webhooks error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
