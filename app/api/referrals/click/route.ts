// POST /api/referrals/click — record referral link click (public, no auth needed)
import { NextRequest, NextResponse } from 'next/server';
import { recordReferralClick } from '@/lib/referrals/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code } = body as { code?: string };

    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

    const referralCode = await recordReferralClick(code);
    if (!referralCode) return NextResponse.json({ error: 'Invalid code' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/referrals/click error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
