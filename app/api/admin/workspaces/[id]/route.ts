import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { clearPlanCache } from '@/lib/plan-enforcement';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/admin/workspaces/[id] - Get workspace with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'workspaces');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const workspace = await adminRepository.getWorkspaceById(id);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Parallel fetch related details
    const [membersRes, subscriptionRes, paymentsRes, platformsRes, postsCountRes, profilesRes] = await Promise.all([
      adminClient.from('workspace_members').select('*').eq('workspace_id', id),
      adminClient.from('subscriptions').select('*').eq('workspace_id', id).maybeSingle(),
      adminClient.from('payment_orders').select('*').eq('workspace_id', id).order('created_at', { ascending: false }).limit(20),
      adminClient.from('platform_connections').select('*').eq('workspace_id', id),
      adminClient.from('posts').select('id', { count: 'exact', head: true }).eq('workspace_id', id),
      adminClient.from('profiles').select('id, subdomain, name, created_at').eq('workspace_id', id).is('deleted_at', null),
    ]);

    interface WorkspaceMemberRow {
      id: string;
      user_id: string;
      role: string;
      created_at: string;
    }

    // Resolve emails for members
    const members = await Promise.all(
      ((membersRes.data || []) as unknown as WorkspaceMemberRow[]).map(async (m) => {
        let email = 'Unknown';
        try {
          const { data } = await adminClient.auth.admin.getUserById(m.user_id);
          email = data?.user?.email || 'Unknown';
        } catch { }
        return {
          id: m.id,
          userId: m.user_id,
          email,
          role: m.role,
          createdAt: m.created_at,
        };
      })
    );

    return NextResponse.json({
      ...workspace,
      members,
      subscription: subscriptionRes.data || null,
      paymentOrders: paymentsRes.data || [],
      platformConnections: platformsRes.data || [],
      profiles: profilesRes.data || [],
      profileCount: profilesRes.data?.length ?? workspace.profileCount ?? 0,
      totalPosts: postsCountRes.count || 0,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to get workspace:', error);
    return NextResponse.json({ error: 'Failed to get workspace' }, { status: 500 });
  }
}

// PATCH /api/admin/workspaces/[id] - Update workspace plan/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'workspaces');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { plan, planStatus, planExpiresAt } = body;

    let workspace = null;

    if (plan) {
      workspace = await adminRepository.updateWorkspacePlan(id, plan, auth.admin.userId);
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }

      await adminRepository.logAdminAction(
        auth.admin.userId,
        'workspace_plan_change',
        'workspace',
        id,
        { newPlan: plan }
      );

      clearPlanCache(plan);
    }

    if (planStatus) {
      workspace = await adminRepository.updateWorkspacePlanStatus(id, planStatus, auth.admin.userId);
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }

      await adminRepository.logAdminAction(
        auth.admin.userId,
        'workspace_status_change',
        'workspace',
        id,
        { newStatus: planStatus }
      );
    }

    if (planExpiresAt !== undefined) {
      const { data, error } = await adminClient
        .from('workspaces')
        .update({ plan_expires_at: planExpiresAt, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      workspace = data;

      await adminRepository.logAdminAction(
        auth.admin.userId,
        'workspace_expiry_change',
        'workspace',
        id,
        { newExpiresAt: planExpiresAt }
      );
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Failed to update workspace:', error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}

// DELETE /api/admin/workspaces/[id] - Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'workspaces');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const { error } = await adminClient
      .from('workspaces')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'workspace_delete',
      'workspace',
      id,
      {}
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }
}
