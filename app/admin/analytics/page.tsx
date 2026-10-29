'use client';

import * as React from 'react';
import { Loader2, Download, BarChart3, Eye, MousePointerClick, Link2, ExternalLink } from 'lucide-react';

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
import { MotionBox, hoverLift, staggerItem } from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';

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

function DashboardStats({ analytics, days }: { analytics: AnalyticsSummary; days: number }) {
  const stats = [
    {
      label: `Profile Views (${days}d)`,
      value: analytics.totalProfileViews.toLocaleString(),
      icon: <Eye className="h-5 w-5" />,
      color: 'text-blue-600',
      description: 'Total visits to public profile pages (/u/username) in the selected time window.',
    },
    {
      label: `Link Clicks (${days}d)`,
      value: analytics.totalLinkClicks.toLocaleString(),
      icon: <MousePointerClick className="h-5 w-5" />,
      color: 'text-green-600',
      description: 'Clicks recorded on links displayed on user bio profiles in the selected time window.',
    },
    {
      label: `Posts Published (${days}d)`,
      value: analytics.totalPostsPublished.toLocaleString(),
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'text-purple-600',
      description: 'Scheduled posts that were successfully dispatched to connected social networks.',
    },
    {
      label: 'Active Workspaces',
      value: analytics.totalWorkspaces.toLocaleString(),
      icon: <Link2 className="h-5 w-5" />,
      color: 'text-orange-600',
      description: 'Total active workspaces currently configured on the platform.',
    },
  ];

  return (
    <Box className="space-y-3">
      <Flex align="center" gap={2}>
        <Text size="sm" weight="semibold" color="muted" className="uppercase tracking-wide">Key Metrics</Text>
        <SectionGuide
          title="Analytics Overview"
          description="Live metrics computed directly from event log aggregations. No interpolated or simulated data."
          example={`Profile Views (${days}d): 14,250\nLink Clicks (${days}d): 4,890\nPosts Published: 312\nActive Workspaces: 85`}
        />
      </Flex>
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
                </Flex>
                <Text size="xs" color="muted" className="line-clamp-1">{stat.description}</Text>
              </CardContent>
            </Card>
          </MotionBox>
        ))}
      </Box>
    </Box>
  );
}

function EventsChart({ eventsLast30Days }: { eventsLast30Days: Array<{ date: string; count: number }> }) {
  if (!eventsLast30Days.length) {
    return <Text color="muted" className="text-center py-8">No event data available in this timeframe</Text>;
  }

  const maxCount = Math.max(...eventsLast30Days.map(e => e.count), 1);
  const points = eventsLast30Days.map((d, i) => {
    const x = (i / (eventsLast30Days.length - 1 || 1)) * 400;
    const y = 160 - (d.count / maxCount) * 140;
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
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--background)" stroke="var(--primary)" strokeWidth="2" />
        ))}
      </svg>
    </Box>
  );
}

function EventTypeBreakdown({ eventsByType }: { eventsByType: Record<string, number> }) {
  const total = Object.values(eventsByType).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(eventsByType).sort(([, a], [, b]) => b - a);

  if (!sorted.length) {
    return <Text color="muted" className="text-center py-8">No event type data available</Text>;
  }

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

  const handleExportCsv = () => {
    if (!analytics) return;

    let csv = `Section,Key,Value\n`;
    csv += `Summary,Profile Views (${days}d),${analytics.totalProfileViews}\n`;
    csv += `Summary,Link Clicks (${days}d),${analytics.totalLinkClicks}\n`;
    csv += `Summary,Posts Published (${days}d),${analytics.totalPostsPublished}\n`;
    csv += `Summary,Total Workspaces,${analytics.totalWorkspaces}\n`;
    csv += `Summary,Total Users,${analytics.totalUsers}\n\n`;

    csv += `Event Types,Type,Count\n`;
    Object.entries(analytics.eventsByType).forEach(([k, v]) => {
      csv += `Event Types,"${k}",${v}\n`;
    });
    csv += `\n`;

    csv += `Top Links,Type,URL,Clicks\n`;
    analytics.topLinks.forEach((l) => {
      csv += `Top Links,"${l.linkType}","${l.url}",${l.clicks}\n`;
    });
    csv += `\n`;

    csv += `Top Profiles,Profile ID,Name,Views\n`;
    analytics.topProfiles.forEach((p) => {
      csv += `Top Profiles,"${p.profileId}","${p.name}",${p.views}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `unool-analytics-${days}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <Button variant="outline" onClick={handleExportCsv} disabled={!analytics}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </Flex>
      </Flex>

      {analytics && (
        <>
          <DashboardStats analytics={analytics} days={days} />

          <Flex gap={6} style={{ flexWrap: 'wrap' }}>
            <MotionBox variants={staggerItem} custom={4} className="flex-1 min-w-[400px]" {...hoverLift}>
              <Card variant="analytics" padding="lg">
                <CardHeader>
                  <Flex between>
                    <Flex column gap={1}>
                      <Flex align="center" gap={2}>
                        <CardTitle>Events Over Time</CardTitle>
                        <SectionGuide
                          title="Events Over Time"
                          description="Daily trend of total analytics events logged across the platform over the selected timeframe."
                          example="Displays daily peaks. For example, 1,200 events recorded on launch day, tapering to 350 daily baseline."
                        />
                      </Flex>
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
                      <Flex align="center" gap={2}>
                        <CardTitle>Event Types</CardTitle>
                        <SectionGuide
                          title="Event Types Breakdown"
                          description="Relative share of user interactions across all tracked channels (e.g., profile views, bio clicks, media downloads)."
                          example="profile_view: 68% (8,200)\nlink_click: 28% (3,400)\npost_publish: 4% (480)"
                        />
                      </Flex>
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
                      <Flex align="center" gap={2}>
                        <CardTitle>Top Links</CardTitle>
                        <SectionGuide
                          title="Top Links"
                          description="Bio links with the highest engagement across all user profiles in the platform."
                          example="Type: instagram\nURL: https://instagram.com/mybrand\nClicks: 1,420"
                        />
                      </Flex>
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
                      <Flex align="center" gap={2}>
                        <CardTitle>Top Profiles</CardTitle>
                        <SectionGuide
                          title="Top Profiles"
                          description="Public unool.co/u/username creator profiles with the highest unique traffic and visit count."
                          example="Name: Rohan Sharma\nProfile ID: rohan_dev\nViews: 5,420"
                        />
                      </Flex>
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
