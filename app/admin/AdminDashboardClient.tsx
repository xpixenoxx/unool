'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
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
  ArrowUp,
  ArrowDown,
  Activity,
  UserPlus,
  Building2,
  Users,
  Eye,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import {
  MotionBox,
  hoverLift,
  staggerItem,
} from '@/components/ui/motion';

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
  eventsByType: Record<string, number>;
  eventsLast30Days: Array<{ date: string; count: number }>;
  topLinks: Array<{ linkType: string; url: string; clicks: number }>;
  topProfiles: Array<{ profileId: string; name: string; views: number }>;
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
  const { analytics, workspaces, users, plans } = initialData;

  const metrics = [
    {
      label: 'Total Workspaces',
      value: analytics.totalWorkspaces.toLocaleString(),
      change: '+12%',
      changeType: 'increase' as const,
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      label: 'Total Users',
      value: analytics.totalUsers.toLocaleString(),
      change: '+8%',
      changeType: 'increase' as const,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: 'Profile Views (30d)',
      value: analytics.totalProfileViews.toLocaleString(),
      change: '+23%',
      changeType: 'increase' as const,
      icon: <Eye className="h-5 w-5" />,
    },
    {
      label: 'Link Clicks (30d)',
      value: analytics.totalLinkClicks.toLocaleString(),
      change: '+15%',
      changeType: 'increase' as const,
      icon: <ExternalLink className="h-5 w-5" />,
    },
  ];

  // Pre-compute SVG paths for activity chart
  const activityLinePath = React.useMemo(() => {
    if (!analytics.eventsLast30Days.length) return '';
    const maxCount = Math.max(...analytics.eventsLast30Days.map(e => e.count));
    return analytics.eventsLast30Days.map((d, i) => {
      const x = (i / Math.max(1, analytics.eventsLast30Days.length - 1)) * 400;
      const y = 180 - (d.count / (maxCount || 1)) * 160;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [analytics.eventsLast30Days]);

  const activityAreaPath = React.useMemo(() => {
    if (!activityLinePath) return '';
    return `${activityLinePath} L 400 180 L 0 180 Z`;
  }, [activityLinePath]);

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
        <Flex gap={3}>
          <Button variant="outline" asChild>
            <Link href="/admin/analytics"><Activity className="mr-2 h-4 w-4" /> Full Analytics</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/workspaces/new"><UserPlus className="mr-2 h-4 w-4" /> New Workspace</Link>
          </Button>
        </Flex>
      </Flex>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MotionBox variants={staggerItem} custom={index} key={metric.label} {...hoverLift}>
            <MetricCard
              value={metric.value}
              label={metric.label}
              change={metric.change}
              changeType={metric.changeType}
              icon={metric.icon}
              padding="lg"
            />
          </MotionBox>
        ))}
      </div>

      {/* Charts & Activity */}
      <Flex gap={6} style={{ flexWrap: 'wrap' }}>
        {/* Events by Type */}
        <MotionBox variants={staggerItem} custom={4} className="flex-1 min-w-[400px]" {...hoverLift}>
          <Card variant="analytics" padding="lg">
            <CardHeader>
              <Flex between>
                <Flex column gap={1}>
                  <CardTitle>Events by Type (30d)</CardTitle>
                  <CardDescription>Distribution of analytics events</CardDescription>
                </Flex>
              </Flex>
            </CardHeader>
            <CardContent>
              <Flex column gap={3}>
                {Object.entries(analytics.eventsByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <Flex key={type} between className="items-center">
                      <Flex align="center" gap={2}>
                        <Badge variant="outline" size="sm">{type}</Badge>
                      </Flex>
                      <Flex align="center" gap={2}>
                        <Text weight="medium" className="w-16 text-right">{count.toLocaleString()}</Text>
                        <Box className="h-2 bg-muted rounded-full flex-1 max-w-[200px]" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={Math.max(...Object.values(analytics.eventsByType))}>
                          <Box
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${(count / Math.max(...Object.values(analytics.eventsByType))) * 100}%` }}
                          />
                        </Box>
                      </Flex>
                    </Flex>
                  ))}
              </Flex>
            </CardContent>
          </Card>
        </MotionBox>

        {/* Events Over Time */}
        <MotionBox variants={staggerItem} custom={5} className="flex-1 min-w-[400px]" {...hoverLift}>
          <Card variant="analytics" padding="lg">
            <CardHeader>
              <Flex between>
                <Flex column gap={1}>
                  <CardTitle>Activity (Last 30 Days)</CardTitle>
                  <CardDescription>Daily event volume</CardDescription>
                </Flex>
              </Flex>
            </CardHeader>
            <CardContent>
              <Box className="h-48">
                <svg viewBox="0 0 400 180" className="w-full h-full" role="img" aria-label="Activity chart">
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {analytics.eventsLast30Days.length > 0 ? (
                    <>
                      <path
                        d={activityLinePath}
                        stroke="var(--primary)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={activityAreaPath}
                        fill="url(#activityGradient)"
                      />
                    </>
                  ) : null}
                </svg>
              </Box>
            </CardContent>
          </Card>
        </MotionBox>
      </Flex>

      {/* Top Links & Top Profiles */}
      <Flex gap={6} style={{ flexWrap: 'wrap' }}>
        <MotionBox variants={staggerItem} custom={6} className="flex-1 min-w-[400px]" {...hoverLift}>
          <Card variant="analytics" padding="lg">
            <CardHeader>
              <Flex between>
                <Flex column gap={1}>
                  <CardTitle>Top Links</CardTitle>
                  <CardDescription>Most clicked links across all profiles</CardDescription>
                </Flex>
              </Flex>
            </CardHeader>
            <CardContent>
              {analytics.topLinks.length > 0 ? (
                <Box className="space-y-3">
                  {analytics.topLinks.slice(0, 10).map((link, index) => (
                    <Box key={`${link.linkType}-${link.url}-${index}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Flex align="center" gap={3} className="min-w-0 flex-1">
                        <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Box>
                        <Box className="min-w-0">
                          <Text weight="medium" size="sm" className="truncate">{link.linkType}</Text>
                          <Text size="xs" color="muted" className="truncate font-mono">{link.url.length > 60 ? link.url.substring(0, 60) + '...' : link.url}</Text>
                        </Box>
                      </Flex>
                      <Flex align="center" gap={3} className="shrink-0">
                        <Badge variant="secondary" size="sm">{link.clicks} clicks</Badge>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a>
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Text color="muted" className="text-center py-8">No link click data available</Text>
              )}
            </CardContent>
          </Card>
        </MotionBox>

        <MotionBox variants={staggerItem} custom={7} className="flex-1 min-w-[400px]" {...hoverLift}>
          <Card variant="analytics" padding="lg">
            <CardHeader>
              <Flex between>
                <Flex column gap={1}>
                  <CardTitle>Top Profiles</CardTitle>
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
                          <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${profile.profileId}`} alt={profile.name} />
                          <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Box className="min-w-0">
                          <Text weight="medium" size="sm" className="truncate">{profile.name}</Text>
                          <Text size="xs" color="muted" className="truncate font-mono">{profile.profileId.substring(0, 8)}...</Text>
                        </Box>
                      </Flex>
                      <Badge variant="secondary" size="sm">{profile.views} views</Badge>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Text color="muted" className="text-center py-8">No profile view data available</Text>
              )}
            </CardContent>
          </Card>
        </MotionBox>
      </Flex>

      {/* Recent Workspaces & Users */}
      <Flex gap={6} style={{ flexWrap: 'wrap' }}>
        <MotionBox variants={staggerItem} custom={8} className="flex-1 min-w-[400px]" {...hoverLift}>
          <Card variant="analytics" padding="lg">
            <CardHeader>
              <Flex between>
                <Flex column gap={1}>
                  <CardTitle>Recent Workspaces</CardTitle>
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
                            <Badge variant="outline" size="sm">{ws.plan}</Badge>
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
                  <CardTitle>Recent Users</CardTitle>
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
                            <Badge variant="secondary" size="sm">{user.plan}</Badge>
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
                <CardTitle>Pricing Plans</CardTitle>
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
                        <Link href={`/admin/plans/${plan.id}`}>Edit Plan</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              ))}
              {plans.length === 0 && (
                <Text color="muted" className="text-center py-8 w-full">No plans configured</Text>
              )}
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>
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
    free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <Badge variant="outline" className={planColors[plan] || 'bg-muted text-muted-foreground'} size="sm">
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  );
}