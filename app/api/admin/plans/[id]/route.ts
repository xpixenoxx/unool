import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, requireAdmin } from '@/lib/auth/admin';
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
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, priceMonthlyUsd, priceYearlyUsd, features, limits, isActive, sortOrder } = body as UpdatePlanInput;

    const plan = await adminRepository.updatePlan(id, { name, description, priceMonthlyUsd, priceYearlyUsd, features, limits, isActive, sortOrder });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'plan_update',
      'plan',
      id,
      { name, priceMonthlyUsd, priceYearlyUsd, isActive }
    );

    // Clear plan cache
    const { clearPlanCache } = await import('@/lib/plan-enforcement');
    clearPlanCache(id);

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

    // Prevent deletion of default plans
    if (['free', 'pro', 'enterprise'].includes(id)) {
      return NextResponse.json({ error: 'Cannot delete default plans' }, { status: 400 });
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

    // Clear plan cache
    const { clearPlanCache } = await import('@/lib/plan-enforcement');
    clearPlanCache(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}