import { describe, it, expect } from 'vitest';
import {
  RateLimitedError,
  TokenExpiredError,
  AuthenticationError,
  ValidationError,
  APIError,
  parseRetryAfter,
  DEFAULT_RETRY_OPTIONS,
} from './retry';
import { timingSafeEqual } from '@/lib/webhooks/verify';

describe('retry utility - pure functions', () => {
  describe('error classes', () => {
    it('RateLimitedError stores retryAfterMs and rate limit info', () => {
      const err = new RateLimitedError('rate limited', 5000, 100, 5, new Date());
      expect(err.retryAfterMs).toBe(5000);
      expect(err.limit).toBe(100);
      expect(err.remaining).toBe(5);
      expect(err.name).toBe('RateLimitedError');
    });

    it('TokenExpiredError stores platform', () => {
      const err = new TokenExpiredError('access token expired', 'linkedin');
      expect(err.platform).toBe('linkedin');
      expect(err.name).toBe('TokenExpiredError');
    });

    it('AuthenticationError stores platform and statusCode', () => {
      const err = new AuthenticationError('unauthorized', 'x', 401);
      expect(err.platform).toBe('x');
      expect(err.statusCode).toBe(401);
      expect(err.name).toBe('AuthenticationError');
    });

    it('ValidationError stores platform and details', () => {
      const err = new ValidationError('bad request', 'threads', 400, { field: 'content' });
      expect(err.platform).toBe('threads');
      expect(err.statusCode).toBe(400);
      expect(err.details).toEqual({ field: 'content' });
      expect(err.name).toBe('ValidationError');
    });

    it('APIError stores platform, statusCode, and isRetryable', () => {
      const err = new APIError('server error', 'linkedin', 502, true);
      expect(err.platform).toBe('linkedin');
      expect(err.statusCode).toBe(502);
      expect(err.isRetryable).toBe(true);
      expect(err.name).toBe('APIError');
    });
  });

  describe('parseRetryAfter', () => {
    it('parses seconds', () => {
      expect(parseRetryAfter('60')).toBe(60000);
      expect(parseRetryAfter('120')).toBe(120000);
    });

    it('parses HTTP-date', () => {
      const futureDate = new Date(Date.now() + 30000).toUTCString();
      const result = parseRetryAfter(futureDate);
      expect(result).toBeGreaterThan(25000);
      expect(result).toBeLessThan(35000);
    });

    it('returns null for invalid input', () => {
      expect(parseRetryAfter('invalid')).toBeNull();
      expect(parseRetryAfter('')).toBeNull();
      expect(parseRetryAfter(null)).toBeNull();
    });
  });

  describe('timingSafeEqual', () => {
    it('returns true for identical strings', () => {
      expect(timingSafeEqual('abc', 'abc')).toBe(true);
      expect(timingSafeEqual('', '')).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(timingSafeEqual('abc', 'def')).toBe(false);
      expect(timingSafeEqual('abc', 'abcd')).toBe(false);
      expect(timingSafeEqual('abc', 'ab')).toBe(false);
    });

    it('returns false for different length strings', () => {
      expect(timingSafeEqual('short', 'very-long-string')).toBe(false);
    });
  });

  describe('DEFAULT_RETRY_OPTIONS', () => {
    it('has correct defaults', () => {
      expect(DEFAULT_RETRY_OPTIONS.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_OPTIONS.baseDelayMs).toBe(1000);
      expect(DEFAULT_RETRY_OPTIONS.maxDelayMs).toBe(30000);
      expect(DEFAULT_RETRY_OPTIONS.retryableStatuses).toEqual([408, 429, 500, 502, 503, 504]);
      expect(typeof DEFAULT_RETRY_OPTIONS.isRetryableError).toBe('function');
    });
  });
});