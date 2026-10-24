import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { getWorkspaceSubscription, upsertSubscription, calculatePeriodEnd } from '@/lib/billing/subscription';
import { getPlan, formatPrice } from '@/lib/billing/plans';
import type { Currency, PlanId } from '@/lib/billing/plans';
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

    const subscription = await getWorkspaceSubscription(auth.workspaceId);

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
    const adminClient = createSbClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
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
