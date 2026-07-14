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

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_V1_API_BASE = 'https://api.linkedin.com/rest';

export class LinkedInAdapter implements PlatformAdapter {
  readonly platform = 'linkedin' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.LINKEDIN_CLIENT_ID || '',
    clientSecret: config.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: config.LINKEDIN_REDIRECT_URI || '',
    scopes: ['r_liteprofile', 'w_member_social', 'rw_organization_admin'],
  };

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      state,
      scope: this.authConfig.scopes.join(' '),
    });
    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.authConfig.redirectUri,
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
    });

    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('LinkedIn token exchange failed', { errorMessage: error, status: response.status });
      throw new Error(`LinkedIn token exchange failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
    });

    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('LinkedIn token refresh failed', { errorMessage: error, status: response.status });
      throw new Error(`LinkedIn token refresh failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    // Get basic profile
    const profileResponse = await fetch(`${LINKEDIN_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      logger.error('LinkedIn profile fetch failed', { errorMessage: error, status: profileResponse.status });
      throw new Error(`LinkedIn profile fetch failed: ${error}`);
    }

    const profile = await profileResponse.json();

    // Get email - requires separate call with r_emailaddress scope
    let email: string | undefined;
    const emailResponse = await fetch(`${LINKEDIN_API_BASE}/emailAddress?q=members&projection=(elements*(handle~))`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (emailResponse.ok) {
      const emailData = await emailResponse.json();
      email = emailData.elements?.[0]?.['handle~']?.emailAddress;
    }

    return {
      platformUserId: profile.id,
      username: email || profile.id,
      displayName: `${profile.firstName?.localized?.en_US || ''} ${profile.lastName?.localized?.en_US || ''}`.trim(),
      profileUrl: `https://www.linkedin.com/in/${profile.id}`,
      avatarUrl: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
    };
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    const authorUrn = await this.getAuthorUrn(accessToken);

    const postBody = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: input.content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const response = await fetch(`${LINKEDIN_V1_API_BASE}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('LinkedIn publish failed', { errorMessage: error, status: response.status });
      throw new Error(`LinkedIn publish failed: ${error}`);
    }

    const data = await response.json();
    const platformPostId = data.id?.split(':').pop() || data.id;
    const platformUrl = `https://www.linkedin.com/feed/update/${platformPostId}`;

    return {
      platformPostId,
      platformUrl,
      publishedAt: new Date(),
    };
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    const response = await fetch(`${LINKEDIN_V1_API_BASE}/posts/${platformPostId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('LinkedIn delete failed', { errorMessage: error, status: response.status });
      throw new Error(`LinkedIn delete failed: ${error}`);
    }
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${LINKEDIN_V1_API_BASE}/socialActions/${platformPostId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('LinkedIn engagement fetch failed', { errorMessage: error, status: response.status });
      return {};
    }

    const data = await response.json();
    return {
      likes: data.likesSummary?.totalLikes || 0,
      comments: data.commentsSummary?.totalComments || 0,
      shares: data.sharesSummary?.totalShares || 0,
    };
  }

  private async getAuthorUrn(accessToken: string): Promise<string> {
    const profileResponse = await fetch(`${LINKEDIN_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get author URN');
    }

    const profile = await profileResponse.json();
    return `urn:li:person:${profile.id}`;
  }
}

export const linkedInAdapter = new LinkedInAdapter();