import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { getOrderPayments, getOrder } from '@/lib/billing/cashfree';
import { findOrderByCfOrderId, markOrderPaid, markOrderFailed } from '@/lib/billing/subscription';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/billing/verify?orderId=xxx
 * Client-side fallback verification.
 * After the Cashfree modal closes, the client polls this endpoint every 3s for 30s.
 * Server checks Cashfree API for payment status and activates the plan if paid.
 *
 * This is a FALLBACK — the webhook (PATH 1) is the primary verification path.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Check our database first
    const dbOrder = await findOrderByCfOrderId(orderId);
    if (!dbOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security: ensure this order belongs to the requesting user's workspace
    if (dbOrder.workspace_id !== auth.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If already processed, ensure workspace and subscription records are in sync and return status
    if (dbOrder.status === 'PAID') {
      try {
        await markOrderPaid(
          orderId,
          dbOrder.cf_payment_id || 'cf_' + orderId,
          dbOrder.payment_method || undefined
        );
      } catch (syncErr) {
        logger.warn('Failed to ensure sync for already paid order in verify', { orderId, error: syncErr });
      }

      return NextResponse.json({
        status: 'PAID',
        planId: dbOrder.plan_id,
        billingCycle: dbOrder.billing_cycle,
        message: 'Payment successful! Your plan is now active.',
      }, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    if (dbOrder.status === 'FAILED') {
      return NextResponse.json({
        status: 'FAILED',
        message: 'Payment failed. Please try again.',
      });
    }

    // Order is still PENDING — check Cashfree for updates
    try {
      const payments = await getOrderPayments(orderId).catch(() => []);
      const successPayment = payments.find(p => p.payment_status === 'SUCCESS');

      let paymentId = successPayment?.cf_payment_id;
      let paymentMethodStr = successPayment?.payment_method
        ? Object.keys(successPayment.payment_method)[0] || 'unknown'
        : 'unknown';

      if (!paymentId) {
        // Fallback: check Cashfree order status directly in case payment list indexing is delayed
        try {
          const cfOrder = await getOrder(orderId);
          if (cfOrder && (cfOrder.order_status === 'PAID' || cfOrder.order_status === 'SUCCESS')) {
            paymentId = cfOrder.cf_order_id || 'cf_' + orderId;
          }
        } catch (e) {
          logger.warn('Failed to fetch Cashfree order status fallback in verify', { orderId, error: e });
        }
      }

      if (paymentId) {
        // Payment succeeded — activate plan in database
        const result = await markOrderPaid(
          orderId,
          paymentId,
          paymentMethodStr
        );

        if (result.success) {
          return NextResponse.json({
            status: 'PAID',
            planId: dbOrder.plan_id,
            billingCycle: dbOrder.billing_cycle,
            message: 'Payment successful! Your plan is now active.',
          }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
          });
        }
      }

      // Check for failed payment
      const failedPayment = payments.find(
        p => p.payment_status === 'FAILED' || p.payment_status === 'CANCELLED'
      );

      if (failedPayment) {
        await markOrderFailed(orderId);
        return NextResponse.json({
          status: 'FAILED',
          message: failedPayment.payment_message || 'Payment failed. Please try again.',
        });
      }

      // Still pending
      return NextResponse.json({
        status: 'PENDING',
        message: 'Payment is being processed...',
      });
    } catch (cfError) {
      // Cashfree API call failed — return current DB status
      logger.warn('Cashfree verify API failed, returning DB status', {
        orderId,
        error: cfError instanceof Error ? cfError.message : String(cfError),
      });

      return NextResponse.json({
        status: dbOrder.status,
        message: 'Verifying payment...',
      });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Verify order failed', { error: err });
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
