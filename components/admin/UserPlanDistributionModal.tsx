'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button,
  Text,
  Flex,
  Box,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import {
  Users,
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Search,
  Calendar,
  CheckCircle2,
  Crown,
  Layers,
  Info,
} from 'lucide-react';
import type { UserBreakdownData } from '@/lib/repositories/interfaces/IAdminRepository';

interface UserPlanDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBreakdown?: UserBreakdownData;
}

const PLAN_META: Record<
  string,
  { label: string; color: string; stroke: string; bg: string; border: string; text: string; icon: any; price: string }
> = {
  free: {
    label: 'Free',
    color: '#71717a',
    stroke: '#52525b',
    bg: 'bg-zinc-100 dark:bg-zinc-800/60',
    border: 'border-zinc-300 dark:border-zinc-700',
    text: 'text-zinc-700 dark:text-zinc-300',
    icon: Users,
    price: '$0/mo',
  },
  spark: {
    label: 'Spark (Free)',
    color: '#10b981',
    stroke: '#059669',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: Sparkles,
    price: '$0/mo',
  },
  creator: {
    label: 'Creator',
    color: '#3b82f6',
    stroke: '#2563eb',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Layers,
    price: '$499/mo',
  },
  pro: {
    label: 'Pro',
    color: '#8b5cf6',
    stroke: '#7c3aed',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    icon: Crown,
    price: '$999/mo',
  },
  studio: {
    label: 'Studio',
    color: '#f59e0b',
    stroke: '#d97706',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Crown,
    price: '$2,499/mo',
  },
  enterprise: {
    label: 'Enterprise',
    color: '#ec4899',
    stroke: '#db2777',
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    border: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-700 dark:text-pink-300',
    icon: ShieldCheck,
    price: 'Custom',
  },
};

function getPlanConfig(plan: string) {
  const normalized = plan.toLowerCase();
  return (
    PLAN_META[normalized] || {
      label: plan.charAt(0).toUpperCase() + plan.slice(1),
      color: '#6366f1',
      stroke: '#4f46e5',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-700 dark:text-indigo-300',
      icon: Users,
      price: 'Tier',
    }
  );
}

export function UserPlanDistributionModal({
  isOpen,
  onClose,
  initialBreakdown,
}: UserPlanDistributionModalProps) {
  const [data, setData] = React.useState<UserBreakdownData | undefined>(initialBreakdown);
  const [loading, setLoading] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());
  const [hoveredPlan, setHoveredPlan] = React.useState<string | null>(null);
  const [selectedFilterPlan, setSelectedFilterPlan] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [hoveredDay, setHoveredDay] = React.useState<{ date: string; count: number } | null>(null);

  const fetchStats = React.useCallback(async (showIndicator = true) => {
    if (showIndicator) setLoading(true);
    try {
      const res = await fetch('/api/admin/users/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch user plan stats:', err);
    } finally {
      if (showIndicator) setLoading(false);
    }
  }, []);

  // Update data if initialBreakdown updates
  React.useEffect(() => {
    if (initialBreakdown) {
      setData(initialBreakdown);
    }
  }, [initialBreakdown]);

  // Real-time polling while modal is open
  React.useEffect(() => {
    if (!isOpen) return;
    fetchStats(false);
    const interval = setInterval(() => {
      fetchStats(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen, fetchStats]);

  const total = data?.total || 0;
  const newUsersLast30Days = data?.newUsersLast30Days || 0;
  const planDetails = data?.planDetails || [];
  const registrations = data?.registrationsLast30Days || [];
  const recentUsers = data?.recentUsers || [];

  // Group into Paid vs Free
  const paidCount = planDetails
    .filter((p) => p.plan !== 'free' && p.plan !== 'spark')
    .reduce((sum, p) => sum + p.count, 0);
  const paidPercentage = total > 0 ? Math.round((paidCount / total) * 1000) / 10 : 0;

  // Filtered users for table
  const filteredUsers = React.useMemo(() => {
    return recentUsers.filter((u) => {
      const matchesPlan =
        selectedFilterPlan === 'all' || u.plan.toLowerCase() === selectedFilterPlan.toLowerCase();
      const matchesSearch =
        !searchQuery || u.email.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesPlan && matchesSearch;
    });
  }, [recentUsers, selectedFilterPlan, searchQuery]);

  // Calculate SVG donut chart slices
  const donutSlices = React.useMemo(() => {
    if (total === 0 || planDetails.length === 0) return [];
    let cumulativeAngle = 0;
    const radius = 64;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    return planDetails.map((item) => {
      const percentage = item.count / total;
      const strokeDasharray = `${percentage * circumference} ${circumference}`;
      const strokeDashoffset = -cumulativeAngle * circumference;
      cumulativeAngle += percentage;

      const config = getPlanConfig(item.plan);
      return {
        ...item,
        config,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [planDetails, total]);

  // Active highlighted slice details
  const activePlanInfo = React.useMemo(() => {
    const targetPlan = hoveredPlan || (planDetails[0]?.plan ?? 'free');
    const detail = planDetails.find((p) => p.plan === targetPlan);
    const config = getPlanConfig(targetPlan);
    return {
      plan: targetPlan,
      label: config.label,
      count: detail?.count || 0,
      percentage: detail?.percentage || 0,
      price: config.price,
      color: config.color,
    };
  }, [hoveredPlan, planDetails]);

  // Max daily registrations for bar chart scaling
  const maxRegistrations = React.useMemo(() => {
    return Math.max(...registrations.map((r) => r.count), 1);
  }, [registrations]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-border bg-card">
        {/* Header */}
        <Box className="p-6 pb-4 border-b border-border bg-muted/20">
          <Flex between className="items-start gap-4">
            <Box>
              <Flex align="center" gap={2} className="mb-1">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  User Plan Distribution & Growth
                </DialogTitle>
                <Badge variant="outline" className="gap-1.5 py-0.5 px-2 text-xs font-normal border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Real-Time
                </Badge>
              </Flex>
              <DialogDescription className="text-xs text-muted-foreground">
                Real-time breakdown of registered users across subscription plans and recent 30-day velocity.
              </DialogDescription>
            </Box>
            <Flex align="center" gap={2}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchStats(true)}
                disabled={loading}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Refresh stats immediately"
              >
                <RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
                <span>Refresh</span>
              </Button>
            </Flex>
          </Flex>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Box className="p-3 rounded-xl bg-background border border-border shadow-xs">
              <Text size="xs" color="muted" weight="medium">Total Users</Text>
              <Flex align="baseline" gap={2} className="mt-1">
                <Text size="2xl" weight="bold">{total.toLocaleString()}</Text>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">All-time</Badge>
              </Flex>
            </Box>

            <Box className="p-3 rounded-xl bg-background border border-border shadow-xs">
              <Text size="xs" color="muted" weight="medium">Past 1 Month Signups</Text>
              <Flex align="baseline" gap={2} className="mt-1">
                <Text size="2xl" weight="bold" className="text-emerald-600 dark:text-emerald-400">
                  +{newUsersLast30Days.toLocaleString()}
                </Text>
                <Badge variant="success" className="text-[10px] px-1.5 py-0 gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {total > 0 ? `${Math.round((newUsersLast30Days / total) * 100)}%` : '0%'}
                </Badge>
              </Flex>
            </Box>

            <Box className="p-3 rounded-xl bg-background border border-border shadow-xs">
              <Text size="xs" color="muted" weight="medium">Paid Users</Text>
              <Flex align="baseline" gap={2} className="mt-1">
                <Text size="2xl" weight="bold" className="text-purple-600 dark:text-purple-400">
                  {paidCount.toLocaleString()}
                </Text>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800">
                  {paidPercentage}%
                </Badge>
              </Flex>
            </Box>

            <Box className="p-3 rounded-xl bg-background border border-border shadow-xs">
              <Text size="xs" color="muted" weight="medium">Free / Spark Tier</Text>
              <Flex align="baseline" gap={2} className="mt-1">
                <Text size="2xl" weight="bold" className="text-zinc-600 dark:text-zinc-400">
                  {(total - paidCount).toLocaleString()}
                </Text>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {total > 0 ? `${Math.round(((total - paidCount) / total) * 100)}%` : '0%'}
                </Badge>
              </Flex>
            </Box>
          </div>
        </Box>

        {/* Tab Content */}
        <Box className="p-6">
          <Tabs defaultValue="distribution" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 w-full max-w-md">
              <TabsTrigger value="distribution" className="gap-1.5 text-xs">
                <PieChartIcon className="h-3.5 w-3.5" />
                <span>Plan Distribution</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>30-Day Growth</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" />
                <span>User List ({filteredUsers.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Plan Distribution Interactive Graph */}
            <TabsContent value="distribution" className="space-y-6 focus:outline-hidden mt-0">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* SVG Donut Chart */}
                <Box className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-muted/20 rounded-2xl border border-border">
                  <div className="relative flex items-center justify-center">
                    <svg
                      width="180"
                      height="180"
                      viewBox="0 0 180 180"
                      className="transform -rotate-90 transition-all duration-300"
                    >
                      <circle
                        cx="90"
                        cy="90"
                        r="64"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="24"
                        className="text-muted/30"
                      />
                      {donutSlices.map((slice) => {
                        const isHovered = hoveredPlan === slice.plan;
                        return (
                          <circle
                            key={slice.plan}
                            cx="90"
                            cy="90"
                            r="64"
                            fill="transparent"
                            stroke={slice.config.color}
                            strokeWidth={isHovered ? 28 : 24}
                            strokeDasharray={slice.strokeDasharray}
                            strokeDashoffset={slice.strokeDashoffset}
                            strokeLinecap="round"
                            className="cursor-pointer transition-all duration-300"
                            onMouseEnter={() => setHoveredPlan(slice.plan)}
                            onMouseLeave={() => setHoveredPlan(null)}
                            style={{
                              filter: isHovered ? 'drop-shadow(0px 0px 8px rgba(0,0,0,0.25))' : 'none',
                            }}
                          />
                        );
                      })}
                    </svg>

                    {/* Center Stat Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wider">
                        {activePlanInfo.label}
                      </Text>
                      <Text size="3xl" weight="bold" className="leading-tight">
                        {activePlanInfo.count}
                      </Text>
                      <Text size="xs" weight="semibold" style={{ color: activePlanInfo.color }}>
                        {activePlanInfo.percentage}%
                      </Text>
                    </div>
                  </div>

                  <Text size="xs" color="muted" className="mt-3 text-center">
                    Hover over donut segments to inspect plan share
                  </Text>
                </Box>

                {/* Plan Comparison Progress Bars */}
                <Box className="md:col-span-7 space-y-3">
                  <Flex between className="items-center mb-1">
                    <Text size="sm" weight="semibold">Tiers Breakdown</Text>
                    <Text size="xs" color="muted">{planDetails.length} active tier types</Text>
                  </Flex>

                  {planDetails.map((item) => {
                    const config = getPlanConfig(item.plan);
                    const isHovered = hoveredPlan === item.plan;
                    const IconComponent = config.icon;

                    return (
                      <Box
                        key={item.plan}
                        onMouseEnter={() => setHoveredPlan(item.plan)}
                        onMouseLeave={() => setHoveredPlan(null)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isHovered
                            ? 'border-primary/60 bg-muted/60 shadow-xs'
                            : 'border-border bg-background hover:bg-muted/30'
                        }`}
                      >
                        <Flex between className="items-center mb-1.5">
                          <Flex align="center" gap={2}>
                            <Box
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: config.color }}
                            />
                            <Text size="sm" weight="medium">{config.label}</Text>
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {config.price}
                            </Badge>
                          </Flex>
                          <Flex align="center" gap={2}>
                            <Text size="sm" weight="bold">{item.count} users</Text>
                            <Text size="xs" color="muted">({item.percentage}%)</Text>
                          </Flex>
                        </Flex>

                        {/* Animated Bar */}
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(item.percentage, 2)}%`,
                              backgroundColor: config.color,
                            }}
                          />
                        </div>
                      </Box>
                    );
                  })}

                  {planDetails.length === 0 && (
                    <Text color="muted" size="sm" className="text-center py-6">
                      No user plan data available yet.
                    </Text>
                  )}
                </Box>
              </div>
            </TabsContent>

            {/* TAB 2: 30-Day Registration Velocity Interactive Graph */}
            <TabsContent value="timeline" className="space-y-4 focus:outline-hidden mt-0">
              <Box className="p-4 bg-muted/20 rounded-2xl border border-border">
                <Flex between className="items-center mb-4">
                  <Box>
                    <Text size="sm" weight="semibold">Daily Registrations (Past 30 Days)</Text>
                    <Text size="xs" color="muted">
                      Shows daily signups velocity. Hover any bar to see registrations for that day.
                    </Text>
                  </Box>
                  {hoveredDay ? (
                    <Badge variant="default" className="text-xs gap-1 font-mono">
                      <Calendar className="h-3 w-3" />
                      {hoveredDay.date}: <strong>{hoveredDay.count} signups</strong>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Total 30d: +{newUsersLast30Days} users
                    </Badge>
                  )}
                </Flex>

                {/* Bar Graph */}
                <div className="h-44 w-full flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-1">
                  {registrations.map((day) => {
                    const heightPercent = maxRegistrations > 0 ? (day.count / maxRegistrations) * 100 : 0;
                    const isHovered = hoveredDay?.date === day.date;
                    const hasSignups = day.count > 0;

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        {/* Bar */}
                        <div
                          className={`w-full rounded-t-sm transition-all duration-200 ${
                            isHovered
                              ? 'bg-primary'
                              : hasSignups
                              ? 'bg-emerald-500/80 hover:bg-emerald-500'
                              : 'bg-muted/60 hover:bg-muted'
                          }`}
                          style={{
                            height: `${Math.max(heightPercent, 4)}%`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Date Axis (First, Middle, Last) */}
                {registrations.length > 0 && (
                  <Flex between className="text-[10px] text-muted-foreground px-1 border-t border-border/40 pt-2">
                    <span>{registrations[0]?.date}</span>
                    <span>{registrations[Math.floor(registrations.length / 2)]?.date}</span>
                    <span>{registrations[registrations.length - 1]?.date} (Today)</span>
                  </Flex>
                )}
              </Box>

              <Flex gap={3} className="text-xs text-muted-foreground p-3 rounded-xl bg-background border border-border">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <Text size="xs" color="muted">
                  Auto-updated in real time. Whenever a new user completes signup via Supabase Auth, they are recorded and reflected automatically.
                </Text>
              </Flex>
            </TabsContent>

            {/* TAB 3: User List with Plan Filter */}
            <TabsContent value="users" className="space-y-4 focus:outline-hidden mt-0">
              <Flex gap={3} className="items-center flex-wrap">
                <Box className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </Box>
                <Flex gap={1} className="flex-wrap">
                  <Button
                    variant={selectedFilterPlan === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilterPlan('all')}
                    className="h-8 text-xs"
                  >
                    All ({recentUsers.length})
                  </Button>
                  {planDetails.map((p) => (
                    <Button
                      key={p.plan}
                      variant={selectedFilterPlan === p.plan ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilterPlan(p.plan)}
                      className="h-8 text-xs"
                    >
                      {getPlanConfig(p.plan).label} ({p.count})
                    </Button>
                  ))}
                </Flex>
              </Flex>

              {/* User List Table */}
              <Box className="border border-border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredUsers.map((user) => {
                      const config = getPlanConfig(user.plan);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors"
                        >
                          <Flex align="center" gap={3} className="min-w-0">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
                                alt={user.email}
                              />
                              <AvatarFallback>
                                {user.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <Box className="min-w-0">
                              <Text weight="medium" size="xs" className="truncate">
                                {user.email}
                              </Text>
                              <Text size="xs" color="muted">
                                Registered: {new Date(user.createdAt).toLocaleDateString()}
                              </Text>
                            </Box>
                          </Flex>
                          <Flex align="center" gap={2}>
                            <Badge
                              variant="outline"
                              size="sm"
                              className={`text-[10px] ${config.bg} ${config.text} ${config.border}`}
                            >
                              {config.label}
                            </Badge>
                            {user.isSuspended ? (
                              <Badge variant="destructive" size="sm" className="text-[10px]">
                                Suspended
                              </Badge>
                            ) : (
                              <Badge variant="outline" size="sm" className="text-[10px] text-emerald-600 border-emerald-300">
                                Active
                              </Badge>
                            )}
                          </Flex>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Text color="muted" size="sm" className="text-center py-8">
                    No users match your filter
                  </Text>
                )}
              </Box>
            </TabsContent>
          </Tabs>
        </Box>

        {/* Footer */}
        <Box className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <Text size="xs" color="muted">
            Last synced: {lastUpdated.toLocaleTimeString()} • Auto-polling every 15s
          </Text>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
