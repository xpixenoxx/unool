import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/instagram/campaigns/[id]/coupons?workspaceId=xxx
export async function GET(
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

    const { data, error } = await supabaseAdmin
      .from('campaign_coupons')
      .select('id, code, claimed_by_contact_id, claimed_at, created_at')
      .eq('workspace_id', workspaceId)
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const coupons = data || [];
    const claimed = coupons.filter((c: any) => Boolean(c.claimed_at)).length;
    return NextResponse.json({
      coupons,
      stats: {
        total: coupons.length,
        claimed,
        available: coupons.length - claimed,
      },
    });
  } catch (error) {
    logger.error('GET /api/instagram/campaigns/[id]/coupons error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/instagram/campaigns/[id]/coupons
// Body: { workspaceId, codes: string[] | string (newline/comma separated) }
export async function POST(
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

    const rawCodes: string[] = Array.isArray(body.codes)
      ? body.codes.map((c: unknown) => String(c))
      : typeof body.codes === 'string'
        ? body.codes.split(/[\n,;]+/)
        : [];

    const uniqueCodes = Array.from(
      new Set(rawCodes.map((c) => c.trim()).filter((c) => c.length >= 2 && c.length <= 64))
    ).slice(0, 1000);

    if (uniqueCodes.length === 0) {
      return NextResponse.json({ error: 'Provide at least one valid coupon code' }, { status: 400 });
    }

    const rows = uniqueCodes.map((code) => ({
      workspace_id: workspaceId,
      campaign_id: id,
      code,
    }));

    const { error } = await supabaseAdmin
      .from('campaign_coupons')
      .upsert(rows, { onConflict: 'campaign_id,code', ignoreDuplicates: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, uploadedCount: uniqueCodes.length });
  } catch (error) {
    logger.error('POST /api/instagram/campaigns/[id]/coupons error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
