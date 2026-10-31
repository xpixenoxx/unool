'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  PieChart,
  BarChart3,
  Share2,
  RefreshCw,
  ArrowLeft,
  Layers,
  Activity,
  Zap,
  Clock,
  Hourglass,
  LayoutGrid,
  PenTool,
  CalendarDays,
  Radio,
  Lock,
  Gift,
  Globe,
  CreditCard,
  Settings as SettingsIcon,
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
} from '@/components/ui';
import { InteractiveSignupChart } from '@/components/admin/interactive-signup-chart';

// ---- Types ----
interface PlanDetail { plan: string; count: number; percentage: number; }
interface RecentUserItem {
  id: string;
  email: string;
  plan: string;
  createdAt: string;
  isSuspended: boolean;
  totalTimeSeconds?: number;
  formattedTimeSpent?: string;
  topSection?: string;
}

interface UserBreakdown {
  total: number;
  newUsersLast30Days: number;
  byPlan: Record<string, number>;
  planDetails: PlanDetail[];
  registrationsLast30Days: Array<{ date: string; count: number }>;
  recentUsers?: RecentUserItem[];
}

interface PlatformStat { platform: string; users: number; }

interface SectionTimeStat {
  section: string;
  name: string;
  color: string;
  description: string;
  totalSeconds: number;
  formattedTotal: string;
  percentage: number;
  activeUsersCount: number;
  avgSecondsPerUser: number;
  formattedAvg: string;
}

interface TimeSpentStats {
  overallSeconds: number;
  formattedOverall: string;
  avgSecondsPerUser: number;
  formattedAvgPerUser: string;
  trackedUsersCount: number;
  mostActiveSection: string;
  sections: SectionTimeStat[];
}

interface Insights {
  userBreakdown: UserBreakdown;
  postsByPlatform: Record<string, number>;
  platformStats: {
    usersByPlatformCount: Array<{ platformCount: number; users: number }>;
    usersWithNoPlatforms: number;
    oneChannelUsers: number;
    multiChannelUsers: number;
    platformUserCounts: PlatformStat[];
    exclusivePlatformUsers: PlatformStat[];
  };
  timeSpentStats?: TimeSpentStats;
  generatedAt: string;
}

// ---- Plan colors ----
const PLAN_COLORS: Record<string, string> = {
  free: '#71717a',
  spark: '#10b981',
  creator: '#3b82f6',
  pro: '#8b5cf6',
  studio: '#f59e0b',
  enterprise: '#ef4444',
};
const PLAN_LABELS: Record<string, string> = {
  free: 'Free', spark: 'Spark (Free)', creator: 'Creator',
  pro: 'Pro', studio: 'Studio', enterprise: 'Enterprise',
};

// ---- Platform colors ----
const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0a66c2',
  instagram: '#e1306c',
  x: '#000000',
  twitter: '#1da1f2',
  threads: '#000000',
  facebook: '#1877f2',
  bluesky: '#0085ff',
  youtube: '#ff0000',
  pinterest: '#bd081c',
  reddit: '#ff4500',
  mastodon: '#6364ff',
  slack: '#4a154b',
  telegram: '#229ed9',
  discord: '#5865f2',
  medium: '#00ab6c',
  manual: '#6b7280',
};

function getPlatformColor(p: string) {
  return PLATFORM_COLORS[p.toLowerCase()] || '#6b7280';
}

function getSectionIcon(section: string) {
  const iconProps = { className: 'h-4 w-4 shrink-0' };
  switch (section) {
    case 'overview': return <LayoutGrid {...iconProps} />;
    case 'studio': return <PenTool {...iconProps} />;
    case 'flightplan': return <CalendarDays {...iconProps} />;
    case 'signal': return <Radio {...iconProps} />;
    case 'automation': return <Zap {...iconProps} />;
    case 'unlock-gates': return <Lock {...iconProps} />;
    case 'referrals': return <Gift {...iconProps} />;
    case 'profile': return <Globe {...iconProps} />;
    case 'billing': return <CreditCard {...iconProps} />;
    case 'settings': return <SettingsIcon {...iconProps} />;
    case 'composer': return <BarChart3 {...iconProps} />;
    default: return <Clock {...iconProps} />;
  }
}

// ---- SVG Donut Chart ----
function DonutChart({ data, total, cx = 80, cy = 80, r = 60, stroke = 14 }: {
  data: Array<{ label: string; value: number; color: string }>;
  total: number;
  cx?: number; cy?: number; r?: number; stroke?: number;
}) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  if (total === 0) return (
    <svg width={cx * 2} height={cy * 2} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" fontSize="11">No data</text>
    </svg>
  );
  let offset = -90;
  const segments = data.filter(d => d.value > 0).map((d) => {
    const pct = d.value / total;
    const degrees = pct * 360;
    const startAngle = offset;
    offset += degrees;
    return { ...d, pct, degrees, startAngle };
  });
  function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }
  const hov = hovered !== null ? segments[hovered] : null;
  return (
    <svg width={cx * 2} height={cy * 2} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
      {segments.map((s, i) => (
        <path
          key={i}
          d={arcPath(cx, cy, r, s.startAngle, s.startAngle + s.degrees - 0.5)}
          fill="none"
          stroke={s.color}
          strokeWidth={hovered === i ? stroke + 4 : stroke}
          strokeLinecap="round"
          style={{ cursor: 'pointer', transition: 'stroke-width 0.15s' }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}
      {hov ? (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" fill={hov.color} fontSize="18" fontWeight="bold">{hov.value}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle" fill="#888" fontSize="10">{hov.label}</text>
          <text x={cx} y={cy + 22} textAnchor="middle" dominantBaseline="middle" fill="#aaa" fontSize="10">{(hov.pct * 100).toFixed(1)}%</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="bold" className="fill-foreground" fill="currentColor">{total}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#888">total</text>
        </>
      )}
    </svg>
  );
}

// ---- SVG Bar Chart ----
function BarChart({ data, color = '#8b5cf6', maxItems = 12 }: {
  data: Array<{ label: string; value: number }>;
  color?: string;
  maxItems?: number;
}) {
  const [hov, setHov] = React.useState<number | null>(null);
  const items = data.slice(0, maxItems);
  const maxVal = Math.max(...items.map(d => d.value), 1);
  const barW = 32;
  const gap = 8;
  const chartH = 120;
  const totalW = items.length * (barW + gap);
  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(totalW + 16, 300)} height={chartH + 40} style={{ display: 'block' }}>
        {items.map((d, i) => {
          const h = Math.max((d.value / maxVal) * chartH, 2);
          const x = i * (barW + gap) + 8;
          const y = chartH - h;
          const isHov = hov === i;
          return (
            <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'default' }}>
              <rect x={x} y={y} width={barW} height={h} rx={4} fill={color} opacity={isHov ? 1 : 0.75} style={{ transition: 'opacity 0.15s' }} />
              {isHov && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill={color} fontWeight="bold">{d.value}</text>
              )}
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize="9" fill="#888"
                style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---- Metric Pill ----
function MetricPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold" style={{ color }}>{value.toLocaleString()}</span>
    </div>
  );
}

// ---- Progress row ----
function PlanRow({ plan, count, percentage, color, label }: { plan: string; count: number; percentage: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">{count}</span>
          <span className="text-xs text-muted-foreground w-10 text-right">{percentage}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ---- Main Page ----
let cached: { data: Insights; ts: number } | null = null;

export default function UserInsightsPage() {
  const [data, setData] = React.useState<Insights | null>(cached?.data || null);
  const [loading, setLoading] = React.useState(!cached?.data);
  const [error, setError] = React.useState<string | null>(null);
  const [lastSync, setLastSync] = React.useState<string>('');

  const fetchData = React.useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/user-insights');
      if (!res.ok) throw new Error('Failed to fetch insights');
      const json: Insights = await res.json();
      cached = { data: json, ts: Date.now() };
      setData(json);
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData(!cached?.data);
    const id = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) return <UserInsightsSkeleton />;

  if (error) return (
    <Box className="flex flex-col items-center justify-center py-24 gap-4">
      <Text color="muted" size="lg">Failed to load insights</Text>
      <Button onClick={() => fetchData(true)} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" /> Retry
      </Button>
    </Box>
  );

  if (!data) return null;

  const { userBreakdown, postsByPlatform, platformStats, timeSpentStats } = data;

  // Plan donut data
  const planDonutData = userBreakdown.planDetails.map(d => ({
    label: PLAN_LABELS[d.plan] || d.plan,
    value: d.count,
    color: PLAN_COLORS[d.plan] || '#6b7280',
  }));

  // Posts by platform bar data
  const postsBarData = Object.entries(postsByPlatform)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Channel count donut
  const channelDonutData = [
    { label: 'No channel', value: platformStats.usersWithNoPlatforms, color: '#6b7280' },
    { label: '1 channel', value: platformStats.oneChannelUsers, color: '#10b981' },
    { label: '2+ channels', value: platformStats.multiChannelUsers, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Growth data (30d registrations)
  const regData = userBreakdown.registrationsLast30Days || [];

  // Sections time spent list
  const sectionsList = timeSpentStats?.sections || [];

  return (
    <Box className="space-y-6 pb-10">
      {/* Header */}
      <Flex between className="items-start gap-4 flex-wrap">
        <Flex column gap={2}>
          <Flex align="center" gap={3}>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <Text size="3xl" weight="bold" color="foreground">User Insights</Text>
              <Text size="sm" color="muted">Real-time breakdown of user engagement, section time, plans, and platform reach.</Text>
            </div>
          </Flex>
        </Flex>
        <Flex gap={2} align="center">
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs font-normal">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live · auto-refresh 15s
          </Badge>
          {lastSync && <span className="text-[11px] text-muted-foreground">Last sync: {lastSync}</span>}
          <Button variant="outline" size="sm" onClick={() => fetchData(true)} className="h-8 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </Flex>
      </Flex>

      {/* Top KPI row - Includes Overall Time & Most Active Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total Users', value: userBreakdown.total.toLocaleString(), icon: <Users className="h-5 w-5" />, color: '#8b5cf6', sub: 'All-time registered' },
          { label: 'New (30d)', value: userBreakdown.newUsersLast30Days.toLocaleString(), icon: <TrendingUp className="h-5 w-5" />, color: '#10b981', sub: `+${((userBreakdown.newUsersLast30Days / Math.max(userBreakdown.total, 1)) * 100).toFixed(1)}% of total` },
          {
            label: 'Overall Time in Unool',
            value: timeSpentStats?.formattedOverall || '0s',
            icon: <Clock className="h-5 w-5" />,
            color: '#6366f1',
            sub: `Avg ${timeSpentStats?.formattedAvgPerUser || '0s'} / user`,
          },
          {
            label: 'Top Active Section',
            value: timeSpentStats?.mostActiveSection || 'Overview',
            icon: <Hourglass className="h-5 w-5" />,
            color: '#ec4899',
            sub: `${timeSpentStats?.trackedUsersCount || 0} active users tracked`,
          },
          { label: 'Posts Published', value: Object.values(postsByPlatform).reduce((a, b) => a + b, 0).toLocaleString(), icon: <Activity className="h-5 w-5" />, color: '#3b82f6', sub: 'Across platforms' },
          { label: 'Multi-Channel Users', value: platformStats.multiChannelUsers.toLocaleString(), icon: <Share2 className="h-5 w-5" />, color: '#f59e0b', sub: `${platformStats.oneChannelUsers} single-channel` },
        ].map((m) => (
          <Card key={m.label} variant="default" padding="lg" className="border-border/60">
            <CardContent className="p-0">
              <Flex between className="items-start">
                <div className="min-w-0 pr-1">
                  <Text size="sm" color="muted" weight="medium" className="truncate">{m.label}</Text>
                  <Text size="2xl" weight="bold" style={{ color: m.color }} className="truncate">{m.value}</Text>
                  <Text size="xs" color="muted" className="mt-1 truncate">{m.sub}</Text>
                </div>
                <div className="p-2 rounded-xl shrink-0" style={{ background: `${m.color}20` }}>
                  <div style={{ color: m.color }}>{m.icon}</div>
                </div>
              </Flex>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Section Time Spent Breakdown (Requested Core Feature) */}
      <Card variant="analytics" padding="lg" className="border-border/60">
        <CardHeader className="pb-3">
          <Flex between className="items-center flex-wrap gap-2">
            <div>
              <Flex align="center" gap={2}>
                <Clock className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl">Time Spent by Dashboard Section</CardTitle>
              </Flex>
              <CardDescription>
                Detailed active time users spend across every section in Unool dashboard (Overview, Flight Plan, Studio, Referrals, Signal, etc.)
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-600 border-indigo-500/30 font-medium">
                Overall: {timeSpentStats?.formattedOverall || '0s'}
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
                {timeSpentStats?.trackedUsersCount || 0} active users tracked
              </Badge>
            </div>
          </Flex>
        </CardHeader>
        <CardContent className="space-y-6">
          {sectionsList.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column: Progress bars for all sections */}
              <div className="space-y-4">
                <Text size="sm" weight="semibold" color="foreground">Section Engagement Breakdown</Text>
                <div className="space-y-3">
                  {sectionsList.map((sec) => (
                    <div key={sec.section} className="p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="p-1.5 rounded-lg text-white shrink-0 flex items-center justify-center"
                            style={{ background: sec.color }}
                          >
                            {getSectionIcon(sec.section)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-foreground block truncate">{sec.name}</span>
                            <span className="text-xs text-muted-foreground block truncate">{sec.description}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold" style={{ color: sec.color }}>
                            {sec.formattedTotal}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2 font-mono">
                            {sec.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Percentage progress bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(sec.percentage, sec.totalSeconds > 0 ? 1 : 0)}%`,
                            background: sec.color,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span>{sec.activeUsersCount} {sec.activeUsersCount === 1 ? 'user' : 'users'} engaged</span>
                        <span>Avg: {sec.formattedAvg} / user</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Visual distribution summary + Quick stats */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <Text size="sm" weight="semibold" color="foreground">Relative Time Distribution</Text>
                  <Text size="xs" color="muted" className="mb-3">Visual comparison of time invested per dashboard area</Text>
                  <BarChart
                    data={sectionsList.map(s => ({ label: s.name, value: Math.round(s.totalSeconds / 60) }))}
                    color="#6366f1"
                    maxItems={11}
                  />
                  <Text size="xs" color="muted" className="text-center mt-1">Values in active minutes</Text>
                </div>

                {/* Overall insights summary card */}
                <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-3">
                  <Text size="sm" weight="bold" color="foreground">Engagement Insights</Text>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-background border border-border/40">
                      <span className="text-muted-foreground block">Overall Time Spent</span>
                      <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                        {timeSpentStats?.formattedOverall || '0s'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border border-border/40">
                      <span className="text-muted-foreground block">Avg Time per User</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {timeSpentStats?.formattedAvgPerUser || '0s'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border border-border/40">
                      <span className="text-muted-foreground block">Top Active Area</span>
                      <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                        {timeSpentStats?.mostActiveSection || 'Overview'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border border-border/40">
                      <span className="text-muted-foreground block">Tracked Users</span>
                      <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                        {timeSpentStats?.trackedUsersCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Flex column align="center" className="py-12" gap={2}>
              <Clock className="h-10 w-10 text-muted-foreground/40" />
              <Text color="muted">Tracking initialized — live active user time will appear here automatically.</Text>
            </Flex>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Plan Distribution + 30-day growth sparkline */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Donut */}
        <Card variant="analytics" padding="lg" className="border-border/60">
          <CardHeader className="pb-2">
            <Flex align="center" gap={2}>
              <PieChart className="h-4 w-4 text-primary" />
              <CardTitle>Plan Distribution</CardTitle>
            </Flex>
            <CardDescription>User count by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <Flex gap={6} className="flex-wrap items-center">
              <div className="shrink-0">
                <DonutChart
                  data={planDonutData}
                  total={userBreakdown.total}
                  cx={90} cy={90} r={66} stroke={16}
                />
              </div>
              <div className="flex-1 min-w-[180px] space-y-2.5">
                {userBreakdown.planDetails.map(d => (
                  <PlanRow
                    key={d.plan}
                    plan={d.plan}
                    count={d.count}
                    percentage={d.percentage}
                    color={PLAN_COLORS[d.plan] || '#6b7280'}
                    label={PLAN_LABELS[d.plan] || d.plan}
                  />
                ))}
                {userBreakdown.planDetails.length === 0 && (
                  <Text color="muted" size="sm">No plan data yet</Text>
                )}
              </div>
            </Flex>
          </CardContent>
        </Card>

        {/* 30-Day Registration Growth (Interactive) */}
        <InteractiveSignupChart
          data={regData}
          initialNewUsersCount={userBreakdown.newUsersLast30Days}
        />
      </div>

      {/* Row 4: Posts by Platform */}
      <Card variant="analytics" padding="lg" className="border-border/60">
        <CardHeader className="pb-2">
          <Flex align="center" gap={2}>
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <CardTitle>Posts Published by Platform</CardTitle>
          </Flex>
          <CardDescription>Number of published posts per social platform (all-time)</CardDescription>
        </CardHeader>
        <CardContent>
          {postsBarData.length > 0 ? (
            <div className="space-y-4">
              <BarChart
                data={postsBarData.map(d => ({ label: d.label, value: d.value }))}
                color="#3b82f6"
                maxItems={15}
              />
              <div className="space-y-2">
                {postsBarData.slice(0, 8).map((d) => {
                  const total = postsBarData.reduce((a, b) => a + b.value, 0);
                  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={d.label} className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: getPlatformColor(d.label) }} />
                      <span className="text-sm font-medium capitalize w-24 shrink-0">{d.label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: getPlatformColor(d.label) }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{d.value.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Flex column align="center" className="py-12" gap={2}>
              <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
              <Text color="muted">No published posts yet across platforms</Text>
            </Flex>
          )}
        </CardContent>
      </Card>

      {/* Row 5: Channel usage + Exclusive platform users */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Channel count distribution */}
        <Card variant="analytics" padding="lg" className="border-border/60">
          <CardHeader className="pb-2">
            <Flex align="center" gap={2}>
              <Layers className="h-4 w-4 text-purple-500" />
              <CardTitle>Channel Usage</CardTitle>
            </Flex>
            <CardDescription>How many platforms each user is connected to</CardDescription>
          </CardHeader>
          <CardContent>
            <Flex gap={6} className="flex-wrap items-center">
              <div className="shrink-0">
                <DonutChart
                  data={channelDonutData}
                  total={userBreakdown.total}
                  cx={80} cy={80} r={60} stroke={14}
                />
              </div>
              <div className="flex-1 min-w-[150px] space-y-2">
                <MetricPill label="No platform" value={platformStats.usersWithNoPlatforms} color="#6b7280" />
                <MetricPill label="1 platform only" value={platformStats.oneChannelUsers} color="#10b981" />
                <MetricPill label="2+ platforms" value={platformStats.multiChannelUsers} color="#8b5cf6" />
                {platformStats.usersByPlatformCount.filter(b => b.platformCount >= 3).length > 0 && (
                  <div className="pt-1">
                    {platformStats.usersByPlatformCount.filter(b => b.platformCount >= 3).map(b => (
                      <MetricPill key={b.platformCount} label={`${b.platformCount} platforms`} value={b.users} color="#f59e0b" />
                    ))}
                  </div>
                )}
              </div>
            </Flex>
          </CardContent>
        </Card>

        {/* Platform user reach */}
        <Card variant="analytics" padding="lg" className="border-border/60">
          <CardHeader className="pb-2">
            <Flex align="center" gap={2}>
              <Share2 className="h-4 w-4 text-indigo-500" />
              <CardTitle>Platform Reach</CardTitle>
            </Flex>
            <CardDescription>Users connected to each platform</CardDescription>
          </CardHeader>
          <CardContent>
            {platformStats.platformUserCounts.length > 0 ? (
              <div className="space-y-2">
                {platformStats.platformUserCounts.slice(0, 10).map((p) => {
                  const max = platformStats.platformUserCounts[0]?.users || 1;
                  const pct = ((p.users / Math.max(userBreakdown.total, 1)) * 100).toFixed(0);
                  return (
                    <div key={p.platform} className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: getPlatformColor(p.platform) }} />
                      <span className="text-sm font-medium capitalize w-20 shrink-0">{p.platform}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(p.users / max) * 100}%`, background: getPlatformColor(p.platform) }}
                        />
                      </div>
                      <span className="text-sm font-bold w-10 text-right">{p.users}</span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Flex column align="center" className="py-8" gap={2}>
                <Share2 className="h-8 w-8 text-muted-foreground/40" />
                <Text color="muted" size="sm">No platform connections yet</Text>
              </Flex>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Recent users with Time in Unool & Top Section */}
      {userBreakdown.recentUsers && userBreakdown.recentUsers.length > 0 && (
        <Card variant="analytics" padding="lg" className="border-border/60">
          <CardHeader className="pb-2">
            <Flex align="center" gap={2}>
              <Users className="h-4 w-4 text-primary" />
              <CardTitle>Recent Users & Engagement</CardTitle>
            </Flex>
            <CardDescription>Last 20 registered users with plan, status, time spent, and most active section</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Plan</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Time in Unool</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Top Section</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Joined</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {userBreakdown.recentUsers.slice(0, 20).map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs">{u.email}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                          style={{ borderColor: PLAN_COLORS[u.plan] + '60', color: PLAN_COLORS[u.plan] }}
                        >
                          {PLAN_LABELS[u.plan] || u.plan}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{u.formattedTimeSpent || '0s'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className="text-xs font-normal">
                          {u.topSection || 'Overview'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {u.isSuspended ? (
                          <Badge variant="destructive" className="text-xs">Suspended</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30">Active</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Auto-refreshing every 15 seconds · Real live user time tracked per dashboard section
      </p>
    </Box>
  );
}

function UserInsightsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-lg bg-muted/60" />
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-muted/70" />
          <div className="h-4 w-72 rounded-md bg-muted/50" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
            <div className="h-4 w-24 rounded-md bg-muted/60" />
            <div className="h-8 w-20 rounded-md bg-muted/80" />
            <div className="h-3 w-16 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <div className="h-6 w-48 rounded-md bg-muted/70" />
        <div className="h-48 rounded-lg bg-muted/30" />
      </div>
    </div>
  );
}
