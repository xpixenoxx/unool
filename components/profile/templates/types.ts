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
  category: 'essential' | 'professional' | 'creative' | 'technical' | 'social';
  intensity: 'minimal' | 'light' | 'standard' | 'bold' | 'max';
  preset: 'minimal' | 'corporate' | 'creative' | 'technical' | 'bold';
  description: string;
  tags: string[];
  thumbnail: string;
  features: TemplateFeatures;
}

export interface TemplateProps {
  profile: PublicProfile;
  accentColor?: string;
  isPreview?: boolean;
  onLinkClick?: (link: ProfileLink) => void;
}

export interface PublicProfile {
  id: string;
  subdomain: string;
  name: string;
  headline: string;
  bio: string;
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
  seo: {
    title: string;
    description: string;
    image: string | null;
  };
}

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  clicks: number;
  order: number;
  isVisible: boolean;
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