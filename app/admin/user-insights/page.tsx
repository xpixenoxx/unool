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

// ---- Types ----
interface PlanDetail { plan: string; count: number; percentage: number; }
interface UserBreakdown {
  total: number;
  newUsersLast30Days: number;
  byPlan: Record<string, number>;
  planDetails: PlanDetail[];
  registrationsLast30Days: Array<{ date: string; count: number }>;
  recentUsers?: Array<{ id: string; email: string; plan: string; createdAt: string; isSuspended: boolean }>;
}
interface PlatformStat { platform: string; users: number; }
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
  const segments = data.filter(d => d.value > 0).map((d, i) => {
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

  const { userBreakdown, postsByPlatform, platformStats } = data;

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

  // Platform user counts bar data
  const platformUserBar = platformStats.platformUserCounts.slice(0, 10).map(p => ({
    label: p.platform,
    value: p.users,
  }));

  // Channel count donut
  const channelDonutData = [
    { label: 'No channel', value: platformStats.usersWithNoPlatforms, color: '#6b7280' },
    { label: '1 channel', value: platformStats.oneChannelUsers, color: '#10b981' },
    { label: '2+ channels', value: platformStats.multiChannelUsers, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Growth sparkline (30d)
  const regData = userBreakdown.registrationsLast30Days || [];
  const maxReg = Math.max(...regData.map(d => d.count), 1);
  const sparkW = 280;
  const sparkH = 60;

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
              <Text size="sm" color="muted">Real-time breakdown of your user base, plans, and platform usage.</Text>
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

      {/* Top KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: userBreakdown.total, icon: <Users className="h-5 w-5" />, color: '#8b5cf6', sub: 'All-time' },
          { label: 'New (30d)', value: userBreakdown.newUsersLast30Days, icon: <TrendingUp className="h-5 w-5" />, color: '#10b981', sub: `+${((userBreakdown.newUsersLast30Days / Math.max(userBreakdown.total, 1)) * 100).toFixed(1)}% of total` },
          { label: 'Posts Published', value: Object.values(postsByPlatform).reduce((a, b) => a + b, 0), icon: <Activity className="h-5 w-5" />, color: '#3b82f6', sub: 'All platforms' },
          { label: 'Multi-Channel Users', value: platformStats.multiChannelUsers, icon: <Share2 className="h-5 w-5" />, color: '#f59e0b', sub: `${platformStats.oneChannelUsers} single-channel` },
        ].map((m) => (
          <Card key={m.label} variant="default" padding="lg" className="border-border/60">
            <CardContent className="p-0">
              <Flex between className="items-start">
                <div>
                  <Text size="sm" color="muted" weight="medium">{m.label}</Text>
                  <Text size="3xl" weight="bold" style={{ color: m.color }}>{m.value.toLocaleString()}</Text>
                  <Text size="xs" color="muted" className="mt-1">{m.sub}</Text>
                </div>
                <div className="p-2 rounded-xl" style={{ background: `${m.color}20` }}>
                  <div style={{ color: m.color }}>{m.icon}</div>
                </div>
              </Flex>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Plan Distribution + 30-day growth sparkline */}
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

        {/* 30-Day Registration Growth */}
        <Card variant="analytics" padding="lg" className="border-border/60">
          <CardHeader className="pb-2">
            <Flex align="center" gap={2}>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <CardTitle>30-Day Signups</CardTitle>
            </Flex>
            <CardDescription>Daily new user registrations (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-emerald-500">+{userBreakdown.newUsersLast30Days}</span>
              <span className="text-sm text-muted-foreground">new users this month</span>
            </div>
            {regData.length > 0 ? (
              <svg width={sparkW} height={sparkH + 20} viewBox={`0 0 ${sparkW} ${sparkH + 20}`} className="w-full">
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* area fill */}
                <path
                  d={[
                    `M 0 ${sparkH}`,
                    ...regData.map((d, i) => {
                      const x = (i / (regData.length - 1)) * sparkW;
                      const y = sparkH - (d.count / maxReg) * sparkH;
                      return `L ${x} ${y}`;
                    }),
                    `L ${sparkW} ${sparkH}`,
                    'Z',
                  ].join(' ')}
                  fill="url(#sparkGrad)"
                />
                {/* line */}
                <polyline
                  points={regData.map((d, i) => {
                    const x = (i / (regData.length - 1)) * sparkW;
                    const y = sparkH - (d.count / maxReg) * sparkH;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* dots at weekends/peaks */}
                {regData.map((d, i) => {
                  if (d.count !== Math.max(...regData.map(r => r.count)) && d.count === 0) return null;
                  const x = (i / (regData.length - 1)) * sparkW;
                  const y = sparkH - (d.count / maxReg) * sparkH;
                  return <circle key={i} cx={x} cy={y} r={d.count > 0 ? 2.5 : 0} fill="#10b981" />;
                })}
                <text x={0} y={sparkH + 16} fontSize="9" fill="#888">{regData[0]?.date}</text>
                <text x={sparkW} y={sparkH + 16} fontSize="9" fill="#888" textAnchor="end">{regData[regData.length - 1]?.date}</text>
              </svg>
            ) : (
              <Text color="muted" size="sm">No registration data yet</Text>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Posts by Platform */}
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

      {/* Row 4: Channel usage + Exclusive platform users */}
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

      {/* Row 5: Exclusive platform users */}
      {platformStats.exclusivePlatformUsers.length > 0 && (
        <Card variant="analytics" padding="lg" className="border-border/60">
          <CardHeader className="pb-2">
            <Flex align="center" gap={2}>
              <Zap className="h-4 w-4 text-amber-500" />
              <CardTitle>Platform-Exclusive Users</CardTitle>
            </Flex>
            <CardDescription>Users who post on only one platform — shows where your audience is focused</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={platformStats.exclusivePlatformUsers.map(p => ({ label: p.platform, value: p.users }))}
              color="#f59e0b"
              maxItems={12}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {platformStats.exclusivePlatformUsers.map(p => (
                <Badge key={p.platform} variant="outline" className="gap-1.5 capitalize">
                  <span className="h-2 w-2 rounded-full" style={{ background: getPlatformColor(p.platform) }} />
                  {p.platform}: {p.users} {p.users === 1 ? 'user' : 'users'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 6: Recent users */}
      {userBreakdown.recentUsers && userBreakdown.recentUsers.length > 0 && (
        <Card variant="analytics" padding="lg" className="border-border/60">
          <CardHeader className="pb-2">
            <Flex align="center" gap={2}>
              <Users className="h-4 w-4 text-primary" />
              <CardTitle>Recent Signups</CardTitle>
            </Flex>
            <CardDescription>Last 20 registered users with their plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Plan</th>
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
        Auto-refreshing every 15 seconds · Data from live database
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
            <div className="h-4 w-24 rounded-md bg-muted/60" />
            <div className="h-8 w-20 rounded-md bg-muted/80" />
            <div className="h-3 w-16 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
            <div className="h-6 w-40 rounded-md bg-muted/70" />
            <div className="h-40 rounded-lg bg-muted/30" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <div className="h-6 w-48 rounded-md bg-muted/70" />
        <div className="h-32 rounded-lg bg-muted/30" />
      </div>
    </div>
  );
}
