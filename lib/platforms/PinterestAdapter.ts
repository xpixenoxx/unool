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

export class PinterestAdapter implements PlatformAdapter {
  readonly platform = 'pinterest' as const;

  private get apiBase(): string {
    const useSandbox = config.PINTEREST_USE_SANDBOX || process.env.PINTEREST_USE_SANDBOX === 'true';
    return useSandbox ? 'https://api-sandbox.pinterest.com/v5' : 'https://api.pinterest.com/v5';
  }

  get authConfig(): PlatformAuthConfig {
    return {
      clientId: config.PINTEREST_CLIENT_ID || process.env.PINTEREST_CLIENT_ID || '',
      clientSecret: config.PINTEREST_CLIENT_SECRET || process.env.PINTEREST_CLIENT_SECRET || '',
      redirectUri:
        config.PINTEREST_REDIRECT_URI ||
        process.env.PINTEREST_REDIRECT_URI ||
        `${(config.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')}/api/auth/platform/callback`,
      scopes: ['user_accounts:read', 'pins:read', 'pins:write', 'boards:read', 'boards:write'],
    };
  }

  getAuthUrl(state: string, redirectUri?: string): string {
    const effectiveRedirectUri = redirectUri || this.authConfig.redirectUri;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.authConfig.clientId,
      redirect_uri: effectiveRedirectUri,
      state,
      scope: this.authConfig.scopes.join(','),
    });
    return `${PINTEREST_AUTH_URL}?${params.toString()}`;
  }

  private getBasicAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');
  }

  async exchangeCodeForToken(code: string, _codeVerifier?: string, redirectUri?: string): Promise<TokenResponse> {
    const effectiveRedirectUri = redirectUri || this.authConfig.redirectUri;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: effectiveRedirectUri,
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
      const profileResponse = await fetchWithRetry(`${this.apiBase}/user_account`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.text();
        logger.error('Pinterest userinfo fetch failed', { errorMessage: error, status: profileResponse.status });
        if (profileResponse.status === 401) {
          throw new TokenExpiredError('Pinterest access token expired or invalid', 'pinterest');
        }
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

      // We need a board to pin to. Fetch user boards first.
      const boardsRes = await fetchWithRetry(`${this.apiBase}/boards`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!boardsRes.ok) {
        const errorText = await boardsRes.text();
        logger.error('Pinterest boards fetch failed', { errorMessage: errorText, status: boardsRes.status });

        if (boardsRes.status === 401) {
          throw new TokenExpiredError('Pinterest access token expired or invalid', 'pinterest');
        }

        let parsedMessage = errorText;
        try {
          const parsed = JSON.parse(errorText);
          parsedMessage = parsed.message || parsed.error || errorText;
        } catch {}

        throw new Error(`Failed to fetch Pinterest boards (${boardsRes.status}): ${parsedMessage}`);
      }
      
      const boardsData = await boardsRes.json();
      let boardId = boardsData.items?.[0]?.id;

      // If user has no existing boards, attempt to auto-create a default board named "Unool"
      if (!boardId) {
        logger.info('No Pinterest boards found, attempting to auto-create default board "Unool"');
        try {
          const createBoardRes = await fetchWithRetry(`${this.apiBase}/boards`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'Unool',
              description: 'Pins published via Unool',
              privacy: 'PUBLIC',
            }),
          });

          if (createBoardRes.ok) {
            const createdBoard = await createBoardRes.json();
            boardId = createdBoard.id;
            logger.info('Created default Pinterest board', { boardId });
          } else {
            const createErr = await createBoardRes.text();
            logger.warn('Failed to auto-create Pinterest board', { error: createErr, status: createBoardRes.status });
          }
        } catch (err) {
          logger.warn('Error during Pinterest board creation attempt', { error: err });
        }

        if (!boardId) {
          throw new Error('No Pinterest boards found for your account. Please create at least one board on Pinterest first.');
        }
      }

      const mediaSource = {
        source_type: 'image_url' as const,
        url: input.mediaUrls[0],
      };

      // Pinterest title is max 100 characters; description is max 800 characters
      const title = (input.content.split('\n')[0] || 'Pin').slice(0, 100).trim();
      const description = input.content.slice(0, 800).trim();

      const postBody = {
        board_id: boardId,
        title,
        description,
        media_source: mediaSource,
      };

      const response = await fetchWithRetry(`${this.apiBase}/pins`, {
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

        if (response.status === 401) {
          throw new TokenExpiredError('Pinterest access token expired or invalid', 'pinterest');
        }

        let parsedMessage = error;
        try {
          const parsed = JSON.parse(error);
          if (parsed.code === 29 || parsed.message?.includes('Trial access')) {
            parsedMessage = 'Your Pinterest app is on Trial Access and cannot create Pins in production. Please apply for "Standard Access" in your Pinterest Developer Dashboard (or set PINTEREST_USE_SANDBOX=true for testing).';
          } else {
            parsedMessage = parsed.message || parsed.error || error;
          }
        } catch {}

        throw new Error(`Pinterest publish failed (${response.status}): ${parsedMessage}`);
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
      const response = await fetchWithRetry(`${this.apiBase}/pins/${platformPostId}`, {
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
      const end = new Date();
      const start = new Date(end.getTime() - 89 * 24 * 60 * 60 * 1000);
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      let response = await fetchWithRetry(
        `${this.apiBase}/pins/${encodeURIComponent(platformPostId)}/analytics?start_date=${startDate}&end_date=${endDate}&metric_types=IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Compatibility fallback if older proxy/sandbox expects legacy parameter names
      if (!response.ok && response.status === 400) {
        response = await fetchWithRetry(
          `${this.apiBase}/pins/${encodeURIComponent(platformPostId)}/analytics?start_date=${startDate}&end_date=${endDate}&metric_types=IMPRESSIONS,SAVES,PIN_CLICKS`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }

      if (!response.ok) {
        const error = await response.text();
        logger.error('Pinterest engagement fetch failed', { errorMessage: error, status: response.status });
        return {};
      }

      const data = await response.json();
      const metrics = data.all?.summary_metrics || data.summary_metrics || data.all || {};

      const saves = Number(metrics.SAVE ?? metrics.SAVES ?? 0);
      const impressions = Number(metrics.IMPRESSION ?? metrics.IMPRESSIONS ?? 0);
      const pinClicks = Number(metrics.PIN_CLICK ?? metrics.PIN_CLICKS ?? 0);
      const outboundClicks = Number(metrics.OUTBOUND_CLICK ?? 0);
      const clicks = pinClicks + outboundClicks;

      return {
        likes: 0, // Pinterest does not expose traditional likes on pin analytics; uses saves/clicks
        saves,
        impressions,
        views: impressions,
        clicks,
        outboundClicks,
      };
    });
  }
}

export const pinterestAdapter = new PinterestAdapter();
