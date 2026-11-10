import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { payOrderWithCard } from '@/lib/billing/cashfree';
import { findOrderByCfOrderId } from '@/lib/billing/subscription';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { sanitizePaymentError } from '@/lib/billing/sanitizeError';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
};

function passesLuhn(cardDigits: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardDigits.length - 1; i >= 0; i--) {
    let digit = parseInt(cardDigits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

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
    if (cleanNumber.length < 13 || cleanNumber.length > 19 || !/^\d+$/.test(cleanNumber) || !passesLuhn(cleanNumber)) {
      return NextResponse.json(
        { error: 'Please enter a valid card number.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const monthNum = parseInt(expiryMonth, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Please enter a valid expiry month (01-12).' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (String(cvv).trim().length < 3 || String(cvv).trim().length > 4 || !/^\d+$/.test(String(cvv).trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid CVV (3 or 4 digits).' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Verify order exists and belongs to this workspace
    const order = await findOrderByCfOrderId(cfOrderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    if (order.workspace_id !== auth.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: NO_STORE_HEADERS });
    }

    if (order.status === 'PAID') {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        message: 'Order is already paid and active.',
      }, { headers: NO_STORE_HEADERS });
    }

    // Call Cashfree Card Payment API (transient pass-through; PAN/CVV never persisted or logged)
    const result = await payOrderWithCard(paymentSessionId, {
      cardNumber: cleanNumber,
      cardHolder: String(cardHolder).trim(),
      expiryMonth: String(expiryMonth).trim(),
      expiryYear: String(expiryYear).trim(),
      cvv: String(cvv).trim(),
    });

    // Save masked payment method metadata only (last 4 digits)
    try {
      await supabaseAdmin
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
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    // Redact any 12+ digit sequences from error logs to guarantee PAN never leaks into logs
    const redactedMsg = err.message.replace(/\b\d{12,19}\b/g, '[REDACTED_PAN]');
    logger.error('Pay with Card failed', { error: redactedMsg });
    const userSafeMessage = sanitizePaymentError(
      redactedMsg,
      'Card payment processing failed. Please check your card details and try again.'
    );
    return NextResponse.json(
      { error: userSafeMessage },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
