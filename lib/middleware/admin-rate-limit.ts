import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================================
// Admin Rate Limiting — Uses existing Upstash Redis
// Protects admin login and API from brute-force & abuse.
// ============================================================

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/**
 * Admin login rate limit: 5 attempts per 15 minutes per IP.
 * Returns null if Redis is not configured (graceful degradation).
 */
export function getAdminLoginRateLimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'admin:login',
  });
}

/**
 * Admin API rate limit: 60 requests per minute per admin user.
 * Returns null if Redis is not configured (graceful degradation).
 */
export function getAdminApiRateLimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'admin:api',
  });
}

