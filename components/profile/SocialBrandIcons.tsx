import * as React from 'react';

/**
 * Normalizes any link (checking explicit icon, label, and URL hostname/path)
 * to a standardized social brand key.
 */
export function normalizeSocialPlatform(label?: string, url?: string, explicitIcon?: string): string {
  // 1. Explicit icon check
  if (explicitIcon) {
    const iconKey = explicitIcon.toLowerCase().trim();
    if (BRAND_SVGS[iconKey]) return iconKey;
    if (iconKey === 'twitter') return 'x';
    if (iconKey === 'x.com') return 'x';
    if (iconKey === 'mail') return 'email';
    if (iconKey === 'substack') return 'substack';
    if (iconKey === 'web' || iconKey === 'site') return 'website';
  }

  // 2. Combined string check (label + url + explicitIcon)
  const combined = `${explicitIcon || ''} ${label || ''} ${url || ''}`.toLowerCase();

  // Coding & Developer
  if (combined.includes('leetcode')) return 'leetcode';
  if (combined.includes('hackerrank') || combined.includes('hacker rank')) return 'hackerrank';
  if (combined.includes('codechef')) return 'codechef';
  if (combined.includes('geeksforgeeks') || combined.includes('gfg')) return 'geeksforgeeks';
  if (combined.includes('github')) return 'github';
  if (combined.includes('gitlab')) return 'gitlab';
  if (combined.includes('bitbucket')) return 'bitbucket';
  if (combined.includes('stackoverflow') || combined.includes('stack overflow')) return 'stackoverflow';
  if (combined.includes('codepen')) return 'codepen';
  if (combined.includes('dev.to') || combined.includes('devto')) return 'devto';
  if (combined.includes('kaggle')) return 'kaggle';

  // Major Social & Community
  if (combined.includes('linkedin')) return 'linkedin';
  if (combined.includes('instagram') || combined.includes('insta')) return 'instagram';
  if (combined.includes('youtube') || combined.includes('youtu.be')) return 'youtube';
  if (combined.includes('twitter') || combined.includes('x.com') || (label && /^x$/i.test(label.trim()))) return 'x';
  if (combined.includes('threads')) return 'threads';
  if (combined.includes('tiktok')) return 'tiktok';
  if (combined.includes('facebook') || combined.includes('fb.com')) return 'facebook';
  if (combined.includes('discord') || combined.includes('discord.gg')) return 'discord';
  if (combined.includes('twitch')) return 'twitch';
  if (combined.includes('reddit')) return 'reddit';
  if (combined.includes('pinterest')) return 'pinterest';
  if (combined.includes('telegram') || combined.includes('t.me')) return 'telegram';
  if (combined.includes('whatsapp') || combined.includes('wa.me')) return 'whatsapp';

  // Design & Media
  if (combined.includes('dribbble')) return 'dribbble';
  if (combined.includes('behance')) return 'behance';
  if (combined.includes('figma')) return 'figma';
  if (combined.includes('medium')) return 'medium';
  if (combined.includes('substack') || combined.includes('newsletter')) return 'substack';
  if (combined.includes('spotify')) return 'spotify';
  if (combined.includes('producthunt') || combined.includes('product hunt')) return 'producthunt';
  if (combined.includes('notion')) return 'notion';

  // Communication & Web
  if (combined.includes('mailto:') || combined.includes('email') || combined.includes('mail')) return 'email';
  if (combined.includes('website') || combined.includes('portfolio') || combined.includes('personal site') || combined.includes('homepage')) return 'website';

  // Domain parsing fallback
  if (url) {
    try {
      const parsed = new URL(url.startsWith('http') || url.startsWith('mailto:') ? url : `https://${url}`);
      const host = parsed.hostname.toLowerCase();
      if (host.includes('leetcode.com')) return 'leetcode';
      if (host.includes('github.com')) return 'github';
      if (host.includes('linkedin.com')) return 'linkedin';
      if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
      if (host.includes('instagram.com')) return 'instagram';
      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
      if (host.includes('hackerrank.com')) return 'hackerrank';
      if (host.includes('codechef.com')) return 'codechef';
      if (host.includes('discord.com') || host.includes('discord.gg')) return 'discord';
      if (host.includes('twitch.tv')) return 'twitch';
      if (host.includes('tiktok.com')) return 'tiktok';
      if (host.includes('facebook.com') || host.includes('fb.com')) return 'facebook';
      if (host.includes('reddit.com')) return 'reddit';
      if (host.includes('dribbble.com')) return 'dribbble';
      if (host.includes('behance.net')) return 'behance';
      if (host.includes('figma.com')) return 'figma';
      if (host.includes('medium.com')) return 'medium';
      if (host.includes('spotify.com')) return 'spotify';
      if (host.includes('telegram.org') || host.includes('t.me')) return 'telegram';
      if (host.includes('whatsapp.com') || host.includes('wa.me')) return 'whatsapp';
      if (host.includes('gitlab.com')) return 'gitlab';
      if (host.includes('stackoverflow.com')) return 'stackoverflow';
      if (host.includes('substack.com')) return 'substack';
      if (host.includes('producthunt.com')) return 'producthunt';
      if (host.includes('notion.so') || host.includes('notion.site')) return 'notion';
    } catch {
      // not a standard URL
    }
  }

  return 'generic';
}

/**
 * SVG Path Registry: All 24x24 viewBox standard brand paths
 */
export const BRAND_SVGS: Record<string, React.ReactNode> = {
  // LeetCode (Simple Icons standard single-path)
  leetcode: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"
      fill="currentColor"
    />
  ),

  // GitHub
  github: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      fill="currentColor"
    />
  ),

  // HackerRank
  hackerrank: (
    <path
      d="M12 0a12 12 0 0 0-3.39.49 11.9 11.9 0 0 0-7.85 7.85A12 12 0 0 0 0 12a12 12 0 0 0 .76 4.22 11.94 11.94 0 0 0 7.02 7.02A12 12 0 0 0 12 24a12 12 0 0 0 4.22-.76 11.94 11.94 0 0 0 7.02-7.02A12 12 0 0 0 24 12a12 12 0 0 0-.76-4.22 11.94 11.94 0 0 0-7.02-7.02A12 12 0 0 0 12 0zm3.93 17.14h-2.31v-4.11H10.38v4.11H8.07V6.86h2.31v4.17h3.24V6.86h2.31v10.28z"
      fill="currentColor"
    />
  ),

  // LinkedIn
  linkedin: (
    <path
      d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.86 18.5V10.13H5.07V18.5h2.79z"
      fill="currentColor"
    />
  ),

  // Instagram
  instagram: (
    <path
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
      fill="currentColor"
    />
  ),

  // YouTube
  youtube: (
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      fill="currentColor"
    />
  ),

  // X / Twitter
  x: (
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="currentColor"
    />
  ),

  // Facebook
  facebook: (
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="currentColor"
    />
  ),

  // TikTok
  tiktok: (
    <path
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.05 3.3-1.61 3.32-3.42V.02z"
      fill="currentColor"
    />
  ),

  // Threads
  threads: (
    <path
      d="M12.186 24h-.007C5.46 23.978 0 18.636 0 12.04 0 5.404 5.485.02 12.186.02c6.64 0 11.97 5.285 11.812 11.8-.13 5.378-3.79 9.87-8.91 10.932-.516.107-.99-.214-1.078-.727-.087-.514.22-.99.734-1.096 4.354-.903 7.464-4.73 7.575-9.3.136-5.59-4.397-10.15-10.133-10.15C6.47 1.48 1.74 6.22 1.74 12.04c0 5.765 4.7 10.457 10.447 10.476 2.83.01 5.474-1.074 7.447-3.05a.87.87 0 0 1 1.23 1.23c-2.31 2.313-5.388 3.58-8.678 3.304zm-1.847-7.234c-2.09-.08-4.043-1.47-4.043-3.924 0-2.32 1.93-3.856 4.336-3.856 2.378 0 4.092 1.34 4.092 3.658 0 .84-.214 1.61-.636 2.29-.44.7-1.09 1.15-1.92 1.32-.42.08-.85.12-1.28.12-.183 0-.365-.01-.549-.03zm.28-6.19c-1.5 0-2.63.93-2.63 2.27 0 1.43 1.13 2.36 2.45 2.41.13.01.27.01.4 0 .54-.06.97-.33 1.27-.8.29-.46.44-.99.44-1.57 0-1.42-1.03-2.31-2.33-2.31z"
      fill="currentColor"
    />
  ),

  // Discord
  discord: (
    <path
      d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      fill="currentColor"
    />
  ),

  // Twitch
  twitch: (
    <path
      d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"
      fill="currentColor"
    />
  ),

  // Dribbble
  dribbble: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.118-10.424c-.389-.12-2.787-.84-5.617-.384.887 2.438 1.247 4.5 1.343 5.111 2.508-1.127 4.274-3.515 4.274-6.327v-.4zm-5.785 6.012c-.12-.768-.504-2.892-1.428-5.351-.048.012-.096.024-.144.036-6.192 1.944-8.411 5.832-8.543 6.072 1.584 1.092 3.492 1.74 5.556 1.74 1.668 0 3.228-.432 4.559-1.497zm-11.231-.768c.24-.396 2.64-4.2 8.687-6.036.192-.06.384-.108.576-.156-.372-.828-.78-1.644-1.224-2.436-5.064 1.524-9.924 1.524-10.428 1.524-.012.216-.012.432-.012.66 0 2.508.972 4.8 2.401 6.444zm-3.085-8.496c.72-.012 4.968-.072 9.84-1.464-1.572-2.796-3.276-5.184-3.528-5.532-3.132 1.344-5.4 4.176-6.312 7zm8.136-7.8c.264.36 1.956 2.724 3.516 5.484 2.928-.792 5.568-.78 5.868-.768A9.974 9.974 0 0012 2.016c-.66 0-1.308.06-1.86.108zm10.74 6.372c-.444-.012-3.216-.024-6.3 1.008.384.744.732 1.512 1.056 2.292 2.724-.396 5.088.192 5.376.264.084-.696.12-1.392.12-2.1 0-.504-.072-1-.252-1.464z"
      fill="currentColor"
    />
  ),

  // Behance
  behance: (
    <path
      d="M22 7h-7v2h7V7zm1.726 10c-.442 1.297-2.029 3-4.976 3-3.401 0-5.75-2.292-5.75-6 0-3.52 2.366-6 5.625-6 3.424 0 5.248 2.388 4.938 5.75h-7.85c.088 1.636 1.037 2.656 2.537 2.656 1.487 0 2.195-.898 2.476-1.406H23.726zM15.713 12h5.188c-.088-1.25-.841-2.25-2.525-2.25-1.57 0-2.451.957-2.663 2.25zM8.307 10.828c.954-.44 1.443-1.277 1.443-2.316 0-2.297-1.889-3.512-4.664-3.512H0v14h5.457c3.12 0 4.993-1.488 4.993-3.898 0-1.742-1.002-3.578-2.143-4.274zM2.871 7.4h2.158c1.336 0 2.08.57 2.08 1.602 0 .977-.732 1.59-2.08 1.59H2.871V7.4zm2.348 9.2H2.871v-3.793h2.387c1.551 0 2.398.715 2.398 1.898 0 1.258-.887 1.895-2.437 1.895z"
      fill="currentColor"
    />
  ),

  // Figma
  figma: (
    <path
      d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0zm0-8a4 4 0 0 1 4-4h4a4 4 0 0 1 0 8h-4a4 4 0 0 1-4-4zm0 8a4 4 0 0 1 4-4h4v8h-4a4 4 0 0 1-4-4zm0 8a4 4 0 0 1 4-4h4v4a4 4 0 0 1-8 0z"
      fill="currentColor"
    />
  ),

  // Medium
  medium: (
    <path
      d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"
      fill="currentColor"
    />
  ),

  // Spotify
  spotify: (
    <path
      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.517 17.31c-.218.356-.684.472-1.04.254-2.85-1.74-6.438-2.134-10.666-1.168-.403.092-.81-.16-.902-.563-.093-.404.16-.81.564-.903 4.622-1.057 8.583-.616 11.79 1.343.355.218.47.684.254 1.037zm1.48-3.308c-.276.45-.86.592-1.31.316-3.265-2.007-8.243-2.613-12.015-1.432-.51.156-1.043-.13-1.198-.638-.155-.51.13-1.044.638-1.2 4.34-1.357 9.84-.678 13.57 1.615.45.276.592.86.315 1.338zm.135-3.447c-3.92-2.327-10.387-2.54-14.15-1.403-.61.184-1.256-.16-1.44-.77-.184-.61.16-1.256.77-1.44 4.316-1.3 11.455-1.05 16.002 1.65.548.326.728 1.036.402 1.584-.326.548-1.036.728-1.584.403z"
      fill="currentColor"
    />
  ),

  // Telegram
  telegram: (
    <path
      d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.5l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.96-.92c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.19 1.01.13.85.93z"
      fill="currentColor"
    />
  ),

  // WhatsApp
  whatsapp: (
    <path
      d="M17.507 14.307l-.009.075c-.338.905-1.488 1.632-2.38 1.777-.635.103-1.456.186-4.275-.98-3.606-1.492-5.918-5.187-6.096-5.426-.174-.238-1.442-1.921-1.442-3.666 0-1.746.913-2.604 1.238-2.962.325-.357.708-.447.944-.447.235 0 .47.002.677.012.219.01.512-.083.8.61.302.729 1.033 2.518 1.122 2.7.09.182.15.395.03.633-.12.238-.18.386-.357.595-.178.209-.373.467-.533.627-.178.178-.363.372-.156.729.208.356.924 1.524 1.984 2.47 1.365 1.217 2.515 1.594 2.871 1.772.357.178.566.149.774-.09.208-.238.89-1.039 1.127-1.396.238-.356.475-.297.8-.178.326.119 2.073.978 2.43 1.157.356.178.593.267.682.416.089.149.089.86-.249 1.765zM12 0C5.373 0 0 5.373 0 12c0 2.115.548 4.103 1.51 5.834L0 24l6.335-1.464A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
      fill="currentColor"
    />
  ),

  // Reddit
  reddit: (
    <path
      d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.612a1.24 1.24 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.095.327.327 0 0 0 0 .462c.969.969 2.525.969 3.494 0a.327.327 0 0 0 0-.462.327.327 0 0 0-.462 0c-.714.714-1.856.714-2.57 0a.327.327 0 0 0-.231-.095z"
      fill="currentColor"
    />
  ),

  // GitLab
  gitlab: (
    <path
      d="m23.6 9.59-1.12-3.45a.94.94 0 0 0-1.79 0l-1.12 3.45H4.43L3.31 6.14a.94.94 0 0 0-1.79 0L.4 9.59a1.64 1.64 0 0 0 .6 1.83L12 19.43l11-8.01a1.64 1.64 0 0 0 .6-1.83z"
      fill="currentColor"
    />
  ),

  // Stack Overflow
  stackoverflow: (
    <path
      d="M18.986 21.865v-6.404h2.134V24H2.69v-8.539h2.13v6.404h14.166zM6.11 19.782h11.633v-2.14H6.11v2.14zm.648-5.326l11.236 2.443.468-2.094-11.236-2.443-.468 2.094zm2.148-5.275l9.96 6.07 1.094-1.844-9.96-6.07-1.094 1.844zm4.444-5.367l7.636 8.79 1.63-1.41-7.636-8.79-1.63 1.41zM18.156 0l-1.92 1.01 5.56 10.23 1.92-1.01L18.156 0z"
      fill="currentColor"
    />
  ),

  // CodePen
  codepen: (
    <path
      d="m23.6 7.42-11-7.33a1.08 1.08 0 0 0-1.2 0l-11 7.33A1.08 1.08 0 0 0 0 8.32v7.36a1.08 1.08 0 0 0 .4.9l11 7.33a1.08 1.08 0 0 0 1.2 0l11-7.33a1.08 1.08 0 0 0 .4-.9V8.32a1.08 1.08 0 0 0-.4-.9zM12 2.45l8.53 5.69-3.81 2.54L12 7.55 7.28 10.68 3.47 8.14zm-1.09 7.91 2.18 1.45v4.38l-2.18-1.45zm-8.73 3.55v-3.7l3.27 2.18-3.27 2.18v-.66zm9.82 7.64L3.47 15.86l3.81-2.54 4.72 3.13 4.72-3.13 3.81 2.54zm2.18-5.46-2.18 1.45v-4.38l2.18-1.45zm7.64-2.18-3.27-2.18 3.27-2.18v4.36z"
      fill="currentColor"
    />
  ),

  // Dev.to
  devto: (
    <path
      d="M7.42 10.05c-.18-.12-.46-.17-.84-.17H5.21v4.24h1.37c.38 0 .66-.05.84-.16.18-.11.32-.28.41-.53.09-.24.14-.58.14-1.02v-.83c0-.45-.05-.79-.14-1.03-.09-.24-.23-.4-.41-.5zm14.39-7.86H2.19C.98 2.19 0 3.17 0 4.38v15.24c0 1.21.98 2.19 2.19 2.19h19.62c1.21 0 2.19-.98 2.19-2.19V4.38c0-1.21-.98-2.19-2.19-2.19zm-13.62 13h-4.4V8.81h4.4c.83 0 1.5.15 2.01.44.51.3.89.74 1.14 1.33.25.59.38 1.34.38 2.25v.34c0 .91-.13 1.66-.38 2.25-.25.59-.63 1.03-1.14 1.33-.51.29-1.18.44-2.01.44zm6.05 0h-3.41V8.81h3.41v1.17h-2.13v1.88h1.89v1.17h-1.89v1.88h2.13v1.28zm5.72-3.92-1.63 3.92h-1.45l-1.63-3.92V17.3h-1.28V8.81h1.7l1.94 4.67 1.94-4.67h1.7v8.49h-1.28v-4.08z"
      fill="currentColor"
    />
  ),

  // Kaggle
  kaggle: (
    <path
      d="M18.825 23.859c-.022.08-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.183c0 .235-.117.379-.352.379H5.093c-.235 0-.352-.144-.352-.379V.379c0-.235.117-.379.352-.379h2.842c.235 0 .352.144.352.379v14.73l6.398-6.398c.141-.141.293-.211.457-.211h3.338c.164 0 .258.07.281.211.023.164-.035.281-.176.352l-6.867 6.648 7.336 7.641c.141.117.187.246.164.357z"
      fill="currentColor"
    />
  ),

  // Product Hunt
  producthunt: (
    <path
      d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-1.33 16.5H8V7.5h4c2.21 0 4 1.79 4 4s-1.79 4-4 4h-1.33v1zM10.67 10h1.33c.74 0 1.33.6 1.33 1.33s-.6 1.33-1.33 1.33h-1.33V10z"
      fill="currentColor"
    />
  ),

  // Notion
  notion: (
    <path
      d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.737c-.466-.373-.886-.466-2.006-.373L2.64 2.39c-.42.047-.513.28-.327.466l2.146 1.352zm-.513 4.292v11.755c0 .7.373.933 1.166.886l14.288-.84c.793-.046.98-.466.98-1.073V7.52c0-.653-.233-.886-.84-.84l-14.754.886c-.606.047-.84.28-.84.934zm13.355.7c.093.42 0 .84-.42.887l-.793.14v7.79c-.56.327-1.12.513-1.586.513-.747 0-.98-.233-1.54-.933l-4.572-7.185v6.998l1.4.327s0 .84-.98.84l-3.08.187c-.093-.233 0-.7.374-.793l.886-.233V10.23l-1.213-.093c-.093-.42.14-.98.7-.98l3.36-.233 4.759 7.325V9.763l-1.166-.14c-.093-.467.233-.84.7-.84l3.172-.187z"
      fill="currentColor"
    />
  ),

  // Substack / Newsletter
  substack: (
    <path
      d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"
      fill="currentColor"
    />
  ),

  // CodeChef / Coding bracket
  codechef: (
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 13.5l-3.5-3.5 3.5-3.5 1.41 1.41L9.83 12l2.08 2.09-1.41 1.41zm5 0l-1.41-1.41L16.17 12l-2.08-2.09 1.41-1.41 3.5 3.5-3.5 3.5z"
      fill="currentColor"
    />
  ),

  // GeeksforGeeks
  geeksforgeeks: (
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5c-2.48 0-4.5-2.02-4.5-4.5S8.52 7.5 11 7.5c1.19 0 2.27.47 3.08 1.23l-1.42 1.42c-.44-.42-1.03-.65-1.66-.65-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5c1.23 0 2.22-.89 2.45-2.08H11v-2h4.5c.07.35.1.72.1 1.1 0 2.76-2.01 4.98-4.6 4.98z"
      fill="currentColor"
    />
  ),

  // Pinterest
  pinterest: (
    <path
      d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.99-.1-2.52.21-3.6.28-.97 1.83-6.22 1.83-6.22s-.47-.94-.47-2.33c0-2.18 1.26-3.81 2.84-3.81 1.34 0 1.99 1.01 1.99 2.22 0 1.35-.86 3.37-1.3 5.24-.37 1.57.79 2.85 2.34 2.85 2.81 0 4.97-2.96 4.97-7.23 0-3.78-2.72-6.42-6.6-6.42-4.5 0-7.14 3.38-7.14 6.86 0 1.36.52 2.82 1.18 3.61.13.16.15.3.11.46-.12.51-.39 1.58-.44 1.8-.07.29-.23.35-.53.21-1.98-.92-3.22-3.81-3.22-6.13 0-4.99 3.63-9.58 10.46-9.58 5.5 0 9.77 3.92 9.77 9.15 0 5.46-3.44 9.86-8.22 9.86-1.61 0-3.12-.84-3.64-1.83l-.99 3.77c-.36 1.38-1.33 3.11-1.98 4.16A12 12 0 1 0 12 0z"
      fill="currentColor"
    />
  ),

  // Email / Mail
  email: (
    <path
      d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
      fill="currentColor"
    />
  ),

  // Website / Globe
  website: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4.062 13C4.554 17.038 7.962 20.19 12 20.19c4.038 0 7.446-3.152 7.938-7.19H4.062zm15.876-2C19.446 6.962 16.038 3.81 12 3.81 7.962 3.81 4.554 6.962 4.062 11h15.876zM12 4.062c-1.615 1.846-2.585 4.316-2.738 6.938h5.476C14.585 8.378 13.615 5.908 12 4.062zm-2.738 8.938c.153 2.622 1.123 5.092 2.738 6.938 1.615-1.846 2.585-4.316 2.738-6.938H9.262z"
      fill="currentColor"
    />
  ),

  // Generic link icon
  generic: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      fill="none"
      stroke="currentColor"
    />
  ),
};

/**
 * Returns the inner SVG path element(s) for a given platform.
 * Perfect for templates that render directly within an existing <svg viewBox="0 0 24 24">.
 */
export function getSocialSvgPath(label?: string, url?: string, explicitIcon?: string): React.ReactNode {
  const key = normalizeSocialPlatform(label, url, explicitIcon);
  return BRAND_SVGS[key] || BRAND_SVGS.generic;
}

/**
 * Complete standalone SVG Icon component.
 */
export function SocialIcon({
  label,
  url,
  icon,
  className = 'w-5 h-5',
  style,
}: {
  label?: string;
  url?: string;
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const key = normalizeSocialPlatform(label, url, icon);
  const path = BRAND_SVGS[key] || BRAND_SVGS.generic;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-label={label || key}
      role="img"
    >
      {path}
    </svg>
  );
}

/**
 * Smart helper: if link.icon is a custom emoji (e.g. '🚀', '🔥'), renders that.
 * Otherwise, always renders the authentic brand SVG icon for that social platform.
 */
export function renderSocialOrIcon(
  link: { label?: string; url?: string; icon?: string | null },
  fallbackClassName: string = 'w-5 h-5 fill-current'
): React.ReactNode {
  // If icon is an emoji (starts with high unicode code point)
  if (link.icon && /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u.test(link.icon)) {
    return <span>{link.icon}</span>;
  }
  
  return <SocialIcon label={link.label} url={link.url} icon={link.icon || undefined} className={fallbackClassName} />;
}
