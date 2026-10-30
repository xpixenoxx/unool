import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

// GET /api/admin/recovery - List deleted and suspended profiles/accounts
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const items = await adminRepository.listDeletedAndSuspendedProfiles();
    return NextResponse.json({
      items,
      total: items.length,
      deletedCount: items.filter((i) => i.type === 'deleted').length,
      suspendedCount: items.filter((i) => i.type === 'suspended').length,
    });
  } catch (error) {
    console.error('Failed to list deleted and suspended profiles:', error);
    return NextResponse.json(
      { error: 'Failed to list deleted and suspended profiles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/recovery - Recover a deleted profile or unsuspended user
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { profileId, userId, type } = body;

    if (!profileId && !userId) {
      return NextResponse.json(
        { error: 'Either profileId or userId must be provided' },
        { status: 400 }
      );
    }

    await adminRepository.recoverProfileOrAccount({
      profileId: profileId || null,
      userId: userId || null,
      type: type || (profileId && !userId ? 'profile' : undefined),
      adminUserId: auth.admin.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Account/profile successfully recovered from deletion or suspension.',
    });
  } catch (error) {
    console.error('Failed to recover profile or account:', error);
    return NextResponse.json(
      { error: 'Failed to recover profile or account' },
      { status: 500 }
    );
  }
}
