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

    // Fetch user profile to get subdomain & live page template theme
    const { data: profile } = await supabase
      .from('profiles')
      .select('subdomain, name, avatar_url, role, company, theme')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const subdomain = profile?.subdomain || 'user';
    const liveTemplate = (profile?.theme as any)?.template || (profile?.theme as any)?.preset || 'the-voice';

    // Fetch existing page for workspace and slug
    let pageQuery = supabase
      .from('brand_materials_pages')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (slug && slug !== 'page') {
      pageQuery = pageQuery.eq('slug', slug);
    } else {
      pageQuery = pageQuery.order('updated_at', { ascending: false }).limit(1);
    }
    const { data: pageResults } = await pageQuery;
    const pageData = pageResults && pageResults.length > 0 ? pageResults[0] : null;

    const effectiveSlug = pageData?.slug || slug || 'page';

    // Default structure if not created yet
    const page = pageData ? {
      ...pageData,
      materials: (pageData.materials || []).map(sanitizeMaterial),
    } : {
      slug: effectiveSlug,
      title: profile?.name ? `${profile.name}'s Brand & Product Showcase` : 'Brand & Product Showcase',
      tagline: 'Official materials, catalogues, lookbooks & resources',
      description: 'Explore our latest releases, documents, lookbooks, and brand materials curated in one central hub.',
      primary_cta_label: 'Visit Official Website',
      primary_cta_url: '',
      materials: [],
      theme: { accentColor: '#8B5CF6', template: liveTemplate },
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
      if (firstMaterial.type === 'image' || firstMaterial.type === 'pdf' || firstMaterial.type === 'doc') {
        queryParam = `file=${cleanSlug}`;
      } else {
        queryParam = `item=${cleanSlug}`;
      }
    }
    const pageUrl = buildSubdomainPageUrl(subdomain, sanitizedSlug, queryParam);
    const cleanPageUrl = buildSubdomainPageUrl(subdomain, sanitizedSlug);

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
