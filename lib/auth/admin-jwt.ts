import crypto from 'crypto';

// ============================================================
// Admin JWT — Signs and verifies admin session tokens
// Uses HMAC-SHA256 with ENCRYPTION_KEY from environment.
// This file MUST NOT import from 'next/server' — pure crypto only.
// ============================================================

interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: Record<string, boolean>;
  iat: number;
  exp: number;
}

const JWT_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  // Use ENCRYPTION_KEY, fallback to SUPABASE_SERVICE_ROLE_KEY or dev secret
  const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      return 'unool-default-dev-admin-secret-key-change-in-production-32b';
    }
    throw new Error('ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY is required for admin JWT signing. Set it in .env');
  }
  return key;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString();
}

/**
 * Sign an admin JWT with HMAC-SHA256.
 * Payload includes adminId, email, role, permissions, iat, exp.
 */
export function signAdminJwt(payload: Omit<AdminJwtPayload, 'iat' | 'exp'>): string {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AdminJwtPayload = {
    ...payload,
    iat: now,
    exp: now + JWT_EXPIRY_SECONDS,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode an admin JWT.
 * Returns the payload if valid and not expired, null otherwise.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyAdminJwt(token: string): AdminJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;

    const secret = getSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    // Timing-safe comparison — prevents timing attacks on the signature
    if (signature.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: AdminJwtPayload = JSON.parse(base64UrlDecode(body));

    // Check required fields
    if (!payload.adminId || !payload.email || !payload.role || !payload.exp) {
      return null;
    }

    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Lightweight JWT expiry check for middleware (no signature verification).
 * Full verification happens in the API routes via requireAdmin().
 * This avoids importing the crypto secret in edge middleware.
 */
export function isAdminJwtNotExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (!payload.adminId || !payload.exp) return false;
    return payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

