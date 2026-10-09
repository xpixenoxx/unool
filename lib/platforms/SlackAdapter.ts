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
 * SlackAdapter
 * Handles connecting via a Slack User or Bot Token (xoxb- or xoxp-).
 * tokenData will be stored as a JSON string containing the token and default channel.
 */
export class SlackAdapter implements PlatformAdapter {
  readonly platform = 'slack' as const;

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
    throw new Error('Using token-based connection for Slack');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { accessToken } = this.parseToken(tokenData);

    const res = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Slack auth failed: ${data.error}`);
    }

    // Fetch user details for the avatar (if it's a team/bot, fallback to team bot info)
    let displayName = data.user || data.bot_id || 'Slack User';
    let avatarUrl = '';

    if (data.user_id) {
      const userRes = await fetch(`https://slack.com/api/users.info?user=${data.user_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userRes.json();
      if (userData.ok && userData.user) {
        displayName = userData.user.real_name || userData.user.name;
        avatarUrl = userData.user.profile?.image_192 || '';
      }
    }

    return {
      platformUserId: data.user_id || data.bot_id,
      username: displayName,
      displayName: displayName,
      avatarUrl: avatarUrl,
      profileUrl: `https://${data.url}`,
    };
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const { accessToken, defaultChannel } = this.parseToken(tokenData);
    
    // Fallback to `#general` if none provided, though the UI should require it
    const channel = defaultChannel || '#general';

    // File uploads to Slack are complex, so we'll just post the text first
    // Slack requires text separated or blocks. We'll use simple text.
    let text = input.content;
    
    // Append media URLs to text so Slack unfurls them if we have media
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      text += '\n\n' + input.mediaUrls.join('\n');
    }

    const postRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channel,
        text: text,
      }),
    });

    const postData = await postRes.json();

    if (!postData.ok) {
      throw new Error(`Slack publish failed: ${postData.error}`);
    }

    return {
      platformPostId: postData.ts,
      platformUrl: `https://slack.com/archives/${postData.channel}/p${postData.ts.replace('.', '')}`,
      publishedAt: new Date(),
    };
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    const { accessToken, defaultChannel } = this.parseToken(tokenData);
    
    // For delete, Slack actually needs the channel ID and timestamp
    await fetch('https://slack.com/api/chat.delete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: defaultChannel,
        ts: platformPostId,
      }),
    });
  }

  async getEngagement(_tokenData: string, _platformPostId: string): Promise<Record<string, unknown>> {
    // We could fetch reactions from chat.getPermalink or reactions.get if needed
    return {};
  }

  private parseToken(tokenData: string): { accessToken: string; defaultChannel: string } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid Slack token format');
    }
  }
}

export const slackAdapter = new SlackAdapter();
