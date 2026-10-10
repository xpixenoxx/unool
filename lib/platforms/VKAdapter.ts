import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

export class VKAdapter implements PlatformAdapter {
  readonly platform = 'vk' as const;

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
    throw new Error('Using custom connection for VK (Webhook logic)');
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
      platformUserId: communityName || 'vk_community',
      username: communityName || 'vk',
      displayName: communityName || 'VK Community',
      profileUrl: `https://vk.com/${communityName || ''}`,
      avatarUrl: '',
    };
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const { webhookUrl, communityName } = this.parseToken(tokenData);

    if (!webhookUrl) {
      throw new Error('VK Webhook URL is required to publish.');
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
        throw new Error(`VK webhook request failed: ${res.statusText}`);
      }

      const messageId = `vk-${Date.now()}`;
      
      return {
        platformPostId: messageId,
        platformUrl: `https://vk.com/${communityName || ''}`, 
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('Failed to post to VK webhook', { error: err instanceof Error ? err : new Error(String(err)) });
      throw new Error('Failed to post to VK webhook');
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    logger.info('VK webhook delete requested', { platformPostId });
  }

  async getEngagement(_tokenData: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }

  private parseToken(tokenData: string): { webhookUrl: string; communityName: string } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid VK token format');
    }
  }
}

export const vkAdapter = new VKAdapter();
