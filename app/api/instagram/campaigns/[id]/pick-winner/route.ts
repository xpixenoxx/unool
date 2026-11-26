import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/instagram/campaigns/[id]/pick-winner
 * Cryptographically fair random Giveaway winner draw from verified campaign participants.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || auth.workspaceId;
    const winnerCount = Math.max(1, Math.min(20, Number(body.winnerCount || 1)));
    const requireFollow = Boolean(body.requireFollow);
    const requireEmail = Boolean(body.requireEmail);

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: enrollments } = await supabaseAdmin
      .from('campaign_enrollments')
      .select('id, contact_id, platform_user_id, follow_verified, lead_captured, created_at')
      .eq('workspace_id', workspaceId)
      .eq('campaign_id', id)
      .limit(5000);

    const rows = Array.isArray(enrollments) ? enrollments : [];
    const contactIds = Array.from(
      new Set(rows.map((r: any) => r.contact_id).filter(Boolean))
    ) as string[];

    const contactMap = new Map<string, any>();
    if (contactIds.length > 0) {
      const { data: contacts } = await supabaseAdmin
        .from('workspace_contacts')
        .select('id, username, full_name, email, phone, is_following_business, is_vip')
        .eq('workspace_id', workspaceId)
        .in('id', contactIds);
      for (const c of contacts || []) contactMap.set(c.id, c);
    }

    // Deduplicate entries by unique participant (1 entry per person)
    const eligibleMap = new Map<string, any>();
    for (const row of rows) {
      const contact = row.contact_id ? contactMap.get(row.contact_id) : null;
      const followed = Boolean(row.follow_verified || contact?.is_following_business);
      const hasEmail = Boolean(contact?.email || row.lead_captured);
      if (requireFollow && !followed) continue;
      if (requireEmail && !hasEmail) continue;

      const key = row.platform_user_id || row.contact_id || row.id;
      if (!eligibleMap.has(key)) {
        eligibleMap.set(key, {
          enrollmentId: row.id,
          contactId: row.contact_id,
          platformUserId: row.platform_user_id,
          username: contact?.username || row.platform_user_id,
          fullName: contact?.full_name || null,
          email: contact?.email || null,
          followed,
          enteredAt: row.created_at,
        });
      }
    }

    const pool = Array.from(eligibleMap.values());
    if (pool.length === 0) {
      return NextResponse.json({
        success: true,
        totalEligible: 0,
        winners: [],
        message: 'No eligible participants match the selected filters yet.',
      });
    }

    // Cryptographic Fisher-Yates draw
    const winners: any[] = [];
    const remaining = [...pool];
    const drawN = Math.min(winnerCount, remaining.length);
    const randBuf = new Uint32Array(drawN);
    crypto.getRandomValues(randBuf);

    for (let i = 0; i < drawN; i++) {
      const idx = randBuf[i] % remaining.length;
      winners.push(remaining.splice(idx, 1)[0]);
    }

    return NextResponse.json({
      success: true,
      totalEligible: pool.length,
      winners,
      drawnAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('POST /api/instagram/campaigns/[id]/pick-winner error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Winner draw failed' }, { status: 500 });
  }
}
