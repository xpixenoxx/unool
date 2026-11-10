import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface ResolveCreatorLinkOptions {
  configuredLinkUrl?: string | null;
  brandUsername?: string | null;
  mediaId?: string | null;
  userId?: string | null;
}

/**
 * Builds a creator's canonical UNOOL subdomain/slug URL.
 * Mirrors the routing rules in `middleware.ts` and `app/api/brand-materials/route.ts`.
 */
export function buildSubdomainDeliveryUrl(subdomain: string, slug?: string | null): string {
  const cleanSub = subdomain.trim().toLowerCase().replace(/^@/, '');
  const cleanSlug = slug?.trim().replace(/^\/+/, '');
  if (cleanSlug && cleanSlug !== 'showcase') {
    return `https://${cleanSub}.unool.co/${cleanSlug}`;
  }
  return `https://${cleanSub}.unool.co/`;
}

async function fetchWorkspaceSubdomain(
  workspaceId: string,
  userId?: string | null
): Promise<string | null> {
  try {
    const { data: rows } = await supabaseAdmin
      .from('profiles')
      .select('subdomain, deleted_at')
      .eq('workspace_id', workspaceId)
      .limit(5);

    if (Array.isArray(rows)) {
      const active = rows.find(
        (r: any) => !r?.deleted_at && typeof r?.subdomain === 'string' && r.subdomain.trim().length > 0
      );
      if (active?.subdomain) {
        return String(active.subdomain).trim().toLowerCase();
      }
    }
  } catch (err) {
    logger.debug('profiles lookup by workspace_id failed during link resolution', { workspaceId, err });
  }

  if (userId) {
    try {
      const { data: userRows } = await supabaseAdmin
        .from('profiles')
        .select('subdomain, deleted_at')
        .eq('user_id', userId)
        .limit(5);

      if (Array.isArray(userRows)) {
        const active = userRows.find(
          (r: any) => !r?.deleted_at && typeof r?.subdomain === 'string' && r.subdomain.trim().length > 0
        );
        if (active?.subdomain) {
          return String(active.subdomain).trim().toLowerCase();
        }
      }
    } catch (err) {
      logger.debug('profiles lookup by user_id failed during link resolution', { userId, err });
    }
  }

  return null;
}

async function fetchPublishedBrandPages(workspaceId: string): Promise<Array<Record<string, any>>> {
  try {
    const { data: pages } = await supabaseAdmin
      .from('brand_materials_pages')
      .select('slug, primary_cta_url, theme, is_published, updated_at')
      .eq('workspace_id', workspaceId)
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(20);

    return Array.isArray(pages) ? pages : [];
  } catch (err) {
    logger.debug('brand_materials_pages lookup failed during link resolution', { workspaceId, err });
    return [];
  }
}

function isSafeDnsSubdomainLabel(candidate?: string | null): string | null {
  if (!candidate) return null;
  const normalized = candidate.trim().toLowerCase().replace(/^@/, '');
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(normalized) ? normalized : null;
}

/**
 * Resolves the creator's delivery link for comments and DMs (including Follow-to-Unlock).
 *
 * Precedence:
 * 1. Published `brand_materials_pages` explicitly linked to `mediaId` (post-specific resource)
 * 2. Creator's configured `link_url` in `instagram_automation_config`
 * 3. Creator's UNOOL `profiles.subdomain` + latest published `brand_materials_pages.slug`
 * 4. Creator's UNOOL `profiles.subdomain` root (`https://{subdomain}.unool.co/`)
 *
 * Never falls back to the bare `https://unool.co` platform root.
 */
export async function resolveCreatorDeliveryLink(
  workspaceId: string,
  options: ResolveCreatorLinkOptions = {}
): Promise<string | undefined> {
  const { configuredLinkUrl, brandUsername, mediaId, userId } = options;

  let cachedSubdomain: string | null | undefined;
  const getSubdomain = async () => {
    if (cachedSubdomain === undefined) {
      cachedSubdomain = await fetchWorkspaceSubdomain(workspaceId, userId);
    }
    return cachedSubdomain;
  };

  let cachedPages: Array<Record<string, any>> | undefined;
  const getPages = async () => {
    if (cachedPages === undefined) {
      cachedPages = await fetchPublishedBrandPages(workspaceId);
    }
    return cachedPages;
  };

  // 1. Post-linked brand materials page takes priority when mediaId matches
  if (mediaId) {
    const pages = await getPages();
    const matched = pages.find((p) => {
      const linked = p?.theme?.linked_posts || p?.linked_posts || [];
      if (!Array.isArray(linked)) return false;
      return linked.some((lp: any) => {
        if (typeof lp === 'string') {
          const trimmed = lp.trim();
          return trimmed.length > 0 && (trimmed === mediaId || mediaId.includes(trimmed));
        }
        return (
          lp?.id === mediaId ||
          (typeof lp?.permalink === 'string' && lp.permalink.trim().length > 0 && lp.permalink.includes(mediaId))
        );
      });
    });

    if (matched) {
      const sub = (await getSubdomain()) || isSafeDnsSubdomainLabel(brandUsername);
      if (sub) {
        return buildSubdomainDeliveryUrl(sub, matched.slug);
      }
      if (typeof matched.primary_cta_url === 'string' && matched.primary_cta_url.trim()) {
        return matched.primary_cta_url.trim();
      }
    }
  }

  // 2. Explicit configured link_url in automation settings
  if (typeof configuredLinkUrl === 'string' && configuredLinkUrl.trim().length > 0) {
    return configuredLinkUrl.trim();
  }

  // 3 & 4. Automatic fallback to creator's claimed UNOOL subdomain + latest published page slug
  const [subdomain, pages] = await Promise.all([getSubdomain(), getPages()]);
  if (subdomain) {
    const latestPage = pages[0];
    if (latestPage?.slug) {
      return buildSubdomainDeliveryUrl(subdomain, latestPage.slug);
    }
    return buildSubdomainDeliveryUrl(subdomain);
  }

  // Last resort: published page's external CTA URL if no UNOOL subdomain exists yet
  const latestWithCta = pages.find((p) => typeof p?.primary_cta_url === 'string' && p.primary_cta_url.trim());
  if (latestWithCta?.primary_cta_url) {
    return String(latestWithCta.primary_cta_url).trim();
  }

  return undefined;
}
