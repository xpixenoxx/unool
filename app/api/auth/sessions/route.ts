import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function extractJwtSessionId(accessToken?: string | null): string | null {
  if (!accessToken || typeof accessToken !== 'string') return null;
  const parts = accessToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      session_id?: string;
    };
    return typeof payload?.session_id === 'string' ? payload.session_id : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/auth/sessions
 * Lists active auth sessions for the authenticated user via get_user_auth_sessions RPC
 * when deployed, falling back cleanly to current-session metadata pre-migration.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    let currentSessionId: string | null = null;
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        currentSessionId = extractJwtSessionId(authHeader.slice(7).trim());
      }
      if (!currentSessionId) {
        const supabase = await createSupabaseServerClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        currentSessionId = extractJwtSessionId(session?.access_token);
      }
    } catch {
      // Non-fatal
    }

    try {
      const { data: rpcSessions, error: rpcErr } = await supabaseAdmin.rpc('get_user_auth_sessions', {
        p_user_id: auth.userId,
      });

      if (!rpcErr && Array.isArray(rpcSessions)) {
        const sessions = rpcSessions.map((row: Record<string, unknown>) => {
          const id = String(row.id ?? '');
          return {
            id,
            createdAt: (row.created_at as string | null) ?? null,
            updatedAt: (row.updated_at as string | null) ?? null,
            refreshedAt: (row.refreshed_at as string | null) ?? null,
            userAgent: (row.user_agent as string | null) ?? null,
            ip: (row.ip as string | null) ?? null,
            aal: (row.aal as string | null) ?? null,
            current: Boolean(currentSessionId && id === currentSessionId),
          };
        });

        return NextResponse.json(
          { sessions, source: 'rpc' },
          { status: 200, headers: NO_STORE_HEADERS }
        );
      }
    } catch {
      // RPC not yet deployed — fall through to current session summary
    }

    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(auth.userId);
    const user = userRes?.user;

    return NextResponse.json(
      {
        sessions: [
          {
            id: currentSessionId || 'current',
            createdAt: user?.last_sign_in_at || user?.created_at || null,
            updatedAt: user?.last_sign_in_at || null,
            refreshedAt: null,
            userAgent: request.headers.get('user-agent') || 'Current browser session',
            ip: null,
            aal: null,
            current: true,
          },
        ],
        source: 'current-fallback',
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logger.error('GET /api/auth/sessions failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to load sessions.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

