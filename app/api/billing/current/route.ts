import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { getWorkspaceSubscription } from '@/lib/billing/subscription';
import { getPlan, formatPrice } from '@/lib/billing/plans';
import type { Currency } from '@/lib/billing/plans';
import { logger } from '@/lib/logger';

/**
 * GET /api/billing/current
 * Returns the current workspace plan, subscription status, and usage.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getWorkspaceSubscription(auth.workspaceId);

    if (!subscription) {
      // No subscription = free tier
      const sparkPlan = getPlan('spark')!;
      return NextResponse.json({
        plan: {
          id: 'spark',
          name: 'Spark',
          tagline: sparkPlan.tagline,
        },
        subscription: null,
        isFreeTier: true,
      });
    }

    const plan = getPlan(subscription.plan_id);
    const currency = (subscription.currency || 'INR') as Currency;

    return NextResponse.json({
      plan: {
        id: subscription.plan_id,
        name: plan?.name || subscription.plan_id,
        tagline: plan?.tagline || '',
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billingCycle: subscription.billing_cycle,
        amount: formatPrice(subscription.amount_paise, currency),
        amountPaise: subscription.amount_paise,
        currency,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        trialEnd: subscription.trial_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelledAt: subscription.cancelled_at,
        paymentMethod: subscription.payment_method,
      },
      isFreeTier: false,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Get current plan failed', { error: err });
    return NextResponse.json(
      { error: 'Failed to get current plan' },
      { status: 500 }
    );
  }
}
