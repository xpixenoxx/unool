import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import type { ListPaymentOrdersParams } from '@/lib/repositories/interfaces/IAdminRepository';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'payments');
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);

  const params: ListPaymentOrdersParams = {
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '20'),
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    planId: searchParams.get('planId') || undefined,
    workspaceId: searchParams.get('workspaceId') || undefined,
    sortBy: (searchParams.get('sortBy') as ListPaymentOrdersParams['sortBy']) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
  };

  try {
    const result = await adminRepository.listPaymentOrders(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin list payment orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment orders' },
      { status: 500 }
    );
  }
}

