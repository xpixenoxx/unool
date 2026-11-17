// GET /api/referrals — get my referral stats + code
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolvePrimaryWorkspaceId, verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { getOrCreateReferralCode, getReferralStats } from '@/lib/referrals/service';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const requestedWorkspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (requestedWorkspaceId) {
      const hasAccess = await verifyWorkspaceAccess(user.id, requestedWorkspaceId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const workspaceId =
      requestedWorkspaceId || (await resolvePrimaryWorkspaceId(user.id)) || user.id;

    // Get display name for code generation (multi-workspace safe)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    const displayName = (profile as Record<string, unknown> | null)?.name as string ?? '';

    // Ensure code exists BEFORE reading stats (fixes first-visit null code race)
    const code = await getOrCreateReferralCode(user.id, workspaceId, displayName);
    const stats = await getReferralStats(user.id);

    return NextResponse.json(
      {
        code: stats.code || code,
        referrals: stats.referrals,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/referrals error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
