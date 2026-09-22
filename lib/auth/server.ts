import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export interface AuthContext {
  userId: string;
  workspaceId: string;
}

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function getCurrentAuth(request: NextRequest): Promise<AuthContext | null> {
  const debugLines: string[] = [];
  try {
    // Priority 1: Check for secure headers injected by middleware.ts
    const headerUserId = request.headers.get('x-user-id');
    let headerWorkspaceId = request.headers.get('x-workspace-id');

    if (headerUserId) {
      if (!headerWorkspaceId) {
        const { data: member } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', headerUserId)
          .single();
        headerWorkspaceId = member?.workspace_id || headerUserId;
      }
      if (headerWorkspaceId) {
        return { userId: headerUserId, workspaceId: headerWorkspaceId };
      }
    }

    let userObj: any = null;

    // Priority 2: Fallback to direct Bearer token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      
      // Use clean anon client to verify user token to avoid Service Role Key overrides
      const anonSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
      const { data: { user }, error } = await anonSupabase.auth.getUser(token);
      
      if (error) {
        debugLines.push(`bearer_error:${error.message}`);
      } else if (user) {
        userObj = user;
        debugLines.push('bearer_success');
      } else {
        debugLines.push('bearer_no_user');
      }
    } else {
      debugLines.push('no_bearer');
    }

    // Priority 3: Fallback to cookie-based session via SSR client
    if (!userObj) {
      const { getUser } = await import('@/lib/supabase/server');
      try {
        const user = await getUser();
        if (user) {
          userObj = user;
          debugLines.push('cookie_success');
        } else {
          debugLines.push('cookie_no_user');
        }
      } catch (err: any) {
        debugLines.push(`cookie_error:${err.message}`);
      }
    }

    if (!userObj) {
      // Append the debug traces into a custom header on a thrown error to be caught by route handler
      throw new Error(`Auth resolution failed: ${debugLines.join(' | ')}`);
    }

    // Get workspace ID from user metadata or workspace membership
    const { data: member, error: memberErr } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userObj.id)
      .single();

    if (memberErr && memberErr.code !== 'PGRST116') {
      debugLines.push(`member_query_err:${memberErr.message}`);
    }

    const workspaceId = member?.workspace_id || userObj.user_metadata?.workspace_id || userObj.id;
    if (!workspaceId) {
      throw new Error(`Workspace ID resolution failed: ${debugLines.join(' | ')}`);
    }

    return { userId: userObj.id, workspaceId };
  } catch (error: any) {
    if (error.message.includes('Auth resolution failed')) {
      // Re-throw so upstream can catch the debug string
      throw error;
    }
    // Standard return null for everything else
    return null;
  }
}


export async function getCurrentUser(request: NextRequest) {
  return getCurrentAuth(request);
}