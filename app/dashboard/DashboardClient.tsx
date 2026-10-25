'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Globe, PenTool, ExternalLink, TrendingUp,
  Activity, Plus, ArrowRight, Eye, MousePointerClick,
  FileText, Radio, ChevronRight, Zap, Send, Star,
  CalendarDays, Wifi, WifiOff, ArrowUpRight, MoreHorizontal, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PlatformConnections, SUPPORTED_PLATFORMS, PLATFORM_CONFIG, type Platform } from '@/components/dashboard/PlatformConnections';
import { BlueskyConnectDialog } from '@/components/dashboard/BlueskyConnectDialog';
import { ManualIntegrationDialog } from '@/components/dashboard/ManualIntegrationDialog';
import { PlatformBrandLogo } from '@/components/dashboard/PlatformLogos';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { ProfileCompletionQuest } from '@/components/dashboard/ProfileCompletionQuest';

/* ─── Biscuit Design System ───────────────────────────────── */

const B = {
  bg: '#F7F3ED',
  card: '#FFFDF9',
  cardAlt: '#FAF7F2',
  cardBorder: '#EDE7DD',
  cardShadow: '0 1px 3px rgba(61,43,31,0.06), 0 4px 12px rgba(61,43,31,0.04)',
  cardShadowHover: '0 2px 8px rgba(61,43,31,0.08), 0 8px 24px rgba(61,43,31,0.06)',
  text: '#3D2B1F',
  textSecondary: '#6B5744',
  textMuted: '#8B7355',
  textLight: '#A69279',
  accent: '#C4A265',
  accentDark: '#A68B52',
  accentLight: '#D4B87A',
  accentBg: '#F5EFE2',
  accentBgHover: '#EDE5D3',
  gold: '#B8962E',
  goldLight: '#F5EFD8',
  success: '#4A8C5C',
  successBg: '#EBF5EE',
  info: '#5B7FA6',
  infoBg: '#EBF0F7',
  warning: '#C49B3C',
  warningBg: '#FBF5E6',
  danger: '#B85450',
  dangerBg: '#FBEDED',
  border: '#E8E0D4',
  borderLight: '#F0EBE3',
  heatmapEmpty: '#F0EBE3',
  heatmap1: '#E5D9C3',
  heatmap2: '#D4C4A0',
  heatmap3: '#C4A265',
  heatmap4: '#A68B52',
};

/* ─── Types ────────────────────────────────────────────────── */

interface Profile {
  subdomain: string | null;
  name: string | null;
  headline: string | null;
  status: 'published' | 'draft';
  updatedAt: string | null;
  links: Array<{ label: string; url: string; type: string }>;
  proofPoints: Array<{ type: string; value: string }>;
}

interface Post {
  id: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'publishing';
  createdAt: string;
  updatedAt: string;
}

interface UsageStats {
  postsThisMonth: number;
  postsLimit: number;
  profileViews: number;
  linkClicks: number;
}

interface DashboardData {
  profile: Profile | null;
  recentPosts: Post[];
  usageStats: UsageStats;
  connections: Record<string, { status: 'connected' | 'not_connected' | 'expired' }>;
  planTier: 'free' | 'pro' | 'enterprise';
  userId: string;
  workspaceId: string;
}

/* ─── Analytics Insights (real data from API) ──────────────── */

interface AnalyticsInsights {
  viewsSeries: number[];       // 30 daily buckets
  clicksSeries: number[];      // 30 daily buckets
  viewsThisWeek: number;
  clicksThisWeek: number;
  viewsChangeWoW: number;      // % vs last week
  clicksChangeWoW: number;
  conversionRate: number;      // % of viewers who clicked
  topLinks: Array<{ url: string; label: string; count: number }>;
  peakHourLabel: string | null;
  referrers: Array<{ source: string; count: number; pct: number }>;
}

function useAnalyticsInsights() {
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/insights', { credentials: 'include' });
      if (res.ok) setInsights(await res.json());
    } catch { /* silent */ } finally {
      setLoadingInsights(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { insights, loadingInsights };
}

/* ─── Motion helpers ───────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const transition = { type: 'spring' as const, stiffness: 400, damping: 30 };

/* ─── Status config ────────────────────────────────────────── */

const STATUS_STYLE: Record<Post['status'], {
  label: string;
  bg: string;
  text: string;
  dot: string;
}> = {
  published: { label: 'Published', bg: B.successBg, text: B.success, dot: B.success },
  draft: { label: 'Draft', bg: B.warningBg, text: B.warning, dot: B.warning },
  scheduled: { label: 'Scheduled', bg: B.infoBg, text: B.info, dot: B.info },
  failed: { label: 'Failed', bg: B.dangerBg, text: B.danger, dot: B.danger },
  publishing: { label: 'Publishing', bg: '#f0f9ff', text: '#0284c7', dot: '#0284c7' },
};

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { profile, recentPosts, usageStats, planTier } = data;

  const greeting = getGreeting();
  const displayName = profile?.name?.split(' ')[0] || 'there';
  const isProfileLive = profile?.status === 'published' && profile?.subdomain;

  /* Heatmap data — generate from real posts */
  const heatmapData = useMemo(() => generateHeatmapData(recentPosts), [recentPosts]);

  const searchParams = useSearchParams();
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(searchParams.get('connect') === 'bluesky');
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const { insights, loadingInsights } = useAnalyticsInsights();


  return (
    <motion.div
      className="max-w-[1120px] mx-auto space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* ═══ ROW 1: Welcome Hero + Metrics ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Welcome Card — spans 5 cols */}
        <motion.div
          variants={fadeUp}
          transition={transition}
          className="lg:col-span-5 rounded-2xl p-6 relative overflow-hidden"
          style={{
            backgroundColor: B.card,
            border: `1px solid ${B.cardBorder}`,
            boxShadow: B.cardShadow,
          }}
        >
          {/* Subtle decorative circle */}
          <div
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30"
            style={{ background: `radial-gradient(circle, ${B.accentBg} 0%, transparent 70%)` }}
          />

          <div className="relative">
            <p suppressHydrationWarning className="text-sm font-medium" style={{ color: B.textMuted }}>
              {greeting}
            </p>
            <h1
              className="text-2xl font-bold tracking-tight mt-1"
              style={{ color: B.text }}
            >
              Welcome, {displayName}!
            </h1>

            {/* Profile URL */}
            {profile?.subdomain && (
              <a
                href={isProfileLive ? (process.env.NODE_ENV === 'development' ? `/u/${profile.subdomain}` : `https://${profile.subdomain}.unool.co`) : `/dashboard/profile?focus=subdomain`}
                target={isProfileLive ? "_blank" : undefined}
                rel="noreferrer"
                title={isProfileLive ? "Open live profile in new tab" : "Manage profile subdomain"}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: B.accentBg,
                  color: B.textSecondary,
                  border: `1px solid ${B.border}`,
                }}
              >
                <span>{profile.subdomain}.unool.co</span>
                {isProfileLive && (
                  <span className="relative flex h-2 w-2 ml-1" title="Live Profile">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: B.success }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: B.success }}
                    />
                  </span>
                )}
              </a>
            )}

            {/* Interactive Profile Completion Quest */}
            <ProfileCompletionQuest profile={profile} recentPosts={recentPosts} />

            {/* CTA Button */}
            <Link
              href="/dashboard/studio"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: B.text,
                color: B.card,
              }}
            >
              <PenTool className="h-4 w-4" />
              New Broadcast
            </Link>
          </div>
        </motion.div>

        {/* Metrics — 3 cards spanning 7 cols — ALL real data, no fake numbers */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <MetricBentoCard
            icon={Eye}
            label="Impressions"
            sublabel="Profile views this week"
            value={insights?.viewsThisWeek ?? usageStats.profileViews}
            changeWoW={insights?.viewsChangeWoW ?? null}
            sparkData={insights?.viewsSeries ?? null}
            loading={loadingInsights}
            insight={insights?.peakHourLabel ? `Peak: ${insights.peakHourLabel}` : null}
          />
          <MetricBentoCard
            icon={FileText}
            label="Content Published"
            sublabel={`of ${usageStats.postsLimit} this month`}
            value={usageStats.postsThisMonth}
            changeWoW={null}
            sparkData={null}
            loading={false}
            insight={null}
          />
          <MetricBentoCard
            icon={MousePointerClick}
            label="Link Engagement"
            sublabel={insights?.conversionRate != null
              ? `${insights.conversionRate}% conversion rate`
              : 'Link clicks this week'}
            value={insights?.clicksThisWeek ?? usageStats.linkClicks}
            changeWoW={insights?.clicksChangeWoW ?? null}
            sparkData={insights?.clicksSeries ?? null}
            loading={loadingInsights}
            insight={insights?.topLinks?.[0]
              ? `Top: ${insights.topLinks[0].label || insights.topLinks[0].url.slice(0, 24)} (${insights.topLinks[0].count})`
              : null}
          />
        </div>
      </div>

      {/* ═══ ROW 2: Publishing Heatmap + Broadcast Network ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Broadcast Network — Full width */}
        <motion.div
          variants={fadeUp}
          transition={transition}
          className="lg:col-span-12 rounded-2xl p-6"
          style={{
            backgroundColor: B.card,
            border: `1px solid ${B.cardBorder}`,
            boxShadow: B.cardShadow,
          }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: B.accentBg }}
            >
              <Radio className="h-4 w-4" style={{ color: B.accent }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: B.text }}>
                Broadcast Network
              </h3>
              <p className="text-xs" style={{ color: B.textMuted }}>
                Your connected platforms
              </p>
            </div>
          </div>

          {/* Platform badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(() => {
              // 1. Fixed default order of the 8 main platforms
              const defaultOrder: Platform[] = [
                'linkedin',
                'x',
                'threads',
                'instagram',
                'facebook',
                'youtube',
                'pinterest',
                'bluesky',
              ];

              // 2. Connected platforms appear first (excluding 'manual')
              const connectedPlatforms = (SUPPORTED_PLATFORMS.filter(
                (p) => p !== 'manual' && data.connections[p]?.status === 'connected'
              ) as Platform[]);

              // 3. Remaining platforms in exact default order
              const remainingDefaults = defaultOrder.filter(
                (p) => !connectedPlatforms.includes(p)
              );

              // 4. Combine: connected first, followed by remaining defaults (manual is NOT in broadcast)
              const displayIds = [
                ...connectedPlatforms,
                ...remainingDefaults,
              ].slice(0, Math.max(8, connectedPlatforms.length));

              return displayIds.map((platformId) => {
                const config = PLATFORM_CONFIG[platformId];
                const connected = data.connections[platformId]?.status === 'connected';
                return {
                  id: platformId,
                  name: platformId === 'facebook' ? 'Facebook' : (config?.shortName || config?.name || platformId),
                  color: config?.color || 'bg-neutral-500',
                  connected,
                };
              });
            })()
              .map((platform) => {
                const isLinkedinAnalytics = platform.id === 'linkedin' && platform.connected;
                return (
                <div
                  key={platform.id}
                  onClick={() => {
                    if (isLinkedinAnalytics) {
                      window.location.href = '/analytics/linkedin';
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                    isLinkedinAnalytics && "cursor-pointer hover:scale-[1.02] shadow-sm group"
                  )}
                  style={{
                    backgroundColor: platform.connected ? B.cardAlt : B.bg,
                    border: `1px solid ${platform.connected ? B.border : B.borderLight}`,
                  }}
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0"
                    style={{
                      backgroundColor: platform.connected ? '#FFFFFF' : B.borderLight,
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <PlatformBrandLogo platform={platform.id} size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: B.text }}>
                      {platform.name}
                    </p>
                    <p className="text-xs" style={{ color: platform.connected ? B.success : B.textLight }}>
                      {platform.connected ? '● Connected' : '○ Not connected'}
                    </p>
                  </div>
                  {!platform.connected && (
                    <button
                      disabled={connectingPlatform === platform.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (platform.id === 'bluesky') {
                          setBlueskyDialogOpen(true);
                        } else {
                          setConnectingPlatform(platform.id);
                          window.location.href = `/api/auth/platform/connect?platform=${platform.id}&workspaceId=${data.workspaceId}&userId=${data.userId}`;
                        }
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-90 inline-flex items-center gap-1.5"
                      style={{ backgroundColor: B.accentBg, color: B.accent }}
                    >
                      {connectingPlatform === platform.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Connecting…</span>
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  )}
                  {platform.connected && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Disconnect ${platform.name}? You can reconnect anytime.`)) return;
                        try {
                          const res = await fetch(`/api/platform/connections/${platform.id}`, {
                            method: 'DELETE',
                          });
                          if (res.ok) {
                            window.location.reload();
                          } else {
                            alert('Failed to disconnect');
                          }
                        } catch (e) {
                          alert('Failed to disconnect');
                        }
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border hover:bg-black/5"
                      style={{ borderColor: B.border, color: B.textMuted }}
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              )})}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <button
                className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: B.accentBg,
                  color: B.accentDark,
                  border: `2px solid ${B.accent}`,
                  boxShadow: '0 2px 8px rgba(196, 162, 101, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = B.accentBgHover;
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(196, 162, 101, 0.35)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = B.accentBg;
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(196, 162, 101, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(196, 162, 101, 0.3)';
                }}
              >
                All platforms
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-[#F7F3ED] border-none max-h-[85vh] overflow-y-auto">
              <DialogTitle className="sr-only">Manage Platforms</DialogTitle>
              <PlatformConnections
                workspaceId={data.workspaceId}
                userId={data.userId}
                initialConnectionsProp={data.connections}
              />
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {/* ═══ ROW 3: Quick Actions & Flight Engine ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div variants={fadeUp} transition={transition} className="h-full">
          <QuickActionBento
            icon={WeeklyFlightPlanIcon}
            title="Weekly Flight Plan"
            subtitle="Story in · Week of content out"
            description="Type one honest paragraph about your week. Unool drafts, cascades, and schedules your multi-network week."
            href="/dashboard/schedule"
            buttonLabel="Plan This Week"
            badge="7-Day Arc"
          />
        </motion.div>
        <motion.div variants={fadeUp} transition={transition} className="h-full">
          <QuickActionBento
            icon={ContentStudioIcon}
            title="Content Studio"
            subtitle="Write once, broadcast everywhere"
            description="AI adapts your content for LinkedIn, X, Threads, and more. Review and publish in one click."
            href="/dashboard/studio"
            buttonLabel="Open Studio"
            badge={usageStats.postsThisMonth > 0 ? `${usageStats.postsThisMonth} Broadcasts` : 'Multi-Publish'}
          />
        </motion.div>
        <motion.div variants={fadeUp} transition={transition} className="h-full">
          <QuickActionBento
            icon={PublicProfileIcon}
            title="Your Public Profile"
            subtitle="One link for everything"
            description="Professional landing page with links, credentials, and social proof — all in one place."
            href={isProfileLive ? `/u/${profile?.subdomain}` : '/dashboard/profile'}
            buttonLabel={isProfileLive ? 'View Live Profile' : 'Set Up Profile'}
            external={!!isProfileLive}
          />
        </motion.div>
        <motion.div variants={fadeUp} transition={transition} className="h-full">
          <QuickActionBento
            icon={AutomationIcon}
            title="Automation"
            subtitle="Auto-reply & inbound leads"
            description="AI-powered comment and DM automation for Instagram & LinkedIn. Auto-reply and convert audience to leads."
            href="/dashboard/automation"
            buttonLabel="Open Automation"
            badge="Auto-Pilot"
          />
        </motion.div>
      </div>



      {/* ═══ ROW 5: Recent Broadcasts ═══ */}
      <motion.div variants={fadeUp} transition={transition}>
        <RecentBroadcasts posts={recentPosts} />
      </motion.div>

      {/* Dialogs */}
      <BlueskyConnectDialog
        open={blueskyDialogOpen}
        onClose={() => setBlueskyDialogOpen(false)}
        workspaceId={data.workspaceId}
        onSuccess={() => window.location.reload()}
      />
      <ManualIntegrationDialog
        open={manualDialogOpen}
        onClose={() => setManualDialogOpen(false)}
        workspaceId={data.workspaceId}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   METRIC BENTO CARD
   ═══════════════════════════════════════════════════════════════ */

function MetricBentoCard({
  icon: Icon,
  label,
  sublabel,
  value,
  changeWoW,
  sparkData,
  loading,
  insight,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  value: number;
  changeWoW: number | null;       // % week-over-week, real data
  sparkData: number[] | null;     // 30-day series or null while loading
  loading: boolean;
  insight: string | null;         // personalized one-liner
}) {
  // Build SVG sparkline from real daily series
  const sparkPoints = useMemo(() => {
    const data = sparkData && sparkData.length > 1 ? sparkData : null;
    if (!data) return null;
    const maxVal = Math.max(...data, 1);
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (v / maxVal) * 80;
        return `${x},${y}`;
      })
      .join(' ');
  }, [sparkData]);

  const isUp = changeWoW !== null && changeWoW > 0;
  const isDown = changeWoW !== null && changeWoW < 0;
  const deltaColor = isUp ? B.success : isDown ? B.danger : B.textMuted;
  const deltaLabel =
    changeWoW === null ? null :
    changeWoW === 0 ? 'same as last week' :
    `${isUp ? '+' : ''}${changeWoW}% vs last week`;

  const sparklineId = `spark-${label.replace(/\s/g, '')}`;

  return (
    <motion.div
      variants={fadeUp}
      transition={transition}
      className="rounded-2xl p-5 relative overflow-hidden group cursor-default transition-shadow duration-200"
      style={{
        backgroundColor: B.card,
        border: `1px solid ${B.cardBorder}`,
        boxShadow: B.cardShadow,
      }}
      whileHover={{ y: -2, boxShadow: B.cardShadowHover }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: B.textMuted }}>
          {label}
        </span>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: B.accentBg }}>
          <Icon className="h-3.5 w-3.5" style={{ color: B.accent }} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color: B.text }}>
          {loading ? '—' : value.toLocaleString()}
        </span>
        {/* WoW delta — only shown when we have real data */}
        {!loading && deltaLabel && (
          <span className="text-[10px] font-semibold leading-none" style={{ color: deltaColor }}>
            {isUp ? '↑' : isDown ? '↓' : '='} {Math.abs(changeWoW!)}%
          </span>
        )}
      </div>

      {/* Sublabel */}
      {sublabel && (
        <p className="text-[10px] mb-3 leading-none" style={{ color: B.textLight }}>
          {sublabel}
        </p>
      )}

      {/* Sparkline — rendered only when we have real data */}
      <div className="h-10 w-full">
        {loading ? (
          <div className="h-full w-full rounded animate-pulse" style={{ backgroundColor: B.heatmapEmpty }} />
        ) : sparkPoints ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id={sparklineId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={B.accent} stopOpacity="0.25" />
                <stop offset="100%" stopColor={B.accent} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polyline
              points={`0,100 ${sparkPoints} 100,100`}
              fill={`url(#${sparklineId})`}
            />
            <polyline
              points={sparkPoints}
              fill="none"
              stroke={B.accent}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          // No data yet — flat baseline
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full opacity-30">
            <line x1="0" y1="50" x2="100" y2="50" stroke={B.accent} strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
        )}
      </div>

      {/* Personalized insight line — only shown when data exists */}
      {!loading && insight && (
        <p className="mt-2 text-[9px] font-medium truncate" style={{ color: B.textLight }}>
          {insight}
        </p>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOM HANDCRAFTED ICONS FOR DASHBOARD FEATURE BLOCKS
   ═══════════════════════════════════════════════════════════════ */

function WeeklyFlightPlanIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* 7-day timeline base horizon */}
      <line x1="3" y1="21" x2="21" y2="21" strokeOpacity="0.35" />
      <line x1="4" y1="20" x2="4" y2="22" strokeOpacity="0.45" />
      <line x1="9.5" y1="20" x2="9.5" y2="22" strokeOpacity="0.45" />
      <line x1="15" y1="20" x2="15" y2="22" strokeOpacity="0.45" />
      <line x1="20" y1="20" x2="20" y2="22" strokeOpacity="0.45" />
      {/* Ascending weekly flight trajectory curve */}
      <path d="M4 17.5C7.5 17.5 10 14 12.5 9.5C14 6.8 16.5 5 20.5 4.5" />
      {/* Waypoint nodes along the weekly flight path */}
      <circle cx="4.5" cy="17.5" r="1.5" fill="currentColor" />
      <circle cx="12.5" cy="9.5" r="1.5" fill="currentColor" />
      {/* Flight vessel leading the trajectory */}
      <path d="M16 2.5L21.5 4.5L18.5 9.5L16.5 6L13.5 5.5L16 2.5Z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

function ContentStudioIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Studio drafting stylus / content quill */}
      <path d="M14.5 3.5L20.5 9.5L9.5 20.5L3.5 20.5L3.5 14.5L14.5 3.5Z" fill="currentColor" fillOpacity="0.12" />
      <line x1="12.5" y1="5.5" x2="18.5" y2="11.5" strokeOpacity="0.4" />
      <line x1="7" y1="17" x2="3.5" y2="20.5" />
      {/* Omni-channel broadcast propagation signal waves */}
      <path d="M16.5 14.5C18 16 18.5 18 18 20" strokeOpacity="0.8" />
      <path d="M19.5 11.5C21.5 14 22 17 21 20.5" strokeOpacity="0.5" />
      {/* Studio creative aperture sparkle */}
      <path d="M19 1L19.8 3.2L22 4L19.8 4.8L19 7L18.2 4.8L16 4L18.2 3.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PublicProfileIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Identity card boundary */}
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="currentColor" fillOpacity="0.08" />
      {/* Persona silhouette */}
      <circle cx="12" cy="9.5" r="2.75" />
      <path d="M7 17.5C7 14.8 9.2 13.5 12 13.5C14.8 13.5 17 14.8 17 17.5" />
      {/* Direct personal link beacon */}
      <path d="M17 3.5H20.5V7" strokeOpacity="0.75" />
      <line x1="20.5" y1="3.5" x2="14.5" y2="9.5" strokeOpacity="0.75" />
    </svg>
  );
}

function AutomationIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Interaction conversation beacon bubble */}
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="currentColor" fillOpacity="0.08" />
      {/* AI auto-response lightning spark */}
      <path d="M13 6.5L8.5 12.5H12L11 17.5L15.5 11.5H12L13 6.5Z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUICK ACTION BENTO CARD
   ═══════════════════════════════════════════════════════════════ */

function QuickActionBento({
  icon: Icon,
  title,
  subtitle,
  description,
  href,
  buttonLabel,
  external,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  buttonLabel: string;
  external?: boolean;
  badge?: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 transition-shadow duration-200 hover:shadow-md relative overflow-hidden flex flex-col justify-between h-full"
      style={{
        backgroundColor: B.card,
        border: `1px solid ${B.cardBorder}`,
        boxShadow: B.cardShadow,
      }}
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex-shrink-0"
              style={{ backgroundColor: B.accentBg, border: `1px solid ${B.border}` }}
            >
              <Icon className="h-5 w-5" style={{ color: B.accent }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: B.text }}>{title}</h3>
              <p className="text-xs" style={{ color: B.textMuted }}>{subtitle}</p>
            </div>
          </div>
          {badge && (
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 tracking-wide shadow-2xs flex-shrink-0"
              style={{
                backgroundColor: '#FAF7F2',
                borderColor: '#E8E0D4',
                color: '#7A6248',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C4A265' }} />
              {badge}
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed mb-5" style={{ color: B.textMuted }}>
          {description}
        </p>
      </div>

      <div>
        <Link
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-sm"
          style={{
            backgroundColor: B.text,
            color: B.card,
          }}
        >
          {buttonLabel}
          {external ? <ExternalLink className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECENT BROADCASTS
   ═══════════════════════════════════════════════════════════════ */

function RecentBroadcasts({ posts }: { posts: Post[] }) {
  const [limit, setLimit] = useState(2);
  const displayPosts = posts.slice(0, limit);

  const handleShowMore = () => {
    if (limit === 2) {
      setLimit(5);
    } else {
      setLimit(posts.length);
    }
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: B.card,
        border: `1px solid ${B.cardBorder}`,
        boxShadow: B.cardShadow,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg" style={{ backgroundColor: B.accentBg }}>
            <Activity className="h-4 w-4" style={{ color: B.accent }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: B.text }}>
              Recent Broadcasts
            </h3>
            <p className="text-xs" style={{ color: B.textMuted }}>
              Your latest posts and their status
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/studio"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            backgroundColor: B.accentBg,
            color: B.accent,
          }}
        >
          <Plus className="h-3 w-3" />
          New Post
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-2">
          {displayPosts.map((post, index) => {
            const style = STATUS_STYLE[post.status];
            const targetHref = post.status === 'scheduled' ? '/dashboard/schedule' : '/dashboard/signal';
            return (
              <Link
                key={post.id}
                href={targetHref}
                className="group flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-black/[0.03] cursor-pointer"
                style={{
                  backgroundColor: B.cardAlt,
                  border: `1px solid ${B.borderLight}`,
                }}
              >
                {/* Status dot */}
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: style.dot }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: B.text }}
                  >
                    {post.content || 'Untitled post'}
                  </p>
                  <p suppressHydrationWarning className="text-xs mt-0.5" style={{ color: B.textLight }}>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Status pill */}
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {style.label}
                </span>

                {/* Engagement bar — based on real post status */}
                <div
                  className="hidden sm:block h-1.5 w-16 rounded-full overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: B.heatmapEmpty }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        post.status === 'published' ? B.success :
                        post.status === 'scheduled' ? B.info :
                        post.status === 'failed' ? B.danger : B.accent,
                      width: post.status === 'published' ? '100%' :
                             post.status === 'scheduled' ? '60%' :
                             post.status === 'failed' ? '20%' : '40%',
                    }}
                  />
                </div>
              </Link>
            );
          })}

          {(limit < posts.length || limit > 2) && (
            <div className="flex gap-2">
              {limit < posts.length && (
                <button
                  onClick={handleShowMore}
                  className="flex-1 text-center py-2.5 text-xs font-medium hover:bg-black/5 rounded-lg transition-colors"
                  style={{ color: B.accent }}
                >
                  Show more
                </button>
              )}
              {limit > 2 && (
                <button
                  onClick={() => setLimit(2)}
                  className="flex-1 text-center py-2.5 text-xs font-medium hover:bg-black/5 rounded-lg transition-colors"
                  style={{ color: B.textMuted }}
                >
                  Show less
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

/* ─── Empty State ──────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      <div
        className="p-4 rounded-2xl mb-4"
        style={{ backgroundColor: B.accentBg }}
      >
        <PenTool className="h-8 w-8" style={{ color: B.accent }} />
      </div>
      <h4 className="font-semibold mb-1" style={{ color: B.text }}>
        No broadcasts yet
      </h4>
      <p className="text-sm mb-5 max-w-xs" style={{ color: B.textMuted }}>
        Write your first post and broadcast it across LinkedIn, X, Threads, and more — all at once.
      </p>
      <Link
        href="/dashboard/studio"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-shadow hover:shadow-md"
        style={{
          backgroundColor: B.text,
          color: B.card,
        }}
      >
        <Plus className="h-4 w-4" />
        Create Your First Post
      </Link>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function generateHeatmapData(posts: Post[]): number[][] {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil(daysInMonth / 7);

  // Count posts per day-of-month
  const postsByDay: Record<number, number> = {};
  for (const post of posts) {
    if (post.status !== 'published') continue;
    const d = new Date(post.createdAt);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const day = d.getDate();
      postsByDay[day] = (postsByDay[day] || 0) + 1;
    }
  }

  // Build 7-row (days) × N-column (weeks) grid
  const grid: number[][] = [];
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const row: number[] = [];
    for (let week = 0; week < weeks; week++) {
      const dayNum = week * 7 + dayOfWeek + 1;
      if (dayNum > daysInMonth) {
        row.push(-1); // padding
      } else {
        const count = postsByDay[dayNum] || 0;
        const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
        row.push(level);
      }
    }
    grid.push(row);
  }

  return grid;
}