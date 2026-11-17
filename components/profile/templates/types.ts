export interface TemplateFeatures {
  has3DBackground: boolean;
  hasParallax: boolean;
  hasTiltCards: boolean;
  hasMagneticHover: boolean;
  hasAnimatedOrbs: boolean;
  hasGradientText: boolean;
  supportsVideoBackground: boolean;
  maxLinks: number;
  maxProofPoints: number;
  // Performance budgets
  maxBundleSizeKB?: number;
  maxRenderMs?: number;
}

export interface TemplateMeta {
  id: string;
  name: string;
  category: 'individual' | 'startup' | 'agency' | 'entrepreneur' | 'influencer';
  intensity: 'minimal' | 'light' | 'standard' | 'bold' | 'max';
  preset: 'minimal' | 'corporate' | 'creative' | 'technical' | 'bold';
  description: string;
  tagline?: string;
  icon?: string;
  tags: string[];
  thumbnail: string;
  features: TemplateFeatures & {
    performanceBudget?: 'ultra-light' | 'light' | 'medium' | 'heavy';
  };
  persona?: 'lover' | 'lone' | 'energy' | 'rebellion' | 'vision' | 'human' | 'the-studio' | 'the-machine' | 'the-club' | 'the-builder' | 'the-visionary' | 'the-hustler' | 'the-aesthete' | 'the-creator' | 'the-voice' | 'the-stack' | 'the-bookshelf' | 'the-cube' | 'the-monolith' | 'the-metro' | 'the-noren' | 'the-desktop' | 'the-calendar' | 'the-bento';
}

export interface TemplateProps {
  profile: PublicProfile;
  accentColor?: string;
  isPreview?: boolean;
  onLinkClick?: (link: ProfileLink) => void;
  templateId?: string;
}

export interface PublicProfile {
  id: string;
  subdomain: string;
  name: string;
  headline: string;
  bio: string;
  role?: string;
  company?: string;
  avatarUrl: string;
  links: ProfileLink[];
  proofs: ProfileProof[];
  theme: {
    template: string;
    preset: string;
    accentColor: string;
    customCss: string | null;
  };
  socialHandles: Record<string, string>;
  openTo?: string[];
  seo: {
    title: string;
    description: string;
    image: string | null;
  };
  // Additional fields used by persona templates
  email?: string;
  showEmail?: boolean;
  location?: string;
  timezone?: string | null;
  availabilityBadge?: string | null;
  bookingUrl?: string | null;
  conversationUrl?: string | null;
  recentActivity?: any[];
  autoScroll?: boolean;
  metrics?: any[];
  proofPoints?: any[];
  handle?: string;
  tagline?: string;
  manifesto?: string;
  availability?: string;
  calendlyUrl?: string;
  // Club template specific fields
  projects?: ProfileProject[];
  activity?: any[];
  avatar?: string;
  description?: string;
}

export interface ProfileProject {
  id?: string;
  title: string;
  category?: string;
  description?: string;
  coverImage?: string;
  images?: string[];
  blurDataURL?: string;
  metrics?: Record<string, any>;
  links?: Array<{ label: string; url: string }>;
  tags?: string[];
}

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  clicks: number;
  order: number;
  isVisible: boolean;
  type?: string;
  category?: 'primary' | 'work' | 'social' | 'writing' | 'resource' | 'other';
  isPrimary?: boolean;
  badge?: string;
  // Club template specific fields
  platform?: string;
  isPrimaryAction?: boolean;
}

export interface ProfileProof {
  id: string;
  type: 'metric' | 'testimonial' | 'badge' | 'certification';
  title: string;
  value: string;
  description: string | null;
  icon: string | null;
  order: number;
  url?: string;
  metric?: string;
  context?: string;
}

export type ProfileColorMode = 'auto' | 'light' | 'dark';
export type ProfileFontPairing = 'editorial' | 'grotesk' | 'mono' | 'classic';
export type ProfileAvatarStyle = 'circle' | 'rounded' | 'square';

export interface ProfileSectionVisibility {
  proofs?: boolean;
  openTo?: boolean;
  activity?: boolean;
  contactCta?: boolean;
  footerBadge?: boolean;
}

export interface NormalizedSectionVisibility extends Required<ProfileSectionVisibility> {
  proof: boolean;
  recentActivity: boolean;
  contact: boolean;
  bio: boolean;
  links: boolean;
}

export interface NormalizedProfileProof {
  id: string;
  label: string;
  title?: string;
  value: string;
  description?: string | null;
  url?: string;
}

export interface NormalizedRecentActivity {
  id?: string;
  content: string;
  publishedAt?: string | null;
  platforms?: Array<{
    platform: string;
    url: string;
    adaptedContent?: string;
  }>;
}

export interface ExtendedPublicProfile extends Omit<PublicProfile, 'location' | 'recentActivity' | 'activity'> {
  email?: string;
  showEmail?: boolean;
  location?: string | null;
  timezone?: string | null;
  availabilityBadge?: string | null;
  open_to?: string[];
  proofPoints?: ProfileProof[];
  proof_points?: ProfileProof[];
  recentActivity?: NormalizedRecentActivity | null;
  activity?: NormalizedRecentActivity | null;
  hideBadge?: boolean;
  whiteLabel?: boolean;
  features?: {
    badge_removal?: boolean;
    white_label?: boolean;
  };
  plan?: {
    badge_removal?: boolean;
  };
}