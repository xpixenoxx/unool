// GET  /api/referrals — get my referral stats + code
// POST /api/referrals/click — record a referral link click (public, no auth)
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOrCreateReferralCode, getReferralStats } from '@/lib/referrals/service';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (workspaceId) {
      const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      const { data: member } = await supabaseAdmin
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      workspaceId = (member as { workspace_id?: string } | null)?.workspace_id || user.id;
    }

    // Get display name for code generation (avoid .single() across multiple workspace profiles)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const displayName = (profile as Record<string, unknown> | null)?.name as string ?? '';

    // Get or create code and stats in parallel
    const [, stats] = await Promise.all([
      getOrCreateReferralCode(user.id, workspaceId, displayName),
      getReferralStats(user.id),
    ]);

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/referrals error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
