export interface ProfileLink {
  label: string;
  url: string;
  type: 'website' | 'linkedin' | 'github' | 'twitter' | 'calendly' | 'other' | string;
}

export interface ProofPoint {
  type: 'metric' | 'customer' | 'press' | 'product' | 'team' | 'funding' | string;
  value: string;
  url?: string;
}

export interface ProfileTheme {
  preset?: string;
  template?: string;
  primaryColor?: string;
  font?: string;
}

export interface ProfileViewer {
  id: string;
  profileId: string;
  viewerUserId: string;
  createdAt: Date;
  email?: string;
  fullName?: string;
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
  links: ProfileLink[];
  proofPoints: ProofPoint[];
  theme: ProfileTheme;
  sourceUrl: string | null;
  extractionPromptVersion: string | null;
  version: number;
  visibility: 'public' | 'private';
  authorizedViewers?: ProfileViewer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileInput {
  workspaceId: string;
  userId: string;
  subdomain?: string;
  sourceUrl?: string;
  extractionPromptVersion?: string;
}

export interface UpdateProfileInput {
  name?: string;
  headline?: string;
  bio?: string;
  role?: string;
  company?: string;
  links?: ProfileLink[];
  proofPoints?: ProofPoint[];
  theme?: ProfileTheme;
  subdomain?: string | null;
  visibility?: 'public' | 'private';
}

export interface IProfileRepository {
  create(input: CreateProfileInput): Promise<Profile>;
  findById(id: string): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile | null>;
  findBySubdomain(subdomain: string): Promise<Profile | null>;
  update(id: string, input: UpdateProfileInput, expectedVersion: number): Promise<Profile>;
  delete(id: string): Promise<void>;
  
  // Viewer management
  addViewer(profileId: string, viewerUserId: string): Promise<void>;
  removeViewer(profileId: string, viewerUserId: string): Promise<void>;
  getViewers(profileId: string): Promise<ProfileViewer[]>;
}