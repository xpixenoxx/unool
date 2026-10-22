'use client';

import type { PublicProfile, ProfileLink, ProfileProof, ProfileProject } from './types';
import { normalizeSocialPlatformKey, getClubBrandIcon, CLUB_BRAND_ICONS, type ClubBrandIconKey } from './ClubBrandIcons';

/* ============================================================
   CLUB TEMPLATE DATA TYPES
   ============================================================ */

export interface ClubProofPoint {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  icon?: string;
  subtext?: string;
}

export interface ClubProject {
  id: string;
  title: string;
  category: string;
  description: string;
  image?: string;
  images?: string[];
  blurDataURL?: string;
  metrics?: Record<string, string | number>;
  links?: Array<{ label: string; url: string; icon?: string }>;
  tags?: string[];
}

export interface ClubSocialLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  icon: React.ReactNode;
  iconKey: ClubBrandIconKey;
}

export interface ClubOpenToItem {
  id: string;
  label: string;
  icon: string;
  variant?: 'default' | 'primary' | 'accent';
}

export interface ClubActivityItem {
  id: string;
  type: 'post' | 'project' | 'collab' | 'milestone' | 'media' | 'speaking' | 'award' | 'press' | 'hiring' | 'custom';
  title: string;
  description?: string;
  timestamp: string;
  link?: string;
  metadata?: Record<string, string | number>;
}

export interface ClubTemplateData {
  // Identity
  name: string;
  handle: string;
  tagline: string;
  bio: string;
  manifesto: string;
  avatar?: string;
  availability?: 'open' | 'busy' | 'selective' | 'closed';

  // Proof Points
  proofPoints: ClubProofPoint[];

  // Projects
  projects: ClubProject[];

  // Socials
  socialLinks: ClubSocialLink[];

  // Primary CTA
  primaryCTA?: ProfileLink;

  // OpenTo
  openTo: ClubOpenToItem[];

  // Activity
  activities: ClubActivityItem[];

  // Contact
  email?: string;
  location?: string;
  calendlyUrl?: string;
}

/* ============================================================
   DEFAULT FALLBACKS
   ============================================================ */

const DEFAULT_PROOF_POINTS: ClubProofPoint[] = [
  { id: '1', label: 'Projects Delivered', value: 147, suffix: '+', icon: 'CheckCircle', subtext: 'Across 3 continents' },
  { id: '2', label: 'Brand Partners', value: 89, suffix: '+', icon: 'Users', subtext: 'Culture & lifestyle' },
  { id: '3', label: 'Awards Won', value: 23, suffix: '', icon: 'Award', subtext: 'Cannes, D&AD, One Show' },
  { id: '4', label: 'Team Members', value: 34, suffix: '', icon: 'UserGroup', subtext: 'Strategists, designers, devs' },
];

const DEFAULT_PROJECTS: ClubProject[] = [
  {
    id: '1',
    title: 'Nike — Dream Campaign',
    category: 'Brand Identity',
    description: 'Global brand campaign spanning 40+ markets. Redefined athlete storytelling for the digital age.',
    image: '/templates/previews/project-nike.jpg',
    metrics: { 'Reach': '2.3B', 'Engagement': '8.4%', 'Markets': '40+' },
    tags: ['Brand', 'Campaign', 'Global'],
  },
  {
    id: '2',
    title: 'Spotify — Wrapped Experience',
    category: 'Digital Product',
    description: 'Annual personalized experience reaching 500M+ users. Data visualization meets emotional storytelling.',
    image: '/templates/previews/project-spotify.jpg',
    metrics: { 'Users': '500M+', 'Shares': '120M', 'Countries': '180' },
    tags: ['Product', 'Data Viz', 'Personalization'],
  },
  {
    id: '3',
    title: 'Dior — Atelier Digital',
    category: 'Experience Design',
    description: 'Immersive digital flagship for haute couture. WebGL-powered virtual atelier with AR try-on.',
    image: '/templates/previews/project-dior.jpg',
    metrics: { 'Session Time': '4:32', 'Conversion': '+340%', 'Press': 'Vogue, WWD' },
    tags: ['Luxury', 'WebGL', 'AR', 'E-commerce'],
  },
  {
    id: '4',
    title: 'The New York Times — Visual Essays',
    category: 'Editorial Design',
    description: 'Interactive long-form journalism platform. Redefining how stories live on the web.',
    image: '/templates/previews/project-nyt.jpg',
    metrics: { 'Read Time': '+67%', 'Subscriptions': '+23%', 'Awards': '5' },
    tags: ['Editorial', 'Journalism', 'Interactive'],
  },
];

const DEFAULT_ACTIVITIES: ClubActivityItem[] = [
  {
    id: '1',
    type: 'speaking',
    title: 'Keynote: The Future of Brand Experience',
    description: 'Cannes Lions International Festival of Creativity',
    timestamp: '2026-06-15T10:00:00Z',
    link: 'https://canneslions.com/speakers',
  },
  {
    id: '2',
    type: 'project',
    title: 'Launched: Dior Atelier Digital',
    description: 'Immersive WebGL experience for Spring/Summer 2026',
    timestamp: '2026-03-20T14:30:00Z',
    link: '/works/dior-atelier',
  },
  {
    id: '3',
    type: 'award',
    title: 'Gold Cannes Lion — Digital Craft',
    description: 'Spotify Wrapped 2025 Experience',
    timestamp: '2026-06-20T18:00:00Z',
  },
  {
    id: '4',
    type: 'press',
    title: 'Featured in Vogue Business',
    description: '"How The Club is Redefining Luxury Digital Experiences"',
    timestamp: '2026-02-14T09:00:00Z',
    link: 'https://voguebusiness.com',
  },
  {
    id: '5',
    type: 'milestone',
    title: '10 Years of The Club',
    description: 'A decade of shaping culture. 500+ projects. 50+ countries.',
    timestamp: '2026-01-01T00:00:00Z',
  },
];

/* ============================================================
   ADAPTER FUNCTION
   ============================================================ */

export function adaptPublicProfileToClub(profile: PublicProfile): ClubTemplateData {
  // Process proof points
  const proofPoints: ClubProofPoint[] = (profile.proofPoints && profile.proofPoints.length > 0)
    ? profile.proofPoints.map((p, i) => ({
        id: p.id || `proof-${i}`,
        label: p.label,
        value: typeof p.value === 'number' ? p.value : parseInt(String(p.value).replace(/[^\d]/g, '')) || 0,
        suffix: p.suffix || '',
        icon: p.icon || 'TrendingUp',
        subtext: p.description,
      }))
    : DEFAULT_PROOF_POINTS;

  // Process projects
  const projects: ClubProject[] = (profile.projects && profile.projects.length > 0)
    ? profile.projects.map((p, i) => ({
        id: p.id || `project-${i}`,
        title: p.title,
        category: p.category || 'Project',
        description: p.description || '',
        image: p.coverImage || p.images?.[0],
        images: p.images || [],
        blurDataURL: p.blurDataURL,
        metrics: p.metrics || {},
        links: p.links || [],
        tags: p.tags || [],
      }))
    : DEFAULT_PROJECTS;

  // Process social links
  const socialLinks: ClubSocialLink[] = (profile.links || [])
    .filter((l): l is ProfileLink & { platform: string } => Boolean(l.platform) && !l.isPrimaryAction)
    .map((l, i) => {
      const iconKey = normalizeSocialPlatformKey(l.platform);
      return {
        id: l.id || `social-${i}`,
        platform: l.platform,
        url: l.url,
        label: l.label || l.platform,
        icon: getClubBrandIcon(l.platform),
        iconKey,
      };
    });

  // Find primary CTA
  const primaryCTA = profile.links?.find(l => l.isPrimaryAction);

  // Process OpenTo
  const openTo: ClubOpenToItem[] = (profile.openTo && profile.openTo.length > 0)
    ? profile.openTo.map((o: any, i: number) => ({
        id: o.id || `open-${i}`,
        label: o.label,
        icon: o.icon || 'Sparkles',
        variant: o.variant || 'default',
      }))
    : [
        { id: '1', label: 'Brand Partnerships', icon: 'Handshake', variant: 'primary' },
        { id: '2', label: 'Speaking Engagements', icon: 'Mic', variant: 'accent' },
        { id: '3', label: 'Advisory Roles', icon: 'Compass', variant: 'default' },
        { id: '4', label: 'Creative Collaborations', icon: 'Sparkles', variant: 'primary' },
      ];

  // Process activities
  const activities: ClubActivityItem[] = (profile.activity && profile.activity.length > 0)
    ? profile.activity.map((a: any, i: number) => ({
        id: a.id || `activity-${i}`,
        type: a.type || 'custom',
        title: a.title,
        description: a.description,
        timestamp: a.timestamp,
        link: a.link,
        metadata: a.metadata,
      }))
    : DEFAULT_ACTIVITIES;

  return {
    // Identity
    name: profile.name || 'The Club',
    handle: profile.handle || 'theclub',
    tagline: profile.tagline || 'We shape culture.',
    bio: profile.bio || 'Culture isn\'t borrowed. It\'s built. Every campaign, every collaboration, every pixel — intentional. We don\'t follow trends. We originate them.',
    manifesto: profile.manifesto || 'A collective of strategists, designers, and cultural architects. We partner with brands that want to matter. Not just sell. Matter. Our work lives at the intersection of culture, technology, and human truth. We build worlds, not just campaigns.',
    avatar: profile.avatar || profile.avatarUrl || (profile as any).avatar_url,
    availability: (profile.availability as any) || 'selective',

    // Data
    proofPoints,
    projects,
    socialLinks,
    primaryCTA,
    openTo,
    activities,

    // Contact
    email: profile.email,
    location: profile.location,
    calendlyUrl: profile.calendlyUrl,
  };
}

/* ============================================================
   TYPE EXPORTS FOR COMPONENTS
   ============================================================ */

export type {
  PublicProfile,
  ProfileLink,
  ProfileProof,
  ProfileProject,
};