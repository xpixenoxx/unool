import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/admin/users/[id] - Get single platform user with full details (or admin user if requested)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'admin') {
      const adminUser = await adminRepository.getAdminUserById(id);
      if (!adminUser) {
        return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
      }
      return NextResponse.json(adminUser);
    }

    // Try fetching platform user from Auth
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(id);

    if (userError || !userData?.user) {
      // Fallback: check if it's an admin user
      const adminUser = await adminRepository.getAdminUserById(id);
      if (adminUser) return NextResponse.json(adminUser);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userData.user;

    // Parallel fetch related details: workspaces, payment orders, referral code
    const [workspacesRes, paymentsRes, referralCodeRes] = await Promise.all([
      adminClient
        .from('workspace_members')
        .select('role, created_at, workspaces(*)')
        .eq('user_id', id),
      adminClient
        .from('payment_orders')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
      adminClient
        .from('referral_codes')
        .select('*')
        .eq('user_id', id)
        .single(),
    ]);

    interface MemberRow {
      role: string;
      created_at: string;
      workspaces?: Record<string, unknown> | null;
    }

    const workspaces = ((workspacesRes.data || []) as unknown as MemberRow[]).map((m) => ({
      role: m.role,
      joinedAt: m.created_at,
      ...(m.workspaces || {}),
    }));

    const bannedUntilStr = (user as { banned_until?: string | null }).banned_until;
    const isSuspended = !!(bannedUntilStr && new Date(bannedUntilStr) > new Date());

    return NextResponse.json({
      id: user.id,
      email: user.email || '',
      phone: user.phone || null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at || null,
      isSuspended,
      bannedUntil: bannedUntilStr || null,
      userMetadata: user.user_metadata || {},
      appMetadata: user.app_metadata || {},
      workspaces,
      paymentOrders: paymentsRes.data || [],
      referralCode: referralCodeRes.data || null,
    });
  } catch (error) {
    console.error('Failed to get user details:', error);
    return NextResponse.json({ error: 'Failed to get user details' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update user (admin user role/permissions or platform user metadata)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { role, permissions, userMetadata, email } = body;

    // If role or permissions provided, try admin user update first
    if (role !== undefined || permissions !== undefined) {
      if (id === auth.admin.userId && role && role !== 'super_admin') {
        return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
      }

      const adminUser = await adminRepository.updateAdminUser(id, { role, permissions });
      if (adminUser) {
        await adminRepository.logAdminAction(
          auth.admin.userId,
          'admin_user_update',
          'admin_user',
          id,
          { role, permissions }
        );
        return NextResponse.json(adminUser);
      }
    }

    // Otherwise, update platform auth user
    const updatePayload: Record<string, unknown> = {};
    if (email) updatePayload.email = email;
    if (userMetadata) updatePayload.user_metadata = userMetadata;

    const { data: updated, error } = await adminClient.auth.admin.updateUserById(id, updatePayload);
    if (error) throw error;

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'user_update',
      'user',
      id,
      updatePayload
    );

    return NextResponse.json({ success: true, user: updated.user });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Soft-delete user and archive to deleted_accounts table
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'users');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    // Prevent self-deletion if current admin
    if (id === auth.admin.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = (body?.reason as string) || 'Deleted by admin';

    // 1. Fetch user data before archiving
    const { data: userData } = await adminClient.auth.admin.getUserById(id);
    if (!userData?.user) {
      // Try admin_users
      const success = await adminRepository.deleteAdminUser(id);
      if (!success) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      await adminRepository.logAdminAction(auth.admin.userId, 'user_delete', 'user', id, { reason });
      return NextResponse.json({ success: true });
    }

    const { data: userProfiles } = await adminClient.from('profiles').select('*').eq('user_id', id);
    const { data: userMemberships } = await adminClient.from('workspace_members').select('*').eq('user_id', id);
    const { data: userWorkspaces } = await adminClient.from('workspaces').select('*').eq('owner_id', id);

    // 2. Insert into deleted_accounts table
    try {
      await adminClient.from('deleted_accounts').insert({
        user_id: id,
        email: userData.user.email || 'unknown',
        reason,
        deleted_by: auth.admin.userId,
        user_data: userData.user,
        profiles_data: userProfiles || [],
        workspaces_data: userWorkspaces || [],
        workspace_members_data: userMemberships || [],
        deleted_at: new Date().toISOString(),
      });
    } catch (insertErr) {
      console.warn('Note: deleted_accounts table insert warning:', insertErr);
    }

    // 3. Soft-delete profiles by setting deleted_at
    try {
      await adminClient
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', id);
    } catch (profErr) {
      console.warn('Note: profiles table update warning:', profErr);
    }

    // 4. Ban the user and flag in metadata so active queries exclude them
    const existingMeta = userData.user.user_metadata || {};
    await adminClient.auth.admin.updateUserById(id, {
      ban_duration: '876000h',
      user_metadata: {
        ...existingMeta,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_reason: reason,
      },
    });

    // 5. Sign out active sessions
    await adminClient.auth.admin.signOut(id).catch(() => {});

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'user_delete',
      'user',
      id,
      { reason }
    );

    return NextResponse.json({ success: true, message: 'Account archived to deleted_accounts table' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
