/**
 * lib/platforms/apiVersions.ts
 *
 * Centralized API version registry.
 * Update here when platforms deprecate versions — one change propagates everywhere.
 */
export const API_VERSIONS = {
  instagram: 'v20.0',
  facebook: 'v20.0',
  linkedin: '202606',  // LinkedIn-Version header value
  tiktok: 'v2',
  youtube: 'v3',
} as const;

export type PlatformApiVersion = typeof API_VERSIONS;

