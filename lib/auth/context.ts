import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { config } from '@/lib/config/schema';
import { createClient } from '@supabase/supabase-js';

export interface AuthContext {
  userId: string;
  workspaceId: string;
}

// In-memory workspace cache with 5-minute TTL to eliminate DB queries on every page transition
const workspaceMemoryCache = new Map<string, { workspaceId: string; expiresAt: number }>();

function createServiceClient() {
  return createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Fast synchronous decode of user ID from the Supabase auth cookie
 * Returns userId if valid and unexpired (with 30s buffer)
 */
function extractUserFromCookieStore(cookieStore: Awaited<ReturnType<typeof cookies>>): { userId: string } | null {
  try {
    const all = cookieStore.getAll();
    const tokenChunks = all
      .filter((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!tokenChunks.length) return null;

    let rawValue = tokenChunks.map((c) => c.value).join('');
    if (!rawValue) return null;

    if (rawValue.startsWith('base64-')) {
      try {
        rawValue = Buffer.from(rawValue.slice(7), 'base64').toString('utf8');
      } catch {
        // Continue with raw
      }
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      try {
        parsed = JSON.parse(decodeURIComponent(rawValue));
      } catch {
        return null;
      }
    }

    let accessToken: string | undefined;
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
      accessToken = parsed[0];
    } else if (parsed && typeof parsed === 'object') {
      accessToken = parsed.access_token || parsed.token;
    }

    if (!accessToken || typeof accessToken !== 'string') return null;

    const parts = accessToken.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (!payload || !payload.sub) return null;

    // Check expiry with 30s buffer
    const exp = typeof payload.exp === 'number' ? payload.exp : 0;
    const nowSec = Math.floor(Date.now() / 1000);
    if (exp && exp < nowSec + 30) {
      return null; // Expired, fallback to normal auth
    }

    return { userId: payload.sub };
  } catch {
    return null;
  }
}

/**
 * Get authenticated user and workspace from request cookies
 * Returns null if not authenticated
 */
export const getAuthContext = cache(async function getAuthContext(): Promise<AuthContext | null> {
  // Development bypass: use dev user without requiring real auth
  // Only activate in actual dev runtime, never during production builds.
  if (config.DEV_AUTH_BYPASS === true) {
    try {
      const { getDevAuthContextAsync, isDevAuthEnabled } = await import('@/lib/auth/dev/bypass');
      if (isDevAuthEnabled()) {
        const devContext = await getDevAuthContextAsync();
        if (devContext) {
          return devContext;
        }
      }
    } catch (err) {
      console.warn('[Auth] Dev bypass import failed (expected in production):', err instanceof Error ? err.message : err);
    }
  }

  // Fast-path 1: Check request headers (injected by middleware or upstream)
  try {
    const headerStore = await headers();
    const headerUserId = headerStore.get('x-user-id');
    const headerWorkspaceId = headerStore.get('x-workspace-id');
    if (headerUserId && headerWorkspaceId) {
      return { userId: headerUserId, workspaceId: headerWorkspaceId };
    }
  } catch {
    // headers() might not be available in some contexts
  }

  const cookieStore = await cookies();

  // Fast-path 2: Synchronous JWT extract from cookie + in-memory workspace cache (<0.1ms)
  const quickUser = extractUserFromCookieStore(cookieStore);
  if (quickUser) {
    const cached = workspaceMemoryCache.get(quickUser.userId);
    if (cached && cached.expiresAt > Date.now()) {
      return { userId: quickUser.userId, workspaceId: cached.workspaceId };
    }

    // Resolve workspace once and cache it
    const adminClient = config.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : null;
    if (!adminClient) {
      return { userId: quickUser.userId, workspaceId: quickUser.userId };
    }

    try {
      const { data: membership } = await adminClient
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', quickUser.userId)
        .single();

      if (membership?.workspace_id) {
        workspaceMemoryCache.set(quickUser.userId, {
          workspaceId: membership.workspace_id,
          expiresAt: Date.now() + 5 * 60 * 1000, // 5 min TTL
        });
        return { userId: quickUser.userId, workspaceId: membership.workspace_id };
      }
    } catch {
      // Fall through to normal client auth
    }
  }

  // Fallback: Full Supabase SSR verification
  const supabase = createServerClient(
    config.SUPABASE_URL,
    config.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored from Server Component
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's workspace (first one they belong to)
  const adminClient = config.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient()
    : null;

  if (!adminClient) {
    return { userId: user.id, workspaceId: user.id };
  }

  const { data: membership } = await adminClient
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    // User has no workspace - create a default one for them
    const { data: workspace } = await adminClient
      .from('workspaces')
      .insert({ owner_id: user.id, name: 'Personal Workspace', plan: 'free' })
      .select('id')
      .single();

    if (workspace) {
      await adminClient.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      });
      workspaceMemoryCache.set(user.id, {
        workspaceId: workspace.id,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      return { userId: user.id, workspaceId: workspace.id };
    }

    return { userId: user.id, workspaceId: user.id };
  }

  workspaceMemoryCache.set(user.id, {
    workspaceId: membership.workspace_id,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return { userId: user.id, workspaceId: membership.workspace_id };
});

/**
 * Extract auth headers for API routes
 * Sets x-user-id and x-workspace-id headers for downstream use
 */
export async function setAuthHeaders(headers: Headers): Promise<AuthContext | null> {
  const auth = await getAuthContext();
  if (auth) {
    headers.set('x-user-id', auth.userId);
    headers.set('x-workspace-id', auth.workspaceId);
  }
  return auth;
}