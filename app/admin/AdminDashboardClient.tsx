'use client';

import * as React from 'react';
import Link from 'next/link';

import {
  MetricCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Text,
  Flex,
  Box,
} from '@/components/ui';
import {
  Activity,
  Building2,
  Users,
  Eye,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  RotateCcw,
  Trash2,
  Ban,
  ShieldCheck,
  PieChart,
} from 'lucide-react';
import {
  MotionBox,
  hoverLift,
  staggerItem,
  AnimatePresence,
  motion,
} from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';
import { UserPlanDistributionModal } from '@/components/admin/UserPlanDistributionModal';
import type { UserBreakdownData } from '@/lib/repositories/interfaces/IAdminRepository';

interface WorkspaceAdminView {
  id: string;
  name: string;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  memberCount: number;
  postsThisMonth: number;
  profileCount: number;
  createdAt: string;
  updatedAt: string;
}

interface UserAdminView {
  id: string;
  email: string;
  createdAt: string;
  workspaceCount: number;
  plan: string;
}

interface PlanAdminView {
  id: string;
  name: string;
  description: string | null;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsSummary {
  totalProfileViews: number;
  totalLinkClicks: number;
  totalPostsPublished: number;
  totalWorkspaces: number;
  totalUsers: number;
  newUsersLast30Days?: number;
  usersByPlan?: Record<string, number>;
  userRegistrationsLast30Days?: Array<{ date: string; count: number }>;
  userBreakdown?: UserBreakdownData;
  eventsByType: Record<string, number>;
  eventsLast30Days: Array<{ date: string; count: number }>;
  topLinks: Array<{
    linkType: string;
    url: string;
    clicks: number;
    title?: string | null;
    profileId?: string | null;
    profileName?: string | null;
    profileSubdomain?: string | null;
    profileAvatarUrl?: string | null;
  }>;
  topProfiles: Array<{
    profileId: string;
    name: string;
    views: number;
    subdomain?: string | null;
    avatarUrl?: string | null;
    handle?: string | null;
  }>;
}

interface RecoverableDashboardItem {
  id: string;
  type: 'deleted' | 'suspended';
  profileId: string | null;
  userId: string;
  subdomain: string | null;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  workspaceId: string | null;
  reason: string;
  timestamp: string;
}

interface InitialData {
  analytics: AnalyticsSummary;
  workspaces: { data: WorkspaceAdminView[]; total: number; page: number; pageSize: number; totalPages: number };
  users: { data: UserAdminView[]; total: number; page: number; pageSize: number; totalPages: number };
  plans: PlanAdminView[];
}

interface AdminDashboardClientProps {
  initialData: InitialData;
}

export default function AdminDashboardClient({ initialData }: AdminDashboardClientProps) {
  const [analytics, setAnalytics] = React.useState<AnalyticsSummary>(initialData.analytics);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);
  const [isUserHovered, setIsUserHovered] = React.useState(false);
  const { workspaces, users, plans } = initialData;

  const refreshAnalytics = React.useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/analytics?days=30');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to refresh admin analytics:', err);
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  const [recoveryItems, setRecoveryItems] = React.useState<RecoverableDashboardItem[]>([]);
  const [recoveringId, setRecoveringId] = React.useState<string | null>(null);

  const fetchRecoveryItems = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/recovery');
      if (res.ok) {
        const data = await res.json();
        setRecoveryItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch recovery items in dashboard:', err);
    }
  }, []);

  const handleDashboardRecover = async (item: RecoverableDashboardItem) => {
    const confirmationText =
      item.type === 'deleted'
        ? `Are you sure you want to recover profile "${item.name || item.subdomain}"?`
        : `Are you sure you want to unsuspend user "${item.email}"?`;
    if (!confirm(confirmationText)) return;

    setRecoveringId(item.id);
    try {
      const res = await fetch('/api/admin/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: item.profileId,
          userId: item.userId,
          type: item.type,
        }),
      });
      if (res.ok) {
        setRecoveryItems((prev) => prev.filter((i) => i.id !== item.id));
        refreshAnalytics(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to recover account/profile');
      }
    } catch {
      alert('Failed to recover account/profile');
    } finally {
      setRecoveringId(null);
    }
  };

  React.useEffect(() => {
    fetchRecoveryItems();

    // Real-time polling every 15 seconds
    const interval = setInterval(() => {
      refreshAnalytics(false);
      fetchRecoveryItems();
    }, 15000);

    // Refresh immediately when window regains focus
    const handleFocus = () => {
      refreshAnalytics(false);
      fetchRecoveryItems();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshAnalytics, fetchRecoveryItems]);

  const metrics = [
    {
      label: 'Total Workspaces',
      value: analytics.totalWorkspaces.toLocaleString(),
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      label: 'Total Users',
      value: analytics.totalUsers.toLocaleString(),
      icon: <Users className="h-5 w-5" />,
      change: `+${analytics.newUsersLast30Days ?? 0} in 30d`,
      changeType: 'increase' as const,
      isTotalUsers: true,
    },
    {
      label: 'Profile Views (30d)',
      value: analytics.totalProfileViews.toLocaleString(),
      icon: <Eye className="h-5 w-5" />,
    },
    {
      label: 'Link Clicks (30d)',
      value: analytics.totalLinkClicks.toLocaleString(),
      icon: <ExternalLink className="h-5 w-5" />,
    },
  ];

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Flex between className="items-start gap-4">
        <Flex column gap={2}>
          <Text size="3xl" weight="bold" color="foreground">
            Overview
          </Text>
          <Text size="lg" color="muted">
            Monitor your platform&apos;s health and growth at a glance.
          </Text>
        </Flex>
        <Flex gap={2} align="center" className="flex-wrap">
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs font-normal">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshAnalytics(true)}
            disabled={isRefreshing}
            className="h-9 gap-1.5"
            title="Refresh analytics data"
          >
            <RefreshCw className={isRefreshing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* CTA Button - Opens Interactive User Plan Breakdown Window */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsPlanModalOpen(true)}
            className="h-9 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs font-medium cursor-pointer"
            title="Open Interactive User Plan Distribution & 30-Day Growth Graph"
          >
            <PieChart className="h-4 w-4" />
            <span>User Breakdown</span>
            <Badge variant="secondary" className="bg-white/20 text-white text-[10px] py-0 px-1.5 font-normal ml-0.5">
              Live Graph
            </Badge>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/admin/analytics"><Activity className="mr-2 h-4 w-4" />Full Analytics</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/workspaces"><Building2 className="mr-2 h-4 w-4" />Workspaces</Link>
          </Button>
        </Flex>
      </Flex>

      {/* Metrics Grid */}
      <div>
        <Flex align="center" gap={2} className="mb-3">
          <Text size="sm" weight="semibold" color="muted" className="uppercase tracking-wide">Platform Metrics</Text>
          <SectionGuide
            title="Platform Metrics"
            description="Live counts pulled from the database. Profile Views and Link Clicks are totals for the last 30 days. Workspaces and Users are all-time counts."
            example="Workspaces: 142  |  Users: 389\nProfile Views (30d): 12,847\nLink Clicks (30d): 4,321"
          />
        </Flex>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            if (metric.isTotalUsers) {
              return (
                <div
                  key={metric.label}
                  className="relative"
                  onMouseEnter={() => setIsUserHovered(true)}
                  onMouseLeave={() => setIsUserHovered(false)}
                >
                  <MotionBox
                    variants={staggerItem}
                    custom={index}
                    {...hoverLift}
                    onClick={() => setIsPlanModalOpen(true)}
                    className="cursor-pointer group relative"
                  >
                    <MetricCard
                      value={metric.value}
                      label={metric.label}
                      icon={metric.icon}
                      change={metric.change}
                      changeType={metric.changeType}
                      padding="lg"
                      className="border-primary/20 hover:border-primary/50 transition-colors relative"
                    />
                    {/* Visual action badge inside card */}
                    <div className="absolute top-3.5 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-0.5 bg-primary/10 text-primary border-primary/30">
                        <PieChart className="h-2.5 w-2.5" />
                        Breakdown ↗
                      </Badge>
                    </div>
                  </MotionBox>

                  {/* Real-time Hover Tooltip: Users registered in the past 1 month */}
                  <AnimatePresence>
                    {isUserHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-72 pointer-events-none"
                      >
                        <div className="rounded-2xl border border-primary/30 bg-popover/95 p-4 shadow-2xl backdrop-blur-md text-popover-foreground ring-1 ring-black/5 dark:ring-white/10">
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Past 1 Month Signups
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-normal">
                              Real-time
                            </Badge>
                          </div>

                          <div className="flex items-baseline justify-between gap-2">
                            <div>
                              <div className="text-2xl font-bold text-foreground">
                                +{analytics.newUsersLast30Days ?? 0}
                                <span className="text-xs font-normal text-muted-foreground ml-1.5">users</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                registered in the past 30 days
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {analytics.totalUsers > 0
                                  ? `${Math.round(((analytics.newUsersLast30Days ?? 0) / analytics.totalUsers) * 100)}%`
                                  : '0%'}
                              </div>
                              <div className="text-[10px] text-muted-foreground">of total base</div>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] font-medium text-primary">
                            <span className="flex items-center gap-1">
                              <PieChart className="h-3 w-3" />
                              Click to view plan graph
                            </span>
                            <span className="text-xs">↗</span>
                          </div>
                        </div>
                        {/* Tooltip triangle beak */}
                        <div className="w-3 h-3 bg-popover border-r border-b border-primary/30 rotate-45 mx-auto -mt-1.5 shadow-xs" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <MotionBox variants={staggerItem} custom={index} key={metric.label} {...hoverLift}>
                <MetricCard
                  value={metric.value}
                  label={metric.label}
                  icon={metric.icon}
                  padding="lg"
                />
              </MotionBox>
            );
          })}
        </div>
      </div>

      {/* Events by Type */}
      <MotionBox variants={staggerItem} custom={4} className="w-full" {...hoverLift}>
        <Card variant="analytics" padding="lg">
          <CardHeader>
            <Flex between>
              <Flex column gap={1}>
                <Flex align="center" gap={2}>
                  <CardTitle>Events by Type (30d)</CardTitle>
                  <SectionGuide
                    title="Events by Type"
                    description="Breakdown of all analytics events recorded in the last 30 days, grouped by type. Each event is triggered by a user action on Unool."
                    example="profile_view — 8,400 (user visited /u/username)\nlink_click — 3,200 (clicked a bio link)\npost_publish — 210 (scheduled post went live)"
                  />
                </Flex>
                <CardDescription>Distribution of analytics events</CardDescription>
              </Flex>
            </Flex>
          </CardHeader>
          <CardContent>
            <Flex column gap={3}>
              {Object.entries(analytics.eventsByType).length > 0 ? (
                Object.entries(analytics.eventsByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <Flex key={type} between className="items-center">
                      <Flex align="center" gap={2}>
                        <Badge variant="outline" size="sm">{type}</Badge>
                      </Flex>
                      <Flex align="center" gap={3}>
                        <Text weight="medium" className="w-16 text-right">{count.toLocaleString()}</Text>
                        <Box className="h-2 bg-muted rounded-full w-40 sm:w-64 md:w-80 overflow-hidden" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={Math.max(...Object.values(analytics.eventsByType))}>
                          <Box
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${(count / Math.max(...Object.values(analytics.eventsByType))) * 100}%` }}
                          />
                        </Box>
                      </Flex>
                    </Flex>
                  ))
              ) : (
                <Text color="muted" className="text-center py-8">No event data for the last 30 days</Text>
              )}
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Top Links & Top Profiles */}
      <Flex gap={6} style={{ flexWrap: 'wrap' }}>
        <MotionBox variants={staggerItem} custom={6} className="flex-1 min-w-[400px]" {...hoverLift}>
          <Card variant="analytics" padding="lg">
            <CardHeader>
              <Flex between>
                <Flex column gap={1}>
                  <Flex align="center" gap={2}>
                    <CardTitle>Top Links</CardTitle>
                    <SectionGuide
                      title="Top Links"
                      description="The 10 most-clicked links across all user profiles, ranked by total clicks in the last 30 days. Link type shows the category (website, instagram, twitter, etc.)."
                      example="Type: instagram\nURL: instagram.com/myshop\nClicks: 1,240"
                    />
                  </Flex>
                  <CardDescription>Most clicked links across all profiles</CardDescription>
                </Flex>
              </Flex>
            </CardHeader>
            <CardContent>
              {analytics.topLinks.length > 0 ? (
                <Box className="space-y-3">
                  {analytics.topLinks.slice(0, 10).map((link, index) => (
                    <Box
                      key={`${link.linkType}-${link.url}-${link.profileId || index}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Flex align="center" gap={3} className="min-w-0 flex-1">
                        <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Box>
                        <Box className="min-w-0 flex-1">
                          <Flex align="center" gap={2} className="flex-wrap">
                            <Text weight="medium" size="sm" className="truncate max-w-[260px]">
                              {link.title || link.url.replace(/^https?:\/\//i, '')}
                            </Text>
                            <Badge variant="outline" size="sm" className="capitalize text-[10px] px-1.5 py-0">
                              {link.linkType}
                            </Badge>
                          </Flex>

                          {/* Profile attribution */}
                          <Flex align="center" gap={1.5} className="mt-1">
                            {link.profileId && (
                              <Avatar className="h-4 w-4">
                                <AvatarImage
                                  src={link.profileAvatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${link.profileId}`}
                                  alt={link.profileName || 'Profile'}
                                />
                                <AvatarFallback className="text-[9px]">
                                  {(link.profileName || 'P').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <Text size="xs" color="muted" className="truncate font-mono">
                              {link.profileName ? (
                                link.profileSubdomain ? (
                                  <a
                                    href={`/u/${link.profileSubdomain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline text-foreground/80 hover:text-foreground inline-flex items-center gap-1"
                                    title={`View public profile /u/${link.profileSubdomain}`}
                                  >
                                    <span>{link.profileName}</span>
                                    <span className="text-muted-foreground">(@{link.profileSubdomain})</span>
                                  </a>
                                ) : (
                                  <span>{link.profileName}</span>
                                )
                              ) : (
                                <span className="truncate">{link.url}</span>
                              )}
                            </Text>
                          </Flex>
                        </Box>
                      </Flex>
                      <Flex align="center" gap={2} className="shrink-0 ml-3">
                        <Badge variant="secondary" size="sm">
                          {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" title={`Open ${link.url}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Text color="muted" className="text-center py-8">No link click data available yet</Text>
              )}
            </CardContent>
          </Card>
        </MotionBox>

        <MotionBox variants={staggerItem} custom={7} className="flex-1 min-w-[400px]" {...hoverLift}>
          <Card variant="analytics" padding="lg">
            <CardHeader>
              <Flex between>
                <Flex column gap={1}>
                  <Flex align="center" gap={2}>
                    <CardTitle>Top Profiles</CardTitle>
                    <SectionGuide
                      title="Top Profiles"
                      description="The 10 most-visited public profile pages (unool.co/u/username) in the last 30 days. High view counts indicate active creators or viral content."
                      example="Profile: Priya Sharma\nViews: 3,400 in 30d\nProfile ID: abc12345"
                    />
                  </Flex>
                  <CardDescription>Most viewed profiles</CardDescription>
                </Flex>
              </Flex>
            </CardHeader>
            <CardContent>
              {analytics.topProfiles.length > 0 ? (
                <Box className="space-y-3">
                  {analytics.topProfiles.slice(0, 10).map((profile, index) => (
                    <Box key={`${profile.profileId}-${index}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Flex align="center" gap={3} className="min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={profile.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.profileId}`}
                            alt={profile.name}
                          />
                          <AvatarFallback>{(profile.name || 'P').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Box className="min-w-0">
                          <Flex align="center" gap={1.5}>
                            <Text weight="medium" size="sm" className="truncate">{profile.name}</Text>
                            {profile.subdomain && (
                              <a
                                href={`/u/${profile.subdomain}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-muted-foreground hover:text-foreground inline-flex items-center"
                                title={`Open public profile /u/${profile.subdomain}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </Flex>
                          <Text size="xs" color="muted" className="truncate font-mono" title={profile.profileId}>
                            {profile.subdomain ? `@${profile.subdomain} • ` : ''}ID: {profile.profileId.substring(0, 8)}...
                          </Text>
                        </Box>
                      </Flex>
                      <Badge variant="secondary" size="sm">{profile.views} views</Badge>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Text color="muted" className="text-center py-8">No profile view data available yet</Text>
              )}
            </CardContent>
          </Card>
        </MotionBox>
      </Flex>

      {/* Deleted & Suspended Profiles (Recovery) */}
      <MotionBox variants={staggerItem} custom={7} className="w-full" {...hoverLift}>
        <Card variant="analytics" padding="lg">
          <CardHeader>
            <Flex between className="items-center flex-wrap gap-2">
              <Flex column gap={1}>
                <Flex align="center" gap={2}>
                  <CardTitle>Deleted & Suspended Profiles</CardTitle>
                  <SectionGuide
                    title="Profile & Account Recovery"
                    description="Profiles that were soft-deleted or users that were suspended. Admins can restore them with one click using the Recover button."
                    example="Deleted: @priya (subdomain preserved)\nSuspended: raj@agency.co (login locked)\nClick Recover to restore."
                  />
                  {recoveryItems.length > 0 && (
                    <Badge variant="destructive" size="sm" className="font-mono">
                      {recoveryItems.length} requiring action
                    </Badge>
                  )}
                </Flex>
                <CardDescription>
                  Manage and restore creator accounts and deleted profiles
                </CardDescription>
              </Flex>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/recovery">
                  View Recovery Center <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </Flex>
          </CardHeader>
          <CardContent>
            {recoveryItems.length > 0 ? (
              <Box className="space-y-3">
                {recoveryItems.slice(0, 5).map((item) => {
                  const isRecovering = recoveringId === item.id;
                  return (
                    <Box
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-muted/50"
                    >
                      <Flex align="center" gap={3} className="min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage
                            src={
                              item.avatarUrl ||
                              `https://api.dicebear.com/7.x/identicon/svg?seed=${item.profileId || item.userId}`
                            }
                            alt={item.name || item.email}
                          />
                          <AvatarFallback>
                            {(item.name || item.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Box className="min-w-0">
                          <Flex align="center" gap={2} className="flex-wrap">
                            <Text weight="medium" size="sm" className="truncate">
                              {item.name || item.email}
                            </Text>
                            {item.subdomain && (
                              <Badge variant="outline" size="sm" className="font-mono text-[10px] px-1.5 py-0">
                                @{item.subdomain}
                              </Badge>
                            )}
                            {item.type === 'deleted' ? (
                              <Badge
                                variant="outline"
                                size="sm"
                                className="border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 text-[10px] px-1.5 py-0 gap-1"
                              >
                                <Trash2 className="h-2.5 w-2.5" /> Deleted
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                size="sm"
                                className="border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 text-[10px] px-1.5 py-0 gap-1"
                              >
                                <Ban className="h-2.5 w-2.5" /> Suspended
                              </Badge>
                            )}
                          </Flex>
                          <Text size="xs" color="muted" className="truncate mt-0.5">
                            {item.email} • {new Date(item.timestamp).toLocaleDateString()}
                          </Text>
                        </Box>
                      </Flex>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isRecovering}
                        onClick={() => handleDashboardRecover(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 gap-1.5 h-8 text-xs font-medium shrink-0 ml-3"
                        title={`Recover ${item.name || item.email}`}
                      >
                        <RotateCcw className={isRecovering ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
                        <span>{isRecovering ? 'Recovering...' : 'Recover'}</span>
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Flex align="center" gap={3} className="p-4 rounded-xl bg-muted/30 border border-muted">
                <Box className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </Box>
                <Box>
                  <Text size="sm" weight="medium">
                    No Deleted or Suspended Profiles
                  </Text>
                  <Text size="xs" color="muted">
                    All creator accounts and public profiles are active in good standing. Any profile marked deleted or user suspended by an admin can be recovered directly from this section.
                  </Text>
                </Box>
              </Flex>
            )}
          </CardContent>
        </Card>
      </MotionBox>

      {/* Recent Workspaces & Users */}
      <Flex gap={6} style={{ flexWrap: 'wrap' }}>
        <MotionBox variants={staggerItem} custom={8} className="flex-1 min-w-[400px]" {...hoverLift}>
          <Card variant="analytics" padding="lg">
            <CardHeader>
              <Flex between>
                <Flex column gap={1}>
                  <Flex align="center" gap={2}>
                    <CardTitle>Recent Workspaces</CardTitle>
                    <SectionGuide
                      title="Recent Workspaces"
                      description="The 5 most recently created workspaces. Each workspace has a plan (spark/creator/pro/studio), member count, posts published this month, and connected social profiles."
                      example="Name: Pixel Studio\nPlan: creator  |  Status: active\nMembers: 3  |  Posts: 12  |  Profiles: 4"
                    />
                  </Flex>
                  <CardDescription>Latest workspaces created</CardDescription>
                </Flex>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/workspaces">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </Flex>
            </CardHeader>
            <CardContent>
              {workspaces.data.length > 0 ? (
                <Box className="space-y-3">
                  {workspaces.data.map((ws) => (
                    <Box key={ws.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Flex align="center" gap={3} className="min-w-0">
                        <Box className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </Box>
                        <Box className="min-w-0">
                          <Text weight="medium" className="truncate">{ws.name}</Text>
                          <Flex gap={2} style={{ flexWrap: 'wrap' }}>
                            <PlanBadge plan={ws.plan} />
                            <PlanStatusBadge status={ws.planStatus} />
                          </Flex>
                        </Box>
                      </Flex>
                      <Flex gap={4} className="text-sm text-muted-foreground shrink-0">
                        <span>{ws.memberCount} members</span>
                        <span>{ws.postsThisMonth} posts</span>
                        <span>{ws.profileCount} profiles</span>
                      </Flex>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Text color="muted" className="text-center py-8">No workspaces found</Text>
              )}
            </CardContent>
          </Card>
        </MotionBox>

        <MotionBox variants={staggerItem} custom={9} className="flex-1 min-w-[400px]" {...hoverLift}>
          <Card variant="analytics" padding="lg">
            <CardHeader>
              <Flex between>
                <Flex column gap={1}>
                  <Flex align="center" gap={2}>
                    <CardTitle>Recent Users</CardTitle>
                    <SectionGuide
                      title="Recent Users"
                      description="The 5 most recently registered users via Supabase Auth. Each shows their email, number of workspaces they belong to, and their current plan tier."
                      example="Email: priya@gmail.com\nWorkspaces: 1  |  Plan: creator\nJoined: Oct 28, 2026"
                    />
                  </Flex>
                  <CardDescription>Latest user registrations</CardDescription>
                </Flex>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/users">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </Flex>
            </CardHeader>
            <CardContent>
              {users.data.length > 0 ? (
                <Box className="space-y-3">
                  {users.data.map((user) => (
                    <Box key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Flex align="center" gap={3} className="min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`} alt={user.email} />
                          <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Box className="min-w-0">
                          <Text weight="medium" className="truncate">{user.email}</Text>
                          <Flex gap={2} style={{ flexWrap: 'wrap' }}>
                            <Badge variant="outline" size="sm">{user.workspaceCount} workspaces</Badge>
                            <PlanBadge plan={user.plan} />
                          </Flex>
                        </Box>
                      </Flex>
                      <Text size="sm" color="muted" className="shrink-0">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Text>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Text color="muted" className="text-center py-8">No users found</Text>
              )}
            </CardContent>
          </Card>
        </MotionBox>
      </Flex>

      {/* Plans Overview */}
      <MotionBox variants={staggerItem} custom={10} className="mt-6" {...hoverLift}>
        <Card variant="analytics" padding="lg">
          <CardHeader>
            <Flex between>
              <Flex column gap={1}>
                <Flex align="center" gap={2}>
                  <CardTitle>Pricing Plans</CardTitle>
                  <SectionGuide
                    title="Pricing Plans"
                    description="The subscription tiers available on Unool. Prices are stored in USD. Limits define what users on each plan can do (profiles, posts/month, team members, etc.)."
                    example="spark — ₹0/mo (free, 1 profile, 10 posts)\ncreator — ₹499/mo (3 profiles, 60 posts)\npro — ₹999/mo (10 profiles, unlimited)\nstudio — ₹2499/mo (team features)"
                  />
                </Flex>
                <CardDescription>Manage your subscription tiers</CardDescription>
              </Flex>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/plans">Manage Plans <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </Flex>
          </CardHeader>
          <CardContent>
            <Flex gap={4} style={{ flexWrap: 'wrap' }}>
              {plans.slice(0, 4).map((plan) => (
                <Box key={plan.id} className="flex-1 min-w-[200px]">
                  <Card variant="pricing" padding="md">
                    <CardContent className="space-y-3">
                      <Flex between>
                        <Flex column gap={1}>
                          <Text size="sm" weight="medium" color="primary">{plan.name}</Text>
                          <Flex alignItems="baseline" gap={1}>
                            <Text size="2xl" weight="bold" color="foreground">${plan.priceMonthlyUsd}</Text>
                            <Text size="sm" color="muted">/month</Text>
                          </Flex>
                        </Flex>
                        {plan.isActive ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">Inactive</Badge>
                        )}
                      </Flex>
                      <Text size="sm" color="muted" className="line-clamp-2">{plan.description || 'No description'}</Text>
                      <Flex column gap={2}>
                        {Object.entries(plan.limits).slice(0, 4).map(([key, value]) => (
                          <Flex key={key} gap={2} align="center">
                            <Text size="xs" color="muted" className="w-24 truncate">{key}</Text>
                            <Text size="xs" weight="medium" color="foreground">{typeof value === 'number' ? value.toLocaleString() : String(value)}</Text>
                          </Flex>
                        ))}
                      </Flex>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/admin/plans">Manage Plans</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              ))}
              {plans.length === 0 && (
                <Text color="muted" className="text-center py-8 w-full">No plans configured yet</Text>
              )}
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Interactive User Plan Distribution Modal */}
      <UserPlanDistributionModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        initialBreakdown={analytics.userBreakdown}
      />
    </Box>
  );
}

function PlanStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    trialing: { variant: 'default', label: 'Trial' },
    past_due: { variant: 'warning', label: 'Past Due' },
    canceled: { variant: 'destructive', label: 'Canceled' },
    paused: { variant: 'outline', label: 'Paused' },
    free: { variant: 'outline', label: 'Free' },
  };

  const config = statusConfig[status] || { variant: 'outline', label: status };
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

function PlanBadge({ plan }: { plan: string }) {
  const planColors: Record<string, string> = {
    spark: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    creator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    studio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <Badge variant="outline" className={planColors[plan] || 'bg-muted text-muted-foreground'} size="sm">
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  );
}
