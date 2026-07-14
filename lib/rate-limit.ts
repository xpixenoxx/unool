import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const redis = new Redis({
  url: config.UPSTASH_REDIS_URL,
  token: config.UPSTASH_REDIS_TOKEN,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  prefix: 'rl:unool',
});

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

export async function checkRateLimit(
  request: Request,
  action: RateLimitAction
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const identifier = getIdentifier(request, action);
  const { limit, window } = rateLimits[action];

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `rl:unool:${action}`,
  });

  const { success, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    logger.warn('Rate limit exceeded', { action, identifier, remaining, reset });
  }

  return { success, remaining, reset };
}

export function rateLimitHeaders(remaining: number, reset: number): HeadersInit {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}