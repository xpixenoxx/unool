/**
 * Shared action helpers for public profile templates:
 *  - Domain-aware action verbs
 *  - Display URL cleanup
 *  - RFC 6350 / vCard 3.0 download
 */

export function getActionVerb(url: string, label?: string): string {
  const target = `${url} ${label ?? ''}`.toLowerCase();
  if (target.includes('github.com') || target.includes('git.') || target.includes('gitlab')) return 'Inspect';
  if (target.includes('cal.com') || target.includes('calendly') || target.includes('book') || target.includes('schedule')) return 'Schedule';
  if (target.includes('youtube.com') || target.includes('youtu.be') || target.includes('vimeo') || target.includes('twitch')) return 'Watch';
  if (target.includes('spotify') || target.includes('apple.music') || target.includes('soundcloud') || target.includes('podcast')) return 'Listen';
  if (target.includes('medium.com') || target.includes('substack') || target.includes('blog') || target.includes('essay')) return 'Read';
  if (target.includes('linkedin.com') || target.includes('x.com') || target.includes('twitter.com') || target.includes('threads.net')) return 'Connect';
  if (target.includes('dribbble') || target.includes('behance') || target.includes('figma.com') || target.includes('portfolio')) return 'View';
  if (target.includes('mailto:') || target.includes('email') || target.includes('contact')) return 'Email';
  if (target.includes('shop') || target.includes('store') || target.includes('gumroad') || target.includes('lemonsqueezy')) return 'Acquire';
  return 'Explore';
}

export function cleanDisplayUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('mailto:')) return url.replace(/^mailto:/i, '');
  if (url.startsWith('tel:')) return url.replace(/^tel:/i, '');
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
}

export interface VCardInput {
  name: string;
  role?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  subdomain?: string | null;
  website?: string | null;
}

function escapeVCardValue(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export function buildVCardPayload(input: VCardInput): string {
  const trimmedName = (input.name || 'Creator').trim();
  const parts = trimmedName.split(/\s+/);
  const firstName = parts[0] || trimmedName;
  const lastName = parts.slice(1).join(' ');
  const profileUrl = input.website?.trim() || (input.subdomain ? `https://${input.subdomain}.unool.co` : 'https://unool.co');
  const org = [input.company, input.role].filter(Boolean).join(' — ');

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(trimmedName)}`,
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    input.role ? `TITLE:${escapeVCardValue(input.role)}` : '',
    org ? `ORG:${escapeVCardValue(org)}` : '',
    input.email ? `EMAIL;TYPE=INTERNET,WORK:${input.email}` : '',
    input.phone ? `TEL;TYPE=CELL:${input.phone}` : '',
    input.location ? `ADR;TYPE=WORK:;;${escapeVCardValue(input.location)};;;;` : '',
    input.bio ? `NOTE:${escapeVCardValue(input.bio)}` : '',
    `URL:${profileUrl}`,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function downloadProfileVCard(input: VCardInput): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const payload = buildVCardPayload(input);
    const blob = new Blob([payload], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeFile = (input.subdomain || input.name || 'contact').toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
    link.href = url;
    link.download = `${safeFile}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
