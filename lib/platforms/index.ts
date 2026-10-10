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
export { vkAdapter, VKAdapter } from './VKAdapter';
export { warpcastAdapter, WarpcastAdapter } from './WarpcastAdapter';
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
import { vkAdapter } from './VKAdapter';
import { warpcastAdapter } from './WarpcastAdapter';
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
  vk: vkAdapter,
  warpcast: warpcastAdapter,
};

export function getPlatformAdapter(platform: string): PlatformAdapter | null {
  return platformAdapters[platform.toLowerCase()] ?? null;
}

export const SUPPORTED_PLATFORMS = ['linkedin', 'x', 'threads', 'manual', 'facebook', 'instagram', 'youtube', 'pinterest', 'bluesky', 'reddit', 'mastodon', 'slack', 'twitch', 'telegram', 'discord', 'dribbble', 'skool', 'whop', 'kick', 'vk', 'warpcast'] as const;
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];