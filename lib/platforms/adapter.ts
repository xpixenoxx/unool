export interface PlatformAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
}

export interface UserProfile {
  platformUserId: string;
  username: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
}

export interface PublishInput {
  content: string;
  mediaUrls?: string[];
  firstComment?: string;
}

export interface PublishResult {
  platformPostId: string;
  platformUrl: string;
  publishedAt: Date;
}

export interface PlatformAdapter {
  readonly platform: 'linkedin' | 'x' | 'threads' | 'manual';
  readonly authConfig: PlatformAuthConfig;

  getAuthUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<TokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
  getUserProfile(accessToken: string): Promise<UserProfile>;
  publish(accessToken: string, input: PublishInput): Promise<PublishResult>;
  deletePost(accessToken: string, platformPostId: string): Promise<void>;
  getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>>;
}

export const platformAdapters: Record<string, PlatformAdapter> = {};