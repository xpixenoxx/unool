import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface HealthCheck {
  name: string;
  healthy: boolean;
  latencyMs: number;
  details?: Record<string, unknown>;
  error?: string;
}

async function checkSupabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin.from('workspaces').select('id').limit(1);
    if (error) throw error;
    return { name: 'supabase', healthy: true, latencyMs: Date.now() - start };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { name: 'supabase', healthy: false, latencyMs: Date.now() - start, error: err.message };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Check if Redis is configured (not using localhost defaults)
    const redisUrl = config.UPSTASH_REDIS_REST_URL;
    const redisToken = config.UPSTASH_REDIS_REST_TOKEN;
    if (!redisUrl || !redisToken) {
      return { name: 'redis', healthy: true, latencyMs: Date.now() - start, details: { configured: false } };
    }
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    await redis.ping();
    return { name: 'redis', healthy: true, latencyMs: Date.now() - start };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { name: 'redis', healthy: false, latencyMs: Date.now() - start, error: err.message };
  }
}

async function checkAnthropic(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    if (!config.ANTHROPIC_API_KEY) {
      return { name: 'anthropic', healthy: true, latencyMs: Date.now() - start, details: { configured: false } };
    }
    // Use the configured model from env (default in schema is correct)
    const model = config.AI_DEFAULT_MODEL || 'claude-3-5-haiku-20241022';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
      signal: AbortSignal.timeout(5000),
    });
    return { name: 'anthropic', healthy: response.ok, latencyMs: Date.now() - start, details: { status: response.status, model } };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { name: 'anthropic', healthy: false, latencyMs: Date.now() - start, error: err.message };
  }
}

async function checkOpenAI(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    if (!config.OPENAI_API_KEY) {
      return { name: 'openai', healthy: true, latencyMs: Date.now() - start, details: { configured: false } };
    }
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    return { name: 'openai', healthy: response.ok, latencyMs: Date.now() - start, details: { status: response.status } };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { name: 'openai', healthy: false, latencyMs: Date.now() - start, error: err.message };
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  // Only run live external AI provider probes when explicitly requested with a valid CRON_SECRET
  // to prevent unauthenticated traffic from triggering paid Anthropic completions.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request?.headers.get('authorization');
  const isAuthorizedDeepProbe =
    Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`) &&
    request?.nextUrl?.searchParams.get('deep') === 'true';

  const [supabase, redis, anthropic, openai] = await Promise.all([
    checkSupabase(),
    checkRedis(),
    isAuthorizedDeepProbe
      ? checkAnthropic()
      : Promise.resolve<HealthCheck>({
          name: 'anthropic',
          healthy: true,
          latencyMs: 0,
          details: { configured: Boolean(config.ANTHROPIC_API_KEY), mode: 'config-only' },
        }),
    isAuthorizedDeepProbe
      ? checkOpenAI()
      : Promise.resolve<HealthCheck>({
          name: 'openai',
          healthy: true,
          latencyMs: 0,
          details: { configured: Boolean(config.OPENAI_API_KEY), mode: 'config-only' },
        }),
  ]);

  const checks: HealthCheck[] = [supabase, redis, anthropic, openai];
  const allHealthy = checks.every((c) => c.healthy);
  const criticalChecks = checks.filter((c) => c.name === 'supabase' || c.name === 'redis');
  const criticalHealthy = criticalChecks.every((c) => c.healthy);

  const status = criticalHealthy ? (allHealthy ? 'healthy' : 'degraded') : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  logger.debug('Health check completed', {
    status,
    checks: checks.map((c) => ({ name: c.name, healthy: c.healthy, latencyMs: c.latencyMs })),
    totalLatencyMs: Date.now() - startTime,
  });

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: config.NODE_ENV,
      checks,
    },
    { status: statusCode }
  );
}
