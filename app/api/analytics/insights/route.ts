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

  // Helper to ensure queries match both workspace_id and profile_id if present
  const applyScope = (query: any) => {
    if (profileId) {
      return query.or(`workspace_id.eq.${workspaceId},profile_id.eq.${profileId}`);
    }
    return query.eq('workspace_id', workspaceId);
  };

  // Parallel fetch: exactly 3 queries covering all required datasets
  const [viewsRaw, clicksRaw, postsRaw] = await Promise.all([
    // 1. Profile views in the last 30 days (for series, peak hour, referrers, and week-over-week)
    applyScope(
      admin
        .from('analytics_events')
        .select('created_at, referrer')
        .eq('event_type', 'profile_view')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
    ),

    // 2. Link clicks in the last 30 days (for series, top links, and week-over-week)
    applyScope(
      admin
        .from('analytics_events')
        .select('created_at, event_data')
        .eq('event_type', 'link_click')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
    ),

    // 3. Published posts (for 30-day series, pace this week, and count this month)
    admin
      .from('posts')
      .select('id, created_at, published_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'published')
      .order('created_at', { ascending: true }),
  ]);

  // ── Build daily time-series for last 30 days (UTC-aligned) ─────────────
  const viewsSeries = buildDailySeries((viewsRaw.data || []) as Array<{ created_at?: string | null }>, now, 30);
  const clicksSeries = buildDailySeries(
    ((clicksRaw.data || []) as Array<{ created_at?: string | null }>).map((r) => ({ created_at: r.created_at })),
    now,
    30
  );

  const postsData = (postsRaw.data || []) as Array<{ id: string; created_at: string; published_at?: string | null }>;
  const postsSeries = buildDailySeries(
    postsData.map((r) => ({ created_at: r.published_at || r.created_at })),
    now,
    30
  );

  // ── Synchronized weekly and monthly totals matching the graphs ────────────
  // Indices -7..end represent the last 7 calendar days visible on the sparkline
  const viewsThisWeek = viewsSeries.slice(-7).reduce((sum, v) => sum + v, 0);
  const viewsLastWeek = viewsSeries.slice(-14, -7).reduce((sum, v) => sum + v, 0);
  const viewsChangeWoW = calcPercentageChange(viewsThisWeek, viewsLastWeek);

  const clicksThisWeek = clicksSeries.slice(-7).reduce((sum, v) => sum + v, 0);
  const clicksLastWeek = clicksSeries.slice(-14, -7).reduce((sum, v) => sum + v, 0);
  const clicksChangeWoW = calcPercentageChange(clicksThisWeek, clicksLastWeek);

  const postsThisWeek = postsSeries.slice(-7).reduce((sum, v) => sum + v, 0);
  const postsLastWeek = postsSeries.slice(-14, -7).reduce((sum, v) => sum + v, 0);
  const postsChangeWoW = calcPercentageChange(postsThisWeek, postsLastWeek);

  // Month-to-date published posts count
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const postsThisMonth = postsData.filter((p) => {
    const d = new Date(p.published_at || p.created_at);
    return d >= monthStart;
  }).length;

  // ── Top clicked links ─────────────────────────────────────────────────────
  const linkCounts: Record<string, { url: string; label: string; count: number }> = {};
  for (const row of clicksRaw.data || []) {
    const data = row.event_data as any;
    const url = data?.link_url || 'unknown';
    let label = data?.link_text || data?.label;
    if (!label || label === url) {
      try {
        const parsed = new URL(url);
        label = parsed.hostname.replace('www.', '') + (parsed.pathname !== '/' && parsed.pathname !== '' ? parsed.pathname : '');
      } catch {
        label = url;
      }
    }
    if (!linkCounts[url]) linkCounts[url] = { url, label, count: 0 };
    linkCounts[url].count++;
  }
  const topLinks = Object.values(linkCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Peak hour of day ──────────────────────────────────────────────────────
  const hourBuckets: number[] = new Array(24).fill(0);
  for (const row of viewsRaw.data || []) {
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
  for (const row of viewsRaw.data || []) {
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

  // ── Conversion rate percentage ──────────────────────────────────────────
  const conversionRate =
    viewsThisWeek === 0 ? 0 : Math.round((clicksThisWeek / viewsThisWeek) * 100);

  return NextResponse.json({
    viewsSeries,       // number[30] — real daily views
    clicksSeries,      // number[30] — real daily clicks
    postsSeries,       // number[30] — real daily published posts
    viewsThisWeek,     // synchronized with viewsSeries.slice(-7)
    clicksThisWeek,    // synchronized with clicksSeries.slice(-7)
    postsThisWeek,     // synchronized with postsSeries.slice(-7)
    postsThisMonth,    // posts published in current calendar month
    viewsChangeWoW,    // % vs last week (positive = up, negative = down)
    clicksChangeWoW,
    postsChangeWoW,
    conversionRate,    // % of viewers who clicked
    topLinks,          // [{url, label, count}] top 5 clicked links
    peakHourLabel,     // "2pm–3pm" or null if no data
    referrers,         // [{source, count, pct}] where visitors come from
  });
}
