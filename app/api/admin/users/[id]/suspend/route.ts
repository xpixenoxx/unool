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
  try {
    const body = await request.json().catch(() => ({}));
    if (body.reason) reason = body.reason;
  } catch {}

  try {
    const success = await adminRepository.suspendUser(id, auth.admin.userId, reason);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to suspend user:', error);
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
  }
}

