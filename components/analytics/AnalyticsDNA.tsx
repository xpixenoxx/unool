'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { RefreshCw, Info, ArrowUpRight, AlertCircle } from 'lucide-react';
import type { SignalPost, ResonanceData } from '@/app/dashboard/signal/types';
import { computeSignalAnalytics, type SignalPostInput } from '@/lib/analytics/signalEngine';
import {
  ChannelComparisonBars,
  DailyPerformanceChart,
  HookLeaderboard,
  TimingHeatmapMatrix,
  WordCountEffortPanel,
} from './SignalCharts';

/**
 * Legacy-compatible AnalyticsDNA wrapper backed by the canonical
 * `signalEngine.ts` + accessible SVG charts (replaces old HTML <canvas> elements
 * and broken IG/LI whole-post summation / /dashboard/settings misroute).
 */
export function AnalyticsDNA({
  resonance: _resonance,
  posts,
  onSync,
  isSyncing,
}: {
  resonance: ResonanceData | null;
  posts: SignalPost[];
  onSync: () => void;
  isSyncing: boolean;
}) {
  const analytics = useMemo(() => {
    const inputs: SignalPostInput[] = posts.map(p => ({
      id: p.id,
      content: p.content,
      status: p.status,
      scheduledAt: p.scheduledAt ?? null,
      publishedAt: p.publishedAt ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt ?? p.createdAt,
      aiOrigin: p.origin ?? null,
      arcId: p.arcId ?? null,
      hookType: p.hookType,
      wordCount: p.wordCount,
      hasMedia: p.hasMedia,
      variants: (p.variants || []).map(v => ({
        id: v.id,
        platform: v.platform,
        platformConnectionId: v.platformConnectionId ?? null,
        accountUsername: v.accountUsername ?? null,
        accountDisplayName: v.accountDisplayName ?? null,
        status: v.status,
        adaptedContent: v.adaptedContent ?? '',
        scheduledAt: v.scheduledAt ?? null,
        publishedAt: v.publishedAt ?? null,
        platformPostId: v.platformPostId ?? null,
        platformUrl: v.platformUrl ?? null,
        error: v.error ?? null,
        rawEngagement: v.engagement
          ? {
              likes: v.engagement.likes,
              comments: v.engagement.comments,
              shares: v.engagement.shares,
              saves: v.engagement.saves,
              clicks: v.engagement.clicks,
              views: v.engagement.views ?? 0,
              hasRealData: v.engagement.hasRealData,
            }
          : null,
      })),
    }));

    const tz =
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        : 'UTC';

    return computeSignalAnalytics({
      posts: inputs,
      connectedAccounts: [],
      options: { range: '90d', timezone: tz },
    });
  }, [posts]);

  const publishedPosts = useMemo(
    () => analytics.posts.filter(p => p.effectiveStatus === 'published'),
    [analytics.posts]
  );

  if (publishedPosts.length === 0) {
    return (
      <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-[#C8613D] mx-auto" />
        <h3 className="text-base font-semibold text-[#1A1612]">No published posts in this window</h3>
        <p className="text-xs text-[#78716C] max-w-md mx-auto">
          Analytics measure real published dispatches. Connect a social account and publish a post from Studio or Flight Plan to populate charts.
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Link
            href="/onboarding/connect"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E0D4] text-xs font-medium text-[#1A1612] hover:border-[#C8613D]"
          >
            <span>Connect Social Accounts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard/composer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A1612] text-white text-xs font-medium"
          >
            <span>Open Studio</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-[#78716C] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#C8613D]" />
          <span>
            Showing {publishedPosts.length} published posts ({analytics.meta.timezone})
          </span>
        </div>
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E0D4] bg-white text-xs font-medium text-[#1A1612] hover:bg-[#FAF7F2] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing…' : 'Refresh Metrics'}</span>
        </button>
      </div>

      <DailyPerformanceChart series={analytics.dailySeries} comparePeriod={analytics.meta.comparePeriod} />
      <HookLeaderboard hooks={analytics.hookBreakdown} activeHook="all" onSelectHook={() => {}} />
      <WordCountEffortPanel brackets={analytics.wordCountBrackets} publishedPosts={publishedPosts} />
      <TimingHeatmapMatrix timing={analytics.timing} posts={analytics.posts} />
      <ChannelComparisonBars channels={analytics.channelBreakdown} />
    </div>
  );
}
