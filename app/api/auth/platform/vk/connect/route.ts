import { NextRequest, NextResponse } from 'next/server';
import { vkAdapter } from '@/lib/platforms/VKAdapter';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { getAuthContext } from '@/lib/auth/context';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, communityName, workspaceId: bodyWorkspaceId } = body;

    if (!webhookUrl || !communityName) {
      return NextResponse.json(
        { error: 'webhookUrl and communityName are required' },
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

    const tokenPayload = JSON.stringify({ webhookUrl, communityName });

    // Validate credentials & fetch profile (simulated for webhooks)
    let profile;
    try {
      profile = await vkAdapter.getUserProfile(tokenPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn('VK connect: login failed', { errMsg });

      return NextResponse.json({ error: 'Could not connect VK community. Please check your details.' }, { status: 400 });
    }

    // Encrypt the token payload for storage
    const encryptedToken = await encryptToken(tokenPayload);

    // Upsert platform connection
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'vk',
      platformUserId: profile.platformUserId,
      username: profile.username,
      accessToken: encryptedToken,
      refreshToken: '', // not used
      expiresAt: undefined, // no expiration
      scopes: [],
    });

    logger.info('VK connected successfully', { workspaceId });

    return NextResponse.json({
      success: true,
      platform: 'vk',
      username: profile.username,
      displayName: profile.displayName,
    });
  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : JSON.stringify(error);
    logger.error('VK connect: unexpected error', { errorDetails });
    return NextResponse.json(
      { error: `An unexpected error occurred: ${errorDetails}. Please try again.` },
      { status: 500 }
    );
  }
}
