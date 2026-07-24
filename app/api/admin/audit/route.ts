import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

// GET /api/admin/audit - Get audit log
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'analytics');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('adminUserId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const logs = await adminRepository.getAuditLog(adminUserId, limit);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to get audit log:', error);
    return NextResponse.json({ error: 'Failed to get audit log' }, { status: 500 });
  }
}