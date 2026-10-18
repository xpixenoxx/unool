import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/brand-materials?workspaceId=xxx&slug=page
export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    const slug = request.nextUrl.searchParams.get('slug') || 'page';

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch user profile to get subdomain
    const { data: profile } = await supabase
      .from('profiles')
      .select('subdomain, name, avatar_url, role, company')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const subdomain = profile?.subdomain || 'user';
    const appBaseUrl = config.NEXT_PUBLIC_APP_URL || 'https://unool.co';

    // Fetch existing page if any
    const { data: pageData } = await supabase
      .from('brand_materials_pages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('slug', slug)
      .maybeSingle();

    // Default structure if not created yet
    const page = pageData || {
      slug: slug,
      title: profile?.name ? `${profile.name}'s Brand & Product Showcase` : 'Brand & Product Showcase',
      tagline: 'Official materials, catalogues, lookbooks & resources',
      description: 'Explore our latest releases, documents, lookbooks, and brand materials curated in one central hub.',
      primary_cta_label: 'Visit Official Website',
      primary_cta_url: '',
      materials: [],
      theme: { accentColor: '#8B5CF6' },
      is_published: true,
    };

    const fullUrl = `${appBaseUrl}/u/${subdomain}/${slug}`;

    return NextResponse.json({
      success: true,
      page,
      subdomain,
      pageUrl: fullUrl,
      profile: {
        name: profile?.name,
        avatarUrl: profile?.avatar_url,
        subdomain,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/brand-materials error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/brand-materials
export async function PUT(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      workspaceId,
      slug = 'page',
      title,
      tagline,
      description,
      primaryCtaLabel,
      primaryCtaUrl,
      materials,
      theme,
      isPublished = true,
      updateAutomationLink = true,
    } = body;

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Sanitize slug: lowercase alphanumeric and hyphens only
    const sanitizedSlug = (slug || 'page').toLowerCase().replace(/[^a-z0-9-_]/g, '').trim() || 'page';

    // Fetch user profile subdomain
    const { data: profile } = await supabase
      .from('profiles')
      .select('subdomain, name')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const subdomain = profile?.subdomain || 'user';
    const appBaseUrl = config.NEXT_PUBLIC_APP_URL || 'https://unool.co';
    const pageUrl = `${appBaseUrl}/u/${subdomain}/${sanitizedSlug}`;

    const upsertPayload = {
      workspace_id: workspaceId,
      slug: sanitizedSlug,
      title: title || `${profile?.name || 'Brand'} Materials`,
      tagline: tagline || null,
      description: description || null,
      primary_cta_label: primaryCtaLabel || 'Visit Website',
      primary_cta_url: primaryCtaUrl || null,
      materials: Array.isArray(materials) ? materials : [],
      theme: theme || { accentColor: '#8B5CF6' },
      is_published: isPublished ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('brand_materials_pages')
      .upsert(upsertPayload, { onConflict: 'workspace_id,slug' })
      .select()
      .single();

    if (error) {
      logger.error('Failed to upsert brand materials page', { error, workspaceId });
      return NextResponse.json({ error: 'Failed to save brand materials' }, { status: 500 });
    }

    // When requested (or by default), update the Instagram automation canonical resource link
    // so any audience asking for links in DMs or comments receives this newly created page!
    if (updateAutomationLink) {
      try {
        await supabase
          .from('instagram_automation_config')
          .update({
            link_url: pageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('workspace_id', workspaceId);
        logger.info('Updated Instagram automation link_url to brand page', { workspaceId, pageUrl });
      } catch (linkErr) {
        logger.warn('Failed to auto-update instagram_automation_config link_url', { error: linkErr });
      }
    }

    return NextResponse.json({
      success: true,
      data,
      pageUrl,
      subdomain,
      slug: sanitizedSlug,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('PUT /api/brand-materials error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
