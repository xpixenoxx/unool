import type { VoiceFingerprint } from '@/lib/config/studioOnboarding';

export interface ProfileLink {
  id?: string;
  label: string;
  url: string;
  type?: 'website' | 'linkedin' | 'github' | 'twitter' | 'calendly' | 'other' | string;
  icon?: string;
  category?: 'primary' | 'work' | 'social' | 'writing' | 'resource' | 'other';
  isPrimary?: boolean;
  badge?: string;
}

export interface ProofPoint {
  id?: string;
  type: 'metric' | 'customer' | 'press' | 'product' | 'team' | 'funding' | string;
  value: string;
  url?: string;
}

export interface SectionVisibilityConfig {
  proofs?: boolean;
  openTo?: boolean;
  activity?: boolean;
  contactCta?: boolean;
  footerBadge?: boolean;
}

export interface ProfileTheme {
  preset?: string;
  template?: string;
  primaryColor?: string;
  accentColor?: string;
  font?: string;
  colorMode?: 'auto' | 'light' | 'dark';
  fontPairing?: 'editorial' | 'grotesk' | 'mono' | 'classic';
  avatarStyle?: 'circle' | 'rounded' | 'square';
  sectionVisibility?: SectionVisibilityConfig;
  conversationUrl?: string;
  bookingUrl?: string;
  location?: string;
  timezone?: string;
  availabilityBadge?: string;
  showHeroCta?: boolean;
  customCss?: string | null;
  [key: string]: unknown;
}

export interface ProfileViewer {
  id: string;
  profileId: string;
  viewerUserId: string;
  createdAt: Date;
  email?: string;
  fullName?: string;
}

export interface OnboardingAnswers {
  persona: string;
  focus: string;
  audience: string[];
  tone: string[];
  custom?: Record<string, string>;
}

export interface StudioProfile {
  role: string;
  businessStage?: string;
  businessDomain?: string;
  workInterests?: string;
  doing: string;
  audience: string;
  tone: string;
  style: string;
  interests: string[];
  completedAt?: string;
  voiceFingerprint?: VoiceFingerprint | null;
}

export interface ProfileSeo {
  title?: string;
  description?: string;
  image?: string | null;
}

export interface Profile {
  id: string;
  workspaceId: string;
  userId: string;
  subdomain: string | null;
  name: string | null;
  headline: string | null;
  bio: string | null;
  role: string | null;
  company: string | null;
  avatarUrl: string | null;
  email?: string | null;
  showEmail?: boolean;
  location?: string | null;
  timezone?: string | null;
  availabilityBadge?: string | null;
  links: ProfileLink[];
  proofPoints: ProofPoint[];
  theme: ProfileTheme;
  socialHandles?: Record<string, string>;
  seo?: ProfileSeo;
  customDomain?: string | null;
  customDomainVerifiedAt?: Date | null;
  customDomainVerificationToken?: string | null;
  sourceUrl: string | null;
  extractionPromptVersion: string | null;
  version: number;
  visibility: 'public' | 'private' | 'unlisted';
  openTo: string[];
  onboardingCompleted?: boolean;
  onboardingAnswers?: OnboardingAnswers | null;
  studioProfile?: StudioProfile | null;
  authorizedViewers?: ProfileViewer[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileInput {
  workspaceId: string;
  userId: string;
  subdomain?: string;
  name?: string;
  headline?: string;
  bio?: string;
  role?: string;
  company?: string;
  avatarUrl?: string | null;
  email?: string | null;
  showEmail?: boolean;
  location?: string | null;
  timezone?: string | null;
  availabilityBadge?: string | null;
  links?: ProfileLink[];
  proofPoints?: ProofPoint[];
  theme?: ProfileTheme;
  socialHandles?: Record<string, string>;
  seo?: ProfileSeo;
  sourceUrl?: string;
  extractionPromptVersion?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  openTo?: string[];
  onboardingCompleted?: boolean;
  onboardingAnswers?: OnboardingAnswers | null;
  studioProfile?: StudioProfile | null;
}

export interface UpdateProfileInput {
  name?: string;
  headline?: string;
  bio?: string;
  role?: string;
  company?: string;
  avatarUrl?: string | null;
  email?: string | null;
  showEmail?: boolean;
  location?: string | null;
  timezone?: string | null;
  availabilityBadge?: string | null;
  links?: ProfileLink[];
  proofPoints?: ProofPoint[];
  theme?: ProfileTheme;
  socialHandles?: Record<string, string>;
  seo?: ProfileSeo;
  subdomain?: string | null;
  customDomain?: string | null;
  customDomainVerifiedAt?: Date | string | null;
  customDomainVerificationToken?: string | null;
  visibility?: 'public' | 'private' | 'unlisted';
  openTo?: string[];
  onboardingCompleted?: boolean;
  onboardingAnswers?: OnboardingAnswers | null;
  studioProfile?: StudioProfile | null;
}

export interface IProfileRepository {
  create(input: CreateProfileInput): Promise<Profile>;
  findById(id: string): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile | null>;
  findByWorkspaceId(workspaceId: string): Promise<Profile | null>;
  findDeletedByWorkspaceId?(workspaceId: string): Promise<Profile | null>;
  findBySubdomain(subdomain: string): Promise<Profile | null>;
  findByCustomDomain?(domain: string): Promise<Profile | null>;
  update(id: string, input: UpdateProfileInput, expectedVersion: number): Promise<Profile>;
  delete(id: string): Promise<void>;
  recover(id: string): Promise<void>;

  // Viewer management
  addViewer(profileId: string, viewerUserId: string): Promise<void>;
  removeViewer(profileId: string, viewerUserId: string): Promise<void>;
  getViewers(profileId: string): Promise<ProfileViewer[]>;
  isViewerAllowed?(profileId: string, viewerUserId: string): Promise<boolean>;
}
