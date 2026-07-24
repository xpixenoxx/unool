import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

// GET /api/admin/analytics - Get analytics summary
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'analytics');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || undefined;
    const days = parseInt(searchParams.get('days') || '30');

    const summary = await adminRepository.getAnalyticsSummary(workspaceId, days);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}