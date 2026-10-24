import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { getWorkspaceSubscription, upsertSubscription, activateWorkspacePlan, calculatePeriodEnd } from '@/lib/billing/subscription';
import { getPlan, formatPrice } from '@/lib/billing/plans';
import type { Currency, PlanId, BillingCycle } from '@/lib/billing/plans';
import { logger } from '@/lib/logger';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

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

    const adminClient = createSbClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // 0. Primary ground-truth check: latest PAID order for this workspace
    const { data: latestPaidOrder } = await adminClient
      .from('payment_orders')
      .select('*')
      .eq('workspace_id', auth.workspaceId)
      .eq('status', 'PAID')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const subscription = await getWorkspaceSubscription(auth.workspaceId);

    const isCancelledAfterOrder = Boolean(
      subscription?.cancelled_at &&
      latestPaidOrder?.created_at &&
      new Date(subscription.cancelled_at) > new Date(latestPaidOrder.created_at)
    );

    // If there is a paid order that represents an upgrade or newer state than the subscription record
    if (
      latestPaidOrder &&
      !isCancelledAfterOrder &&
      (!subscription || subscription.status !== 'active' || subscription.plan_id !== latestPaidOrder.plan_id)
    ) {
      const plan = getPlan(latestPaidOrder.plan_id as PlanId);
      const currency = (latestPaidOrder.currency || 'INR') as Currency;
      const amountPaise = latestPaidOrder.amount_paise;
      const cycle = (latestPaidOrder.billing_cycle || 'monthly') as BillingCycle;
      const periodEnd = calculatePeriodEnd(cycle);

      // Auto-heal both subscriptions and workspaces so both tables are immediately synchronized
      try {
        await Promise.allSettled([
          upsertSubscription({
            workspaceId: auth.workspaceId,
            userId: latestPaidOrder.user_id || auth.userId,
            planId: latestPaidOrder.plan_id as PlanId,
            billingCycle: cycle,
            amountPaise,
            currency,
            cfSubscriptionId: latestPaidOrder.cf_payment_id || undefined,
            status: 'active',
            currentPeriodStart: latestPaidOrder.created_at || new Date().toISOString(),
            currentPeriodEnd: periodEnd,
            paymentMethod: latestPaidOrder.payment_method || undefined,
          }),
          activateWorkspacePlan(auth.workspaceId, latestPaidOrder.plan_id, cycle),
        ]);
      } catch (healErr) {
        logger.warn('Failed to heal subscription from latest paid order', { error: healErr, workspaceId: auth.workspaceId });
      }

      return NextResponse.json({
        plan: {
          id: latestPaidOrder.plan_id,
          name: plan?.name || latestPaidOrder.plan_id,
          tagline: plan?.tagline || '',
        },
        subscription: {
          id: subscription?.id || 'sub_' + latestPaidOrder.cf_order_id,
          status: 'active',
          billingCycle: cycle,
          amount: formatPrice(amountPaise, currency),
          amountPaise,
          currency,
          currentPeriodStart: latestPaidOrder.created_at || new Date().toISOString(),
          currentPeriodEnd: periodEnd,
          trialEnd: null,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          paymentMethod: latestPaidOrder.payment_method || null,
        },
        isFreeTier: false,
      }, {
        headers: NO_CACHE_HEADERS,
      });
    }

    // 1. If subscription exists and is active, return it
    if (subscription && subscription.status === 'active') {
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
      }, {
        headers: NO_CACHE_HEADERS,
      });
    }

    // 2. Direct fallback: check workspace table for active paid plan
    const { data: workspace } = await adminClient
      .from('workspaces')
      .select('plan, plan_status, plan_expires_at')
      .eq('id', auth.workspaceId)
      .single();

    if (workspace && workspace.plan && workspace.plan !== 'spark' && workspace.plan_status === 'active') {
      const plan = getPlan(workspace.plan);
      const currency: Currency = 'INR';
      const monthlyPaise = plan?.pricing[currency]?.monthly || 0;

      // Auto-heal: Ensure subscription table gets populated so future queries are instant
      try {
        await upsertSubscription({
          workspaceId: auth.workspaceId,
          userId: auth.userId,
          planId: workspace.plan as PlanId,
          billingCycle: 'monthly',
          amountPaise: monthlyPaise,
          currency,
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: workspace.plan_expires_at || calculatePeriodEnd('monthly'),
        });
      } catch (autoHealErr) {
        logger.warn('Auto-heal subscription failed', { error: autoHealErr, workspaceId: auth.workspaceId });
      }

      return NextResponse.json({
        plan: {
          id: workspace.plan,
          name: plan?.name || workspace.plan,
          tagline: plan?.tagline || '',
        },
        subscription: {
          id: subscription?.id || 'ws_' + auth.workspaceId,
          status: 'active',
          billingCycle: subscription?.billing_cycle || 'monthly',
          amount: formatPrice(subscription?.amount_paise || monthlyPaise, currency),
          amountPaise: subscription?.amount_paise || monthlyPaise,
          currency,
          currentPeriodStart: subscription?.current_period_start || new Date().toISOString(),
          currentPeriodEnd: subscription?.current_period_end || workspace.plan_expires_at || calculatePeriodEnd('monthly'),
          trialEnd: null,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          paymentMethod: subscription?.payment_method || null,
        },
        isFreeTier: false,
      }, {
        headers: NO_CACHE_HEADERS,
      });
    }

    // 3. Fallback to free tier
    const sparkPlan = getPlan('spark')!;
    return NextResponse.json({
      plan: {
        id: 'spark',
        name: 'Spark',
        tagline: sparkPlan.tagline,
      },
      subscription: null,
      isFreeTier: true,
    }, {
      headers: NO_CACHE_HEADERS,
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
