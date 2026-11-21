import { NextRequest, NextResponse } from 'next/server';
import { telegramAdapter, normalizeTelegramChatId } from '@/lib/platforms/TelegramAdapter';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { resolvePlatformConnectContext, enforceCustomChannelQuota } from '@/lib/auth/platform-connect';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botToken, chatId, workspaceId: bodyWorkspaceId } = body;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'botToken and chatId are required' },
        { status: 400 }
      );
    }

    const normalizedChatId = normalizeTelegramChatId(chatId);

    const resolved = await resolvePlatformConnectContext(request, bodyWorkspaceId, { skipQuotaCheck: true });
    if ('error' in resolved) return resolved.error;
    const { userId, workspaceId } = resolved.context;

    const tokenPayload = JSON.stringify({ botToken, chatId: normalizedChatId });

    // Validate credentials & fetch profile
    let profile;
    try {
      profile = await telegramAdapter.getUserProfile(tokenPayload);

      // Verify chat access
      const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(normalizedChatId)}`);
      const chatData = await chatRes.json();
      if (!chatData.ok) {
        const desc = chatData.description || '';
        if (desc.toLowerCase().includes('chat not found')) {
          return NextResponse.json({
            error: `Telegram could not find chat "${normalizedChatId}". Make sure the username/ID is correct and your bot has been added as an Administrator to the channel.`,
          }, { status: 400 });
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn('Telegram connect: login failed', { errMsg });

      let userFacingError = 'Could not log in to Telegram. Please check your Bot Token and Chat ID.';
      if (errMsg.includes('Invalid bot token') || errMsg.includes('Unauthorized')) {
        userFacingError = 'Invalid Bot Token. Make sure you copied it correctly from BotFather.';
      } else if (errMsg.includes('chat not found')) {
        userFacingError = `Telegram chat "${normalizedChatId}" not found. Ensure your bot is added as an Administrator to the channel.`;
      }

      return NextResponse.json({ error: userFacingError }, { status: 400 });
    }

    const scopedPlatformUserId = `${profile.platformUserId}:${normalizedChatId}`;
    const quotaErr = await enforceCustomChannelQuota(request, resolved.context, 'telegram', scopedPlatformUserId);
    if (quotaErr) return quotaErr;

    // Encrypt the token payload for storage
    const encryptedToken = await encryptToken(tokenPayload);

    // Upsert platform connection (scope by bot + chat so multiple Telegram channels per bot are distinct)
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'telegram',
      platformUserId: scopedPlatformUserId,
      username: normalizedChatId || profile.username || chatId,
      displayName: profile.displayName || normalizedChatId,
      avatarUrl: profile.avatarUrl,
      accessToken: encryptedToken,
      refreshToken: '', // not used
      expiresAt: undefined, // no expiration
      scopes: [],
    });

    logger.info('Telegram connected successfully', { workspaceId });

    return NextResponse.json({
      success: true,
      platform: 'telegram',
      username: profile.username || profile.displayName || chatId,
      displayName: profile.displayName,
    });
  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : JSON.stringify(error);
    logger.error('Telegram connect: unexpected error', { errorDetails });
    return NextResponse.json(
      { error: `An unexpected error occurred: ${errorDetails}. Please try again.` },
      { status: 500 }
    );
  }
}
