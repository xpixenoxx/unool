export interface PlatformConnection {
  id: string;
  workspaceId: string;
  platform: 'linkedin' | 'x' | 'threads';
  platformUserId: string;
  username: string | null;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  expiresAt: Date | null;
  scopes: string[];
  status: PlatformConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type PlatformConnectionStatus = 'connected' | 'expired' | 'revoked' | 'error';

export interface PlatformPost {
  id: string;
  postVariantId: string;
  platformConnectionId: string;
  platformPostId: string;
  platformUrl: string | null;
  engagement: Record<string, unknown>;
  createdAt: Date;
}

export interface CreatePlatformConnectionInput {
  workspaceId: string;
  platform: 'linkedin' | 'x' | 'threads';
  platformUserId: string;
  username?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
}

export interface IPlatformRepository {
  findById(id: string): Promise<PlatformConnection | null>;
  findByWorkspaceAndPlatform(workspaceId: string, platform: 'linkedin' | 'x' | 'threads'): Promise<PlatformConnection | null>;
  findByWorkspaceId(workspaceId: string): Promise<PlatformConnection[]>;
  create(input: CreatePlatformConnectionInput): Promise<PlatformConnection>;
  update(id: string, data: Partial<PlatformConnection>): Promise<PlatformConnection>;
  updateStatus(id: string, status: PlatformConnectionStatus): Promise<PlatformConnection>;
  delete(id: string): Promise<void>;

  // Platform posts
  createPlatformPost(input: CreatePlatformPostInput): Promise<PlatformPost>;
  findPlatformPostsByVariant(variantId: string): Promise<PlatformPost[]>;
  updateEngagement(id: string, engagement: Record<string, unknown>): Promise<PlatformPost>;
}

export interface CreatePlatformPostInput {
  postVariantId: string;
  platformConnectionId: string;
  platformPostId: string;
  platformUrl?: string;
  engagement?: Record<string, unknown>;
}