import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import type { ListSubscriptionsParams } from '@/lib/repositories/interfaces/IAdminRepository';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'payments');
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);

  const params: ListSubscriptionsParams = {
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '20'),
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    planId: searchParams.get('planId') || undefined,
    workspaceId: searchParams.get('workspaceId') || undefined,
    sortBy: (searchParams.get('sortBy') as ListSubscriptionsParams['sortBy']) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };

  try {
    const result = await adminRepository.listSubscriptions(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin list subscriptions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

