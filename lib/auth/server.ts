import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { getDevAuthContextAsync, isDevAuthEnabled } from '@/lib/auth/dev/bypass';

export interface AuthContext {
  userId: string;
  workspaceId: string;
}

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function getCurrentAuth(request: NextRequest): Promise<AuthContext | null> {
  // Development bypass: use dev user without requiring real auth
  if (isDevAuthEnabled()) {
    const devContext = await getDevAuthContextAsync();
    if (devContext) {
      return devContext;
    }
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  // Get workspace ID from user metadata or workspace membership
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .single();

  const workspaceId = member?.workspace_id || user.user_metadata?.workspace_id;
  if (!workspaceId) {
    return null;
  }

  return { userId: user.id, workspaceId };
}

export async function getCurrentUser(request: NextRequest) {
  return getCurrentAuth(request);
}