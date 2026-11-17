import { DEFAULT_TEMPLATE_ID, normalizeTemplateId } from '@/lib/profile/templateNormalization';
import type { PublicProfile } from '@/components/profile/templates/types';

export type BuilderTabId = 'identity' | 'links' | 'design' | 'domain';

export type ProfileVisibilityMode = 'public' | 'unlisted' | 'private';
export type ColorModeOption = 'auto' | 'light' | 'dark';
export type FontPairingOption = 'grotesk' | 'editorial' | 'classic' | 'mono';
export type AvatarStyleOption = 'circle' | 'rounded' | 'square';

export interface BuilderSectionVisibility {
  proofs: boolean;
  openTo: boolean;
  activity: boolean;
  contactCta: boolean;
  footerBadge: boolean;
}

export interface BuilderLink {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  type?: string;
  category?: 'primary' | 'work' | 'social' | 'writing' | 'resource' | 'other';
  isPrimary?: boolean;
  badge?: string;
  clicks: number;
  order: number;
  isVisible: boolean;
}

export interface BuilderProofPoint {
  id?: string;
  type: string;
  value: string;
  url?: string;
}

export interface BuilderTheme {
  template: string;
  preset: string;
  accentColor: string;
  colorMode: ColorModeOption;
  fontPairing: FontPairingOption;
  avatarStyle: AvatarStyleOption;
  sectionVisibility: BuilderSectionVisibility;
  conversationUrl?: string;
  bookingUrl?: string;
}

export interface BuilderProfileState {
  id?: string;
  subdomain: string;
  name: string;
  headline: string;
  bio: string;
  role: string;
  company: string;
  avatarUrl: string;
  email: string;
  showEmail: boolean;
  location: string;
  timezone: string;
  availabilityBadge: string;
  links: BuilderLink[];
  proofPoints: BuilderProofPoint[];
  openTo: string[];
  visibility: ProfileVisibilityMode;
  customDomain: string | null;
  customDomainVerifiedAt: string | null;
  version?: number;
  theme: BuilderTheme;
}

export interface BuilderSaveError {
  status: number;
  code?: string;
  message: string;
  upgradeUrl?: string;
}

export const DEFAULT_SECTION_VISIBILITY: BuilderSectionVisibility = {
  proofs: true,
  openTo: true,
  activity: true,
  contactCta: true,
  footerBadge: true,
};

export function createEmptyBuilderProfile(): BuilderProfileState {
  return {
    subdomain: '',
    name: '',
    headline: '',
    bio: '',
    role: '',
    company: '',
    avatarUrl: '',
    email: '',
    showEmail: false,
    location: '',
    timezone: '',
    availabilityBadge: '',
    links: [],
    proofPoints: [],
    openTo: [],
    visibility: 'public',
    customDomain: null,
    customDomainVerifiedAt: null,
    theme: {
      template: DEFAULT_TEMPLATE_ID,
      preset: 'minimal',
      accentColor: '#2563EB',
      colorMode: 'auto',
      fontPairing: 'grotesk',
      avatarStyle: 'circle',
      sectionVisibility: { ...DEFAULT_SECTION_VISIBILITY },
      conversationUrl: '',
      bookingUrl: '',
    },
  };
}

/**
 * Normalizes both `/api/profile` GET (`{ ...profile }`) and POST (`{ profile }`) payloads
 * into a complete `BuilderProfileState`.
 */
export function normalizeLoadedProfile(rawPayload: unknown): BuilderProfileState | null {
  if (!rawPayload || typeof rawPayload !== 'object') return null;
  const envelope = rawPayload as Record<string, unknown>;
  const raw =
    envelope.profile && typeof envelope.profile === 'object'
      ? (envelope.profile as Record<string, unknown>)
      : envelope.id
        ? envelope
        : null;

  if (!raw) return null;

  const rawTheme = (raw.theme && typeof raw.theme === 'object' ? raw.theme : {}) as Record<string, unknown>;
  const rawVis = (rawTheme.sectionVisibility && typeof rawTheme.sectionVisibility === 'object'
    ? rawTheme.sectionVisibility
    : {}) as Record<string, unknown>;

  const rawLinks = Array.isArray(raw.links) ? raw.links : [];
  const links: BuilderLink[] = rawLinks.map((item: any, idx: number) => ({
    id: String(item?.id || `link-${idx}-${Date.now()}`),
    label: String(item?.label || ''),
    url: String(item?.url || ''),
    icon: item?.icon ? String(item.icon) : null,
    type: item?.type ? String(item.type) : undefined,
    category: item?.category,
    isPrimary: Boolean(item?.isPrimary),
    badge: typeof item?.badge === 'string' ? item.badge : undefined,
    clicks: typeof item?.clicks === 'number' ? item.clicks : 0,
    order: typeof item?.order === 'number' ? item.order : idx,
    isVisible: item?.isVisible !== false,
  }));

  const rawProofs = Array.isArray(raw.proofPoints)
    ? raw.proofPoints
    : Array.isArray(raw.proofs)
      ? raw.proofs
      : [];
  const proofPoints: BuilderProofPoint[] = rawProofs.map((p: any, idx: number) => ({
    id: p?.id ? String(p.id) : `proof-${idx}`,
    type: String(p?.type || p?.context || 'metric'),
    value: String(p?.value || p?.metric || ''),
    url: p?.url ? String(p.url) : '',
  }));

  const visibility: ProfileVisibilityMode =
    raw.visibility === 'private' || raw.visibility === 'unlisted' || raw.visibility === 'public'
      ? raw.visibility
      : 'public';

  const colorMode: ColorModeOption =
    rawTheme.colorMode === 'light' || rawTheme.colorMode === 'dark' || rawTheme.colorMode === 'auto'
      ? rawTheme.colorMode
      : 'auto';

  const fontPairing: FontPairingOption =
    rawTheme.fontPairing === 'editorial' ||
    rawTheme.fontPairing === 'grotesk' ||
    rawTheme.fontPairing === 'mono' ||
    rawTheme.fontPairing === 'classic'
      ? rawTheme.fontPairing
      : 'grotesk';

  const avatarStyle: AvatarStyleOption =
    rawTheme.avatarStyle === 'circle' || rawTheme.avatarStyle === 'rounded' || rawTheme.avatarStyle === 'square'
      ? rawTheme.avatarStyle
      : 'circle';

  const subdomainRaw = typeof raw.subdomain === 'string' ? raw.subdomain : '';

  return {
    id: typeof raw.id === 'string' ? raw.id : undefined,
    subdomain: subdomainRaw,
    name: typeof raw.name === 'string' ? raw.name : '',
    headline: typeof raw.headline === 'string' ? raw.headline : '',
    bio: typeof raw.bio === 'string' ? raw.bio : '',
    role: typeof raw.role === 'string' ? raw.role : '',
    company: typeof raw.company === 'string' ? raw.company : '',
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : '',
    email: typeof raw.email === 'string' ? raw.email : typeof envelope.email === 'string' ? envelope.email : '',
    showEmail: Boolean(raw.showEmail),
    location: typeof raw.location === 'string' ? raw.location : typeof rawTheme.location === 'string' ? rawTheme.location : '',
    timezone: typeof raw.timezone === 'string' ? raw.timezone : typeof rawTheme.timezone === 'string' ? rawTheme.timezone : '',
    availabilityBadge:
      typeof raw.availabilityBadge === 'string'
        ? raw.availabilityBadge
        : typeof rawTheme.availabilityBadge === 'string'
          ? rawTheme.availabilityBadge
          : '',
    links,
    proofPoints,
    openTo: Array.isArray(raw.openTo) ? raw.openTo.filter((x): x is string => typeof x === 'string') : [],
    visibility,
    customDomain: typeof raw.customDomain === 'string' ? raw.customDomain : null,
    customDomainVerifiedAt: typeof raw.customDomainVerifiedAt === 'string' ? raw.customDomainVerifiedAt : null,
    version: typeof raw.version === 'number' ? raw.version : undefined,
    theme: {
      template: normalizeTemplateId(typeof rawTheme.template === 'string' ? rawTheme.template : DEFAULT_TEMPLATE_ID),
      preset: typeof rawTheme.preset === 'string' ? rawTheme.preset : 'minimal',
      accentColor: typeof rawTheme.accentColor === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rawTheme.accentColor)
        ? rawTheme.accentColor
        : '#2563EB',
      colorMode,
      fontPairing,
      avatarStyle,
      sectionVisibility: {
        proofs: rawVis.proofs !== false,
        openTo: rawVis.openTo !== false,
        activity: rawVis.activity !== false,
        contactCta: rawVis.contactCta !== false,
        footerBadge: rawVis.footerBadge !== false,
      },
      conversationUrl: typeof rawTheme.conversationUrl === 'string' ? rawTheme.conversationUrl : '',
      bookingUrl: typeof rawTheme.bookingUrl === 'string' ? rawTheme.bookingUrl : '',
    },
  };
}

/**
 * Builds a clean `POST /api/profile` payload aligned strictly with `ProfileMutationSchema`.
 */
export function buildProfileSavePayload(
  profile: BuilderProfileState,
  claimedSubdomain: string
): Record<string, unknown> {
  const validLinks = profile.links
    .filter((l) => l.label.trim().length > 0 && /^(https?:\/\/|mailto:)/i.test(l.url.trim()))
    .map((l, idx) => ({
      id: l.id || `link-${idx}`,
      label: l.label.trim().slice(0, 100),
      url: l.url.trim().slice(0, 2048),
      ...(l.type ? { type: l.type } : {}),
      icon: l.icon || null,
      ...(l.category ? { category: l.category } : {}),
      isPrimary: Boolean(l.isPrimary),
      ...(l.badge?.trim() ? { badge: l.badge.trim().slice(0, 32) } : {}),
      isVisible: l.isVisible !== false,
      order: idx,
      clicks: typeof l.clicks === 'number' ? l.clicks : 0,
    }));

  const validProofs = profile.proofPoints
    .filter((p) => p.value.trim().length > 0)
    .map((p, idx) => ({
      id: p.id || `proof-${idx}`,
      type: p.type.trim() || 'metric',
      value: p.value.trim(),
      ...(p.url && /^https?:\/\//i.test(p.url.trim()) ? { url: p.url.trim() } : {}),
    }));

  return {
    ...(claimedSubdomain ? { subdomain: claimedSubdomain } : {}),
    name: profile.name,
    headline: profile.headline,
    bio: profile.bio,
    role: profile.role,
    company: profile.company,
    avatarUrl: profile.avatarUrl && /^https?:\/\//i.test(profile.avatarUrl.trim()) ? profile.avatarUrl.trim() : null,
    email: profile.email.trim() ? profile.email.trim() : null,
    showEmail: Boolean(profile.showEmail),
    location: profile.location,
    timezone: profile.timezone,
    availabilityBadge: profile.availabilityBadge,
    links: validLinks,
    proofPoints: validProofs,
    openTo: profile.openTo,
    visibility: profile.visibility,
    ...(typeof profile.version === 'number' ? { version: profile.version } : {}),
    theme: {
      template: normalizeTemplateId(profile.theme.template || DEFAULT_TEMPLATE_ID),
      preset: profile.theme.preset || 'minimal',
      accentColor: profile.theme.accentColor || '#2563EB',
      colorMode: profile.theme.colorMode || 'auto',
      fontPairing: profile.theme.fontPairing || 'grotesk',
      avatarStyle: profile.theme.avatarStyle || 'circle',
      sectionVisibility: {
        proofs: profile.theme.sectionVisibility.proofs,
        openTo: profile.theme.sectionVisibility.openTo,
        activity: profile.theme.sectionVisibility.activity,
        contactCta: profile.theme.sectionVisibility.contactCta,
        footerBadge: profile.theme.sectionVisibility.footerBadge,
      },
      conversationUrl: profile.theme.conversationUrl?.trim() || '',
      bookingUrl: profile.theme.bookingUrl?.trim() || '',
    },
  };
}

/**
 * Converts builder state into `PublicProfile` props for `<ProfilePreview />`.
 */
export function toPreviewPublicProfile(
  profile: BuilderProfileState,
  claimedSubdomain: string
): PublicProfile & Record<string, unknown> {
  return {
    id: profile.id || 'preview',
    subdomain: claimedSubdomain || profile.subdomain || 'you',
    name: profile.name || 'Your Name',
    headline: profile.headline || 'Creator, Builder & Strategist',
    bio: profile.bio || '',
    role: profile.role || '',
    company: profile.company || '',
    avatarUrl: profile.avatarUrl || '',
    email: profile.email || '',
    showEmail: profile.showEmail,
    location: profile.location || '',
    timezone: profile.timezone || '',
    availabilityBadge: profile.availabilityBadge || '',
    bookingUrl: profile.theme.bookingUrl || '',
    conversationUrl: profile.theme.conversationUrl || '',
    links: profile.links,
    proofPoints: profile.proofPoints,
    proofs: profile.proofPoints.map((p, idx) => ({
      id: p.id || `proof-${idx}`,
      type: 'metric' as const,
      title: p.type || 'Highlight',
      value: p.value,
      description: null,
      icon: null,
      order: idx,
      url: p.url,
    })),
    openTo: profile.openTo,
    socialHandles: {},
    seo: {
      title: profile.name || 'Unool Profile',
      description: profile.headline || profile.bio || '',
      image: profile.avatarUrl || null,
    },
    theme: {
      template: profile.theme.template,
      preset: profile.theme.preset,
      accentColor: profile.theme.accentColor,
      colorMode: profile.theme.colorMode,
      fontPairing: profile.theme.fontPairing,
      avatarStyle: profile.theme.avatarStyle,
      sectionVisibility: profile.theme.sectionVisibility,
      bookingUrl: profile.theme.bookingUrl,
      conversationUrl: profile.theme.conversationUrl,
      customCss: null,
    } as unknown as PublicProfile['theme'],
  };
}

export function resolveBuilderTab(rawTab: string | null): BuilderTabId {
  if (!rawTab) return 'identity';
  const normalized = rawTab.toLowerCase();
  if (normalized === 'links' || normalized === 'proof') return 'links';
  if (normalized === 'design' || normalized === 'templates' || normalized === 'template') return 'design';
  if (normalized === 'domain' || normalized === 'privacy' || normalized === 'analytics' || normalized === 'leads') {
    return 'domain';
  }
  return 'identity';
}

