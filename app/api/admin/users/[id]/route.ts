import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import type { UpdateAdminUserInput } from '@/lib/repositories/interfaces/IAdminRepository';

// GET /api/admin/users/[id] - Get single admin user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const adminUser = await adminRepository.getAdminUserById(id);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }
    return NextResponse.json(adminUser);
  } catch (error) {
    console.error('Failed to get admin user:', error);
    return NextResponse.json({ error: 'Failed to get admin user' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update admin user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { role, permissions } = body as UpdateAdminUserInput;

    // Prevent self-demotion
    if (id === auth.admin.userId && role && role !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const adminUser = await adminRepository.updateAdminUser(id, { role, permissions });
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'admin_user_update',
      'admin_user',
      id,
      { role, permissions }
    );

    return NextResponse.json(adminUser);
  } catch (error) {
    console.error('Failed to update admin user:', error);
    return NextResponse.json({ error: 'Failed to update admin user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    // Prevent self-deletion
    if (id === auth.admin.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const success = await adminRepository.deleteAdminUser(id);
    if (!success) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'admin_user_delete',
      'admin_user',
      id,
      {}
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete admin user:', error);
    return NextResponse.json({ error: 'Failed to delete admin user' }, { status: 500 });
  }
}