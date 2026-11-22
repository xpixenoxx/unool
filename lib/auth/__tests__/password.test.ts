import { afterEach, describe, expect, it, vi } from 'vitest';
import { argon2idAsync } from '@noble/hashes/argon2.js';
import {
  hashPassword,
  verifyPassword,
  needsPasswordRehash,
  isEdgeWorkerRuntime,
  isPasswordHashUnsupportedInRuntime,
} from '../password';

describe('lib/auth/password', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hashes and verifies passwords with WebCrypto PBKDF2-SHA256', async () => {
    const hash = await hashPassword('CorrectHorseBattery99!');
    expect(hash.startsWith('$pbkdf2-sha256$i=100000$')).toBe(true);
    expect(needsPasswordRehash(hash)).toBe(false);
    expect(await verifyPassword(hash, 'CorrectHorseBattery99!')).toBe(true);
    expect(await verifyPassword(hash, 'WrongPassword')).toBe(false);
  });

  it('flags legacy Argon2 hashes for rehash and verifies them in Node runtime', async () => {
    const salt = new Uint8Array(16).fill(7);
    const derived = await argon2idAsync('LegacySecret123!', salt, {
      m: 1024,
      t: 1,
      p: 1,
      dkLen: 32,
    });
    const toB64 = (bytes: Uint8Array) =>
      btoa(String.fromCharCode(...bytes)).replace(/=+$/, '');
    const legacyHash = `$argon2id$v=19$m=1024,t=1,p=1$${toB64(salt)}$${toB64(derived)}`;

    expect(needsPasswordRehash(legacyHash)).toBe(true);
    expect(isEdgeWorkerRuntime()).toBe(false);
    expect(isPasswordHashUnsupportedInRuntime(legacyHash)).toBe(false);
    expect(await verifyPassword(legacyHash, 'LegacySecret123!')).toBe(true);
    expect(await verifyPassword(legacyHash, 'WrongPassword')).toBe(false);
  });

  it('detects Cloudflare Workers runtime and short-circuits Argon2 without crashing', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Cloudflare-Workers' });

    expect(isEdgeWorkerRuntime()).toBe(true);
    expect(isPasswordHashUnsupportedInRuntime('$argon2id$v=19$m=65536,p=4,t=3$salt$hash')).toBe(true);
    expect(isPasswordHashUnsupportedInRuntime('$pbkdf2-sha256$i=100000$salt$hash')).toBe(false);

    // Even if called directly inside Workers, legacy Argon2 must not invoke pure-JS Argon2
    expect(
      await verifyPassword('$argon2id$v=19$m=65536,p=4,t=3$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'test')
    ).toBe(false);

    // PBKDF2 continues to verify normally inside Workers
    const pbkdf2 = await hashPassword('WorkerSafePass123!');
    expect(await verifyPassword(pbkdf2, 'WorkerSafePass123!')).toBe(true);
  });
});
