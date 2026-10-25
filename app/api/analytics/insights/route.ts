import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { buildDailySeries, calcPercentageChange } from '@/lib/analytics/timeSeries';

import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';

export const dynamic = 'force-dynamic';

const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
const profileRepo = new SupabaseProfileRepository();

/**
 * Returns real analytics data for the dashboard:
 * - Daily time-series for the last 30 days (for sparklines)
 * - This week vs last week comparison (for % change)
 * - Top clicked links with real counts
 * - Peak viewing hour of the day (personalized insight)
 * - Referrer breakdown (where visitors come from)
 */
export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { workspaceId } = auth;
  const profile = await profileRepo.findByWorkspaceId(workspaceId);
  const profileId = profile?.id;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);

  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(lastWeekStart.getDate() - 14);

  // Helper to ensure queries match both workspace_id and profile_id if present
  const applyScope = (query: any) => {
    if (profileId) {
      return query.or(`workspace_id.eq.${workspaceId},profile_id.eq.${profileId}`);
    }
    return query.eq('workspace_id', workspaceId);
  };

  // All queries fire simultaneously
  const [
    viewsRaw,
    clicksRaw,
    viewsThisWeek,
    viewsLastWeek,
    clicksThisWeek,
    clicksLastWeek,
    topLinksRaw,
    peakHourRaw,
    referrersRaw,
    postsRaw,
    postsThisWeek,
    postsLastWeek,
  ] = await Promise.all([
    // Daily profile views last 30 days
    applyScope(
      admin
        .from('analytics_events')
        .select('created_at')
        .eq('event_type', 'profile_view')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
    ),

    // Daily link clicks last 30 days
    applyScope(
      admin
        .from('analytics_events')
        .select('created_at, event_data')
        .eq('event_type', 'link_click')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
    ),

    // Views this week (count)
    applyScope(
      admin
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'profile_view')
        .gte('created_at', thisWeekStart.toISOString())
    ),

    // Views last week (count)
    applyScope(
      admin
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'profile_view')
        .gte('created_at', lastWeekStart.toISOString())
        .lt('created_at', thisWeekStart.toISOString())
    ),

    // Clicks this week
    applyScope(
      admin
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'link_click')
        .gte('created_at', thisWeekStart.toISOString())
    ),

    // Clicks last week
    applyScope(
      admin
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'link_click')
        .gte('created_at', lastWeekStart.toISOString())
        .lt('created_at', thisWeekStart.toISOString())
    ),

    // Top clicked links (URL + count)
    applyScope(
      admin
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'link_click')
        .gte('created_at', thirtyDaysAgo.toISOString())
    ),

    // Peak hour (all profile views, grouped later in JS)
    applyScope(
      admin
        .from('analytics_events')
        .select('created_at')
        .eq('event_type', 'profile_view')
        .gte('created_at', thirtyDaysAgo.toISOString())
    ),

    // Referrer breakdown
    applyScope(
      admin
        .from('analytics_events')
        .select('referrer')
        .eq('event_type', 'profile_view')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('referrer', 'is', null)
    ),

    // Daily posts published last 30 days
    admin
      .from('posts')
      .select('created_at, published_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'published')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),

    // Posts published this week (count)
    admin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'published')
      .gte('created_at', thisWeekStart.toISOString()),

    // Posts published last week (count)
    admin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'published')
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', thisWeekStart.toISOString()),
  ]);

  // ── Build daily time-series for last 30 days (UTC-aligned) ─────────────
  const viewsSeries = buildDailySeries((viewsRaw.data || []) as Array<{ created_at?: string | null }>, now, 30);
  const clicksSeries = buildDailySeries(
    ((clicksRaw.data || []) as Array<{ created_at?: string | null }>).map((r) => ({ created_at: r.created_at })),
    now,
    30
  );
  const postsSeries = buildDailySeries(
    ((postsRaw.data || []) as Array<{ created_at?: string | null; published_at?: string | null }>).map((r) => ({
      created_at: r.published_at || r.created_at,
    })),
    now,
    30
  );

  // ── % change week-over-week ────────────────────────────────────────────────
  const viewsChangeWoW = calcPercentageChange(viewsThisWeek.count || 0, viewsLastWeek.count || 0);
  const clicksChangeWoW = calcPercentageChange(clicksThisWeek.count || 0, clicksLastWeek.count || 0);
  const postsThisWeekCount = postsThisWeek.count || 0;
  const postsChangeWoW = calcPercentageChange(postsThisWeekCount, postsLastWeek.count || 0);

  // ── Top clicked links ─────────────────────────────────────────────────────
  const linkCounts: Record<string, { url: string; label: string; count: number }> = {};
  for (const row of topLinksRaw.data || []) {
    const url = (row.event_data as any)?.link_url || 'unknown';
    const label = (row.event_data as any)?.link_text || url;
    if (!linkCounts[url]) linkCounts[url] = { url, label, count: 0 };
    linkCounts[url].count++;
  }
  const topLinks = Object.values(linkCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Peak hour of day ──────────────────────────────────────────────────────
  const hourBuckets: number[] = new Array(24).fill(0);
  for (const row of peakHourRaw.data || []) {
    const hour = new Date(row.created_at).getHours();
    hourBuckets[hour]++;
  }
  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));
  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };
  const peakHourLabel =
    Math.max(...hourBuckets) === 0
      ? null
      : `${formatHour(peakHour)}–${formatHour(peakHour + 1)}`;

  // ── Referrer breakdown ────────────────────────────────────────────────────
  const refCounts: Record<string, number> = {};
  for (const row of referrersRaw.data || []) {
    if (!row.referrer) continue;
    let source = 'Direct';
    try {
      const host = new URL(row.referrer).hostname.replace('www.', '');
      if (host.includes('linkedin')) source = 'LinkedIn';
      else if (host.includes('twitter') || host.includes('x.com')) source = 'X / Twitter';
      else if (host.includes('instagram')) source = 'Instagram';
      else if (host.includes('google')) source = 'Google';
      else source = host;
    } catch {
      source = 'Direct';
    }
    refCounts[source] = (refCounts[source] || 0) + 1;
  }
  const totalRefs = Object.values(refCounts).reduce((a, b) => a + b, 0) || 1;
  const referrers = Object.entries(refCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({
      source,
      count,
      pct: Math.round((count / totalRefs) * 100),
    }));

  // ── Conversion rate & Weekly Totals ─────────────────────────────────────
  // Synchronize exact weekly counts with 7-day sparkline window so tooltips and counters never diverge
  const weeklyViewsFromSeries = viewsSeries.slice(23).reduce((sum, v) => sum + v, 0);
  const totalViews = Math.max(viewsThisWeek.count || 0, weeklyViewsFromSeries);
  const weeklyClicksFromSeries = clicksSeries.slice(23).reduce((sum, v) => sum + v, 0);
  const totalClicks = Math.max(clicksThisWeek.count || 0, weeklyClicksFromSeries);
  const conversionRate =
    totalViews === 0 ? 0 : Math.round((totalClicks / totalViews) * 100);

  return NextResponse.json({
    viewsSeries,       // number[30] — real daily views
    clicksSeries,      // number[30] — real daily clicks
    postsSeries,       // number[30] — real daily published posts
    viewsThisWeek: totalViews,
    clicksThisWeek: totalClicks,
    postsThisWeek: postsThisWeekCount,
    viewsChangeWoW,    // % vs last week (positive = up, negative = down)
    clicksChangeWoW,
    postsChangeWoW,
    conversionRate,    // % of viewers who clicked
    topLinks,          // [{url, label, count}] top 5 clicked links
    peakHourLabel,     // "2pm–3pm" or null if no data
    referrers,         // [{source, count, pct}] where visitors come from
  });
}
