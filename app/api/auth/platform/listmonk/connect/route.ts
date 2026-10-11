import { NextRequest, NextResponse } from 'next/server';
import { listmonkAdapter } from '@/lib/platforms/ListmonkAdapter';
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
      apiKey,
      listId,
      listName,
      sendImmediately = true,
      workspaceId: bodyWorkspaceId,
    } = body;

    if (!instanceUrl || !username || !apiKey) {
      return NextResponse.json(
        {
          error:
            'Listmonk instance URL, API Username, and API Key / Password are required.',
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

    const normalizedInstance = listmonkAdapter.normalizeInstanceUrl(instanceUrl);
    const trimmedUsername = username.trim();
    const trimmedApiKey = apiKey.trim();

    // Verify credentials and retrieve available lists
    let availableLists;
    try {
      availableLists = await listmonkAdapter.fetchLists({
        instanceUrl: normalizedInstance,
        username: trimmedUsername,
        apiKey: trimmedApiKey,
      });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      logger.warn('Listmonk credentials verification failed', {
        error: errorObj,
        instance: normalizedInstance,
      });
      return NextResponse.json(
        {
          error:
            'Could not authenticate with Listmonk. Please verify your instance URL, API username, and API key / password.',
        },
        { status: 400 }
      );
    }

    // Verify or select target list
    let selectedListId: number | undefined = listId ? Number(listId) : undefined;
    let selectedListName: string | undefined = listName;

    if (selectedListId && !isNaN(selectedListId)) {
      const found = availableLists.find(l => l.id === selectedListId);
      if (found) {
        selectedListName = found.name;
      }
    } else if (availableLists.length > 0) {
      selectedListId = availableLists[0].id;
      selectedListName = availableLists[0].name;
    }

    // Encrypt token payload for persistent storage
    const tokenPayload = JSON.stringify({
      instanceUrl: normalizedInstance,
      username: trimmedUsername,
      apiKey: trimmedApiKey,
      listId: selectedListId,
      listName: selectedListName,
      sendImmediately: Boolean(sendImmediately),
    });

    const encryptedToken = await encryptToken(tokenPayload);

    let host = normalizedInstance;
    try {
      host = new URL(normalizedInstance).hostname;
    } catch {
      // keep host as is
    }

    // Save platform connection in DB
    await platformRepo.create({
      workspaceId,
      userId: userId || workspaceId,
      platform: 'listmonk',
      platformUserId: trimmedUsername,
      username: `${trimmedUsername}@${host}`,
      accessToken: encryptedToken,
      refreshToken: '',
      expiresAt: undefined,
      scopes: [],
    });

    logger.info('Listmonk connected successfully', {
      workspaceId,
      instance: normalizedInstance,
      username: trimmedUsername,
      selectedListId,
    });

    return NextResponse.json({
      success: true,
      platform: 'listmonk',
      username: `${trimmedUsername}@${host}`,
      instanceUrl: normalizedInstance,
      lists: availableLists,
      selectedList: selectedListId
        ? { id: selectedListId, name: selectedListName }
        : null,
    });
  } catch (error) {
    const errorDetails =
      error instanceof Error ? error.message : JSON.stringify(error);
    const errObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Listmonk connect: unexpected error', { error: errObj });
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${errorDetails}. Please try again.`,
      },
      { status: 500 }
    );
  }
}
