import { NextRequest, NextResponse } from 'next/server';
import { telegramAdapter } from '@/lib/platforms/TelegramAdapter';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { getAuthContext } from '@/lib/auth/context';
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

    let workspaceId = bodyWorkspaceId;
    let userId = '';
    
    const authCtx = await getAuthContext();
    if (authCtx) {
      workspaceId = workspaceId || authCtx.workspaceId;
      userId = authCtx.userId;
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenPayload = JSON.stringify({ botToken, chatId });

    // Validate credentials & fetch profile
    let profile;
    try {
      profile = await telegramAdapter.getUserProfile(tokenPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn('Telegram connect: login failed', { errMsg });

      let userFacingError = 'Could not log in to Telegram. Please check your Bot Token and Chat ID.';
      if (errMsg.includes('Invalid bot token') || errMsg.includes('Unauthorized')) {
        userFacingError = 'Invalid Bot Token. Make sure you copied it correctly from BotFather.';
      }

      return NextResponse.json({ error: userFacingError }, { status: 400 });
    }

    // Encrypt the token payload for storage
    const encryptedToken = await encryptToken(tokenPayload);

    // Upsert platform connection
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'telegram',
      platformUserId: profile.platformUserId,
      username: profile.username || chatId,
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
