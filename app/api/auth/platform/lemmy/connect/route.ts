import { NextRequest, NextResponse } from 'next/server';
import { lemmyAdapter } from '@/lib/platforms/LemmyAdapter';
import { encryptToken } from '@/lib/crypto/encryption';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { getAuthContext } from '@/lib/auth/context';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const platformRepo = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      instanceUrl,
      username,
      password,
      jwt: providedJwt,
      community,
      workspaceId: bodyWorkspaceId,
    } = body;

    if (!instanceUrl || (!providedJwt && (!username || !password))) {
      return NextResponse.json(
        {
          error:
            'Lemmy instance URL and either (Username & Password) or API Token (JWT) are required.',
        },
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

    // Normalize instance URL (strip protocol and trailing slash)
    const normalizedInstance = instanceUrl
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '');

    let activeJwt = providedJwt ? providedJwt.trim() : '';

    // If username and password are provided, authenticate via Lemmy API
    if (!activeJwt && username && password) {
      try {
        const loginRes = await fetch(
          `https://${normalizedInstance}/api/v3/user/login`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              username_or_email: username.trim(),
              password,
            }),
          }
        );

        if (!loginRes.ok) {
          const errText = await loginRes.text();
          logger.warn('Lemmy login failed', {
            status: loginRes.status,
            errText,
            instance: normalizedInstance,
          });
          return NextResponse.json(
            {
              error:
                loginRes.status === 400 || loginRes.status === 401
                  ? 'Invalid Lemmy username or password on this instance.'
                  : `Failed to log in to Lemmy instance (${loginRes.status}). Please check instance URL and credentials.`,
            },
            { status: 400 }
          );
        }

        const loginData = await loginRes.json();
        if (!loginData.jwt) {
          return NextResponse.json(
            { error: 'No authentication token returned by Lemmy instance.' },
            { status: 400 }
          );
        }
        activeJwt = loginData.jwt;
      } catch (netErr) {
        logger.error('Lemmy instance login network error', {
          error: netErr instanceof Error ? netErr : new Error(String(netErr)),
        });
        return NextResponse.json(
          {
            error: `Could not connect to Lemmy instance at "${normalizedInstance}". Check the domain URL.`,
          },
          { status: 400 }
        );
      }
    }

    // Validate the token and fetch user profile
    let profile;
    try {
      profile = await lemmyAdapter.getUserProfile(
        JSON.stringify({ instanceUrl: normalizedInstance, jwt: activeJwt })
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn('Lemmy connect profile verification failed', { errMsg });
      return NextResponse.json(
        {
          error:
            'Could not authenticate with Lemmy instance. Please check your token or credentials.',
        },
        { status: 400 }
      );
    }

    // If a community was specified, look up and validate its ID
    let communityId: number | undefined;
    let cleanCommunity: string | undefined;

    if (community && community.trim()) {
      const targetCommunity = community
        .trim()
        .replace(/^c\//i, '')
        .replace(/@.*$/, '');
      cleanCommunity = targetCommunity;

      try {
        const commRes = await fetch(
          `https://${normalizedInstance}/api/v3/community?name=${encodeURIComponent(
            targetCommunity
          )}&auth=${encodeURIComponent(activeJwt)}`,
          {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${activeJwt}`,
            },
          }
        );

        if (commRes.ok) {
          const commData = await commRes.json();
          communityId = commData.community_view?.community?.id;
        } else {
          return NextResponse.json(
            {
              error: `Community "c/${targetCommunity}" was not found on this instance. Please enter an existing community or leave blank.`,
            },
            { status: 400 }
          );
        }
      } catch (commErr) {
        logger.warn('Lemmy community verification warning', {
          error: commErr instanceof Error ? commErr : new Error(String(commErr)),
          community: targetCommunity,
        });
      }
    }

    // Encrypt token payload for persistent storage
    const tokenPayload = JSON.stringify({
      instanceUrl: normalizedInstance,
      jwt: activeJwt,
      community: cleanCommunity,
      communityId,
    });

    const encryptedToken = await encryptToken(tokenPayload);

    // Save platform connection in DB
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'lemmy',
      platformUserId: profile.platformUserId,
      username: profile.username || profile.displayName || 'Lemmy User',
      accessToken: encryptedToken,
      refreshToken: '', // not used
      expiresAt: undefined, // Lemmy JWTs do not periodically expire via standard OAuth
      scopes: [],
    });

    logger.info('Lemmy connected successfully', {
      workspaceId,
      instance: normalizedInstance,
      username: profile.username,
      community: cleanCommunity,
    });

    return NextResponse.json({
      success: true,
      platform: 'lemmy',
      username: profile.username || profile.displayName,
      displayName: profile.displayName,
      community: cleanCommunity,
      instanceUrl: normalizedInstance,
    });
  } catch (error) {
    const errorDetails =
      error instanceof Error ? error.message : JSON.stringify(error);
    logger.error('Lemmy connect: unexpected error', { errorDetails });
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${errorDetails}. Please try again.`,
      },
      { status: 500 }
    );
  }
}
