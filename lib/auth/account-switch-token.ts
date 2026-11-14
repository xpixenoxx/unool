import crypto from 'crypto';
import { config } from '@/lib/config/schema';

const DEFAULT_SWITCH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface SwitchTokenPayload {
  uid: string;
  email: string;
  iat: number;
  exp: number;
}

function getSigningSecret(explicitSecret?: string): string {
  const secret = explicitSecret || config.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || '';
  if (!secret) {
    throw new Error('Missing signing secret for account switch token');
  }
  return secret;
}

export function createAccountSwitchToken(
  userId: string,
  email: string,
  secret?: string,
  ttlMs: number = DEFAULT_SWITCH_TOKEN_TTL_MS
): string {
  const signingSecret = getSigningSecret(secret);
  const now = Date.now();
  const payload: SwitchTokenPayload = {
    uid: userId,
    email: email.toLowerCase().trim(),
    iat: now,
    exp: now + ttlMs,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', signingSecret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${sigB64}`;
}

export function verifyAccountSwitchToken(
  token: string,
  secret?: string
): { userId: string; email: string } | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, sigB64] = parts;
    if (!payloadB64 || !sigB64) return null;

    const signingSecret = getSigningSecret(secret);
    const expectedSigB64 = crypto
      .createHmac('sha256', signingSecret)
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(sigB64, 'utf8');
    const expectedBuf = Buffer.from(expectedSigB64, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Partial<SwitchTokenPayload>;
    if (!parsed || typeof parsed.uid !== 'string' || typeof parsed.email !== 'string' || typeof parsed.exp !== 'number') {
      return null;
    }

    if (parsed.exp <= Date.now()) {
      return null;
    }

    return {
      userId: parsed.uid,
      email: parsed.email.toLowerCase().trim(),
    };
  } catch {
    return null;
  }
}

