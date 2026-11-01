import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let reason = 'Suspended by admin';
  let durationHours: number | null = null;

  try {
    const body = await request.json().catch(() => ({}));
    if (body.reason && typeof body.reason === 'string') {
      reason = body.reason.trim();
    }
    if (typeof body.durationHours === 'number' && !isNaN(body.durationHours) && body.durationHours > 0) {
      durationHours = Math.round(body.durationHours);
    } else if (typeof body.durationHours === 'string' && !isNaN(parseInt(body.durationHours, 10)) && parseInt(body.durationHours, 10) > 0) {
      durationHours = Math.round(parseInt(body.durationHours, 10));
    } else if (body.durationHours === 'permanent' || body.durationHours === null) {
      durationHours = null;
    }
  } catch {}

  try {
    const success = await adminRepository.suspendUser(id, auth.admin.userId, reason, durationHours);
    return NextResponse.json({ success, durationHours });
  } catch (error) {
    console.error('Failed to suspend user:', error);
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
  }
}
