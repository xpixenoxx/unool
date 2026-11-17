import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { logger } from '@/lib/logger';

const switchWorkspaceSchema = z.object({
  workspaceId: z.string().uuid('Valid workspaceId UUID is required.'),
});

/**
 * POST /api/workspace/switch
 * Switches the authenticated user's active workspace context via an HTTP-only cookie
 * after verifying active membership or ownership.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const body = await request.json().catch(() => null);
    const parsed = switchWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid workspaceId.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { workspaceId } = parsed.data;
    const allowed = await verifyWorkspaceAccess(auth.userId, workspaceId);
    if (!allowed) {
      return NextResponse.json(
        { error: 'You do not have active access to that workspace.' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const response = NextResponse.json(
      { success: true, workspaceId },
      { status: 200, headers: NO_STORE_HEADERS }
    );
    response.cookies.set('active_workspace_id', workspaceId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (err) {
    logger.error('POST /api/workspace/switch failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to switch workspace.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

