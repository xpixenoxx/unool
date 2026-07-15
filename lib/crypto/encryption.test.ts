import { describe, it, expect, vi } from 'vitest';
import { encryptToken, decryptToken, hashToken } from './encryption';

vi.mock('@/lib/config/schema', () => ({
  config: {
    ENCRYPTION_KEY: 'dGVzdC1lbmNyeXB0aW9uLWtleS10aGF0LWlzLTMtMi1ieXRlcw==',
    ENCRYPTION_KEY_VERSION: 1,
    SUPABASE_SERVICE_ROLE_KEY: 'fallback-service-role-key-that-is-long-enough',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('lib/crypto/encryption', () => {
  const testToken = 'sk-test-token-abc123secret';

  describe('encryptToken', () => {
    it('encrypts a token with version prefix', async () => {
      const encrypted = await encryptToken(testToken);
      expect(encrypted).toMatch(/^v1:/);
    });

    it('produces different ciphertext for same input (non-deterministic IV)', async () => {
      const encrypted1 = await encryptToken(testToken);
      const encrypted2 = await encryptToken(testToken);
      expect(encrypted1).not.toEqual(encrypted2);
    });

    it('encrypts empty token', async () => {
      const encrypted = await encryptToken('');
      const decrypted = await decryptToken(encrypted);
      expect(decrypted).toBe('');
    });

    it('handles special characters in token', async () => {
      const specialToken = 'sk-test!@#$%^&*()_+-=[]{}|;\':",./<>?';
      const encrypted = await encryptToken(specialToken);
      const decrypted = await decryptToken(encrypted);
      expect(decrypted).toBe(specialToken);
    });

    it('handles unicode characters in token', async () => {
      const unicodeToken = 'sk-test-日本語-🔐-émojis';
      const encrypted = await encryptToken(unicodeToken);
      const decrypted = await decryptToken(encrypted);
      expect(decrypted).toBe(unicodeToken);
    });
  });

  describe('decryptToken', () => {
    it('decrypts a token encrypted with encryptToken', async () => {
      const encrypted = await encryptToken(testToken);
      const decrypted = await decryptToken(encrypted);
      expect(decrypted).toBe(testToken);
    });

    it('round-trips multiple different tokens', async () => {
      const tokens = [
        'short',
        'medium-length-token-12345',
        'very-long-token-with-lots-of-characters-and-numbers-1234567890abcdef',
        'token-with-special-chars!@#$%^&*()',
      ];

      for (const token of tokens) {
        const encrypted = await encryptToken(token);
        const decrypted = await decryptToken(encrypted);
        expect(decrypted).toBe(token);
      }
    });

    it('throws on tampered ciphertext', async () => {
      const encrypted = await encryptToken(testToken);
      // Tamper with the ciphertext (change last char of base64)
      const tampered = encrypted.slice(0, -1) + (encrypted.slice(-1) === 'a' ? 'b' : 'a');
      await expect(decryptToken(tampered)).rejects.toThrow('Failed to decrypt token');
    });

    it('throws on corrupted version header', async () => {
      const encrypted = await encryptToken(testToken);
      const corrupted = 'v99:' + encrypted.split(':')[1];
      await expect(decryptToken(corrupted)).rejects.toThrow('Failed to decrypt token');
    });

    it('falls back to legacy format (no version prefix)', async () => {
      // Simulate legacy format (base64 only, no version)
      const { crypto } = global;
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('dGVzdC1lbmNyeXB0aW9uLWtleS10aGF0LWlzLTMtMi1ieXRlcw=='),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('unool-encryption-v1'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        key,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        derivedKey,
        new TextEncoder().encode(testToken)
      );
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      const legacyFormat = btoa(String.fromCharCode(...combined));

      const decrypted = await decryptToken(legacyFormat);
      expect(decrypted).toBe(testToken);
    });

    it('throws on invalid base64', async () => {
      await expect(decryptToken('v1:not-base64!!!')).rejects.toThrow('Failed to decrypt token');
    });

    it('throws on empty string', async () => {
      await expect(decryptToken('')).rejects.toThrow('Failed to decrypt token');
    });
  });

  describe('hashToken', () => {
    it('produces deterministic hash for same input', async () => {
      const hash1 = await hashToken(testToken);
      const hash2 = await hashToken(testToken);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', async () => {
      const hash1 = await hashToken('token-a');
      const hash2 = await hashToken('token-b');
      expect(hash1).not.toBe(hash2);
    });

    it('produces 64-char hex string (SHA-256)', async () => {
      const hash = await hashToken(testToken);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is not reversible', async () => {
      const hash = await hashToken(testToken);
      // Can't decrypt a hash
      await expect(decryptToken('v1:' + hash)).rejects.toThrow();
    });
  });

  describe('key rotation support', () => {
    it('encrypts with current version, decrypts with version fallback', async () => {
      const encryptedV1 = await encryptToken(testToken);
      const decrypted = await decryptToken(encryptedV1);
      expect(decrypted).toBe(testToken);
    });

    it('version prefix is correctly parsed', async () => {
      const encrypted = await encryptToken(testToken);
      expect(encrypted.startsWith('v1:')).toBe(true);
    });
  });
});