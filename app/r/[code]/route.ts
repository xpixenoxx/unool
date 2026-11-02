import { NextRequest, NextResponse } from 'next/server';
import { recordReferralClick } from '@/lib/referrals/service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cleanCode = (code || '').trim().toUpperCase();

  if (cleanCode) {
    try {
      await recordReferralClick(cleanCode);
    } catch (err) {
      console.warn('[r/[code]] Error recording referral click:', err);
    }
  }

  const { origin } = new URL(request.url);
  const redirectUrl = new URL('/signup', origin);
  if (cleanCode) {
    redirectUrl.searchParams.set('ref', cleanCode);
  }

  const response = NextResponse.redirect(redirectUrl);
  if (cleanCode) {
    response.cookies.set('unool_ref', cleanCode, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  return response;
}

