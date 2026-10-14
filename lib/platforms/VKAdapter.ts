import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

interface VKTokenPayload {
  accessToken?: string;
  userId?: number | string;
  webhookUrl?: string;
  communityName?: string;
}

export class VKAdapter implements PlatformAdapter {
  readonly platform = 'vk' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.VK_CLIENT_ID || process.env.VK_CLIENT_ID || '',
    clientSecret: config.VK_CLIENT_SECRET || process.env.VK_CLIENT_SECRET || '',
    redirectUri: config.VK_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: ['wall', 'photos', 'offline', 'groups'],
  };

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      response_type: 'code',
      display: 'page',
      scope: this.authConfig.scopes.join(','),
      state,
      v: '5.199',
    });
    return `https://oauth.vk.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      redirect_uri: this.authConfig.redirectUri,
      code,
    });

    const response = await fetch(`https://oauth.vk.com/access_token?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('VK token exchange failed', { status: response.status, errorText });
      throw new Error(`VK token exchange failed: ${errorText}`);
    }

    const data = await response.json();
    if (data.error) {
      logger.error('VK token exchange error', { error: data.error, errorDescription: data.error_description });
      throw new Error(`VK token exchange error: ${data.error_description || data.error}`);
    }

    const tokenPayload = JSON.stringify({
      accessToken: data.access_token,
      userId: data.user_id,
    });

    return {
      accessToken: tokenPayload,
      expiresIn: data.expires_in || 0,
      refreshToken: undefined, // offline scope provides non-expiring token
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const payload = this.parseToken(tokenData);

    // Fallback for custom webhook connection
    if (payload.webhookUrl) {
      return {
        platformUserId: payload.communityName || 'vk_community',
        username: payload.communityName || 'vk',
        displayName: payload.communityName || 'VK Community',
        profileUrl: `https://vk.com/${payload.communityName || ''}`,
        avatarUrl: '',
      };
    }

    if (!payload.accessToken) {
      throw new Error('VK access token is missing');
    }

    const userParams = new URLSearchParams({
      access_token: payload.accessToken,
      fields: 'photo_200,screen_name',
      v: '5.199',
    });

    if (payload.userId) {
      userParams.set('user_ids', String(payload.userId));
    }

    try {
      const res = await fetch(`https://api.vk.com/method/users.get?${userParams.toString()}`);
      if (!res.ok) {
        throw new Error(`VK users.get request failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        logger.error('VK users.get error', { error: data.error });
        throw new Error(`Failed to fetch VK profile: ${data.error.error_msg || JSON.stringify(data.error)}`);
      }

      const user = data.response?.[0];
      if (!user) {
        return {
          platformUserId: String(payload.userId || 'vk_user'),
          username: 'vk_user',
          displayName: 'VK User',
          profileUrl: `https://vk.com/id${payload.userId || ''}`,
          avatarUrl: '',
        };
      }

      const username = user.screen_name || `id${user.id}`;
      const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || username;

      return {
        platformUserId: String(user.id),
        username,
        displayName,
        profileUrl: `https://vk.com/${username}`,
        avatarUrl: user.photo_200 || '',
      };
    } catch (err) {
      logger.error('VK getUserProfile exception', { error: err instanceof Error ? err : new Error(String(err)) });
      throw err;
    }
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const payload = this.parseToken(tokenData);

    // Fallback for custom webhook connection
    if (payload.webhookUrl) {
      const webhookPayload: Record<string, unknown> = {
        content: input.content,
        communityName: payload.communityName,
      };

      if (input.mediaUrls && input.mediaUrls.length > 0) {
        webhookPayload.mediaUrls = input.mediaUrls;
      }

      const res = await fetch(payload.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      if (!res.ok) {
        throw new Error(`VK webhook request failed: ${res.statusText}`);
      }

      const messageId = `vk-${Date.now()}`;
      return {
        platformPostId: messageId,
        platformUrl: `https://vk.com/${payload.communityName || ''}`,
        publishedAt: new Date(),
      };
    }

    if (!payload.accessToken) {
      throw new Error('VK access token is required to publish.');
    }

    const wallParams = new URLSearchParams({
      access_token: payload.accessToken,
      message: input.content,
      v: '5.199',
    });

    if (payload.userId) {
      wallParams.set('owner_id', String(payload.userId));
    }

    if (input.mediaUrls && input.mediaUrls.length > 0) {
      wallParams.set('attachments', input.mediaUrls.join(','));
    }

    try {
      const res = await fetch('https://api.vk.com/method/wall.post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: wallParams.toString(),
      });

      if (!res.ok) {
        throw new Error(`VK wall.post HTTP error: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        logger.error('VK wall.post error', { error: data.error });
        throw new Error(`VK publish failed: ${data.error.error_msg || JSON.stringify(data.error)}`);
      }

      const postId = data.response?.post_id;
      const ownerId = payload.userId ? String(payload.userId) : '';
      const platformUrl = ownerId && postId ? `https://vk.com/wall${ownerId}_${postId}` : 'https://vk.com';

      return {
        platformPostId: String(postId),
        platformUrl,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('Failed to post to VK wall', { error: err instanceof Error ? err : new Error(String(err)) });
      throw err;
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    const payload = this.parseToken(tokenData);
    if (!payload.accessToken) return;

    const deleteParams = new URLSearchParams({
      access_token: payload.accessToken,
      post_id: platformPostId,
      v: '5.199',
    });

    if (payload.userId) {
      deleteParams.set('owner_id', String(payload.userId));
    }

    try {
      await fetch('https://api.vk.com/method/wall.delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: deleteParams.toString(),
      });
    } catch (err) {
      logger.error('VK wall.delete failed', { error: err });
    }
  }

  async getEngagement(tokenData: string, platformPostId: string): Promise<Record<string, unknown>> {
    const payload = this.parseToken(tokenData);
    if (!payload.accessToken) return {};

    const postKey = payload.userId ? `${payload.userId}_${platformPostId}` : platformPostId;
    try {
      const res = await fetch(`https://api.vk.com/method/wall.getById?posts=${postKey}&access_token=${payload.accessToken}&v=5.199`);
      if (!res.ok) return {};

      const data = await res.json();
      const post = data.response?.items?.[0] || data.response?.[0];
      if (!post) return {};

      return {
        likes: post.likes?.count || 0,
        reposts: post.reposts?.count || 0,
        comments: post.comments?.count || 0,
        views: post.views?.count || 0,
      };
    } catch {
      return {};
    }
  }

  private parseToken(tokenData: string): VKTokenPayload {
    try {
      const parsed = JSON.parse(tokenData);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch {
      // Raw string token
    }
    return { accessToken: tokenData };
  }
}

export const vkAdapter = new VKAdapter();
