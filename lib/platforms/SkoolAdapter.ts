import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

export class SkoolAdapter implements PlatformAdapter {
  readonly platform = 'skool' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [],
  };

  getAuthUrl(_state: string): string {
    return '';
  }

  async exchangeCodeForToken(_code: string): Promise<TokenResponse> {
    throw new Error('Using custom connection for Skool (Webhook logic)');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { webhookUrl, communityName } = this.parseToken(tokenData);

    // No official GET api to fetch user profile, return simulated based on webhook info
    return {
      platformUserId: communityName || 'skool_community',
      username: communityName || 'skool',
      displayName: communityName || 'Skool Community',
      profileUrl: `https://www.skool.com/`,
      avatarUrl: '',
    };
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const { webhookUrl, communityName } = this.parseToken(tokenData);

    if (!webhookUrl) {
      throw new Error('Skool Webhook URL is required to publish.');
    }

    const payload: Record<string, unknown> = {
      content: input.content,
      communityName,
    };

    if (input.mediaUrls && input.mediaUrls.length > 0) {
      payload.mediaUrls = input.mediaUrls;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Skool webhook request failed: ${res.statusText}`);
      }

      const messageId = `skool-${Date.now()}`;
      
      return {
        platformPostId: messageId,
        platformUrl: `https://www.skool.com/`, // Ideally wait/listen for specific post url, but it's one-way 
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('Failed to post to Skool webhook', { error: err instanceof Error ? err : new Error(String(err)) });
      throw new Error('Failed to post to Skool webhook');
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    // Cannot delete standard webhooks generally, just log it.
    logger.info('Skool webhook delete requested', { platformPostId });
  }

  async getEngagement(_tokenData: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }

  private parseToken(tokenData: string): { webhookUrl: string; communityName: string } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid Skool token format');
    }
  }
}

export const skoolAdapter = new SkoolAdapter();
