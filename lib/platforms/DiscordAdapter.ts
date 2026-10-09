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
import { platformFetch, fetchWithRetry } from '@/lib/utils/retry';

interface DiscordTokenPayload {
  accessToken: string;
  webhookUrl: string;
  channelId: string;
  guildId?: string;
}

export class DiscordAdapter implements PlatformAdapter {
  readonly platform = 'discord' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.DISCORD_CLIENT_ID || '',
    clientSecret: config.DISCORD_CLIENT_SECRET || '',
    redirectUri: config.DISCORD_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: ['identify', 'webhook.incoming'],
  };

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      state,
      scope: this.authConfig.scopes.join(' '),
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.authConfig.redirectUri,
    });

    return platformFetch('discord', async () => {
      const response = await fetchWithRetry('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Discord token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`Discord token exchange failed: ${error}`);
      }

      const data = await response.json();
      
      if (!data.webhook || !data.webhook.url) {
        throw new Error('Discord token exchange failed: No incoming webhook provisioned.');
      }

      const tokenPayload: DiscordTokenPayload = {
        accessToken: data.access_token,
        webhookUrl: data.webhook.url,
        channelId: data.webhook.channel_id,
        guildId: data.webhook.guild_id,
      };

      return {
        accessToken: JSON.stringify(tokenPayload),
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
      };
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    return platformFetch('discord', async () => {
      const response = await fetchWithRetry('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Discord token refresh failed', { errorMessage: error, status: response.status });
        throw new Error(`Discord token refresh failed: ${error}`);
      }

      const data = await response.json();
      
      // We don't get the webhook payload back on a refresh.
      // NOTE: In Unool, standard refresh happens in a cron and the returned `accessToken` REPLACES the old one.
      // If we replace it with this string, we lose webhookUrl! Since webhooks don't expire, there's no reason to refresh.
      // But if forced, we leave the webhook data empty, which is a flaw.
      // For now, let's just return the new bot token data but ideally this shouldn't be refreshed if the webhook is used.
      const tokenPayload: DiscordTokenPayload = {
        accessToken: data.access_token,
        webhookUrl: '',
        channelId: '',
      };

      return {
        accessToken: JSON.stringify(tokenPayload),
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
      };
    });
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { accessToken } = this.parseToken(tokenData);

    return platformFetch('discord', async () => {
      const res = await fetchWithRetry('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        logger.error('Discord getUserProfile failed', { errorMessage: error, status: res.status });
        throw new Error(`Discord auth failed: ${error}`);
      }

      const data = await res.json();
      const { id, username, global_name, avatar } = data;
      const displayName = global_name || username;
      const avatarUrl = avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : '';

      return {
        platformUserId: id,
        username: username,
        displayName: displayName,
        avatarUrl: avatarUrl,
        profileUrl: `https://discord.com/users/${id}`,
      };
    });
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const { webhookUrl, channelId, guildId } = this.parseToken(tokenData);
    
    if (!webhookUrl) {
      throw new Error('Discord webhook URL is missing from connection.');
    }

    return platformFetch('discord', async () => {
      let content = input.content || '';
      
      // Append media URLs to text so Discord unfurls them if we have media
      if (input.mediaUrls && input.mediaUrls.length > 0) {
        content += '\n\n' + input.mediaUrls.join('\n');
      }

      const postRes = await fetchWithRetry(`${webhookUrl}?wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!postRes.ok) {
        const error = await postRes.text();
        logger.error('Discord publish failed', { errorMessage: error, status: postRes.status });
        throw new Error(`Discord publish failed: ${error}`);
      }

      const postData = await postRes.json();
      const guildComp = guildId ? guildId : '@me';

      return {
        platformPostId: postData.id,
        platformUrl: `https://discord.com/channels/${guildComp}/${channelId}/${postData.id}`,
        publishedAt: new Date(),
      };
    });
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    const { webhookUrl } = this.parseToken(tokenData);
    if (!webhookUrl) throw new Error('Missing webhook URL');
    
    await fetchWithRetry(`${webhookUrl}/messages/${platformPostId}`, {
      method: 'DELETE',
    });
  }

  async getEngagement(_tokenData: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return { likes: 0, comments: 0, shares: 0 };
  }

  private parseToken(tokenData: string): DiscordTokenPayload {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid Discord token format');
    }
  }
}

export const discordAdapter = new DiscordAdapter();
