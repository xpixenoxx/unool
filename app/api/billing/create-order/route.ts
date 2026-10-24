import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createOrder as createCashfreeOrder, getCashfreeMode } from '@/lib/billing/cashfree';
import { createPaymentOrder, findOrderByIdempotencyKey } from '@/lib/billing/subscription';
import { generateIdempotencyKey, generateOrderId } from '@/lib/billing/idempotency';
import { getPlan, getPlanPrice } from '@/lib/billing/plans';
import type { PlanId, BillingCycle, Currency } from '@/lib/billing/plans';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';

/**
 * POST /api/billing/create-order
 * Creates a Cashfree payment order for a plan upgrade.
 *
 * Body: { planId: string, billingCycle: 'monthly' | 'annual', currency?: 'INR' | 'USD' }
 * Returns: { paymentSessionId, cfOrderId, orderId }
 *
 * SECURITY:
 * - Client sends planId + billingCycle ONLY. Never sends price.
 * - Server resolves price from plan definitions.
 * - Idempotency key prevents duplicate orders within 60s.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingCycle, currency: requestedCurrency } = body;

    // ── Validate inputs ──────────────────────────────────────
    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, billingCycle' },
        { status: 400 }
      );
    }

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (plan.isFreeTier) {
      return NextResponse.json({ error: 'Cannot purchase the free tier' }, { status: 400 });
    }

    if (!['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    const currency: Currency = requestedCurrency === 'USD' ? 'USD' : 'INR';

    // ── Resolve price server-side (NEVER from client) ────────
    const amountPaise = getPlanPrice(planId as PlanId, billingCycle as BillingCycle, currency);
    if (amountPaise <= 0) {
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 500 });
    }

    // Amount in rupees/dollars for Cashfree (they expect decimal, not paise)
    const amountDecimal = amountPaise / 100;

    // ── Idempotency check ────────────────────────────────────
    const idempotencyKey = generateIdempotencyKey(auth.userId, planId, billingCycle);
    const existingOrder = await findOrderByIdempotencyKey(idempotencyKey);

    if (existingOrder && existingOrder.status === 'PENDING' && existingOrder.payment_session_id) {
      logger.info('Returning existing pending order (idempotency hit)', {
        orderId: existingOrder.cf_order_id,
      });
      return NextResponse.json({
        paymentSessionId: existingOrder.payment_session_id,
        cfOrderId: existingOrder.cf_order_id,
        orderId: existingOrder.id,
        mode: getCashfreeMode(),
      });
    }

    // ── Create Cashfree order ────────────────────────────────
    const orderId = generateOrderId();
    
    // Dynamically resolve origin for return_url (supports custom domains & preview deployments)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const appUrl = host ? `${proto}://${host}` : (config.NEXT_PUBLIC_APP_URL || 'https://unool.co');

    // Resolve customer email, phone, and name (Cashfree requires customer_phone to be min 10 digits)
    let customerEmail = 'customer@unool.co';
    let customerPhone = '9999999999';
    let customerName = 'Unool Creator';

    try {
      const { createClient: createSbClient } = await import('@supabase/supabase-js');
      const adminClient = createSbClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      const { data: userData } = await adminClient.auth.admin.getUserById(auth.userId);
      if (userData?.user?.email) customerEmail = userData.user.email;
      if (userData?.user?.phone && userData.user.phone.replace(/\D/g, '').length >= 10) {
        customerPhone = userData.user.phone.replace(/\D/g, '').slice(-10);
      }
      customerName = userData?.user?.user_metadata?.full_name || userData?.user?.user_metadata?.name || 'Unool Creator';
    } catch {
      // Fallback defaults if auth lookup fails
    }

    // Cashfree customer_id must only contain alphanumeric characters, underscores, and hyphens
    const sanitizedCustomerId = auth.userId.replace(/[^a-zA-Z0-9_-]/g, '') || 'unool_user';

    const cfOrder = await createCashfreeOrder({
      order_id: orderId,
      order_amount: amountDecimal,
      order_currency: currency,
      customer_details: {
        customer_id: sanitizedCustomerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${appUrl}/dashboard/billing?order_id=${orderId}&status={order_status}`,
        notify_url: `${appUrl}/api/webhooks/cashfree`,
      },
      order_note: `Unool ${plan.name} - ${billingCycle}`,
      order_tags: {
        plan_id: planId,
        billing_cycle: billingCycle,
        workspace_id: auth.workspaceId,
      },
    });

    // ── Save order in our database ───────────────────────────
    const dbOrder = await createPaymentOrder({
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      cfOrderId: orderId,
      planId: planId as PlanId,
      billingCycle: billingCycle as BillingCycle,
      amountPaise,
      currency,
      idempotencyKey,
      paymentSessionId: cfOrder.payment_session_id,
    });

    logger.info('Payment order created successfully', {
      orderId,
      planId,
      billingCycle,
      amount: amountDecimal,
      currency,
    });

    return NextResponse.json({
      paymentSessionId: cfOrder.payment_session_id,
      cfOrderId: orderId,
      orderId: dbOrder.id,
      mode: getCashfreeMode(),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Create order failed', { error: err });
    return NextResponse.json(
      { error: err.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

