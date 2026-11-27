import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { recordReferralClick, sanitizeReferralCodeInput } from '@/lib/referrals/service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cleanCode = sanitizeReferralCodeInput(code);

  const existingRefCookie = sanitizeReferralCodeInput(request.cookies.get('unool_ref')?.value);
  const alreadyClickedCookie = sanitizeReferralCodeInput(request.cookies.get('unool_ref_clicked')?.value);

  let canonicalCode = cleanCode;
  if (cleanCode && alreadyClickedCookie !== cleanCode) {
    try {
      const rateCheck = await checkRateLimit(request, 'referralClick');
      if (rateCheck.success) {
        const recorded = await recordReferralClick(cleanCode);
        if (recorded?.code) {
          canonicalCode = recorded.code;
        }
      }
    } catch (err) {
      console.warn('[r/[code]] Error recording referral click:', err);
    }
  }

  const { origin } = new URL(request.url);
  const redirectUrl = new URL('/signup', origin);
  const effectiveCode = existingRefCookie || canonicalCode;
  if (effectiveCode) {
    redirectUrl.searchParams.set('ref', effectiveCode);
  }

  const response = NextResponse.redirect(redirectUrl);
  // First-touch attribution: preserve original unool_ref if already present
  if (canonicalCode && !existingRefCookie) {
    response.cookies.set('unool_ref', canonicalCode, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      httpOnly: false,
    });
  }
  if (canonicalCode) {
    response.cookies.set('unool_ref_clicked', canonicalCode, {
      path: '/',
      maxAge: 600, // 10 minutes — prevents double counting on /signup load
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  return response;
}

