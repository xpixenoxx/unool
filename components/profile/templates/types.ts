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
  persona?: 'lover' | 'lone' | 'energy' | 'rebellion' | 'vision' | 'human' | 'the-studio' | 'the-machine' | 'the-club' | 'the-builder' | 'the-visionary' | 'the-hustler' | 'the-aesthete' | 'the-creator' | 'the-voice';
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
  location?: string;
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
}