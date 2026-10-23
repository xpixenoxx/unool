import crypto from 'crypto';

/**
 * Generate an idempotency key for payment orders.
 * Same user + plan + billing cycle within a 60-second window → same key.
 * Prevents duplicate orders from double-clicks or network retries.
 */
export function generateIdempotencyKey(
  userId: string,
  planId: string,
  billingCycle: string
): string {
  // Floor timestamp to the nearest 60 seconds
  const timeWindow = Math.floor(Date.now() / 60000);
  const payload = `${userId}:${planId}:${billingCycle}:${timeWindow}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Generate a unique order ID for Cashfree.
 * Format: unool_{timestamp}_{random}
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `unool_${timestamp}_${random}`;
}

/**
 * Generate a unique subscription ID for Cashfree.
 * Format: sub_{timestamp}_{random}
 */
export function generateSubscriptionId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `sub_${timestamp}_${random}`;
}
