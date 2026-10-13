import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';

const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { workspaceId } = auth;

  // Fetch last 10 posts (published or draft with variants)
  const { data: posts, error: postsError } = await admin
    .from('posts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('status', ['published', 'draft', 'failed'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (postsError) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ posts: [] });
  }

  const postIds = posts.map((p: any) => p.id);

  // Fetch all variants for these posts in one query
  const { data: variants, error: variantsError } = await admin
    .from('post_variants')
    .select('*')
    .in('post_id', postIds)
    .order('created_at', { ascending: true });

  if (variantsError) {
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
  }

  // Group variants by post_id
  const variantsByPost: Record<string, any[]> = {};
  for (const v of variants || []) {
    if (!variantsByPost[v.post_id]) variantsByPost[v.post_id] = [];
    variantsByPost[v.post_id].push({
      id: v.id,
      platform: v.platform,
      status: v.status,
      platformUrl: v.platform_url || null,
      platformPostId: v.platform_post_id || null,
      characterCount: v.character_count,
      error: v.error,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    });
  }

  const result = posts.map((p: any) => ({
    id: p.id,
    content: p.content,
    status: p.status,
    hookType: p.hook_type || null,
    wordCount: p.word_count || null,
    hasMedia: p.has_media || false,
    createdAt: p.created_at,
    publishedAt: p.published_at || null,
    variants: variantsByPost[p.id] || [],
  }));

  return NextResponse.json({ posts: result });
}

export async function DELETE(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  let postId = searchParams.get('postId');
  if (!postId) {
    try {
      const body = await request.json();
      postId = body.postId;
    } catch {}
  }

  if (!postId) {
    return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
  }

  // Verify workspace ownership
  const { data: post } = await admin
    .from('posts')
    .select('id, workspace_id')
    .eq('id', postId)
    .eq('workspace_id', auth.workspaceId)
    .single();

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Find and clean up variants & platform posts
  const { data: variants } = await admin
    .from('post_variants')
    .select('id')
    .eq('post_id', postId);

  const variantIds = (variants || []).map((v: any) => v.id);
  if (variantIds.length > 0) {
    await admin.from('platform_posts').delete().in('post_variant_id', variantIds);
    await admin.from('post_variants').delete().in('id', variantIds);
  }

  const { error: deleteError } = await admin
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('workspace_id', auth.workspaceId);

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Draft removed successfully' });
}

