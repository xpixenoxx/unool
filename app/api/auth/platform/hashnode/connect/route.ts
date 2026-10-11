import { NextRequest, NextResponse } from 'next/server';
import { hashnodeAdapter, type HashnodePublication } from '@/lib/platforms/HashnodeAdapter';
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
      personalAccessToken,
      publicationId: bodyPubId,
      publicationHost,
      workspaceId: bodyWorkspaceId,
    } = body;

    const rawToken = hashnodeAdapter.cleanToken(personalAccessToken || '');

    if (!rawToken) {
      return NextResponse.json(
        { error: 'Personal Access Token (PAT) is required.' },
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

    // 1. Validate credentials & retrieve user profile
    let profile;
    try {
      profile = await hashnodeAdapter.getUserProfile(rawToken);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn('Hashnode connect: profile fetch failed', { errMsg });

      return NextResponse.json(
        {
          error:
            'Could not connect to Hashnode. Please verify your Personal Access Token in Developer Settings.',
        },
        { status: 400 }
      );
    }

    // 2. Fetch publications associated with user
    let publications: HashnodePublication[] = [];
    try {
      publications = await hashnodeAdapter.fetchPublications(rawToken);
    } catch (err) {
      logger.warn('Hashnode connect: publications query failed', {
        err: err instanceof Error ? err.message : String(err),
      });
    }

    // 3. Resolve target publication
    let selectedPubId = bodyPubId?.trim();
    let selectedPubTitle = '';
    let selectedPubUrl = '';

    if (publicationHost?.trim()) {
      const matchedPub = await hashnodeAdapter.resolvePublicationByHost(rawToken, publicationHost.trim());
      if (matchedPub) {
        selectedPubId = matchedPub.id;
        selectedPubTitle = matchedPub.title;
        selectedPubUrl = matchedPub.url;
      }
    }

    if (!selectedPubId && publications.length > 0) {
      selectedPubId = publications[0].id;
      selectedPubTitle = publications[0].title;
      selectedPubUrl = publications[0].url;
    } else if (selectedPubId && publications.length > 0) {
      const found = publications.find((p) => p.id === selectedPubId);
      if (found) {
        selectedPubTitle = found.title;
        selectedPubUrl = found.url;
      }
    }

    // Encrypt token payload for persistent storage
    const tokenPayload = JSON.stringify({
      personalAccessToken: rawToken,
      publicationId: selectedPubId || '',
      publicationTitle: selectedPubTitle || '',
      publicationUrl: selectedPubUrl || '',
      username: profile.username,
    });

    const encryptedToken = await encryptToken(tokenPayload);

    // Save platform connection in DB
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'hashnode',
      platformUserId: profile.platformUserId,
      username: profile.username,
      accessToken: encryptedToken,
      refreshToken: '',
      expiresAt: undefined, // PAT does not expire on fixed OAuth interval
      scopes: [],
    });

    logger.info('Hashnode connected successfully', {
      workspaceId,
      username: profile.username,
      publicationId: selectedPubId,
    });

    return NextResponse.json({
      success: true,
      platform: 'hashnode',
      username: profile.username,
      displayName: profile.displayName,
      publication: selectedPubId
        ? { id: selectedPubId, title: selectedPubTitle, url: selectedPubUrl }
        : null,
      availablePublications: publications,
    });
  } catch (error) {
    const errorDetails =
      error instanceof Error ? error.message : JSON.stringify(error);
    const errObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Hashnode connect: unexpected error', { error: errObj });
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${errorDetails}. Please try again.`,
      },
      { status: 500 }
    );
  }
}
