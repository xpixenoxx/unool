import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { getDefaultAdminPlans } from '@/lib/billing/plans';
import type { CreatePlanInput } from '@/lib/repositories/interfaces/IAdminRepository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/plans - List all plans
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    let plans = await adminRepository.listPlans();
    if (!plans || plans.length === 0) {
      plans = getDefaultAdminPlans();
    }
    return NextResponse.json(plans);
  } catch (error) {
    console.warn('Failed to list plans from database, returning canonical default plans:', error);
    return NextResponse.json(getDefaultAdminPlans());
  }
}

// POST /api/admin/plans - Create new plan
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id, name, description, priceMonthlyUsd, priceYearlyUsd, features, limits, isActive, sortOrder } = body as CreatePlanInput;

    if (!id || !name) {
      return NextResponse.json({ error: 'Plan ID and name are required' }, { status: 400 });
    }

    const existing = await adminRepository.getPlanById(id);
    if (existing) {
      return NextResponse.json({ error: 'Plan with this ID already exists' }, { status: 409 });
    }

    const plan = await adminRepository.createPlan({
      id,
      name,
      description,
      priceMonthlyUsd,
      priceYearlyUsd,
      features,
      limits,
      isActive,
      sortOrder,
    });

    try {
      await adminRepository.logAdminAction(
        auth.admin.userId,
        'plan_create',
        'plan',
        null,
        { planId: plan.id, name, priceMonthlyUsd, priceYearlyUsd }
      );
    } catch (auditErr) {
      console.warn('[POST /api/admin/plans] Failed to log audit action:', auditErr);
    }

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Failed to create plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
