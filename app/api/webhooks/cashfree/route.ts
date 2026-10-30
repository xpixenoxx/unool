import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/billing/cashfree';
import { markOrderPaid, markOrderFailed, recordWebhookEvent, upsertSubscription, findOrderByCfOrderId } from '@/lib/billing/subscription';
import { recordReferralConversion } from '@/lib/referrals/service';
import { logger } from '@/lib/logger';
import type { CashfreeWebhookPayload } from '@/lib/billing/cashfree';
import type { PlanId, BillingCycle, Currency } from '@/lib/billing/plans';

/**
 * POST /api/webhooks/cashfree
 * Handles Cashfree payment webhook notifications.
 *
 * SECURITY LAYERS:
 * 1. HMAC-SHA256 signature verification
 * 2. Timestamp staleness check (reject >5min old)
 * 3. Idempotency via UNIQUE(cf_payment_id) in webhook_events table
 * 4. Optimistic locking on payment_orders (only update if status=PENDING)
 *
 * IMPORTANT: This endpoint must NOT require auth headers.
 * Cashfree calls this server-to-server.
 */
export async function POST(request: NextRequest) {
  let rawBody: string;

  try {
    // Read raw body for signature verification
    rawBody = await request.text();
  } catch {
    logger.error('Failed to read webhook body');
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // ── Signature Verification ─────────────────────────────────
  const signature = request.headers.get('x-webhook-signature') || '';
  const timestamp = request.headers.get('x-webhook-timestamp') || '';

  if (!signature || !timestamp) {
    logger.warn('Webhook missing signature or timestamp headers');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const isValid = verifyWebhookSignature(rawBody, signature, timestamp);
  if (!isValid) {
    logger.warn('Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── Parse Payload ──────────────────────────────────────────
  let payload: CashfreeWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.error('Failed to parse webhook payload');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = payload.type;

  logger.info('Cashfree webhook received', {
    eventType,
    orderId: payload.data?.order?.order_id,
    paymentId: payload.data?.payment?.cf_payment_id,
  });

  // ── Handle Events ──────────────────────────────────────────
  try {
    switch (eventType) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
      case 'PAYMENT_SUCCESS': {
        const payment = payload.data.payment;
        const order = payload.data.order;

        if (!payment?.cf_payment_id || !order?.order_id) {
          logger.error('Missing payment or order data in webhook', { eventType });
          return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Idempotency: check if this event was already processed
        const isNew = await recordWebhookEvent(
          payment.cf_payment_id,
          order.order_id,
          eventType,
          payload
        );

        if (!isNew) {
          // Already processed — return 200 so Cashfree stops retrying
          logger.info('Duplicate webhook, already processed', {
            cfPaymentId: payment.cf_payment_id,
          });
          return NextResponse.json({ status: 'already_processed' });
        }

        // Determine payment method string
        const paymentMethodStr = payment.payment_method
          ? Object.keys(payment.payment_method)[0] || 'unknown'
          : 'unknown';

        // Activate plan
        const result = await markOrderPaid(
          order.order_id,
          payment.cf_payment_id,
          paymentMethodStr
        );

        if (result.success) {
          // Also upsert the subscription record using order metadata
          const tags = order.order_tags || {};
          if (tags.plan_id && tags.workspace_id) {
            // Get userId from the payment order record we just marked paid
            const orderRecord = await findOrderByCfOrderId(order.order_id);
            if (orderRecord) {
              await upsertSubscription({
                workspaceId: tags.workspace_id,
                userId: orderRecord.user_id,
                planId: tags.plan_id as PlanId,
                billingCycle: (tags.billing_cycle as BillingCycle) || 'monthly',
                amountPaise: Math.round(order.order_amount * 100),
                currency: (order.order_currency as Currency) || 'INR',
                status: 'active',
              });

              // ── Referral conversion: reward the referrer ──────
              // Non-blocking: if this user was referred, mark them converted and
              // grant the referrer 1 free month of AI credits.
              try {
                await recordReferralConversion(orderRecord.user_id);
              } catch (refErr) {
                logger.error('Referral conversion failed (non-fatal)', {
                  error: refErr instanceof Error ? refErr : new Error(String(refErr)),
                  userId: orderRecord.user_id,
                });
              }
            }
          }

          logger.info('Payment processed and plan activated via webhook', {
            orderId: order.order_id,
            cfPaymentId: payment.cf_payment_id,
          });
        }

        return NextResponse.json({ status: 'ok' });
      }

      case 'PAYMENT_FAILED_WEBHOOK':
      case 'PAYMENT_FAILED': {
        const payment = payload.data.payment;
        const order = payload.data.order;

        if (payment?.cf_payment_id && order?.order_id) {
          await recordWebhookEvent(
            payment.cf_payment_id,
            order.order_id,
            eventType,
            payload
          );

          await markOrderFailed(order.order_id);

          logger.info('Payment failed via webhook', {
            orderId: order.order_id,
            message: payment.payment_message,
          });
        }

        return NextResponse.json({ status: 'ok' });
      }

      case 'PAYMENT_USER_DROPPED_WEBHOOK':
      case 'PAYMENT_USER_DROPPED': {
        // User abandoned payment — log but don't fail the order yet
        // (they might retry within the session)
        logger.info('User dropped payment', {
          orderId: payload.data?.order?.order_id,
        });
        return NextResponse.json({ status: 'ok' });
      }

      default: {
        // Log unknown event types but return 200 to prevent retries
        logger.info('Unhandled webhook event type', { eventType });
        return NextResponse.json({ status: 'ok' });
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Webhook processing error', {
      error: err,
      eventType,
      orderId: payload.data?.order?.order_id,
    });

    // Return 500 so Cashfree retries (but our idempotency layer prevents double-processing)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Cashfree needs to access this without auth
export const dynamic = 'force-dynamic';
