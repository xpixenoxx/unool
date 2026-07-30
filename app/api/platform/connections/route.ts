import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';
import { SUPPORTED_PLATFORMS } from '@/lib/platforms';

const platformRepository = new SupabasePlatformRepository();

export async function GET(request: NextRequest) {
  const traceId = crypto.randomUUID();

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await platformRepository.findByWorkspaceId(auth.workspaceId);

    // Initialize result with all supported platforms
    const result: Record<string, { platform: string; status: string; username?: string; connectedAt?: string; expiresAt?: string }> = {};
    for (const platform of SUPPORTED_PLATFORMS) {
      result[platform] = { platform, status: 'not_connected' };
    }

    for (const conn of connections) {
      const now = new Date();
      const expiresAt = conn.expiresAt ? new Date(conn.expiresAt) : null;
      const isExpired = expiresAt && expiresAt <= now;

      result[conn.platform] = {
        platform: conn.platform,
        status: isExpired ? 'expired' : 'connected',
        username: conn.username ?? undefined,
        connectedAt: conn.createdAt?.toISOString(),
        expiresAt: conn.expiresAt?.toISOString(),
      };
    }

    logger.info('Platform connections fetched', { traceId, workspaceId: auth.workspaceId });
    return NextResponse.json({ connections: result });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to fetch platform connections', { traceId, error: err });
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}