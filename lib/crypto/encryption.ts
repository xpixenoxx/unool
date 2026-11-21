import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const CURRENT_VERSION = 1;

/**
 * Derives encryption keys from ENCRYPTION_KEY and SUPABASE_SERVICE_ROLE_KEY
 * Uses PBKDF2 for proper key derivation with per-version salt
 */
async function getDerivedKeys(version: number = CURRENT_VERSION, firstOnly = false): Promise<CryptoKey[]> {
  // Fast path: a pre-derived key (PBKDF2 output computed offline) loads with ~zero CPU.
  // Cloudflare Workers Free allows only ~10ms CPU/request, and PBKDF2(100k) can exceed that.
  // It is byte-identical to deriving from ENCRYPTION_KEY, so existing ciphertext stays readable.
  if (version === 1) {
    const preDerived = config.ENCRYPTION_DERIVED_KEY_V1 || process.env.ENCRYPTION_DERIVED_KEY_V1;
    if (preDerived) {
      try {
        return [await importPreDerivedKey(preDerived)];
      } catch (error) {
        logger.error('Invalid ENCRYPTION_DERIVED_KEY_V1, falling back to PBKDF2', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
  }

  const secrets: string[] = [];
  if (config.ENCRYPTION_KEY) secrets.push(config.ENCRYPTION_KEY);
  if (config.SUPABASE_SERVICE_ROLE_KEY && !secrets.includes(config.SUPABASE_SERVICE_ROLE_KEY)) {
    secrets.push(config.SUPABASE_SERVICE_ROLE_KEY);
  }

  if (secrets.length === 0) {
    throw new Error('No encryption secret available');
  }

  const keys: CryptoKey[] = [];
  for (const secret of firstOnly ? secrets.slice(0, 1) : secrets) {
    try {
      keys.push(await deriveCached(secret, version));
    } catch {
      // Continue to next secret
    }
  }

  return keys;
}

// PBKDF2 (100k iterations) is CPU-heavy; derive once per secret+version per isolate.
// Cache the promise so concurrent callers share a single derivation.
const derivedKeyCache = new Map<string, Promise<CryptoKey>>();

function importPreDerivedKey(base64Key: string): Promise<CryptoKey> {
  const cacheKey = `raw:${base64Key}`;
  let pending = derivedKeyCache.get(cacheKey);
  if (!pending) {
    const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
    if (raw.length !== KEY_LENGTH / 8) {
      return Promise.reject(new Error('ENCRYPTION_DERIVED_KEY_V1 must be 32 bytes (base64)'));
    }
    pending = crypto.subtle.importKey('raw', raw, { name: ENCRYPTION_ALGORITHM }, false, ['encrypt', 'decrypt']);
    pending.catch(() => derivedKeyCache.delete(cacheKey));
    derivedKeyCache.set(cacheKey, pending);
  }
  return pending;
}

function deriveCached(secret: string, version: number): Promise<CryptoKey> {
  const cacheKey = `${version}:${secret}`;
  let pending = derivedKeyCache.get(cacheKey);
  if (!pending) {
    const encoder = new TextEncoder();
    const salt = encoder.encode(`unool-encryption-v${version}`);
    pending = crypto.subtle
      .importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveBits', 'deriveKey'])
      .then((keyMaterial) =>
        crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
          keyMaterial,
          { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
          false,
          ['encrypt', 'decrypt']
        )
      );
    pending.catch(() => derivedKeyCache.delete(cacheKey));
    derivedKeyCache.set(cacheKey, pending);
  }
  return pending;
}

async function getDerivedKey(version: number = CURRENT_VERSION): Promise<CryptoKey> {
  const keys = await getDerivedKeys(version, true);
  if (keys.length === 0) {
    throw new Error('No encryption key derived');
  }
  return keys[0];
}

/**
 * Encrypts a token with version header for key rotation support.
 * Format: v{version}:{base64(iv + ciphertext)}
 */
export async function encryptToken(token: string): Promise<string> {
  try {
    const version = config.ENCRYPTION_KEY_VERSION || CURRENT_VERSION;
    const key = await getDerivedKey(version);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const data = encoder.encode(token);

    const encrypted = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      data
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Version prefix + base64 (safe for large buffers without spreading into String.fromCharCode)
    const base64Payload = typeof Buffer !== 'undefined'
      ? Buffer.from(combined).toString('base64')
      : btoa(Array.from(combined, (b) => String.fromCharCode(b)).join(''));
    return `v${version}:${base64Payload}`;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Token encryption failed', { error: err });
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypts a token, supporting multiple key versions for rotation.
 * Tries current version first, then falls back to previous versions.
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
  if (!encryptedToken) {
    throw new Error('Failed to decrypt token');
  }

  try {
    // Parse version header
    const versionMatch = encryptedToken.match(/^v(\d+):(.+)$/);
    const version = versionMatch ? parseInt(versionMatch[1], 10) : 1;
    const payload = versionMatch ? versionMatch[2] : encryptedToken;

    const versionsToTry = [version];

    for (const v of versionsToTry) {
      const candidateKeys = await getDerivedKeys(v);

      for (const key of candidateKeys) {
        try {
          const combined = new Uint8Array(
            atob(payload).split('').map((c) => c.charCodeAt(0))
          );

          if (combined.length < IV_LENGTH) continue;

          const iv = combined.slice(0, IV_LENGTH);
          const data = combined.slice(IV_LENGTH);

          const decrypted = await crypto.subtle.decrypt(
            { name: ENCRYPTION_ALGORITHM, iv },
            key,
            data
          );

          const decoder = new TextDecoder();
          return decoder.decode(decrypted);
        } catch {
          // Try next key
          continue;
        }
      }
    }

    throw new Error('Failed to decrypt with any key version');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Token decryption failed', { error: err });
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Creates a SHA-256 hash of a token for fingerprinting (not reversible)
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}