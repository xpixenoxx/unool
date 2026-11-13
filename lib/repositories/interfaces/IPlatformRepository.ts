export type Platform = 'linkedin' | 'x' | 'threads' | 'manual' | 'facebook' | 'instagram' | 'youtube' | 'pinterest' | 'bluesky' | 'reddit' | 'mastodon' | 'slack' | 'twitch' | 'telegram' | 'discord' | 'dribbble' | 'skool' | 'whop' | 'kick' | 'warpcast' | 'mewe' | 'nostr' | 'medium' | 'lemmy' | 'listmonk' | 'hashnode' | 'devto';

export interface PlatformConnection {
  id: string;
  workspaceId: string;
  userId: string | null;
  platform: Platform;
  platformUserId: string;
  username: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  expiresAt: Date | null;
  scopes: string[];
  status: PlatformConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
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
  userId?: string;
  platform: Platform;
  platformUserId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
  metadata?: Record<string, unknown>;
}

export interface IPlatformRepository {
  findById(id: string): Promise<PlatformConnection | null>;
  findByWorkspaceAndPlatform(workspaceId: string, platform: Platform): Promise<PlatformConnection | null>;
  findAllByWorkspaceAndPlatform?(workspaceId: string, platform: Platform): Promise<PlatformConnection[]>;
  findByWorkspacePlatformAndUser?(workspaceId: string, platform: Platform, platformUserId: string): Promise<PlatformConnection | null>;
  findByWorkspaceId(workspaceId: string): Promise<PlatformConnection[]>;
  create(input: CreatePlatformConnectionInput): Promise<PlatformConnection>;
  update(id: string, data: Partial<PlatformConnection>): Promise<PlatformConnection>;
  updateStatus(id: string, status: PlatformConnectionStatus): Promise<PlatformConnection>;
  disconnect(id: string): Promise<void>;
  delete(id: string): Promise<void>;

  // Platform posts
  createPlatformPost(input: CreatePlatformPostInput): Promise<PlatformPost>;
  findPlatformPostsByVariant(variantId: string): Promise<PlatformPost[]>;
  findPlatformPostsByVariantIds?(variantIds: string[]): Promise<PlatformPost[]>;
  findPlatformPostByPlatformPostId(platformPostId: string): Promise<PlatformPost | null>;
  updateEngagement(id: string, engagement: Record<string, unknown>): Promise<PlatformPost>;
}

export interface CreatePlatformPostInput {
  postVariantId: string;
  platformConnectionId: string;
  platformPostId: string;
  platformUrl?: string;
  engagement?: Record<string, unknown>;
}