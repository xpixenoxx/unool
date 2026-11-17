import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { config } from '@/lib/config/schema';
import { getCashfreeMode } from '@/lib/billing/cashfree';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const checkedAt = new Date().toISOString();

  // 1. Database connectivity + latency probe
  const dbStart = Date.now();
  let databaseStatus: 'connected' | 'degraded' = 'degraded';
  let databaseLatencyMs = 0;
  let databaseError: string | null = null;
  try {
    const { error } = await supabaseAdmin.from('workspaces').select('id').limit(1);
    databaseLatencyMs = Date.now() - dbStart;
    if (!error) {
      databaseStatus = 'connected';
    } else {
      databaseError = error.message;
    }
  } catch (err) {
    databaseLatencyMs = Date.now() - dbStart;
    databaseError = err instanceof Error ? err.message : 'Database check failed';
  }

  // 2. Redis / Rate Limiting health
  let redisStatus: 'active' | 'not_configured' | 'degraded' = 'not_configured';
  let redisLatencyMs: number | null = null;
  if (config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN) {
    const rStart = Date.now();
    try {
      const redis = new Redis({
        url: config.UPSTASH_REDIS_REST_URL,
        token: config.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.ping();
      redisLatencyMs = Date.now() - rStart;
      redisStatus = 'active';
    } catch {
      redisLatencyMs = Date.now() - rStart;
      redisStatus = 'degraded';
    }
  }

  // 3. Cashfree Gateway configuration
  const cashfreeConfigured = Boolean(config.CASHFREE_APP_ID && config.CASHFREE_SECRET_KEY);
  const cashfreeEnv = getCashfreeMode();

  // 4. Token & internal signing secret status
  const encryptionConfigured = Boolean(config.ENCRYPTION_KEY && config.ENCRYPTION_KEY.length >= 16);

  return NextResponse.json({
    checkedAt,
    database: {
      status: databaseStatus,
      latencyMs: databaseLatencyMs,
      error: databaseError,
    },
    redis: {
      status: redisStatus,
      latencyMs: redisLatencyMs,
    },
    cashfree: {
      status: cashfreeConfigured ? 'configured' : 'not_configured',
      environment: cashfreeEnv,
    },
    authEngine: {
      encryptionConfigured,
      status: encryptionConfigured ? 'hardened' : 'attention_needed',
    },
  });
}

