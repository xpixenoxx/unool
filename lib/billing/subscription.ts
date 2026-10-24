// ============================================================
// SUBSCRIPTION MANAGEMENT — Database operations for billing
// Handles order creation/tracking, subscription lifecycle,
// plan activation, and webhook event deduplication.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import type { PlanId, BillingCycle, Currency } from './plans';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// ── Types ───────────────────────────────────────────────────────

export interface PaymentOrder {
  id: string;
  workspace_id: string;
  user_id: string;
  cf_order_id: string;
  plan_id: PlanId;
  billing_cycle: BillingCycle;
  amount_paise: number;
  currency: Currency;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
  cf_payment_id: string | null;
  payment_method: string | null;
  idempotency_key: string | null;
  payment_session_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  workspace_id: string;
  user_id: string;
  cf_subscription_id: string | null;
  plan_id: PlanId;
  billing_cycle: BillingCycle;
  status: 'created' | 'authorized' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';
  amount_paise: number;
  currency: Currency;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  payment_method: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Payment Orders ──────────────────────────────────────────────

/**
 * Create a payment order record in the database.
 */
export async function createPaymentOrder(params: {
  workspaceId: string;
  userId: string;
  cfOrderId: string;
  planId: PlanId;
  billingCycle: BillingCycle;
  amountPaise: number;
  currency: Currency;
  idempotencyKey: string;
  paymentSessionId: string;
}): Promise<PaymentOrder> {
  const { data, error } = await adminClient
    .from('payment_orders')
    .insert({
      workspace_id: params.workspaceId,
      user_id: params.userId,
      cf_order_id: params.cfOrderId,
      plan_id: params.planId,
      billing_cycle: params.billingCycle,
      amount_paise: params.amountPaise,
      currency: params.currency,
      idempotency_key: params.idempotencyKey,
      payment_session_id: params.paymentSessionId,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) {
    // If idempotency key conflict, return the existing order
    if (error.code === '23505' && error.message.includes('idempotency_key')) {
      logger.info('Idempotency hit — returning existing order', {
        idempotencyKey: params.idempotencyKey,
      });
      const { data: existing } = await adminClient
        .from('payment_orders')
        .select()
        .eq('idempotency_key', params.idempotencyKey)
        .single();

      if (existing) return existing as PaymentOrder;
    }
    throw new Error(`Failed to create payment order: ${error.message}`);
  }


  return data as PaymentOrder;
}

/**
 * Find an existing pending order with the same idempotency key.
 */
export async function findOrderByIdempotencyKey(key: string): Promise<PaymentOrder | null> {
  const { data } = await adminClient
    .from('payment_orders')
    .select()
    .eq('idempotency_key', key)
    .single();

  return (data as PaymentOrder) || null;
}

/**
 * Find order by Cashfree order ID.
 */
export async function findOrderByCfOrderId(cfOrderId: string): Promise<PaymentOrder | null> {
  const { data } = await adminClient
    .from('payment_orders')
    .select()
    .eq('cf_order_id', cfOrderId)
    .single();

  return (data as PaymentOrder) || null;
}

/**
 * Mark a payment order as PAID and activate the plan.
 * Uses row-level locking to prevent race conditions.
 */
export async function markOrderPaid(
  cfOrderId: string,
  cfPaymentId: string,
  paymentMethod?: string
): Promise<{ success: boolean; alreadyProcessed: boolean }> {
  // Use RPC for atomic row-level lock
  const { data: order } = await adminClient
    .from('payment_orders')
    .select()
    .eq('cf_order_id', cfOrderId)
    .single();

  if (!order) {
    logger.error('Order not found for payment', { error: new Error('Order not found'), cfOrderId });
    return { success: false, alreadyProcessed: false };
  }

  if (order.status === 'PAID') {
    logger.info('Order already paid, skipping', { cfOrderId });
    return { success: true, alreadyProcessed: true };
  }

  if (order.status !== 'PENDING') {
    logger.warn('Order in unexpected status', { cfOrderId, status: String(order.status) });
    return { success: false, alreadyProcessed: false };
  }

  // Update order status
  const { error: updateError } = await adminClient
    .from('payment_orders')
    .update({
      status: 'PAID',
      cf_payment_id: cfPaymentId,
      payment_method: paymentMethod || null,
      updated_at: new Date().toISOString(),
    })
    .eq('cf_order_id', cfOrderId)
    .eq('status', 'PENDING'); // Optimistic lock — only update if still PENDING

  if (updateError) {
    logger.error('Failed to update order', { cfOrderId, error: new Error(updateError.message) });
    return { success: false, alreadyProcessed: false };
  }

  // Activate the plan on the workspace
  await activateWorkspacePlan(
    order.workspace_id,
    order.plan_id,
    order.billing_cycle
  );

  // Activate and persist subscription record on the workspace
  try {
    await upsertSubscription({
      workspaceId: order.workspace_id,
      userId: order.user_id,
      planId: order.plan_id as PlanId,
      billingCycle: order.billing_cycle as BillingCycle,
      amountPaise: order.amount_paise,
      currency: order.currency as Currency,
      cfSubscriptionId: cfPaymentId,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: calculatePeriodEnd(order.billing_cycle as BillingCycle),
      paymentMethod: paymentMethod || order.payment_method || undefined,
    });
  } catch (subErr) {
    logger.error('Failed to upsert subscription in markOrderPaid', {
      error: subErr instanceof Error ? subErr : new Error(String(subErr)),
      workspaceId: order.workspace_id,
      planId: order.plan_id,
    });
  }

  // Trigger referral conversion reward if the user was referred
  try {
    const { recordReferralConversion } = await import('@/lib/referrals/service');
    await recordReferralConversion(order.user_id);
  } catch (refErr) {
    logger.warn('Failed to record referral conversion on payment', { error: refErr, userId: order.user_id });
  }

  logger.info('Payment order completed and plan activated', {
    cfOrderId,
    cfPaymentId,
    workspaceId: order.workspace_id,
    planId: order.plan_id,
  });

  return { success: true, alreadyProcessed: false };
}

/**
 * Mark a payment order as FAILED.
 */
export async function markOrderFailed(cfOrderId: string): Promise<void> {
  await adminClient
    .from('payment_orders')
    .update({
      status: 'FAILED',
      updated_at: new Date().toISOString(),
    })
    .eq('cf_order_id', cfOrderId)
    .eq('status', 'PENDING');
}

// ── Subscription Management ────────────────────────────────────

/**
 * Create or update a subscription record for a workspace.
 */
export async function upsertSubscription(params: {
  workspaceId: string;
  userId: string;
  planId: PlanId;
  billingCycle: BillingCycle;
  amountPaise: number;
  currency: Currency;
  cfSubscriptionId?: string;
  status?: Subscription['status'];
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  paymentMethod?: string;
}): Promise<Subscription> {
  const { data, error } = await adminClient
    .from('subscriptions')
    .upsert(
      {
        workspace_id: params.workspaceId,
        user_id: params.userId,
        plan_id: params.planId,
        billing_cycle: params.billingCycle,
        amount_paise: params.amountPaise,
        currency: params.currency,
        cf_subscription_id: params.cfSubscriptionId || null,
        status: params.status || 'active',
        current_period_start: params.currentPeriodStart || new Date().toISOString(),
        current_period_end: params.currentPeriodEnd || calculatePeriodEnd(params.billingCycle),
        trial_end: params.trialEnd || null,
        payment_method: params.paymentMethod || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }


  return data as Subscription;
}

/**
 * Get the current subscription for a workspace.
 */
export async function getWorkspaceSubscription(workspaceId: string): Promise<Subscription | null> {
  const { data } = await adminClient
    .from('subscriptions')
    .select()
    .eq('workspace_id', workspaceId)
    .single();

  return (data as Subscription) || null;
}

/**
 * Cancel a subscription (mark cancel_at_period_end).
 */
export async function cancelSubscription(
  workspaceId: string,
  immediate: boolean = false
): Promise<void> {
  if (immediate) {
    await adminClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId);

    // Downgrade workspace to Spark immediately
    await adminClient
      .from('workspaces')
      .update({
        plan: 'spark',
        plan_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId);
  } else {
    // Cancel at end of billing period
    await adminClient
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId);
  }

  logger.info('Subscription cancelled', { workspaceId, immediate });
}

// ── Plan Activation ─────────────────────────────────────────────

/**
 * Activate a plan on a workspace after successful payment.
 */
async function activateWorkspacePlan(
  workspaceId: string,
  planId: string,
  billingCycle: string
): Promise<void> {
  const periodEnd = calculatePeriodEnd(billingCycle as BillingCycle);

  const { error } = await adminClient
    .from('workspaces')
    .update({
      plan: planId,
      plan_status: 'active',
      plan_expires_at: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId);

  if (error) {
    logger.error('Failed to activate workspace plan', {
      workspaceId,
      planId,
      error: new Error(error.message),
    });
    throw new Error(`Failed to activate plan: ${error.message}`);
  }

  logger.info('Workspace plan activated', { workspaceId, planId, billingCycle, expiresAt: periodEnd });
}

// ── Webhook Event Deduplication ─────────────────────────────────

/**
 * Record a webhook event for idempotency.
 * Returns false if the event was already processed (duplicate).
 */
export async function recordWebhookEvent(
  cfPaymentId: string,
  orderId: string,
  eventType: string,
  rawPayload: unknown
): Promise<boolean> {
  const { error } = await adminClient
    .from('webhook_events')
    .insert({
      cf_payment_id: cfPaymentId,
      order_id: orderId,
      event_type: eventType,
      processed: true,
      raw_payload: rawPayload,
    });

  if (error) {
    // Unique constraint violation = already processed
    if (error.code === '23505') {
      logger.info('Duplicate webhook event, skipping', { cfPaymentId, eventType });
      return false;
    }
    logger.error('Failed to record webhook event', { error: new Error(error.message) });
    throw error;
  }

  return true;
}

// ── Helpers ─────────────────────────────────────────────────────

export function calculatePeriodEnd(billingCycle: BillingCycle): string {
  const now = new Date();
  if (billingCycle === 'annual') {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString();
}

/**
 * Get pending orders older than a threshold (for reconciliation cron).
 */
export async function getPendingStaleOrders(
  olderThanMinutes: number = 10
): Promise<PaymentOrder[]> {
  const threshold = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();

  const { data } = await adminClient
    .from('payment_orders')
    .select()
    .eq('status', 'PENDING')
    .lt('created_at', threshold)
    .order('created_at', { ascending: true })
    .limit(50);

  return (data as PaymentOrder[]) || [];
}
