import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole, verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { logger } from '@/lib/logger';
import { encryptToken, decryptToken } from '@/lib/crypto/encryption';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { invalidateConnectionsCache } from '@/lib/cache/connectionsCache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId: bodyWorkspaceId, connectionId, streamUrl, streamKey } = body;

    const workspaceId = bodyWorkspaceId || auth.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, workspaceId, ['owner', 'admin', 'editor']);
    if (!roleCheck.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!streamUrl || !streamKey) {
      return NextResponse.json({ error: 'Stream URL and Stream Key are required' }, { status: 400 });
    }

    const trimmedUrl = String(streamUrl).trim();
    const trimmedKey = String(streamKey).trim();

    if (!trimmedUrl.startsWith('rtmp://') && !trimmedUrl.startsWith('rtmps://')) {
      return NextResponse.json({ error: 'Stream URL must start with rtmp:// or rtmps://' }, { status: 400 });
    }

    // Fetch targeted Kick connection (or most recently updated Kick connection in workspace)
    let connQuery = supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'kick');
    if (typeof connectionId === 'string' && connectionId.trim()) {
      connQuery = connQuery.eq('id', connectionId.trim());
    }

    const { data: connection, error: fetchErr } = await connQuery
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !connection) {
      return NextResponse.json(
        { error: 'Kick account not connected. Please connect your Kick account first.' },
        { status: 404 }
      );
    }

    // Decrypt existing token to preserve the OAuth access token if possible
    let currentAccessToken = '';
    if (connection.access_token_encrypted) {
      try {
        const decrypted = await decryptToken(connection.access_token_encrypted);
        try {
          const parsed = JSON.parse(decrypted);
          currentAccessToken = parsed.accessToken || decrypted;
        } catch {
          currentAccessToken = decrypted;
        }
      } catch (err) {
        logger.warn('Could not decrypt existing Kick access token, proceeding with stream settings update', { err });
        currentAccessToken = connection.access_token_encrypted;
      }
    }

    // Normalize stream URL (:443/app)
    let cleanStreamUrl = trimmedUrl.replace(/\/+$/, '');
    if (cleanStreamUrl.startsWith('rtmps://') && !cleanStreamUrl.includes(':443') && !cleanStreamUrl.match(/:\d+/)) {
      cleanStreamUrl = cleanStreamUrl.replace(/(rtmps:\/\/[^/:]+)/, '$1:443');
    }
    if (!cleanStreamUrl.endsWith('/app')) {
      cleanStreamUrl = `${cleanStreamUrl.replace(/\/+$/, '')}/app`;
    }

    // Encrypt combined payload with stream settings
    const tokenPayload = JSON.stringify({
      accessToken: currentAccessToken,
      streamUrl: cleanStreamUrl,
      streamKey: trimmedKey,
    });

    const encryptedToken = await encryptToken(tokenPayload);

    const { error: updateErr } = await supabaseAdmin
      .from('platform_connections')
      .update({
        access_token_encrypted: encryptedToken,
        status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    if (updateErr) {
      logger.error('Failed to update Kick stream settings in DB', { updateErr });
      return NextResponse.json({ error: 'Failed to save stream settings' }, { status: 500 });
    }

    await invalidateConnectionsCache(workspaceId);
    logger.info('Kick stream settings saved successfully', { workspaceId });

    return NextResponse.json({
      success: true,
      streamConfigured: true,
    });
  } catch (error) {
    logger.error('Kick stream settings endpoint error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || auth.workspaceId;
    const connectionId = searchParams.get('connectionId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const hasAccess = await verifyWorkspaceAccess(auth.userId, workspaceId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let connQuery = supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'kick');
    if (connectionId) {
      connQuery = connQuery.eq('id', connectionId);
    }

    const { data: connection } = await connQuery
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json({ configured: false });
    }

    let streamUrl = '';
    let hasStreamKey = false;
    try {
      const decrypted = await decryptToken(connection.access_token_encrypted);
      const parsed = JSON.parse(decrypted);
      if (parsed && typeof parsed === 'object') {
        streamUrl = parsed.streamUrl || '';
        hasStreamKey = Boolean(parsed.streamKey);
      }
    } catch {}

    return NextResponse.json({
      configured: Boolean(streamUrl && hasStreamKey),
      streamUrl,
      hasStreamKey,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

