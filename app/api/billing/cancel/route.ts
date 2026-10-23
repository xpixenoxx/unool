import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { cancelSubscription, getWorkspaceSubscription } from '@/lib/billing/subscription';
import { logger } from '@/lib/logger';

/**
 * POST /api/billing/cancel
 * Cancel the current subscription.
 * Body: { immediate?: boolean }
 *
 * Default: cancel at end of current billing period (cancel_at_period_end).
 * If immediate: true, immediately downgrade to Spark.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const immediate = body.immediate === true;

    const subscription = await getWorkspaceSubscription(auth.workspaceId);
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 400 }
      );
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      );
    }

    await cancelSubscription(auth.workspaceId, immediate);

    logger.info('Subscription cancellation requested', {
      workspaceId: auth.workspaceId,
      immediate,
      previousPlan: subscription.plan_id,
    });

    return NextResponse.json({
      success: true,
      message: immediate
        ? 'Subscription cancelled. You have been downgraded to Spark.'
        : 'Subscription will be cancelled at the end of your current billing period.',
      cancelledAt: new Date().toISOString(),
      immediate,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Cancel subscription failed', { error: err });
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
