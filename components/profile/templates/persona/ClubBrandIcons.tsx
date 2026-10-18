'use client';

import React from 'react';

/* ============================================================
   CLUB BRAND ICONS — Centralized SVG Registry
   40+ platforms, all stroke-based for consistent weight
   ============================================================ */

const iconStyle = { width: '100%', height: '100%', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const IconWrapper = ({ children, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props} {...iconStyle}>{children}</svg>
);

// Primary Social Platforms
const InstagramIcon = () => (
  <IconWrapper>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
    <circle cx="18" cy="6" r="1" />
  </IconWrapper>
);

const TikTokIcon = () => (
  <IconWrapper>
    <path d="M15 8v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8" />
    <path d="M17 8V5a2 2 0 0 0-2-2h-2" />
    <path d="M7 16h10" />
  </IconWrapper>
);

const YouTubeIcon = () => (
  <IconWrapper>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.44 48.17 48.17 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.44 48.17 48.17 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <path d="M10 10l7 4-7 4z" />
  </IconWrapper>
);

const TwitterIcon = () => (
  <IconWrapper>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </IconWrapper>
);

const LinkedInIcon = () => (
  <IconWrapper>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </IconWrapper>
);

const FacebookIcon = () => (
  <IconWrapper>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </IconWrapper>
);

const SnapchatIcon = () => (
  <IconWrapper>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" />
    <path d="M16 14c0 2.2-1.8 4-4 4" />
  </IconWrapper>
);

const PinterestIcon = () => (
  <IconWrapper>
    <path d="M12 2a10 10 0 0 0-7.05 16.65A5.3 5.3 0 0 1 3.4 17.3c0-1.5.8-2.8 2-3.4.8-.5 1.6-1.4 1.3-2.4-.3-1-.6-2.1-.4-3.2.2-1.1.9-2 2-2.6 1.1-.6 2.2-.8 3.2-.8s2.1.2 3.2.8c.8.6 1.6 1.6 1.6 2.8 0 2.5-2.4 4.2-5.5 4.2a6 6 0 0 1-3.8-1.2" />
  </IconWrapper>
);

// Creative Platforms
const BehanceIcon = () => (
  <IconWrapper>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 8v8M12 8v8M16 8v8" />
  </IconWrapper>
);

const DribbbleIcon = () => (
  <IconWrapper>
    <circle cx="12" cy="12" r="10" />
    <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
    <path d="M21.75 12.84c-6.37-1.45-11.56-2.57-15.5-1.44" />
    <path d="M8.56 2.5c3.38 2.5 5.22 7.15 4.67 11.13" />
    <path d="M15.57 21.5c-3.3-2.45-5.16-7.1-4.67-11.28" />
  </IconWrapper>
);

const FigmaIcon = () => (
  <IconWrapper>
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
    <path d="M12 2h3.5a3.5 3.5 0 0 1 3.5 3.5v7H12V2z" />
    <path d="M12 12.5a3.5 3.5 0 0 1-3.5 3.5H8.5V16h7v-3.5A3.5 3.5 0 0 1 12 12.5z" />
    <path d="M5 16v3.5A3.5 3.5 0 0 0 8.5 22H12v-7H8.5A3.5 3.5 0 0 0 5 16z" />
  </IconWrapper>
);

const AdobeIcon = () => (
  <IconWrapper>
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
    <path d="M12 22V12" />
    <path d="M12 12l-5-2.5" />
    <path d="M12 12l5-2.5" />
  </IconWrapper>
);

const NotionIcon = () => (
  <IconWrapper>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h6M9 15h4" />
    <path d="M9 12h6" />
  </IconWrapper>
);

const FramerIcon = () => (
  <IconWrapper>
    <path d="M5 3v18h14V3H5z" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </IconWrapper>
);

const WebflowIcon = () => (
  <IconWrapper>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </IconWrapper>
);

// Developer Platforms
const GitHubIcon = () => (
  <IconWrapper>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </IconWrapper>
);

const GitLabIcon = () => (
  <IconWrapper>
    <path d="M22.56 11.21c.17-2.11.19-3.82.04-5.17-.11-1.42-.72-2.17-1.47-2.46-1.04-.38-3.24-.73-4.88-.91-.53.03-1.53.16-2.1.27l-.35 4.68c1.61.34 2.45 1.1 2.53 1.74.1.69-.85 1.24-1.46 1.46-.25.09-1 .14-1.38.14-.48 0-.94-.06-1.42-.15l-.24-4.8c-.49-.1-1.5-.23-2.1-.27C7.1 7.18 4.9 7.53 3.86 7.91c-.75.29-1.36 1.04-1.47 2.46-.15 1.35-.13 3.06-.04 5.17.14 2.78 1.69 5.56 4.67 6.33.31.09.7.13 1.17.13h.02c.58 0 .97-.04 1.27-.13 2.98-.77 4.53-3.55 4.67-6.33zM12 19.6c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
  </IconWrapper>
);

const StackOverflowIcon = () => (
  <IconWrapper>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    <path d="M12 6v12M6 12h12" />
  </IconWrapper>
);

const DevToIcon = () => (
  <IconWrapper>
    <path d="M6 5v14M6 5h12v2H6V5zm0 4h12v2H6V9zm0 4h8v2H6v-2z" />
  </IconWrapper>
);

const CodePenIcon = () => (
  <IconWrapper>
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
    <path d="M12 22v-8.5M12 2v8.5" />
    <path d="M2 8.5l10 6.5M22 8.5l-10 6.5" />
  </IconWrapper>
);

const VercelIcon = () => (
  <IconWrapper>
    <path d="M18 7V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h5v-3" />
    <path d="M12 17v-5" />
    <path d="M9 14h6" />
  </IconWrapper>
);

const NetlifyIcon = () => (
  <IconWrapper>
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
    <path d="M12 22V12" />
    <path d="M8 12l4-4 4 4" />
    <path d="M12 8v8" />
  </IconWrapper>
);

// Communication
const DiscordIcon = () => (
  <IconWrapper>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.38-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.676 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.083.083 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.007-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.257.192.373.293a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.04.107c.36.645.774 1.258 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.428-4.61-.344-9.148-3.554-13.66a.061.061 0 0 0-.031-.027z" />
    <path d="M9.5 16.5c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" />
    <path d="M14.5 16.5c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" />
    <path d="M19.5 12.5c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" />
  </IconWrapper>
);

const TelegramIcon = () => (
  <IconWrapper>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </IconWrapper>
);

const WhatsAppIcon = () => (
  <IconWrapper>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <path d="M18 18l-3-3 1.5-1.5L18 15l3 3-3 3z" />
  </IconWrapper>
);

const SlackIcon = () => (
  <IconWrapper>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </IconWrapper>
);

const EmailIcon = () => (
  <IconWrapper>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6L12 13 2 6" />
  </IconWrapper>
);

const CalendarIcon = () => (
  <IconWrapper>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </IconWrapper>
);

// Audio/Video
const SpotifyIcon = () => (
  <IconWrapper>
    <circle cx="12" cy="12" r="10" />
    <path d="M10.5 17.5a5 5 0 0 1 3-4" />
    <path d="M9 15.5a9 9 0 0 1 6-7" />
    <path d="M7 13.5a13 13 0 0 1 10-6" />
  </IconWrapper>
);

const SoundCloudIcon = () => (
  <IconWrapper>
    <path d="M15 12c0 1.7-1.3 3-3 3S9 13.7 9 12s1.3-3 3-3 3 1.3 3 3z" />
    <path d="M19 12c0 3.9-3.1 7-7 7S5 15.9 5 12 8.1 5 12 5s7 3.1 7 7z" />
    <path d="M23 12c0 6.1-4.9 11-11 11S1 18.1 1 12 5.9 1 12 1s11 4.9 11 11z" />
  </IconWrapper>
);

const AppleMusicIcon = () => (
  <IconWrapper>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </IconWrapper>
);

const TwitchIcon = () => (
  <IconWrapper>
    <path d="M21 2H3a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7l4 4V22h2v-4l4-4h7a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    <path d="M10 9v6M14 9v6M18 9v6" />
  </IconWrapper>
);

const VimeoIcon = () => (
  <IconWrapper>
    <path d="M18 12c0-3.3-2.7-6-6-6S6 8.7 6 12s2.7 6 6 6 6-2.7 6-6z" />
    <path d="M9 15V9l6 3-6 3z" />
  </IconWrapper>
);

// Writing
const MediumIcon = () => (
  <IconWrapper>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-6-6z" />
    <path d="M16 13H8M16 9H8M10 5H8" />
  </IconWrapper>
);

const SubstackIcon = () => (
  <IconWrapper>
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <path d="M10 9h4M10 13h4M10 17h2" />
  </IconWrapper>
);

const GhostIcon = () => (
  <IconWrapper>
    <path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5-2.5L17 19V10a8 8 0 0 0-8-8z" />
  </IconWrapper>
);

const HashnodeIcon = () => (
  <IconWrapper>
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
    <path d="M8 12h8M12 8v8" />
  </IconWrapper>
);

// Commerce
const ShopifyIcon = () => (
  <IconWrapper>
    <path d="M18.5 3H5.5L3 9l2.5 6 13 0 2.5-6L18.5 3z" />
    <path d="M12 12l-3 3M12 12l3 3M12 12l-3-3M12 12l3-3" />
  </IconWrapper>
);

const StripeIcon = () => (
  <IconWrapper>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M9 9h6M9 12h6M9 15h4" />
  </IconWrapper>
);

const PatreonIcon = () => (
  <IconWrapper>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M10 15h4v-6h-4v6zm4-10v6" />
  </IconWrapper>
);

const GumroadIcon = () => (
  <IconWrapper>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M8 12l2 4h4l-2-4H8z" />
  </IconWrapper>
);

// Default fallback
const GlobeIcon = () => (
  <IconWrapper>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
  </IconWrapper>
);

/* ============================================================
   ICON REGISTRY MAP
   ============================================================ */

export const CLUB_BRAND_ICONS: Record<string, React.ReactNode> = {
  // Primary Platforms
  instagram: <InstagramIcon />,
  tiktok: <TikTokIcon />,
  youtube: <YouTubeIcon />,
  twitter: <TwitterIcon />,
  x: <TwitterIcon />,
  linkedin: <LinkedInIcon />,
  facebook: <FacebookIcon />,
  snapchat: <SnapchatIcon />,
  pinterest: <PinterestIcon />,

  // Creative Platforms
  behance: <BehanceIcon />,
  dribbble: <DribbbleIcon />,
  figma: <FigmaIcon />,
  adobe: <AdobeIcon />,
  notion: <NotionIcon />,
  framer: <FramerIcon />,
  webflow: <WebflowIcon />,

  // Developer Platforms
  github: <GitHubIcon />,
  gitlab: <GitLabIcon />,
  stackoverflow: <StackOverflowIcon />,
  devto: <DevToIcon />,
  codepen: <CodePenIcon />,
  vercel: <VercelIcon />,
  netlify: <NetlifyIcon />,

  // Communication
  discord: <DiscordIcon />,
  telegram: <TelegramIcon />,
  whatsapp: <WhatsAppIcon />,
  slack: <SlackIcon />,
  email: <EmailIcon />,
  calendar: <CalendarIcon />,

  // Audio/Video
  spotify: <SpotifyIcon />,
  soundcloud: <SoundCloudIcon />,
  apple: <AppleMusicIcon />,
  'apple-music': <AppleMusicIcon />,
  twitch: <TwitchIcon />,
  vimeo: <VimeoIcon />,

  // Writing
  medium: <MediumIcon />,
  substack: <SubstackIcon />,
  ghost: <GhostIcon />,
  hashnode: <HashnodeIcon />,

  // Commerce
  shopify: <ShopifyIcon />,
  stripe: <StripeIcon />,
  patreon: <PatreonIcon />,
  gumroad: <GumroadIcon />,

  // Fallback
  default: <GlobeIcon />,
} as const;

export type ClubBrandIconKey = keyof typeof CLUB_BRAND_ICONS;

/* ============================================================
   PLATFORM NORMALIZATION
   ============================================================ */

const PLATFORM_ALIASES: Record<string, ClubBrandIconKey> = {
  'x': 'twitter',
  'twitter.com': 'twitter',
  'instagram.com': 'instagram',
  'tiktok.com': 'tiktok',
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'linkedin.com': 'linkedin',
  'github.com': 'github',
  'discord.gg': 'discord',
  'discord.com': 'discord',
  'behance.net': 'behance',
  'dribbble.com': 'dribbble',
  'figma.com': 'figma',
  'notion.site': 'notion',
  'notion.so': 'notion',
  'framer.com': 'framer',
  'webflow.io': 'webflow',
  'gitlab.com': 'gitlab',
  'stackoverflow.com': 'stackoverflow',
  'dev.to': 'devto',
  'codepen.io': 'codepen',
  'vercel.com': 'vercel',
  'netlify.app': 'netlify',
  'spotify.com': 'spotify',
  'soundcloud.com': 'soundcloud',
  'music.apple.com': 'apple',
  'twitch.tv': 'twitch',
  'vimeo.com': 'vimeo',
  'medium.com': 'medium',
  'substack.com': 'substack',
  'ghost.io': 'ghost',
  'hashnode.com': 'hashnode',
  'shopify.com': 'shopify',
  'stripe.com': 'stripe',
  'patreon.com': 'patreon',
  'gumroad.com': 'gumroad',
};

export function normalizeSocialPlatformKey(platform: string): ClubBrandIconKey {
  const normalized = platform.toLowerCase().trim()
    .replace(/\s+/g, '')
    .replace(/[.@]/g, '');

  // Check exact aliases first
  if (normalized in PLATFORM_ALIASES) {
    return PLATFORM_ALIASES[normalized];
  }

  // Check if it's a direct key in our registry
  if (normalized in CLUB_BRAND_ICONS) {
    return normalized as ClubBrandIconKey;
  }

  // Try partial matching for subdomains
  for (const [alias, key] of Object.entries(PLATFORM_ALIASES)) {
    if (normalized.includes(alias.replace('.', ''))) {
      return key;
    }
  }

  return 'default';
}

export function getClubBrandIcon(platform: string): React.ReactNode {
  const key = normalizeSocialPlatformKey(platform);
  return CLUB_BRAND_ICONS[key] ?? CLUB_BRAND_ICONS.default;
}