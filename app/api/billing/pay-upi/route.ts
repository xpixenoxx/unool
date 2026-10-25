import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { payOrderWithUpi } from '@/lib/billing/cashfree';
import { findOrderByCfOrderId } from '@/lib/billing/subscription';
import { logger } from '@/lib/logger';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

import { sanitizePaymentError } from '@/lib/billing/sanitizeError';

export const dynamic = 'force-dynamic';

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;

/**
 * POST /api/billing/pay-upi
 * Initiates a UPI Collect payment directly to a user's UPI ID / VPA.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cfOrderId, paymentSessionId, upiId } = body;

    if (!cfOrderId || !paymentSessionId || !upiId) {
      return NextResponse.json(
        { error: 'Missing required fields: cfOrderId, paymentSessionId, upiId' },
        { status: 400 }
      );
    }

    const cleanUpiId = String(upiId).trim().toLowerCase();
    if (!UPI_REGEX.test(cleanUpiId)) {
      return NextResponse.json(
        { error: 'Invalid UPI ID format. Example: yourname@okhdfcbank or mobile@upi' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to this workspace
    const order = await findOrderByCfOrderId(cfOrderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.workspace_id !== auth.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.status === 'PAID') {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        message: 'Order is already paid and active.',
      });
    }

    // Call Cashfree UPI Collect API
    const result = await payOrderWithUpi(paymentSessionId, cleanUpiId);

    // Save payment method and cf_payment_id if returned
    try {
      const adminClient = createSbClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      await adminClient
        .from('payment_orders')
        .update({
          payment_method: `upi:${cleanUpiId}`,
          cf_payment_id: result.cf_payment_id || order.cf_payment_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('cf_order_id', cfOrderId);
    } catch (saveErr) {
      logger.warn('Failed to update order with UPI metadata', { error: saveErr, cfOrderId });
    }

    logger.info('UPI Collect payment request dispatched', {
      cfOrderId,
      cleanUpiId,
      cfPaymentId: result.cf_payment_id,
    });

    return NextResponse.json({
      success: true,
      action: result.action || 'collect',
      message: `Payment request sent to ${cleanUpiId}! Please open your UPI app and approve within 5 minutes.`,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Pay with UPI failed', { error: err });
    const userSafeMessage = sanitizePaymentError(
      err.message,
      'Failed to send UPI payment request. Please check your UPI ID and try again.'
    );
    return NextResponse.json(
      { error: userSafeMessage },
      { status: 400 }
    );
  }
}
