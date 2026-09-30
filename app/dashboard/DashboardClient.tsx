'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Globe, PenTool, CheckCircle, ExternalLink, TrendingUp,
  Clock, Activity, Plus, ArrowRight, Sparkles, Eye, MousePointerClick,
  FileText, Radio, ChevronRight, Zap, Target, BarChart3,
  Layers, Send, Rocket, Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PlatformConnections } from '@/components/dashboard/PlatformConnections';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

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
  planTier: 'free' | 'pro' | 'enterprise';
  userId: string;
  workspaceId: string;
}

/* ─── Motion helpers ───────────────────────────────────────── */

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30, mass: 1 };
const gentleSpring = { type: 'spring' as const, stiffness: 300, damping: 35, mass: 1.2 };

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

/* ─── Status config ────────────────────────────────────────── */

const STATUS_CONFIG: Record<Post['status'], {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: React.ElementType;
}> = {
  published: {
    label: 'Published',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-900/50',
    icon: CheckCircle,
  },
  draft: {
    label: 'Draft',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-900/50',
    icon: Clock,
  },
  scheduled: {
    label: 'Scheduled',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-900/50',
    icon: Clock,
  },
  failed: {
    label: 'Failed',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-900/50',
    icon: Activity,
  },
};

/* ─── Main Dashboard ───────────────────────────────────────── */

export default function DashboardClient({ data }: { data: DashboardData }) {
  const reducedMotion = useReducedMotion();
  const { profile, recentPosts, usageStats, planTier } = data;
  const transition = reducedMotion ? { duration: 0.01 } : springTransition;

  const greeting = getGreeting();
  const displayName = profile?.name || 'there';
  const isProfileLive = profile?.status === 'published' && profile?.subdomain;

  return (
    <motion.div
      className="space-y-8 max-w-[1200px] mx-auto"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* ═══ 1. Welcome Hero ═══ */}
      <motion.section variants={fadeUp} transition={transition}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {displayName}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isProfileLive
                ? 'Your profile is live. Here\'s how your presence is performing.'
                : 'Set up your profile and start publishing across platforms.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/presence">
                <PenTool className="mr-1.5 h-3.5 w-3.5" />
                Edit Profile
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/composer">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Post
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ═══ 2. Profile Status + Metrics Strip ═══ */}
      <motion.section variants={fadeUp} transition={transition}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Profile Status Card — wider on small screens */}
          <ProfileStatusCard profile={profile} />

          {/* Metric: Content Published */}
          <MetricCard
            icon={FileText}
            iconBg="bg-blue-500/10 dark:bg-blue-500/20"
            iconColor="text-blue-600 dark:text-blue-400"
            label="Content Published"
            value={usageStats.postsThisMonth}
            suffix={`of ${usageStats.postsLimit}`}
            detail={planTier === 'free' ? 'Free plan' : `${planTier} plan`}
            progress={(usageStats.postsThisMonth / usageStats.postsLimit) * 100}
            progressColor="bg-blue-500"
          />

          {/* Metric: Profile Impressions */}
          <MetricCard
            icon={Eye}
            iconBg="bg-emerald-500/10 dark:bg-emerald-500/20"
            iconColor="text-emerald-600 dark:text-emerald-400"
            label="Profile Impressions"
            value={usageStats.profileViews}
            detail="This month"
          />

          {/* Metric: Link Engagement */}
          <MetricCard
            icon={MousePointerClick}
            iconBg="bg-purple-500/10 dark:bg-purple-500/20"
            iconColor="text-purple-600 dark:text-purple-400"
            label="Link Engagement"
            value={usageStats.linkClicks}
            detail="Total clicks"
          />
        </div>
      </motion.section>

      {/* ═══ 3. Quick Actions — Two clear paths ═══ */}
      <motion.section variants={fadeUp} transition={transition}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Your Public Profile */}
          <QuickActionCard
            icon={Globe}
            accentFrom="from-cyan-500/8"
            accentTo="to-teal-500/8"
            borderAccent="border-cyan-500/20 dark:border-cyan-500/15"
            title="Your Public Profile"
            subtitle="One link for everything"
            description="Your professional landing page — links, credentials, and social proof in one place."
            primaryAction={{
              label: isProfileLive ? 'View Live Profile' : 'Set Up Profile',
              href: isProfileLive ? `/u/${profile?.subdomain}` : '/dashboard/presence',
              external: !!isProfileLive,
              icon: isProfileLive ? ExternalLink : ArrowRight,
            }}
            secondaryAction={{
              label: 'Customize Design',
              href: '/dashboard/presence',
            }}
            badge={isProfileLive ? { label: 'Live', variant: 'live' } : undefined}
            liveUrl={isProfileLive ? `${profile?.subdomain}.unool.co` : undefined}
          />

          {/* Write & Broadcast */}
          <QuickActionCard
            icon={Send}
            accentFrom="from-violet-500/8"
            accentTo="to-purple-500/8"
            borderAccent="border-violet-500/20 dark:border-violet-500/15"
            title="Write & Broadcast"
            subtitle="One post, every platform"
            description="Write once — AI adapts your content for LinkedIn, X, Threads, and more. Review and publish in one click."
            primaryAction={{
              label: 'Create New Post',
              href: '/dashboard/composer',
              icon: PenTool,
            }}
            secondaryAction={{
              label: 'View All Posts',
              href: '/dashboard/publish',
            }}
            badge={usageStats.postsThisMonth > 0 ? {
              label: `${usageStats.postsThisMonth} this month`,
              variant: 'info',
            } : undefined}
          />
        </div>
      </motion.section>

      {/* ═══ 4. Onboarding / Setup Progress ═══ */}
      {data.profile && (
        <motion.section variants={fadeUp} transition={transition}>
          <OnboardingChecklist workspaceId={data.workspaceId} userId={data.userId} />
        </motion.section>
      )}

      {/* ═══ 5. Recent Activity ═══ */}
      <motion.section variants={fadeUp} transition={transition}>
        <RecentPostsSection posts={recentPosts} />
      </motion.section>

      {/* ═══ 6. Global Publishing Network ═══ */}
      <motion.section variants={fadeUp} transition={transition}>
        <PlatformConnections workspaceId={data.workspaceId} />
      </motion.section>
    </motion.div>
  );
}

/* ─── Profile Status Card ──────────────────────────────────── */

function ProfileStatusCard({ profile }: { profile: Profile | null }) {
  const isLive = profile?.status === 'published' && profile?.subdomain;

  return (
    <Card className="relative overflow-hidden border-border/60">
      {/* Subtle accent gradient */}
      <div className={cn(
        'absolute inset-0 opacity-40 pointer-events-none',
        isLive
          ? 'bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent'
          : 'bg-gradient-to-br from-amber-500/10 via-transparent to-transparent'
      )} />

      <CardContent className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            isLive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
          )}>
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                Draft
              </>
            )}
          </div>
          <Globe className={cn(
            'h-4 w-4',
            isLive ? 'text-emerald-500' : 'text-muted-foreground/50'
          )} />
        </div>

        <h3 className="font-semibold text-foreground truncate">
          {profile?.name || 'Your Profile'}
        </h3>

        {profile?.headline && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {profile.headline}
          </p>
        )}

        {profile?.subdomain && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded truncate">
              {profile.subdomain}.unool.co
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Metric Card ──────────────────────────────────────────── */

function MetricCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  suffix,
  detail,
  progress,
  progressColor,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
  suffix?: string;
  detail?: string;
  progress?: number;
  progressColor?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <div className={cn('p-1.5 rounded-lg', iconBg)}>
            <Icon className={cn('h-3.5 w-3.5', iconColor)} />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {value.toLocaleString()}
          </span>
          {suffix && (
            <span className="text-sm text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>

        {detail && (
          <p className="text-xs text-muted-foreground mt-1">{detail}</p>
        )}

        {progress !== undefined && (
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', progressColor || 'bg-primary')}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Quick Action Card ────────────────────────────────────── */

function QuickActionCard({
  icon: Icon,
  accentFrom,
  accentTo,
  borderAccent,
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  badge,
  liveUrl,
}: {
  icon: React.ElementType;
  accentFrom: string;
  accentTo: string;
  borderAccent: string;
  title: string;
  subtitle: string;
  description: string;
  primaryAction: {
    label: string;
    href: string;
    external?: boolean;
    icon?: React.ElementType;
  };
  secondaryAction: {
    label: string;
    href: string;
  };
  badge?: { label: string; variant: 'live' | 'info' };
  liveUrl?: string;
}) {
  const ActionIcon = primaryAction.icon || ArrowRight;

  return (
    <Card className={cn(
      'relative overflow-hidden border transition-shadow hover:shadow-md',
      borderAccent
    )}>
      {/* Background gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br pointer-events-none',
        accentFrom, accentTo
      )} />

      <CardContent className="relative p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-background/80 border border-border/40 shadow-sm">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {badge && (
            <Badge
              variant={badge.variant === 'live' ? 'default' : 'secondary'}
              className={cn(
                'text-xs flex-shrink-0',
                badge.variant === 'live' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-0'
              )}
            >
              {badge.variant === 'live' && (
                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              )}
              {badge.label}
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {description}
        </p>

        {/* Live URL preview */}
        {liveUrl && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/40">
            <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-mono text-muted-foreground truncate">{liveUrl}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link
              href={primaryAction.href}
              target={primaryAction.external ? '_blank' : undefined}
              rel={primaryAction.external ? 'noopener noreferrer' : undefined}
            >
              {primaryAction.label}
              <ActionIcon className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link href={secondaryAction.href}>
              {secondaryAction.label}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Recent Posts Section ─────────────────────────────────── */

function RecentPostsSection({ posts }: { posts: Post[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayPosts = showAll ? posts : posts.slice(0, 5);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your latest posts and their status
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/dashboard/composer">
              <Plus className="h-3.5 w-3.5" />
              New Post
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {posts.length > 0 ? (
          <div className="space-y-2">
            {displayPosts.map((post, index) => {
              const config = STATUS_CONFIG[post.status];
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                  className={cn(
                    'group flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-default',
                    config.bgColor,
                    config.borderColor,
                    'hover:bg-accent/50'
                  )}
                >
                  {/* Status dot */}
                  <div className="flex-shrink-0">
                    <span className={cn('block h-2 w-2 rounded-full', config.dotColor)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {post.content || 'Untitled post'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Status badge */}
                  <Badge
                    variant="secondary"
                    className={cn('text-xs flex-shrink-0 gap-1 border-0', config.textColor, config.bgColor)}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </motion.div>
              );
            })}

            {posts.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-center py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAll ? 'Show less' : `Show ${posts.length - 5} more`}
              </button>
            )}
          </div>
        ) : (
          <EmptyPostsState />
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Empty States ─────────────────────────────────────────── */

function EmptyPostsState() {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <div className="p-4 rounded-2xl bg-muted/50 mb-4">
        <PenTool className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h4 className="font-medium text-foreground mb-1">No posts yet</h4>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        Write your first post and broadcast it across LinkedIn, X, Threads, and more — all at once.
      </p>
      <Button asChild size="sm" className="gap-1.5">
        <Link href="/dashboard/composer">
          <Sparkles className="h-3.5 w-3.5" />
          Create Your First Post
        </Link>
      </Button>
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