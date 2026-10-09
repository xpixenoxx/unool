import { NextRequest, NextResponse } from 'next/server';
import { slackAdapter } from '@/lib/platforms/SlackAdapter';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { getAuthContext } from '@/lib/auth/context';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, channel, workspaceId: bodyWorkspaceId } = body;

    if (!channel || !accessToken) {
      return NextResponse.json(
        { error: 'channel and accessToken are required' },
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

    // Format channel
    const formattedChannel = channel.startsWith('#') ? channel : `#${channel}`;
    const tokenPayload = JSON.stringify({ accessToken, defaultChannel: formattedChannel });

    // Validate credentials & fetch profile
    let profile;
    try {
      profile = await slackAdapter.getUserProfile(tokenPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn('Slack connect: login failed', { errMsg });

      let userFacingError = 'Could not log in to Slack. Please check your Access Token.';
      if (errMsg.includes('invalid_auth')) {
        userFacingError = 'Invalid Access Token. Make sure the token is active and correct.';
      }

      return NextResponse.json({ error: userFacingError }, { status: 400 });
    }

    // Encrypt the token payload for storage
    const encryptedToken = await encryptToken(tokenPayload);

    // Upsert platform connection
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'slack',
      platformUserId: profile.platformUserId,
      username: profile.username,
      accessToken: encryptedToken,
      refreshToken: '', // not used
      expiresAt: undefined, // no expiration
      scopes: [],
    });

    logger.info('Slack connected successfully', { workspaceId, channel: formattedChannel });

    return NextResponse.json({
      success: true,
      platform: 'slack',
      username: profile.username,
      displayName: profile.displayName,
    });
  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : JSON.stringify(error);
    logger.error('Slack connect: unexpected error', { errorDetails });
    return NextResponse.json(
      { error: `An unexpected error occurred: ${errorDetails}. Please try again.` },
      { status: 500 }
    );
  }
}
