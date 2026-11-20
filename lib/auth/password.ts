/**
 * lib/auth/password.ts
 *
 * Pure-JS Argon2id password hashing and verification via `@noble/hashes/argon2.js`.
 * Compatible with Cloudflare Workers (workerd) and Node.js — zero native addons.
 * Produces and verifies standard PHC `$argon2id$v=19$m=...,t=...,p=...$<salt>$<hash>` strings,
 * 100% compatible with hashes previously created by `node-argon2`.
 */

import { argon2idAsync, argon2iAsync, argon2dAsync } from '@noble/hashes/argon2.js';

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const DEFAULT_MEMORY_KIB = 19456; // 19 MiB (OWASP minimum)
const DEFAULT_TIME_COST = 3;
const DEFAULT_PARALLELISM = 1;
const DEFAULT_HASH_LEN = 32;
const DEFAULT_SALT_LEN = 16;

function toBase64NoPad(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=+$/, '');
}

function fromBase64NoPad(str: string): Uint8Array {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/** Returns a human-readable reason string or null if the password is valid. */
export function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') return 'Password is required.';
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
  return null;
}

/** Hashes a password with Argon2id. Returns the PHC-encoded hash string. */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(DEFAULT_SALT_LEN);
  crypto.getRandomValues(salt);

  const derived = await argon2idAsync(password, salt, {
    m: DEFAULT_MEMORY_KIB,
    t: DEFAULT_TIME_COST,
    p: DEFAULT_PARALLELISM,
    dkLen: DEFAULT_HASH_LEN,
  });

  return `$argon2id$v=19$m=${DEFAULT_MEMORY_KIB},t=${DEFAULT_TIME_COST},p=${DEFAULT_PARALLELISM}$${toBase64NoPad(salt)}$${toBase64NoPad(derived)}`;
}

/**
 * Verifies a password against a PHC-encoded Argon2 hash (`$argon2id$...`).
 * Uses constant-time byte comparison.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    if (!hash || typeof hash !== 'string' || !hash.startsWith('$argon2')) {
      return false;
    }

    // Format: $argon2id$v=19$m=19456,t=3,p=1$<salt_b64>$<hash_b64>
    // (v=19 segment is optional in some older PHC strings)
    const parts = hash.split('$').filter(Boolean);
    if (parts.length < 4 || parts.length > 5) return false;

    const variant = parts[0];
    const hasVersion = parts[1].startsWith('v=');
    const paramStr = hasVersion ? parts[2] : parts[1];
    const saltB64 = hasVersion ? parts[3] : parts[2];
    const expectedB64 = hasVersion ? parts[4] : parts[3];

    if (!paramStr || !saltB64 || !expectedB64) return false;

    const params: Record<string, number> = {};
    for (const pair of paramStr.split(',')) {
      const [k, v] = pair.split('=');
      if (k && v) params[k] = Number(v);
    }

    const m = params.m;
    const t = params.t;
    const p = params.p;
    if (!Number.isFinite(m) || !Number.isFinite(t) || !Number.isFinite(p) || m <= 0 || t <= 0 || p <= 0) {
      return false;
    }

    const salt = fromBase64NoPad(saltB64);
    const expected = fromBase64NoPad(expectedB64);
    if (expected.length === 0) return false;

    const fn =
      variant === 'argon2id'
        ? argon2idAsync
        : variant === 'argon2i'
          ? argon2iAsync
          : variant === 'argon2d'
            ? argon2dAsync
            : null;
    if (!fn) return false;

    const derived = await fn(password, salt, { m, t, p, dkLen: expected.length });
    return timingSafeEqualBytes(derived, expected);
  } catch {
    return false;
  }
}
