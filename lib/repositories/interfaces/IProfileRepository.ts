export interface ProfileLink {
  label: string;
  url: string;
  type: 'website' | 'linkedin' | 'github' | 'twitter' | 'calendly' | 'other';
}

export interface ProofPoint {
  type: 'metric' | 'customer' | 'press' | 'product' | 'team' | 'funding';
  value: string;
  url?: string;
}

export interface ProfileTheme {
  preset: 'minimal' | 'bold' | 'corporate' | 'creative' | 'technical';
  primaryColor?: string;
  font?: string;
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
}

export interface IProfileRepository {
  create(input: CreateProfileInput): Promise<Profile>;
  findById(id: string): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile | null>;
  findBySubdomain(subdomain: string): Promise<Profile | null>;
  update(id: string, input: UpdateProfileInput, expectedVersion: number): Promise<Profile>;
  delete(id: string): Promise<void>;
}