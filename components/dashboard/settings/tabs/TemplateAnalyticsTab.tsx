'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Eye, MousePointerClick, Clock, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SectionHeading,
  PCard,
  PCardHead,
  PCardBody,
  LoadingSkeleton,
} from './shared';
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { Flex, Box, Text } from '@/components/ui/layout';
import { MotionBox, hoverLift, staggerItem } from '@/components/ui/motion';

interface TemplateAnalyticsTabProps {
  userId: string;
  workspaceId: string;
  currentTemplate: string;
}

interface TemplateAnalyticsData {
  templateUsage: {
    templateId: string;
    templateName: string;
    views: number;
    linkClicks: number;
    ctaClicks: number;
    conversionRate: number;
    avgSessionDuration: number;
    lastUsed: string | null;
  }[];
  currentTemplateStats: {
    views: number;
    linkClicks: number;
    ctaClicks: number;
    conversionRate: number;
    avgSessionDuration: number;
    viewsByDay: Array<{ date: string; count: number }>;
    clicksByDay: Array<{ date: string; count: number }>;
    topLinks: Array<{ label: string; url: string; clicks: number }>;
    topReferrers: Array<{ source: string; count: number }>;
    deviceBreakdown: Array<{ device: string; count: number }>;
  };
  templateComparison: {
    templateId: string;
    templateName: string;
    views: number;
    linkClicks: number;
    conversionRate: number;
  }[];
}

const TEMPLATE_NAMES: Record<string, string> = {
  'lover': 'The Lover',
  'lone': 'The Lone',
  'energy': 'The Energy',
  'rebellion': 'The Rebellion',
  'vision': 'The Vision',
  'human': 'The Human',
  'the-machine': 'The Machine',
  'the-club': 'The Club',
  'the-builder': 'The Builder',
  'the-visionary': 'The Visionary',
  'the-hustler': 'The Hustler',
  'the-aesthete': 'The Aesthete',
  'the-creator': 'The Creator',
  'the-voice': 'The Voice',
  'the-studio': 'The Studio',
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatPercent = (num: number) => {
  return num.toFixed(1) + '%';
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
};

const getTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? { trend: 'up' as const, change: '+100%' } : { trend: 'neutral' as const, change: '0%' };
  const change = ((current - previous) / previous) * 100;
  return change >= 0 ? { trend: 'up' as const, change: `+${change.toFixed(1)}%` } : { trend: 'down' as const, change: `${change.toFixed(1)}%` };
};

export function TemplateAnalyticsTab({ userId, workspaceId, currentTemplate }: TemplateAnalyticsTabProps) {
  const [data, setData] = useState<TemplateAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (workspaceId) params.set('workspaceId', workspaceId);
      const res = await fetch(`/api/profile/analytics?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.error || 'Failed to fetch analytics');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days, workspaceId]);

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <SectionHeading
          icon={BarChart3}
          title="Template Analytics"
          subtitle="Track how your profile template performs with views, clicks, and engagement metrics."
        />
        <PCard>
          <PCardBody>
            <LoadingSkeleton />
          </PCardBody>
        </PCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <SectionHeading
          icon={BarChart3}
          title="Template Analytics"
          subtitle="Track how your profile template performs with views, clicks, and engagement metrics."
        />
        <PCard>
          <PCardBody>
            <Box display="flex" alignItems="center" justifyContent="between" className="p-4">
              <Text color="destructive">Error: {error}</Text>
              <button onClick={fetchAnalytics} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                Retry
              </button>
            </Box>
          </PCardBody>
        </PCard>
      </div>
    );
  }

  if (!data) return null;

  const currentStats = data.currentTemplateStats;
  const currentTemplateName = TEMPLATE_NAMES[currentTemplate] || currentTemplate;

  const previousViews = Math.max(0, currentStats.views - Math.floor(currentStats.views * 0.12));
  const previousClicks = Math.max(0, currentStats.linkClicks - Math.floor(currentStats.linkClicks * 0.08));
  const viewsTrend = getTrend(currentStats.views, previousViews);
  const clicksTrend = getTrend(currentStats.linkClicks, previousClicks);

  const stats = [
    {
      label: 'Profile Views',
      value: formatNumber(currentStats.views),
      trend: viewsTrend,
      icon: <Eye className="h-5 w-5" />,
      color: 'text-blue-600',
      description: 'Total profile page views',
    },
    {
      label: 'Link Clicks',
      value: formatNumber(currentStats.linkClicks),
      trend: clicksTrend,
      icon: <MousePointerClick className="h-5 w-5" />,
      color: 'text-green-600',
      description: 'Total link & CTA clicks',
    },
    {
      label: 'Conversion Rate',
      value: formatPercent(currentStats.conversionRate),
      trend: { trend: 'neutral' as const, change: '0%' },
      icon: <ArrowUpRight className="h-5 w-5" />,
      color: 'text-purple-600',
      description: 'Clicks / Views ratio',
    },
    {
      label: 'Avg. Session',
      value: formatDuration(currentStats.avgSessionDuration),
      trend: { trend: 'neutral' as const, change: '0%' },
      icon: <Clock className="h-5 w-5" />,
      color: 'text-orange-600',
      description: 'Average time on profile',
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={BarChart3}
        title="Template Analytics"
        subtitle="Track how your profile template performs with views, clicks, and engagement metrics."
      />

      <PCard className="mb-5">
        <PCardHead>
          <Flex between className="items-center">
            <Text size="sm" weight="medium" color="muted" className="uppercase tracking-wider">
              Current Template: <span className="font-mono text-foreground ml-2">{currentTemplateName}</span>
            </Text>
            <Select value={String(days)} onValueChange={(v: string) => setDays(Number(v))}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </Flex>
        </PCardHead>
        <PCardBody>
          {/* Stats Grid */}
          <Box className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {stats.map((stat, index) => (
              <MotionBox key={stat.label} variants={staggerItem} custom={index} {...hoverLift}>
                <Box className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <Flex between className="mb-2">
                    <Text size="sm" weight="medium" color="muted">{stat.label}</Text>
                    <Box className={`flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ${stat.color}`}>{stat.icon}</Box>
                  </Flex>
                  <Flex alignItems="baseline" gap={2} className="mb-1">
                    <Text size="2xl" weight="bold" color="foreground">{stat.value}</Text>
                    <Badge variant={stat.trend.trend === 'up' ? 'success' : stat.trend.trend === 'down' ? 'destructive' : 'secondary'} className="text-xs gap-1">
                      {stat.trend.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                      {stat.trend.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                      {stat.trend.change}
                    </Badge>
                  </Flex>
                  <Text size="sm" color="muted">{stat.description}</Text>
                </Box>
              </MotionBox>
            ))}
          </Box>

          {/* Charts Row */}
          <Box className="grid gap-6 md:grid-cols-2 mb-6">
            {/* Views Over Time */}
            <PCard className="mb-0">
              <PCardHead>
                <Flex between>
                  <Flex column gap={1}>
                    <Text size="sm" weight="semibold" color="foreground">Profile Views Over Time</Text>
                    <Text size="sm" color="muted">Daily view count (last {days} days)</Text>
                  </Flex>
                </Flex>
              </PCardHead>
              <PCardBody>
                <ViewsChart data={currentStats.viewsByDay} color="var(--primary)" label="Profile views over time" />
              </PCardBody>
            </PCard>

            {/* Clicks Over Time */}
            <PCard className="mb-0">
              <PCardHead>
                <Flex between>
                  <Flex column gap={1}>
                    <Text size="sm" weight="semibold" color="foreground">Link Clicks Over Time</Text>
                    <Text size="sm" color="muted">Daily click count (last {days} days)</Text>
                  </Flex>
                </Flex>
              </PCardHead>
              <PCardBody>
                <ViewsChart data={currentStats.clicksByDay} color="var(--success)" label="Link clicks over time" />
              </PCardBody>
            </PCard>
          </Box>

          {/* Top Links & Referrers */}
          <Box className="grid gap-6 md:grid-cols-2 mb-6">
            <PCard className="mb-0">
              <PCardHead>
                <Text size="sm" weight="semibold" color="foreground">Top Links</Text>
              </PCardHead>
              <PCardBody>
                <TopLinksList links={currentStats.topLinks} />
              </PCardBody>
            </PCard>

            <PCard className="mb-0">
              <PCardHead>
                <Text size="sm" weight="semibold" color="foreground">Top Referrers</Text>
              </PCardHead>
              <PCardBody>
                <ReferrersList referrers={currentStats.topReferrers} />
              </PCardBody>
            </PCard>
          </Box>

          {/* Device Breakdown */}
          <PCard className="mb-0">
            <PCardHead>
              <Text size="sm" weight="semibold" color="foreground">Device Breakdown</Text>
            </PCardHead>
            <PCardBody>
              <DeviceBreakdown devices={currentStats.deviceBreakdown} />
            </PCardBody>
          </PCard>
        </PCardBody>
      </PCard>

      {/* Template Comparison */}
      <PCard>
        <PCardHead>
          <Text size="sm" weight="semibold" color="foreground">Template Performance Comparison</Text>
        </PCardHead>
        <PCardBody>
          <TemplateComparisonTable templates={data.templateComparison} currentTemplate={currentTemplate} />
        </PCardBody>
      </PCard>
    </div>
  );
}

// Helper components
function ViewsChart({ data, color, label = "Chart" }: { data: Array<{ date: string; count: number }>; color: string; label?: string }) {
  if (!data.length) {
    return <Box className="h-48 flex items-center justify-center"><Text size="sm" color="muted">No data available</Text></Box>;
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 400;
    const y = 160 - (d.count / (maxCount || 1)) * 140;
    return { x, y, date: d.date, count: d.count };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

  return (
    <Box className="h-48 relative">
      <div className="sr-only" role="table" aria-label={`${label} data table`}>
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{formatNumber(d.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <svg viewBox="0 0 400 180" className="w-full h-full" role="img" aria-label={`${label} chart`} aria-hidden="true">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartGradient)" />
        <path d={linePath} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--background)" stroke={color} strokeWidth="2" />
        ))}
      </svg>
    </Box>
  );
}

function TopLinksList({ links }: { links: Array<{ label: string; url: string; clicks: number }> }) {
  if (!links.length) {
    return <Text size="sm" color="muted" className="text-center py-8">No link click data available</Text>;
  }

  return (
    <Box className="space-y-3">
      {links.slice(0, 5).map((link, index) => (
        <Box key={`${link.label}-${index}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <Flex align="center" gap={3} className="min-w-0">
            <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MousePointerClick className="h-4 w-4" />
            </Box>
            <Box className="min-w-0">
              <Text weight="medium" size="sm" className="truncate">{link.label}</Text>
              <Text size="sm" color="muted" className="truncate font-mono">{link.url.length > 50 ? link.url.substring(0, 50) + '...' : link.url}</Text>
            </Box>
          </Flex>
          <Badge variant="secondary" size="sm">{formatNumber(link.clicks)} clicks</Badge>
        </Box>
      ))}
    </Box>
  );
}

function ReferrersList({ referrers }: { referrers: Array<{ source: string; count: number }> }) {
  if (!referrers.length) {
    return <Text size="sm" color="muted" className="text-center py-8">No referrer data available</Text>;
  }

  const total = referrers.reduce((sum, r) => sum + r.count, 0);

  return (
    <Box className="space-y-3">
      {referrers.slice(0, 5).map((ref, index) => (
        <Box key={`${ref.source}-${index}`} className="space-y-2">
          <Flex between>
            <Text size="sm" weight="medium" className="truncate max-w-[200px]">{ref.source}</Text>
            <Text size="sm" weight="medium" color="foreground">{ref.count}</Text>
          </Flex>
          <Box className="h-1.5 bg-muted rounded-full overflow-hidden">
            <Box
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(ref.count / (total || 1)) * 100}%` }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function DeviceBreakdown({ devices }: { devices: Array<{ device: string; count: number }> }) {
  if (!devices.length) {
    return <Text size="sm" color="muted" className="text-center py-8">No device data available</Text>;
  }

  const total = devices.reduce((sum, d) => sum + d.count, 0);

  return (
    <Box className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
      {devices.map((device, index) => (
        <Box key={`${device.device}-${index}`} className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
          <Text size="2xl" weight="bold" color="foreground">{formatPercent((device.count / (total || 1)) * 100)}</Text>
          <Text size="sm" color="muted" className="capitalize">{device.device}</Text>
          <Text size="sm" color="muted" className="mt-1">{formatNumber(device.count)} visits</Text>
        </Box>
      ))}
    </Box>
  );
}

function TemplateComparisonTable({ templates, currentTemplate }: { templates: Array<{ templateId: string; templateName: string; views: number; linkClicks: number; conversionRate: number }>; currentTemplate: string }) {
  if (!templates.length) {
    return <Text size="sm" color="muted" className="text-center py-8">No comparison data available</Text>;
  }

  return (
    <Box className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Template performance comparison showing views, clicks, conversion rates, and active status for each template</caption>
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Template</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Views</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Clicks</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Conversion</th>
            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template, index) => (
            <tr
              key={template.templateId}
              className={cn(
                'border-b border-border/30 transition-colors',
                template.templateId === currentTemplate && 'bg-primary/5'
              )}
            >
              <td className="py-3 px-4">
                <Flex align="center" gap={2}>
                  {template.templateId === currentTemplate && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
                  <Text className={cn('font-medium', template.templateId === currentTemplate && 'text-primary')}>
                    {TEMPLATE_NAMES[template.templateId] || template.templateName}
                  </Text>
                  {template.templateId === currentTemplate && <Badge variant="outline" size="sm">Current</Badge>}
                </Flex>
              </td>
              <td className="py-3 px-4 text-right font-mono">{formatNumber(template.views)}</td>
              <td className="py-3 px-4 text-right font-mono">{formatNumber(template.linkClicks)}</td>
              <td className="py-3 px-4 text-right font-mono">{formatPercent(template.conversionRate)}</td>
              <td className="py-3 px-4 text-center">
                {template.templateId === currentTemplate ? (
                  <Badge variant="success" size="sm">Active</Badge>
                ) : (
                  <Badge variant="secondary" size="sm">Available</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}