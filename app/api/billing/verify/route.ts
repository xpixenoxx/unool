import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { getOrderPayments } from '@/lib/billing/cashfree';
import { findOrderByCfOrderId, markOrderPaid, markOrderFailed } from '@/lib/billing/subscription';
import { logger } from '@/lib/logger';

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

    // If already processed, return current status
    if (dbOrder.status === 'PAID') {
      return NextResponse.json({
        status: 'PAID',
        planId: dbOrder.plan_id,
        message: 'Payment successful! Your plan is now active.',
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
      const payments = await getOrderPayments(orderId);
      const successPayment = payments.find(p => p.payment_status === 'SUCCESS');

      if (successPayment) {
        // Payment succeeded — activate plan
        const paymentMethodStr = successPayment.payment_method
          ? Object.keys(successPayment.payment_method)[0] || 'unknown'
          : 'unknown';

        const result = await markOrderPaid(
          orderId,
          successPayment.cf_payment_id,
          paymentMethodStr
        );

        if (result.success) {
          return NextResponse.json({
            status: 'PAID',
            planId: dbOrder.plan_id,
            message: 'Payment successful! Your plan is now active.',
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
