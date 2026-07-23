import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import type { CreatePlanInput, UpdatePlanInput } from '@/lib/repositories/interfaces/IAdminRepository';

// GET /api/admin/plans - List all plans
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'plans');
  if (auth instanceof NextResponse) return auth;

  try {
    const plans = await adminRepository.listPlans();
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Failed to list plans:', error);
    return NextResponse.json({ error: 'Failed to list plans' }, { status: 500 });
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

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'plan_create',
      'plan',
      plan.id,
      { name, priceMonthlyUsd, priceYearlyUsd }
    );

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Failed to create plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}