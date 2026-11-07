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
 * Instagram Login (OAuth 2.0 flow) issues tokens that call graph.instagram.com.
 * Facebook Business Login issues Page/System-User tokens that call graph.facebook.com.
 */
export const INSTAGRAM_API_HOSTS = {
  instagramLogin: 'https://graph.instagram.com',
  facebookLogin:  'https://graph.facebook.com',
} as const;

/**
 * Returns the correct Graph API host for an Instagram access token and optional auth method.
 * Prefers explicit authMethod when available, falling back to clean token prefix inspection.
 */
export function resolveInstagramApiHost(accessToken: string, authMethod?: string): string {
  if (authMethod === 'instagram_login') {
    return INSTAGRAM_API_HOSTS.instagramLogin;
  }
  if (authMethod === 'facebook_login') {
    return INSTAGRAM_API_HOSTS.facebookLogin;
  }
  // Instagram User Access Tokens begin with "IG" (e.g. IGAA, IGqx, IGdid, IGQ, etc.).
  if (accessToken && accessToken.startsWith('IG')) {
    return INSTAGRAM_API_HOSTS.instagramLogin;
  }
  return INSTAGRAM_API_HOSTS.facebookLogin;
}

/**
 * Resolves the messaging endpoint URL for an Instagram account.
 */
export function getInstagramMessagingEndpoint(
  accessToken: string,
  igUserId: string = 'me',
  authMethod?: string
): string {
  const host = resolveInstagramApiHost(accessToken, authMethod);
  return `${host}/${API_VERSIONS.instagram}/${igUserId}/messages`;
}

export type PlatformApiVersion = typeof API_VERSIONS;
