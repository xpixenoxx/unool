import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

export class WhopAdapter implements PlatformAdapter {
  readonly platform = 'whop' as const;

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
    throw new Error('Using custom connection for Whop (Webhook logic)');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { webhookUrl, communityName } = this.parseToken(tokenData);

    return {
      platformUserId: communityName || 'whop_community',
      username: communityName || 'whop',
      displayName: communityName || 'Whop Community',
      profileUrl: `https://whop.com/`,
      avatarUrl: '',
    };
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const { webhookUrl, communityName } = this.parseToken(tokenData);

    if (!webhookUrl) {
      throw new Error('Whop Webhook URL is required to publish.');
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
        throw new Error(`Whop webhook request failed: ${res.statusText}`);
      }

      const messageId = `whop-${Date.now()}`;
      
      return {
        platformPostId: messageId,
        platformUrl: `https://whop.com/`, 
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('Failed to post to Whop webhook', { error: err instanceof Error ? err : new Error(String(err)) });
      throw new Error('Failed to post to Whop webhook');
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    logger.info('Whop webhook delete requested', { platformPostId });
  }

  async getEngagement(_tokenData: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }

  private parseToken(tokenData: string): { webhookUrl: string; communityName: string } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid Whop token format');
    }
  }
}

export const whopAdapter = new WhopAdapter();
