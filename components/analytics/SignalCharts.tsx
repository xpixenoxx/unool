'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Clock,
  Info,
  Sparkles,
  Table2,
  TrendingUp,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import type {
  ChannelRollup,
  EnrichedSignalPost,
  HookPerformanceRow,
  SignalAnalyticsPayload,
  TimingCell,
  WordBracketRow,
} from '@/lib/analytics/signalEngine';
import { PlatformBrandLogo, getPlatformConfig } from '@/components/dashboard/PlatformLogos';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function ConfidenceBadge({ confidence, n }: { confidence: 'low' | 'directional' | 'established'; n: number }) {
  const styles =
    confidence === 'established'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : confidence === 'directional'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-stone-100 text-stone-600 border-stone-200';
  const label =
    confidence === 'established'
      ? `Reliable (n=${n})`
      : confidence === 'directional'
      ? `Directional (n=${n})`
      : `Low sample (n=${n})`;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles}`}>
      {label}
    </span>
  );
}

/* ── 1. Accessible Daily Performance Trend Chart ──────────────────────────── */
export function DailyPerformanceChart({
  series,
  comparePeriod,
  showTableDefault = false,
}: {
  series: SignalAnalyticsPayload['dailySeries'];
  comparePeriod: boolean;
  showTableDefault?: boolean;
}) {
  const [metric, setMetric] = useState<'engagements' | 'views'>('engagements');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>(showTableDefault ? 'table' : 'chart');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const visibleSeries = useMemo(() => {
    if (series.length <= 45) return series;
    return series.slice(-45);
  }, [series]);

  const maxVal = useMemo(() => {
    let max = 1;
    for (const d of visibleSeries) {
      const curr = metric === 'views' ? d.views : d.engagements;
      const prev = metric === 'views' ? d.prevViews : d.prevEngagements;
      if (curr > max) max = curr;
      if (comparePeriod && prev > max) max = prev;
    }
    return max;
  }, [visibleSeries, metric, comparePeriod]);

  const activePoint =
    selectedIndex !== null && visibleSeries[selectedIndex]
      ? visibleSeries[selectedIndex]
      : visibleSeries[visibleSeries.length - 1] || null;

  return (
    <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#C8613D]" />
            <span>Performance Over Time</span>
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            {metric === 'views'
              ? 'Daily impressions & views across view-capable channels'
              : 'Daily interactions (reactions, comments, shares, saves, clicks) by published date'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-[#FAF7F2] p-1 border border-[#E8E0D4]" role="group" aria-label="Trend metric selector">
            <button
              type="button"
              onClick={() => setMetric('engagements')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                metric === 'engagements' ? 'bg-white text-[#1A1612] shadow-xs' : 'text-[#78716C] hover:text-[#1A1612]'
              }`}
            >
              Engagements
            </button>
            <button
              type="button"
              onClick={() => setMetric('views')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                metric === 'views' ? 'bg-white text-[#1A1612] shadow-xs' : 'text-[#78716C] hover:text-[#1A1612]'
              }`}
            >
              Views
            </button>
          </div>
          <button
            type="button"
            onClick={() => setViewMode(m => (m === 'chart' ? 'table' : 'chart'))}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-[#E8E0D4] bg-white text-[#57534E] hover:bg-[#FAF7F2]"
            aria-label={viewMode === 'chart' ? 'Switch trend to accessible data table' : 'Switch trend to bar chart'}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>{viewMode === 'chart' ? 'Table' : 'Chart'}</span>
          </button>
        </div>
      </div>

      {activePoint && viewMode === 'chart' && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4]/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[#1A1612]">{activePoint.date}</span>
          <div className="flex items-center gap-4 text-[#57534E]">
            <span>
              <strong className="text-[#1A1612]">{formatCompact(metric === 'views' ? activePoint.views : activePoint.engagements)}</strong>{' '}
              {metric}
            </span>
            {comparePeriod && (
              <span className="text-[#78716C]">
                Prior period: <strong>{formatCompact(metric === 'views' ? activePoint.prevViews : activePoint.prevEngagements)}</strong>
              </span>
            )}
            <span>
              Published: <strong>{activePoint.posts}</strong>
            </span>
          </div>
        </div>
      )}

      {viewMode === 'chart' ? (
        <div className="w-full overflow-x-auto">
          <div
            className="min-w-[440px] h-44 flex items-end gap-1 pt-4 pb-1 border-b border-[#E8E0D4]"
            role="list"
            aria-label="Daily performance bars"
          >
            {visibleSeries.map((day, idx) => {
              const val = metric === 'views' ? day.views : day.engagements;
              const prevVal = metric === 'views' ? day.prevViews : day.prevEngagements;
              const heightPct = val > 0 ? Math.max(4, Math.round((val / maxVal) * 100)) : 2;
              const prevHeightPct = prevVal > 0 ? Math.max(3, Math.round((prevVal / maxVal) * 100)) : 0;
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  onFocus={() => setSelectedIndex(idx)}
                  aria-label={`${day.date}: ${val} ${metric}, ${day.posts} posts published`}
                  className={`group flex-1 h-full flex flex-col justify-end items-center relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8613D] rounded-t ${
                    isSelected ? 'bg-[#FAF7F2]' : 'hover:bg-[#FAF7F2]/70'
                  }`}
                >
                  <div className="w-full h-32 flex items-end justify-center gap-0.5 px-0.5">
                    {comparePeriod && prevHeightPct > 0 && (
                      <div
                        className="w-1.5 rounded-t bg-[#D6CEC2] transition-all"
                        style={{ height: `${prevHeightPct}%` }}
                        aria-hidden="true"
                      />
                    )}
                    <div
                      className={`flex-1 max-w-[14px] rounded-t transition-all ${
                        isSelected
                          ? 'bg-[#C8613D]'
                          : val > 0
                          ? 'bg-[#C8613D]/75 group-hover:bg-[#C8613D]'
                          : 'bg-[#E8E0D4]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  {(idx === 0 || idx === visibleSeries.length - 1 || idx % 6 === 0) && (
                    <span className="text-[10px] text-[#78716C] mt-1 leading-none">{day.label}</span>
                  )}
                </button>
              );
            })}
          </div>
          {comparePeriod && (
            <div className="flex items-center gap-4 mt-2 text-[11px] text-[#78716C]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#C8613D]" /> Current period
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D6CEC2]" /> Prior period
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="max-h-64 overflow-auto border border-[#E8E0D4] rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF7F2] text-[#57534E] sticky top-0">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium text-right">Posts</th>
                <th className="px-3 py-2 font-medium text-right">Engagements</th>
                <th className="px-3 py-2 font-medium text-right">Views</th>
                {comparePeriod && <th className="px-3 py-2 font-medium text-right">Prior Eng.</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE3]">
              {[...visibleSeries].reverse().map(row => (
                <tr key={row.date} className="hover:bg-[#FAF7F2]/60">
                  <td className="px-3 py-1.5 font-medium text-[#1A1612]">{row.date}</td>
                  <td className="px-3 py-1.5 text-right text-[#57534E]">{row.posts}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-[#1A1612]">{row.engagements}</td>
                  <td className="px-3 py-1.5 text-right text-[#57534E]">{row.views}</td>
                  {comparePeriod && <td className="px-3 py-1.5 text-right text-[#78716C]">{row.prevEngagements}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── 2. Variant-Scoped Channel Comparison Bars ────────────────────────────── */
export function ChannelComparisonBars({
  channels,
  onSelectChannel,
}: {
  channels: ChannelRollup[];
  onSelectChannel?: (platform: string, accountId: string | null) => void;
}) {
  const maxEng = Math.max(...channels.map(c => c.totalEngagements), 1);

  if (channels.length === 0) {
    return (
      <div className="bg-white border border-[#E8E0D4] rounded-2xl p-5 text-center">
        <p className="text-sm font-medium text-[#1A1612]">No connected social channels yet</p>
        <p className="text-xs text-[#78716C] mt-1">Connect at least one account to compare platform performance.</p>
        <Link
          href="/onboarding/connect"
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-[#1A1612] text-white text-xs font-medium hover:bg-[#332C25]"
        >
          <span>Connect Social Accounts</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#C8613D]" />
            <span>Channel & Account Attribution</span>
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Strictly scoped per variant & account · Missing views reflect real platform API boundaries
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {channels.slice(0, 8).map(ch => {
          const pct = ch.totalEngagements > 0 ? Math.max(4, Math.round((ch.totalEngagements / maxEng) * 100)) : 2;
          const config = getPlatformConfig(ch.platform);
          const barColor = config?.color || '#C8613D';
          return (
            <button
              key={ch.key}
              type="button"
              onClick={() => onSelectChannel?.(ch.platform, ch.platformAccountId)}
              className="w-full text-left p-2.5 rounded-xl border border-transparent hover:border-[#E8E0D4] hover:bg-[#FAF7F2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8613D]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <PlatformBrandLogo platform={ch.platform} className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold text-[#1A1612] truncate">
                    {ch.label}
                    {ch.accountLabel ? ` · ${ch.accountLabel}` : ''}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E0D4] text-[#57534E]">
                    {ch.capability.capabilitySummary}
                  </span>
                  {(ch.connectionStatus === 'expired' || ch.connectionStatus === 'revoked') && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                      Token Expired
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#57534E] tabular-nums">
                  <span>{ch.publishedCount} posts</span>
                  <span className="font-semibold text-[#1A1612]">{formatCompact(ch.totalEngagements)} eng</span>
                  <span>
                    {ch.views !== null ? `${formatCompact(ch.views)} views` : 'Views: N/A'}
                  </span>
                  {ch.weightedEngagementRate !== null && (
                    <span className="text-emerald-700 font-medium">{ch.weightedEngagementRate}% ER</span>
                  )}
                </div>
              </div>
              <div className="w-full h-2 bg-[#F3EFE8] rounded-full overflow-hidden" aria-hidden="true">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── 3. Interactive 7×24 Timezone-Aware Timing Heatmap ────────────────────── */
export function TimingHeatmapMatrix({
  timing,
  posts,
  onOpenPost,
}: {
  timing: SignalAnalyticsPayload['timing'];
  posts: EnrichedSignalPost[];
  onOpenPost?: (post: EnrichedSignalPost) => void;
}) {
  const [metric, setMetric] = useState<'avgEngagements' | 'count'>('avgEngagements');
  const [selectedCell, setSelectedCell] = useState<TimingCell | null>(null);

  const maxCellValue = useMemo(() => {
    let max = 1;
    for (const row of timing.heatmap) {
      for (const cell of row) {
        const val = metric === 'count' ? cell.count : cell.avgEngagements;
        if (val > max) max = val;
      }
    }
    return max;
  }, [timing.heatmap, metric]);

  const contributingPosts = useMemo(() => {
    if (!selectedCell || selectedCell.postIds.length === 0) return [];
    const idSet = new Set(selectedCell.postIds);
    return posts.filter(p => idSet.has(p.id));
  }, [selectedCell, posts]);

  const formatHr = (h: number) => {
    if (h === 0) return '12a';
    if (h < 12) return `${h}a`;
    if (h === 12) return '12p';
    return `${h - 12}p`;
  };

  return (
    <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C8613D]" />
            <span>Best Time to Publish Matrix ({timing.timezone})</span>
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Bucketed by actual <code className="text-[11px] bg-[#FAF7F2] px-1 rounded">published_at</code> in {timing.timezone} · n={timing.publishedSampleCount} published posts
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-[#FAF7F2] p-1 border border-[#E8E0D4]" role="group" aria-label="Heatmap value selector">
          <button
            type="button"
            onClick={() => setMetric('avgEngagements')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
              metric === 'avgEngagements' ? 'bg-white text-[#1A1612] shadow-xs' : 'text-[#78716C]'
            }`}
          >
            Avg Engagement
          </button>
          <button
            type="button"
            onClick={() => setMetric('count')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
              metric === 'count' ? 'bg-white text-[#1A1612] shadow-xs' : 'text-[#78716C]'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      {/* Top Best Windows Summary */}
      {timing.bestSlots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {timing.bestSlots.map((slot, i) => (
            <div
              key={`${slot.dayIndex}-${slot.hour}`}
              className="p-3 rounded-xl border border-[#E8E0D4] bg-[#FAF7F2]/70 flex flex-col justify-between gap-2"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8613D]">
                    Slot #{i + 1}
                  </span>
                  <ConfidenceBadge confidence={slot.confidence} n={slot.count} />
                </div>
                <p className="text-sm font-semibold text-[#1A1612] mt-1">
                  {slot.dayName} · {slot.hourLabel}
                </p>
                <p className="text-xs text-[#57534E]">{slot.avgEngagements} avg engagements</p>
              </div>
              <Link
                href={`/dashboard/flightplan?slotDay=${slot.dayIndex}&slotHour=${slot.hour}&tz=${encodeURIComponent(timing.timezone)}&source=signal`}
                className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#1A1612] bg-white border border-[#E8E0D4] hover:border-[#C8613D] rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <Calendar className="w-3 h-3 text-[#C8613D]" />
                <span>Schedule in Flight Plan</span>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4] text-xs text-[#57534E]">
          Publish at least 1 post in this date range to unlock timezone-accurate slot recommendations.
        </div>
      )}

      {/* 7x24 Grid */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-1 mb-1">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-[10px] text-center text-[#78716C] font-medium">
                {h % 3 === 0 ? formatHr(h) : ''}
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {timing.heatmap.map((row, dayIdx) => (
              <div key={dayIdx} className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-1 items-center">
                <span className="text-xs font-medium text-[#57534E]">{timing.dayNames[dayIdx]}</span>
                {row.map(cell => {
                  const val = metric === 'count' ? cell.count : cell.avgEngagements;
                  const intensity = cell.count === 0 ? 0 : Math.max(0.18, Math.min(1, val / maxCellValue));
                  const isSelected =
                    selectedCell?.dayIndex === cell.dayIndex && selectedCell?.hour === cell.hour;

                  return (
                    <button
                      key={`${cell.dayIndex}-${cell.hour}`}
                      type="button"
                      onClick={() => setSelectedCell(cell)}
                      aria-label={`${timing.dayNames[dayIdx]} ${formatHr(cell.hour)}: ${cell.count} posts, ${cell.avgEngagements} average engagements`}
                      className={`h-6 rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1612] ${
                        isSelected ? 'ring-2 ring-[#1A1612] scale-105' : ''
                      }`}
                      style={{
                        backgroundColor:
                          cell.count === 0
                            ? '#F5F1EA'
                            : `rgba(200, 97, 61, ${intensity.toFixed(2)})`,
                      }}
                    >
                      <span className="sr-only">{val}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Cell Drill-down */}
      {selectedCell && (
        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-[#1A1612]">
              {timing.dayNames[selectedCell.dayIndex]} at {formatHr(selectedCell.hour)} ({timing.timezone}) —{' '}
              {selectedCell.count} post{selectedCell.count === 1 ? '' : 's'}, {selectedCell.avgEngagements} avg eng
            </div>
            <Link
              href={`/dashboard/flightplan?slotDay=${selectedCell.dayIndex}&slotHour=${selectedCell.hour}&tz=${encodeURIComponent(timing.timezone)}&source=signal`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C8613D] hover:underline"
            >
              <span>Schedule this slot</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {contributingPosts.length > 0 && (
            <div className="space-y-1.5">
              {contributingPosts.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenPost?.(p)}
                  className="w-full text-left text-xs p-2 rounded-lg bg-white border border-[#E8E0D4] hover:border-[#C8613D] flex items-center justify-between gap-2"
                >
                  <span className="truncate text-[#1A1612]">{p.content}</span>
                  <span className="shrink-0 font-semibold text-[#57534E] tabular-nums">
                    {p.scopedEngagement.totalEngagements} eng
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 4. Accessible Word-Count Effort & Length Brackets ────────────────────── */
export function WordCountEffortPanel({
  brackets,
  publishedPosts,
  onOpenPost,
}: {
  brackets: WordBracketRow[];
  publishedPosts: EnrichedSignalPost[];
  onOpenPost?: (post: EnrichedSignalPost) => void;
}) {
  const maxAvg = Math.max(...brackets.map(b => b.avgEngagements), 1);
  const [selectedPost, setSelectedPost] = useState<EnrichedSignalPost | null>(null);

  const maxWc = Math.max(...publishedPosts.map(p => p.wordCount), 50);
  const maxEng = Math.max(...publishedPosts.map(p => p.scopedEngagement.totalEngagements), 5);

  return (
    <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C8613D]" />
          <span>Length & Effort Attribution</span>
        </h3>
        <p className="text-xs text-[#78716C] mt-0.5">
          Shows average AND median engagements per word-count bracket across {publishedPosts.length} published posts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brackets summary bars */}
        <div className="space-y-2.5">
          {brackets.map(b => {
            const pct = b.avgEngagements > 0 ? Math.max(4, Math.round((b.avgEngagements / maxAvg) * 100)) : 2;
            return (
              <div key={b.id} className="p-2.5 rounded-xl bg-[#FAF7F2]/70 border border-[#E8E0D4]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#1A1612]">
                    {b.label} <span className="font-normal text-[#78716C]">({b.rangeLabel})</span>
                  </span>
                  <span className="text-[#57534E] tabular-nums">
                    n={b.publishedCount} · <strong>{b.avgEngagements} avg</strong> / {b.medianEngagements} med
                  </span>
                </div>
                <div className="h-2 bg-[#E8E0D4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C8613D] rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Accessible SVG Scatter */}
        <div className="border border-[#E8E0D4] rounded-xl p-3 bg-[#FAF7F2]/40 flex flex-col justify-between">
          {publishedPosts.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-xs text-[#78716C]">
              Publish posts to plot word count vs. total engagements.
            </div>
          ) : (
            <>
              <svg viewBox="0 0 360 150" className="w-full h-36 overflow-visible" role="img" aria-label="Word count versus engagements scatter chart">
                <line x1="24" y1="128" x2="346" y2="128" stroke="#D6CEC2" strokeWidth="1" />
                <line x1="24" y1="10" x2="24" y2="128" stroke="#D6CEC2" strokeWidth="1" />
                {publishedPosts.slice(0, 60).map(p => {
                  const x = 28 + Math.min(312, Math.round((p.wordCount / maxWc) * 308));
                  const y = 124 - Math.min(110, Math.round((p.scopedEngagement.totalEngagements / maxEng) * 106));
                  const active = selectedPost?.id === p.id;
                  return (
                    <circle
                      key={p.id}
                      cx={x}
                      cy={y}
                      r={active ? 6 : 4.5}
                      fill={p.hookColor || '#C8613D'}
                      fillOpacity={active ? 1 : 0.8}
                      stroke={active ? '#1A1612' : '#FFFFFF'}
                      strokeWidth={active ? 2 : 1}
                      tabIndex={0}
                      role="button"
                      aria-label={`${p.wordCount} words, ${p.scopedEngagement.totalEngagements} engagements: ${p.content.slice(0, 60)}`}
                      className="cursor-pointer focus:outline-none"
                      onClick={() => setSelectedPost(p)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPost(p);
                        }
                      }}
                    />
                  );
                })}
                <text x="180" y="145" textAnchor="middle" fontSize="10" fill="#78716C">
                  Word Count (0 – {maxWc})
                </text>
              </svg>
              {selectedPost && (
                <div className="mt-2 p-2 rounded-lg bg-white border border-[#E8E0D4] flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-[#1A1612]">
                    <strong>{selectedPost.wordCount}w</strong> · {selectedPost.scopedEngagement.totalEngagements} eng — {selectedPost.content}
                  </span>
                  {onOpenPost && (
                    <button
                      type="button"
                      onClick={() => onOpenPost(selectedPost)}
                      className="shrink-0 text-[#C8613D] font-semibold hover:underline"
                    >
                      Inspect
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 5. Hook Leaderboard ──────────────────────────────────────────────────── */
export function HookLeaderboard({
  hooks,
  activeHook,
  onSelectHook,
}: {
  hooks: HookPerformanceRow[];
  activeHook: string;
  onSelectHook: (hook: string) => void;
}) {
  if (hooks.length === 0) {
    return (
      <div className="bg-white border border-[#E8E0D4] rounded-2xl p-5 text-xs text-[#78716C]">
        Hook formula attribution appears once published posts exist in the selected period.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C8613D]" />
            <span>Hook Archetype Performance</span>
          </h3>
          <p className="text-xs text-[#78716C]">Click any hook row to filter posts below or draft a similar opener in Studio</p>
        </div>
        {activeHook !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectHook('all')}
            className="text-xs font-medium text-[#C8613D] hover:underline"
          >
            Clear hook filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-[#E8E0D4] text-[#78716C]">
            <tr>
              <th className="py-2 pr-3 font-medium">Hook Type</th>
              <th className="py-2 px-2 font-medium text-right">Posts</th>
              <th className="py-2 px-2 font-medium text-right">Avg Eng</th>
              <th className="py-2 px-2 font-medium text-right">Median Eng</th>
              <th className="py-2 px-2 font-medium text-right">Avg Views</th>
              <th className="py-2 px-2 font-medium">Confidence</th>
              <th className="py-2 pl-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3EFE8]">
            {hooks.map(row => {
              const selected = activeHook === row.hookType;
              return (
                <tr key={row.hookType} className={selected ? 'bg-[#FAF7F2]' : 'hover:bg-[#FAF7F2]/60'}>
                  <td className="py-2.5 pr-3">
                    <button
                      type="button"
                      onClick={() => onSelectHook(selected ? 'all' : row.hookType)}
                      className="flex items-center gap-2 font-semibold text-[#1A1612] hover:text-[#C8613D]"
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                      <span>{row.label}</span>
                    </button>
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-[#57534E]">{row.publishedCount}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-[#1A1612]">{row.avgEngagements}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-[#57534E]">{row.medianEngagements}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-[#57534E]">
                    {row.avgViews !== null ? formatCompact(row.avgViews) : 'N/A'}
                  </td>
                  <td className="py-2.5 px-2">
                    <ConfidenceBadge confidence={row.confidence} n={row.publishedCount} />
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    <Link
                      href={`/dashboard/composer?hookStyle=${encodeURIComponent(row.hookType)}`}
                      className="inline-flex items-center gap-1 font-medium text-[#C8613D] hover:underline"
                    >
                      <span>Draft</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
