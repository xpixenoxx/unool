/**
 * lib/auth/rate-limits.ts
 *
 * Dedicated OTP rate limiters on top of the existing Upstash Redis setup.
 *
 *  - otpGenerate:  5 attempts / user / hour   (prevents OTP flooding)
 *  - otpVerify:   10 attempts / user / 15 min  (prevents brute-force)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!redis) {
    redis = new Redis({
      url:   config.UPSTASH_REDIS_REST_URL,
      token: config.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

function makeRatelimit(limit: number, window: string) {
  return new Ratelimit({
    redis:   getRedis() as Redis,
    limiter: Ratelimit.slidingWindow(limit, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix:  'rl:unool:auth',
  });
}

export async function checkOtpGenerateLimit(
  identifier: string // email or ip
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const r = getRedis();
  if (!r) return { allowed: true, retryAfterMs: 0 }; // fail open if Redis unavailable

  const limiter = makeRatelimit(config.RATE_LIMIT_OTP_GEN_PER_HOUR, '1h');
  try {
    const { success, reset } = await limiter.limit(`gen:${identifier}`);
    return { allowed: success, retryAfterMs: success ? 0 : reset - Date.now() };
  } catch (err) {
    logger.warn('OTP gen rate limit check error, failing open', { error: String(err) });
    return { allowed: true, retryAfterMs: 0 };
  }
}

export async function checkOtpVerifyLimit(
  identifier: string
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const r = getRedis();
  if (!r) return { allowed: true, retryAfterMs: 0 };

  const limiter = makeRatelimit(config.RATE_LIMIT_OTP_VERIFY_PER_15MIN, '15m');
  try {
    const { success, reset } = await limiter.limit(`verify:${identifier}`);
    return { allowed: success, retryAfterMs: success ? 0 : reset - Date.now() };
  } catch (err) {
    logger.warn('OTP verify rate limit check error, failing open', { error: String(err) });
    return { allowed: true, retryAfterMs: 0 };
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
