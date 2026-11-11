export * from './adapter';
export { linkedInAdapter, LinkedInAdapter } from './LinkedInAdapter';
export { threadsAdapter, ThreadsAdapter } from './ThreadsAdapter';
export { xAdapter, XAdapter } from './XAdapter';
export { manualAdapter, ManualAdapter } from './ManualAdapter';
export { facebookAdapter, FacebookAdapter } from './FacebookAdapter';
export { pinterestAdapter, PinterestAdapter } from './PinterestAdapter';
export { youtubeAdapter, YoutubeAdapter } from './YoutubeAdapter';
export { instagramAdapter, InstagramAdapter } from './InstagramAdapter';
export { blueskyAdapter, BlueskyAdapter } from './BlueskyAdapter';
export { redditAdapter, RedditAdapter } from './RedditAdapter';
export { mastodonAdapter, MastodonAdapter } from './MastodonAdapter';
export { twitchAdapter, TwitchAdapter } from './TwitchAdapter';
export { telegramAdapter, TelegramAdapter } from './TelegramAdapter';
export { discordAdapter, DiscordAdapter } from './DiscordAdapter';
export { dribbbleAdapter, DribbbleAdapter } from './DribbbleAdapter';
export { skoolAdapter, SkoolAdapter } from './SkoolAdapter';
export { whopAdapter, WhopAdapter } from './WhopAdapter';
export { kickAdapter, KickAdapter } from './KickAdapter';

export { warpcastAdapter, WarpcastAdapter } from './WarpcastAdapter';
export { meweAdapter, MeweAdapter } from './MeweAdapter';
export { nostrAdapter, NostrAdapter } from './NostrAdapter';
export { mediumAdapter, MediumAdapter } from './MediumAdapter';
export { lemmyAdapter, LemmyAdapter } from './LemmyAdapter';
export { listmonkAdapter, ListmonkAdapter } from './ListmonkAdapter';
export { hashnodeAdapter, HashnodeAdapter } from './HashnodeAdapter';
export { devtoAdapter, DevtoAdapter } from './DevtoAdapter';
import { linkedInAdapter } from './LinkedInAdapter';
import { threadsAdapter } from './ThreadsAdapter';
import { xAdapter } from './XAdapter';
import { manualAdapter } from './ManualAdapter';
import { facebookAdapter } from './FacebookAdapter';
import { pinterestAdapter } from './PinterestAdapter';
import { youtubeAdapter } from './YoutubeAdapter';
import { instagramAdapter } from './InstagramAdapter';
import { blueskyAdapter } from './BlueskyAdapter';
import { redditAdapter } from './RedditAdapter';
import { mastodonAdapter } from './MastodonAdapter';
import { slackAdapter } from './SlackAdapter';
import { twitchAdapter } from './TwitchAdapter';
import { telegramAdapter } from './TelegramAdapter';
import { discordAdapter } from './DiscordAdapter';
import { dribbbleAdapter } from './DribbbleAdapter';
import { skoolAdapter } from './SkoolAdapter';
import { whopAdapter } from './WhopAdapter';
import { kickAdapter } from './KickAdapter';

import { warpcastAdapter } from './WarpcastAdapter';
import { meweAdapter } from './MeweAdapter';
import { nostrAdapter } from './NostrAdapter';
import { mediumAdapter } from './MediumAdapter';
import { lemmyAdapter } from './LemmyAdapter';
import { listmonkAdapter } from './ListmonkAdapter';
import { hashnodeAdapter } from './HashnodeAdapter';
import { devtoAdapter } from './DevtoAdapter';
import type { PlatformAdapter } from './adapter';

export const platformAdapters: Record<string, PlatformAdapter> = {
  linkedin: linkedInAdapter,
  x: xAdapter,
  twitter: xAdapter,
  threads: threadsAdapter,
  manual: manualAdapter,
  facebook: facebookAdapter,
  pinterest: pinterestAdapter,
  youtube: youtubeAdapter,
  instagram: instagramAdapter,
  bluesky: blueskyAdapter,
  reddit: redditAdapter,
  mastodon: mastodonAdapter,
  slack: slackAdapter,
  twitch: twitchAdapter,
  telegram: telegramAdapter,
  discord: discordAdapter,
  dribbble: dribbbleAdapter,
  skool: skoolAdapter,
  whop: whopAdapter,
  kick: kickAdapter,

  warpcast: warpcastAdapter,
  farcaster: warpcastAdapter,
  mewe: meweAdapter,
  nostr: nostrAdapter,
  medium: mediumAdapter,
  lemmy: lemmyAdapter,
  listmonk: listmonkAdapter,
  hashnode: hashnodeAdapter,
  devto: devtoAdapter,
  'dev.to': devtoAdapter,
};

export function getPlatformAdapter(platform: string): PlatformAdapter | null {
  return platformAdapters[platform.toLowerCase()] ?? null;
}

export const SUPPORTED_PLATFORMS = ['linkedin', 'x', 'threads', 'manual', 'facebook', 'instagram', 'youtube', 'pinterest', 'bluesky', 'reddit', 'mastodon', 'slack', 'twitch', 'telegram', 'discord', 'dribbble', 'skool', 'whop', 'kick', 'warpcast', 'mewe', 'nostr', 'medium', 'lemmy', 'listmonk', 'hashnode', 'devto'] as const;
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];

export type PlatformPublishMode = 'native' | 'webhook' | 'chat' | 'manual' | 'unsupported';
export type PlatformTierCategory = 'core' | 'labs';

export interface PlatformCapability {
  platform: SupportedPlatform;
  publishMode: PlatformPublishMode;
  tier: PlatformTierCategory;
  supportsDirectPublish: boolean;
  description: string;
}

export const PLATFORM_CAPABILITIES: Record<SupportedPlatform, PlatformCapability> = {
  instagram: { platform: 'instagram', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native Instagram Graph API publishing + Comment/DM automation' },
  linkedin: { platform: 'linkedin', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native LinkedIn Posts API (text, images, video, PDF carousels)' },
  threads: { platform: 'threads', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native Meta Threads API publishing' },
  x: { platform: 'x', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native X API v2 publishing (cost-capped per plan)' },
  youtube: { platform: 'youtube', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native YouTube Data API v3 video upload' },
  facebook: { platform: 'facebook', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native Facebook Pages Graph API publishing' },
  bluesky: { platform: 'bluesky', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native AT Protocol (Bluesky) feed publishing' },
  mastodon: { platform: 'mastodon', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native ActivityPub / Mastodon instance publishing' },
  reddit: { platform: 'reddit', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native Reddit OAuth subreddit submission' },
  pinterest: { platform: 'pinterest', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native Pinterest API v5 Pin creation' },
  telegram: { platform: 'telegram', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native Telegram Bot API channel broadcasting' },
  discord: { platform: 'discord', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native Discord channel/webhook broadcasting' },
  hashnode: { platform: 'hashnode', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native Hashnode GraphQL article publishing' },
  devto: { platform: 'devto', publishMode: 'native', tier: 'core', supportsDirectPublish: true, description: 'Native Forem / Dev.to article publishing' },
  medium: { platform: 'medium', publishMode: 'native', tier: 'labs', supportsDirectPublish: true, description: 'Medium API article publishing (requires legacy integration token)' },
  lemmy: { platform: 'lemmy', publishMode: 'native', tier: 'labs', supportsDirectPublish: true, description: 'Lemmy federated community post creation' },
  warpcast: { platform: 'warpcast', publishMode: 'native', tier: 'labs', supportsDirectPublish: true, description: 'Farcaster / Warpcast cast publishing' },
  nostr: { platform: 'nostr', publishMode: 'native', tier: 'labs', supportsDirectPublish: true, description: 'Nostr relay signed event broadcasting' },
  listmonk: { platform: 'listmonk', publishMode: 'native', tier: 'labs', supportsDirectPublish: true, description: 'Self-hosted Listmonk newsletter campaign creation' },
  slack: { platform: 'slack', publishMode: 'webhook', tier: 'labs', supportsDirectPublish: true, description: 'Slack Incoming Webhook channel message' },
  skool: { platform: 'skool', publishMode: 'webhook', tier: 'labs', supportsDirectPublish: true, description: 'Skool Zapier/Webhook trigger notification (not direct community feed API)' },
  mewe: { platform: 'mewe', publishMode: 'webhook', tier: 'labs', supportsDirectPublish: true, description: 'MeWe webhook/API bridge' },
  twitch: { platform: 'twitch', publishMode: 'chat', tier: 'labs', supportsDirectPublish: true, description: 'Twitch Helix stream chat announcement + stream title update' },
  kick: { platform: 'kick', publishMode: 'chat', tier: 'labs', supportsDirectPublish: true, description: 'Kick stream RTMP/chat integration' },
  dribbble: { platform: 'dribbble', publishMode: 'Native' as PlatformPublishMode, tier: 'labs', supportsDirectPublish: false, description: 'Dribbble profile verification only (Shot creation deprecated by Dribbble v2 API)' },
  whop: { platform: 'whop', publishMode: 'unsupported', tier: 'labs', supportsDirectPublish: false, description: 'Whop OIDC profile connection only (Whop API does not support post creation)' },
  manual: { platform: 'manual', publishMode: 'manual', tier: 'core', supportsDirectPublish: true, description: 'Manual copy-to-clipboard workflow' },
};
PLATFORM_CAPABILITIES.dribbble.publishMode = 'unsupported';

export function getPlatformCapability(platform: string): PlatformCapability | null {
  const key = platform.toLowerCase() === 'twitter' ? 'x' : (platform.toLowerCase() === 'dev.to' ? 'devto' : platform.toLowerCase());
  return PLATFORM_CAPABILITIES[key as SupportedPlatform] ?? null;
}