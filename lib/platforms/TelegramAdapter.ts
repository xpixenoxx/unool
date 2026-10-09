import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

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
        if (!data.ok) throw new Error(`Telegram media publish failed: ${data.description}`);
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
        if (!data.ok) throw new Error(`Telegram media group publish failed: ${data.description}`);
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
        throw new Error(`Telegram publish failed: ${data.description}`);
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

  private parseToken(tokenData: string): { botToken: string; chatId: string } {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid Telegram token format');
    }
  }
}

export const telegramAdapter = new TelegramAdapter();
