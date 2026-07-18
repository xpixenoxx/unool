/**
 * DEVELOPMENT-ONLY AUTHENTICATION BYPASS
 *
 * This module provides a temporary authentication bypass for local development only.
 * It is ONLY active when NODE_ENV === 'development' OR DEV_AUTH_BYPASS === 'true'.
 *
 * NEVER enable this in production. It creates a deterministic dev user/workspace
 * and sets authentication cookies to simulate a signed-in session.
 *
 * TO ENABLE: Set DEV_AUTH_BYPASS=true in .env.local (or rely on NODE_ENV=development)
 * TO DISABLE: Remove DEV_AUTH_BYPASS or set NODE_ENV=production
 *
 * REMOVAL: Delete this file and remove imports from:
 *   - lib/auth/server.ts
 *   - lib/auth/context.ts
 *   - middleware.ts (if added)
 *   - app/api/auth/dev-bypass/route.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { cookies } from 'next/headers';

// Check dev mode safely — do NOT throw at module load time.
// Throwing here crashes the Vercel production build because Next.js
// statically analyzes imports and loads this module even in production
// when it's referenced by getAuthContext().
const isDev = config.NODE_ENV === 'development' || config.DEV_AUTH_BYPASS === true;

// Deterministic dev identifiers (stable across restarts - must match middleware.ts)
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEV_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const DEV_EMAIL = 'dev@unool.local';
const DEV_FULL_NAME = 'Dev User';
const DEV_WORKSPACE_NAME = 'Development Workspace';

/**
 * Create Supabase admin client lazily (only when actually needed).
 * This prevents errors during build when env vars may not be fully available.
 */
function getSupabaseAdmin() {
  return createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Ensure the dev user and workspace exist in Supabase with fixed UUIDs.
 * Idempotent - safe to call multiple times.
 */
export async function ensureDevUserAndWorkspace(): Promise<{ userId: string; workspaceId: string }> {
  if (!isDev) {
    throw new Error('ensureDevUserAndWorkspace called in non-development environment');
  }

  const supabaseAdmin = getSupabaseAdmin();

  // 1. Ensure user exists in auth.users (via admin API) with fixed UUID
  const { data: existingUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(DEV_USER_ID);
  
  if (userError) {
    console.warn('[DevBypass] getUserById error (non-fatal):', userError.message);
  }
  
  if (!existingUser?.user) {
    // Try to create the user. If email already exists with different ID,
    // look up by email and use that user instead.
    const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      id: DEV_USER_ID,
      email: DEV_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: DEV_FULL_NAME },
    });

    if (createUserError) {
      if (createUserError.message?.includes('already been registered')) {
        // User exists with this email but different ID — find and use that user
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingByEmail = users?.find(u => u.email === DEV_EMAIL);
        if (existingByEmail) {
          console.log('[DevBypass] Using existing user with email:', DEV_EMAIL, 'id:', existingByEmail.id);
          // Use the existing user's ID instead of the hardcoded one
          return ensureDevWorkspace(supabaseAdmin, existingByEmail.id);
        }
      }
      console.warn('[DevBypass] createUser error (non-fatal):', createUserError.message);
    } else {
      console.log('[DevBypass] Created dev user:', createdUser?.user?.id);
    }
  }

  return ensureDevWorkspace(supabaseAdmin, DEV_USER_ID);
}

/**
 * Ensure workspace and membership exist for the given user ID.
 */
async function ensureDevWorkspace(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string
): Promise<{ userId: string; workspaceId: string }> {
  const { error: userUpsertError } = await admin.from('users').upsert({
    id: userId,
    email: DEV_EMAIL,
    full_name: DEV_FULL_NAME,
  }, { onConflict: 'id' });
  
  if (userUpsertError) {
    console.warn('[DevBypass] User upsert error (non-fatal):', userUpsertError.message);
  }

  // 3. Ensure workspace exists
  const { data: existingWs } = await admin
    .from('workspaces')
    .select('id')
    .eq('id', DEV_WORKSPACE_ID)
    .single();

  if (!existingWs) {
    const { error: wsInsertError } = await admin.from('workspaces').insert({
      id: DEV_WORKSPACE_ID,
      owner_id: userId,
      name: DEV_WORKSPACE_NAME,
      plan: 'pro',
    });
    if (wsInsertError) {
      console.warn('[DevBypass] Workspace insert error (non-fatal):', wsInsertError.message);
    }
  }

  // 4. Ensure workspace membership
  const { error: memberError } = await admin.from('workspace_members').upsert({
    workspace_id: DEV_WORKSPACE_ID,
    user_id: userId,
    role: 'owner',
  }, { onConflict: 'workspace_id,user_id' });

  if (memberError) {
    console.warn('[DevBypass] Membership upsert error (non-fatal):', memberError.message);
  }

  // 5. Ensure a default profile exists
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('workspace_id', DEV_WORKSPACE_ID)
    .single();

  if (!existingProfile) {
    const { error: profileError } = await admin.from('profiles').insert({
      workspace_id: DEV_WORKSPACE_ID,
      user_id: userId,
      subdomain: 'dev',
      name: 'Dev User',
      headline: 'Building Unool locally',
      bio: 'Development profile for local testing',
      role: 'Founder',
      company: 'Unool',
      links: [],
      proof_points: [],
      theme: { preset: 'minimal' },
    });
    if (profileError) {
      console.warn('[DevBypass] Profile insert error (non-fatal):', profileError.message);
    }
  }

  return { userId, workspaceId: DEV_WORKSPACE_ID };
}

/**
 * Set development authentication cookies on the response.
 * This simulates a Supabase session for the dev user.
 */
export async function setDevAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  const sessionData = {
    access_token: `dev-token-${DEV_EMAIL}`,
    refresh_token: `dev-refresh-${DEV_EMAIL}`,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: DEV_USER_ID,
      email: DEV_EMAIL,
      user_metadata: { full_name: DEV_FULL_NAME },
    },
  };

  const sessionJson = JSON.stringify(sessionData);
  const projectRef = config.SUPABASE_PROJECT_ID || 'local';

  cookieStore.set(`sb-${projectRef}-auth-token`, sessionJson, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });

  cookieStore.set('dev-auth-bypass', 'true', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });
}

/**
 * Clear development authentication cookies.
 */
export async function clearDevAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  const projectRef = config.SUPABASE_PROJECT_ID || 'local';

  cookieStore.set(`sb-${projectRef}-auth-token`, '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  cookieStore.set('dev-auth-bypass', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Get the dev auth context (userId + workspaceId) synchronously.
 * Returns cached IDs or deterministic placeholders.
 * Only works in development mode.
 */
export function getDevAuthContext(): { userId: string; workspaceId: string } | null {
  if (!isDev) return null;
  return { userId: DEV_USER_ID, workspaceId: DEV_WORKSPACE_ID };
}

/**
 * Check if dev bypass is currently enabled.
 */
export function isDevAuthEnabled(): boolean {
  return isDev;
}

/**
 * Async version that returns actual IDs (for use in server.ts)
 */
export async function getDevAuthContextAsync(): Promise<{ userId: string; workspaceId: string } | null> {
  if (!isDev) return null;
  return ensureDevUserAndWorkspace();
}