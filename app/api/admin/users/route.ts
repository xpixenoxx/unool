import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { CreateAdminUserInput, UpdateAdminUserInput, ListUsersParams } from '@/lib/repositories/interfaces/IAdminRepository';

// GET /api/admin/users - List all admin users
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') as ListUsersParams['sortBy'] || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as ListUsersParams['sortOrder'] || 'desc';
    const params: ListUsersParams = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      search: searchParams.get('search') || undefined,
      sortBy,
      sortOrder,
    };

    const result = await adminRepository.listAdminUsers(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list admin users:', error);
    return NextResponse.json({ error: 'Failed to list admin users' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new admin user
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { email, role, permissions } = body as CreateAdminUserInput;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Check if already exists
    const existing = await adminRepository.getAdminUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Admin user with this email already exists' }, { status: 409 });
    }

    // Create auth user first, then admin record
    const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    const adminUser = await adminRepository.createAdminUser(
      { email, role, permissions },
      adminClient
    );

    // Log audit
    await adminRepository.logAdminAction(
      auth.admin.userId,
      'admin_user_create',
      'admin_user',
      adminUser.id,
      { email, role: role || 'admin' }
    );

    return NextResponse.json(adminUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create admin user:', error);
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
}