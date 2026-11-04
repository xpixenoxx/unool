// ── Shared platform type definitions ─────────────────────────────
// Single source of truth for platform slugs.
// Used across adapters, composer, previews, schedule, and dashboard.
//
// When adding a new platform:
//   1. Add its slug here
//   2. Add its entry in lib/config/platformConfig.ts (Step 31)
//   3. Add its preview case in PlatformMobilePreview.tsx

export type PlatformSlug =
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'threads'
  | 'pinterest'
  | 'bluesky'
  | 'mastodon'
  | 'slack'
  | 'twitch'
  | 'telegram'
  | 'discord'
  | 'dribbble'
  | 'skool'
  | 'whop'
  | 'kick'
  | 'warpcast'
  | 'mewe'
  | 'nostr'
  | 'medium'
  | 'lemmy'
  | 'listmonk'
  | 'reddit'
  | 'hashnode'
  | 'devto'
  | 'whatsapp';

export interface PlatformConnection {
  id: string;
  platform: PlatformSlug;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  platformUserId: string;
  platformUserName?: string;
}

