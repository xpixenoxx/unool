import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pbkdf2Sync } from 'node:crypto';

vi.mock('@/lib/logger', () => ({ logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const SECRET = 'unit-test-encryption-secret-0123456789abcdef';

async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.doMock('@/lib/config/schema', () => ({
    config: {
      ENCRYPTION_KEY: env.ENCRYPTION_KEY,
      ENCRYPTION_KEY_VERSION: 1,
      ENCRYPTION_DERIVED_KEY_V1: env.ENCRYPTION_DERIVED_KEY_V1,
    },
  }));
  return import('../encryption');
}

describe('pre-derived encryption key (Workers Free CPU optimisation)', () => {
  beforeEach(() => {
    delete process.env.ENCRYPTION_DERIVED_KEY_V1;
  });

  it('decrypts ciphertext produced via the PBKDF2 path', async () => {
    const legacy = await load({ ENCRYPTION_KEY: SECRET });
    const cipher = await legacy.encryptToken('linkedin-access-token');

    const derived = pbkdf2Sync(SECRET, 'unool-encryption-v1', 100000, 32, 'sha256').toString('base64');
    const fast = await load({ ENCRYPTION_KEY: SECRET, ENCRYPTION_DERIVED_KEY_V1: derived });
    expect(await fast.decryptToken(cipher)).toBe('linkedin-access-token');
  });

  it('produces ciphertext readable by the PBKDF2 path (fully interchangeable)', async () => {
    const derived = pbkdf2Sync(SECRET, 'unool-encryption-v1', 100000, 32, 'sha256').toString('base64');
    const fast = await load({ ENCRYPTION_KEY: SECRET, ENCRYPTION_DERIVED_KEY_V1: derived });
    const cipher = await fast.encryptToken('abc');
    const legacy = await load({ ENCRYPTION_KEY: SECRET });
    expect(await legacy.decryptToken(cipher)).toBe('abc');
  });

  it('falls back to PBKDF2 when the derived key is malformed', async () => {
    const legacy = await load({ ENCRYPTION_KEY: SECRET });
    const cipher = await legacy.encryptToken('xyz');
    const bad = await load({ ENCRYPTION_KEY: SECRET, ENCRYPTION_DERIVED_KEY_V1: 'c2hvcnQ=' });
    expect(await bad.decryptToken(cipher)).toBe('xyz');
  });
});
