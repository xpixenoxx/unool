import { NextRequest, NextResponse } from 'next/server';
import { mastodonAdapter } from '@/lib/platforms/MastodonAdapter';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { getAuthContext } from '@/lib/auth/context';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceUrl, accessToken, workspaceId: bodyWorkspaceId } = body;

    if (!instanceUrl || !accessToken) {
      return NextResponse.json(
        { error: 'instanceUrl and accessToken are required' },
        { status: 400 }
      );
    }

    // Resolve workspace and user
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

    // Normalize instance URL: remove protocol and trailing slashes
    let normalizedUrl = instanceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const tokenPayload = JSON.stringify({ instanceUrl: normalizedUrl, accessToken });

    // Validate credentials & fetch profile
    let profile;
    try {
      profile = await mastodonAdapter.getUserProfile(tokenPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn('Mastodon connect: login failed', { instanceUrl: normalizedUrl, errMsg });

      let userFacingError = 'Could not log in to Mastodon. Please check your Instance URL and Access Token.';
      if (errMsg.includes('401') || errMsg.includes('login failed')) {
        userFacingError = 'Invalid Access Token or Instance URL. Make sure the token is active.';
      } else if (errMsg.includes('fetch') || errMsg.includes('network')) {
        userFacingError = 'Could not reach the instance server. Is the URL correct?';
      }

      return NextResponse.json({ error: userFacingError }, { status: 400 });
    }

    // Encrypt the token payload for storage
    const encryptedToken = await encryptToken(tokenPayload);

    // Upsert platform connection
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'mastodon',
      platformUserId: profile.platformUserId,
      username: profile.username,
      accessToken: encryptedToken,
      refreshToken: '', // not used
      expiresAt: undefined, // no expiration for PAT
      scopes: [],
    });

    logger.info('Mastodon connected successfully', { workspaceId, instanceUrl: normalizedUrl });

    return NextResponse.json({
      success: true,
      platform: 'mastodon',
      username: profile.username,
      displayName: profile.displayName,
    });
  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : JSON.stringify(error);
    logger.error('Mastodon connect: unexpected error', { errorDetails });
    return NextResponse.json(
      { error: `An unexpected error occurred: ${errorDetails}. Please try again.` },
      { status: 500 }
    );
  }
}
