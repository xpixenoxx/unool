import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { ListWorkspacesParams } from '@/lib/repositories/interfaces/IAdminRepository';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/admin/workspaces - List all workspaces (admin view)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'workspaces');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const sortBy = (searchParams.get('sortBy') as ListWorkspacesParams['sortBy']) || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as ListWorkspacesParams['sortOrder']) || 'desc';
    const params: ListWorkspacesParams = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      search: searchParams.get('search') || undefined,
      plan: searchParams.get('plan') || undefined,
      planStatus: searchParams.get('planStatus') || undefined,
      sortBy,
      sortOrder,
    };

    const result = await adminRepository.listWorkspaces(params);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to list workspaces:', error);
    return NextResponse.json({ error: 'Failed to list workspaces' }, { status: 500 });
  }
}

// POST /api/admin/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'workspaces');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, plan = 'spark', ownerEmail } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    // Insert workspace
    const { data: workspace, error: wsError } = await adminClient
      .from('workspaces')
      .insert({
        name: name.trim(),
        plan: plan || 'spark',
        plan_status: 'active',
      })
      .select('*')
      .single();

    if (wsError || !workspace) {
      throw wsError || new Error('Failed to create workspace');
    }

    // If ownerEmail provided, look up or attach user
    if (ownerEmail) {
      const { data: users } = await adminClient.auth.admin.listUsers();
      const ownerUser = users?.users?.find(
        (u) => u.email?.toLowerCase() === ownerEmail.toLowerCase().trim()
      );
      if (ownerUser) {
        await adminClient.from('workspace_members').insert({
          workspace_id: workspace.id,
          user_id: ownerUser.id,
          role: 'owner',
        });
      }
    }

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'workspace_create',
      'workspace',
      workspace.id,
      { name, plan, ownerEmail }
    );

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
