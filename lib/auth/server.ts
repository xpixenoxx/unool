import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export interface AuthContext {
  userId: string;
  workspaceId: string;
}

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function getCurrentAuth(request: NextRequest): Promise<AuthContext | null> {
  // Priority 1: Check for secure headers injected by middleware.ts
  // This handles both the production session via cookies and the local dev bypass
  const headerUserId = request.headers.get('x-user-id');
  let headerWorkspaceId = request.headers.get('x-workspace-id');

  if (headerUserId) {
    if (!headerWorkspaceId) {
      // User is authenticated but middleware didn't find a workspace in profiles.
      // Fetch it directly from workspace_members.
      const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', headerUserId)
        .single();
      
      // Fallback to userId if no workspace exists (single-user mode fallback, mirrors context.ts)
      headerWorkspaceId = member?.workspace_id || headerUserId;
    }

    if (headerWorkspaceId) {
      return {
        userId: headerUserId,
        workspaceId: headerWorkspaceId,
      };
    }
  }

  let userObj: any = null;

  // Priority 2: Fallback to direct Bearer token (useful for external API clients)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      userObj = user;
    }
  }

  // Priority 3: Fallback to cookie-based session via SSR client
  if (!userObj) {
    const { getUser } = await import('@/lib/supabase/server');
    const user = await getUser();
    if (user) {
      userObj = user;
    }
  }

  if (!userObj) {
    return null;
  }

  // Get workspace ID from user metadata or workspace membership
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userObj.id)
    .single();

  const workspaceId = member?.workspace_id || userObj.user_metadata?.workspace_id || userObj.id;
  if (!workspaceId) {
    return null;
  }

  return { userId: userObj.id, workspaceId };
}

export async function getCurrentUser(request: NextRequest) {
  return getCurrentAuth(request);
}