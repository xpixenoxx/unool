import crypto from 'crypto';
import { config } from '@/lib/config/schema';

export interface MetaSignedRequestPayload {
  user_id: string;
  algorithm?: string;
  issued_at?: number;
  [key: string]: unknown;
}

function base64UrlToBuffer(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64');
}

export function getMetaAppSecrets(): string[] {
  const candidates = [
    process.env.INSTAGRAM_WEBHOOK_APP_SECRET,
    process.env.INSTAGRAM_CLIENT_SECRET,
    process.env.FACEBOOK_CLIENT_SECRET,
    process.env.META_APP_SECRET,
    config.INSTAGRAM_WEBHOOK_SECRET,
    config.INSTAGRAM_CLIENT_SECRET,
    config.FACEBOOK_CLIENT_SECRET,
  ];
  return Array.from(new Set(candidates.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)));
}

/**
 * Verifies and decodes a Meta `signed_request` parameter (`<encodedSig>.<encodedPayload>`)
 * using HMAC-SHA256 and constant-time signature comparison.
 */
export function verifyMetaSignedRequest(
  signedRequest: string,
  explicitSecrets?: string[]
): MetaSignedRequestPayload | null {
  if (!signedRequest || typeof signedRequest !== 'string') return null;

  const parts = signedRequest.split('.');
  if (parts.length !== 2) return null;

  const [encodedSig, encodedPayload] = parts;
  if (!encodedSig || !encodedPayload) return null;

  const secrets = explicitSecrets && explicitSecrets.length > 0 ? explicitSecrets : getMetaAppSecrets();
  if (secrets.length === 0) return null;

  let sigBuffer: Buffer;
  let payloadJson: MetaSignedRequestPayload;
  try {
    sigBuffer = base64UrlToBuffer(encodedSig);
    const payloadStr = base64UrlToBuffer(encodedPayload).toString('utf8');
    payloadJson = JSON.parse(payloadStr) as MetaSignedRequestPayload;
  } catch {
    return null;
  }

  if (!payloadJson || typeof payloadJson.user_id !== 'string' || !payloadJson.user_id) {
    return null;
  }

  if (payloadJson.algorithm && payloadJson.algorithm.toUpperCase() !== 'HMAC-SHA256') {
    return null;
  }

  for (const secret of secrets) {
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest();

    if (
      sigBuffer.length === expectedSig.length &&
      crypto.timingSafeEqual(sigBuffer, expectedSig)
    ) {
      return payloadJson;
    }
  }

  return null;
}

/**
 * Extracts `signed_request` from either `application/x-www-form-urlencoded`,
 * `multipart/form-data`, or `application/json` request bodies.
 */
export async function extractSignedRequestFromBody(request: Request): Promise<string | null> {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  try {
    if (contentType.includes('application/json')) {
      const body = await request.json();
      return typeof body?.signed_request === 'string' ? body.signed_request : null;
    }
    const rawText = await request.text();
    if (!rawText) return null;
    if (rawText.trim().startsWith('{')) {
      const parsed = JSON.parse(rawText);
      return typeof parsed?.signed_request === 'string' ? parsed.signed_request : null;
    }
    const params = new URLSearchParams(rawText);
    return params.get('signed_request');
  } catch {
    return null;
  }
}

