import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { clearPlanCache as clearEnforcementCache } from '@/lib/plan-enforcement';
import { clearPlanCache as clearBillingCache } from '@/lib/billing/plans';
import { supabaseAdmin } from '@/lib/supabase/admin';



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
      supabaseAdmin.from('workspace_members').select('*').eq('workspace_id', id),
      supabaseAdmin.from('subscriptions').select('*').eq('workspace_id', id).maybeSingle(),
      supabaseAdmin.from('payment_orders').select('*').eq('workspace_id', id).order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('platform_connections').select('*').eq('workspace_id', id),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('workspace_id', id),
      supabaseAdmin.from('profiles').select('id, subdomain, name, created_at').eq('workspace_id', id).is('deleted_at', null),
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
          const { data } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
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

    const existing = await adminRepository.getWorkspaceById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      updated_at: now,
    };

    if (plan !== undefined) {
      updates.plan = typeof plan === 'string' ? plan.toLowerCase().trim() : plan;
    }

    if (planStatus !== undefined) {
      let dbStatus = typeof planStatus === 'string' ? planStatus.toLowerCase().trim() : planStatus;
      if (dbStatus === 'cancelled') {
        dbStatus = 'canceled';
      }
      updates.plan_status = dbStatus;
    }

    if (planExpiresAt !== undefined) {
      updates.plan_expires_at = planExpiresAt;
    }

    const { data: updatedWs, error: updateError } = await supabaseAdmin
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    // Sync subscriptions table if one exists for this workspace
    try {
      const subUpdates: Record<string, unknown> = {
        updated_at: now,
      };
      if (updates.plan !== undefined) {
        subUpdates.plan_id = updates.plan;
      }
      if (updates.plan_status !== undefined) {
        let subStatus = updates.plan_status as string;
        if (subStatus === 'canceled') subStatus = 'cancelled';
        if (subStatus === 'trialing') subStatus = 'active';
        subUpdates.status = subStatus;
      }
      if (planExpiresAt !== undefined) {
        subUpdates.current_period_end = planExpiresAt;
      }

      await supabaseAdmin
        .from('subscriptions')
        .update(subUpdates)
        .eq('workspace_id', id);
    } catch (subErr) {
      console.warn('[PATCH /api/admin/workspaces/[id]] Failed to sync subscription:', subErr);
    }

    // Log admin actions
    if (plan !== undefined) {
      await adminRepository.logAdminAction(
        auth.admin.userId,
        'workspace_plan_change',
        'workspace',
        id,
        { oldPlan: existing.plan, newPlan: updates.plan }
      );
    }

    if (planStatus !== undefined) {
      await adminRepository.logAdminAction(
        auth.admin.userId,
        'workspace_status_change',
        'workspace',
        id,
        { oldStatus: existing.planStatus, newStatus: updates.plan_status }
      );
    }

    if (planExpiresAt !== undefined) {
      await adminRepository.logAdminAction(
        auth.admin.userId,
        'workspace_expiry_change',
        'workspace',
        id,
        { oldExpiresAt: existing.planExpiresAt, newExpiresAt: planExpiresAt }
      );
    }

    // Clear caches
    try {
      clearEnforcementCache(id);
      if (typeof plan === 'string') {
        clearEnforcementCache(plan);
        clearBillingCache(plan);
      }
    } catch (cacheErr) {
      console.warn('[PATCH /api/admin/workspaces/[id]] Cache clear warning:', cacheErr);
    }

    const result = await adminRepository.getWorkspaceById(id);
    return NextResponse.json(result || updatedWs);
  } catch (error) {
    console.error('Failed to update workspace:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workspace' },
      { status: 500 }
    );
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

    const { error } = await supabaseAdmin
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
