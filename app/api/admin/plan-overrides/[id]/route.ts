import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { removeOverride } from '@/lib/billing/overrides';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

/**
 * DELETE /api/admin/plan-overrides/[id]
 * Remove (deactivate) a custom pricing override by its UUID.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Override ID required' }, { status: 400 });
    }

    const success = await removeOverride(id, auth.admin.userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Override not found or already removed' },
        { status: 404 }
      );
    }

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'plan_override_remove',
      'user_plan_override',
      id,
      {}
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove plan override:', error);
    return NextResponse.json({ error: 'Failed to remove override' }, { status: 500 });
  }
}

