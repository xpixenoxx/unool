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

const isDev = config.NODE_ENV === 'development' || config.DEV_AUTH_BYPASS === true;

if (!isDev) {
  throw new Error('Dev auth bypass loaded in non-development environment. Check NODE_ENV/DEV_AUTH_BYPASS.');
}

// Deterministic dev identifiers (stable across restarts - must match middleware.ts)
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEV_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const DEV_EMAIL = 'dev@unool.local';
const DEV_FULL_NAME = 'Dev User';
const DEV_WORKSPACE_NAME = 'Development Workspace';

const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Ensure the dev user and workspace exist in Supabase with fixed UUIDs.
 * Idempotent - safe to call multiple times.
 */
export async function ensureDevUserAndWorkspace(): Promise<{ userId: string; workspaceId: string }> {
  // 1. Ensure user exists in auth.users (via admin API) with fixed UUID
  const { data: existingUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(DEV_USER_ID);
  console.log('[DEBUG DevBypass] User query result:', { existingUser: existingUser?.user?.id, userError });
  if (!existingUser?.user) {
    console.log('[DEBUG DevBypass] Creating new user');
    const { error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      id: DEV_USER_ID,
      email: DEV_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: DEV_FULL_NAME },
    });
    console.log('[DEBUG DevBypass] User create result:', { createUserError });
  }

  // 2. Ensure user profile in public.users
  console.log('[DEBUG DevBypass] Checking/upserting user profile');
  // First check if a user with this email exists
  const { data: existingUserProfile } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', DEV_EMAIL)
    .single();

  if (existingUserProfile) {
    // User exists with this email - update to use our DEV_USER_ID
    console.log('[DEBUG DevBypass] User exists with email, updating ID:', existingUserProfile.id);
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ id: DEV_USER_ID, full_name: DEV_FULL_NAME })
      .eq('email', DEV_EMAIL);
    console.log('[DEBUG DevBypass] User update result:', { updateError });
  } else {
    // No user with this email - upsert
    const { error: userUpsertError } = await supabaseAdmin.from('users').upsert({
      id: DEV_USER_ID,
      email: DEV_EMAIL,
      full_name: DEV_FULL_NAME,
    }, { onConflict: 'id' });
    console.log('[DEBUG DevBypass] User upsert result:', { userUpsertError });
  }

  // 3. Ensure workspace exists with fixed UUID
  const { data: existingWs, error: wsError } = await supabaseAdmin.from('workspaces').select('id').eq('id', DEV_WORKSPACE_ID).single();
  console.log('[DEBUG DevBypass] Workspace query result:', { existingWs, wsError });
  if (!existingWs) {
    console.log('[DEBUG DevBypass] Creating new workspace');
    const { error: wsInsertError } = await supabaseAdmin.from('workspaces').insert({
      id: DEV_WORKSPACE_ID,
      owner_id: DEV_USER_ID,
      name: DEV_WORKSPACE_NAME,
      plan: 'pro',
    });
    console.log('[DEBUG DevBypass] Workspace insert result:', { wsInsertError });
  } else {
    console.log('[DEBUG DevBypass] Workspace already exists:', existingWs);
  }

  // 4. Ensure workspace membership
  await supabaseAdmin.from('workspace_members').upsert({
    workspace_id: DEV_WORKSPACE_ID,
    user_id: DEV_USER_ID,
    role: 'owner',
  }, { onConflict: 'workspace_id,user_id' });

  // 5. Ensure a default profile exists for the dev user
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', DEV_USER_ID)
    .eq('workspace_id', DEV_WORKSPACE_ID)
    .single();

  console.log('[DEBUG DevBypass] Profile query result:', { existingProfile });

  if (!existingProfile) {
    console.log('[DEBUG DevBypass] Creating new profile');
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      workspace_id: DEV_WORKSPACE_ID,
      user_id: DEV_USER_ID,
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
    console.log('[DEBUG DevBypass] Profile insert result:', { profileError });
  } else {
    console.log('[DEBUG DevBypass] Profile already exists:', existingProfile);
  }

  return { userId: DEV_USER_ID, workspaceId: DEV_WORKSPACE_ID };
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