import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

export function normalizeTelegramChatId(inputChatId: string): string {
  let cleaned = (inputChatId || '').trim();
  if (!cleaned) return '';

  // Handle URLs like https://t.me/mychannel or t.me/mychannel
  cleaned = cleaned.replace(/^https?:\/\/t\.me\//i, '').replace(/^t\.me\//i, '');
  cleaned = cleaned.replace(/\/+$/, '');

  // If numeric (e.g. 12345678 or -1001234567890 or -12345), keep as is
  if (/^-?\d+$/.test(cleaned)) {
    return cleaned;
  }

  // If starts with @, keep it
  if (cleaned.startsWith('@')) {
    return cleaned;
  }

  // Otherwise public channel username without @
  return `@${cleaned}`;
}

export class TelegramAdapter implements PlatformAdapter {
  readonly platform = 'telegram' as const;

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
    throw new Error('Using custom connection for Telegram');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { botToken, chatId } = this.parseToken(tokenData);

    const botRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botData = await botRes.json();

    if (!botData.ok) {
      throw new Error(`Telegram auth failed: ${botData.description || 'Invalid bot token'}`);
    }

    const bot = botData.result;
    
    let displayName = bot.first_name + (bot.last_name ? ` ${bot.last_name}` : '');
    if (chatId) {
      try {
        const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`);
        const chatData = await chatRes.json();
        if (chatData.ok) {
           displayName = chatData.result.title || chatData.result.first_name || displayName;
        }
      } catch (e) {
        logger.error('Failed to fetch Telegram chat details', { error: e as Error, chatId });
      }
    }

    return {
      platformUserId: bot.id.toString(),
      username: bot.username,
      displayName: displayName,
      profileUrl: `https://t.me/${bot.username}`,
      avatarUrl: '',
    };
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const { botToken, chatId } = this.parseToken(tokenData);

    if (!chatId) {
      throw new Error('Telegram chat ID is required to publish.');
    }

    const urlBase = `https://api.telegram.org/bot${botToken}`;
    let messageId: string | undefined;
    
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      if (input.mediaUrls.length === 1) {
        const isVideo = input.mediaUrls[0].match(/\.(mp4|mov|gif)$/i);
        const endpoint = isVideo ? '/sendVideo' : '/sendPhoto';
        
        const payload: Record<string, unknown> = {
          chat_id: chatId,
          caption: input.content,
        };
        
        if (isVideo) { payload.video = input.mediaUrls[0]; }
        else { payload.photo = input.mediaUrls[0]; }
        
        const res = await fetch(`${urlBase}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.ok) throw new Error(`Telegram media publish failed: ${this.formatTelegramError(data.description, chatId)}`);
        messageId = data.result.message_id.toString();
      } else {
        const media = input.mediaUrls.map((url, i) => {
           const isVideo = url.match(/\.(mp4|mov|gif)$/i);
           return {
             type: isVideo ? 'video' : 'photo',
             media: url,
             caption: i === 0 ? input.content : undefined
           };
        });
        const res = await fetch(`${urlBase}/sendMediaGroup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            media: media
          })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(`Telegram media group publish failed: ${this.formatTelegramError(data.description, chatId)}`);
        messageId = data.result[0].message_id.toString();
      }
    } else {
      const res = await fetch(`${urlBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: input.content || ' ',
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(`Telegram publish failed: ${this.formatTelegramError(data.description, chatId)}`);
      }
      messageId = data.result.message_id.toString();
    }

    let publicUrl = `https://t.me/c/${chatId.toString().replace('-100', '')}/${messageId}`;
    if (!chatId.toString().startsWith('-100') && !chatId.toString().startsWith('-')) {
       // it's a username channel like @channelname
       publicUrl = `https://t.me/${chatId.toString().replace('@', '')}/${messageId}`;
    }

    return {
      platformPostId: messageId || `tg-${Date.now()}`,
      platformUrl: publicUrl,
      publishedAt: new Date(),
    };
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    const { botToken, chatId } = this.parseToken(tokenData);
    
    await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: platformPostId,
      }),
    });
  }

  async getEngagement(_tokenData: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }

  private formatTelegramError(description: string, chatId: string): string {
    if (description?.toLowerCase().includes('chat not found')) {
      return `Bad Request: chat not found for "${chatId}". Please ensure: 1) The channel username or chat ID is correct (e.g. @yourchannel). 2) The bot has been added to the channel as an Administrator with permission to post messages.`;
    }
    return description;
  }

  private parseToken(tokenData: string): { botToken: string; chatId: string } {
    try {
      const parsed = JSON.parse(tokenData);
      return {
        botToken: parsed.botToken,
        chatId: normalizeTelegramChatId(parsed.chatId),
      };
    } catch {
      throw new Error('Invalid Telegram token format');
    }
  }
}

export const telegramAdapter = new TelegramAdapter();
