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

  try {
    const success = await adminRepository.unsuspendUser(id, auth.admin.userId);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to unsuspend user:', error);
    return NextResponse.json({ error: 'Failed to unsuspend user' }, { status: 500 });
  }
}

