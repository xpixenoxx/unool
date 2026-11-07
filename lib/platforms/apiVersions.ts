/**
 * lib/platforms/apiVersions.ts
 *
 * Centralized API version registry.
 * Update here when platforms deprecate versions — one change propagates everywhere.
 */
export const API_VERSIONS = {
  instagram: 'v21.0',   // Instagram Graph API — updated from deprecated v20.0
  facebook: 'v21.0',    // Facebook Graph API  — updated from deprecated v20.0
  linkedin: '202606',   // LinkedIn-Version header value
  tiktok: 'v2',
  youtube: 'v3',
} as const;

/**
 * API hosts keyed by Instagram authentication method.
 *
 * Instagram Login (new OAuth 2.0 flow) issues IGqxxx / EAA… scoped tokens that
 * must call graph.instagram.com.  Facebook Business Login issues Page/System-User
 * tokens (EAA… beginning with a Facebook app-scoped prefix) that must call
 * graph.facebook.com for most Graph endpoints.
 *
 * Since the platform_connections table does not store an explicit auth_method
 * column, we detect the method from the access token prefix:
 *   - Tokens starting with "IGqx" or "IGdid" → Instagram Login → graph.instagram.com
 *   - All other tokens → Facebook Business Login → graph.facebook.com
 */
export const INSTAGRAM_API_HOSTS = {
  instagramLogin: 'https://graph.instagram.com',
  facebookLogin:  'https://graph.facebook.com',
} as const;

/**
 * Returns the correct Graph API host for an Instagram access token.
 * Uses token prefix to detect Instagram Login vs Facebook Business Login.
 */
export function resolveInstagramApiHost(accessToken: string): string {
  // Instagram Login tokens (OAuth 2.0 for Instagram) use graph.instagram.com.
  // All Instagram User Access Tokens begin with "IG" (e.g. IGqx, IGdid, IGAA, IGQ, etc.).
  if (accessToken.startsWith('IG')) {
    return INSTAGRAM_API_HOSTS.instagramLogin;
  }
  // Facebook Business Login tokens (e.g. EAAB...) go to graph.facebook.com.
  return INSTAGRAM_API_HOSTS.facebookLogin;
}

export type PlatformApiVersion = typeof API_VERSIONS;

