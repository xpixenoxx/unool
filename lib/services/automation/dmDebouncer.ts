import { Redis } from '@upstash/redis';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { getEdgeKv } from '@/lib/cloudflare/edgeBindings';

let _redisClient: Redis | null | undefined;

function getRedisClient(): Redis | null {
  if (_redisClient !== undefined) return _redisClient;
  const url = config.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = config.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _redisClient = null;
    return null;
  }
  try {
    _redisClient = new Redis({ url, token });
    return _redisClient;
  } catch {
    _redisClient = null;
    return null;
  }
}

export interface DmBurstAppendResult {
  buffered: boolean;
  latestMessageId: string;
}

interface KvBurstRecord {
  latestMessageId: string;
  items: string[];
}

/**
 * Cloudflare Workers-safe DM Burst Debouncer using:
 * 1. Upstash Redis (when `UPSTASH_REDIS_REST_URL` is configured), OR
 * 2. Native Cloudflare Workers KV (`UNOOL_EDGE_KV`) zero-external-cost fallback!
 *
 * When a user sends 3-5 rapid messages ("hey" -> "saw your reel" -> "how much?"),
 * each webhook appends into the burst buffer and schedules a delayed QStash job.
 * Only the latest delayed worker drains the buffer and sends ONE smart reply.
 */
export async function appendDmToBurstBuffer(
  workspaceId: string,
  senderId: string,
  messageId: string,
  text: string
): Promise<DmBurstAppendResult> {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    return { buffered: false, latestMessageId: messageId };
  }

  const burstKey = `dm_burst:${workspaceId}:${senderId}`;
  const latestKey = `dm_latest:${workspaceId}:${senderId}`;

  // 1. Primary: Upstash Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      await Promise.all([
        redis.rpush(burstKey, cleanText),
        redis.expire(burstKey, 90),
        redis.set(latestKey, messageId, { ex: 90 }),
      ]);
      return { buffered: true, latestMessageId: messageId };
    } catch (err) {
      logger.debug('appendDmToBurstBuffer Redis failed — trying Cloudflare Edge KV', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 2. Fallback: Cloudflare Edge KV (`UNOOL_EDGE_KV`)
  try {
    const kv = await getEdgeKv();
    if (kv) {
      const existing = await kv.get<KvBurstRecord>(burstKey, 'json');
      const items = Array.isArray(existing?.items) ? [...existing.items, cleanText].slice(-20) : [cleanText];
      const next: KvBurstRecord = { latestMessageId: messageId, items };
      await kv.put(burstKey, JSON.stringify(next), { expirationTtl: 120 });
      return { buffered: true, latestMessageId: messageId };
    }
  } catch (err) {
    logger.debug('appendDmToBurstBuffer Edge KV failed — falling back to immediate processing', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { buffered: false, latestMessageId: messageId };
}

/**
 * Called by the QStash outbound DM worker when `debounced === true`.
 * Returns `{ shouldProcess: false }` if a newer message has superseded this job,
 * or `{ shouldProcess: true, mergedText }` containing the coalesced multi-message burst.
 */
export async function drainDmBurstBufferIfLatest(
  workspaceId: string,
  senderId: string,
  messageId: string,
  fallbackText: string
): Promise<{ shouldProcess: boolean; mergedText: string; burstCount: number }> {
  const burstKey = `dm_burst:${workspaceId}:${senderId}`;
  const latestKey = `dm_latest:${workspaceId}:${senderId}`;

  // 1. Primary: Upstash Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      const latestMid = await redis.get<string>(latestKey);
      if (latestMid && latestMid !== messageId) {
        return { shouldProcess: false, mergedText: '', burstCount: 0 };
      }

      const items = await redis.lrange<string>(burstKey, 0, 20);
      await Promise.all([redis.del(burstKey), redis.del(latestKey)]);

      const cleanItems = Array.isArray(items) ? items.map((s) => String(s).trim()).filter(Boolean) : [];
      if (cleanItems.length === 0) {
        return { shouldProcess: true, mergedText: fallbackText, burstCount: 1 };
      }

      return {
        shouldProcess: true,
        mergedText: cleanItems.join('\n'),
        burstCount: cleanItems.length,
      };
    } catch (err) {
      logger.debug('drainDmBurstBufferIfLatest Redis failed — trying Cloudflare Edge KV', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 2. Fallback: Cloudflare Edge KV (`UNOOL_EDGE_KV`)
  try {
    const kv = await getEdgeKv();
    if (kv) {
      const record = await kv.get<KvBurstRecord>(burstKey, 'json');
      if (!record) {
        return { shouldProcess: true, mergedText: fallbackText, burstCount: 1 };
      }
      if (record.latestMessageId && record.latestMessageId !== messageId) {
        return { shouldProcess: false, mergedText: '', burstCount: 0 };
      }
      await kv.delete(burstKey);
      const cleanItems = Array.isArray(record.items)
        ? record.items.map((s) => String(s).trim()).filter(Boolean)
        : [];
      if (cleanItems.length === 0) {
        return { shouldProcess: true, mergedText: fallbackText, burstCount: 1 };
      }
      return {
        shouldProcess: true,
        mergedText: cleanItems.join('\n'),
        burstCount: cleanItems.length,
      };
    }
  } catch (err) {
    logger.debug('drainDmBurstBufferIfLatest Edge KV failed — processing single message', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { shouldProcess: true, mergedText: fallbackText, burstCount: 1 };
}
