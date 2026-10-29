import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

// GET /api/admin/referrals - Get referral codes or referral events
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'referrals');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'codes';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || undefined;
    const code = searchParams.get('code') || undefined;

    if (view === 'log') {
      const result = await adminRepository.listReferrals(page, pageSize, code);
      return NextResponse.json(result);
    }

    // Default: referral codes
    const result = await adminRepository.listReferralCodes({
      page,
      pageSize,
      search,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get referral data:', error);
    return NextResponse.json({ error: 'Failed to get referral data' }, { status: 500 });
  }
}

