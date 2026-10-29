import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'payments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const subscription = await adminRepository.getSubscriptionById(id);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Admin get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'payments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const { action, reason, newPeriodEnd, newPlanId, newAmountPaise } = body;

    if (!action || !reason) {
      return NextResponse.json(
        { error: 'Action and reason are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'cancel':
        result = await adminRepository.adminCancelSubscription(
          id,
          auth.admin.userId,
          reason
        );
        break;

      case 'extend':
        if (!newPeriodEnd) {
          return NextResponse.json(
            { error: 'newPeriodEnd is required for extend action' },
            { status: 400 }
          );
        }
        result = await adminRepository.adminExtendSubscription(
          id,
          newPeriodEnd,
          auth.admin.userId,
          reason
        );
        break;

      case 'change_plan':
        if (!newPlanId || newAmountPaise === undefined) {
          return NextResponse.json(
            { error: 'newPlanId and newAmountPaise are required for change_plan action' },
            { status: 400 }
          );
        }
        result = await adminRepository.adminChangePlan(
          id,
          newPlanId,
          newAmountPaise,
          auth.admin.userId,
          reason
        );
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Must be cancel, extend, or change_plan` },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin update subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

