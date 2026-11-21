import { NextRequest, NextResponse } from 'next/server';
import { mastodonAdapter } from '@/lib/platforms/MastodonAdapter';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { resolvePlatformConnectContext, enforceCustomChannelQuota, validateExternalInstanceUrl } from '@/lib/auth/platform-connect';
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

    const resolved = await resolvePlatformConnectContext(request, bodyWorkspaceId, { skipQuotaCheck: true });
    if ('error' in resolved) return resolved.error;
    const { userId, workspaceId } = resolved.context;

    const instanceCheck = await validateExternalInstanceUrl(instanceUrl);
    if (!instanceCheck.ok) {
      return NextResponse.json({ error: instanceCheck.error }, { status: 400 });
    }
    // Normalize instance URL: remove protocol and trailing slashes
    const normalizedUrl = instanceCheck.origin.replace(/^https?:\/\//i, '').replace(/\/$/, '');

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

    const quotaErr = await enforceCustomChannelQuota(request, resolved.context, 'mastodon', profile.platformUserId);
    if (quotaErr) return quotaErr;

    // Encrypt the token payload for storage
    const encryptedToken = await encryptToken(tokenPayload);

    // Upsert platform connection
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'mastodon',
      platformUserId: profile.platformUserId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
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
