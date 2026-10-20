import type {
  PublicProfile as BasePublicProfile,
  ProfileLink as BaseProfileLink,
  ProfileProof as BaseProfileProof,
  TemplateFeatures,
  TemplateMeta,
  TemplateProps,
} from '../types';

export type { TemplateFeatures, TemplateMeta, TemplateProps, BaseProfileProof as ProfileProof };

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

export interface ProfileProofPoint {
  id?: string;
  label: string;
  value: number | string;
  suffix?: string;
  icon?: string;
  description?: string;
}

export interface ProfileLink extends BaseProfileLink {
  platform?: string;
  isPrimaryAction?: boolean;
}

export interface PublicProfile extends Omit<BasePublicProfile, 'links' | 'openTo'> {
  handle?: string;
  tagline?: string;
  manifesto?: string;
  avatar?: string;
  availability?: string;
  email?: string;
  location?: string;
  calendlyUrl?: string;
  proofPoints?: ProfileProofPoint[];
  projects?: ProfileProject[];
  activity?: any[];
  links?: ProfileLink[];
  openTo?: any[];
}
