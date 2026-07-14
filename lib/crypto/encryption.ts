import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

async function getDerivedKey(): Promise<CryptoKey> {
  const secret = config.SUPABASE_SERVICE_ROLE_KEY;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('unool-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptToken(token: string): Promise<string> {
  try {
    const key = await getDerivedKey();
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

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Token encryption failed', { error: err });
    throw new Error('Failed to encrypt token');
  }
}

export async function decryptToken(encryptedToken: string): Promise<string> {
  try {
    const key = await getDerivedKey();
    const combined = new Uint8Array(
      atob(encryptedToken).split('').map(c => c.charCodeAt(0))
    );

    const iv = combined.slice(0, IV_LENGTH);
    const data = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Token decryption failed', { error: err });
    throw new Error('Failed to decrypt token');
  }
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}