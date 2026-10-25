import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { payOrderWithNetbanking } from '@/lib/billing/cashfree';
import { findOrderByCfOrderId } from '@/lib/billing/subscription';
import { logger } from '@/lib/logger';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

import { sanitizePaymentError } from '@/lib/billing/sanitizeError';

export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/pay-netbanking
 * Initiates netbanking transaction for the chosen bank code.
 * Returns direct bank authentication URL.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cfOrderId, paymentSessionId, netbankingCode, bankName } = body;

    if (!cfOrderId || !paymentSessionId || !netbankingCode) {
      return NextResponse.json(
        { error: 'Missing required fields: cfOrderId, paymentSessionId, netbankingCode' },
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

    // Call Cashfree Netbanking API
    const result = await payOrderWithNetbanking(paymentSessionId, netbankingCode);

    // Save payment method metadata
    try {
      const adminClient = createSbClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      await adminClient
        .from('payment_orders')
        .update({
          payment_method: `netbanking:${bankName || netbankingCode}`,
          cf_payment_id: result.cf_payment_id || order.cf_payment_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('cf_order_id', cfOrderId);
    } catch (saveErr) {
      logger.warn('Failed to update order with Netbanking metadata', { error: saveErr, cfOrderId });
    }

    logger.info('Netbanking payment link generated', {
      cfOrderId,
      netbankingCode,
      hasUrl: !!result.data?.url,
    });

    return NextResponse.json({
      success: true,
      url: result.data?.url || null,
      cfPaymentId: result.cf_payment_id || null,
      message: `Redirecting to ${bankName || 'bank'} netbanking portal...`,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Pay with Netbanking failed', { error: err });
    const userSafeMessage = sanitizePaymentError(
      err.message,
      'Failed to initiate Netbanking payment. Please try again or select another bank.'
    );
    return NextResponse.json(
      { error: userSafeMessage },
      { status: 400 }
    );
  }
}
