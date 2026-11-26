'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bot,
  Calendar,
  Check,
  Clock,
  Download,
  ExternalLink,
  Flame,
  Filter,
  Globe,
  Info,
  Layers,
  LayoutGrid,
  Link2,
  Loader2,
  Lock,
  Printer,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  Table2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

import { PlatformBrandLogo, getPlatformConfig } from '@/components/dashboard/PlatformLogos';
import { useUserContext } from '@/lib/hooks/use-user-context';
import { registerClientCacheReset, syncClientCacheScope } from '@/lib/utils/clientCache';
import type {
  EnrichedSignalPost,
  SignalAnalyticsPayload,
  SignalOriginFilter,
  SignalRange,
  SignalSort,
} from '@/lib/analytics/signalEngine';
import { HOOK_TYPE_META, extractLeadHook } from '@/lib/analytics/postTelemetry';
import { getAllPlatformCapabilities } from '@/lib/analytics/platformCapabilities';
import {
  ChannelComparisonBars,
  ConfidenceBadge,
  DailyPerformanceChart,
  HookLeaderboard,
  TimingHeatmapMatrix,
  WordCountEffortPanel,
} from '@/components/analytics/SignalCharts';
import { PostInspectorDrawer } from '@/components/analytics/PostInspectorDrawer';

import { getDraftOrigin, getDraftRedirect, type SignalPost } from './types';
export { getDraftOrigin, getDraftRedirect, type SignalPost };

type SignalView = 'overview' | 'content' | 'timing' | 'channels';

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

// Workspace-scoped in-memory SWR cache (registered with clientCache for safe logout/account switch reset)
let memorySignalAnalytics: SignalAnalyticsPayload | null = null;
let memoryAnalyticsKey: string | null = null;

registerClientCacheReset(() => {
  memorySignalAnalytics = null;
  memoryAnalyticsKey = null;
});

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return String(num);
}

function DeltaPill({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
        <TrendingUp className="w-3 h-3" />+{value}{suffix}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
        <TrendingDown className="w-3 h-3" />{value}{suffix}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] font-medium text-[#78716C] bg-[#FAF7F2] border border-[#E8E0D4] px-1.5 py-0.5 rounded-full">
      0{suffix}
    </span>
  );
}

export function SignalClient() {
  const { user, workspace } = useUserContext();
  const activeWorkspaceId = workspace?.id || null;
  const urlParams = useSearchParams();

  const browserTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const timezoneOptions = useMemo(() => {
    return Array.from(new Set([browserTz, ...COMMON_TIMEZONES]));
  }, [browserTz]);

  // Persistent filter & view state initialized from URL searchParams
  const [view, setView] = useState<SignalView>(() => {
    const v = urlParams?.get('view');
    if (v === 'content' || v === 'timing' || v === 'channels') return v;
    // Map legacy ?tab=analytics|dna|feed gracefully
    const legacy = urlParams?.get('tab');
    if (legacy === 'analytics') return 'overview';
    if (legacy === 'dna' || legacy === 'feed') return 'content';
    return 'overview';
  });
  const [range, setRange] = useState<SignalRange>(() => {
    const r = urlParams?.get('range');
    if (r === '7d' || r === '14d' || r === '30d' || r === '90d' || r === '365d' || r === 'all') return r;
    return '30d';
  });
  const [platform, setPlatform] = useState<string>(() => urlParams?.get('platform') || 'all');
  const [accountId, setAccountId] = useState<string>(() => urlParams?.get('account') || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(() => urlParams?.get('status') || 'all');
  const [hookFilter, setHookFilter] = useState<string>(() => urlParams?.get('hook') || 'all');
  const [formatFilter, setFormatFilter] = useState<string>(() => urlParams?.get('format') || 'all');
  const [originFilter, setOriginFilter] = useState<SignalOriginFilter>(() => {
    const o = urlParams?.get('origin');
    return o === 'flightplan' || o === 'studio' ? o : 'all';
  });
  const [sortMode, setSortMode] = useState<SignalSort>(() => {
    const s = urlParams?.get('sort');
    if (s === 'top_engagement' || s === 'top_views' || s === 'top_eng_rate' || s === 'most_discussed') return s;
    return 'newest';
  });
  const [timezone, setTimezone] = useState<string>(() => urlParams?.get('tz') || browserTz);
  const [comparePeriod, setComparePeriod] = useState<boolean>(() => urlParams?.get('compare') !== 'false');
  const [searchText, setSearchText] = useState<string>(() => urlParams?.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchText);

  const [contentLayout, setContentLayout] = useState<'cards' | 'table'>('cards');
  const [analytics, setAnalytics] = useState<SignalAnalyticsPayload | null>(() => memorySignalAnalytics);
  const [loading, setLoading] = useState<boolean>(() => !memorySignalAnalytics);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [inspectorPost, setInspectorPost] = useState<EnrichedSignalPost | null>(null);
  const [sharePost, setSharePost] = useState<EnrichedSignalPost | null>(null);
  const [profileSubdomain, setProfileSubdomain] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const hasLoadedOnce = useRef(Boolean(memorySignalAnalytics));

  // Enforce workspace-scoped client cache isolation
  useEffect(() => {
    syncClientCacheScope(user?.id, activeWorkspaceId);
  }, [user?.id, activeWorkspaceId]);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 250);
    return () => clearTimeout(t);
  }, [searchText]);

  // Fetch profile subdomain for Share Story deep links
  useEffect(() => {
    let active = true;
    fetch('/api/profile', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) return;
        const data = await res.json();
        const sub = data?.profile?.subdomain || data?.subdomain || null;
        if (active && sub) setProfileSubdomain(sub);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeWorkspaceId]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set('range', range);
    if (platform !== 'all') p.set('platform', platform);
    if (accountId !== 'all') p.set('account', accountId);
    if (statusFilter !== 'all') p.set('status', statusFilter);
    if (hookFilter !== 'all') p.set('hook', hookFilter);
    if (formatFilter !== 'all') p.set('format', formatFilter);
    if (originFilter !== 'all') p.set('origin', originFilter);
    if (sortMode !== 'newest') p.set('sort', sortMode);
    if (debouncedSearch.trim()) p.set('search', debouncedSearch.trim());
    p.set('tz', timezone);
    p.set('compare', comparePeriod ? 'true' : 'false');
    if (activeWorkspaceId) p.set('workspaceId', activeWorkspaceId);
    return p.toString();
  }, [
    range,
    platform,
    accountId,
    statusFilter,
    hookFilter,
    formatFilter,
    originFilter,
    sortMode,
    debouncedSearch,
    timezone,
    comparePeriod,
    activeWorkspaceId,
  ]);

  // Keep browser URL synchronized cleanly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(queryString);
    p.set('view', view);
    p.delete('workspaceId');
    const nextUrl = `${window.location.pathname}?${p.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [queryString, view]);

  const fetchAnalytics = useCallback(
    async (options: { sync?: boolean; silent?: boolean } = {}) => {
      const { sync = false, silent = false } = options;
      const cacheKey = `${activeWorkspaceId || 'default'}:${queryString}`;

      if (!silent && (!hasLoadedOnce.current || memoryAnalyticsKey !== cacheKey) && !sync) {
        if (!memorySignalAnalytics) setLoading(true);
      }

      if (sync) {
        setIsSyncing(true);
        setSyncNotice(null);
      } else if (!silent) {
        setLoadError(null);
      }

      try {
        const extraParams = `${sync ? '&sync=true' : ''}${silent && !sync ? '&poll=1' : ''}`;
        const url = `/api/signal/analytics?${queryString}${extraParams}`;
        const res = await fetch(url, { credentials: 'include' });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const msg = errBody.error || `Request failed (${res.status})`;
          if (sync) {
            setSyncNotice(`Sync failed: ${msg}`);
            toast.error(`Live sync failed: ${msg}`);
          } else {
            setLoadError(msg);
          }
          return;
        }

        const data = await res.json();
        memorySignalAnalytics = data;
        memoryAnalyticsKey = cacheKey;
        hasLoadedOnce.current = true;
        setAnalytics(data);
        setLoadError(null);

        // Notify sidebar badge of current 24h drafts cleanly
        if (typeof window !== 'undefined' && Array.isArray(data.posts)) {
          const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
          const draft24h = data.posts.filter((p: EnrichedSignalPost) => {
            if (p.effectiveStatus !== 'draft') return false;
            const ms = new Date(p.createdAt).getTime();
            return Number.isFinite(ms) && ms >= dayAgo;
          }).length;
          window.dispatchEvent(
            new CustomEvent('signal-pending-count-updated', { detail: { count: draft24h } })
          );
        }

        if (sync && data.syncSummary) {
          const s = data.syncSummary;
          if (s.expiredTokenCount > 0 || s.rateLimitedCount > 0 || s.failedCount > 0) {
            const parts: string[] = [];
            if (s.syncedCount > 0) parts.push(`${s.syncedCount} updated`);
            if (s.expiredTokenCount > 0) parts.push(`${s.expiredTokenCount} expired token(s)`);
            if (s.rateLimitedCount > 0) parts.push(`${s.rateLimitedCount} rate limited`);
            if (s.failedCount - s.expiredTokenCount - s.rateLimitedCount > 0) {
              parts.push(`${s.failedCount - s.expiredTokenCount - s.rateLimitedCount} API error(s)`);
            }
            const summaryText = `Partial sync: ${parts.join(', ')}. Cached metrics preserved.`;
            setSyncNotice(summaryText);
            toast.warning(summaryText);
          } else if (s.syncedCount > 0) {
            toast.success(`Synced live metrics across ${s.syncedCount} post(s).`);
          } else {
            toast.info('Metrics checked — up to date.');
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        if (sync) {
          setSyncNotice(`Could not reach sync service: ${msg}`);
          toast.error('Could not reach live sync service.');
        } else {
          setLoadError(`Unable to load Signal analytics: ${msg}`);
        }
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    },
    [queryString, activeWorkspaceId]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Listen to Studio / SignalStrip broadcast events + gently poll while publishing is active.
  // When idle (no posts publishing), poll every 5 minutes instead of every 30s and pause
  // background polling after an error until a manual retry/refresh succeeds.
  useEffect(() => {
    const handleSignalEvent = () => {
      fetchAnalytics({ silent: true });
    };
    window.addEventListener('signal-posts-updated', handleSignalEvent);
    window.addEventListener('signal-strip-publish', handleSignalEvent);

    const hasPublishing = (analytics?.operational?.publishingPosts ?? 0) > 0;
    const intervalMs = hasPublishing ? 5_000 : 300_000;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !loadError) {
        fetchAnalytics({ silent: true });
      }
    }, intervalMs);

    return () => {
      window.removeEventListener('signal-posts-updated', handleSignalEvent);
      window.removeEventListener('signal-strip-publish', handleSignalEvent);
      clearInterval(timer);
    };
  }, [fetchAnalytics, analytics?.operational?.publishingPosts, loadError]);

  const handleDeletePost = useCallback(
    async (
      postId: string,
      options?: { deleteFromPlatform?: boolean; variantId?: string }
    ): Promise<boolean> => {
      const res = await fetch('/api/signal/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postId,
          deleteFromPlatform: options?.deleteFromPlatform === true,
          ...(options?.variantId ? { variantId: options.variantId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({} as Record<string, any>));
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete post');
        return false;
      }

      const deletedPlatforms: string[] = Array.isArray(data.remoteResults?.deleted)
        ? data.remoteResults.deleted.map((d: { platform: string }) => d.platform)
        : [];
      const failedPlatforms: Array<{ platform: string; error: string }> = Array.isArray(data.remoteResults?.failed)
        ? data.remoteResults.failed
        : [];

      if (failedPlatforms.length > 0) {
        const failedNames = failedPlatforms.map((f) => f.platform).join(', ');
        toast.warning(`Removed from Unool, but live delete failed on: ${failedNames}`);
      } else if (deletedPlatforms.length > 0) {
        toast.success(`Deleted live post from ${deletedPlatforms.join(', ')}`);
      } else {
        toast.success('Post removed');
      }

      if (inspectorPost?.id === postId) {
        if (options?.variantId && !data.postDeleted) {
          setInspectorPost((prev) =>
            prev && prev.id === postId
              ? { ...prev, variants: prev.variants.filter((v) => v.id !== options.variantId) }
              : prev
          );
        } else {
          setInspectorPost(null);
        }
      }
      await fetchAnalytics({ silent: true });
      return true;
    },
    [fetchAnalytics, inspectorPost?.id]
  );

  const handleExportCsv = useCallback(async () => {
    if (!analytics?.meta?.csvExportAllowed) {
      toast.error('CSV export requires a Pro or Studio plan. Use Print Report or upgrade in Billing.');
      return;
    }
    const url = `/api/signal/export?${queryString}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      toast.error(errBody.error || 'CSV export blocked');
      return;
    }
    const blob = await res.blob();
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `unool-signal-${analytics.meta.effectiveRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(dlUrl);
    toast.success('CSV report downloaded');
  }, [analytics?.meta?.csvExportAllowed, analytics?.meta?.effectiveRange, queryString]);

  const resetAllFilters = useCallback(() => {
    setRange('30d');
    setPlatform('all');
    setAccountId('all');
    setStatusFilter('all');
    setHookFilter('all');
    setFormatFilter('all');
    setOriginFilter('all');
    setSortMode('newest');
    setSearchText('');
  }, []);

  const hasActiveFilters =
    range !== '30d' ||
    platform !== 'all' ||
    accountId !== 'all' ||
    statusFilter !== 'all' ||
    hookFilter !== 'all' ||
    formatFilter !== 'all' ||
    originFilter !== 'all' ||
    Boolean(searchText.trim());

  const availablePlatforms = useMemo(() => {
    if (!analytics) return [];
    const seen = new Map<string, string>();
    for (const c of analytics.channelBreakdown) {
      if (!seen.has(c.platform)) seen.set(c.platform, c.label);
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [analytics]);

  const availableAccounts = useMemo(() => {
    if (!analytics) return [];
    return analytics.channelBreakdown.filter(c => platform === 'all' || c.platform === platform);
  }, [analytics, platform]);

  const publishedPostsInWindow = useMemo(
    () => (analytics?.posts || []).filter(p => p.effectiveStatus === 'published'),
    [analytics?.posts]
  );

  /* ── Render: Full-page Loading Skeleton ─────────────────────────────────── */
  if (loading && !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-56 rounded-xl bg-[#EFE9DF] animate-pulse" />
          <div className="h-9 w-44 rounded-xl bg-[#EFE9DF] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[#EFE9DF]/70 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-[#EFE9DF]/60 animate-pulse" />
      </div>
    );
  }

  /* ── Render: Network / API Error State (never masked as 0s) ─────────────── */
  if (loadError && !analytics) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-semibold text-[#1A1612]">Could not load Signal Analytics</h2>
          <p className="text-xs text-[#57534E]">{loadError}</p>
          <button
            type="button"
            onClick={() => fetchAnalytics()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1612] text-white text-xs font-medium hover:bg-[#332C25]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Load</span>
          </button>
        </div>
      </div>
    );
  }

  const isBrandNewWorkspace =
    analytics &&
    analytics.syncHealth.connectedAccountCount === 0 &&
    analytics.operational.totalPosts === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5 print:p-0">
      {/* ── Header + Sync Freshness + Report Actions ─────────────────────────── */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1612] flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#C8613D]" />
              <span>Signal Intelligence</span>
            </h1>
            {analytics && (
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                  analytics.syncHealth.status === 'healthy'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : analytics.syncHealth.status === 'partial' || analytics.syncHealth.status === 'degraded'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-[#FAF7F2] text-[#57534E] border-[#E8E0D4]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    analytics.syncHealth.status === 'healthy'
                      ? 'bg-emerald-500'
                      : analytics.syncHealth.status === 'partial' || analytics.syncHealth.status === 'degraded'
                      ? 'bg-amber-500'
                      : 'bg-stone-400'
                  }`}
                />
                <span>
                  {analytics.syncHealth.lastSyncedAt
                    ? `Synced ${formatDistanceToNow(new Date(analytics.syncHealth.lastSyncedAt), { addSuffix: true })}`
                    : analytics.syncHealth.status === 'no_accounts'
                    ? 'No social accounts connected'
                    : 'Pending first live sync'}
                </span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            Closed-loop performance across Hook Formulas, Multi-Account Channels, Publishing Windows, Bio-Links & SignalDM
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => fetchAnalytics({ sync: true })}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E0D4] text-xs font-semibold text-[#1A1612] hover:border-[#C8613D] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C8613D] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing…' : 'Sync Live Metrics'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E0D4] text-xs font-semibold text-[#1A1612] hover:border-[#C8613D]"
          >
            {analytics?.meta?.csvExportAllowed ? (
              <Download className="w-3.5 h-3.5 text-[#57534E]" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E0D4] text-xs font-semibold text-[#1A1612] hover:border-[#C8613D]"
          >
            <Printer className="w-3.5 h-3.5 text-[#57534E]" />
            <span>Print Report</span>
          </button>

          <Link
            href="/dashboard/composer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A1612] text-white text-xs font-semibold hover:bg-[#332C25]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Post</span>
          </Link>
        </div>
      </header>

      {/* ── Partial Sync / Error / Retention Transparency Notices ─────────────── */}
      {loadError && analytics && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-xs text-rose-800 print:hidden">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Refresh failed ({loadError}) — displaying last loaded snapshot.</span>
          </span>
          <button type="button" onClick={() => fetchAnalytics()} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {syncNotice && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900 print:hidden">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{syncNotice}</span>
          </span>
          <Link href="/onboarding/connect" className="font-semibold underline shrink-0">
            Check Connections
          </Link>
        </div>
      )}

      {analytics?.meta?.truncatedByPlan && (
        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4] flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
          <span>
            <strong>{analytics.meta.planName} Plan</strong> retains up to{' '}
            <strong>{analytics.meta.retentionDays} days</strong> of analytics history (clamped from{' '}
            {analytics.meta.requestedRange}).
          </span>
          <Link href="/dashboard/billing" className="font-semibold text-[#C8613D] hover:underline print:hidden">
            Upgrade retention →
          </Link>
        </div>
      )}

      {/* ── Navigation View Tabs (1-Level Coherent IA) ───────────────────────── */}
      <nav
        className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E0D4] pb-2 print:hidden"
        aria-label="Signal analytics views"
      >
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {(
            [
              { id: 'overview', label: 'Overview', icon: Activity },
              {
                id: 'content',
                label: `Content & Hooks (${analytics?.operational.totalPosts ?? 0})`,
                icon: Layers,
              },
              { id: 'timing', label: 'Timing & Cadence', icon: Clock },
              { id: 'channels', label: 'Channels & Funnel', icon: BarChart3 },
            ] as const
          ).map(t => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8613D] ${
                  active
                    ? 'bg-[#1A1612] text-white'
                    : 'bg-white border border-[#E8E0D4] text-[#57534E] hover:text-[#1A1612]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Timezone Selector */}
        <div className="flex items-center gap-2 text-xs">
          <Globe className="w-3.5 h-3.5 text-[#78716C]" aria-hidden="true" />
          <label htmlFor="signal-tz-select" className="sr-only">
            Analytics timezone
          </label>
          <select
            id="signal-tz-select"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="bg-white border border-[#E8E0D4] rounded-xl px-2.5 py-1.5 text-xs text-[#1A1612] focus:outline-none focus:ring-2 focus:ring-[#C8613D]"
          >
            {timezoneOptions.map(tz => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* ── Persistent Global Filter Bar (Applies Across ALL Views) ──────────── */}
      <section
        aria-label="Global Analytics Filters"
        className="bg-white border border-[#E8E0D4] rounded-2xl p-3 sm:p-4 space-y-3 print:hidden"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Pills */}
          <div className="inline-flex flex-wrap rounded-xl bg-[#FAF7F2] p-1 border border-[#E8E0D4]" role="group" aria-label="Date range">
            {(['7d', '14d', '30d', '90d', '365d', 'all'] as SignalRange[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  range === r ? 'bg-white text-[#1A1612] shadow-xs font-semibold' : 'text-[#78716C] hover:text-[#1A1612]'
                }`}
              >
                {r === 'all' ? 'All' : r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setComparePeriod(v => !v)}
            aria-pressed={comparePeriod}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
              comparePeriod
                ? 'bg-[#FAF7F2] border-[#C8613D] text-[#1A1612]'
                : 'bg-white border-[#E8E0D4] text-[#78716C]'
            }`}
          >
            Compare Prior Period
          </button>

          {/* Platform Select */}
          <select
            aria-label="Filter by platform"
            value={platform}
            onChange={e => {
              setPlatform(e.target.value);
              setAccountId('all');
            }}
            className="bg-white border border-[#E8E0D4] rounded-xl px-2.5 py-1.5 text-xs text-[#1A1612]"
          >
            <option value="all">All Platforms</option>
            {availablePlatforms.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Multi-Account Select */}
          {availableAccounts.length > 0 && (
            <select
              aria-label="Filter by connected account"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="bg-white border border-[#E8E0D4] rounded-xl px-2.5 py-1.5 text-xs text-[#1A1612]"
            >
              <option value="all">All Accounts ({availableAccounts.length})</option>
              {availableAccounts.map(a => (
                <option key={a.key} value={a.platformAccountId || a.key}>
                  {a.label}
                  {a.accountLabel ? ` · ${a.accountLabel}` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Origin Select */}
          <select
            aria-label="Filter by workflow origin"
            value={originFilter}
            onChange={e => setOriginFilter(e.target.value as SignalOriginFilter)}
            className="bg-white border border-[#E8E0D4] rounded-xl px-2.5 py-1.5 text-xs text-[#1A1612]"
          >
            <option value="all">All Sources</option>
            <option value="studio">Studio / Composer</option>
            <option value="flightplan">Flight Plan Arcs</option>
          </select>

          {/* Hook Filter */}
          <select
            aria-label="Filter by hook style"
            value={hookFilter}
            onChange={e => setHookFilter(e.target.value)}
            className="bg-white border border-[#E8E0D4] rounded-xl px-2.5 py-1.5 text-xs text-[#1A1612]"
          >
            <option value="all">All Hook Styles</option>
            {Object.values(HOOK_TYPE_META).map(h => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search copy or hashtags…"
              aria-label="Search posts"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8E0D4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8613D]"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#C8613D] hover:bg-[#FAF7F2]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </section>

      {/* ── Brand-New Onboarding Empty State ─────────────────────────────────── */}
      {isBrandNewWorkspace && analytics && (
        <section className="bg-white border border-[#E8E0D4] rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D4] flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6 text-[#C8613D]" />
          </div>
          <div className="max-w-lg mx-auto space-y-1.5">
            <h2 className="text-lg font-bold text-[#1A1612]">Signal is ready for your first broadcast</h2>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Once you connect social accounts and publish posts via Studio or Flight Plan, Signal automatically tracks per-variant views, engagements, hook formula winners, best posting windows, and Unool bio-link conversions.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/onboarding/connect"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E8E0D4] text-xs font-semibold text-[#1A1612] hover:border-[#C8613D]"
            >
              <span>1. Connect Social Accounts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/dashboard/composer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1612] text-white text-xs font-semibold hover:bg-[#332C25]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. Draft First Post in Studio</span>
            </Link>
          </div>
        </section>
      )}

      {/* ── Operational Queue Alert (Publishing / Failures / Expired Tokens) ─── */}
      {analytics &&
        (analytics.operational.publishingPosts > 0 ||
          analytics.operational.failedPosts > 0 ||
          analytics.operational.partialFailurePosts > 0 ||
          analytics.operational.overdueScheduledPosts > 0) && (() => {
          const hasFailures =
            analytics.operational.failedPosts > 0 || analytics.operational.partialFailurePosts > 0;
          const issuePost = analytics.posts.find(p =>
            hasFailures
              ? p.effectiveStatus === 'failed' || p.variants.some(v => v.status === 'failed')
              : analytics.operational.overdueScheduledPosts > 0
              ? p.effectiveStatus === 'scheduled'
              : p.effectiveStatus === 'publishing'
          );
          const firstFailedVariant = issuePost?.variants.find(v => v.status === 'failed');
          const firstFailedPlatform = firstFailedVariant
            ? getPlatformConfig(firstFailedVariant.canonicalPlatform)?.name || firstFailedVariant.capability.label
            : null;

          return (
            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {analytics.operational.publishingPosts > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{analytics.operational.publishingPosts} publishing live</span>
                  </span>
                )}
                {hasFailures && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      {analytics.operational.failedPosts + analytics.operational.partialFailurePosts} delivery issue(s) need attention
                    </span>
                  </span>
                )}
                {firstFailedVariant?.error && (
                  <span className="text-rose-800 bg-rose-50/70 border border-rose-200/80 px-2.5 py-1 rounded-xl max-w-xl truncate" title={firstFailedVariant.error}>
                    <strong>{firstFailedPlatform}:</strong> {firstFailedVariant.error}
                  </span>
                )}
                {analytics.operational.overdueScheduledPosts > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#57534E]">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{analytics.operational.overdueScheduledPosts} overdue scheduled item(s)</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setView('content');
                  if (hasFailures) {
                    setStatusFilter('failed');
                  } else if (analytics.operational.overdueScheduledPosts > 0) {
                    setStatusFilter('scheduled');
                  } else if (analytics.operational.publishingPosts > 0) {
                    setStatusFilter('publishing');
                  }
                  if (issuePost) {
                    setInspectorPost(issuePost);
                  }
                  requestAnimationFrame(() => {
                    document
                      .getElementById('signal-post-feed')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  });
                }}
                className="text-xs font-semibold text-[#C8613D] hover:underline"
              >
                Inspect Queue →
              </button>
            </div>
          );
        })()}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW 1: OVERVIEW                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {analytics && view === 'overview' && !isBrandNewWorkspace && (
        <div className="space-y-5">
          {/* 6-Card Executive KPI Strip */}
          <section aria-label="Key performance indicators" className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {/* KPI 1: Views */}
            <button
              type="button"
              onClick={() => {
                setSortMode('top_views');
                setView('content');
              }}
              className="bg-white border border-[#E8E0D4] hover:border-[#C8613D] rounded-2xl p-3.5 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                <span>Views / Reach</span>
                <Info className="w-3.5 h-3.5" aria-label="Measured on view-capable platforms only" />
              </div>
              <div className="text-xl font-bold text-[#1A1612] mt-1 tabular-nums">
                {formatCompact(analytics.kpis.views.value)}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <DeltaPill value={analytics.kpis.views.deltaPct} />
                <span className="text-[10px] text-[#78716C]">{analytics.kpis.views.eligibleVariants} variants</span>
              </div>
            </button>

            {/* KPI 2: Engagements */}
            <button
              type="button"
              onClick={() => {
                setSortMode('top_engagement');
                setView('content');
              }}
              className="bg-white border border-[#E8E0D4] hover:border-[#C8613D] rounded-2xl p-3.5 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                <span>Total Engagements</span>
              </div>
              <div className="text-xl font-bold text-[#1A1612] mt-1 tabular-nums">
                {formatCompact(analytics.kpis.totalEngagements.value)}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <DeltaPill value={analytics.kpis.totalEngagements.deltaPct} />
                <span className="text-[10px] text-[#78716C]">
                  Avg {analytics.kpis.avgEngagementsPerPost.value}/post
                </span>
              </div>
            </button>

            {/* KPI 3: Weighted Engagement Rate */}
            <button
              type="button"
              onClick={() => {
                setSortMode('top_eng_rate');
                setView('content');
              }}
              className="bg-white border border-[#E8E0D4] hover:border-[#C8613D] rounded-2xl p-3.5 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                <span>Engagement Rate</span>
              </div>
              <div className="text-xl font-bold text-[#1A1612] mt-1 tabular-nums">
                {analytics.kpis.weightedEngagementRate.value !== null
                  ? `${analytics.kpis.weightedEngagementRate.value}%`
                  : 'N/A'}
              </div>
              <div className="mt-1.5 text-[10px] text-[#78716C]">
                {analytics.kpis.weightedEngagementRate.eligibleVariants > 0
                  ? `${analytics.kpis.weightedEngagementRate.eligibleVariants} view-backed variants`
                  : 'Needs view-capable impressions'}
              </div>
            </button>

            {/* KPI 4: Chronological Momentum */}
            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-3.5 text-left">
              <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                <span>Momentum</span>
                <span className="text-[10px] font-medium">vs prior</span>
              </div>
              <div className="text-xl font-bold text-[#1A1612] mt-1 tabular-nums">
                {analytics.kpis.momentumPct.value > 0
                  ? `+${analytics.kpis.momentumPct.value}%`
                  : `${analytics.kpis.momentumPct.value}%`}
              </div>
              <div className="mt-1.5 text-[10px] text-[#78716C]">
                {analytics.kpis.publishedCount.value} published · {analytics.operational.scheduledPosts} sched
              </div>
            </div>

            {/* KPI 5: Presence Bio-Link Funnel */}
            <button
              type="button"
              onClick={() => setView('channels')}
              className="bg-white border border-[#E8E0D4] hover:border-[#C8613D] rounded-2xl p-3.5 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                <span>Bio Link Clicks</span>
                <Link2 className="w-3.5 h-3.5 text-[#C8613D]" />
              </div>
              <div className="text-xl font-bold text-[#1A1612] mt-1 tabular-nums">
                {analytics.funnels.bioProfile.profileLinkClicks + analytics.funnels.bioProfile.profileCtaClicks}
              </div>
              <div className="mt-1.5 text-[10px] text-[#78716C]">
                {analytics.funnels.bioProfile.profileViews} bio views ·{' '}
                {analytics.funnels.bioProfile.ctrPct !== null
                  ? `${analytics.funnels.bioProfile.ctrPct}% CTR`
                  : 'CTR N/A'}
              </div>
            </button>

            {/* KPI 6: SignalDM Automation Outcomes */}
            <Link
              href="/dashboard/automation"
              className="bg-white border border-[#E8E0D4] hover:border-[#C8613D] rounded-2xl p-3.5 text-left transition-colors block"
            >
              <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                <span>SignalDM Leads</span>
                <Bot className="w-3.5 h-3.5 text-[#C8613D]" />
              </div>
              <div className="text-xl font-bold text-[#1A1612] mt-1 tabular-nums">
                {analytics.funnels.automation.dmSent}
              </div>
              <div className="mt-1.5 text-[10px] text-[#78716C]">
                {analytics.funnels.automation.commentReplies} replies ·{' '}
                {analytics.funnels.automation.highIntentLeads} high-intent
              </div>
            </Link>
          </section>

          {/* Daily Trend + Channel Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <DailyPerformanceChart
                series={analytics.dailySeries}
                comparePeriod={analytics.meta.comparePeriod}
              />
            </div>
            <div className="lg:col-span-5">
              <ChannelComparisonBars
                channels={analytics.channelBreakdown}
                onSelectChannel={(plat, acct) => {
                  setPlatform(plat);
                  if (acct) setAccountId(acct);
                  setView('content');
                }}
              />
            </div>
          </div>

          {/* Deterministic Actionable Intelligence */}
          <section className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C8613D]" />
                  <span>What Worked &amp; Recommended Next Moves</span>
                </h2>
                <p className="text-xs text-[#78716C]">
                  Deterministic insights derived strictly from your measured history — click any recommendation to act
                </p>
              </div>
              {analytics.kpis.resonanceScore.value !== null && (
                <div
                  className="text-xs px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4]"
                  title="Composite internal index: Engagement Volume (45%) + View Reach (25%) + Consistency (15%) + Momentum (15%)"
                >
                  Signal Index: <strong className="text-[#1A1612]">{analytics.kpis.resonanceScore.value}/100</strong>
                </div>
              )}
            </div>

            {analytics.recommendations.length === 0 ? (
              <p className="text-xs text-[#78716C]">
                Publish at least 3 posts with synced engagement to generate evidence-backed hook and slot recommendations.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analytics.recommendations.map(rec => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-[#FAF7F2]/70 border border-[#E8E0D4] flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#57534E] bg-white px-2 py-0.5 rounded-full border border-[#E8E0D4]">
                          {rec.badge}
                        </span>
                        <ConfidenceBadge confidence={rec.confidence} n={rec.sampleSize} />
                      </div>
                      <h3 className="text-xs font-semibold text-[#1A1612]">{rec.title}</h3>
                      <p className="text-xs text-[#57534E] leading-relaxed">{rec.detail}</p>
                    </div>
                    <div>
                      <Link
                        href={rec.actionHref}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#C8613D] hover:underline"
                      >
                        <span>{rec.actionLabel}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW 2: CONTENT & HOOKS (Unified Feed + Hook DNA + Effort Attribution) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {analytics && view === 'content' && (
        <div className="space-y-5">
          {/* Hook Leaderboard + Media Lift */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <HookLeaderboard
                hooks={analytics.hookBreakdown}
                activeHook={hookFilter}
                onSelectHook={setHookFilter}
              />
            </div>
            <div className="lg:col-span-4 bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1A1612]">Media vs. Text-Only Impact</h3>
                <p className="text-xs text-[#78716C] mt-0.5">
                  Published posts only ({analytics.mediaComparison.withMediaCount} media vs{' '}
                  {analytics.mediaComparison.withoutMediaCount} text)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4]">
                  <div className="text-[11px] text-[#78716C]">With Media</div>
                  <div className="text-lg font-bold text-[#1A1612] tabular-nums">
                    {analytics.mediaComparison.withMediaAvg}
                  </div>
                  <div className="text-[10px] text-[#78716C]">avg eng (n={analytics.mediaComparison.withMediaCount})</div>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4]">
                  <div className="text-[11px] text-[#78716C]">Text Only</div>
                  <div className="text-lg font-bold text-[#1A1612] tabular-nums">
                    {analytics.mediaComparison.withoutMediaAvg}
                  </div>
                  <div className="text-[10px] text-[#78716C]">
                    avg eng (n={analytics.mediaComparison.withoutMediaCount})
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#57534E] bg-[#FAF7F2] rounded-xl p-2.5 flex items-center justify-between">
                <span>Measured Media Lift</span>
                <strong className="text-[#1A1612]">
                  {analytics.mediaComparison.liftPct !== null
                    ? `${analytics.mediaComparison.liftPct > 0 ? '+' : ''}${analytics.mediaComparison.liftPct}%`
                    : 'Needs both formats'}
                </strong>
              </div>
            </div>
          </div>

          {/* Effort & Word Count Brackets + Interactive Scatter */}
          <WordCountEffortPanel
            brackets={analytics.wordCountBrackets}
            publishedPosts={publishedPostsInWindow}
            onOpenPost={setInspectorPost}
          />

          {/* Status Filter Pills + Sort + Card/Table Switcher */}
          <div id="signal-post-feed" className="bg-white border border-[#E8E0D4] rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Post status filter">
                {[
                  { id: 'all', label: `All (${analytics.operational.totalPosts})` },
                  { id: 'published', label: `Published (${analytics.operational.publishedPosts})` },
                  { id: 'publishing', label: `Publishing (${analytics.operational.publishingPosts})` },
                  { id: 'scheduled', label: `Scheduled (${analytics.operational.scheduledPosts})` },
                  { id: 'draft', label: `Drafts (${analytics.operational.draftPosts})` },
                  {
                    id: 'failed',
                    label: `Failed (${analytics.operational.failedPosts + analytics.operational.partialFailurePosts})`,
                  },
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors ${
                      statusFilter === st.id
                        ? 'bg-[#1A1612] text-white'
                        : 'bg-[#FAF7F2] border border-[#E8E0D4] text-[#57534E] hover:text-[#1A1612]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Sort posts"
                  value={sortMode}
                  onChange={e => setSortMode(e.target.value as SignalSort)}
                  className="bg-[#FAF7F2] border border-[#E8E0D4] rounded-xl px-2.5 py-1.5 text-xs text-[#1A1612]"
                >
                  <option value="newest">Newest First</option>
                  <option value="top_engagement">Highest Engagement</option>
                  <option value="top_views">Highest Views</option>
                  <option value="top_eng_rate">Highest Eng. Rate</option>
                  <option value="most_discussed">Most Comments</option>
                </select>
                <div className="inline-flex rounded-xl bg-[#FAF7F2] p-0.5 border border-[#E8E0D4]">
                  <button
                    type="button"
                    aria-label="Card view"
                    onClick={() => setContentLayout('cards')}
                    className={`p-1.5 rounded-lg ${contentLayout === 'cards' ? 'bg-white shadow-xs text-[#1A1612]' : 'text-[#78716C]'}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Table view"
                    onClick={() => setContentLayout('table')}
                    className={`p-1.5 rounded-lg ${contentLayout === 'table' ? 'bg-white shadow-xs text-[#1A1612]' : 'text-[#78716C]'}`}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {analytics.posts.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Filter className="w-7 h-7 text-[#78716C] mx-auto" />
                <p className="text-sm font-medium text-[#1A1612]">No posts match your current filters</p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-[#C8613D] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : contentLayout === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[#E8E0D4] text-[#78716C]">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Post</th>
                      <th className="py-2 px-2 font-medium">Hook</th>
                      <th className="py-2 px-2 font-medium">Channels</th>
                      <th className="py-2 px-2 font-medium">Status</th>
                      <th className="py-2 px-2 font-medium text-right">Views</th>
                      <th className="py-2 px-2 font-medium text-right">Eng.</th>
                      <th className="py-2 pl-2 font-medium text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE8]">
                    {analytics.posts.map(post => (
                      <tr
                        key={post.id}
                        onClick={() => setInspectorPost(post)}
                        className="hover:bg-[#FAF7F2] cursor-pointer"
                      >
                        <td className="py-2.5 pr-3 max-w-xs">
                          <div className="font-medium text-[#1A1612] truncate">{post.content}</div>
                          <div className="text-[10px] text-[#78716C]">
                            {post.wordCount}w · {format(new Date(post.publishedAt || post.createdAt), 'MMM d')}
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                            style={{ backgroundColor: post.hookColor }}
                          >
                            {post.hookLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {post.variants.map(v => (
                              <span key={v.id} title={`${v.capability.label}${v.accountLabel ? ` (${v.accountLabel})` : ''}`}>
                                <PlatformBrandLogo platform={v.canonicalPlatform} className="w-4 h-4" />
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 capitalize text-[#57534E]">
                          {post.effectiveStatus === 'published' && post.variants.some(v => v.status === 'failed') ? (
                            <span className="text-rose-700 font-medium">published · issue</span>
                          ) : (
                            post.effectiveStatus
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-[#57534E]">
                          {post.scopedEngagement.views !== null ? formatCompact(post.scopedEngagement.views) : 'N/A'}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-[#1A1612]">
                          {formatCompact(post.scopedEngagement.totalEngagements)}
                        </td>
                        <td className="py-2.5 pl-2 text-right tabular-nums text-[#57534E]">
                          {post.scopedEngagement.engagementRate !== null
                            ? `${post.scopedEngagement.engagementRate}%`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {analytics.posts.map(post => {
                  const hasFailedVar = post.variants.some(v => v.status === 'failed');
                  const isDraft = post.effectiveStatus === 'draft' || post.effectiveStatus === 'scheduled';
                  const draftRedirect = getDraftRedirect({
                    id: post.id,
                    content: post.content,
                    status: post.status,
                    hookType: post.hookType,
                    wordCount: post.wordCount,
                    hasMedia: post.hasMedia,
                    createdAt: post.createdAt,
                    updatedAt: post.createdAt,
                    publishedAt: post.publishedAt,
                    adaptationPromptVersion: post.aiOrigin === 'flightplan' ? 'schedule-engine-v1' : null,
                    origin: post.originKind === 'flightplan' ? 'flightplan' : 'ai-composer',
                    arcId: post.arcId,
                    variants: [],
                  });

                  return (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-[#E8E0D4] bg-[#FAF9F6] hover:border-[#C8613D] transition-colors p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: post.hookColor }}
                            >
                              {post.hookLabel}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E8E0D4] text-[#57534E]">
                              {post.wordCount}w · {post.contentFormat}
                            </span>
                            {post.isGoldenHour && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                <Flame className="w-3 h-3" /> {post.goldenHourRemainingMin}m
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                              post.effectiveStatus === 'failed' || hasFailedVar
                                ? 'bg-rose-50 text-rose-700'
                                : post.effectiveStatus === 'published'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-stone-200/70 text-[#57534E]'
                            }`}
                          >
                            {hasFailedVar && post.effectiveStatus === 'published'
                              ? 'published · issue'
                              : post.effectiveStatus}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectorPost(post)}
                          className="w-full text-left text-xs text-[#1A1612] leading-relaxed line-clamp-3 hover:text-[#C8613D]"
                        >
                          {post.content}
                        </button>

                        {/* Multi-Account Variant Pills (All Rendered by variant.id!) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {post.variants.map(v => {
                            const cfg = getPlatformConfig(v.canonicalPlatform);
                            const label = v.accountLabel
                              ? `${cfg?.name || v.capability.label} (${v.accountLabel})`
                              : cfg?.name || v.capability.label;
                            return v.platformUrl ? (
                              <a
                                key={v.id}
                                href={v.platformUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#E8E0D4] hover:border-[#C8613D] text-[10px] text-[#1A1612]"
                              >
                                <PlatformBrandLogo platform={v.canonicalPlatform} className="w-3 h-3" />
                                <span className="truncate max-w-[110px]">{label}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#78716C]" />
                              </a>
                            ) : (
                              <span
                                key={v.id}
                                title={
                                  v.status === 'published'
                                    ? 'Published (remote permalink not returned by platform)'
                                    : v.error || v.status
                                }
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${
                                  v.status === 'failed'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-white border-[#E8E0D4] text-[#57534E]'
                                }`}
                              >
                                <PlatformBrandLogo platform={v.canonicalPlatform} className="w-3 h-3" />
                                <span className="truncate max-w-[110px]">{label}</span>
                                {v.status === 'publishing' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                {v.status === 'failed' && <AlertTriangle className="w-2.5 h-2.5" />}
                              </span>
                            );
                          })}
                        </div>

                        {hasFailedVar && (
                          <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 space-y-1 text-[11px] text-rose-800">
                            {post.variants
                              .filter(v => v.status === 'failed')
                              .map(v => {
                                const cfg = getPlatformConfig(v.canonicalPlatform);
                                return (
                                  <div key={v.id} className="flex items-start gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <span>
                                      <strong>{cfg?.name || v.capability.label}:</strong>{' '}
                                      {v.error || 'Delivery failed'}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-[#E8E0D4] flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3 text-[#57534E] tabular-nums">
                          <span>
                            <strong className="text-[#1A1612]">{post.scopedEngagement.totalEngagements}</strong> eng
                          </span>
                          <span>
                            {post.scopedEngagement.views !== null
                              ? `${formatCompact(post.scopedEngagement.views)} views`
                              : 'Views N/A'}
                          </span>
                          {post.scopedEngagement.engagementRate !== null && (
                            <span className="text-emerald-700 font-medium">
                              {post.scopedEngagement.engagementRate}% ER
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isDraft ? (
                            <Link
                              href={draftRedirect.href}
                              className="text-[11px] font-semibold text-[#C8613D] hover:underline"
                            >
                              Resume
                            </Link>
                          ) : post.effectiveStatus === 'published' ? (
                            <Link
                              href={`/dashboard/studio?hookStyle=${encodeURIComponent(post.hookType)}&winningHook=${encodeURIComponent(extractLeadHook(post.content))}&followUpPostId=${encodeURIComponent(post.id)}`}
                              title="Write a fresh follow-up post in Studio using this winning hook structure"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C8613D] hover:underline"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Follow-up</span>
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setInspectorPost(post)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E0D4] text-[11px] font-semibold text-[#1A1612] hover:border-[#C8613D]"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW 3: TIMING & CADENCE                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {analytics && view === 'timing' && (
        <div className="space-y-5">
          <TimingHeatmapMatrix
            timing={analytics.timing}
            posts={analytics.posts}
            onOpenPost={setInspectorPost}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Day of Week Breakdown */}
            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#1A1612]">Day-of-Week Breakdown ({analytics.timing.timezone})</h3>
              <div className="space-y-2">
                {(() => {
                  const maxD = Math.max(...analytics.timing.dayStats.map(d => d.avgEngagements), 1);
                  return analytics.timing.dayStats.map(d => {
                    const pct = d.count > 0 ? Math.max(4, Math.round((d.avgEngagements / maxD) * 100)) : 0;
                    return (
                      <div key={d.dayIndex} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#1A1612]">{d.label}</span>
                          <span className="text-[#57534E] tabular-nums">
                            n={d.count} · <strong>{d.avgEngagements} avg</strong> (med {d.medianEngagements})
                          </span>
                        </div>
                        <div className="h-2 bg-[#F3EFE8] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C8613D] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Publishing Cadence Summary */}
            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1A1612]">Publishing Cadence &amp; Schedule Planning</h3>
                <p className="text-xs text-[#78716C] mt-0.5">
                  Measured strictly on completed publishes over your {analytics.meta.effectiveDays}-day window
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4]">
                  <div className="text-[11px] text-[#78716C]">Published Posts</div>
                  <div className="text-xl font-bold text-[#1A1612] tabular-nums">
                    {analytics.operational.publishedPosts}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4]">
                  <div className="text-[11px] text-[#78716C]">Scheduled Queue</div>
                  <div className="text-xl font-bold text-[#1A1612] tabular-nums">
                    {analytics.operational.scheduledPosts}
                  </div>
                </div>
              </div>
              <Link
                href={`/dashboard/flightplan?tz=${encodeURIComponent(analytics.timing.timezone)}&source=signal`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1612] text-white text-xs font-semibold hover:bg-[#332C25]"
              >
                <Calendar className="w-4 h-4" />
                <span>Plan Next Week in Flight Plan</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW 4: CHANNELS, ACCOUNTS & ATTRIBUTION FUNNEL                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {analytics && view === 'channels' && (
        <div className="space-y-5">
          {/* Full Channel & Account Table */}
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#1A1612]">Per-Account &amp; Channel Performance</h2>
                <p className="text-xs text-[#78716C]">
                  Each row tracks only variants published to that specific platform account · N/A indicates upstream platform API limits
                </p>
              </div>
              <Link
                href="/onboarding/connect"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4] text-xs font-semibold text-[#1A1612] hover:border-[#C8613D]"
              >
                <span>Manage Connections</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#E8E0D4] text-[#78716C]">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Channel / Account</th>
                    <th className="py-2 px-2 font-medium">Telemetry Tier</th>
                    <th className="py-2 px-2 font-medium text-right">Published</th>
                    <th className="py-2 px-2 font-medium text-right">Views</th>
                    <th className="py-2 px-2 font-medium text-right">Likes</th>
                    <th className="py-2 px-2 font-medium text-right">Comments</th>
                    <th className="py-2 px-2 font-medium text-right">Shares</th>
                    <th className="py-2 px-2 font-medium text-right">Avg/Post</th>
                    <th className="py-2 pl-2 font-medium text-right">ER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE8]">
                  {analytics.channelBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-[#78716C]">
                        No connected accounts found in this workspace.
                      </td>
                    </tr>
                  ) : (
                    analytics.channelBreakdown.map(ch => (
                      <tr key={ch.key} className="hover:bg-[#FAF7F2]/70">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <PlatformBrandLogo platform={ch.platform} className="w-4 h-4 shrink-0" />
                            <div>
                              <div className="font-semibold text-[#1A1612]">
                                {ch.label}
                                {ch.accountLabel ? ` · ${ch.accountLabel}` : ''}
                              </div>
                              {ch.connectionStatus !== 'connected' && (
                                <Link href="/onboarding/connect" className="text-[10px] text-rose-700 font-semibold underline">
                                  Reconnect ({ch.connectionStatus})
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            title={ch.capability.apiLimitationNote}
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-[#FAF7F2] border border-[#E8E0D4] text-[#57534E]"
                          >
                            {ch.capability.capabilitySummary}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{ch.publishedCount}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-[#57534E]">
                          {ch.views !== null ? formatCompact(ch.views) : 'N/A'}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums">
                          {ch.capability.supportedMetrics.likes ? ch.likes : 'N/A'}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums">
                          {ch.capability.supportedMetrics.comments ? ch.comments : 'N/A'}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums">
                          {ch.capability.supportedMetrics.shares ? ch.shares : 'N/A'}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-[#1A1612]">
                          {ch.avgEngagementsPerPost}
                        </td>
                        <td className="py-2.5 pl-2 text-right tabular-nums">
                          {ch.weightedEngagementRate !== null ? `${ch.weightedEngagementRate}%` : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cross-Product Attribution Funnels: Presence Bio-Link + SignalDM + LinkedIn Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Bio-Link Profile Attribution */}
            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#C8613D]" />
                  <span>Presence Bio-Link Funnel</span>
                </h3>
                <Link href="/dashboard/presence" className="text-xs font-semibold text-[#C8613D] hover:underline">
                  Edit Profile →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                  <div className="text-[10px] text-[#78716C]">Views</div>
                  <div className="text-base font-bold text-[#1A1612] tabular-nums">
                    {analytics.funnels.bioProfile.profileViews}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                  <div className="text-[10px] text-[#78716C]">Clicks</div>
                  <div className="text-base font-bold text-[#1A1612] tabular-nums">
                    {analytics.funnels.bioProfile.profileLinkClicks + analytics.funnels.bioProfile.profileCtaClicks}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                  <div className="text-[10px] text-[#78716C]">CTR</div>
                  <div className="text-base font-bold text-[#1A1612] tabular-nums">
                    {analytics.funnels.bioProfile.ctrPct !== null
                      ? `${analytics.funnels.bioProfile.ctrPct}%`
                      : 'N/A'}
                  </div>
                </div>
              </div>
              {analytics.funnels.bioProfile.topLinks.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-medium text-[#78716C]">Top Clicked Links</div>
                  {analytics.funnels.bioProfile.topLinks.slice(0, 3).map((l, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#F3EFE8] last:border-0">
                      <span className="truncate text-[#1A1612] max-w-[180px]">{l.label}</span>
                      <span className="font-semibold tabular-nums text-[#57534E]">{l.clicks}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SignalDM Automation Funnel */}
            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#C8613D]" />
                  <span>SignalDM Conversions</span>
                </h3>
                <Link href="/dashboard/automation" className="text-xs font-semibold text-[#C8613D] hover:underline">
                  Manage Flows →
                </Link>
              </div>
              <p className="text-[11px] text-[#78716C]">
                Tracked independently from public post likes/comments so automation volume never distorts engagement rates.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                  <div className="text-[10px] text-[#78716C]">Auto Replies</div>
                  <div className="text-base font-bold text-[#1A1612] tabular-nums">
                    {analytics.funnels.automation.commentReplies}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                  <div className="text-[10px] text-[#78716C]">DMs Dispatched</div>
                  <div className="text-base font-bold text-[#1A1612] tabular-nums">
                    {analytics.funnels.automation.dmSent}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                  <div className="text-[10px] text-[#78716C]">Follow Unlocks</div>
                  <div className="text-base font-bold text-[#1A1612] tabular-nums">
                    {analytics.funnels.automation.followGateUnlocked}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                  <div className="text-[10px] text-[#78716C]">High-Intent Leads</div>
                  <div className="text-base font-bold text-[#1A1612] tabular-nums">
                    {analytics.funnels.automation.highIntentLeads}
                  </div>
                </div>
                {typeof analytics.funnels.automation.leadsCaptured === 'number' && (
                  <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                    <div className="text-[10px] text-[#78716C]">Emails &amp; Phones</div>
                    <div className="text-base font-bold text-[#047857] tabular-nums">
                      {analytics.funnels.automation.leadsCaptured}
                    </div>
                  </div>
                )}
                {typeof analytics.funnels.automation.trackedClicks === 'number' && (
                  <div className="p-2.5 rounded-xl bg-[#FAF7F2]">
                    <div className="text-[10px] text-[#78716C]">Tracked DM Clicks</div>
                    <div className="text-base font-bold text-[#C8613D] tabular-nums">
                      {analytics.funnels.automation.trackedClicks}
                    </div>
                  </div>
                )}
              </div>
              {Array.isArray(analytics.funnels.automation.topConvertingHooks) &&
                analytics.funnels.automation.topConvertingHooks.length > 0 && (
                  <div className="pt-2 border-t border-[#E8E0D4] space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#78716C]">
                      Closed-Loop Hook → Lead Attribution
                    </div>
                    {analytics.funnels.automation.topConvertingHooks.map((h) => (
                      <div key={h.hookType} className="flex items-center justify-between text-xs text-[#3D2B1F]">
                        <span className="capitalize font-medium">{h.hookType.replace(/_/g, ' ')}</span>
                        <span className="tabular-nums text-[#78716C]">
                          {h.dmsSent} DMs · {h.highIntentLeads} hot leads
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Deep LinkedIn & Platform API Disclosure Card */}
            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
                  <PlatformBrandLogo platform="linkedin" className="w-4 h-4" />
                  <span>LinkedIn &amp; Platform API Limits</span>
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Personal LinkedIn OAuth exposes reactions, comments, and reposts (`w_member_social`), while native impressions stay N/A unless granted Community Management API access. Use Unool&apos;s dedicated LinkedIn Insights view for comment workflows &amp; post copy triage.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Link
                  href="/analytics/linkedin"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A1612] text-white text-xs font-semibold hover:bg-[#332C25]"
                >
                  <span>Open LinkedIn Insights</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4] text-xs font-semibold text-[#1A1612] hover:border-[#C8613D]"
                >
                  <span>Template Analytics</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Expandable Full 27-Platform Capability Disclosure */}
          <details className="bg-white border border-[#E8E0D4] rounded-2xl p-4">
            <summary className="cursor-pointer text-xs font-semibold text-[#1A1612] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C8613D]" />
              <span>View Verified Telemetry Capability Reference (All 27 Unool Adapters)</span>
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {getAllPlatformCapabilities().map(cap => (
                <div key={cap.id} className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#1A1612] flex items-center gap-1.5">
                      <PlatformBrandLogo platform={cap.id} className="w-3.5 h-3.5" />
                      {cap.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E8E0D4] text-[#57534E]">
                      {cap.capabilitySummary}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78716C] leading-snug">{cap.apiLimitationNote}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* ── Post Detail Inspector Drawer (Drill-down Target) ─────────────────── */}
      <PostInspectorDrawer
        post={inspectorPost}
        profileSubdomain={profileSubdomain}
        timezone={timezone}
        onClose={() => setInspectorPost(null)}
        onDelete={handleDeletePost}
        onRefresh={() => fetchAnalytics({ sync: true, silent: true })}
        onShareStory={p => {
          setInspectorPost(null);
          setSharePost(p);
        }}
      />

      {/* ── Share Story Modal (Fixes ?activity=<postId> deep link) ───────────── */}
      {sharePost &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Share post story"
            onClick={() => setSharePost(null)}
          >
            <div
              className="w-full max-w-md bg-white border border-[#E8E0D4] rounded-2xl p-5 space-y-4 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1A1612] flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#C8613D]" />
                  <span>Share Activity on Your Unool Profile</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSharePost(null)}
                  aria-label="Close share dialog"
                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1612]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#57534E] line-clamp-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E0D4]">
                {sharePost.content}
              </p>
              {profileSubdomain ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-[#78716C]">Direct Post Link</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://unool.co/u/${profileSubdomain}?activity=${sharePost.id}`}
                      aria-label="Shareable post URL"
                      className="flex-1 text-xs bg-[#FAF7F2] border border-[#E8E0D4] rounded-xl px-3 py-2 text-[#1A1612]"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            `https://unool.co/u/${profileSubdomain}?activity=${sharePost.id}`
                          );
                          setCopiedShareLink(true);
                          setTimeout(() => setCopiedShareLink(false), 1800);
                        } catch {}
                      }}
                      className="px-3 py-2 rounded-xl bg-[#1A1612] text-white text-xs font-semibold"
                    >
                      {copiedShareLink ? <Check className="w-4 h-4" /> : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#78716C]">
                  Claim your Unool subdomain in Presence to generate shareable profile story links.
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
