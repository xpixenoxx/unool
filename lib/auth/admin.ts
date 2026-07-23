import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export interface AdminAuthContext {
  admin: {
    userId: string;
    email: string;
    role: 'super_admin' | 'admin' | 'support';
    permissions: Record<string, boolean>;
  };
  workspaceId?: string;
}

export async function getCurrentAdmin(request: NextRequest): Promise<AdminAuthContext | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  // Verify the JWT token and get the user
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) return null;

  // Check if user is an admin
  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!adminUser) return null;

  return {
    admin: {
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions || {},
    },
  };
}

export async function requireAdmin(
  request: NextRequest,
  requiredPermission?: string
): Promise<AdminAuthContext | NextResponse> {
  const auth = await getCurrentAdmin(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Admin authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  if (requiredPermission && !auth.admin.permissions[requiredPermission]) {
    return NextResponse.json(
      { error: `Insufficient permissions: ${requiredPermission} required`, code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  return auth;
}

// Middleware for API routes
export function withAdminAuth(
  handler: (request: NextRequest, auth: AdminAuthContext) => Promise<NextResponse>,
  requiredPermission?: string
) {
  return async (request: NextRequest) => {
    const auth = await requireAdmin(request, requiredPermission);
    if (auth instanceof NextResponse) return auth;
    return handler(request, auth);
  };
}