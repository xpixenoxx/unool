import { NextRequest, NextResponse } from 'next/server';
import { BlueskyAdapter } from '@/lib/platforms/BlueskyAdapter';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { getAuthContext } from '@/lib/auth/context';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const platformRepo = new SupabasePlatformRepository();
const adapter = new BlueskyAdapter();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle, appPassword, workspaceId: bodyWorkspaceId } = body;

    if (!handle || !appPassword) {
      return NextResponse.json(
        { error: 'handle and appPassword are required' },
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

    // Normalise handle — strip leading @
    const normalisedHandle = handle.replace(/^@/, '').toLowerCase();

    // The "token" we store is a JSON blob with handle + app password
    const tokenPayload = JSON.stringify({ handle: normalisedHandle, appPassword });

    // Validate credentials & fetch profile by calling getUserProfile
    let profile;
    try {
      profile = await adapter.getUserProfile(tokenPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn('Bluesky connect: login failed', { handle: normalisedHandle, errMsg });

      // Give specific feedback based on the error
      let userFacingError = 'Could not log in to Bluesky. Please check your handle and App Password.';
      if (errMsg.includes('Authentication Required') || errMsg.includes('Invalid identifier') || errMsg.includes('Invalid password') || errMsg.includes('401')) {
        userFacingError = 'Wrong handle or App Password. Make sure you are using an App Password from Bluesky Settings → App Passwords, NOT your regular login password.';
      } else if (errMsg.includes('not found') || errMsg.includes('404')) {
        userFacingError = `Handle "${normalisedHandle}" was not found on Bluesky. Please check it is correct (e.g. yourname.bsky.social).`;
      } else if (errMsg.includes('fetch') || errMsg.includes('network') || errMsg.includes('ENOTFOUND')) {
        userFacingError = 'Could not reach Bluesky servers. Please try again in a moment.';
      }

      return NextResponse.json({ error: userFacingError }, { status: 400 });
    }

    // Encrypt the token payload for storage
    const encryptedToken = await encryptToken(tokenPayload);

    // Upsert platform connection
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'bluesky',
      platformUserId: profile.platformUserId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      accessToken: encryptedToken,
      refreshToken: '', // required by interface, but unused
      expiresAt: undefined, // app passwords don't expire
      scopes: [],
    });

    logger.info('Bluesky connected successfully', { workspaceId, handle: normalisedHandle });

    return NextResponse.json({
      success: true,
      platform: 'bluesky',
      username: profile.username,
      displayName: profile.displayName,
    });
  } catch (error) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Bluesky connect: unexpected error', { error: errObj });
    return NextResponse.json(
      { error: `An unexpected error occurred: ${errObj.message}. Please try again.` },
      { status: 500 }
    );
  }
}
