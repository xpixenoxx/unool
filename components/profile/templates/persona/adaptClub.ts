'use client';

import type { PublicProfile, ProfileLink, ProfileProof, ProfileProject } from './types';
import { normalizeSocialPlatformKey, getClubBrandIcon, type ClubBrandIconKey } from './ClubBrandIcons';
import { sanitizeHref } from '@/lib/validation/profileSchemas';

export interface ClubProofPoint {
  id: string;
  label: string;
  value: number | string;
  suffix?: string;
  icon?: string;
  subtext?: string;
}

export interface ClubProject {
  id: string;
  title: string;
  category: string;
  description: string;
  type?: 'work' | 'editorial' | 'brand' | 'video';
  image?: string;
  images?: string[];
  blurDataURL?: string;
  metrics?: Record<string, string | number>;
  links?: Array<{ label: string; url: string; icon?: string }>;
  link?: string;
  tags?: string[];
}

export interface ClubSocialLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  icon: React.ReactNode;
  iconKey: ClubBrandIconKey;
  raw: ProfileLink;
}

export interface ClubOpenToItem {
  id: string;
  label: string;
  icon: string;
  variant?: 'default' | 'primary' | 'accent';
}

export interface ClubActivityItem {
  id: string;
  type: 'post' | 'release' | 'event' | 'collab' | 'media';
  title: string;
  description?: string;
  timestamp: string;
  link?: string;
  platform?: string;
  metadata?: Record<string, string | number>;
}

export interface ClubTemplateData {
  name: string;
  handle: string;
  tagline: string;
  bio: string;
  manifesto: string;
  avatar?: string;
  availability?: 'open' | 'busy' | 'selective' | 'closed';
  proofPoints: ClubProofPoint[];
  projects: ClubProject[];
  socialLinks: ClubSocialLink[];
  primaryCTA?: ProfileLink;
  openTo: ClubOpenToItem[];
  activities: ClubActivityItem[];
  email?: string;
  location?: string;
  calendlyUrl?: string;
}

function normalizeAvailability(raw?: string | null): ClubTemplateData['availability'] {
  if (!raw) return undefined;
  const v = raw.toLowerCase();
  if (v.includes('open') || v.includes('avail')) return 'open';
  if (v.includes('busy') || v.includes('booked')) return 'busy';
  if (v.includes('closed')) return 'closed';
  return 'selective';
}

export function adaptPublicProfileToClub(profile: PublicProfile): ClubTemplateData {
  const rawProofs = (profile.proofs && profile.proofs.length > 0)
    ? profile.proofs
    : ((profile as any).proofPoints || []);

  const proofPoints: ClubProofPoint[] = Array.isArray(rawProofs)
    ? rawProofs
        .filter((p: any) => p && (p.label || p.title || p.value))
        .map((p: any, i: number) => ({
          id: p.id || `proof-${i}`,
          label: p.label || p.title || 'Highlight',
          value: p.value ?? '',
          suffix: p.suffix || '',
          icon: p.icon || 'TrendingUp',
          subtext: p.description || p.context || undefined,
        }))
    : [];

  const rawProjects = (profile as any).projects;
  const projects: ClubProject[] = Array.isArray(rawProjects)
    ? rawProjects.map((p: any, i: number) => ({
        id: p.id || `project-${i}`,
        title: p.title || 'Featured Work',
        category: p.category || 'Project',
        description: p.description || '',
        type: 'work',
        image: p.coverImage || p.images?.[0],
        images: p.images || [],
        blurDataURL: p.blurDataURL,
        metrics: p.metrics || {},
        links: p.links || [],
        link: sanitizeHref(p.url || p.links?.[0]?.url) || undefined,
        tags: p.tags || [],
      }))
    : [];

  const visibleLinks = (profile.links || []).filter((l) => l.isVisible !== false && sanitizeHref(l.url));
  const primaryCTA = visibleLinks.find((l) => l.isPrimaryAction || (l as any).isPrimary);

  const socialLinks: ClubSocialLink[] = visibleLinks
    .filter((l) => l !== primaryCTA)
    .map((l, i) => {
      const safeUrl = sanitizeHref(l.url) || '#';
      const candidate = l.platform || l.label || safeUrl;
      const iconKey = normalizeSocialPlatformKey(candidate);
      return {
        id: l.id || `social-${i}`,
        platform: l.platform || l.label || 'Link',
        url: safeUrl,
        label: l.label || l.platform || 'Link',
        icon: getClubBrandIcon(candidate),
        iconKey,
        raw: l,
      };
    });

  const rawOpenTo = profile.openTo || (profile as any).open_to || [];
  const openTo: ClubOpenToItem[] = Array.isArray(rawOpenTo)
    ? rawOpenTo.map((o: any, i: number) =>
        typeof o === 'string'
          ? { id: `open-${i}`, label: o, icon: 'Sparkles', variant: 'default' }
          : {
              id: o.id || `open-${i}`,
              label: o.label || String(o),
              icon: o.icon || 'Sparkles',
              variant: o.variant || 'default',
            }
      )
    : [];

  const rawActivity = profile.recentActivity || (profile as any).activity;
  const activities: ClubActivityItem[] = Array.isArray(rawActivity)
    ? rawActivity.map((a: any, i: number) => ({
        id: a.id || `activity-${i}`,
        type: (['post', 'release', 'event', 'collab', 'media'].includes(a.type) ? a.type : 'post') as ClubActivityItem['type'],
        title: a.title || a.content || 'Recent update',
        description: a.description || (a.title && a.content ? a.content : undefined),
        timestamp: a.timestamp || a.createdAt || new Date().toISOString(),
        link: sanitizeHref(a.link || a.url) || undefined,
        platform: a.platform,
      }))
    : rawActivity && typeof rawActivity === 'object' && (rawActivity.content || rawActivity.title)
    ? [
        {
          id: 'activity-0',
          type: 'post',
          title: rawActivity.title || rawActivity.content,
          description: rawActivity.title ? rawActivity.content : undefined,
          timestamp: rawActivity.timestamp || new Date().toISOString(),
          link: sanitizeHref(rawActivity.url) || undefined,
          platform: rawActivity.platform,
        },
      ]
    : [];

  return {
    name: profile.name || 'Creator',
    handle: profile.handle || profile.subdomain || 'profile',
    tagline: profile.headline || (profile as any).tagline || profile.role || '',
    bio: profile.bio || '',
    manifesto: (profile as any).manifesto || '',
    avatar: profile.avatarUrl || (profile as any).avatar || (profile as any).avatar_url || undefined,
    availability: normalizeAvailability(profile.availabilityBadge || (profile as any).availability),
    proofPoints,
    projects,
    socialLinks,
    primaryCTA,
    openTo,
    activities,
    email: profile.showEmail ? (profile.email || undefined) : undefined,
    location: profile.location || undefined,
    calendlyUrl: sanitizeHref(profile.bookingUrl || (profile as any).calendlyUrl) || undefined,
  };
}

export type { PublicProfile, ProfileLink, ProfileProof, ProfileProject };
