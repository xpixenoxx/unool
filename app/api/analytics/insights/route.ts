import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';

const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

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

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);

  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(lastWeekStart.getDate() - 14);

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
  ] = await Promise.all([
    // Daily profile views last 30 days
    admin
      .from('analytics_events')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'profile_view')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),

    // Daily link clicks last 30 days
    admin
      .from('analytics_events')
      .select('created_at, event_data')
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'link_click')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),

    // Views this week (count)
    admin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'profile_view')
      .gte('created_at', thisWeekStart.toISOString()),

    // Views last week (count)
    admin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'profile_view')
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', thisWeekStart.toISOString()),

    // Clicks this week
    admin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'link_click')
      .gte('created_at', thisWeekStart.toISOString()),

    // Clicks last week
    admin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'link_click')
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', thisWeekStart.toISOString()),

    // Top clicked links (URL + count)
    admin
      .from('analytics_events')
      .select('event_data')
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'link_click')
      .gte('created_at', thirtyDaysAgo.toISOString()),

    // Peak hour (all profile views, grouped later in JS)
    admin
      .from('analytics_events')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'profile_view')
      .gte('created_at', thirtyDaysAgo.toISOString()),

    // Referrer breakdown
    admin
      .from('analytics_events')
      .select('referrer')
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'profile_view')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('referrer', 'is', null),
  ]);

  // ── Build daily time-series for last 30 days ──────────────────────────────
  // Creates an array of 30 daily buckets with real counts
  const buildDailySeries = (rows: Array<{ created_at: string }>) => {
    const buckets: Record<string, number> = {};
    // Pre-fill all 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const row of rows || []) {
      const day = row.created_at.slice(0, 10);
      if (buckets[day] !== undefined) buckets[day]++;
    }
    return Object.values(buckets); // ordered array of 30 numbers
  };

  const viewsSeries = buildDailySeries(viewsRaw.data || []);
  const clicksSeries = buildDailySeries(
    (clicksRaw.data || []).map((r) => ({ created_at: r.created_at }))
  );

  // ── % change week-over-week ────────────────────────────────────────────────
  const calcChange = (thisW: number, lastW: number) => {
    if (lastW === 0) return thisW > 0 ? 100 : 0;
    return Math.round(((thisW - lastW) / lastW) * 100);
  };

  const viewsChangeWoW = calcChange(viewsThisWeek.count || 0, viewsLastWeek.count || 0);
  const clicksChangeWoW = calcChange(clicksThisWeek.count || 0, clicksLastWeek.count || 0);

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

  // ── Conversion rate ───────────────────────────────────────────────────────
  const totalViews = viewsThisWeek.count || 0;
  const totalClicks = clicksThisWeek.count || 0;
  const conversionRate =
    totalViews === 0 ? 0 : Math.round((totalClicks / totalViews) * 100);

  return NextResponse.json({
    viewsSeries,       // number[30] — real daily views
    clicksSeries,      // number[30] — real daily clicks
    viewsThisWeek: totalViews,
    clicksThisWeek: totalClicks,
    viewsChangeWoW,    // % vs last week (positive = up, negative = down)
    clicksChangeWoW,
    conversionRate,    // % of viewers who clicked
    topLinks,          // [{url, label, count}] top 5 clicked links
    peakHourLabel,     // "2pm–3pm" or null if no data
    referrers,         // [{source, count, pct}] where visitors come from
  });
}
