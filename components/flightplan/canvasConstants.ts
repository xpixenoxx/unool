import { normalizeFacebookUrl } from '@/lib/platforms/facebookUrl';

export const BEATS = [
  'Departure Hook',
  'Cruising Altitude',
  'Turbulence & Pivot',
  'Flight Telemetry',
  'Final Approach',
  'Open Frequency',
  'Next Horizon',
];

export const SUBS = [
  'The take-off disruption',
  'The backstory & context',
  'The breakthrough challenge',
  'Evidence, numbers & proof',
  'The direct conversion call',
  'Weekend audience dialogue',
  'The next voyage ahead',
];

export const TEN = [55, 28, 78, 58, 92, 45, 70];
export const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function catmull(p: number[][]): string[] {
  const s: string[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(i - 1, 0)];
    const b = p[i];
    const c = p[i + 1];
    const d = p[Math.min(i + 2, p.length - 1)];
    s.push(
      `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (d[0] - b[0]) / 6},${c[1] - (d[1] - b[1]) / 6} ${c[0]},${c[1]}`
    );
  }
  return s;
}

export const two = (n: number) => String(n).padStart(2, '0');

export function getLivePlatformUrl(v: {
  platform: string;
  platformUrl?: string | null;
  platformPostId?: string | null;
}): string {
  const p = v.platform?.toLowerCase() || '';

  if (p === 'facebook') {
    return normalizeFacebookUrl(v.platformUrl, v.platformPostId);
  }

  if (v.platformUrl && typeof v.platformUrl === 'string' && v.platformUrl.trim().startsWith('http')) {
    return v.platformUrl.trim();
  }

  const rawId = v.platformPostId?.trim() || '';

  switch (p) {
    case 'linkedin':
      return rawId ? `https://www.linkedin.com/feed/update/${rawId}` : 'https://www.linkedin.com/feed/';
    case 'x':
    case 'twitter':
      return rawId ? `https://x.com/i/status/${rawId}` : 'https://x.com';
    case 'bluesky':
      if (rawId.startsWith('http')) return rawId;
      if (rawId.includes('/')) return `https://bsky.app/profile/${rawId}`;
      return rawId ? `https://bsky.app/profile/${rawId}` : 'https://bsky.app';
    case 'facebook':
      return normalizeFacebookUrl(v.platformUrl, rawId);
    case 'instagram':
      return rawId ? `https://www.instagram.com/p/${rawId}/` : 'https://www.instagram.com';
    case 'threads':
      return rawId ? `https://www.threads.net/post/${rawId}` : 'https://www.threads.net';
    case 'pinterest':
      return rawId ? `https://www.pinterest.com/pin/${rawId}/` : 'https://www.pinterest.com';
    case 'youtube':
      return rawId ? `https://www.youtube.com/watch?v=${rawId}` : 'https://www.youtube.com';
    case 'mastodon':
      return rawId.startsWith('http') ? rawId : 'https://mastodon.social';
    case 'reddit':
      return rawId ? `https://www.reddit.com/comments/${rawId}` : 'https://www.reddit.com';
    case 'discord':
      return rawId.startsWith('http') ? rawId : 'https://discord.com/app';
    case 'slack':
      return rawId.startsWith('http') ? rawId : 'https://slack.com';
    case 'devto':
      return rawId ? `https://dev.to/articles/${rawId}` : 'https://dev.to';
    case 'medium':
      return rawId.startsWith('http') ? rawId : 'https://medium.com';
    case 'hashnode':
      return rawId.startsWith('http') ? rawId : 'https://hashnode.com';
    case 'twitch':
      return rawId ? `https://twitch.tv/${rawId}` : 'https://twitch.tv';
    case 'dribbble':
      return rawId ? `https://dribbble.com/shots/${rawId}` : 'https://dribbble.com';
    default:
      return 'https://unool.co/dashboard';
  }
}

// Fixed star coordinates for reproducible starfield
export const STARS = Array.from({ length: 46 }, (_, i) => ({
  cx: ((i * 137 + 45) % 960) + 20,
  cy: ((i * 83 + 27) % 280) + 15,
  r: (((i * 17) % 13) / 10 + 0.3).toFixed(1),
  opacity: (((i * 23) % 50) / 100 + 0.15).toFixed(2),
}));

