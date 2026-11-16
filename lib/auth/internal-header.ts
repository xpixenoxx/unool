/**
 * HMAC proof helper shared between Next.js Edge middleware and Node API/Server auth helpers.
 * Uses Web Crypto API so it works identically in both Edge Runtime (middleware.ts)
 * and Node.js route handlers (lib/auth/server.ts, lib/auth/context.ts).
 */

const HEADER_NAME = 'x-unool-internal-auth';
const MAX_CLOCK_SKEW_MS = 30_000;

export const INTERNAL_AUTH_SIGNATURE_HEADER = HEADER_NAME;

function getInternalAuthSecret(): string | null {
  return (
    process.env.ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (process.env.NODE_ENV !== 'production' ? 'unool-dev-internal-mw-secret-32b' : null)
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function computeSignature(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toBase64Url(new Uint8Array(sig));
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function signInternalAuthHeaders(
  userId: string,
  workspaceId: string,
  now = Date.now()
): Promise<string | null> {
  const secret = getInternalAuthSecret();
  if (!secret || !userId || !workspaceId) return null;
  const payload = `${userId}:${workspaceId}:${now}`;
  const sig = await computeSignature(payload, secret);
  return `${now}.${sig}`;
}

export async function verifyInternalAuthHeaders(
  userId: string | null | undefined,
  workspaceId: string | null | undefined,
  headerValue: string | null | undefined,
  now = Date.now()
): Promise<boolean> {
  const secret = getInternalAuthSecret();
  if (!secret || !userId || !workspaceId || !headerValue) {
    return false;
  }

  const parts = headerValue.split('.');
  if (parts.length !== 2) return false;
  const [tsRaw, sig] = parts;
  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > MAX_CLOCK_SKEW_MS) {
    return false;
  }

  const expectedSig = await computeSignature(`${userId}:${workspaceId}:${tsRaw}`, secret);
  return constantTimeEquals(sig, expectedSig);
}

