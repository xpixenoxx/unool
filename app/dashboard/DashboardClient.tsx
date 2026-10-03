'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Globe, PenTool, CheckCircle, ExternalLink, TrendingUp,
  Clock, Activity, Plus, ArrowRight, Sparkles, Eye, MousePointerClick,
  FileText, Radio, ChevronRight, Zap, Send, Star,
  CalendarDays, Wifi, WifiOff, ArrowUpRight, MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PlatformConnections } from '@/components/dashboard/PlatformConnections';
import { BlueskyConnectDialog } from '@/components/dashboard/BlueskyConnectDialog';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';

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
  status: 'draft' | 'scheduled' | 'published' | 'failed';
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
};

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { profile, recentPosts, usageStats, planTier } = data;

  const greeting = getGreeting();
  const displayName = profile?.name?.split(' ')[0] || 'there';
  const isProfileLive = profile?.status === 'published' && profile?.subdomain;

  /* Profile completion */
  const completionSteps = [
    !!profile?.name,
    !!profile?.subdomain,
    !!profile?.headline,
    (profile?.links?.length || 0) > 0,
    (profile?.proofPoints?.length || 0) > 0,
    recentPosts.length > 0,
  ];
  const completionPercent = Math.round(
    (completionSteps.filter(Boolean).length / completionSteps.length) * 100
  );

  /* Heatmap data — generate from real posts */
  const heatmapData = useMemo(() => generateHeatmapData(recentPosts), [recentPosts]);

  const searchParams = useSearchParams();
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(searchParams.get('connect') === 'bluesky');


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
            <p className="text-sm font-medium" style={{ color: B.textMuted }}>
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
              <div
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{
                  backgroundColor: B.accentBg,
                  color: B.textSecondary,
                  border: `1px solid ${B.border}`,
                }}
              >
                <Globe className="h-3.5 w-3.5" style={{ color: B.accent }} />
                {profile.subdomain}.unool.co
                {isProfileLive && (
                  <span className="relative flex h-2 w-2 ml-1">
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
              </div>
            )}

            {/* Profile Completion Ring */}
            <div className="flex items-center gap-4 mt-5">
              <div className="relative h-16 w-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    stroke={B.borderLight}
                    strokeWidth="3"
                  />
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    stroke={B.accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${completionPercent} ${100 - completionPercent}`}
                  />
                </svg>
                <span
                  className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                  style={{ color: B.text }}
                >
                  {completionPercent}%
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: B.text }}>
                  Profile Completion
                </p>
                <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>
                  {completionPercent === 100
                    ? 'Your profile is fully set up!'
                    : `${completionSteps.filter(Boolean).length} of ${completionSteps.length} steps done`}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/dashboard/composer"
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

        {/* Metrics — 3 cards in a column that spans 7 cols */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <MetricBentoCard
            icon={Eye}
            label="Impressions"
            value={usageStats.profileViews}
            change={null}
            sparkData={[2, 5, 3, 8, 6, 9, 7, 11, 8, 14]}
          />
          <MetricBentoCard
            icon={FileText}
            label="Content Published"
            value={usageStats.postsThisMonth}
            suffix={`/ ${usageStats.postsLimit}`}
            change={null}
            sparkData={[1, 2, 1, 3, 2, 4, 3, 5, 4, usageStats.postsThisMonth]}
          />
          <MetricBentoCard
            icon={MousePointerClick}
            label="Link Engagement"
            value={usageStats.linkClicks}
            change={null}
            sparkData={[3, 1, 4, 2, 6, 5, 8, 4, 7, 9]}
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
            {[
              { id: 'linkedin', name: 'LinkedIn', icon: '🔗', color: '#0A66C2', connected: data.connections['linkedin']?.status === 'connected' },
              { id: 'x', name: 'X (Twitter)', icon: '𝕏', color: '#1A1A1A', connected: data.connections['x']?.status === 'connected' },
              { id: 'threads', name: 'Threads', icon: '🧵', color: '#000000', connected: data.connections['threads']?.status === 'connected' },
              { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E1306C', connected: data.connections['instagram']?.status === 'connected' },
              { id: 'facebook', name: 'Facebook', icon: '👤', color: '#1877F2', connected: data.connections['facebook']?.status === 'connected' },
              { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000', connected: data.connections['youtube']?.status === 'connected' },
              { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#E60023', connected: data.connections['pinterest']?.status === 'connected' },
              { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366', connected: data.connections['whatsapp']?.status === 'connected' },
              { id: 'bluesky', name: 'Bluesky', icon: '🦋', color: '#0085ff', connected: data.connections['bluesky']?.status === 'connected' },
            ].map((platform) => {
              const isLinkedinAnalytics = platform.id === 'linkedin' && platform.connected;
              return (
              <div
                key={platform.name}
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
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: platform.connected ? platform.color : B.borderLight,
                    color: platform.connected ? '#fff' : B.textLight,
                  }}
                >
                  {platform.icon === '𝕏' ? '𝕏' : platform.icon === '🔗' ? 'in' : '@'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: B.text }}>
                    {platform.name}
                  </p>
                  <p className="text-xs" style={{ color: platform.connected ? B.success : B.textLight }}>
                    {platform.connected ? '● Connected' : '○ Not connected'}
                  </p>
                </div>
                {!platform.connected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (platform.id === 'bluesky') {
                        setBlueskyDialogOpen(true);
                      } else {
                        window.location.href = `/api/auth/platform/connect?platform=${platform.id}&workspaceId=${data.workspaceId}`;
                      }
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: B.accentBg, color: B.accent }}
                  >
                    Connect
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
                className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors hover:bg-black/5"
                style={{ color: B.accent }}
              >
                Manage all platforms
                <ArrowRight className="h-3 w-3" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-[#F7F3ED] border-none max-h-[85vh] overflow-y-auto">
              <DialogTitle className="sr-only">Manage Platforms</DialogTitle>
              <PlatformConnections workspaceId={data.workspaceId} />
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {/* ═══ ROW 3: Quick Actions ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div variants={fadeUp} transition={transition}>
          <QuickActionBento
            icon={Globe}
            title="Your Public Profile"
            subtitle="One link for everything"
            description="Professional landing page with links, credentials, and social proof — all in one place."
            href={isProfileLive ? `/u/${profile?.subdomain}` : '/dashboard/presence'}
            buttonLabel={isProfileLive ? 'View Live Profile' : 'Set Up Profile'}
            external={!!isProfileLive}
            badge={isProfileLive ? 'Live' : undefined}
          />
        </motion.div>
        <motion.div variants={fadeUp} transition={transition}>
          <QuickActionBento
            icon={Send}
            title="Content Studio"
            subtitle="Write once, broadcast everywhere"
            description="AI adapts your content for LinkedIn, X, Threads, and more. Review and publish in one click."
            href="/dashboard/composer"
            buttonLabel="Open Studio"
            badge={usageStats.postsThisMonth > 0 ? `${usageStats.postsThisMonth} this month` : undefined}
          />
        </motion.div>
      </div>

      {/* ═══ ROW 4: Onboarding (if incomplete) ═══ */}
      {data.profile && completionPercent < 100 && (
        <motion.div variants={fadeUp} transition={transition}>
          <OnboardingChecklist workspaceId={data.workspaceId} userId={data.userId} />
        </motion.div>
      )}

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
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   METRIC BENTO CARD
   ═══════════════════════════════════════════════════════════════ */

function MetricBentoCard({
  icon: Icon,
  label,
  value,
  suffix,
  change,
  sparkData,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  change: number | null;
  sparkData: number[];
}) {
  const maxVal = Math.max(...sparkData, 1);
  const points = sparkData
    .map((v, i) => {
      const x = (i / (sparkData.length - 1)) * 100;
      const y = 100 - (v / maxVal) * 80;
      return `${x},${y}`;
    })
    .join(' ');

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
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: B.textMuted }}>
          {label}
        </span>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: B.accentBg }}>
          <Icon className="h-3.5 w-3.5" style={{ color: B.accent }} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: B.text }}
        >
          {value.toLocaleString()}
        </span>
        {suffix && (
          <span className="text-sm" style={{ color: B.textLight }}>
            {suffix}
          </span>
        )}
      </div>

      {/* Sparkline */}
      <div className="h-10 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id={`spark-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={B.accent} stopOpacity="0.2" />
              <stop offset="100%" stopColor={B.accent} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polyline
            points={`0,100 ${points} 100,100`}
            fill={`url(#spark-${label.replace(/\s/g, '')})`}
          />
          <polyline
            points={points}
            fill="none"
            stroke={B.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
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
      className="rounded-2xl p-6 transition-shadow duration-200 hover:shadow-md relative overflow-hidden"
      style={{
        backgroundColor: B.card,
        border: `1px solid ${B.cardBorder}`,
        boxShadow: B.cardShadow,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
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
            className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
            style={{
              backgroundColor: badge === 'Live' ? B.successBg : B.accentBg,
              color: badge === 'Live' ? B.success : B.textSecondary,
            }}
          >
            {badge === 'Live' && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: B.success }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: B.success }} />
              </span>
            )}
            {badge}
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed mb-5" style={{ color: B.textMuted }}>
        {description}
      </p>

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
          href="/dashboard/composer"
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
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-default"
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
                  <p className="text-xs mt-0.5" style={{ color: B.textLight }}>
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

                {/* Engagement mini-bar (visual indicator) */}
                <div
                  className="hidden sm:block h-1.5 w-16 rounded-full overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: B.heatmapEmpty }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: B.accent,
                      width: `${Math.min(100, Math.random() * 80 + 20)}%`,
                    }}
                  />
                </div>
              </motion.div>
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
        href="/dashboard/composer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-shadow hover:shadow-md"
        style={{
          backgroundColor: B.text,
          color: B.card,
        }}
      >
        <Sparkles className="h-4 w-4" />
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