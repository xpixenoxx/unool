import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

export class KickAdapter implements PlatformAdapter {
  readonly platform = 'kick' as const;

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
    throw new Error('Using custom connection for Kick (Webhook logic)');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { webhookUrl, channelName } = this.parseToken(tokenData);

    return {
      platformUserId: channelName || 'kick_channel',
      username: channelName || 'kick',
      displayName: channelName || 'Kick Channel',
      profileUrl: `https://kick.com/${channelName || ''}`,
      avatarUrl: '',
    };
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const { webhookUrl, channelName } = this.parseToken(tokenData);

    if (!webhookUrl) {
      throw new Error('Kick Webhook URL is required to publish.');
    }

    const payload: Record<string, unknown> = {
      content: input.content,
      channelName,
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
        throw new Error(`Kick webhook request failed: ${res.statusText}`);
      }

      const messageId = `kick-${Date.now()}`;
      
      return {
        platformPostId: messageId,
        platformUrl: `https://kick.com/${channelName || ''}`, 
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('Failed to post to Kick webhook', { error: err instanceof Error ? err : new Error(String(err)) });
      throw new Error('Failed to post to Kick webhook');
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    logger.info('Kick webhook delete requested', { platformPostId });
  }

  async getEngagement(_tokenData: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }

  private parseToken(tokenData: string): { webhookUrl: string; channelName: string } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid Kick token format');
    }
  }
}

export const kickAdapter = new KickAdapter();
