'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { PlatformConnections, SUPPORTED_PLATFORMS } from '@/components/dashboard/PlatformConnections';
import { BlueskyConnectDialog } from '@/components/dashboard/BlueskyConnectDialog';
import { ManualIntegrationDialog } from '@/components/dashboard/ManualIntegrationDialog';
import { PlatformBrandLogo } from '@/components/dashboard/PlatformLogos';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { ProfileCompletionQuest, getQuestSteps } from '@/components/dashboard/ProfileCompletionQuest';
import { getHourlyGreetingForDate } from '@/lib/utils/hourlyGreetings';
import './overview.css';

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
  profileViewsThisWeek?: number;
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

interface AnalyticsInsights {
  viewsSeries: number[];
  clicksSeries: number[];
  postsSeries?: number[];
  viewsThisWeek: number;
  clicksThisWeek: number;
  postsThisWeek?: number;
  viewsChangeWoW: number;
  clicksChangeWoW: number;
  postsChangeWoW?: number;
  conversionRate: number;
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
    } catch {
      /* silent */
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    fetch_();

    // Auto-refresh every 60s and on window focus for live data
    const interval = setInterval(fetch_, 60_000);
    const onFocus = () => fetch_();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetch_]);

  return { insights, loadingInsights };
}

/* ─── Platform Network Presets ────────────────────────────── */

interface NetworkPlatformDef {
  id: string;
  name: string;
  mark: string;
}

const OVERVIEW_8_PLATFORMS: NetworkPlatformDef[] = [
  { id: 'linkedin', name: 'LinkedIn', mark: 'in' },
  { id: 'threads', name: 'Threads', mark: '@' },
  { id: 'instagram', name: 'Instagram', mark: 'Ig' },
  { id: 'bluesky', name: 'Bluesky', mark: 'B' },
  { id: 'mastodon', name: 'Mastodon', mark: 'M' },
  { id: 'slack', name: 'Slack', mark: '#' },
  { id: 'telegram', name: 'Telegram', mark: 'T' },
  { id: 'dribbble', name: 'Dribbble', mark: 'Dr' },
];

const ALL_PLATFORM_DEFS: Record<string, NetworkPlatformDef> = {
  linkedin: { id: 'linkedin', name: 'LinkedIn', mark: 'in' },
  threads: { id: 'threads', name: 'Threads', mark: '@' },
  instagram: { id: 'instagram', name: 'Instagram', mark: 'Ig' },
  bluesky: { id: 'bluesky', name: 'Bluesky', mark: 'B' },
  mastodon: { id: 'mastodon', name: 'Mastodon', mark: 'M' },
  slack: { id: 'slack', name: 'Slack', mark: '#' },
  telegram: { id: 'telegram', name: 'Telegram', mark: 'T' },
  dribbble: { id: 'dribbble', name: 'Dribbble', mark: 'Dr' },
  x: { id: 'x', name: 'X (Twitter)', mark: 'X' },
  facebook: { id: 'facebook', name: 'Facebook', mark: 'f' },
  youtube: { id: 'youtube', name: 'YouTube', mark: 'YT' },
  pinterest: { id: 'pinterest', name: 'Pinterest', mark: 'P' },
  reddit: { id: 'reddit', name: 'Reddit', mark: 'r/' },
  twitch: { id: 'twitch', name: 'Twitch', mark: 'Tw' },
  discord: { id: 'discord', name: 'Discord', mark: 'Dc' },
  skool: { id: 'skool', name: 'Skool', mark: 'sk' },
  whop: { id: 'whop', name: 'Whop', mark: 'W' },
  kick: { id: 'kick', name: 'Kick', mark: 'K' },
  warpcast: { id: 'warpcast', name: 'Farcaster', mark: 'Fc' },
  mewe: { id: 'mewe', name: 'MeWe', mark: 'Mw' },
  nostr: { id: 'nostr', name: 'Nostr', mark: 'N' },
  medium: { id: 'medium', name: 'Medium', mark: 'Med' },
  lemmy: { id: 'lemmy', name: 'Lemmy', mark: 'Lm' },
  listmonk: { id: 'listmonk', name: 'Listmonk', mark: 'Lm' },
  hashnode: { id: 'hashnode', name: 'Hashnode', mark: 'Hn' },
  devto: { id: 'devto', name: 'DEV.to', mark: 'Dev' },
  manual: { id: 'manual', name: 'Manual / Other', mark: 'Ot' },
};

const ALTERNATING_PALETTE = [
  {
    // Blue gradient & color
    gradient: 'linear-gradient(145deg, #1d6bf3, #0a3fb5)',
    color: '#1565d8',
  },
  {
    // Black gradient & color
    gradient: 'linear-gradient(145deg, #2b2b2b, #0a0a0a)',
    color: '#111111',
  },
];

/* ─── Animated Counter ────────────────────────────────────── */

function AnimatedCounter({ value, loading }: { value: number; loading?: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (loading || isNaN(value)) return;
    const t0 = performance.now();
    let animId: number;
    const animate = (now: number) => {
      const k = Math.min((now - t0) / 800, 1);
      setDisplay(Math.round(value * k));
      if (k < 1) animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [value, loading]);

  if (loading) return <span>—</span>;
  return <span>{display.toLocaleString()}</span>;
}

/* ─── Interactive Sparkline ───────────────────────────────── */

function InteractiveSparkline({
  data,
  unit = 'events',
}: {
  data: number[] | null;
  unit?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hoverVal, setHoverVal] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [ptPos, setPtPos] = useState<{ x: number; y: number; transform: string } | null>(null);

  const series = data && data.length >= 2 ? data : null;
  const maxVal = series ? Math.max(...series, 1) : 1;

  const { dPath, dArea } = useMemo(() => {
    if (!series) return { dPath: '', dArea: '' };
    const points = series.map((v, i) => [
      (i / (series.length - 1)) * 200,
      44 - (v / maxVal) * 38,
    ]);
    const pStr = 'M' + points.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
    return {
      dPath: pStr,
      dArea: `${pStr} L200 50 L0 50Z`,
    };
  }, [series, maxVal]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !series || series.length < 2) return;
    const rect = ref.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (series.length - 1));
    const val = series[idx];
    const xPct = (idx / (series.length - 1)) * 100;
    const yVal = 44 - (val / maxVal) * 38;
    const yPx = 10 + (yVal / 50) * 52;

    const daysAgo = (series.length - 1) - idx;
    let dateStr = 'Today';
    if (daysAgo === 1) {
      dateStr = 'Yesterday';
    } else if (daysAgo > 1) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const transform = xPct < 20
      ? 'translate(0, -100%)'
      : xPct > 80
      ? 'translate(-100%, -100%)'
      : 'translate(-50%, -100%)';

    setHoverVal(val);
    setHoverDate(dateStr);
    setPtPos({ x: xPct, y: yPx, transform });
  };

  const handleMouseLeave = () => {
    setHoverVal(null);
    setHoverDate(null);
    setPtPos(null);
  };

  return (
    <div
      ref={ref}
      className="spw"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {hoverVal !== null && hoverDate && ptPos && (
        <>
          <span
            className="tp"
            style={{
              left: `${ptPos.x}%`,
              transform: ptPos.transform,
              opacity: 1,
            }}
          >
            {hoverVal} {unit} • {hoverDate}
          </span>
          <span
            className="pt"
            style={{ left: `${ptPos.x}%`, top: `${ptPos.y}px`, opacity: 1 }}
          />
        </>
      )}
      <svg className="spk" viewBox="0 0 200 50" preserveAspectRatio="none">
        {series ? (
          <>
            <path className="a" d={dArea} />
            <path className="l" d={dPath} />
          </>
        ) : (
          <path className="fl" d="M0 40H200" />
        )}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN OVERVIEW DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { profile, recentPosts, usageStats } = data;

  const displayName = profile?.name?.split(' ')[0] || 'there';
  const profileSubdomain = profile?.subdomain || 'preview';
  const profileUrl = `${profileSubdomain}.unool.co`;
  const isProfileLive = profile?.status === 'published' && profile?.subdomain;

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    setCurrentDate(new Date());
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const hourlyGreeting = useMemo(
    () => getHourlyGreetingForDate(currentDate, displayName),
    [currentDate, displayName]
  );

  const searchParams = useSearchParams();
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(searchParams.get('connect') === 'bluesky');
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [questOpen, setQuestOpen] = useState(false);

  const { insights, loadingInsights } = useAnalyticsInsights();

  // Profile completion calculation using synced Quest steps
  const questSteps = useMemo(() => getQuestSteps(profile, recentPosts), [profile, recentPosts]);
  const completedCount = questSteps.filter((s) => s.completed).length;
  const totalSteps = questSteps.length;
  const completionPercent = Math.round((completedCount / totalSteps) * 100);

  // Platform network hover states
  const [hoveredPlatformId, setHoveredPlatformId] = useState<string | null>(null);
  const [tileOrigins, setTileOrigins] = useState<Record<string, [number, number]>>({});

  // Hero card mouse movement for dynamic radial sheen
  const heroRef = useRef<HTMLElement>(null);
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    heroRef.current.style.setProperty('--mx', `${mx}%`);
    heroRef.current.style.setProperty('--my', `${my}%`);
  };

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  // Copy URL action
  const handleCopyUrl = () => {
    const fullUrl = `https://${profileUrl}`;
    navigator.clipboard.writeText(fullUrl).then(
      () => showToast('Link copied to clipboard!'),
      () => showToast('Press Ctrl+C to copy')
    );
  };

  // Dynamic connections state auto-updated when connections change
  const [connections, setConnections] = useState<Record<string, { status: string; username?: string }>>(
    data.connections || {}
  );

  useEffect(() => {
    if (data.connections) {
      setConnections(data.connections);
    }
  }, [data.connections]);

  const handleConnectionChange = useCallback(
    (newConns: Record<string, { status: string; username?: string }>) => {
      setConnections((prev) => {
        let changed = false;
        for (const [k, v] of Object.entries(newConns)) {
          if (!prev[k] || prev[k].status !== v.status || prev[k].username !== v.username) {
            changed = true;
            break;
          }
        }
        return changed ? { ...prev, ...newConns } : prev;
      });
    },
    []
  );

  // Platforms dataset: ALL connected platforms are shown FIRST,
  // followed by not-connected platforms, with strictly alternating Blue and Black colors.
  const platforms = useMemo(() => {
    const isConn = (id: string) => connections[id]?.status?.toLowerCase() === 'connected';

    // 1. All connected platforms (core 8 platforms first, then any other connected system platforms)
    const connectedList: NetworkPlatformDef[] = [];
    const connectedSet = new Set<string>();

    for (const p of OVERVIEW_8_PLATFORMS) {
      if (isConn(p.id)) {
        connectedList.push(p);
        connectedSet.add(p.id);
      }
    }
    for (const pid of SUPPORTED_PLATFORMS) {
      if (!connectedSet.has(pid) && isConn(pid)) {
        const def = ALL_PLATFORM_DEFS[pid] || {
          id: pid,
          name: pid.charAt(0).toUpperCase() + pid.slice(1),
          mark: pid.slice(0, 2).toUpperCase(),
        };
        connectedList.push(def);
        connectedSet.add(pid);
      }
    }

    // 2. Unconnected platforms: default core 8 platforms first, then remaining supported platforms
    const notConnectedList: NetworkPlatformDef[] = [];
    for (const p of OVERVIEW_8_PLATFORMS) {
      if (!connectedSet.has(p.id)) {
        notConnectedList.push(p);
      }
    }
    for (const pid of SUPPORTED_PLATFORMS) {
      if (!connectedSet.has(pid) && !notConnectedList.some((p) => p.id === pid)) {
        const def = ALL_PLATFORM_DEFS[pid] || {
          id: pid,
          name: pid.charAt(0).toUpperCase() + pid.slice(1),
          mark: pid.slice(0, 2).toUpperCase(),
        };
        notConnectedList.push(def);
      }
    }

    // Keep at least 8 platforms, or rounded up to complete 4-column rows if more platforms are connected
    const targetCount = Math.max(8, Math.ceil(connectedList.length / 4) * 4);
    const combined = [...connectedList, ...notConnectedList].slice(0, targetCount);

    return combined.map((p, index) => {
      const isConnected = isConn(p.id);
      const pal = ALTERNATING_PALETTE[index % 2];
      return {
        ...p,
        connected: isConnected,
        color: pal.color,
        gradient: pal.gradient,
      };
    });
  }, [connections]);

  // System-wide platform counts (all 27 supported platforms)
  const totalSystemPlatforms = SUPPORTED_PLATFORMS.length; // 27
  const systemConnectedCount = useMemo(() => {
    return SUPPORTED_PLATFORMS.filter(
      (pid) => connections[pid]?.status === 'connected'
    ).length;
  }, [connections]);
  const systemNotConnectedCount = Math.max(0, totalSystemPlatforms - systemConnectedCount);

  // Platform connect / disconnect handlers
  const handlePlatformClick = (platformId: string, isConnected: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetTile = (e.currentTarget as HTMLElement).closest('.tile') as HTMLElement | null;
    if (targetTile) {
      const rect = targetTile.getBoundingClientRect();
      const ox = ((e.clientX - rect.left) / rect.width) * 100;
      const oy = ((e.clientY - rect.top) / rect.height) * 100;
      setTileOrigins((prev) => ({ ...prev, [platformId]: [ox, oy] }));
    }

    if (isConnected) {
      const pDef = platforms.find((p) => p.id === platformId);
      if (!confirm(`Disconnect ${pDef?.name || platformId}? You can reconnect anytime.`)) return;

      // Optimistic update: flip state immediately for smooth animation & auto-updated parameters
      setConnections((prev) => ({
        ...prev,
        [platformId]: { status: 'not_connected' },
      }));

      fetch(`/api/platform/connections/${platformId}`, { method: 'DELETE' })
        .then((res) => {
          if (res.ok) {
            showToast(`${pDef?.name || platformId} disconnected`);
          } else {
            // Revert on failure
            setConnections((prev) => ({
              ...prev,
              [platformId]: { status: 'connected' },
            }));
            showToast('Failed to disconnect');
          }
        })
        .catch(() => {
          setConnections((prev) => ({
            ...prev,
            [platformId]: { status: 'connected' },
          }));
          showToast('Failed to disconnect');
        });
    } else {
      if (platformId === 'bluesky') {
        setBlueskyDialogOpen(true);
      } else {
        setConnectingPlatform(platformId);
        window.location.href = `/api/auth/platform/connect?platform=${platformId}&workspaceId=${data.workspaceId}&userId=${data.userId}`;
      }
    }
  };

  // Weekly Flight Plan days
  const [activeDays, setActiveDays] = useState<number[]>([0]);
  const toggleDay = (idx: number) => {
    setActiveDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );
  };

  // Recent Broadcasts
  const [allRecent, setAllRecent] = useState(false);
  const [openPostIds, setOpenPostIds] = useState<Record<string, boolean>>({});
  const displayPosts = allRecent ? recentPosts : recentPosts.slice(0, 2);

  const togglePostOpen = (postId: string) => {
    setOpenPostIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const STAGES = ['Draft', 'Scheduled', 'Published'];

  return (
    <div id="ov-root">
      <div className="wrap">
        {/* ═══ TOP ROW: Hero + 3 Stat Cards ═══ */}
        <div className="top">
          {/* Hero Card */}
          <section
            ref={heroRef}
            className="card hero"
            id="ov-hero"
            data-phase={hourlyGreeting.phase}
            onMouseMove={handleHeroMouseMove}
          >
            <h1 suppressHydrationWarning>
              {hourlyGreeting.parts.prefix}
              <span className="ov-user-name">{hourlyGreeting.parts.name}</span>
              {hourlyGreeting.parts.suffix}
            </h1>

            {/* Profile URL Pill with Live Dot & Copy */}
            <div className="url">
              {isProfileLive && <span className="live" title="Live Profile" />}
              <span className="t" title={`https://${profileUrl}`}>
                {profileUrl}
              </span>
              <button className="cp" onClick={handleCopyUrl} type="button">
                Copy
              </button>
            </div>

            {/* Profile Completion Box */}
            <div
              className="comp"
              onClick={() => setQuestOpen(true)}
              role="button"
              tabIndex={0}
              title="Click to view full completion checklist"
            >
              <div className="ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#ead9b5" fill="none" strokeWidth="9" />
                  <circle
                    id="ov-arc"
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#c29b5b"
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - completionPercent / 100)}
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)' }}
                  />
                </svg>
                <b>{completionPercent}%</b>
              </div>

              <div style={{ flex: 1 }}>
                <strong>Profile Completion</strong>
                <small>
                  {completionPercent === 100
                    ? 'Your profile is fully set up!'
                    : `${completedCount} of ${totalSteps} steps done`}
                </small>
                <div className="segs">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <i key={i} className={i < completedCount ? 'on' : ''} />
                  ))}
                </div>
              </div>
            </div>

            <Link href="/dashboard/studio" className="btn d">
              <svg viewBox="0 0 24 24">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
              <span>Start Creating</span>
            </Link>
          </section>

          {/* Stat 1: Impressions */}
          <section className="card stat">
            <div className="hd">
              <span>Impressions</span>
              <div className="stat-tip-wrap">
                <button className="ib ey" aria-label="Impressions info" type="button">
                  <svg viewBox="0 0 24 24">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <div className="stat-tooltip" role="tooltip">
                  <div className="st-head">Impressions</div>
                  <ul className="st-lines">
                    <li>Total visits and views across your public profile link.</li>
                    <li>Tracks unique audience members discovering your work.</li>
                    <li>Compares weekly momentum with real-time growth indicators.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="num">
              <AnimatedCounter
                value={insights?.viewsThisWeek ?? usageStats.profileViewsThisWeek ?? usageStats.profileViews}
                loading={loadingInsights}
              />
              {insights?.viewsChangeWoW !== undefined && insights?.viewsChangeWoW !== null && (
                <span
                  className={`tr ${
                    insights.viewsChangeWoW > 0 ? 'u' : insights.viewsChangeWoW < 0 ? 'w' : ''
                  }`}
                >
                  {insights.viewsChangeWoW > 0
                    ? `↑ ${insights.viewsChangeWoW}%`
                    : insights.viewsChangeWoW < 0
                    ? `↓ ${Math.abs(insights.viewsChangeWoW)}%`
                    : '= 0%'}
                </span>
              )}
            </div>
            <div className="sub">Profile views this week</div>
            <InteractiveSparkline data={insights?.viewsSeries ?? null} unit="views" />
            {insights?.peakHourLabel ? (
              <div className="note" title={`Peak: ${insights.peakHourLabel}`}>
                Peak: {insights.peakHourLabel}
              </div>
            ) : (
              <div
                className="note"
                title={
                  (insights?.viewsThisWeek ?? usageStats.profileViewsThisWeek ?? 0) > 0
                    ? 'Audience engagement tracked live'
                    : 'Share your profile link to start tracking audience views'
                }
              >
                {(insights?.viewsThisWeek ?? usageStats.profileViewsThisWeek ?? 0) > 0
                  ? 'Audience tracking live'
                  : 'Share profile to track views'}
              </div>
            )}
          </section>

          {/* Stat 2: Content Published */}
          <section className="card stat">
            <div className="hd">
              <span>Content Published</span>
              <div className="stat-tip-wrap">
                <button className="ib dc" aria-label="Content Published info" type="button">
                  <svg viewBox="0 0 24 24">
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path d="M14 3v5h5M9 13h6M9 17h4" />
                  </svg>
                </button>
                <div className="stat-tooltip" role="tooltip">
                  <div className="st-head">Content Published</div>
                  <ul className="st-lines">
                    <li>Total posts broadcast and published across your social networks.</li>
                    <li>Monitors progress against your active monthly plan limit.</li>
                    <li>Includes live dispatches, drafts, and automated scheduled posts.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="num">
              <AnimatedCounter value={usageStats.postsThisMonth} />
              {insights?.postsChangeWoW !== undefined && insights?.postsChangeWoW !== null && (
                <span
                  className={`tr ${
                    insights.postsChangeWoW > 0 ? 'u' : insights.postsChangeWoW < 0 ? 'w' : ''
                  }`}
                >
                  {insights.postsChangeWoW > 0
                    ? `↑ ${insights.postsChangeWoW}%`
                    : insights.postsChangeWoW < 0
                    ? `↓ ${Math.abs(insights.postsChangeWoW)}%`
                    : '= 0%'}
                </span>
              )}
            </div>
            <div className="sub">of {usageStats.postsLimit} this month</div>
            <InteractiveSparkline data={insights?.postsSeries ?? null} unit="posts" />
            <div
              className="note"
              title={
                insights?.postsThisWeek !== undefined && insights?.postsThisWeek !== null
                  ? `${insights.postsThisWeek} posts published in the last 7 days`
                  : `${usageStats.postsThisMonth} posts published this month`
              }
            >
              {insights?.postsThisWeek !== undefined && insights?.postsThisWeek !== null
                ? `Pace: ${insights.postsThisWeek} this week`
                : `${usageStats.postsThisMonth} published this month`}
            </div>
          </section>

          {/* Stat 3: Link Engagement */}
          <section className="card stat">
            <div className="hd">
              <span>Link Engagement</span>
              <div className="stat-tip-wrap">
                <button className="ib sp" aria-label="Link Engagement info" type="button">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
                  </svg>
                </button>
                <div className="stat-tooltip" role="tooltip">
                  <div className="st-head">Link Engagement</div>
                  <ul className="st-lines">
                    <li>Total clicks on your links, socials, and featured resources.</li>
                    <li>Measures your visitor-to-click conversion rate percentage.</li>
                    <li>Identifies your top-performing links and audience interests.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="num">
              <AnimatedCounter
                value={insights?.clicksThisWeek ?? usageStats.linkClicks}
                loading={loadingInsights}
              />
              {insights?.clicksChangeWoW !== undefined && insights?.clicksChangeWoW !== null && (
                <span
                  className={`tr ${
                    insights.clicksChangeWoW > 0 ? 'u' : insights.clicksChangeWoW < 0 ? 'w' : ''
                  }`}
                >
                  {insights.clicksChangeWoW > 0
                    ? `↑ ${insights.clicksChangeWoW}%`
                    : insights.clicksChangeWoW < 0
                    ? `↓ ${Math.abs(insights.clicksChangeWoW)}%`
                    : '= 0%'}
                </span>
              )}
            </div>
            <div className="sub">
              {insights?.conversionRate != null
                ? `${insights.conversionRate}% conversion rate`
                : 'Link clicks this week'}
            </div>
            <InteractiveSparkline data={insights?.clicksSeries ?? null} unit="clicks" />
            {insights?.topLinks?.[0] && (
              <div
                className="note"
                title={`Top: ${insights.topLinks[0].label || insights.topLinks[0].url} (${insights.topLinks[0].count})`}
              >
                Top: {insights.topLinks[0].label || insights.topLinks[0].url} ({insights.topLinks[0].count})
              </div>
            )}
          </section>
        </div>

        {/* ═══ SECTION 2: Broadcast Network ═══ */}
        <section className="card con">
          <div className="ch">
            <div>
              <h2>Broadcast Network</h2>
              <p>Your connected platforms</p>
            </div>
            <div className="seg" aria-label="Platform counts">
              <span className="seg-lbl all">
                All <em>{totalSystemPlatforms}</em>
              </span>
              <span className="seg-lbl connected">
                Connected <em>{systemConnectedCount}</em>
              </span>
              <span className="seg-lbl not-connected">
                Not connected <em>{systemNotConnectedCount}</em>
              </span>
            </div>
          </div>

          {/* Brand Tiles Grid */}
          <div className="tiles">
            {platforms.map((p, i) => {
              const isHi = hoveredPlatformId === p.id;
              const origin = tileOrigins[p.id];
              const isPending = connectingPlatform === p.id;
              const isLinkedinAnalytics = p.id === 'linkedin' && p.connected;

              return (
                <div
                  key={p.id}
                  className={`tile ${p.connected ? 'on' : ''} ${isHi ? 'hi' : ''}`}
                  onMouseEnter={() => setHoveredPlatformId(p.id)}
                  onMouseLeave={() => setHoveredPlatformId(null)}
                  onClick={() => {
                    if (isLinkedinAnalytics) {
                      window.location.href = '/analytics/linkedin';
                    }
                  }}
                  style={
                    {
                      '--i': i,
                      '--c': p.gradient,
                      '--t': p.color,
                      '--lb': p.color,
                      ...(origin ? { '--ox': `${origin[0]}%`, '--oy': `${origin[1]}%` } : {}),
                    } as React.CSSProperties
                  }
                >
                  <span className="flood" />
                  <span className="bgm">{p.mark}</span>

                  <div className="tt">
                    <span className="lg">
                      <PlatformBrandLogo platform={p.id} size={34} />
                    </span>
                    <span className="st">{p.connected ? 'Connected' : 'Not connected'}</span>
                  </div>

                  <div className="tb">
                    <b>{p.name}</b>
                    {p.connected ? (
                      <button
                        type="button"
                        className="tbtn g"
                        onClick={(e) => handlePlatformClick(p.id, true, e)}
                        aria-label={`Disconnect ${p.name}`}
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="tbtn k"
                        disabled={isPending}
                        onClick={(e) => handlePlatformClick(p.id, false, e)}
                        aria-label={`Connect ${p.name}`}
                      >
                        {isPending ? (
                          <span className="sp2" />
                        ) : (
                          <svg viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        )}
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All Platforms Modal Trigger */}
          <Dialog
            onOpenChange={(open) => {
              if (!open) {
                // Refresh connections from API when modal closes to catch external changes
                fetch(`/api/platform/connections?workspaceId=${data.workspaceId}&_t=${Date.now()}`)
                  .then((res) => res.json())
                  .then((resData) => {
                    if (resData?.connections) {
                      setConnections((prev) => ({ ...prev, ...resData.connections }));
                    }
                  })
                  .catch(() => {});
              }
            }}
          >
            <DialogTrigger asChild>
              <button type="button" className="all">
                <span>All platforms</span>
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[850px] md:max-w-[980px] lg:max-w-[1100px] bg-[#F7F3ED] border-none max-h-[85vh] overflow-y-auto">
              <DialogTitle className="sr-only">Manage Platforms</DialogTitle>
              <PlatformConnections
                workspaceId={data.workspaceId}
                userId={data.userId}
                initialConnectionsProp={connections}
                onConnectionChange={handleConnectionChange}
              />
            </DialogContent>
          </Dialog>
        </section>

        {/* ═══ SECTION 3: Tools (4 Cards) ═══ */}
        <div className="tools">
          {/* Card 1: Weekly Flight Plan */}
          <section className="card tool">
            <span className="tag">7-Day Arc</span>
            <div className="vis">
              <div className="days">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={activeDays.includes(idx) ? 'on' : ''}
                    onClick={() => toggleDay(idx)}
                    aria-label={`Day ${idx + 1}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <h3>Weekly Flight Plan</h3>
            <div className="t2">Story in · Week of content out</div>
            <p>
              Type one honest paragraph about your week. Unool drafts, cascades, and schedules your
              multi-network week.
            </p>
            <Link href="/dashboard/schedule" className="btn d">
              <span>Plan This Week</span>
              <svg viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </section>

          {/* Card 2: Content Studio */}
          <section className="card tool">
            <span className="tag">
              {usageStats.postsThisMonth > 0 ? `${usageStats.postsThisMonth} Broadcasts` : 'Multi-Publish'}
            </span>
            <div className="vis">
              <div className="fan">
                <i style={{ '--c': '#0a66c2' } as React.CSSProperties}>in</i>
                <i>✎</i>
                <i style={{ '--c': '#e1306c' } as React.CSSProperties}>Ig</i>
              </div>
            </div>
            <h3>Content Studio</h3>
            <div className="t2">Write once, broadcast everywhere</div>
            <p>
              AI adapts your content for LinkedIn, X, Threads, and more. Review and publish in one click.
            </p>
            <Link href="/dashboard/studio" className="btn d">
              <span>Open Studio</span>
              <svg viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </section>

          {/* Card 3: Your Public Profile */}
          <section className="card tool">
            <div className="vis">
              <div className="mini">
                <div className="bar">
                  <i />
                  <i />
                  <i />
                  <span>{profileUrl}</span>
                </div>
                <div className="ln" style={{ width: '55%' }} />
                <div className="ln" />
                <div className="ln" style={{ width: '70%', marginBottom: 10 }} />
              </div>
            </div>
            <h3>Your Public Profile</h3>
            <div className="t2">One link for everything</div>
            <p>
              Professional landing page with links, credentials, and social proof — all in one place.
            </p>
            <Link
              href={isProfileLive ? `/u/${profile?.subdomain}` : '/dashboard/profile'}
              target={isProfileLive ? '_blank' : undefined}
              rel={isProfileLive ? 'noopener noreferrer' : undefined}
              className="btn d"
            >
              <span>{isProfileLive ? 'View Live Profile' : 'Set Up Profile'}</span>
              <svg viewBox="0 0 24 24">
                <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />
              </svg>
            </Link>
          </section>

          {/* Card 4: Automation */}
          <section className="card tool">
            <span className="tag">Auto-Pilot</span>
            <div className="vis">
              <div className="chat">
                <span>Love this! How do I start?</span>
                <span className="b">Sent you the link ✓</span>
              </div>
            </div>
            <h3>Automation</h3>
            <div className="t2">Auto-reply &amp; inbound leads</div>
            <p>
              AI-powered comment and DM automation for Instagram &amp; LinkedIn. Auto-reply and convert audience
              to leads.
            </p>
            <Link href="/dashboard/automation" className="btn d">
              <span>Open Automation</span>
              <svg viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </section>
        </div>

        {/* ═══ SECTION 4: Recent Broadcasts ═══ */}
        <section className="card rec">
          <div className="sh">
            <div>
              <h2>Recent Broadcasts</h2>
              <p>Your latest posts and their status</p>
            </div>
            <Link href="/dashboard/studio" className="btn d">
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>New Post</span>
            </Link>
          </div>

          <div className="tl">
            {displayPosts.length > 0 ? (
              displayPosts.map((post) => {
                const isOpen = !!openPostIds[post.id];
                const stageIdx = STAGES.findIndex(
                  (s) => s.toLowerCase() === post.status.toLowerCase()
                );
                const progressPct =
                  post.status === 'published' ? 100 : post.status === 'scheduled' ? 60 : 30;

                return (
                  <div
                    key={post.id}
                    className={`it ${isOpen ? 'open' : ''}`}
                    onClick={() => togglePostOpen(post.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        togglePostOpen(post.id);
                      }
                    }}
                  >
                    <span className="dot" />
                    <div>
                      <p>{post.content || 'Untitled broadcast'}</p>
                      <small suppressHydrationWarning>
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </small>
                    </div>

                    <div className="step">
                      {stageIdx < 0 ? (
                        <span className="cur">{post.status}</span>
                      ) : (
                        STAGES.map((sName, sIdx) => (
                          <React.Fragment key={sName}>
                            <span
                              className={
                                sIdx < stageIdx ? 'done' : sIdx === stageIdx ? 'cur' : ''
                              }
                            >
                              {sIdx === stageIdx ? post.status : sName}
                            </span>
                            {sIdx < STAGES.length - 1 && <u />}
                          </React.Fragment>
                        ))
                      )}
                    </div>

                    <div className="pr">
                      <i style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">
                No broadcasts yet. Select New Post to create your first one.
              </div>
            )}
          </div>

          {recentPosts.length > 2 && (
            <button
              type="button"
              className="more"
              onClick={() => setAllRecent((prev) => !prev)}
            >
              {allRecent ? 'Show less' : 'Show more'}
            </button>
          )}
        </section>
      </div>

      {/* ─── Profile Completion Quest Modal ─── */}
      <ProfileCompletionQuest
        profile={profile}
        recentPosts={recentPosts}
        isOpen={questOpen}
        onOpenChange={setQuestOpen}
        renderTrigger={false}
      />

      {/* ─── Background Dialogs ─── */}
      <BlueskyConnectDialog
        open={blueskyDialogOpen}
        onClose={() => setBlueskyDialogOpen(false)}
        workspaceId={data.workspaceId}
        onSuccess={() => {
          setConnections((prev) => ({
            ...prev,
            bluesky: { status: 'connected' },
          }));
          showToast('Bluesky connected');
        }}
      />
      <ManualIntegrationDialog
        open={manualDialogOpen}
        onClose={() => setManualDialogOpen(false)}
        workspaceId={data.workspaceId}
      />

      {/* ─── Toast Notification ─── */}
      <div className={`toast ${toastMsg ? 'show' : ''}`} role="status">
        {toastMsg}
      </div>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */
// Hourly greeting engine managed in @/lib/utils/hourlyGreetings