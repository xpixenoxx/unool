/**
 * Central platform configuration.
 * Single source of truth for all supported publishing platforms.
 * Used by ComposerClient, ScheduleClient, AutomationClient, and any future platform-aware components.
 */
import { PlatformSVGs } from '@/components/dashboard/PlatformLogos';
import type { PlatformType } from '@/app/dashboard/composer/types';

export interface PlatformConfig {
  icon: React.ElementType;
  name: string;
  maxChars: number;
  color: string;
}

export const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  linkedin:  { icon: PlatformSVGs.linkedin,  name: 'LinkedIn',      maxChars: 3000,   color: 'bg-blue-600' },
  x:         { icon: PlatformSVGs.x,         name: 'X (Twitter)',   maxChars: 280,    color: 'bg-gray-800 dark:bg-gray-200' },
  threads:   { icon: PlatformSVGs.threads,   name: 'Threads',       maxChars: 500,    color: 'bg-black dark:bg-white' },
  facebook:  { icon: PlatformSVGs.facebook,  name: 'Facebook',      maxChars: 63206,  color: 'bg-blue-600' },
  instagram: { icon: PlatformSVGs.instagram, name: 'Instagram',     maxChars: 2200,   color: 'bg-pink-600' },
  youtube:   { icon: PlatformSVGs.youtube,   name: 'YouTube',       maxChars: 5000,   color: 'bg-red-600' },
  pinterest: { icon: PlatformSVGs.pinterest, name: 'Pinterest',     maxChars: 500,    color: 'bg-red-600' },
  bluesky:   { icon: PlatformSVGs.bluesky,   name: 'Bluesky',       maxChars: 300,    color: 'bg-blue-400' },
  mastodon:  { icon: PlatformSVGs.mastodon,  name: 'Mastodon',      maxChars: 500,    color: 'bg-purple-600' },
  slack:     { icon: PlatformSVGs.slack,     name: 'Slack',         maxChars: 40000,  color: 'bg-[#4A154B]' },
  twitch:    { icon: PlatformSVGs.twitch,    name: 'Twitch',        maxChars: 500,    color: 'bg-[#9146FF]' },
  telegram:  { icon: PlatformSVGs.telegram,  name: 'Telegram',      maxChars: 4096,   color: 'bg-[#229ED9]' },
  discord:   { icon: PlatformSVGs.discord,   name: 'Discord',       maxChars: 2000,   color: 'bg-[#5865F2]' },
  dribbble:  { icon: PlatformSVGs.dribbble,  name: 'Dribbble',      maxChars: 250,    color: 'bg-[#EA4C89]' },
  skool:     { icon: PlatformSVGs.skool,     name: 'Skool',         maxChars: 10000,  color: 'bg-[#E2AD44]' },
  whop:      { icon: PlatformSVGs.whop,      name: 'Whop',          maxChars: 10000,  color: 'bg-[#FF5A00]' },
  kick:      { icon: PlatformSVGs.kick,      name: 'Kick',          maxChars: 10000,  color: 'bg-[#53FC18]' },
  warpcast:  { icon: PlatformSVGs.warpcast,  name: 'Farcaster',     maxChars: 320,    color: 'bg-[#8A63D2]' },
  mewe:      { icon: PlatformSVGs.mewe,      name: 'MeWe',          maxChars: 4000,   color: 'bg-[#2F435E]' },
  nostr:     { icon: PlatformSVGs.nostr,     name: 'Nostr',         maxChars: 65535,  color: 'bg-[#9B51E0]' },
  medium:    { icon: PlatformSVGs.medium,    name: 'Medium',        maxChars: 100000, color: 'bg-black' },
  lemmy:     { icon: PlatformSVGs.lemmy,     name: 'Lemmy',         maxChars: 10000,  color: 'bg-[#00BC8C]' },
  listmonk:  { icon: PlatformSVGs.listmonk,  name: 'Listmonk',      maxChars: 100000, color: 'bg-[#0045ff]' },
  reddit:    { icon: PlatformSVGs.reddit,    name: 'Reddit',        maxChars: 40000,  color: 'bg-[#FF4500]' },
  hashnode:  { icon: PlatformSVGs.hashnode,  name: 'Hashnode',      maxChars: 100000, color: 'bg-[#2962FF]' },
  devto:     { icon: PlatformSVGs.devto,     name: 'DEV.to',        maxChars: 100000, color: 'bg-[#090909]' },
  twitter:   { icon: PlatformSVGs.x,         name: 'X (Twitter)',   maxChars: 280,    color: 'bg-gray-800 dark:bg-gray-200' },
  whatsapp:  { icon: PlatformSVGs.whatsapp,  name: 'WhatsApp',      maxChars: 4096,   color: 'bg-green-600' },
};
