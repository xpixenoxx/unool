// POST /api/referrals/click — record referral link click (rate-limited, deduplicated)
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { recordReferralClick } from '@/lib/referrals/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(request, 'referralClick');
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitHeaders(rateCheck.remaining, rateCheck.reset) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { code } = body as { code?: string };

    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

    const cleanCode = code.trim().toUpperCase();
    // Skip duplicate click counting if /r/[code] already tracked this code in the same browser session
    const clickedCookie = request.cookies.get('unool_ref_clicked')?.value?.toUpperCase();
    if (clickedCookie === cleanCode) {
      return NextResponse.json({ ok: true, deduplicated: true });
    }

    const referralCode = await recordReferralClick(cleanCode);
    if (!referralCode) return NextResponse.json({ error: 'Invalid code' }, { status: 404 });

    const res = NextResponse.json({ ok: true });
    res.cookies.set('unool_ref_clicked', cleanCode, {
      path: '/',
      maxAge: 600,
      sameSite: 'lax',
      httpOnly: false,
    });
    return res;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/referrals/click error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
