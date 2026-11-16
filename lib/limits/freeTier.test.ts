import { describe, it, expect } from 'vitest';
import {
  FREE_TIER_LIMITS,
  CREATOR_TIER_LIMITS,
  PRO_TIER_LIMITS,
  ENTERPRISE_TIER_LIMITS,
  getLimitsForTier,
  checkLimit,
  UsageSnapshot,
  Tier,
} from './freeTier';

describe('lib/limits/freeTier', () => {
  const createUsage = (overrides: Partial<UsageSnapshot> = {}): UsageSnapshot => ({
    postsThisMonth: 0,
    aiTokensThisMonth: 0,
    connectedAccounts: 0,
    scheduledPosts: 0,
    teamMembers: 0,
    apiCallsToday: 0,
    ...overrides,
  });

  describe('Tier limits', () => {
    it('free (spark) tier matches PLANS_FALLBACK.spark limits', () => {
      expect(FREE_TIER_LIMITS.postsPerMonth).toBe(15);
      expect(FREE_TIER_LIMITS.aiTokensPerMonth).toBe(50000);
      expect(FREE_TIER_LIMITS.connectedAccounts).toBe(2);
      expect(FREE_TIER_LIMITS.scheduledPosts).toBe(15);
      expect(FREE_TIER_LIMITS.teamMembers).toBe(1);
      expect(FREE_TIER_LIMITS.apiCallsPerDay).toBe(0);
    });

    it('creator tier has unlimited posts and 4 channels', () => {
      expect(CREATOR_TIER_LIMITS.postsPerMonth).toBe(-1);
      expect(CREATOR_TIER_LIMITS.aiTokensPerMonth).toBe(250000);
      expect(CREATOR_TIER_LIMITS.connectedAccounts).toBe(4);
      expect(CREATOR_TIER_LIMITS.teamMembers).toBe(1);
    });

    it('pro tier has higher limits', () => {
      expect(PRO_TIER_LIMITS.postsPerMonth).toBe(-1);
      expect(PRO_TIER_LIMITS.aiTokensPerMonth).toBe(500000);
      expect(PRO_TIER_LIMITS.connectedAccounts).toBe(8);
      expect(PRO_TIER_LIMITS.teamMembers).toBe(3);
    });

    it('enterprise (studio) tier has unlimited content and highest limits', () => {
      expect(ENTERPRISE_TIER_LIMITS.postsPerMonth).toBe(-1);
      expect(ENTERPRISE_TIER_LIMITS.aiTokensPerMonth).toBe(-1);
      expect(ENTERPRISE_TIER_LIMITS.connectedAccounts).toBe(-1);
      expect(ENTERPRISE_TIER_LIMITS.teamMembers).toBe(10);
      expect(ENTERPRISE_TIER_LIMITS.apiCallsPerDay).toBe(100000);
    });

    it('getLimitsForTier returns correct tier', () => {
      expect(getLimitsForTier('free')).toEqual(FREE_TIER_LIMITS);
      expect(getLimitsForTier('spark')).toEqual(FREE_TIER_LIMITS);
      expect(getLimitsForTier('creator')).toEqual(CREATOR_TIER_LIMITS);
      expect(getLimitsForTier('pro')).toEqual(PRO_TIER_LIMITS);
      expect(getLimitsForTier('studio')).toEqual(ENTERPRISE_TIER_LIMITS);
      expect(getLimitsForTier('enterprise')).toEqual(ENTERPRISE_TIER_LIMITS);
    });

    it('getLimitsForTier defaults to free for unknown tier', () => {
      const unknownTier = 'unknown' as const;
      expect(getLimitsForTier(unknownTier as Tier)).toEqual(FREE_TIER_LIMITS);
    });
  });

  describe('checkLimit', () => {
    const freeLimits = FREE_TIER_LIMITS;

    it('allows usage within limit (strictly less than limit)', () => {
      const result = checkLimit('postsPerMonth', createUsage({ postsThisMonth: 5 }), freeLimits);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(15);
      expect(result.used).toBe(5);
      expect(result.remaining).toBe(10);
    });

    it('blocks usage exactly at limit (used < limit required)', () => {
      const result = checkLimit('postsPerMonth', createUsage({ postsThisMonth: 15 }), freeLimits);
      expect(result.allowed).toBe(false);
      expect(result.used).toBe(15);
      expect(result.remaining).toBe(0);
    });

    it('blocks usage over limit', () => {
      const result = checkLimit('postsPerMonth', createUsage({ postsThisMonth: 16 }), freeLimits);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(15);
      expect(result.used).toBe(16);
      expect(result.remaining).toBe(0);
    });

    it('returns correct remaining calculation (never negative)', () => {
      const tests = [
        { used: 0, expectedRemaining: 15 },
        { used: 5, expectedRemaining: 10 },
        { used: 14, expectedRemaining: 1 },
        { used: 15, expectedRemaining: 0 },
        { used: 25, expectedRemaining: 0 },
      ];

      for (const { used, expectedRemaining } of tests) {
        const result = checkLimit('postsPerMonth', createUsage({ postsThisMonth: used }), freeLimits);
        expect(result.remaining).toBe(expectedRemaining);
        expect(result.remaining).toBeGreaterThanOrEqual(0);
      }
    });

    it('works for all limit types on free tier', () => {
      const usage = createUsage({
        postsThisMonth: 6,
        aiTokensThisMonth: 25000,
        connectedAccounts: 1,
        scheduledPosts: 3,
        teamMembers: 0,
        apiCallsToday: 0,
      });

      expect(checkLimit('postsPerMonth', usage, freeLimits).allowed).toBe(true);
      expect(checkLimit('aiTokensPerMonth', usage, freeLimits).allowed).toBe(true);
      expect(checkLimit('connectedAccounts', usage, freeLimits).allowed).toBe(true);
      expect(checkLimit('scheduledPosts', usage, freeLimits).allowed).toBe(true);
      expect(checkLimit('teamMembers', usage, freeLimits).allowed).toBe(true);
      // Free tier has apiCallsPerDay = 0 -> API access is gated
      expect(checkLimit('apiCallsPerDay', usage, freeLimits).allowed).toBe(false);
    });

    it('blocks when free tier limits are reached', () => {
      const usage = createUsage({
        postsThisMonth: 15,
        aiTokensThisMonth: 50000,
        connectedAccounts: 2,
        scheduledPosts: 15,
        teamMembers: 1,
        apiCallsToday: 0,
      });

      expect(checkLimit('postsPerMonth', usage, freeLimits).allowed).toBe(false);
      expect(checkLimit('aiTokensPerMonth', usage, freeLimits).allowed).toBe(false);
      expect(checkLimit('connectedAccounts', usage, freeLimits).allowed).toBe(false);
      expect(checkLimit('scheduledPosts', usage, freeLimits).allowed).toBe(false);
      expect(checkLimit('teamMembers', usage, freeLimits).allowed).toBe(false);
      expect(checkLimit('apiCallsPerDay', usage, freeLimits).allowed).toBe(false);
    });

    it('supports unlimited (-1) and higher limits on pro tier', () => {
      const usage = createUsage({
        postsThisMonth: 500,
        aiTokensThisMonth: 100000,
        connectedAccounts: 5,
        scheduledPosts: 20,
        teamMembers: 2,
        apiCallsToday: 1000,
      });

      const proLimits = PRO_TIER_LIMITS;
      expect(checkLimit('postsPerMonth', usage, proLimits).allowed).toBe(true);
      expect(checkLimit('postsPerMonth', usage, proLimits).remaining).toBe(-1);
      expect(checkLimit('aiTokensPerMonth', usage, proLimits).allowed).toBe(true);
      expect(checkLimit('aiTokensPerMonth', createUsage({ aiTokensThisMonth: 500000 }), proLimits).allowed).toBe(false);
      expect(checkLimit('connectedAccounts', createUsage({ connectedAccounts: 8 }), proLimits).allowed).toBe(false);
    });
  });

  describe('resetAt date calculation', () => {
    const mockUsage = createUsage();

    it('monthly limits reset at start of next month (UTC)', () => {
      const result = checkLimit('postsPerMonth', mockUsage, FREE_TIER_LIMITS);

      expect(result.resetAt.getUTCHours()).toBe(0);
      expect(result.resetAt.getUTCMinutes()).toBe(0);
      expect(result.resetAt.getUTCSeconds()).toBe(0);
      expect(result.resetAt.getUTCMilliseconds()).toBe(0);

      const now = new Date();
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      expect(result.resetAt.getTime()).toBe(nextMonth.getTime());
    });

    it('daily limits reset at midnight UTC', () => {
      const result = checkLimit('apiCallsPerDay', mockUsage, ENTERPRISE_TIER_LIMITS);

      expect(result.resetAt.getUTCHours()).toBe(0);
      expect(result.resetAt.getUTCMinutes()).toBe(0);
      expect(result.resetAt.getUTCSeconds()).toBe(0);
      expect(result.resetAt.getUTCMilliseconds()).toBe(0);

      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      expect(result.resetAt.getTime()).toBe(tomorrow.getTime());
    });

    it('static limits (connectedAccounts) reset 30 days from now', () => {
      const result = checkLimit('connectedAccounts', mockUsage, FREE_TIER_LIMITS);

      const expectedReset = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
      expect(Math.abs(result.resetAt.getTime() - expectedReset.getTime())).toBeLessThan(10000);
    });

    it('DST-safe: uses UTC not local time', () => {
      const result = checkLimit('postsPerMonth', mockUsage, FREE_TIER_LIMITS);
      expect(result.resetAt.getUTCDate()).toBe(1);
    });
  });

  describe('camelCase key mapping', () => {
    it('maps limit types to correct usage keys', () => {
      const freeLimits = FREE_TIER_LIMITS;

      expect(checkLimit('postsPerMonth', createUsage({ postsThisMonth: 5 }), freeLimits).used).toBe(5);
      expect(checkLimit('aiTokensPerMonth', createUsage({ aiTokensThisMonth: 1000 }), freeLimits).used).toBe(1000);
      expect(checkLimit('connectedAccounts', createUsage({ connectedAccounts: 2 }), freeLimits).used).toBe(2);
      expect(checkLimit('scheduledPosts', createUsage({ scheduledPosts: 3 }), freeLimits).used).toBe(3);
      expect(checkLimit('teamMembers', createUsage({ teamMembers: 1 }), freeLimits).used).toBe(1);
      expect(checkLimit('apiCallsPerDay', createUsage({ apiCallsToday: 10 }), freeLimits).used).toBe(10);
    });

    it('defaults to 0 for missing usage keys', () => {
      const incompleteUsage = { postsThisMonth: 5 } as Partial<UsageSnapshot>;
      const result = checkLimit('aiTokensPerMonth', incompleteUsage as UsageSnapshot, FREE_TIER_LIMITS);
      expect(result.used).toBe(0);
    });
  });

  describe('boundary conditions', () => {
    const freeLimits = FREE_TIER_LIMITS;

    it('handles zero usage', () => {
      const usage = createUsage();
      const result = checkLimit('postsPerMonth', usage, freeLimits);
      expect(result.used).toBe(0);
      expect(result.remaining).toBe(15);
      expect(result.allowed).toBe(true);
    });

    it('handles very large usage numbers', () => {
      const usage = createUsage({ postsThisMonth: 999999 });
      const result = checkLimit('postsPerMonth', usage, freeLimits);
      expect(result.used).toBe(999999);
      expect(result.remaining).toBe(0);
      expect(result.allowed).toBe(false);
    });

    it('never returns negative remaining', () => {
      const usage = createUsage({ postsThisMonth: 1000 });
      const result = checkLimit('postsPerMonth', usage, freeLimits);
      expect(result.remaining).toBe(0);
      expect(result.remaining).not.toBeLessThan(0);
    });
  });
});
