/**
 * lib/auth/password.ts
 *
 * Argon2id password hashing and verification.
 * Uses the `argon2` npm package (node-argon2).
 *
 * Parameters chosen for 2025 server-side production use:
 *   type:       argon2id  (resistant to both side-channel and GPU attacks)
 *   memoryCost: 65536 KB (64 MB)
 *   timeCost:   3 iterations
 *   parallelism: 4
 *
 * Policy:
 *   - Minimum 8 characters
 *   - Maximum 128 characters (guards against long-password DoS)
 */

import * as argon2 from 'argon2';

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const ARGON2_OPTIONS = {
  type:       argon2.argon2id,
  memoryCost: 65536,   // 64 MiB
  timeCost:   3,
  parallelism: 4,
} as const;

/** Returns a human-readable reason string or null if the password is valid. */
export function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') return 'Password is required.';
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
  return null;
}

/** Hashes a password with Argon2id. Returns the encoded hash string. */
export async function hashPassword(password: string): Promise<string> {
  const hash = await argon2.hash(password, ARGON2_OPTIONS);
  return hash as string;
}

/**
 * Verifies a password against an Argon2id hash.
 * Uses argon2.verify which is inherently timing-safe.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // argon2.verify throws on malformed hash — treat as invalid
    return false;
  }
}
