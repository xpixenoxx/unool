import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { payOrderWithQr } from '@/lib/billing/cashfree';
import { findOrderByCfOrderId } from '@/lib/billing/subscription';
import { logger } from '@/lib/logger';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/pay-qr
 * Generates a dynamic UPI QR Code via Cashfree Order Sessions API.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cfOrderId, paymentSessionId } = body;

    if (!cfOrderId || !paymentSessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: cfOrderId, paymentSessionId' },
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

    // Call Cashfree QR Code API
    const result = await payOrderWithQr(paymentSessionId);

    // Save payment method metadata
    try {
      const adminClient = createSbClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      await adminClient
        .from('payment_orders')
        .update({
          payment_method: 'upi:qrcode',
          cf_payment_id: result.cf_payment_id || order.cf_payment_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('cf_order_id', cfOrderId);
    } catch (saveErr) {
      logger.warn('Failed to update order with QR metadata', { error: saveErr, cfOrderId });
    }

    logger.info('UPI QR Code generated', {
      cfOrderId,
      hasQrString: !!result.data?.payload?.qrcode,
      hasImageUrl: !!result.data?.url,
    });

    return NextResponse.json({
      success: true,
      qrString: result.data?.payload?.qrcode || null,
      imageUrl: result.data?.url || null,
      cfPaymentId: result.cf_payment_id || null,
      message: 'Scan the QR code using any UPI app to complete payment.',
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Pay with QR failed', { error: err });
    return NextResponse.json(
      { error: err.message || 'Failed to generate UPI QR code.' },
      { status: 500 }
    );
  }
}
