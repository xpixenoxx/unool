import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { Platform } from '@/lib/repositories/interfaces/IPlatformRepository';

/**
 * Verifies webhook signature using platform-specific HMAC verification
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  platform: Platform
): Promise<boolean> {
  const secret = getWebhookSecret(platform);
  if (!secret) {
    logger.warn('Webhook secret not configured', { platform });
    // In production, fail closed; in dev, allow
    return process.env.NODE_ENV !== 'production';
  }

  try {
    switch (platform) {
      case 'linkedin':
        return await verifyLinkedInSignature(payload, signature, secret);
      case 'x':
        return await verifyXSignature(payload, signature, secret);
      case 'threads':
        return await verifyMetaSignature(payload, signature, secret);
      default:
        logger.warn('Unknown platform for webhook verification', { platform });
        return false;
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Webhook signature verification failed', { platform, error: err });
    return false;
  }
}

function getWebhookSecret(platform: Platform): string | undefined {
  const secretMap: Record<Platform, string | undefined> = {
    linkedin: config.LINKEDIN_WEBHOOK_SECRET,
    x: config.X_WEBHOOK_SECRET,
    threads: config.META_WEBHOOK_SECRET,
    manual: undefined,
  };
  return secretMap[platform];
}

/**
 * LinkedIn webhook signature verification
 * Header: x-li-signature
 * Algorithm: HMAC-SHA256 of raw body
 * Format: sha256=<hex>
 */
export async function verifyLinkedInSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedPrefix = 'sha256=';
  if (!signature.startsWith(expectedPrefix)) {
    return false;
  }

  const expectedSig = signature.slice(expectedPrefix.length);
  const computedSig = await hmacSha256Hex(payload, secret);

  return timingSafeEqual(expectedSig, computedSig);
}

/**
 * X/Twitter webhook signature verification
 * Header: x-twitter-webhooks-signature
 * Algorithm: HMAC-SHA256 of raw body
 * Format: sha256=<hex>
 */
export async function verifyXSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedPrefix = 'sha256=';
  if (!signature.startsWith(expectedPrefix)) {
    return false;
  }

  const expectedSig = signature.slice(expectedPrefix.length);
  const computedSig = await hmacSha256Hex(payload, secret);

  return timingSafeEqual(expectedSig, computedSig);
}

/**
 * Meta (Threads/Facebook) webhook signature verification
 * Header: x-hub-signature-256
 * Algorithm: HMAC-SHA256 of raw body
 * Format: sha256=<hex>
 */
export async function verifyMetaSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedPrefix = 'sha256=';
  if (!signature.startsWith(expectedPrefix)) {
    return false;
  }

  const expectedSig = signature.slice(expectedPrefix.length);
  const computedSig = await hmacSha256Hex(payload, secret);

  return timingSafeEqual(expectedSig, computedSig);
}

/**
 * Computes HMAC-SHA256 hex digest
 */
export async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Timing-safe string comparison
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Extracts webhook signature from request headers based on platform
 */
export function extractWebhookSignature(request: Request, platform: Platform): string | null {
  const headerMap: Record<Platform, string[]> = {
    linkedin: ['x-li-signature', 'x-linkedin-signature'],
    x: ['x-twitter-webhooks-signature', 'x-twitter-signature'],
    threads: ['x-hub-signature-256', 'x-hub-signature'],
    manual: [],
  };

  for (const header of headerMap[platform]) {
    const signature = request.headers.get(header);
    if (signature) {
      return signature;
    }
  }

  return null;
}