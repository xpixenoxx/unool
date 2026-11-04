export type SupportedPlatformType =
  | 'linkedin'
  | 'x'
  | 'threads'
  | 'facebook'
  | 'instagram'
  | 'youtube'
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
  | 'whatsapp'
  | 'twitter';

export interface MobilePreviewProps {
  platform: SupportedPlatformType;
  content: string;
  isEmpty: boolean;
  media: { url: string; type: 'image' | 'video' | 'document'; alt?: string }[];
  profileName: string;
  profileHeadline?: string;
  initials: string;
  avatarUrl?: string;
}

/** Check if platform uses dark background theme */
export function isPlatformDark(platform: SupportedPlatformType): boolean {
  return [
    'x',
    'threads',
    'youtube',
    'bluesky',
    'mastodon',
    'discord',
    'slack',
    'reddit',
    'twitch',
    'kick',
    'warpcast',
    'nostr',
    'skool',
    'whop',
    'lemmy',
  ].includes(platform);
}

/** Get background color for the screen area */
export function getPlatformBgColor(platform: SupportedPlatformType): string {
  switch (platform) {
    case 'x': return '#000000';
    case 'threads': return '#101010';
    case 'youtube': return '#0F0F0F';
    case 'bluesky': return '#16202A';
    case 'mastodon': return '#191B22';
    case 'discord': return '#313338';
    case 'slack': return '#1A1D21';
    case 'reddit': return '#0E1113';
    case 'twitch': return '#0E0E10';
    case 'kick': return '#0B0E0F';
    case 'warpcast': return '#141416';
    case 'nostr': return '#111116';
    case 'skool': return '#1F2023';
    case 'whop': return '#121212';
    case 'lemmy': return '#1B1E21';
    case 'linkedin': return '#F3F2EF';
    case 'facebook': return '#F0F2F5';
    case 'telegram': return '#0E1621';
    case 'devto': return '#F5F5F5';
    case 'listmonk': return '#F8FAFC';
    case 'mewe': return '#F2F4F7';
    case 'dribbble':
    case 'pinterest':
    case 'medium':
    case 'hashnode':
    case 'instagram':
    default:
      return '#FFFFFF';
  }
}

