import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { recordReferralClick } from '@/lib/referrals/service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cleanCode = (code || '').trim().toUpperCase();

  const existingRefCookie = request.cookies.get('unool_ref')?.value?.trim().toUpperCase();
  const alreadyClickedCookie = request.cookies.get('unool_ref_clicked')?.value?.trim().toUpperCase();

  if (cleanCode && alreadyClickedCookie !== cleanCode) {
    try {
      const rateCheck = await checkRateLimit(request, 'referralClick');
      if (rateCheck.success) {
        await recordReferralClick(cleanCode);
      }
    } catch (err) {
      console.warn('[r/[code]] Error recording referral click:', err);
    }
  }

  const { origin } = new URL(request.url);
  const redirectUrl = new URL('/signup', origin);
  const effectiveCode = existingRefCookie || cleanCode;
  if (effectiveCode) {
    redirectUrl.searchParams.set('ref', effectiveCode);
  }

  const response = NextResponse.redirect(redirectUrl);
  // First-touch attribution: preserve original unool_ref if already present
  if (cleanCode && !existingRefCookie) {
    response.cookies.set('unool_ref', cleanCode, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      httpOnly: false,
    });
  }
  if (cleanCode) {
    response.cookies.set('unool_ref_clicked', cleanCode, {
      path: '/',
      maxAge: 600, // 10 minutes — prevents double counting on /signup load
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  return response;
}

