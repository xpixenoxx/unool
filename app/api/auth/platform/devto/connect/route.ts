import { NextRequest, NextResponse } from 'next/server';
import { devtoAdapter } from '@/lib/platforms/DevtoAdapter';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { getAuthContext } from '@/lib/auth/context';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, workspaceId: bodyWorkspaceId } = body;

    const rawToken = devtoAdapter.cleanToken(apiKey || '');

    if (!rawToken) {
      return NextResponse.json(
        { error: 'DEV.to API Key is required.' },
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

    // 1. Validate credentials & retrieve user profile from Dev.to
    let profile;
    try {
      profile = await devtoAdapter.getUserProfile(rawToken);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn('DEV.to connect: profile fetch failed', { errMsg });

      return NextResponse.json(
        {
          error:
            'Could not connect to DEV.to. Please verify your API Key in Settings > Extensions.',
        },
        { status: 400 }
      );
    }

    // 2. Encrypt token for storage
    const encryptedToken = await encryptToken(rawToken);

    // 3. Upsert platform connection in database
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'devto',
      platformUserId: profile.platformUserId,
      username: profile.username || profile.displayName || 'DEV Creator',
      accessToken: encryptedToken,
      refreshToken: '',
      expiresAt: undefined, // Dev.to API keys do not expire on OAuth intervals
      scopes: [],
    });

    logger.info('DEV.to connected successfully', {
      workspaceId,
      username: profile.username,
      platformUserId: profile.platformUserId,
    });

    return NextResponse.json({
      success: true,
      platform: 'devto',
      username: profile.username,
      displayName: profile.displayName,
      profileUrl: profile.profileUrl,
      avatarUrl: profile.avatarUrl,
    });
  } catch (error) {
    const errorDetails =
      error instanceof Error ? error.message : JSON.stringify(error);
    const errObj = error instanceof Error ? error : new Error(String(error));
    logger.error('DEV.to connect: unexpected error', { error: errObj });
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${errorDetails}. Please try again.`,
      },
      { status: 500 }
    );
  }
}
