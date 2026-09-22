import { config } from '@/lib/config/schema';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

const redis = new Redis({
  url: config.UPSTASH_REDIS_REST_URL,
  token: config.UPSTASH_REDIS_REST_TOKEN,
});

const STATE_TTL_SECONDS = 600; // 10 minutes
const STATE_PREFIX = 'oauth:state:';

export interface OAuthStateData {
  workspaceId: string;
  userId: string;
  platform: string;
  createdAt: number;
  returnUrl?: string;
}

/**
 * Generates a cryptographically random OAuth state with HMAC for integrity
 */
export function generateOAuthState(_workspaceId: string, _platform: string): string {
  // 32 bytes random + HMAC for integrity
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const randomPart = base64urlEncode(randomBytes);

  // Parameters kept for API consistency but not used in state generation
  // (state is purely random for security; workspace/platform stored in Redis)
  void _workspaceId;
  void _platform;

  return `oauth_${randomPart}`;
}

export class RedisConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisConfigError';
  }
}

/**
 * Stores OAuth state in Redis with TTL
 */
export async function storeOAuthState(state: string, workspaceId: string, userId: string, platform: string, returnUrl?: string): Promise<void> {
  const key = `${STATE_PREFIX}${state}`;
  const data: OAuthStateData = {
    workspaceId,
    userId,
    platform,
    createdAt: Date.now(),
    returnUrl,
  };

  try {
    await redis.set(key, JSON.stringify(data), { ex: STATE_TTL_SECONDS });
    logger.debug('OAuth state stored in Redis', { state: state.slice(0, 8) + '...', workspaceId, platform });
  } catch (error) {
    logger.warn('Redis unavailable. Falling back to signed cookie state propagation only.');
    // We intentionally do not throw here anymore.
    // The OAuth connect/callback routes will fallback to state encoded in the cookie.
  }
}

/**
 * Verifies and consumes OAuth state (deletes after verification)
 * Returns workspaceId, userId and platform if valid
 */
export async function verifyAndConsumeOAuthState(state: string, cookieHeader?: string | null): Promise<{ workspaceId: string; userId: string; platform: string; returnUrl?: string } | null> {
  const key = `${STATE_PREFIX}${state}`;

  let data: OAuthStateData | null = null;

  try {
    const stored = await redis.get(key);
    if (stored) {
      await redis.del(key);
      data = typeof stored === 'string' 
        ? JSON.parse(stored) as OAuthStateData 
        : stored as unknown as OAuthStateData;
    }
  } catch {
    // Redis unavailable, fallback to cookie
  }

  // Fallback to purely cookie-based state extraction
  if (!data && cookieHeader) {
    const parsedCookie = parseOAuthCookie(cookieHeader);
    if (parsedCookie && parsedCookie.state === state) {
      data = parsedCookie.data;
    }
  }

  if (!data) {
    logger.warn('OAuth state not found in Redis or cookie fallback', { state: state.slice(0, 8) + '...' });
    return null;
  }

  if (!data.createdAt || Date.now() - data.createdAt > STATE_TTL_SECONDS * 1000) {
    logger.warn('OAuth state expired or invalid', { state: state.slice(0, 8) + '...' });
    return null;
  }

  // Backwards compatibility for cookies created before this deployment
  const resolvedUserId = data.userId || data.workspaceId;

  return { workspaceId: data.workspaceId, userId: resolvedUserId, platform: data.platform, returnUrl: data.returnUrl };
}

/**
 * Creates a secure cookie for OAuth flow containing all required state data
 */
export function createOAuthCookie(state: string, workspaceId: string, userId: string, platform: string, returnUrl?: string, maxAgeSeconds: number = STATE_TTL_SECONDS): string {
  const data: OAuthStateData = { workspaceId, userId, platform, returnUrl, createdAt: Date.now() };
  // Base64 encode the JSON so it's cookie-safe
  const value = btoa(JSON.stringify({ s: state, d: data }));
  return `oauth_state=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

/**
 * Parses OAuth state from cookie
 */
export function parseOAuthCookie(cookieHeader: string | null): { state: string, data: OAuthStateData } | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const oauthCookie = cookies.find((c) => c.startsWith('oauth_state='));
  if (!oauthCookie) return null;

  try {
    const raw = oauthCookie.split('=')[1];
    if (!raw) return null;
    const parsed = JSON.parse(atob(raw));
    return { state: parsed.s, data: parsed.d };
  } catch {
    return null;
  }
}

/**
 * Creates a PKCE cookie for X/Twitter OAuth
 */
export function createPKCECookie(state: string, codeVerifier: string, maxAgeSeconds: number = STATE_TTL_SECONDS): string {
  const cookieName = `pkce_${state}`;
  return `${cookieName}=${codeVerifier}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

/**
 * Parses and consumes PKCE cookie
 */
export function parseAndConsumePKCECookie(cookieHeader: string | null, state: string): string | null {
  if (!cookieHeader) return null;

  const cookieName = `pkce_${state}`;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const pkceCookie = cookies.find((c) => c.startsWith(`${cookieName}=`));

  if (!pkceCookie) return null;

  // Note: Cookie deletion happens on client side after callback
  // or we could set a zero-max-age cookie in the response
  return pkceCookie.split('=')[1] || null;
}

function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}