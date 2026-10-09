import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

/**
 * MastodonAdapter
 *
 * The user provides their instance URL (e.g., mastodon.social) and a generated Access Token.
 * The "accessToken" stored in the DB is a JSON string:
 * { instanceUrl: string, accessToken: string }
 */
export class MastodonAdapter implements PlatformAdapter {
  readonly platform = 'mastodon' as const; // We will add 'mastodon' to the union type

  // No OAuth — these are unused but required by the interface
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
    throw new Error('Mastodon does not use OAuth code exchange in this integration');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { instanceUrl, accessToken } = this.parseToken(tokenData);

    const res = await fetch(`https://${instanceUrl}/api/v1/accounts/verify_credentials`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Mastodon login failed: ${res.statusText}`);
    }

    const data = await res.json();

    return {
      platformUserId: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar,
      profileUrl: data.url,
    };
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const { instanceUrl, accessToken } = this.parseToken(tokenData);

    let mediaIds: string[] = [];

    if (input.mediaUrls && input.mediaUrls.length > 0) {
      // Mastodon supports up to 4 images, 1 video, or 1 audio. We just take up to 4.
      const urls = input.mediaUrls.slice(0, 4);

      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            logger.warn('Mastodon: failed to fetch media url', { url });
            continue;
          }
          const blob = await res.blob();
          const formData = new FormData();
          formData.append('file', blob);

          const uploadRes = await fetch(`https://${instanceUrl}/api/v2/media`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          });

          if (!uploadRes.ok) {
            const errBody = await uploadRes.text();
            throw new Error(`Media upload failed: ${errBody}`);
          }

          const uploadData = await uploadRes.json();
          mediaIds.push(uploadData.id);
        } catch (err) {
          logger.error('Mastodon: media upload error', { error: err instanceof Error ? err : new Error(String(err)) });
          throw new Error('Failed to upload media to Mastodon.');
        }
      }
    }

    // Prepare status creation payload
    // Truncate if character count exceeds 500 (Mastodon limit)
    let text = input.content;
    if (text.length > 500) {
      text = text.substring(0, 499) + '…';
    }

    const postBody: any = { status: text };
    if (mediaIds.length > 0) {
      postBody.media_ids = mediaIds;
    }

    const postRes = await fetch(`https://${instanceUrl}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postBody),
    });

    if (!postRes.ok) {
      const errBody = await postRes.text();
      throw new Error(`Mastodon publish failed: ${errBody}`);
    }

    const postData = await postRes.json();

    return {
      platformPostId: postData.id,
      platformUrl: postData.url,
      publishedAt: new Date(postData.created_at),
    };
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    const { instanceUrl, accessToken } = this.parseToken(tokenData);

    await fetch(`https://${instanceUrl}/api/v1/statuses/${platformPostId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getEngagement(tokenData: string, platformPostId: string): Promise<Record<string, unknown>> {
    const { instanceUrl, accessToken } = this.parseToken(tokenData);

    const res = await fetch(`https://${instanceUrl}/api/v1/statuses/${platformPostId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      logger.warn('Mastodon: Failed to fetch engagement', { status: res.status, platformPostId });
      return {};
    }

    const data = await res.json();
    return {
      likes: data.favourites_count || 0,
      comments: data.replies_count || 0,
      shares: data.reblogs_count || 0,
    };
  }

  private parseToken(tokenData: string): { instanceUrl: string; accessToken: string } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid Mastodon token format — expected JSON with instanceUrl and accessToken');
    }
  }
}

export const mastodonAdapter = new MastodonAdapter();
