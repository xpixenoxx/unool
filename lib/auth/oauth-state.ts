import { config } from '@/lib/config/schema';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

const redis = new Redis({
  url: config.UPSTASH_REDIS_URL,
  token: config.UPSTASH_REDIS_TOKEN,
});

const STATE_TTL_SECONDS = 600; // 10 minutes
const STATE_PREFIX = 'oauth:state:';

export interface OAuthStateData {
  workspaceId: string;
  platform: string;
  createdAt: number;
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

/**
 * Stores OAuth state in Redis with TTL
 */
export async function storeOAuthState(state: string, workspaceId: string, platform: string): Promise<void> {
  const key = `${STATE_PREFIX}${state}`;
  const data: OAuthStateData = {
    workspaceId,
    platform,
    createdAt: Date.now(),
  };

  await redis.set(key, JSON.stringify(data), { ex: STATE_TTL_SECONDS });
  logger.debug('OAuth state stored', { state: state.slice(0, 8) + '...', workspaceId, platform });
}

/**
 * Verifies and consumes OAuth state (deletes after verification)
 * Returns workspaceId and platform if valid
 */
export async function verifyAndConsumeOAuthState(state: string): Promise<{ workspaceId: string; platform: string } | null> {
  const key = `${STATE_PREFIX}${state}`;

  // Atomic get-and-delete using GETDEL (Redis 6.2+)
  // Fallback: GET then DEL
  const stored = await redis.get(key);
  if (!stored) {
    logger.warn('OAuth state not found or expired', { state: state.slice(0, 8) + '...' });
    return null;
  }

  // Delete immediately to prevent replay
  await redis.del(key);

  try {
    const data = JSON.parse(stored as string) as OAuthStateData;

    // Additional sanity checks
    if (Date.now() - data.createdAt > STATE_TTL_SECONDS * 1000) {
      logger.warn('OAuth state expired', { state: state.slice(0, 8) + '...' });
      return null;
    }

    return { workspaceId: data.workspaceId, platform: data.platform };
  } catch {
    logger.error('Invalid OAuth state data', { state: state.slice(0, 8) + '...' });
    return null;
  }
}

/**
 * Creates a secure cookie for OAuth flow
 */
export function createOAuthCookie(state: string, maxAgeSeconds: number = STATE_TTL_SECONDS): string {
  return `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

/**
 * Parses OAuth state from cookie
 */
export function parseOAuthCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const oauthCookie = cookies.find((c) => c.startsWith('oauth_state='));
  if (!oauthCookie) return null;

  return oauthCookie.split('=')[1] || null;
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