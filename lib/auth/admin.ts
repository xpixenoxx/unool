import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { verifyAdminJwt } from '@/lib/auth/admin-jwt';
import { getAdminApiRateLimit } from '@/lib/middleware/admin-rate-limit';

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

/**
 * Authenticate the current admin request.
 *
 * Resolution order:
 *   1. `admin_session` cookie  (set by /admin/api/login)
 *   2. `Authorization: Bearer <token>` header  (for API clients)
 *
 * The token is verified cryptographically (HMAC-SHA256 + expiry), then
 * the admin record is re-fetched from the database to ensure the account
 * still exists and is active.
 */
export async function getCurrentAdmin(request: NextRequest): Promise<AdminAuthContext | null> {
  // ── Extract token ──────────────────────────────────────────
  let token: string | null = null;

  // 1. Cookie (primary — browser sessions)
  const cookieToken = request.cookies.get('admin_session')?.value;
  if (cookieToken) {
    token = cookieToken;
  }

  // 2. Bearer header (fallback — API clients / scripts)
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;

  // ── Verify JWT signature + expiry ──────────────────────────
  const payload = verifyAdminJwt(token);
  if (!payload) return null;

  // ── Verify admin still exists and is active in the DB ──────
  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('id, email, role, permissions, is_active')
    .eq('id', payload.adminId)
    .single();

  if (!adminUser) return null;

  // Respect the is_active flag (account may have been disabled since JWT was issued)
  if (adminUser.is_active === false) return null;

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

  // Rate limit admin API calls per admin
  const apiRateLimit = getAdminApiRateLimit();
  if (apiRateLimit) {
    const { success } = await apiRateLimit.limit(auth.admin.userId);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many admin API requests. Please slow down.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }
  }

  // Super admins bypass all granular permission checks
  if (auth.admin.role === 'super_admin') {
    return auth;
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
