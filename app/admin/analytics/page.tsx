'use client';

import * as React from 'react';
import {
  Loader2,
  Download,
  BarChart3,
  Eye,
  MousePointerClick,
  Link2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

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
    userId?: string | null;
    userEmail?: string | null;
    name: string;
    views: number;
    subdomain?: string | null;
    avatarUrl?: string | null;
    handle?: string | null;
  }>;
}

function DashboardStats({ analytics, days }: { analytics: AnalyticsSummary; days: number }) {
  const stats = [
    {
      label: `OneLink Visits (${days}d)`,
      value: analytics.totalProfileViews.toLocaleString(),
      icon: <Eye className="h-5 w-5" />,
      color: 'text-blue-600',
      description: 'Total visits to public OneLink pages (/u/username) in the selected timeframe.',
    },
    {
      label: `Link Clicks (${days}d)`,
      value: analytics.totalLinkClicks.toLocaleString(),
      icon: <MousePointerClick className="h-5 w-5" />,
      color: 'text-green-600',
      description: 'Clicks recorded on links displayed on user bio profiles in the selected timeframe.',
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
          example={`OneLink Visits (${days}d): 14,250\nLink Clicks (${days}d): 4,890\nPosts Published: 312\nActive Workspaces: 85`}
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

function TopLinksTable({ topLinks }: { topLinks: Array<{
  linkType: string;
  url: string;
  clicks: number;
  title?: string | null;
  profileId?: string | null;
  profileName?: string | null;
  profileSubdomain?: string | null;
  profileAvatarUrl?: string | null;
}> }) {
  if (!topLinks.length) {
    return <Text color="muted" className="text-center py-8">No link click data available</Text>;
  }

  return (
    <Box className="space-y-3">
      {topLinks.slice(0, 10).map((link, index) => (
        <Box
          key={`${link.linkType}-${link.url}-${link.profileId || index}`}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Flex align="center" gap={3} className="min-w-0 flex-1">
            <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Link2 className="h-4 w-4" />
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
  );
}

function TopOneLinksTable({ topProfiles }: {
  topProfiles: Array<{
    profileId: string;
    userId?: string | null;
    userEmail?: string | null;
    name: string;
    views: number;
    subdomain?: string | null;
    avatarUrl?: string | null;
    handle?: string | null;
  }>;
}) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!topProfiles.length) {
    return <Text color="muted" className="text-center py-8">No OneLink visit data available in this timeframe</Text>;
  }

  const list = topProfiles.slice(0, 20);

  return (
    <Box className="overflow-x-auto">
      <table className="w-full text-left" role="table">
        <thead>
          <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <th className="h-10 px-4 w-12 text-center">#</th>
            <th className="h-10 px-4">Creator / Name</th>
            <th className="h-10 px-4">User Email</th>
            <th className="h-10 px-4">User ID</th>
            <th className="h-10 px-4">OneLink URL</th>
            <th className="h-10 px-4 text-right">Total Visits</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {list.map((profile, index) => (
            <tr key={`${profile.profileId}-${index}`} className="hover:bg-muted/40 transition-colors">
              <td className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                {index + 1}
              </td>
              <td className="px-4 py-3">
                <Flex align="center" gap={2.5}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.profileId}`}
                      alt={profile.name}
                    />
                    <AvatarFallback className="text-xs">
                      {(profile.name || 'P').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Box className="min-w-0">
                    <Text weight="medium" size="sm" className="truncate">{profile.name}</Text>
                    {profile.subdomain && (
                      <Text size="xs" color="muted" className="font-mono">@{profile.subdomain}</Text>
                    )}
                  </Box>
                </Flex>
              </td>
              <td className="px-4 py-3">
                {profile.userEmail ? (
                  <Text size="sm" weight="medium" className="text-foreground">{profile.userEmail}</Text>
                ) : (
                  <Text size="xs" color="muted" className="italic">Not found</Text>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {profile.userId ? (
                  <Flex align="center" gap={1.5}>
                    <Text size="xs" color="muted" className="font-mono truncate max-w-[200px]" title={profile.userId}>
                      {profile.userId}
                    </Text>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(profile.userId || '', profile.profileId)}
                      title="Copy User ID"
                    >
                      {copiedId === profile.profileId ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </Flex>
                ) : (
                  <Text size="xs" color="muted" className="italic">N/A</Text>
                )}
              </td>
              <td className="px-4 py-3">
                {profile.subdomain ? (
                  <a
                    href={`/u/${profile.subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                    title={`Open unool.co/u/${profile.subdomain}`}
                  >
                    <span>/u/{profile.subdomain}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Badge variant="secondary" size="sm" className="font-semibold text-xs">
                  {profile.views.toLocaleString()} {profile.views === 1 ? 'visit' : 'visits'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

let cachedAnalyticsMap: Record<number, AnalyticsSummary> = {};

export default function AdminAnalyticsPage() {
  const [days, setDays] = React.useState(30);
  const [analytics, setAnalytics] = React.useState<AnalyticsSummary | null>(cachedAnalyticsMap[30] || null);
  const [loading, setLoading] = React.useState(!cachedAnalyticsMap[30]);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    if (!cachedAnalyticsMap[days]) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalytics(data);
      cachedAnalyticsMap[days] = data;
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
    csv += `Summary,OneLink Visits (${days}d),${analytics.totalProfileViews}\n`;
    csv += `Summary,Link Clicks (${days}d),${analytics.totalLinkClicks}\n`;
    csv += `Summary,Posts Published (${days}d),${analytics.totalPostsPublished}\n`;
    csv += `Summary,Total Workspaces,${analytics.totalWorkspaces}\n`;
    csv += `Summary,Total Users,${analytics.totalUsers}\n\n`;

    csv += `Event Types,Type,Count\n`;
    Object.entries(analytics.eventsByType).forEach(([k, v]) => {
      csv += `Event Types,"${k}",${v}\n`;
    });
    csv += `\n`;

    csv += `Top Links,URL,Type,Label,Profile Name,Subdomain,Profile ID,Clicks\n`;
    analytics.topLinks.forEach((l) => {
      csv += `Top Links,"${l.url}","${l.linkType}","${l.title || ''}","${l.profileName || ''}","${l.profileSubdomain || ''}","${l.profileId || ''}",${l.clicks}\n`;
    });
    csv += `\n`;

    csv += `Top 20 OneLinks Visited,Rank,User ID,User Email,Creator Name,Subdomain,OneLink URL,Profile ID,Visits\n`;
    analytics.topProfiles.slice(0, 20).forEach((p, index) => {
      csv += `Top 20 OneLinks Visited,${index + 1},"${p.userId || ''}","${p.userEmail || ''}","${p.name}","${p.subdomain || ''}","${p.subdomain ? `/u/${p.subdomain}` : ''}","${p.profileId}",${p.views}\n`;
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

          {/* Event Breakdown and Top Links Row */}
          <Flex gap={6} style={{ flexWrap: 'wrap' }}>
            <MotionBox variants={staggerItem} custom={4} className="flex-1 min-w-[350px]" {...hoverLift}>
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

            <MotionBox variants={staggerItem} custom={5} className="flex-1 min-w-[400px]" {...hoverLift}>
              <Card variant="analytics" padding="lg">
                <CardHeader>
                  <Flex between>
                    <Flex column gap={1}>
                      <Flex align="center" gap={2}>
                        <CardTitle>Top Bio Links</CardTitle>
                        <SectionGuide
                          title="Top Bio Links"
                          description="Bio links with the highest engagement across all user profiles in the platform."
                          example="Type: instagram\nURL: https://instagram.com/mybrand\nClicks: 1,420"
                        />
                      </Flex>
                      <CardDescription>Most clicked links across all OneLink profiles</CardDescription>
                    </Flex>
                  </Flex>
                </CardHeader>
                <CardContent>
                  <TopLinksTable topLinks={analytics.topLinks} />
                </CardContent>
              </Card>
            </MotionBox>
          </Flex>

          {/* Top 20 OneLinks Visited (User IDs, Names, Email IDs, Visits) */}
          <MotionBox variants={staggerItem} custom={6} {...hoverLift}>
            <Card variant="default" padding="none">
              <CardHeader className="px-6 py-4 border-b">
                <Flex between className="flex-wrap gap-4 items-center">
                  <Flex column gap={1}>
                    <Flex align="center" gap={2}>
                      <CardTitle>Top 20 Most Visited OneLinks</CardTitle>
                      <SectionGuide
                        title="Top 20 OneLinks Visited"
                        description="Creators whose OneLink public bio pages (/u/username) received the highest unique visits and page views."
                        example="User: John Doe (john@example.com)\nUser ID: e81355e-962f-4c64-9811-...\nOneLink: /u/johndoe\nVisits: 2,450"
                      />
                    </Flex>
                    <CardDescription>Top 20 creators ranked by OneLink profile visits (last {days} days)</CardDescription>
                  </Flex>
                  <Badge variant="outline" size="sm">
                    Top 20 Ranking
                  </Badge>
                </Flex>
              </CardHeader>
              <CardContent className="p-0">
                <TopOneLinksTable topProfiles={analytics.topProfiles} />
              </CardContent>
            </Card>
          </MotionBox>
        </>
      )}
    </MotionBox>
  );
}
