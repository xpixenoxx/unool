// ============================================================
// CASHFREE API CLIENT — Server-side only
// This file MUST NEVER be imported in client components.
// All API keys stay server-side (no NEXT_PUBLIC_ prefix).
// ============================================================

import crypto from 'crypto';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

// ── Types ───────────────────────────────────────────────────────

export interface CashfreeOrderRequest {
  order_id: string;
  order_amount: number;        // In rupees (not paise) — Cashfree expects decimal
  order_currency: string;      // 'INR' or 'USD'
  customer_details: {
    customer_id: string;
    customer_name?: string;
    customer_email: string;
    customer_phone?: string;
  };
  order_meta?: {
    return_url?: string;
    notify_url?: string;
    payment_methods?: string;
  };
  order_note?: string;
  order_tags?: Record<string, string>;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_status: string;
  order_token: string;           // Used by Drop-in SDK to open checkout
  payment_session_id: string;    // Payment session for Drop-in SDK
  order_amount: number;
  order_currency: string;
}

export interface CashfreePayment {
  cf_payment_id: string;
  order_id: string;
  payment_status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'USER_DROPPED' | 'VOID' | 'CANCELLED' | 'NOT_ATTEMPTED';
  payment_amount: number;
  payment_currency: string;
  payment_method?: {
    upi?: { upi_id: string };
    card?: { card_number: string; card_network: string; card_type: string };
    netbanking?: { netbanking_bank_name: string };
    wallet?: { wallet_name: string };
  };
  payment_time?: string;
  payment_message?: string;
}

export interface CashfreeWebhookPayload {
  type: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_tags?: Record<string, string>;
    };
    payment?: {
      cf_payment_id: string;
      payment_status: string;
      payment_amount: number;
      payment_currency: string;
      payment_method?: Record<string, unknown>;
      payment_time?: string;
      payment_message?: string;
    };
    subscription?: {
      subscription_id: string;
      subscription_status: string;
      plan_id: string;
    };
  };
}

// ── API Client ──────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  const appId = config.CASHFREE_APP_ID || process.env.CASHFREE_APP_ID;
  const secretKey = config.CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error('Cashfree API credentials not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }

  return {
    'Content-Type': 'application/json',
    'x-client-id': appId,
    'x-client-secret': secretKey,
    'x-api-version': '2023-08-01',
  };
}

function getBaseUrl(): string {
  return config.CASHFREE_API_URL || process.env.CASHFREE_API_URL || 'https://sandbox.cashfree.com/pg';
}

/**
 * Create a payment order on Cashfree.
 * Returns the payment_session_id needed by the Drop-in SDK.
 */
export async function createOrder(orderRequest: CashfreeOrderRequest): Promise<CashfreeOrderResponse> {
  const url = `${getBaseUrl()}/orders`;

  logger.info('Creating Cashfree order', {
    orderId: orderRequest.order_id,
    amount: orderRequest.order_amount,
    currency: orderRequest.order_currency,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(orderRequest),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Cashfree create order failed', {
      status: response.status,
      body: errorBody,
      orderId: orderRequest.order_id,
    });
    throw new Error(`Cashfree order creation failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  logger.info('Cashfree order created', {
    orderId: data.order_id,
    cfOrderId: data.cf_order_id,
  });

  return data;
}

/**
 * Fetch payments for an order from Cashfree.
 * Used for client-side verification fallback.
 */
export async function getOrderPayments(orderId: string): Promise<CashfreePayment[]> {
  const url = `${getBaseUrl()}/orders/${orderId}/payments`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Cashfree get payments failed', {
      status: response.status,
      orderId,
    });
    throw new Error(`Cashfree get payments failed: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

/**
 * Fetch order status from Cashfree.
 */
export async function getOrder(orderId: string): Promise<CashfreeOrderResponse> {
  const url = `${getBaseUrl()}/orders/${orderId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cashfree get order failed: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

// ── Webhook Signature Verification ──────────────────────────────

/**
 * Verify Cashfree webhook signature using HMAC-SHA256.
 * Returns true if signature is valid and timestamp is not stale.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string
): boolean {
  const webhookSecret = config.CASHFREE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('CASHFREE_WEBHOOK_SECRET not configured');
    return false;
  }

  // Reject stale timestamps (>5 minutes old)
  const webhookTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  const MAX_AGE_SECONDS = 300; // 5 minutes

  if (isNaN(webhookTime) || Math.abs(now - webhookTime) > MAX_AGE_SECONDS) {
    logger.warn('Webhook timestamp too old or invalid', {
      webhookTime,
      now,
      diff: Math.abs(now - webhookTime),
    });
    return false;
  }

  // Verify HMAC-SHA256 signature
  const payload = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('base64');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    logger.warn('Webhook signature mismatch');
  }

  return isValid;
}
