import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

const DEVTO_API_BASE = 'https://dev.to/api';

/**
 * DevtoAdapter
 *
 * Handles publishing technical articles, developer updates, and guides to DEV Community (dev.to)
 * via Dev.to's Forem REST API (https://dev.to/api).
 * Uses Dev.to Personal API Keys generated from user settings (https://dev.to/settings/extensions).
 */
export class DevtoAdapter implements PlatformAdapter {
  readonly platform = 'devto' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [],
  };

  getAuthUrl(_state: string): string {
    throw new Error('DEV.to uses Personal API Keys. Generate one at https://dev.to/settings/extensions');
  }

  async exchangeCodeForToken(_code: string): Promise<TokenResponse> {
    throw new Error('DEV.to uses Personal API Keys directly.');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    throw new Error('DEV.to Personal API Keys do not expire periodically like OAuth tokens.');
  }

  /**
   * Helper to clean token string (strip Bearer/spaces if accidentally included)
   */
  cleanToken(token: string): string {
    return token.trim().replace(/^Bearer\s+/i, '').replace(/["']/g, '').trim();
  }

  /**
   * Fetch authenticated user's profile from DEV.to
   */
  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const rawToken = this.cleanToken(accessToken);

    const res = await fetch(`${DEVTO_API_BASE}/users/me`, {
      method: 'GET',
      headers: {
        'api-key': rawToken,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let message = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        message = parsed.error || parsed.message || message;
      } catch {
        if (errText) message = errText;
      }
      throw new Error(`Failed to fetch DEV.to profile: ${message}`);
    }

    const data = await res.json();

    return {
      platformUserId: String(data.id),
      username: data.username || '',
      displayName: data.name || data.username || 'DEV Creator',
      profileUrl: data.username ? `https://dev.to/${data.username}` : 'https://dev.to',
      avatarUrl: data.profile_image || undefined,
    };
  }

  /**
   * Publish an article to DEV Community (dev.to)
   */
  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    const rawToken = this.cleanToken(accessToken);

    if (!rawToken) {
      throw new Error('DEV.to API Key is missing or invalid.');
    }

    if (!input.content || !input.content.trim()) {
      throw new Error('Content is required to publish to DEV.to.');
    }

    // 1. Extract or determine article title
    const lines = input.content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let title = 'DEV Community Post';
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^#+\s*/, '').trim();
      if (firstLine.length > 0) {
        title = firstLine.slice(0, 120);
      }
    }

    // 2. Extract and format tags (max 4 tags, lowercase, alphanumeric only)
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const extractedTags: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = hashtagRegex.exec(input.content)) !== null) {
      const tag = match[1].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (tag && !extractedTags.includes(tag)) {
        extractedTags.push(tag);
      }
    }

    // Ensure we have up to 4 clean tags
    let tags = extractedTags.slice(0, 4);
    if (tags.length === 0) {
      tags = ['webdev', 'programming'];
    }

    // 3. Cover image if media is provided
    let coverImage: string | undefined;
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      const firstUrl = input.mediaUrls[0];
      if (typeof firstUrl === 'string' && firstUrl.startsWith('http')) {
        coverImage = firstUrl;
      }
    }

    // 4. Construct payload for Dev.to article creation
    const payload: {
      article: {
        title: string;
        body_markdown: string;
        published: boolean;
        tags: string[];
        main_image?: string;
      };
    } = {
      article: {
        title,
        body_markdown: input.content,
        published: true,
        tags,
        ...(coverImage ? { main_image: coverImage } : {}),
      },
    };

    logger.info('DevtoAdapter: publishing article', {
      title,
      tagsCount: tags.length,
      hasCoverImage: Boolean(coverImage),
    });

    const res = await fetch(`${DEVTO_API_BASE}/articles`, {
      method: 'POST',
      headers: {
        'api-key': rawToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let message = `DEV.to API returned status ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) message = parsed.error;
        else if (parsed.message) message = parsed.message;
        else if (Array.isArray(parsed.errors)) message = parsed.errors.join(', ');
      } catch {
        if (errText) message = errText;
      }
      logger.error('DevtoAdapter: publish failed', { status: res.status, message });
      throw new Error(`Failed to publish to DEV.to: ${message}`);
    }

    const data = await res.json();

    const platformPostId = String(data.id);
    const platformUrl = data.url || (data.path ? `https://dev.to${data.path}` : `https://dev.to/articles/${platformPostId}`);

    logger.info('DevtoAdapter: article published successfully', {
      platformPostId,
      platformUrl,
    });

    return {
      platformPostId,
      platformUrl,
      publishedAt: new Date(data.published_at || Date.now()),
    };
  }

  /**
   * Unpublish an article on DEV.to by setting published: false
   */
  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    const rawToken = this.cleanToken(accessToken);

    const res = await fetch(`${DEVTO_API_BASE}/articles/${platformPostId}`, {
      method: 'PUT',
      headers: {
        'api-key': rawToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        article: {
          published: false,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to unpublish DEV.to article: ${res.status} ${errText}`);
    }
  }

  /**
   * Retrieve article analytics and engagement metrics from DEV.to
   */
  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    try {
      const rawToken = this.cleanToken(accessToken);
      const res = await fetch(`${DEVTO_API_BASE}/articles/${platformPostId}`, {
        method: 'GET',
        headers: {
          'api-key': rawToken,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) return {};

      const data = await res.json();
      return {
        reactions: data.public_reactions_count ?? 0,
        positiveReactions: data.positive_reactions_count ?? 0,
        comments: data.comments_count ?? 0,
        pageViews: data.page_views_count ?? 0,
        readingTimeMinutes: data.reading_time_minutes ?? 0,
      };
    } catch {
      return {};
    }
  }
}

export const devtoAdapter = new DevtoAdapter();
