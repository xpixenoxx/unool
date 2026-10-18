import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export function maskCloudflareUrl(url: string): string {
  if (!url) return url;
  const matchR2Dev = url.match(/https?:\/\/[^/]+\.r2\.dev\/(.+)$/);
  if (matchR2Dev) return `/api/media/${matchR2Dev[1]}`;
  const matchR2Storage = url.match(/https?:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
  if (matchR2Storage) return `/api/media/${matchR2Storage[1]}`;
  return url;
}

function sanitizeMaterial(item: any): any {
  return {
    ...item,
    url: maskCloudflareUrl(item.url),
    thumbnailUrl: item.thumbnailUrl ? maskCloudflareUrl(item.thumbnailUrl) : undefined,
  };
}

function buildSubdomainPageUrl(subdomain: string, slug: string, queryParam?: string): string {
  const host = `https://${subdomain}.unool.co`;
  const base = `${host}/${slug}`;
  return queryParam ? `${base}?${queryParam}` : base;
}

// GET /api/brand-materials?workspaceId=xxx or ?subdomain=xxx
export async function GET(request: NextRequest) {
  try {
    const subdomainParam = request.nextUrl.searchParams.get('subdomain');
    if (subdomainParam) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, workspace_id, name, subdomain, avatar_url, role, company, bio, theme')
        .eq('subdomain', subdomainParam)
        .maybeSingle();

      if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

      const liveTemplate = (profile?.theme as any)?.template || (profile?.theme as any)?.preset || 'the-voice';

      const { data: pageResults } = await supabase
        .from('brand_materials_pages')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .order('updated_at', { ascending: false })
        .limit(1);

      const pageData = pageResults && pageResults.length > 0 ? pageResults[0] : null;

      if (!pageData) {
        return NextResponse.json({ error: 'Showcase not found' }, { status: 404 });
      }

      const page = {
        ...pageData,
        linked_posts: pageData.linked_posts || pageData.theme?.linked_posts || [],
        materials: (pageData.materials || []).map(sanitizeMaterial),
        theme: {
          accentColor: pageData.theme?.accentColor || '#8B5CF6',
          template: liveTemplate,
          linked_posts: pageData.linked_posts || pageData.theme?.linked_posts || [],
          ...(pageData.theme || {}),
        },
      };

      const firstMaterial = (page.materials && page.materials.length > 0) ? page.materials[0] : null;
      const cleanSlug = firstMaterial ? encodeURIComponent(
        (firstMaterial.title || 'asset')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .substring(0, 40)
      ) : '';
      const pageUrl = `https://${profile.subdomain}.unool.co/${cleanSlug ? `?item=${cleanSlug}` : ''}`;

      return NextResponse.json({
        success: true,
        page,
        subdomain: profile.subdomain,
        pageUrl,
        liveTemplate,
        profile: {
          name: profile.name,
          avatarUrl: profile.avatar_url,
          subdomain: profile.subdomain,
          role: profile.role,
          company: profile.company,
          bio: profile.bio,
          theme: profile.theme,
        },
      });
    }

    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    const slug = request.nextUrl.searchParams.get('slug') || 'showcase';

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch user profile to get subdomain & live page template theme
    const { data: profile } = await supabase
      .from('profiles')
      .select('subdomain, name, avatar_url, role, company, theme')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const subdomain = profile?.subdomain || 'user';
    const liveTemplate = (profile?.theme as any)?.template || (profile?.theme as any)?.preset || 'the-voice';

    // Fetch all existing brand materials pages for workspace
    const { data: allPages } = await supabase
      .from('brand_materials_pages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false });

    const sanitizedPages = (allPages || []).map((p: any) => ({
      ...p,
      linked_posts: p.linked_posts || p.theme?.linked_posts || [],
      materials: (p.materials || []).map(sanitizeMaterial),
    }));

    let pageData = null;
    if (slug && slug !== 'page') {
      pageData = sanitizedPages.find((p: any) => p.slug === slug) || null;
    } else {
      pageData = sanitizedPages.length > 0 ? sanitizedPages[0] : null;
    }

    const effectiveSlug = pageData?.slug || slug || 'showcase';

    // Default structure if not created yet
    const page = pageData ? {
      ...pageData,
      linked_posts: pageData.linked_posts || pageData.theme?.linked_posts || [],
    } : {
      slug: effectiveSlug,
      title: profile?.name ? `${profile.name}'s Brand Showcase` : 'Brand & Product Showcase',
      tagline: 'Official materials, catalogues, lookbooks & resources',
      description: 'Explore our latest releases, documents, lookbooks, and brand materials curated in one central hub.',
      primary_cta_label: 'Visit Official Website',
      primary_cta_url: '',
      materials: [],
      linked_posts: [],
      theme: { accentColor: '#8B5CF6', template: liveTemplate, linked_posts: [] },
      is_published: true,
    };

    // Generate query string based on user's first uploaded file/URL if available
    const firstMaterial = (page.materials && page.materials.length > 0) ? page.materials[0] : null;
    let queryParam = '';
    if (firstMaterial) {
      const cleanSlug = encodeURIComponent(
        (firstMaterial.title || 'asset')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .substring(0, 40)
      );
      if (firstMaterial.type === 'image' || firstMaterial.type === 'pdf' || firstMaterial.type === 'doc') {
        queryParam = `file=${cleanSlug}`;
      } else {
        queryParam = `item=${cleanSlug}`;
      }
    }
    const fullUrl = buildSubdomainPageUrl(subdomain, page.slug, queryParam);

    return NextResponse.json({
      success: true,
      page,
      pages: sanitizedPages,
      subdomain,
      subdomainBase: `https://${subdomain}.unool.co/`,
      pageUrl: fullUrl,
      cleanPageUrl: buildSubdomainPageUrl(subdomain, page.slug),
      liveTemplate,
      profile: {
        name: profile?.name,
        avatarUrl: profile?.avatar_url,
        subdomain,
        theme: profile?.theme,
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
      linked_posts,
      isPublished = true,
      updateAutomationLink = true,
    } = body;

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Sanitize slug: lowercase alphanumeric and hyphens only
    const sanitizedSlug = (slug || 'page').toLowerCase().replace(/[^a-z0-9-_]/g, '').trim() || 'page';

    // Fetch user profile subdomain and live template theme
    const { data: profile } = await supabase
      .from('profiles')
      .select('subdomain, name, theme')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const subdomain = profile?.subdomain || 'user';
    const liveTemplate = (profile?.theme as any)?.template || (profile?.theme as any)?.preset || 'the-voice';

    // Ensure all materials have Cloudflare URLs masked
    const sanitizedMaterials = (Array.isArray(materials) ? materials : []).map(sanitizeMaterial);

    const mergedTheme = {
      accentColor: theme?.accentColor || '#8B5CF6',
      template: liveTemplate, // matched with user's live page template theme!
      linked_posts: linked_posts || theme?.linked_posts || [],
      ...theme,
    };

    const upsertPayload = {
      workspace_id: workspaceId,
      slug: sanitizedSlug,
      title: title || `${profile?.name || 'Brand'} Materials`,
      tagline: tagline || null,
      description: description || null,
      primary_cta_label: primaryCtaLabel || 'Visit Website',
      primary_cta_url: primaryCtaUrl || null,
      materials: sanitizedMaterials,
      theme: mergedTheme,
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

    // Generate query string based on user's first uploaded file or URL
    const firstMaterial = sanitizedMaterials.length > 0 ? sanitizedMaterials[0] : null;
    let queryParam = '';
    if (firstMaterial) {
      const cleanSlug = encodeURIComponent(
        (firstMaterial.title || 'asset')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .substring(0, 40)
      );
      queryParam = `item=${cleanSlug}`;
    }
    let pageUrl = '';
    if (sanitizedSlug && sanitizedSlug !== 'showcase') {
      pageUrl = `https://${subdomain}.unool.co/${sanitizedSlug}`;
    } else {
      pageUrl = `https://${subdomain}.unool.co/${queryParam ? `?${queryParam}` : ''}`;
    }
    const cleanPageUrl = `https://${subdomain}.unool.co/`;

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

    // Fetch updated list of all pages for workspace
    const { data: updatedPages } = await supabase
      .from('brand_materials_pages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false });

    const sanitizedUpdatedPages = (updatedPages || []).map((p: any) => ({
      ...p,
      materials: (p.materials || []).map(sanitizeMaterial),
    }));

    return NextResponse.json({
      success: true,
      data,
      pages: sanitizedUpdatedPages,
      pageUrl,
      cleanPageUrl,
      subdomain,
      slug: sanitizedSlug,
      liveTemplate,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('PUT /api/brand-materials error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/brand-materials?workspaceId=xxx&slug=yyy or &id=yyy
export async function DELETE(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    const slug = request.nextUrl.searchParams.get('slug');
    const id = request.nextUrl.searchParams.get('id');

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let deleteQuery = supabase
      .from('brand_materials_pages')
      .delete()
      .eq('workspace_id', workspaceId);

    if (id) {
      deleteQuery = deleteQuery.eq('id', id);
    } else if (slug) {
      deleteQuery = deleteQuery.eq('slug', slug);
    } else {
      return NextResponse.json({ error: 'slug or id required' }, { status: 400 });
    }

    const { error } = await deleteQuery;
    if (error) {
      return NextResponse.json({ error: 'Failed to delete brand page' }, { status: 500 });
    }

    // Return remaining pages
    const { data: remainingPages } = await supabase
      .from('brand_materials_pages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false });

    return NextResponse.json({
      success: true,
      pages: (remainingPages || []).map((p: any) => ({
        ...p,
        materials: (p.materials || []).map(sanitizeMaterial),
      })),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('DELETE /api/brand-materials error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
