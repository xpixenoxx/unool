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
import { platformFetch, fetchWithRetry, TokenExpiredError } from '@/lib/utils/retry';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_V1_API_BASE = 'https://api.linkedin.com/rest';

export class LinkedInAdapter implements PlatformAdapter {
  readonly platform = 'linkedin' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.LINKEDIN_CLIENT_ID || '',
    clientSecret: config.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: config.LINKEDIN_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    // r_liteprofile was deprecated in 2023. Use OpenID Connect scopes.
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
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

    return platformFetch('linkedin', async () => {
      const response = await fetchWithRetry(LINKEDIN_TOKEN_URL, {
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
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
    });

    return platformFetch('linkedin', async () => {
      const response = await fetchWithRetry(LINKEDIN_TOKEN_URL, {
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
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    return platformFetch('linkedin', async () => {
      // Use OpenID Connect userinfo endpoint (works with openid, profile, email scopes)
      const profileResponse = await fetchWithRetry('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.text();
        logger.error('LinkedIn userinfo fetch failed', { errorMessage: error, status: profileResponse.status });
        throw new Error(`LinkedIn userinfo fetch failed: ${error}`);
      }

      const profile = await profileResponse.json();

      return {
        platformUserId: profile.sub, // OpenID Connect standard field
        username: profile.email || profile.sub,
        displayName: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
        profileUrl: `https://www.linkedin.com/in/${profile.sub}`,
        avatarUrl: profile.picture,
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('linkedin', async () => {
      const authorUrn = await this.getAuthorUrn(accessToken);

      let contentObj: any = undefined;

      if (input.mediaUrls && input.mediaUrls.length > 0) {
        const imageUrl = input.mediaUrls[0];
        try {
          // 1. Fetch image binary from URL
          const imageRes = await fetch(imageUrl);
          if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.statusText}`);
          const imageBuffer = await imageRes.arrayBuffer();
          const contentType = imageRes.headers.get('content-type') || 'application/octet-stream';

          const isVideo = contentType.startsWith('video/');

          let mediaUrn = '';
          let uploadUrl = '';

          // 2. Initialize upload with LinkedIn
          if (isVideo) {
            const initRes = await fetchWithRetry(`${LINKEDIN_V1_API_BASE}/videos?action=initializeUpload`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': '202606',
              },
              body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn, fileSizeBytes: imageBuffer.byteLength, uploadCaptions: false, uploadThumbnail: false } }),
            });

            if (!initRes.ok) {
              const errText = await initRes.text();
              throw new Error(`Failed to initialize video upload: ${errText}`);
            }

            const initData = await initRes.json();
            mediaUrn = initData.value.video;
            uploadUrl = initData.value.uploadInstructions[0].uploadUrl;
          } else {
            const initRes = await fetchWithRetry(`${LINKEDIN_V1_API_BASE}/images?action=initializeUpload`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': '202606',
              },
              body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
            });

            if (!initRes.ok) {
              const errText = await initRes.text();
              throw new Error(`Failed to initialize image upload: ${errText}`);
            }

            const initData = await initRes.json();
            mediaUrn = initData.value.image;
            uploadUrl = initData.value.uploadUrl;
          }

          // 3. Upload binary data
          const uploadRes = await fetchWithRetry(uploadUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': contentType,
            },
            body: imageBuffer,
          });

          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(`Failed to upload media binary: ${errText}`);
          }

          // 4. Set content object for post payload
          contentObj = { media: { id: mediaUrn } };
        } catch (error) {
          logger.error('LinkedIn media upload failed', { error });
          // Fall back to text post if image fails, or throw? Better to throw so user knows.
          throw error;
        }
      }

      const postBody: any = {
        author: authorUrn,
        commentary: input.content,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false
      };

      if (contentObj) {
        postBody.content = contentObj;
      }

      const response = await fetchWithRetry(`${LINKEDIN_V1_API_BASE}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202606',
        },
        body: JSON.stringify(postBody),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('LinkedIn publish failed', { errorMessage: error, status: response.status });

        if (response.status === 401 || response.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'linkedin');
        }
        throw new Error(`LinkedIn publish failed: ${error}`);
      }

      // The /posts API returns 201 Created with an empty body and the ID in the x-restli-id header
      const platformPostId = response.headers.get('x-restli-id') || '';
      const platformUrl = `https://www.linkedin.com/feed/update/${platformPostId}`;

      return {
        platformPostId,
        platformUrl,
        publishedAt: new Date(),
      };
    });
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    return platformFetch('linkedin', async () => {
      const response = await fetchWithRetry(`${LINKEDIN_V1_API_BASE}/posts/${platformPostId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202606',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('LinkedIn delete failed', { errorMessage: error, status: response.status });
        throw new Error(`LinkedIn delete failed: ${error}`);
      }
    });
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('linkedin', async () => {
      const response = await fetchWithRetry(`${LINKEDIN_V1_API_BASE}/socialActions/${platformPostId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202606',
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
    });
  }

  private async getAuthorUrn(accessToken: string): Promise<string> {
    return platformFetch('linkedin', async () => {
      const profileResponse = await fetchWithRetry(`https://api.linkedin.com/v2/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to get author URN');
      }

      const profile = await profileResponse.json();
      return `urn:li:person:${profile.sub}`;
    });
  }
}

export const linkedInAdapter = new LinkedInAdapter();