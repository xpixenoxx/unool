import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { removeOverride } from '@/lib/billing/overrides';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { config } from '@/lib/config/schema';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    let overrideInfo: { user_email?: string; user_name?: string | null; plan_id?: string; custom_monthly_inr?: number } | null = null;
    try {
      
      const { data } = await supabaseAdmin
        .from('user_plan_overrides')
        .select('user_email, user_name, plan_id, custom_monthly_inr')
        .eq('id', id)
        .maybeSingle();
      if (data) overrideInfo = data;
    } catch {}

    const success = await removeOverride(id, auth.admin.userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Override not found or already removed' },
        { status: 404 }
      );
    }

    try {
      await adminRepository.logAdminAction(
        auth.admin.userId,
        'plan_override_remove',
        'user_plan_override',
        id,
        {
          userEmail: overrideInfo?.user_email || undefined,
          userName: overrideInfo?.user_name || undefined,
          planId: overrideInfo?.plan_id || undefined,
          customMonthlyInr: overrideInfo?.custom_monthly_inr || undefined,
        }
      );
    } catch (auditErr) {
      console.warn('[plan-overrides] Failed to log admin action:', auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove plan override:', error);
    return NextResponse.json({ error: 'Failed to remove override' }, { status: 500 });
  }
}
