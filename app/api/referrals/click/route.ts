// POST /api/referrals/click — record referral link click (rate-limited, deduplicated)
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { recordReferralClick, sanitizeReferralCodeInput } from '@/lib/referrals/service';
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

    const cleanCode = sanitizeReferralCodeInput(code);
    if (!cleanCode) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

    // Skip duplicate click counting if /r/[code] already tracked this code in the same browser session
    const clickedCookie = sanitizeReferralCodeInput(request.cookies.get('unool_ref_clicked')?.value);
    if (clickedCookie === cleanCode) {
      return NextResponse.json({ ok: true, deduplicated: true, code: cleanCode });
    }

    const referralCode = await recordReferralClick(cleanCode);
    if (!referralCode) return NextResponse.json({ error: 'Invalid code' }, { status: 404 });

    const canonicalCode = referralCode.code || cleanCode;
    const existingRefCookie = sanitizeReferralCodeInput(request.cookies.get('unool_ref')?.value);
    const res = NextResponse.json({ ok: true, code: canonicalCode });
    if (!existingRefCookie) {
      res.cookies.set('unool_ref', canonicalCode, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
        httpOnly: false,
      });
    }
    res.cookies.set('unool_ref_clicked', canonicalCode, {
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
