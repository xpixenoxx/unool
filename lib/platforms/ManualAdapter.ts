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

export class ManualAdapter implements PlatformAdapter {
  readonly platform = 'manual' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [],
  };

  getAuthUrl(state: string): string {
    // For manual adapter, we redirect to a manual publish page
    return `/dashboard/publish?manual=${state}`;
  }

  async exchangeCodeForToken(): Promise<TokenResponse> {
    // Manual adapter doesn't use OAuth
    throw new Error('Manual adapter does not support OAuth');
  }

  async refreshAccessToken(): Promise<TokenResponse> {
    throw new Error('Manual adapter does not support token refresh');
  }

  async getUserProfile(): Promise<UserProfile> {
    return {
      platformUserId: 'manual',
      username: 'manual',
      displayName: 'Manual Publishing',
    };
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    // For manual publishing, we generate a unique ID and return a draft URL
    // The user will manually copy-paste the content
    const platformPostId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const platformUrl = `${config.NEXT_PUBLIC_APP_URL}/dashboard/publish?manual=true&content=${encodeURIComponent(input.content)}`;

    logger.info('Manual publish initiated', { platformPostId, contentLength: input.content.length });

    return {
      platformPostId,
      platformUrl,
      publishedAt: new Date(),
    };
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    logger.info('Manual delete requested', { platformPostId });
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    logger.info('Manual engagement fetch requested', { platformPostId });
    return {};
  }
}

export const manualAdapter = new ManualAdapter();