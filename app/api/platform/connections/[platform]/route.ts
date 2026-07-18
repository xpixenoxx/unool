import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { logger } from '@/lib/logger';

const platformRepository = new SupabasePlatformRepository();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const traceId = crypto.randomUUID();
  const { platform } = await params;

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['linkedin', 'x', 'threads'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const connection = await platformRepository.findByWorkspaceAndPlatform(auth.workspaceId, platform as 'linkedin' | 'x' | 'threads');
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    await platformRepository.delete(connection.id);

    logger.info('Platform disconnected', { traceId, workspaceId: auth.workspaceId, platform });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to disconnect platform', { traceId, platform, error: err });
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}