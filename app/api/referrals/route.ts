// GET  /api/referrals — get my referral stats + code
// POST /api/referrals/click — record a referral link click (public, no auth)
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOrCreateReferralCode, getReferralStats } from '@/lib/referrals/service';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    // Get display name for code generation
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

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
