import { PlatformAdapter, PlatformAuthConfig, TokenResponse, UserProfile, PublishInput, PublishResult } from './adapter';

export class MediumAdapter implements PlatformAdapter {
  readonly platform = 'medium';
  readonly authConfig: PlatformAuthConfig = {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [],
  };

  getAuthUrl(state: string): string {
    throw new Error('Medium uses Integration Tokens (manual connection via User Settings).');
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    throw new Error('Medium uses Integration Tokens.');
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    throw new Error('Medium Integration Tokens do not expire periodically in the same way OAuth does.');
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const res = await fetch('https://api.medium.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch Medium profile: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const user = data.data;

    return {
      platformUserId: user.id,
      username: user.username,
      displayName: user.name,
      profileUrl: user.url,
      avatarUrl: user.imageUrl,
    };
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    if (!input.platformUserId) {
      throw new Error('Medium requires platformUserId (authorId) to publish.');
    }

    // Default title is the first line of content if not provided
    const [titleLine, ...restLines] = input.content.split('\n');
    let title = titleLine;
    let mainContent = input.content;

    const payload = {
      title,
      contentFormat: 'markdown',
      content: mainContent,
      publishStatus: 'public', // Could be configurable: public, draft, unlisted
    };

    const res = await fetch(`https://api.medium.com/v1/users/${input.platformUserId}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to publish to Medium: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const post = data.data;

    return {
      platformPostId: post.id,
      platformUrl: post.url,
      publishedAt: new Date(post.publishedAt || Date.now()),
    };
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    throw new Error('Medium API does not support deleting posts via Integration Token.');
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }
}

export const mediumAdapter = new MediumAdapter();
