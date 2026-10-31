import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import type { UpdatePlanInput } from '@/lib/repositories/interfaces/IAdminRepository';

// GET /api/admin/plans/[id] - Get single plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const plan = await adminRepository.getPlanById(id);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Failed to get plan:', error);
    return NextResponse.json({ error: 'Failed to get plan' }, { status: 500 });
  }
}

// PATCH /api/admin/plans/[id] - Update plan
// Extended to accept INR prices inside the `features` JSONB field.
// Body may include: name, description, priceMonthlyUsd, priceYearlyUsd,
//   priceMonthlyInr, priceYearlyInr, priceAnnualMonthlyInr (paise),
//   features, limits, isActive, sortOrder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      priceMonthlyUsd,
      priceYearlyUsd,
      // INR prices — stored in features JSONB
      priceMonthlyInr,
      priceYearlyInr,
      priceAnnualMonthlyInr,
      features: featuresInput,
      limits,
      isActive,
      sortOrder,
    } = body as UpdatePlanInput & {
      priceMonthlyInr?: number;
      priceYearlyInr?: number;
      priceAnnualMonthlyInr?: number;
    };

    // Merge INR prices into the features JSONB so no schema change is needed
    let mergedFeatures = featuresInput;
    if (
      typeof priceMonthlyInr === 'number' ||
      typeof priceYearlyInr === 'number' ||
      typeof priceAnnualMonthlyInr === 'number'
    ) {
      // Fetch existing features first so we don't overwrite other flags
      const existing = await adminRepository.getPlanById(id);
      const existingFeatures = (existing?.features as Record<string, unknown>) || {};
      mergedFeatures = {
        ...existingFeatures,
        ...(featuresInput || {}),
        ...(typeof priceMonthlyInr === 'number' ? { price_monthly_inr: priceMonthlyInr } : {}),
        ...(typeof priceYearlyInr === 'number' ? { price_yearly_inr: priceYearlyInr } : {}),
        ...(typeof priceAnnualMonthlyInr === 'number' ? { price_annual_monthly_inr: priceAnnualMonthlyInr } : {}),
      };
    }

    const plan = await adminRepository.updatePlan(id, {
      name,
      description,
      priceMonthlyUsd,
      priceYearlyUsd,
      features: mergedFeatures,
      limits,
      isActive,
      sortOrder,
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'plan_update',
      'plan',
      id,
      { name, priceMonthlyUsd, priceYearlyUsd, priceMonthlyInr, isActive }
    );

    // Clear BOTH caches so changes take effect immediately
    try {
      const { clearPlanCache: clearEnforcementCache } = await import('@/lib/plan-enforcement');
      clearEnforcementCache(id);
    } catch { /* plan-enforcement may not exist in all deployments */ }

    const { clearPlanCache: clearBillingCache } = await import('@/lib/billing/plans');
    clearBillingCache(id);

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Failed to update plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE /api/admin/plans/[id] - Delete plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    // Prevent deletion of the 4 canonical plans
    if (['spark', 'creator', 'pro', 'studio', 'free', 'enterprise'].includes(id)) {
      return NextResponse.json({ error: 'Cannot delete a default plan' }, { status: 400 });
    }

    const success = await adminRepository.deletePlan(id);
    if (!success) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'plan_delete',
      'plan',
      id,
      {}
    );

    try {
      const { clearPlanCache: clearEnforcementCache } = await import('@/lib/plan-enforcement');
      clearEnforcementCache(id);
    } catch { /* ok */ }

    const { clearPlanCache: clearBillingCache } = await import('@/lib/billing/plans');
    clearBillingCache(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
