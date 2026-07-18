/**
 * DEVELOPMENT-ONLY AUTH BYPASS ENDPOINT
 *
 * Creates/retrieves a deterministic dev user + workspace and sets auth cookies.
 * Only works when NODE_ENV=development or DEV_AUTH_BYPASS=true.
 *
 * Usage: GET /api/auth/dev-bypass
 * Then visit any protected page (e.g., /dashboard/composer)
 */

import { NextResponse } from 'next/server';
import { ensureDevUserAndWorkspace, setDevAuthCookies, isDevAuthEnabled } from '@/lib/auth/dev/bypass';

export async function GET() {
  if (!isDevAuthEnabled()) {
    return NextResponse.json(
      { error: 'Dev bypass only available in development' },
      { status: 403 }
    );
  }

  try {
    const { userId, workspaceId } = await ensureDevUserAndWorkspace();
    await setDevAuthCookies();

    return NextResponse.json({
      success: true,
      message: 'Dev user/workspace ready. Dev bypass active in API routes.',
      devUser: { id: userId, email: 'dev@unool.local' },
      devWorkspace: { id: workspaceId },
      note: 'Server-side auth (lib/auth/server.ts, lib/auth/context.ts) now returns dev context automatically',
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Dev bypass setup failed:', err);
    return NextResponse.json({ error: 'Dev bypass setup failed', details: err.message }, { status: 500 });
  }
}