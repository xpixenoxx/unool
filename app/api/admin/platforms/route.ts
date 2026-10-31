import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/admin/platforms - List all connected social media platform accounts with user & workspace details
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'platforms');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    // 1. Fetch platform connections with workspace relations
    let rawData: any[] = [];
    try {
      const { data, error } = await adminClient
        .from('platform_connections')
        .select('id, workspace_id, user_id, platform, username, status, expires_at, created_at, updated_at, workspaces(id, name, owner_id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      rawData = data || [];
    } catch {
      // Fallback if user_id column is not in schema or relation differences
      try {
        const { data, error } = await adminClient
          .from('platform_connections')
          .select('id, workspace_id, platform, username, status, expires_at, created_at, updated_at, workspaces(id, name, owner_id)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        rawData = data || [];
      } catch {
        const { data, error } = await adminClient
          .from('platform_connections')
          .select('id, workspace_id, platform, username, status, expires_at, created_at, updated_at, workspaces(name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        rawData = data || [];
      }
    }

    // 2. Build User Information Lookup (from public.users and auth.users)
    const userMap = new Map<string, { id: string; name: string; email: string }>();

    // Query public.users
    try {
      const { data: dbUsers } = await adminClient.from('users').select('id, email, full_name');
      (dbUsers || []).forEach((u: any) => {
        if (u.id) {
          userMap.set(u.id, {
            id: u.id,
            email: u.email || '',
            name: u.full_name || (u.email ? u.email.split('@')[0] : 'Unknown User'),
          });
        }
      });
    } catch {
      // Non-fatal
    }

    // Query auth.users
    try {
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      (authUsersData?.users || []).forEach((u: any) => {
        const meta = u.user_metadata || {};
        const metaName = meta.full_name || meta.name || (meta.first_name ? `${meta.first_name} ${meta.last_name || ''}`.trim() : null);
        const existing = userMap.get(u.id);
        userMap.set(u.id, {
          id: u.id,
          email: u.email || existing?.email || '',
          name: metaName || existing?.name || (u.email ? u.email.split('@')[0] : 'Unknown User'),
        });
      });
    } catch {
      // Non-fatal
    }

    // Workspace to Owner/User mapping
    const wsToUserMap = new Map<string, string>();
    const wsNameMap = new Map<string, string>();

    try {
      const { data: wsRows } = await adminClient.from('workspaces').select('id, name, owner_id');
      (wsRows || []).forEach((w: any) => {
        if (w.id) {
          if (w.name) wsNameMap.set(w.id, w.name);
          if (w.owner_id) wsToUserMap.set(w.id, w.owner_id);
        }
      });
    } catch {
      // Non-fatal
    }

    try {
      const { data: memberRows } = await adminClient.from('workspace_members').select('workspace_id, user_id, role');
      (memberRows || []).forEach((m: any) => {
        if (m.workspace_id && m.user_id) {
          if (m.role === 'owner' || !wsToUserMap.has(m.workspace_id)) {
            wsToUserMap.set(m.workspace_id, m.user_id);
          }
        }
      });
    } catch {
      // Non-fatal
    }

    // 3. Map Connections with Resolved User & Workspace Information
    const allConnections = rawData.map((row: any) => {
      const directUserId = row.user_id;
      const wsUserId = wsToUserMap.get(row.workspace_id);
      const wsOwnerId = row.workspaces?.owner_id;

      let resolvedUserId = directUserId || wsOwnerId || wsUserId;
      if (!resolvedUserId && userMap.has(row.workspace_id)) {
        resolvedUserId = row.workspace_id;
      }

      const user = resolvedUserId ? userMap.get(resolvedUserId) : null;
      const wsName = wsNameMap.get(row.workspace_id) || row.workspaces?.name || 'My Workspace';

      return {
        id: row.id,
        workspaceId: row.workspace_id,
        workspaceName: wsName,
        userId: user?.id || resolvedUserId || null,
        userName: user?.name || (user?.email ? user.email.split('@')[0] : 'Unknown User'),
        userEmail: user?.email || '',
        platform: row.platform,
        username: row.username || 'Unknown',
        status: row.status || 'connected',
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    // 4. Compute Platform Stats Across ALL Connections (Unfiltered)
    // So top distribution metrics never disappear or change when filtering
    const platformStats: Record<string, number> = {};
    allConnections.forEach((c) => {
      const p = (c.platform || '').toLowerCase();
      platformStats[p] = (platformStats[p] || 0) + 1;
    });

    // 5. Apply Filters for Table View
    let filteredConnections = allConnections;
    if (platform && platform !== 'all') {
      const targetPlatform = platform.toLowerCase();
      filteredConnections = filteredConnections.filter(
        (c) => (c.platform || '').toLowerCase() === targetPlatform
      );
    }
    if (status && status !== 'all') {
      const targetStatus = status.toLowerCase();
      filteredConnections = filteredConnections.filter(
        (c) => (c.status || '').toLowerCase() === targetStatus
      );
    }

    return NextResponse.json({
      data: filteredConnections,
      total: allConnections.length,
      filteredTotal: filteredConnections.length,
      platformStats,
    });
  } catch (error) {
    console.error('Failed to list platform connections:', error);
    return NextResponse.json({ error: 'Failed to list platform connections' }, { status: 500 });
  }
}

// DELETE /api/admin/platforms - Disconnect/remove a platform connection
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, 'platforms');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('platform_connections')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'platform_disconnect',
      'platform_connection',
      id,
      {}
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete platform connection:', error);
    return NextResponse.json({ error: 'Failed to delete platform connection' }, { status: 500 });
  }
}
