import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

// GET /api/admin/users/stats - Real-time plan distribution and registration metrics
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const distribution = await adminRepository.getUserPlanDistribution();
    return NextResponse.json(distribution);
  } catch (error) {
    console.error('Failed to get user plan distribution:', error);
    return NextResponse.json({ error: 'Failed to get user plan stats' }, { status: 500 });
  }
}
