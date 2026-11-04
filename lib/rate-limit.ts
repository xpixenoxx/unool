import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

let redisInstance: Redis | null = null;

function getRedis(): Redis | null {
  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!redisInstance) {
    try {
      redisInstance = new Redis({
        url: config.UPSTASH_REDIS_REST_URL,
        token: config.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch {
      return null;
    }
  }
  return redisInstance;
}

export const rateLimits = {
  aiGeneration: { limit: config.RATE_LIMIT_AI_PER_MIN, window: '1m' },
  publish: { limit: config.RATE_LIMIT_PUBLISH_PER_MIN, window: '1m' },
  magicLink: { limit: config.RATE_LIMIT_AUTH_PER_HOUR, window: '1h' },
  profileView: { limit: 100, window: '1m' },
} as const;

export type RateLimitAction = keyof typeof rateLimits;

function getIdentifier(request: Request, action: RateLimitAction): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
  const userId = request.headers.get('x-user-id');

  if (action === 'magicLink') {
    const email = new URL(request.url).searchParams.get('email');
    return `magic:${email || ip}`;
  }

  return userId ? `${action}:${userId}` : `${action}:ip:${ip}`;
}

// In-memory fallback rate limiter (token bucket, per-identifier, per-action)
// Used only when Redis is unavailable. Resets on cold start -- acceptable degraded behavior.
const _localBuckets = new Map<string, { count: number; resetAt: number }>();

function localRateCheck(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = _localBuckets.get(identifier);
  if (!bucket || now > bucket.resetAt) {
    _localBuckets.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export async function checkRateLimit(
  request: Request,
  action: RateLimitAction
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const identifier = getIdentifier(request, action);
  const { limit, window } = rateLimits[action];
  const windowMs = window === '1m' ? 60_000 : window === '1h' ? 3_600_000 : 60_000;

  const redis = getRedis();
  if (!redis) {
    // Fail closed with local fallback -- not open
    const allowed = localRateCheck(identifier, limit, windowMs);
    if (!allowed) {
      logger.warn('Rate limit exceeded (local fallback -- Redis unavailable)', { action, identifier });
    }
    return { success: allowed, remaining: allowed ? limit - 1 : 0, reset: Date.now() + windowMs };
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `rl:unool:${action}`,
  });

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    if (!success) {
      logger.warn('Rate limit exceeded', { action, identifier, remaining, reset });
    }
    return { success, remaining, reset };
  } catch (error) {
    // Redis call failed -- use local fallback, do NOT fail open
    logger.warn('Rate limiter Redis error -- using local fallback', { action, error: String(error) });
    const allowed = localRateCheck(identifier, limit, windowMs);
    return { success: allowed, remaining: allowed ? limit - 1 : 0, reset: Date.now() + windowMs };
  }
}

export function rateLimitHeaders(remaining: number, reset: number): HeadersInit {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}
