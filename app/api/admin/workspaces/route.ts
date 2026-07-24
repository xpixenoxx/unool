import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import type { ListWorkspacesParams } from '@/lib/repositories/interfaces/IAdminRepository';

// GET /api/admin/workspaces - List all workspaces (admin view)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'workspaces');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') as ListWorkspacesParams['sortBy'] || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as ListWorkspacesParams['sortOrder'] || 'desc';
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
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list workspaces:', error);
    return NextResponse.json({ error: 'Failed to list workspaces' }, { status: 500 });
  }
}