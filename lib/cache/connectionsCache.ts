import { Redis } from '@upstash/redis';
import { config } from '@/lib/config/schema';

const CONNECTIONS_CACHE_PREFIX = 'platform_connections:v1:';
const DEFAULT_TTL_SECONDS = 30;
const REDIS_OP_TIMEOUT_MS = 250;

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!redisClient) {
    try {
      redisClient = new Redis({
        url: config.UPSTASH_REDIS_REST_URL,
        token: config.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch {
      return null;
    }
  }
  return redisClient;
}

const memoryFallback = new Map<string, { payload: unknown; expiresAt: number }>();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), ms)),
  ]);
}

export async function getCachedConnectionsPayload<T>(workspaceId: string): Promise<T | null> {
  if (!workspaceId) return null;

  const mem = memoryFallback.get(workspaceId);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.payload as T;
  }

  const r = getRedis();
  if (!r) return null;

  try {
    const raw = await withTimeout(r.get(`${CONNECTIONS_CACHE_PREFIX}${workspaceId}`), REDIS_OP_TIMEOUT_MS);
    if (!raw) return null;
    const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
    memoryFallback.set(workspaceId, { payload: parsed, expiresAt: Date.now() + 10_000 });
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedConnectionsPayload<T>(
  workspaceId: string,
  payload: T,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
  if (!workspaceId) return;

  memoryFallback.set(workspaceId, {
    payload,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  const r = getRedis();
  if (!r) return;

  try {
    await withTimeout(
      r.set(`${CONNECTIONS_CACHE_PREFIX}${workspaceId}`, JSON.stringify(payload), { ex: ttlSeconds }),
      REDIS_OP_TIMEOUT_MS
    );
  } catch {
    // Non-fatal: DB remains source of truth
  }
}

export async function invalidateConnectionsCache(workspaceId?: string): Promise<void> {
  if (!workspaceId) {
    memoryFallback.clear();
    return;
  }

  memoryFallback.delete(workspaceId);

  const r = getRedis();
  if (!r) return;

  try {
    await withTimeout(r.del(`${CONNECTIONS_CACHE_PREFIX}${workspaceId}`), REDIS_OP_TIMEOUT_MS);
  } catch {
    // Non-fatal
  }
}
