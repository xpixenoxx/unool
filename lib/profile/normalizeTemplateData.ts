import type {
  ExtendedPublicProfile,
  NormalizedProfileProof,
  NormalizedRecentActivity,
  ProfileAvatarStyle,
  ProfileColorMode,
  ProfileFontPairing,
  ProfileLink,
  NormalizedSectionVisibility,
  PublicProfile,
} from '@/components/profile/templates/types';
import { sanitizeHref } from '@/lib/validation/profileSchemas';
import { normalizeHex } from '@/lib/profile/contrast';

export interface NormalizedTemplateProfile {
  raw: ExtendedPublicProfile;
  subdomain: string;
  name: string;
  handle: string;
  headline: string;
  bio: string;
  role: string;
  company: string;
  avatarUrl: string | null;
  initials: string;
  location: string;
  timezone: string;
  availabilityBadge: string;
  email: string | null;
  showEmail: boolean;
  bookingUrl: string | null;
  conversationUrl: string | null;
  links: ProfileLink[];
  proofs: NormalizedProfileProof[];
  openTo: string[];
  recentActivity: NormalizedRecentActivity | null;
  accentColor: string;
  colorMode: ProfileColorMode;
  fontPairing: ProfileFontPairing;
  avatarStyle: ProfileAvatarStyle;
  sectionVisibility: NormalizedSectionVisibility;
  isMinimalState: boolean;
  hasContactChannel: boolean;
  whiteLabel: boolean;
}

export function normalizeTemplateProfile(
  input: PublicProfile | ExtendedPublicProfile | null | undefined,
  accentOverride?: string,
  defaultAccent = '#2563EB'
): NormalizedTemplateProfile {
  const raw = (input || {}) as ExtendedPublicProfile;
  const theme = (raw.theme || {}) as Record<string, unknown>;

  const subdomain = typeof raw.subdomain === 'string' ? raw.subdomain.trim() : '';
  const name = typeof raw.name === 'string' && raw.name.trim()
    ? raw.name.trim()
    : subdomain || 'Creator';
  const headline = typeof raw.headline === 'string' ? raw.headline.trim() : '';
  const bio = typeof raw.bio === 'string' ? raw.bio.trim() : '';
  const role = typeof raw.role === 'string' ? raw.role.trim() : '';
  const company = typeof raw.company === 'string' ? raw.company.trim() : '';

  const rawAvatar =
    (raw as unknown as { avatarUrl?: string }).avatarUrl ||
    (raw as unknown as { avatar_url?: string }).avatar_url ||
    (raw as unknown as { avatar?: string }).avatar;
  const avatarUrl = sanitizeHref(rawAvatar, { allowMailto: false });

  const words = name.split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();

  const rawLinks = Array.isArray(raw.links) ? raw.links : [];
  const links: ProfileLink[] = [];
  rawLinks.forEach((item, index) => {
    if (!item || item.isVisible === false) return;
    const safeUrl = sanitizeHref(item.url, { allowMailto: true });
    if (!safeUrl) return;
    const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim() : safeUrl;
    links.push({
      id: item.id || `link-${index}`,
      label,
      url: safeUrl,
      icon: item.icon ?? null,
      clicks: typeof item.clicks === 'number' ? item.clicks : 0,
      order: typeof item.order === 'number' ? item.order : index,
      isVisible: true,
      type: item.type,
      category: item.category,
      isPrimary: Boolean(item.isPrimary),
      badge: typeof item.badge === 'string' ? item.badge.trim() : undefined,
      platform: item.platform,
      isPrimaryAction: item.isPrimaryAction,
    });
  });
  links.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const rawProofs =
    (Array.isArray(raw.proofPoints) && raw.proofPoints) ||
    (Array.isArray(raw.proof_points) && raw.proof_points) ||
    (Array.isArray(raw.proofs) && raw.proofs) ||
    [];

  const proofs: NormalizedProfileProof[] = [];
  rawProofs.forEach((p, index) => {
    if (!p) return;
    const rawAny = p as unknown as Record<string, unknown>;
    const value = String(rawAny.value ?? rawAny.metric ?? '').trim();
    if (!value) return;
    const label = String(rawAny.type ?? rawAny.context ?? rawAny.title ?? 'Highlight').trim();
    const url = sanitizeHref(rawAny.url, { allowMailto: false }) ?? undefined;
    const desc =
      typeof rawAny.description === 'string' && rawAny.description.trim()
        ? rawAny.description.trim()
        : typeof rawAny.context === 'string' && rawAny.context.trim()
          ? rawAny.context.trim()
          : null;
    proofs.push({
      id: String(rawAny.id || `proof-${index}`),
      label: label || 'Highlight',
      title: label || 'Highlight',
      value,
      description: desc,
      url,
    });
  });

  const openTo = Array.isArray(raw.openTo)
    ? raw.openTo.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : Array.isArray(raw.open_to)
      ? raw.open_to.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : [];

  const rawRecentCandidate = raw.recentActivity ?? raw.activity ?? null;
  const firstRecent = Array.isArray(rawRecentCandidate) ? rawRecentCandidate[0] : rawRecentCandidate;
  const rawRecent =
    firstRecent && typeof firstRecent === 'object'
      ? (firstRecent as NormalizedRecentActivity)
      : null;
  const recentActivity: NormalizedRecentActivity | null = rawRecent
    ? {
        ...rawRecent,
        id: rawRecent.id || 'recent-activity',
      }
    : null;

  const location = String(raw.location || theme.location || '').trim();
  const timezone = String(raw.timezone || theme.timezone || '').trim();
  const availabilityBadge = String(raw.availabilityBadge || theme.availabilityBadge || '').trim();

  const rawAccent =
    (accentOverride && accentOverride.startsWith('#') ? accentOverride : undefined) ||
    (typeof theme.accentColor === 'string' ? theme.accentColor : undefined) ||
    (typeof theme.primaryColor === 'string' ? theme.primaryColor : undefined) ||
    defaultAccent;
  const accentColor = normalizeHex(rawAccent, defaultAccent);

  const colorMode: ProfileColorMode =
    theme.colorMode === 'light' || theme.colorMode === 'dark' || theme.colorMode === 'auto'
      ? theme.colorMode
      : 'auto';

  const fontPairing: ProfileFontPairing =
    theme.fontPairing === 'editorial' ||
    theme.fontPairing === 'grotesk' ||
    theme.fontPairing === 'mono' ||
    theme.fontPairing === 'classic'
      ? theme.fontPairing
      : 'grotesk';

  const avatarStyle: ProfileAvatarStyle =
    theme.avatarStyle === 'circle' || theme.avatarStyle === 'rounded' || theme.avatarStyle === 'square'
      ? theme.avatarStyle
      : 'circle';

  const vis = (theme.sectionVisibility || {}) as Record<string, unknown>;
  const visProofs = vis.proofs !== false && vis.proof !== false;
  const visActivity = vis.activity !== false && vis.recentActivity !== false;
  const visContactCta = vis.contactCta !== false && vis.contact !== false;
  const visOpenTo = vis.openTo !== false;
  const visFooterBadge = vis.footerBadge !== false;
  const sectionVisibility: NormalizedSectionVisibility = {
    proofs: visProofs,
    proof: visProofs,
    openTo: visOpenTo,
    activity: visActivity,
    recentActivity: visActivity,
    contactCta: visContactCta,
    contact: visContactCta,
    footerBadge: visFooterBadge,
    bio: vis.bio !== false,
    links: vis.links !== false,
  };

  const bookingUrl = sanitizeHref(theme.bookingUrl, { allowMailto: false });
  const conversationUrl = sanitizeHref(theme.conversationUrl, { allowMailto: true });
  const showEmail = Boolean(raw.showEmail && raw.email);
  const email = showEmail && typeof raw.email === 'string' ? raw.email.trim() : null;

  const isMinimalState = !bio && links.length <= 1 && proofs.length === 0 && !recentActivity;
  const hasContactChannel = Boolean(subdomain || bookingUrl || conversationUrl || email);

  return {
    raw,
    subdomain,
    name,
    handle: subdomain ? `@${subdomain}` : '',
    headline,
    bio,
    role,
    company,
    avatarUrl,
    initials,
    location,
    timezone,
    availabilityBadge,
    email,
    showEmail,
    bookingUrl,
    conversationUrl,
    links,
    proofs,
    openTo,
    recentActivity,
    accentColor,
    colorMode,
    fontPairing,
    avatarStyle,
    sectionVisibility,
    isMinimalState,
    hasContactChannel,
    whiteLabel: Boolean(raw.whiteLabel || raw.features?.white_label),
  };
}
