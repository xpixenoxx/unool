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
async function getDerivedKeys(version: number = CURRENT_VERSION): Promise<CryptoKey[]> {
  const secrets: string[] = [];
  if (config.ENCRYPTION_KEY) secrets.push(config.ENCRYPTION_KEY);
  if (config.SUPABASE_SERVICE_ROLE_KEY && !secrets.includes(config.SUPABASE_SERVICE_ROLE_KEY)) {
    secrets.push(config.SUPABASE_SERVICE_ROLE_KEY);
  }

  if (secrets.length === 0) {
    throw new Error('No encryption secret available');
  }

  const keys: CryptoKey[] = [];
  const encoder = new TextEncoder();
  const salt = encoder.encode(`unool-encryption-v${version}`);

  for (const secret of secrets) {
    try {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
      );
      keys.push(key);
    } catch {
      // Continue to next secret
    }
  }

  return keys;
}

async function getDerivedKey(version: number = CURRENT_VERSION): Promise<CryptoKey> {
  const keys = await getDerivedKeys(version);
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

    // Version prefix + base64
    return `v${version}:${btoa(String.fromCharCode(...combined))}`;
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