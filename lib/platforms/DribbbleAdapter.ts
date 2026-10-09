import { config } from '@/lib/config/schema';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';
import { logger } from '@/lib/logger';

export class DribbbleAdapter implements PlatformAdapter {
  readonly platform = 'dribbble' as const;

  get authConfig(): PlatformAuthConfig {
    return {
      clientId: config.DRIBBBLE_CLIENT_ID || '',
      clientSecret: config.DRIBBBLE_CLIENT_SECRET || '',
      redirectUri: config.DRIBBBLE_REDIRECT_URI || '',
      scopes: ['public', 'upload'],
    };
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      scope: this.authConfig.scopes.join(' '),
      state: state,
    });
    return `https://dribbble.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      code,
      redirect_uri: this.authConfig.redirectUri,
    });

    const res = await fetch('https://dribbble.com/oauth/token', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error('Dribbble token exchange failed', { error: new Error(err) });
      throw new Error(`Dribbble auth failed: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      // Dribbble tokens don't explicitly expire, default high duration or none
      expiresIn: 31536000, 
      scope: data.scope,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    throw new Error('Dribbble does not support refresh tokens (tokens do not expire).');
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const res = await fetch('https://api.dribbble.com/v2/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      logger.error('Failed to get Dribbble profile', { status: res.status, errorMsg });
      throw new Error(`Failed to get Dribbble profile: ${res.status}`);
    }

    const data = await res.json();
    return {
      platformUserId: String(data.id),
      username: data.login,
      displayName: data.name,
      avatarUrl: data.avatar_url,
      profileUrl: data.html_url,
    };
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    if (!input.mediaUrls || input.mediaUrls.length === 0) {
      throw new Error('Dribbble requires an image to be uploaded.');
    }

    const imageUrl = input.mediaUrls[0];
    
    // First, fetch the image to upload
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error('Failed to download image for Dribbble publish');
    }
    
    const buffer = await imageRes.arrayBuffer();
    const blob = new Blob([buffer], { type: imageRes.headers.get('content-type') || 'image/png' });
    
    const formData = new FormData();
    formData.append('image', blob, 'shot.png');
    formData.append('title', input.content.substring(0, 50) || 'New Shot');
    formData.append('description', input.content);

    const res = await fetch('https://api.dribbble.com/v2/shots', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData as any,
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error('Dribbble publish failed', { error: new Error(err) });
      throw new Error(`Dribbble publish failed: ${res.statusText}`);
    }

    let platformPostId = `dribbble-${Date.now()}`;
    let platformUrl = '';
    const locationHeader = res.headers.get('location');
    if (locationHeader) {
      platformUrl = locationHeader;
      const parts = locationHeader.split('/');
      platformPostId = parts[parts.length - 1] || platformPostId;
    }

    const text = await res.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        platformPostId = data.id ? String(data.id) : platformPostId;
        platformUrl = data.html_url || platformUrl;
      } catch (e) {
        logger.warn('Dribbble publish response was not JSON', {
          error: e instanceof Error ? e : new Error(String(e)),
          text
        });
      }
    }

    return {
      platformPostId,
      platformUrl,
      publishedAt: new Date(),
    };
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    const res = await fetch(`https://api.dribbble.com/v2/shots/${platformPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to delete Dribbble shot: ${res.statusText}`);
    }
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    const res = await fetch(`https://api.dribbble.com/v2/shots/${platformPostId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return {};
    }

    const data = await res.json();
    return {
      views: data.views_count,
      likes: data.likes_count,
      comments: data.comments_count,
      saves: data.saves_count,
    };
  }
}

export const dribbbleAdapter = new DribbbleAdapter();
