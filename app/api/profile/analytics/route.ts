import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import {
  CANONICAL_TEMPLATE_NAMES,
  getTemplateDisplayName,
  normalizeTemplateId,
} from '@/lib/profile/templateNormalization';

export const dynamic = 'force-dynamic';

interface AnalyticsEventRow {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  referrer: string | null;
  session_id: string | null;
  ip_hash: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveWorkspaceId = auth.workspaceId;
    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 365) : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const profileRepository = new SupabaseProfileRepository();
    const profile = await profileRepository.findByWorkspaceId(effectiveWorkspaceId);
    const currentTemplate = normalizeTemplateId(profile?.theme?.template || 'lone');

    // Attempt atomic server-side SQL aggregation first if deployed
    if (typeof supabaseAdmin.rpc === 'function') {
      try {
        const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('get_profile_analytics', {
          p_workspace_id: effectiveWorkspaceId,
          p_profile_id: profile?.id ?? null,
          p_days: days,
        });

        if (!rpcErr && rpcData && typeof rpcData === 'object') {
          const totalViews = Number((rpcData as Record<string, unknown>).totalViews || 0);
          const uniqueVisitors = Number((rpcData as Record<string, unknown>).uniqueVisitors || 0);
          const linkClicks = Number((rpcData as Record<string, unknown>).linkClicks || 0);
          const ctaClicks = Number((rpcData as Record<string, unknown>).ctaClicks || 0);
          const ctr = totalViews > 0 ? Math.round(((linkClicks + ctaClicks) / totalViews) * 1000) / 10 : 0;

          const rawTopLinks = Array.isArray((rpcData as Record<string, unknown>).topLinks)
            ? ((rpcData as Record<string, unknown>).topLinks as Array<Record<string, unknown>>)
            : [];
          const rawReferrers = Array.isArray((rpcData as Record<string, unknown>).topReferrers)
            ? ((rpcData as Record<string, unknown>).topReferrers as Array<Record<string, unknown>>)
            : [];
          const rawViewsOverTime = Array.isArray((rpcData as Record<string, unknown>).viewsOverTime)
            ? ((rpcData as Record<string, unknown>).viewsOverTime as Array<Record<string, unknown>>)
            : [];
          const rawTemplates = Array.isArray((rpcData as Record<string, unknown>).templateUsage)
            ? ((rpcData as Record<string, unknown>).templateUsage as Array<Record<string, unknown>>)
            : [];

          // Fill contiguous date range
          const dailyLookup = new Map<string, { views: number; clicks: number }>();
          for (const row of rawViewsOverTime) {
            const d = String(row.date || '');
            if (d) dailyLookup.set(d, { views: Number(row.views || 0), clicks: Number(row.clicks || 0) });
          }

          const viewsOverTime: Array<{ date: string; views: number; clicks: number }> = [];
          for (let i = Math.min(days, 30) - 1; i >= 0; i -= 1) {
            const d = new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0];
            const entry = dailyLookup.get(d);
            viewsOverTime.push({ date: d, views: entry?.views ?? 0, clicks: entry?.clicks ?? 0 });
          }

          // Merge RPC templates cleanly without double-counting
          const templateUsageMap = new Map<string, { views: number; clicks: number }>();
          for (const t of rawTemplates) {
            const rawId = String(t.templateId || 'unknown');
            const normId = rawId === 'unknown' ? currentTemplate : normalizeTemplateId(rawId);
            const cur = templateUsageMap.get(normId) || { views: 0, clicks: 0 };
            cur.views += Number(t.views || 0);
            cur.clicks += Number(t.clicks || 0);
            templateUsageMap.set(normId, cur);
          }

          const templateUsage = Array.from(templateUsageMap.entries())
            .filter(([, s]) => s.views > 0 || s.clicks > 0)
            .map(([templateId, s]) => ({
              templateId,
              templateName: getTemplateDisplayName(templateId),
              views: s.views,
              clicks: s.clicks,
              ctr: s.views > 0 ? Math.round((s.clicks / s.views) * 1000) / 10 : 0,
            }))
            .sort((a, b) => b.views - a.views || b.clicks - a.clicks);

          const totalVisits = rawReferrers.reduce((sum, r) => sum + Number(r.visits || 0), 0);

          return NextResponse.json({
            period: `${days}d`,
            profile: profile
              ? {
                  id: profile.id,
                  name: profile.name,
                  subdomain: profile.subdomain,
                  currentTemplate,
                  currentTemplateName: getTemplateDisplayName(currentTemplate),
                }
              : null,
            summary: {
              totalViews,
              uniqueVisitors,
              linkClicks,
              ctaClicks,
              ctr,
              avgSessionDuration: null,
            },
            topLinks: rawTopLinks.map((l) => ({
              label: String(l.label || 'Link'),
              url: String(l.url || ''),
              clicks: Number(l.clicks || 0),
            })),
            topReferrers: rawReferrers.map((r) => {
              const visits = Number(r.visits || 0);
              return {
                source: String(r.source || 'direct'),
                visits,
                percentage: totalVisits > 0 ? Math.round((visits / totalVisits) * 100) : 0,
              };
            }),
            viewsOverTime,
            templateUsage,
            availableTemplates: Object.entries(CANONICAL_TEMPLATE_NAMES).map(([id, name]) => ({ id, name })),
          });
        }
      } catch {
        // Fall through to query-based aggregation when RPC is not yet deployed
      }
    }

    // Fallback query path strictly scoped to effectiveWorkspaceId (never cross-workspace)
    let events: AnalyticsEventRow[] = [];
    const { data: workspaceEvents, error: evErr } = await supabaseAdmin
      .from('analytics_events')
      .select('id, event_type, event_data, referrer, session_id, ip_hash, created_at')
      .eq('workspace_id', effectiveWorkspaceId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000);

    if (!evErr && workspaceEvents) {
      const targetProfileId = profile?.id;
      events = (workspaceEvents as AnalyticsEventRow[]).filter((e) => {
        if (!targetProfileId) return true;
        const evProfileId = (e as unknown as { profile_id?: string | null }).profile_id;
        return !evProfileId || evProfileId === targetProfileId;
      });
    }

    let views = 0;
    let linkClicks = 0;
    let ctaClicks = 0;
    const uniqueVisitorKeys = new Set<string>();
    const referrersMap: Record<string, number> = {};
    // Store structured `{ label, url, clicks }` keyed by a null-byte separator so colons in https:// URLs never truncate
    const linkClicksMap = new Map<string, { label: string; url: string; clicks: number }>();
    const dailyStats: Record<string, { views: number; clicks: number }> = {};
    const templateUsageMap = new Map<string, { views: number; clicks: number }>();

    for (let i = Math.min(days, 30) - 1; i >= 0; i -= 1) {
      const dateStr = new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0];
      dailyStats[dateStr] = { views: 0, clicks: 0 };
    }

    for (const e of events) {
      const evType = e.event_type;
      const evData = e.event_data || {};
      const dateStr = e.created_at ? e.created_at.split('T')[0] : '';
      const rawTemplate = typeof evData.template === 'string' && evData.template.trim()
        ? evData.template.trim()
        : currentTemplate;
      const evTemplate = normalizeTemplateId(rawTemplate);
      const tEntry = templateUsageMap.get(evTemplate) || { views: 0, clicks: 0 };

      if (evType === 'profile_view') {
        views += 1;
        tEntry.views += 1;
        templateUsageMap.set(evTemplate, tEntry);
        uniqueVisitorKeys.add(e.session_id || e.ip_hash || e.id);

        if (dateStr && dailyStats[dateStr]) {
          dailyStats[dateStr].views += 1;
        }

        const rawRef = (e.referrer || (evData.referrer as string | undefined) || 'direct').trim().toLowerCase();
        const refKey = rawRef || 'direct';
        referrersMap[refKey] = (referrersMap[refKey] || 0) + 1;
      } else if (evType === 'link_click') {
        linkClicks += 1;
        tEntry.clicks += 1;
        templateUsageMap.set(evTemplate, tEntry);

        if (dateStr && dailyStats[dateStr]) {
          dailyStats[dateStr].clicks += 1;
        }

        const linkLabel = typeof evData.link_text === 'string' && evData.link_text.trim()
          ? evData.link_text.trim()
          : 'Link';
        const linkUrl = typeof evData.link_url === 'string' ? evData.link_url.trim() : '';
        const mapKey = `${linkLabel}\u0000${linkUrl}`;
        const existing = linkClicksMap.get(mapKey) || { label: linkLabel, url: linkUrl, clicks: 0 };
        existing.clicks += 1;
        linkClicksMap.set(mapKey, existing);
      } else if (evType === 'profile_cta_click') {
        ctaClicks += 1;
        tEntry.clicks += 1;
        templateUsageMap.set(evTemplate, tEntry);

        if (dateStr && dailyStats[dateStr]) {
          dailyStats[dateStr].clicks += 1;
        }
      }
    }

    const totalEngagement = linkClicks + ctaClicks;
    const ctr = views > 0 ? Math.round((totalEngagement / views) * 1000) / 10 : 0;

    const topLinks = Array.from(linkClicksMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const totalRefVisits = Object.values(referrersMap).reduce((sum, n) => sum + n, 0);
    const topReferrers = Object.entries(referrersMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, visits]) => ({
        source,
        visits,
        percentage: totalRefVisits > 0 ? Math.round((visits / totalRefVisits) * 100) : 0,
      }));

    const templateUsage = Array.from(templateUsageMap.entries())
      .filter(([, s]) => s.views > 0 || s.clicks > 0)
      .map(([templateId, s]) => ({
        templateId,
        templateName: getTemplateDisplayName(templateId),
        views: s.views,
        clicks: s.clicks,
        ctr: s.views > 0 ? Math.round((s.clicks / s.views) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.views - a.views || b.clicks - a.clicks);

    const viewsOverTime = Object.entries(dailyStats)
      .map(([date, data]) => ({ date, views: data.views, clicks: data.clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      period: `${days}d`,
      profile: profile
        ? {
            id: profile.id,
            name: profile.name,
            subdomain: profile.subdomain,
            currentTemplate,
            currentTemplateName: getTemplateDisplayName(currentTemplate),
          }
        : null,
      summary: {
        totalViews: views,
        uniqueVisitors: uniqueVisitorKeys.size,
        linkClicks,
        ctaClicks,
        ctr,
        avgSessionDuration: null,
      },
      topLinks,
      topReferrers,
      viewsOverTime,
      templateUsage,
      availableTemplates: Object.entries(CANONICAL_TEMPLATE_NAMES).map(([id, name]) => ({ id, name })),
    });
  } catch (error) {
    logger.error('Failed to get profile analytics', { error });
    return NextResponse.json({ error: 'Failed to get profile analytics' }, { status: 500 });
  }
}
