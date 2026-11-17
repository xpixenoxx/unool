import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { syncWorkspaceEngagement } from '@/lib/services/analytics/syncEngagement';
import {
  loadWorkspaceSignalAnalytics,
  parseSignalFilterSearchParams,
} from '@/lib/analytics/signalDataLoader';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Legacy-compatible Signal Resonance Endpoint
 *
 * Delegates all metric math to the single canonical `signalEngine.ts`:
 *  - Counts strictly published posts in engagement denominators
 *  - Buckets Timing into the caller's IANA `?tz=` timezone using `published_at`
 *  - Fixes historical inverted Momentum calculation
 *  - Avoids fragile explicit select on optional un-migrated columns
 */
export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { workspaceId } = auth;

  const shouldSync = request.nextUrl.searchParams.get('sync') === 'true';

  if (shouldSync) {
    try {
      await syncWorkspaceEngagement(workspaceId, { maxPosts: 50, forceRefresh: true });
    } catch {
      // Non-blocking sync failure — proceed with persisted metrics
    }
  }

  try {
    const filters = parseSignalFilterSearchParams(request.nextUrl.searchParams);
    if (!request.nextUrl.searchParams.get('range')) {
      filters.range = '90d';
    }
    const { analytics } = await loadWorkspaceSignalAnalytics(workspaceId, filters);

    const publishedPosts = analytics.posts.filter(p => p.effectiveStatus === 'published');
    if (publishedPosts.length === 0) {
      return NextResponse.json({
        hasData: false,
        hasRealEngagement: false,
        totalPosts: 0,
        hookBreakdown: [],
        bestDay: null,
        bestHour: null,
        mediaLift: null,
        resonanceScore: null,
        momentumPct: 0,
        recommendations: [],
        meta: analytics.meta,
      });
    }

    const dayDistribution: Record<number, number> = {};
    const dayEngagement: Record<number, number> = {};
    for (const d of analytics.timing.dayStats) {
      dayDistribution[d.dayIndex] = d.count;
      dayEngagement[d.dayIndex] = Math.round(d.avgEngagements * d.count);
    }

    const hourDistribution: Record<number, number> = {};
    const hourEngagement: Record<number, number> = {};
    for (const h of analytics.timing.hourStats) {
      hourDistribution[h.hour] = h.count;
      hourEngagement[h.hour] = Math.round(h.avgEngagements * h.count);
    }

    const topDayStat = [...analytics.timing.dayStats]
      .filter(d => d.count > 0)
      .sort((a, b) => b.avgEngagements * b.count - a.avgEngagements * a.count || b.count - a.count)[0];

    const topHourStat = [...analytics.timing.hourStats]
      .filter(h => h.count > 0)
      .sort((a, b) => b.avgEngagements * b.count - a.avgEngagements * a.count || b.count - a.count)[0];

    const hookBreakdown = analytics.hookBreakdown.map(h => ({
      type: h.hookType,
      count: h.publishedCount,
      percentage: h.shareOfPublishedPct,
      totalInteractions: h.totalEngagements,
      avgInteractions: Math.round(h.avgEngagements),
      medianInteractions: h.medianEngagements,
      avgViews: h.avgViews,
      confidence: h.confidence,
    }));

    const avgWordCount =
      publishedPosts.length > 0
        ? Math.round(publishedPosts.reduce((s, p) => s + p.wordCount, 0) / publishedPosts.length)
        : 0;
    const mediaRatio =
      publishedPosts.length > 0
        ? Math.round(
            (publishedPosts.filter(p => p.hasMedia).length / publishedPosts.length) * 100
          )
        : 0;

    // Chronological ascending rows for legacy compatibility + explicit momentumPct
    const chronologicalRows = [...publishedPosts]
      .sort(
        (a, b) =>
          new Date(a.publishedAt || a.createdAt).getTime() -
          new Date(b.publishedAt || b.createdAt).getTime()
      )
      .map(p => ({
        date: p.publishedAt || p.createdAt,
        hookType: p.hookType,
        wordCount: p.wordCount,
        hasMedia: p.hasMedia,
        interactions: p.scopedEngagement.totalEngagements,
        views: p.scopedEngagement.views ?? 0,
      }));

    const hasRealEngagement = analytics.kpis.totalEngagements.value > 0 || analytics.kpis.views.value > 0;

    return NextResponse.json({
      hasData: true,
      hasRealEngagement,
      totalPosts: publishedPosts.length,
      totalInteractions: analytics.kpis.totalEngagements.value,
      avgInteractionsPerPost: Math.round(analytics.kpis.avgEngagementsPerPost.value),
      medianInteractionsPerPost: analytics.kpis.avgEngagementsPerPost.median,
      totalViews: analytics.kpis.views.value,
      weightedEngagementRate: analytics.kpis.weightedEngagementRate.value,
      hookBreakdown,
      topHook: hookBreakdown[0]?.type || 'statement',
      bestDay: topDayStat
        ? {
            day: topDayStat.dayIndex,
            name: `${topDayStat.label}`,
            count: topDayStat.count,
            interactions: Math.round(topDayStat.avgEngagements * topDayStat.count),
          }
        : null,
      bestHour: topHourStat
        ? {
            hour: topHourStat.hour,
            label: topHourStat.label,
            count: topHourStat.count,
            interactions: Math.round(topHourStat.avgEngagements * topHourStat.count),
          }
        : null,
      dayDistribution,
      dayEngagement,
      hourDistribution,
      hourEngagement,
      avgWordCount,
      mediaRatio,
      mediaLift: analytics.mediaComparison.liftPct,
      resonanceScore: analytics.kpis.resonanceScore.value,
      momentumPct: analytics.kpis.momentumPct.value,
      recommendations: analytics.recommendations.map(r => ({
        id: r.id,
        title: r.title,
        desc: r.detail,
        type: r.category,
        badge: r.badge,
        sampleSize: r.sampleSize,
        confidence: r.confidence,
        actionLabel: r.actionLabel,
        actionHref: r.actionHref,
      })),
      recentPatternRows: chronologicalRows.slice(-100),
      meta: analytics.meta,
    });
  } catch (err) {
    logger.error('Failed to generate Signal resonance', {
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Failed to compute resonance' }, { status: 500 });
  }
}
