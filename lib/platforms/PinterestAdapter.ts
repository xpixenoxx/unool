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

const PINTEREST_AUTH_URL = 'https://www.pinterest.com/oauth/';
const PINTEREST_TOKEN_URL = 'https://api.pinterest.com/v5/oauth/token';
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

export class PinterestAdapter implements PlatformAdapter {
  readonly platform = 'pinterest' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.PINTEREST_CLIENT_ID || '',
    clientSecret: config.PINTEREST_CLIENT_SECRET || '',
    redirectUri: config.PINTEREST_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: ['user_accounts:read', 'pins:read', 'pins:write', 'boards:read', 'boards:write'],
  };

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      state,
      scope: this.authConfig.scopes.join(','),
    });
    return `${PINTEREST_AUTH_URL}?${params.toString()}`;
  }

  private getBasicAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.authConfig.redirectUri,
    });

    return platformFetch('pinterest', async () => {
      const response = await fetchWithRetry(PINTEREST_TOKEN_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': this.getBasicAuthHeader(),
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Pinterest token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`Pinterest token exchange failed: ${error}`);
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
    });

    return platformFetch('pinterest', async () => {
      const response = await fetchWithRetry(PINTEREST_TOKEN_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': this.getBasicAuthHeader(),
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Pinterest token refresh failed', { errorMessage: error, status: response.status });
        throw new Error(`Pinterest token refresh failed: ${error}`);
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
    return platformFetch('pinterest', async () => {
      const profileResponse = await fetchWithRetry(`${PINTEREST_API_BASE}/user_account`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.text();
        logger.error('Pinterest userinfo fetch failed', { errorMessage: error, status: profileResponse.status });
        throw new Error(`Pinterest userinfo fetch failed: ${error}`);
      }

      const profile = await profileResponse.json();

      return {
        platformUserId: profile.id ?? profile.username,
        username: profile.username,
        displayName: profile.username,
        profileUrl: profile.website_url,
        avatarUrl: profile.profile_image,
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('pinterest', async () => {
      if (!input.mediaUrls || input.mediaUrls.length === 0) {
        throw new Error('Pinterest requires at least one media URL (image or video) to create a Pin.');
      }

      // We need a board to pin to. Since Unool doesn't have board selection natively, grab the first available board.
      const boardsRes = await fetchWithRetry(`${PINTEREST_API_BASE}/boards`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!boardsRes.ok) {
         if (boardsRes.status === 401 || boardsRes.status === 403) {
            throw new TokenExpiredError('Token expired or invalid', 'pinterest');
         }
         throw new Error('Failed to fetch Pinterest boards');
      }
      
      const boardsData = await boardsRes.json();
      if (!boardsData.items || boardsData.items.length === 0) {
         throw new Error('No Pinterest boards found for the user. Please create a board first.');
      }

      const boardId = boardsData.items[0].id;

      let mediaSource: any = {
        source_type: 'image_url',
        url: input.mediaUrls[0]
      };

      // Since Pinterest supports video URLs if you have the right access, you could adapt for videos.
      // We assume it's going to be valid media format. 

      const postBody = {
        board_id: boardId,
        title: input.content.slice(0, 100), // simple truncation for title, or omit title.
        description: input.content,
        media_source: mediaSource
      };

      const response = await fetchWithRetry(`${PINTEREST_API_BASE}/pins`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postBody),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Pinterest publish failed', { errorMessage: error, status: response.status });

        if (response.status === 401 || response.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'pinterest');
        }
        throw new Error(`Pinterest publish failed: ${error}`);
      }

      const postData = await response.json();
      
      return {
        platformPostId: postData.id,
        platformUrl: `https://www.pinterest.com/pin/${postData.id}/`,
        publishedAt: new Date(),
      };
    });
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    return platformFetch('pinterest', async () => {
      const response = await fetchWithRetry(`${PINTEREST_API_BASE}/pins/${platformPostId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Pinterest delete chunk failed', { errorMessage: error, status: response.status });
        throw new Error(`Pinterest delete failed: ${error}`);
      }
    });
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('pinterest', async () => {
      const response = await fetchWithRetry(`${PINTEREST_API_BASE}/pins/${platformPostId}/analytics?metric_types=IMPRESSIONS,SAVES,PIN_CLICKS`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Pinterest engagement fetch failed', { errorMessage: error, status: response.status });
        return {};
      }

      const data = await response.json();
      
      const metrics = data.all || {};
      return {
        likes: 0, // Pinterest doesn't strictly have likes via analytics this way, usually SAVES.
        saves: metrics.SAVES || 0,
        impressions: metrics.IMPRESSIONS || 0,
        clicks: metrics.PIN_CLICKS || 0,
      };
    });
  }
}

export const pinterestAdapter = new PinterestAdapter();
