import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { config } from '@/lib/config/schema';

export interface AuthContext {
  userId: string;
  workspaceId: string;
}

/**
 * Get authenticated user and workspace from request cookies
 * Returns null if not authenticated
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  // Development bypass: use dev user without requiring real auth
  // Only activate in actual dev runtime, never during production builds.
  // During `next build`, NODE_ENV is 'production' regardless of .env settings,
  // but DEV_AUTH_BYPASS might still be 'true' if set in the environment.
  // We guard against this by checking NODE_ENV explicitly.
  if (config.NODE_ENV === 'development' || (config.DEV_AUTH_BYPASS === true && process.env.NODE_ENV !== 'production')) {
    try {
      // Dynamic import to prevent the module from being loaded/evaluated
      // during production builds (tree-shaking won't help with side effects)
      const { getDevAuthContextAsync, isDevAuthEnabled } = await import('@/lib/auth/dev/bypass');
      if (isDevAuthEnabled()) {
        const devContext = await getDevAuthContextAsync();
        if (devContext) {
          return devContext;
        }
      }
    } catch (err) {
      // Dev bypass unavailable — fall through to normal auth
      console.warn('[Auth] Dev bypass import failed (expected in production):', err instanceof Error ? err.message : err);
    }
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    config.SUPABASE_URL,
    config.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
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
    // No service role key available - use user ID as workspace ID for single-user mode
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
      return { userId: user.id, workspaceId: workspace.id };
    }

    return { userId: user.id, workspaceId: user.id };
  }

  return { userId: user.id, workspaceId: membership.workspace_id };
}

import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  return createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
}

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