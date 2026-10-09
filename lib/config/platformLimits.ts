export type SupportedPlatform = 'linkedin' | 'x' | 'twitter' | 'threads' | 'facebook' | 'instagram' | 'youtube' | 'pinterest' | 'bluesky' | 'mastodon' | 'slack' | 'twitch' | 'telegram' | 'manual';

export interface PlatformLimitConfig {
  maxVideoSizeMB: number;
  maxImageSizeMB: number;
  maxDurationSeconds?: number;
}

export const PLATFORM_LIMITS: Record<SupportedPlatform, PlatformLimitConfig> = {
  linkedin: { maxVideoSizeMB: 5000, maxImageSizeMB: 10, maxDurationSeconds: 600 }, // 10 mins
  x: { maxVideoSizeMB: 512, maxImageSizeMB: 5, maxDurationSeconds: 140 }, // 2m 20s
  twitter: { maxVideoSizeMB: 512, maxImageSizeMB: 5, maxDurationSeconds: 140 },
  threads: { maxVideoSizeMB: 500, maxImageSizeMB: 8, maxDurationSeconds: 300 }, // 5 mins
  facebook: { maxVideoSizeMB: 1000, maxImageSizeMB: 10, maxDurationSeconds: 14400 }, // 4 hours
  instagram: { maxVideoSizeMB: 1000, maxImageSizeMB: 8, maxDurationSeconds: 900 }, // 15 mins
  youtube: { maxVideoSizeMB: 5000, maxImageSizeMB: 10, maxDurationSeconds: 43200 }, // 12 hours
  pinterest: { maxVideoSizeMB: 2000, maxImageSizeMB: 20, maxDurationSeconds: 900 }, // 15 mins
  bluesky: { maxVideoSizeMB: 50, maxImageSizeMB: 1, maxDurationSeconds: 60 },
  mastodon: { maxVideoSizeMB: 40, maxImageSizeMB: 8 },
  slack: { maxVideoSizeMB: 1000, maxImageSizeMB: 1000 },
  twitch: { maxVideoSizeMB: 50, maxImageSizeMB: 10 },
  telegram: { maxVideoSizeMB: 50, maxImageSizeMB: 10 },
  manual: { maxVideoSizeMB: 5000, maxImageSizeMB: 50 },
};

export function getPlatformLimit(platform: string): PlatformLimitConfig {
  return PLATFORM_LIMITS[platform.toLowerCase() as SupportedPlatform] || { maxVideoSizeMB: 5000, maxImageSizeMB: 50 };
}
