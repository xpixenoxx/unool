import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { CreateAdminUserInput, ListUsersParams } from '@/lib/repositories/interfaces/IAdminRepository';

// GET /api/admin/users - List users
// By default returns platform users (for /admin/users page).
// If ?type=admin, returns admin_users table (for admin role settings).
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sortBy = (searchParams.get('sortBy') as ListUsersParams['sortBy']) || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as ListUsersParams['sortOrder']) || 'desc';
    const params: ListUsersParams = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      search: searchParams.get('search') || undefined,
      sortBy,
      sortOrder,
    };

    if (type === 'admin') {
      const result = await adminRepository.listAdminUsers(params);
      return NextResponse.json(result);
    }

    const result = await adminRepository.listAllUsers(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new admin user or platform user
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { email, role, permissions, password, type } = body as CreateAdminUserInput & {
      password?: string;
      type?: 'admin' | 'platform';
    };

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // Platform user creation
    if (type === 'platform' || (!role && password)) {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: password || undefined,
        email_confirm: true,
      });

      if (createError || !newUser?.user) {
        return NextResponse.json(
          { error: createError?.message || 'Failed to create user' },
          { status: 400 }
        );
      }

      await adminRepository.logAdminAction(
        auth.admin.userId,
        'user_create',
        'user',
        newUser.user.id,
        { email }
      );

      return NextResponse.json(newUser.user, { status: 201 });
    }

    // Admin user creation
    const existing = await adminRepository.getAdminUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Admin user with this email already exists' }, { status: 409 });
    }

    const adminUser = await adminRepository.createAdminUser(
      { email, role, permissions },
      adminClient
    );

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'admin_user_create',
      'admin_user',
      adminUser.id,
      { email, role: role || 'admin' }
    );

    return NextResponse.json(adminUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
