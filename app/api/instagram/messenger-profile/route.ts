import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/crypto/encryption';
import { InstagramCommentAutomation } from '@/lib/services/InstagramCommentAutomation';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/instagram/messenger-profile?workspaceId=xxx
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
      .from('instagram_automation_config')
      .select('ice_breakers, persistent_menu')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    return NextResponse.json({
      iceBreakers: Array.isArray(data?.ice_breakers) ? data.ice_breakers : [],
      persistentMenu: Array.isArray(data?.persistent_menu) ? data.persistent_menu : [],
    });
  } catch (error) {
    logger.error('GET /api/instagram/messenger-profile error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/instagram/messenger-profile
// Saves Ice Breakers (max 4) and Persistent Menu to DB and syncs directly to Meta Messenger Profile API.
export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const workspaceId = body.workspaceId || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const iceBreakers = Array.isArray(body.iceBreakers)
      ? body.iceBreakers
          .filter((ib: any) => ib?.question && String(ib.question).trim())
          .slice(0, 4)
          .map((ib: any) => ({
            question: String(ib.question).trim().slice(0, 80),
            payload: String(ib.payload || ib.question).trim().slice(0, 100),
          }))
      : [];

    const persistentMenu = Array.isArray(body.persistentMenu)
      ? body.persistentMenu
          .filter((m: any) => m?.title && String(m.title).trim())
          .slice(0, 5)
          .map((m: any) => ({
            type: m.type === 'web_url' ? ('web_url' as const) : ('postback' as const),
            title: String(m.title).trim().slice(0, 30),
            ...(m.type === 'web_url' ? { url: String(m.url || '').trim() } : { payload: String(m.payload || m.title).trim() }),
          }))
      : [];

    await supabaseAdmin.from('instagram_automation_config').upsert(
      {
        workspace_id: workspaceId,
        ice_breakers: iceBreakers,
        persistent_menu: persistentMenu,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id' }
    );

    let metaSync = { iceBreakers: false, persistentMenu: false, errors: [] as string[] };
    const { data: conns } = await supabaseAdmin
      .from('platform_connections')
      .select('platform_user_id, access_token_encrypted')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')
      .eq('status', 'connected')
      .limit(1);

    if (conns?.[0]?.access_token_encrypted) {
      try {
        const token = await decryptToken(conns[0].access_token_encrypted);
        const automation = new InstagramCommentAutomation(config.GROQ_API_KEY || '');
        const [ibRes, pmRes] = await Promise.all([
          automation.syncIceBreakers(token, conns[0].platform_user_id, iceBreakers),
          automation.syncPersistentMenu(token, conns[0].platform_user_id, persistentMenu),
        ]);
        metaSync.iceBreakers = ibRes.ok;
        metaSync.persistentMenu = pmRes.ok;
        if (!ibRes.ok && ibRes.error) metaSync.errors.push(`Ice Breakers: ${ibRes.error}`);
        if (!pmRes.ok && pmRes.error) metaSync.errors.push(`Persistent Menu: ${pmRes.error}`);
      } catch (err) {
        metaSync.errors.push(err instanceof Error ? err.message : 'Token sync failed');
      }
    }

    return NextResponse.json({
      success: true,
      iceBreakers,
      persistentMenu,
      metaSync,
    });
  } catch (error) {
    logger.error('PUT /api/instagram/messenger-profile error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
