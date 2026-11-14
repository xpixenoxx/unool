import { describe, it, expect } from 'vitest';
import { createAccountSwitchToken, verifyAccountSwitchToken } from '../account-switch-token';

const TEST_SECRET = 'test-secret-key-for-account-switcher-32b';

describe('account-switch-token', () => {
  it('creates and verifies a valid switch token', () => {
    const token = createAccountSwitchToken('user-123', 'Usha@Example.com', TEST_SECRET);
    const verified = verifyAccountSwitchToken(token, TEST_SECRET);

    expect(verified).toEqual({
      userId: 'user-123',
      email: 'usha@example.com',
    });
  });

  it('rejects a tampered token or wrong secret', () => {
    const token = createAccountSwitchToken('user-123', 'usha@example.com', TEST_SECRET);
    expect(verifyAccountSwitchToken(`${token}x`, TEST_SECRET)).toBeNull();
    expect(verifyAccountSwitchToken(token, 'wrong-secret')).toBeNull();
  });

  it('rejects an expired token', () => {
    const expiredToken = createAccountSwitchToken('user-123', 'usha@example.com', TEST_SECRET, -1000);
    expect(verifyAccountSwitchToken(expiredToken, TEST_SECRET)).toBeNull();
  });
});

