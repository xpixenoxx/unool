import { Redis } from '@upstash/redis';
import { config } from '@/lib/config/schema';
import { getEdgeKv } from '@/lib/cloudflare/edgeBindings';
import { supabaseAdmin } from '@/lib/supabase/admin';

let _redisClient: Redis | null | undefined;
const recentMemoryMids = new Set<string>();
const MAX_MEMORY_MIDS = 500;
const ECHO_TTL_SECONDS = 600;

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

function rememberMidInMemory(mid: string): void {
  if (recentMemoryMids.has(mid)) return;
  if (recentMemoryMids.size >= MAX_MEMORY_MIDS) {
    const oldest = recentMemoryMids.values().next().value;
    if (oldest) recentMemoryMids.delete(oldest);
  }
  recentMemoryMids.add(mid);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function textsMatchEcho(sentText: string, echoText: string): boolean {
  const cleanSent = normalizeText(sentText);
  const cleanEcho = normalizeText(echoText);
  if (!cleanSent || !cleanEcho) return false;
  if (cleanSent === cleanEcho) return true;
  // Generic template cards truncate title/subtitle to 80 chars in Meta echoes
  return cleanEcho.length >= 20 && (cleanSent.startsWith(cleanEcho) || cleanEcho.startsWith(cleanSent));
}

function isWithinRecentWindow(createdAt?: string | null, maxAgeMs = 120_000): boolean {
  if (!createdAt) return false;
  const parsed = Date.parse(createdAt);
  return Number.isFinite(parsed) && Date.now() - parsed <= maxAgeMs;
}

export function isAutomatedTemplateSignature(text: string): boolean {
  const clean = normalizeText(text);
  if (!clean) return false;

  if (
    clean.startsWith('Thanks for following @') &&
    (clean.includes("You're all set!") || clean.includes("You're officially in!"))
  ) {
    return true;
  }
  if (
    clean.includes('To unlock this, make sure to follow @') &&
    clean.includes("Tap the button below once you've followed")
  ) {
    return true;
  }
  if (clean === 'Hey! Tap below and I will send it right over 👇') {
    return true;
  }
  if (clean.startsWith('Quick follow-up') && clean.includes('once you follow @')) {
    return true;
  }
  return false;
}

/**
 * Records an outbound Meta `message_id` returned from Unool's automated Graph API sends
 * so Meta's subsequent `is_echo` webhook is recognized as our own bot message rather than
 * a manual creator phone reply.
 */
export async function recordAutomatedOutboundMid(messageId?: string | null): Promise<void> {
  const mid = typeof messageId === 'string' ? messageId.trim() : '';
  if (!mid || mid === 'sent') return;

  rememberMidInMemory(mid);
  const key = `ig_bot_echo:${mid}`;

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(key, '1', { ex: ECHO_TTL_SECONDS });
      return;
    } catch {
      // Fall through to Edge KV
    }
  }

  try {
    const kv = await getEdgeKv();
    if (kv) {
      await kv.put(key, '1', { expirationTtl: ECHO_TTL_SECONDS });
    }
  } catch {
    // Non-blocking
  }
}

export async function isAutomatedOutboundMid(messageId?: string | null): Promise<boolean> {
  const mid = typeof messageId === 'string' ? messageId.trim() : '';
  if (!mid || mid === 'sent') return false;

  if (recentMemoryMids.has(mid)) return true;

  const key = `ig_bot_echo:${mid}`;
  const redis = getRedisClient();
  if (redis) {
    try {
      const hit = await redis.get<string>(key);
      if (hit) {
        rememberMidInMemory(mid);
        return true;
      }
    } catch {
      // Fall through to Edge KV
    }
  }

  try {
    const kv = await getEdgeKv();
    if (kv) {
      const hit = await kv.get(key);
      if (hit) {
        rememberMidInMemory(mid);
        return true;
      }
    }
  } catch {
    // Non-blocking
  }

  return false;
}

/**
 * Distinguishes automated Unool/API DM echoes from genuine manual replies sent by the creator
 * inside the native Instagram mobile/web app.
 */
export async function isAutomatedDmEcho(params: {
  workspaceId: string;
  recipientId: string;
  messageId?: string;
  appId?: unknown;
  echoText?: string;
}): Promise<boolean> {
  if (params.appId !== undefined && params.appId !== null && String(params.appId).trim().length > 0) {
    return true;
  }

  if (await isAutomatedOutboundMid(params.messageId)) {
    return true;
  }

  const cleanText = normalizeText(params.echoText || '');
  if (cleanText && isAutomatedTemplateSignature(cleanText)) {
    return true;
  }

  if (!params.workspaceId || !params.recipientId) {
    return false;
  }

  try {
    const { data: recentDms } = await supabaseAdmin
      .from('instagram_dm_logs')
      .select('ai_reply, auto_replied, created_at')
      .eq('workspace_id', params.workspaceId)
      .eq('sender_id', params.recipientId)
      .eq('auto_replied', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (Array.isArray(recentDms)) {
      for (const row of recentDms) {
        if (row?.auto_replied !== true) continue;
        const replyText = typeof row?.ai_reply === 'string' ? row.ai_reply : '';
        if (cleanText && textsMatchEcho(replyText, cleanText)) {
          return true;
        }
        if (!cleanText && replyText.trim() && isWithinRecentWindow(row?.created_at)) {
          return true;
        }
      }
    }
  } catch {
    // Non-blocking fallback check
  }

  try {
    const { data: recentComments } = await supabaseAdmin
      .from('instagram_comment_logs')
      .select('dm_message, dm_sent, created_at')
      .eq('workspace_id', params.workspaceId)
      .eq('commenter_id', params.recipientId)
      .eq('dm_sent', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (Array.isArray(recentComments)) {
      for (const row of recentComments) {
        if (row?.dm_sent !== true) continue;
        const dmMsg = typeof row?.dm_message === 'string' ? row.dm_message : '';
        if (cleanText && textsMatchEcho(dmMsg, cleanText)) {
          return true;
        }
        if (!cleanText && dmMsg.trim() && isWithinRecentWindow(row?.created_at)) {
          return true;
        }
      }
    }
  } catch {
    // Non-blocking fallback check
  }

  return false;
}
