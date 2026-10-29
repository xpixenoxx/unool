import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/admin/platforms - List all connected social media platform accounts
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'platforms');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    let query = adminClient
      .from('platform_connections')
      .select('id, workspace_id, platform, username, status, expires_at, created_at, updated_at, workspaces(name)');

    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    interface PlatformRow {
      id: string;
      workspace_id: string;
      workspaces?: { name?: string } | null;
      platform: string;
      username: string | null;
      status: string | null;
      expires_at: string | null;
      created_at: string;
      updated_at: string;
    }

    const connections = ((data || []) as unknown as PlatformRow[]).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      workspaceName: row.workspaces?.name || 'Unknown',
      platform: row.platform,
      username: row.username || 'Unknown',
      status: row.status || 'connected',
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Aggregate stats by platform
    const platformStats: Record<string, number> = {};
    connections.forEach((c) => {
      platformStats[c.platform] = (platformStats[c.platform] || 0) + 1;
    });

    return NextResponse.json({
      data: connections,
      total: connections.length,
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

