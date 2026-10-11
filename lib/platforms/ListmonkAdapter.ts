import { PlatformAdapter, PlatformAuthConfig, TokenResponse, UserProfile, PublishInput, PublishResult } from './adapter';
import { logger } from '@/lib/logger';

export interface ListmonkTokenData {
  instanceUrl: string;
  username: string;
  apiKey: string;
  listId?: number;
  listName?: string;
  sendImmediately?: boolean;
}

export interface ListmonkList {
  id: number;
  name: string;
  type: string;
  optin?: string;
  tags?: string[];
}

export class ListmonkAdapter implements PlatformAdapter {
  readonly platform = 'listmonk' as const;
  readonly authConfig: PlatformAuthConfig = {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [],
  };

  getAuthUrl(_state: string): string {
    throw new Error('Listmonk uses self-hosted API tokens / Basic authentication.');
  }

  async exchangeCodeForToken(_code: string): Promise<TokenResponse> {
    throw new Error('Listmonk uses self-hosted API tokens.');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    throw new Error('Listmonk API credentials do not expire periodically.');
  }

  normalizeInstanceUrl(url: string): string {
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    return normalized.replace(/\/+$/, '');
  }

  getAuthHeader(username: string, apiKey: string): string {
    const credentials = Buffer.from(`${username}:${apiKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  parseToken(tokenData: string): ListmonkTokenData {
    try {
      const parsed = JSON.parse(tokenData) as ListmonkTokenData;
      if (!parsed.instanceUrl || !parsed.username || !parsed.apiKey) {
        throw new Error('Missing required fields: instanceUrl, username, or apiKey');
      }
      return {
        ...parsed,
        instanceUrl: this.normalizeInstanceUrl(parsed.instanceUrl),
        sendImmediately: parsed.sendImmediately !== false,
      };
    } catch {
      throw new Error('Invalid Listmonk credentials format. Expected JSON with instanceUrl, username, and apiKey.');
    }
  }

  async fetchLists(parsed: ListmonkTokenData): Promise<ListmonkList[]> {
    const url = `${parsed.instanceUrl}/api/lists?per_page=100`;
    const res = await fetch(url, {
      headers: {
        Authorization: this.getAuthHeader(parsed.username, parsed.apiKey),
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch lists from Listmonk (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return (data?.data?.results || []) as ListmonkList[];
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const parsed = this.parseToken(tokenData);
    const authHeader = this.getAuthHeader(parsed.username, parsed.apiKey);

    try {
      // Validate credentials by fetching lists or health
      const res = await fetch(`${parsed.instanceUrl}/api/lists?per_page=1`, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        if (res.status === 401 || res.status === 403) {
          throw new Error('Authentication failed. Please verify your Listmonk API username and API key / password.');
        }
        throw new Error(`Listmonk connection failed (${res.status}): ${errorText}`);
      }

      let host = parsed.instanceUrl;
      try {
        host = new URL(parsed.instanceUrl).hostname;
      } catch {
        // Keep raw url if parsing fails
      }

      return {
        platformUserId: parsed.username,
        username: parsed.username,
        displayName: `Listmonk (${host})`,
        profileUrl: parsed.instanceUrl,
      };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger.error('Listmonk: getUserProfile failed', { error: err, instance: parsed.instanceUrl });
      throw new Error(`Listmonk authentication error: ${err.message}`);
    }
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const parsed = this.parseToken(tokenData);
    const authHeader = this.getAuthHeader(parsed.username, parsed.apiKey);

    // 1. Determine target lists
    let targetListIds: number[] = [];
    if (parsed.listId && !isNaN(Number(parsed.listId))) {
      targetListIds = [Number(parsed.listId)];
    } else {
      const lists = await this.fetchLists(parsed);
      if (lists.length === 0) {
        throw new Error('No subscriber lists found in your Listmonk instance. Please create at least one list in Listmonk first.');
      }
      targetListIds = [lists[0].id];
    }

    // 2. Determine subject / name
    const lines = input.content.split('\n').map(l => l.trim()).filter(Boolean);
    let title = lines[0] || 'New Newsletter Post';
    // Strip markdown headline formatting if present
    title = title.replace(/^#+\s*/, '').trim();
    if (title.length > 150) {
      title = `${title.slice(0, 147)}...`;
    }

    // 3. Format body with markdown and append images if present
    let body = input.content;
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      const mediaMarkdown = input.mediaUrls
        .map(url => `\n\n![Image](${url})`)
        .join('');
      body += mediaMarkdown;
    }

    // Extract tags from content if present (hashtags)
    const hashtagMatches = input.content.match(/#(\w+)/g) || [];
    const tags = hashtagMatches.map(t => t.replace(/^#/, '').toLowerCase()).slice(0, 5);

    logger.info('Listmonk: Creating campaign', {
      instance: parsed.instanceUrl,
      title,
      lists: targetListIds,
    });

    // 4. Create campaign
    const createRes = await fetch(`${parsed.instanceUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: title,
        subject: title,
        lists: targetListIds,
        type: 'regular',
        content_type: 'markdown',
        body,
        tags: tags.length > 0 ? tags : undefined,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      logger.error('Listmonk: Create campaign failed', { status: createRes.status, errText });
      throw new Error(`Failed to create Listmonk campaign (${createRes.status}): ${errText}`);
    }

    const campaignData = await createRes.json();
    const campaignId = campaignData?.data?.id;

    if (!campaignId) {
      throw new Error('Listmonk created campaign but did not return a campaign ID.');
    }

    // 5. If sendImmediately is true, update status to running
    if (parsed.sendImmediately !== false) {
      logger.info('Listmonk: Starting campaign broadcast', { campaignId });
      const statusRes = await fetch(`${parsed.instanceUrl}/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ status: 'running' }),
      });

      if (!statusRes.ok) {
        const statusErr = await statusRes.text();
        logger.warn('Listmonk: Could not transition campaign status to running', {
          campaignId,
          statusErr,
        });
        // We still consider the campaign created in Listmonk
      }
    }

    const platformUrl = `${parsed.instanceUrl}/admin/campaigns/${campaignId}`;

    return {
      platformPostId: String(campaignId),
      platformUrl,
      publishedAt: new Date(),
    };
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    const parsed = this.parseToken(tokenData);
    const authHeader = this.getAuthHeader(parsed.username, parsed.apiKey);

    const res = await fetch(`${parsed.instanceUrl}/api/campaigns/${platformPostId}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (!res.ok && res.status !== 404) {
      const errText = await res.text();
      logger.warn('Listmonk: delete campaign failed', { campaignId: platformPostId, errText });
      throw new Error(`Failed to delete Listmonk campaign (${res.status}): ${errText}`);
    }
  }

  async getEngagement(tokenData: string, platformPostId: string): Promise<Record<string, unknown>> {
    try {
      const parsed = this.parseToken(tokenData);
      const authHeader = this.getAuthHeader(parsed.username, parsed.apiKey);

      const res = await fetch(`${parsed.instanceUrl}/api/campaigns/${platformPostId}`, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return {};
      }

      const json = await res.json();
      const campaign = json?.data;
      if (!campaign) return {};

      return {
        status: campaign.status,
        sent: campaign.sent || 0,
        to_send: campaign.to_send || 0,
        views: campaign.views || 0,
        clicks: campaign.clicks || 0,
      };
    } catch (e) {
      logger.warn('Listmonk: Failed to fetch campaign engagement', { campaignId: platformPostId, error: e });
      return {};
    }
  }
}

export const listmonkAdapter = new ListmonkAdapter();
