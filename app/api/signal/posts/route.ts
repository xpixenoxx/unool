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
