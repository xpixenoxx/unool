import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { payOrderWithCard } from '@/lib/billing/cashfree';
import { findOrderByCfOrderId } from '@/lib/billing/subscription';
import { logger } from '@/lib/logger';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/pay-card
 * Processes credit/debit card payment via Cashfree Order Sessions API.
 * Returns 3DS authentication URL or completion status.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cfOrderId, paymentSessionId, cardNumber, cardHolder, expiryMonth, expiryYear, cvv } = body;

    if (!cfOrderId || !paymentSessionId || !cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
      return NextResponse.json(
        { error: 'Missing required card details.' },
        { status: 400 }
      );
    }

    const cleanNumber = String(cardNumber).replace(/\s+/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19 || !/^\d+$/.test(cleanNumber)) {
      return NextResponse.json(
        { error: 'Please enter a valid card number.' },
        { status: 400 }
      );
    }

    const monthNum = parseInt(expiryMonth, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Please enter a valid expiry month (01-12).' },
        { status: 400 }
      );
    }

    if (String(cvv).trim().length < 3 || String(cvv).trim().length > 4) {
      return NextResponse.json(
        { error: 'Please enter a valid CVV (3 or 4 digits).' },
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

    // Call Cashfree Card Payment API
    const result = await payOrderWithCard(paymentSessionId, {
      cardNumber: cleanNumber,
      cardHolder: String(cardHolder).trim(),
      expiryMonth: String(expiryMonth).trim(),
      expiryYear: String(expiryYear).trim(),
      cvv: String(cvv).trim(),
    });

    // Save payment method metadata
    try {
      const adminClient = createSbClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      await adminClient
        .from('payment_orders')
        .update({
          payment_method: `card:••••${cleanNumber.slice(-4)}`,
          cf_payment_id: result.cf_payment_id || order.cf_payment_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('cf_order_id', cfOrderId);
    } catch (saveErr) {
      logger.warn('Failed to update order with Card metadata', { error: saveErr, cfOrderId });
    }

    logger.info('Card payment request processed', {
      cfOrderId,
      action: result.action,
      hasUrl: !!result.data?.url,
    });

    return NextResponse.json({
      success: true,
      action: result.action || 'link',
      url: result.data?.url || null,
      message: 'Card payment processed. Please complete 3D Secure verification.',
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Pay with Card failed', { error: err });
    return NextResponse.json(
      { error: err.message || 'Failed to process card payment.' },
      { status: 500 }
    );
  }
}
