import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

export class TwitchAdapter implements PlatformAdapter {
  readonly platform = 'twitch' as const;

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
    throw new Error('Using custom connection for Twitch');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return { accessToken: _refreshToken, expiresIn: 0 };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { accessToken, clientId } = this.parseToken(tokenData);

    const res = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.data || !data.data[0]) {
      throw new Error(`Twitch auth failed: ${data.message || 'User not found'}`);
    }

    const user = data.data[0];
    return {
      platformUserId: user.id,
      username: user.login,
      displayName: user.display_name,
      avatarUrl: user.profile_image_url || '',
      profileUrl: `https://twitch.tv/${user.login}`,
    };
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const { accessToken, clientId } = this.parseToken(tokenData);
    
    // Get the broadcaster ID first
    const profile = await this.getUserProfile(tokenData);
    const broadcasterId = profile.platformUserId;

    let text = input.content;
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      text += ' ' + input.mediaUrls.join(' ');
    }

    const postRes = await fetch('https://api.twitch.tv/helix/chat/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcaster_id: broadcasterId,
        sender_id: broadcasterId,
        message: text,
      }),
    });

    const postData = await postRes.json();
    if (!postRes.ok) {
      throw new Error(`Twitch publish failed: ${postData.message}`);
    }

    return {
      platformPostId: postData.data?.[0]?.message_id || `twitch-${Date.now()}`,
      platformUrl: profile.profileUrl || '', 
      publishedAt: new Date(),
    };
  }

  async deletePost(_tokenData: string, _platformPostId: string): Promise<void> {
  }

  async getEngagement(_tokenData: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }

  private parseToken(tokenData: string): { accessToken: string; clientId: string } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid Twitch token format');
    }
  }
}

export const twitchAdapter = new TwitchAdapter();
