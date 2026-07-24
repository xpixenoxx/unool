'use client';

import * as React from 'react';
import { Loader2, Calendar, Download, BarChart3, TrendingUp, TrendingDown, Eye, MousePointerClick, Link2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Box,
  Flex,
  Text,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Progress,
} from '@/components/ui';
import { MotionBox, MotionStack, hoverLift, staggerItem } from '@/components/ui/motion';

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

function DashboardStats({ analytics }: { analytics: AnalyticsSummary }) {
  const stats = [
    { label: 'Profile Views (30d)', value: analytics.totalProfileViews.toLocaleString(), change: '+12%', trend: 'up' as const, icon: <Eye className="h-5 w-5" />, color: 'text-blue-600' },
    { label: 'Link Clicks (30d)', value: analytics.totalLinkClicks.toLocaleString(), change: '+8%', trend: 'up' as const, icon: <MousePointerClick className="h-5 w-5" />, color: 'text-green-600' },
    { label: 'Posts Published (30d)', value: analytics.totalPostsPublished.toLocaleString(), change: '+23%', trend: 'up' as const, icon: <BarChart3 className="h-5 w-5" />, color: 'text-purple-600' },
    { label: 'Active Workspaces', value: analytics.totalWorkspaces.toLocaleString(), change: '+5%', trend: 'up' as const, icon: <Link2 className="h-5 w-5" />, color: 'text-orange-600' },
  ];

  return (
    <Box className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <MotionBox key={stat.label} variants={staggerItem} custom={index} {...hoverLift}>
          <Card variant="metric" padding="lg">
            <CardContent className="space-y-3">
              <Flex between className="pt-1">
                <Text size="sm" weight="medium" color="muted">{stat.label}</Text>
                <Box className={`flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ${stat.color}`}>{stat.icon}</Box>
              </Flex>
              <Flex alignItems="baseline" gap={2}>
                <Text size="3xl" weight="bold" color="foreground">{stat.value}</Text>
                <Badge variant={stat.trend === 'up' ? 'success' : 'destructive'} className="text-xs gap-1">
                  {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </Badge>
              </Flex>
            </CardContent>
          </Card>
        </MotionBox>
      ))}
    </Box>
  );
}

function EventsChart({ eventsLast30Days }: { eventsLast30Days: Array<{ date: string; count: number }> }) {
  if (!eventsLast30Days.length) {
    return <Text color="muted" className="text-center py-8">No event data available</Text>;
  }

  const maxCount = Math.max(...eventsLast30Days.map(e => e.count));
  const points = eventsLast30Days.map((d, i) => {
    const x = (i / (eventsLast30Days.length - 1 || 1)) * 400;
    const y = 160 - (d.count / (maxCount || 1)) * 140;
    return { x, y, date: d.date, count: d.count };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

  return (
    <Box className="h-48 relative">
      <svg viewBox="0 0 400 180" className="w-full h-full" role="img" aria-label="Events over time chart">
        <defs>
          <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#eventsGradient)" />
        <path d={linePath} stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--background)" stroke="var(--primary)" strokeWidth="2" />
        ))}
      </svg>
    </Box>
  );
}

function EventTypeBreakdown({ eventsByType }: { eventsByType: Record<string, number> }) {
  const total = Object.values(eventsByType).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(eventsByType).sort(([, a], [, b]) => b - a);

  return (
    <Box className="space-y-4">
      {sorted.map(([type, count]) => (
        <Box key={type} className="space-y-2">
          <Flex between>
            <Badge variant="outline" size="sm">{type.replace(/_/g, ' ')}</Badge>
            <Text weight="medium" color="foreground">{count.toLocaleString()}</Text>
          </Flex>
          <Progress value={count} max={total || 1} className="h-1.5" />
        </Box>
      ))}
    </Box>
  );
}

function TopLinksTable({ topLinks }: { topLinks: Array<{ linkType: string; url: string; clicks: number }> }) {
  if (!topLinks.length) {
    return <Text color="muted" className="text-center py-8">No link click data available</Text>;
  }

  return (
    <Box className="space-y-3">
      {topLinks.slice(0, 10).map((link, index) => (
        <Box key={`${link.linkType}-${link.url}-${index}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <Flex align="center" gap={3} className="min-w-0">
            <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Link2 className="h-4 w-4" />
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
  );
}

function TopProfilesTable({ topProfiles }: { topProfiles: Array<{ profileId: string; name: string; views: number }> }) {
  if (!topProfiles.length) {
    return <Text color="muted" className="text-center py-8">No profile view data available</Text>;
  }

  return (
    <Box className="space-y-3">
      {topProfiles.slice(0, 10).map((profile, index) => (
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
  );
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = React.useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [days, setDays] = React.useState(30);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [days]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !analytics) {
    return (
      <MotionBox variant="fade">
        <Box className="space-y-6">
          <Flex between>
            <Box>
              <Text size="3xl" weight="bold">Analytics</Text>
              <Text color="muted">Detailed platform analytics and insights</Text>
            </Box>
            <Flex gap={3} className="items-center">
              <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild variant="outline"><a href="/admin/analytics/export">Export <Download className="ml-2 h-4 w-4" /></a></Button>
            </Flex>
          </Flex>
          <Card variant="default" padding="lg">
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </Box>
      </MotionBox>
    );
  }

  if (error) {
    return (
      <Card variant="error" padding="md">
        <CardContent className="flex items-center justify-between">
          <Text color="destructive">Error: {error}</Text>
          <Button variant="ghost" size="sm" onClick={fetchAnalytics}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <MotionBox variant="fade" className="space-y-6">
      <Flex between className="flex-wrap gap-4">
        <Box>
          <Text size="3xl" weight="bold">Analytics</Text>
          <Text color="muted">Detailed platform analytics and insights</Text>
        </Box>
        <Flex gap={3} className="items-center">
          <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="outline"><a href="/admin/analytics/export">Export <Download className="ml-2 h-4 w-4" /></a></Button>
        </Flex>
      </Flex>

      {analytics && (
        <>
          <DashboardStats analytics={analytics} />

          <Flex gap={6} style={{ flexWrap: 'wrap' }}>
            <MotionBox variants={staggerItem} custom={4} className="flex-1 min-w-[400px]" {...hoverLift}>
              <Card variant="analytics" padding="lg">
                <CardHeader>
                  <Flex between>
                    <Flex column gap={1}>
                      <CardTitle>Events Over Time</CardTitle>
                      <CardDescription>Daily event volume (last {days} days)</CardDescription>
                    </Flex>
                  </Flex>
                </CardHeader>
                <CardContent>
                  <EventsChart eventsLast30Days={analytics.eventsLast30Days} />
                </CardContent>
              </Card>
            </MotionBox>

            <MotionBox variants={staggerItem} custom={5} className="flex-1 min-w-[350px]" {...hoverLift}>
              <Card variant="analytics" padding="lg">
                <CardHeader>
                  <Flex between>
                    <Flex column gap={1}>
                      <CardTitle>Event Types</CardTitle>
                      <CardDescription>Breakdown of analytics events</CardDescription>
                    </Flex>
                  </Flex>
                </CardHeader>
                <CardContent>
                  <EventTypeBreakdown eventsByType={analytics.eventsByType} />
                </CardContent>
              </Card>
            </MotionBox>
          </Flex>

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
                  <TopLinksTable topLinks={analytics.topLinks} />
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
                  <TopProfilesTable topProfiles={analytics.topProfiles} />
                </CardContent>
              </Card>
            </MotionBox>
          </Flex>
        </>
      )}
    </MotionBox>
  );
}