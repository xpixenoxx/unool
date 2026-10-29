import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'payments');
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const metrics = await adminRepository.getRevenueMetrics(days);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Admin revenue metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue metrics' },
      { status: 500 }
    );
  }
}

