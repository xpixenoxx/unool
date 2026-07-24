import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { clearPlanCache } from '@/lib/plan-enforcement';

// GET /api/admin/workspaces/[id] - Get single workspace
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
    return NextResponse.json(workspace);
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
    const { plan, planStatus } = body;

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

      // Clear plan cache for the new plan
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

    // Use service role to delete
    const { createClient } = await import('@supabase/supabase-js');
    const { config } = await import('@/lib/config/schema');
    const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

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