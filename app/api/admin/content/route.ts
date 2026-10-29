import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/admin/content - List posts across all workspaces
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'content');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const workspaceId = searchParams.get('workspaceId');

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminClient
      .from('posts')
      .select('*, workspaces(name)', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    interface PostRow {
      id: string;
      workspace_id: string;
      workspaces?: { name?: string } | null;
      content: string | null;
      status: string;
      scheduled_at: string | null;
      published_at: string | null;
      created_at: string;
      updated_at: string;
    }

    const posts = ((data || []) as unknown as PostRow[]).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      workspaceName: row.workspaces?.name || 'Unknown',
      content: row.content || '',
      status: row.status,
      scheduledAt: row.scheduled_at,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      data: posts,
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  } catch (error) {
    console.error('Failed to list posts:', error);
    return NextResponse.json({ error: 'Failed to list posts' }, { status: 500 });
  }
}

// DELETE /api/admin/content - Delete / moderate a post
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, 'content');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { error } = await adminClient.from('posts').delete().eq('id', id);
    if (error) throw error;

    await adminRepository.logAdminAction(
      auth.admin.userId,
      'content_moderation_delete',
      'post',
      id,
      {}
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

