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

const META_AUTH_URL = 'https://www.facebook.com/v20.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v20.0/oauth/access_token';
const WHATSAPP_API_BASE = 'https://graph.facebook.com/v20.0';

export class WhatsAppAdapter implements PlatformAdapter {
  readonly platform = 'whatsapp' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.META_CLIENT_ID || '',
    clientSecret: config.META_CLIENT_SECRET || '',
    redirectUri: config.META_REDIRECT_URI || '',
    scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
  };

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      scope: this.authConfig.scopes.join(','),
      response_type: 'code',
      state,
    });
    return `${META_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      redirect_uri: this.authConfig.redirectUri,
      grant_type: 'authorization_code',
      code,
    });

    return platformFetch('whatsapp', async () => {
      const response = await fetchWithRetry(`${META_TOKEN_URL}?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('WhatsApp token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`Token exchange failed: ${error}`);
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
      grant_type: 'th_exchange_token',
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      access_token: refreshToken,
    });

    return platformFetch('whatsapp', async () => {
      const response = await fetchWithRetry(`${META_TOKEN_URL}?${params.toString()}`, {});

      if (!response.ok) {
        const error = await response.text();
        logger.error('WhatsApp token refresh failed', { errorMessage: error, status: response.status });
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    return platformFetch('whatsapp', async () => {
      // Get WhatsApp Business Accounts
      const response = await fetchWithRetry(
        `${WHATSAPP_API_BASE}/me/whatsapp_business_accounts?fields=id,name,phone_numbers&access_token=${accessToken}`,
        {}
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('WhatsApp profile fetch failed', { errorMessage: error, status: response.status });

        if (response.status === 401 || response.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'whatsapp');
        }
        throw new Error(`Profile fetch failed: ${error}`);
      }

      const data = await response.json();
      const waba = data.data?.[0];

      if (!waba) {
        throw new Error('No WhatsApp Business Account found');
      }

      // Get phone numbers for this WABA
      const phoneNumbers = waba.phone_numbers || [];
      const phoneNumber = phoneNumbers[0];

      return {
        platformUserId: phoneNumber?.id || waba.id,
        username: phoneNumber?.phone_number || waba.id,
        displayName: phoneNumber?.display_name || waba.name,
        profileUrl: phoneNumber ? `https://wa.me/${phoneNumber.phone_number}` : `https://business.facebook.com/${waba.id}`,
        avatarUrl: undefined,
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('whatsapp', async () => {
      const messageType = input.whatsappMessageType || 'text';
      const recipientType = input.whatsappRecipientType || 'status';
      const phoneNumberId = await this.getPhoneNumberId(accessToken);

      let platformPostId: string;
      let platformUrl: string;

      if (recipientType === 'status') {
        // Post Status (broadcast to all contacts)
        if (messageType === 'text') {
          const result = await this.publishStatusText(accessToken, phoneNumberId, input.content);
          platformPostId = result.messages[0].id;
          platformUrl = `https://wa.me/${phoneNumberId}?status=${encodeURIComponent(input.content)}`;
        } else if (messageType === 'image' || messageType === 'video') {
          const mediaId = await this.uploadMedia(accessToken, phoneNumberId, input.mediaUrls?.[0]!, messageType);
          const result = await this.publishStatusMedia(accessToken, phoneNumberId, mediaId, messageType, input.content);
          platformPostId = result.messages[0].id;
          platformUrl = `https://wa.me/${phoneNumberId}?status=media`;
        } else {
          throw new Error(`Unsupported status message type: ${messageType}`);
        }
      } else {
        // Direct message to contact
        const recipientPhone = input.whatsappRecipientPhone;
        if (!recipientPhone) {
          throw new Error('whatsappRecipientPhone is required for direct messages');
        }

        if (messageType === 'text') {
          const result = await this.sendTextMessage(accessToken, phoneNumberId, recipientPhone, input.content);
          platformPostId = result.messages[0].id;
          platformUrl = `https://wa.me/${recipientPhone}`;
        } else if (messageType === 'image' || messageType === 'video' || messageType === 'document') {
          const mediaId = await this.uploadMedia(accessToken, phoneNumberId, input.mediaUrls?.[0]!, messageType);
          const result = await this.sendMediaMessage(accessToken, phoneNumberId, recipientPhone, mediaId, messageType, input.content);
          platformPostId = result.messages[0].id;
          platformUrl = `https://wa.me/${recipientPhone}`;
        } else {
          throw new Error(`Unsupported message type: ${messageType}`);
        }
      }

      return {
        platformPostId,
        platformUrl,
        publishedAt: new Date(),
      };
    });
  }

  private async getPhoneNumberId(accessToken: string): Promise<string> {
    const response = await fetchWithRetry(
      `${WHATSAPP_API_BASE}/me/whatsapp_business_accounts?fields=phone_numbers&access_token=${accessToken}`,
      {}
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get phone number: ${error}`);
    }

    const data = await response.json();
    const waba = data.data?.[0];
    const phoneNumber = waba?.phone_numbers?.[0];

    if (!phoneNumber?.id) {
      throw new Error('No WhatsApp Business phone number found');
    }

    return phoneNumber.id;
  }

  private async uploadMedia(accessToken: string, phoneNumberId: string, mediaUrl: string, type: 'image' | 'video' | 'document'): Promise<string> {
    // For WhatsApp Cloud API, upload media via multipart/form-data
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      throw new Error(`Failed to fetch media from URL: ${mediaUrl}`);
    }
    const mediaBlob = await mediaResponse.blob();

    const formData = new FormData();
    formData.append('file', mediaBlob, `media.${type === 'video' ? 'mp4' : type === 'document' ? 'pdf' : 'jpg'}`);
    formData.append('type', type);
    formData.append('messaging_product', 'whatsapp');

    const response = await fetchWithRetry(`${WHATSAPP_API_BASE}/${phoneNumberId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('WhatsApp media upload failed', { errorMessage: error, status: response.status });
      throw new Error(`Media upload failed: ${error}`);
    }

    const data = await response.json();
    return data.id;
  }

  private async publishStatusText(accessToken: string, phoneNumberId: string, text: string): Promise<any> {
    const body = {
      messaging_product: 'status',
      status: {
        text: { body: text },
      },
    };

    const response = await fetchWithRetry(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('WhatsApp status text publish failed', { errorMessage: error, status: response.status });
      throw new Error(`Status text publish failed: ${error}`);
    }

    return response.json();
  }

  private async publishStatusMedia(
    accessToken: string,
    phoneNumberId: string,
    mediaId: string,
    type: 'image' | 'video',
    caption?: string
  ): Promise<any> {
    const body = {
      messaging_product: 'status',
      status: {
        [type]: {
          id: mediaId,
          caption: caption || '',
        },
      },
    };

    const response = await fetchWithRetry(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('WhatsApp status media publish failed', { errorMessage: error, status: response.status });
      throw new Error(`Status media publish failed: ${error}`);
    }

    return response.json();
  }

  private async sendTextMessage(accessToken: string, phoneNumberId: string, to: string, text: string): Promise<any> {
    const body = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(to),
      type: 'text',
      text: { body: text },
    };

    const response = await fetchWithRetry(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('WhatsApp text message failed', { errorMessage: error, status: response.status });
      throw new Error(`Text message failed: ${error}`);
    }

    return response.json();
  }

  private async sendMediaMessage(
    accessToken: string,
    phoneNumberId: string,
    to: string,
    mediaId: string,
    type: 'image' | 'video' | 'document',
    caption?: string
  ): Promise<any> {
    const body = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(to),
      type,
      [type]: {
        id: mediaId,
        caption: caption || '',
      },
    };

    const response = await fetchWithRetry(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('WhatsApp media message failed', { errorMessage: error, status: response.status });
      throw new Error(`Media message failed: ${error}`);
    }

    return response.json();
  }

  private formatPhoneNumber(phone: string): string {
    // Ensure E.164 format (e.g., +15551234567 -> 15551234567)
    return phone.replace(/^\+/, '').replace(/[^\d]/g, '');
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    // WhatsApp messages cannot be deleted via API after sending
    // Only status updates can be deleted within 24 hours
    logger.warn('WhatsApp message deletion not supported via API', { platformPostId });
    throw new Error('WhatsApp message deletion not supported after sending');
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    // WhatsApp Cloud API does not provide Status insights
    // Template message analytics only available for Business Management API
    return {
      views: null,
      replies: null,
      note: 'WhatsApp Status insights not available via Cloud API. Template message analytics available via Business Management API.',
    };
  }
}

export const whatsAppAdapter = new WhatsAppAdapter();