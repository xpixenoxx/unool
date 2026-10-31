'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  Check,
  X,
  User,
  Layers,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Box,
  Flex,
  Text,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';

interface PlatformConn {
  id: string;
  workspaceId: string;
  workspaceName: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  platform: string;
  username: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function PlatformConnectionsPage() {
  const [connections, setConnections] = React.useState<PlatformConn[]>([]);
  const [totalConnections, setTotalConnections] = React.useState<number>(0);
  const [platformStats, setPlatformStats] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [platformFilter, setPlatformFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const fetchConnections = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (platformFilter !== 'all') params.set('platform', platformFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/platforms?${params}`);
      const data = await res.json();
      setConnections(data.data || []);
      setTotalConnections(data.total || 0);
      setPlatformStats(data.platformStats || {});
    } catch (err) {
      console.error('Failed to fetch platform connections:', err);
    } finally {
      setLoading(false);
    }
  }, [platformFilter, statusFilter]);

  React.useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleDisconnect = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect ${name}? This will revoke publishing access until re-authenticated.`)) return;
    try {
      const res = await fetch(`/api/admin/platforms?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to disconnect');
      await fetchConnections();
    } catch {
      alert('Failed to disconnect account');
    }
  };

  // Sort platform connection metrics in descending order by connection count
  const sortedPlatforms = React.useMemo(() => {
    return Object.entries(platformStats).sort(([pA, countA], [pB, countB]) => {
      if (countB !== countA) return countB - countA; // Descending count
      return pA.localeCompare(pB); // Alphabetical tie-breaker
    });
  }, [platformStats]);

  // Combined list of all available platforms for the filter dropdown
  const allPlatformOptions = React.useMemo(() => {
    const fromStats = Object.keys(platformStats).map((k) => k.toLowerCase());
    const canonical = [
      'linkedin',
      'pinterest',
      'instagram',
      'threads',
      'bluesky',
      'facebook',
      'youtube',
      'telegram',
      'discord',
      'slack',
      'dribbble',
      'kick',
      'whop',
      'mastodon',
      'twitter',
      'reddit',
    ];
    return Array.from(new Set([...fromStats, ...canonical])).sort();
  }, [platformStats]);

  const handlePlatformClick = (platformName: string) => {
    const target = platformName.toLowerCase();
    // Toggle: if clicked again, reset to 'all'
    if (platformFilter.toLowerCase() === target) {
      setPlatformFilter('all');
    } else {
      setPlatformFilter(target);
    }
  };

  return (
    <Box className="space-y-6 pb-12">
      {/* Header */}
      <MotionBox variant="fade">
        <Flex between className="items-center flex-wrap gap-4">
          <Box>
            <Flex align="center" gap={2}>
              <Text size="2xl" weight="bold" color="foreground">
                Platform Connections
              </Text>
              <SectionGuide
                title="Social Platform Integrations"
                description="Audits all OAuth token associations across LinkedIn, Pinterest, Instagram, Bluesky, Facebook, YouTube, Threads, Telegram, etc. Click any platform card to immediately filter connected users and accounts."
                example="Click 'Pinterest' to see all user accounts connected to Pinterest with real user identity and workspace details."
              />
            </Flex>
            <Text size="sm" color="muted">
              Monitor and manage all connected social media accounts across workspaces
            </Text>
          </Box>
          <Button variant="outline" size="sm" onClick={fetchConnections}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </Flex>
      </MotionBox>

      {/* Stats Cards - Sorted in Descending Order & Fully Clickable */}
      <MotionBox variant="fade" delay={0.05}>
        <div className="space-y-3">
          <Flex between className="items-center flex-wrap gap-2">
            <Flex align="center" gap={2}>
              <Text size="sm" weight="semibold" color="muted" className="uppercase tracking-wide">
                Connected Channels Distribution
              </Text>
              <SectionGuide
                title="Platform Breakdown"
                description="Aggregated count of active OAuth credentials per network provider, sorted in descending order of connection volume. Click any platform card to inspect connected users."
                example="Clicking Pinterest filters connected accounts for Pinterest with user name, email, and ID."
              />
            </Flex>
            {platformFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlatformFilter('all')}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <X className="h-3 w-3" /> Clear platform filter
              </Button>
            )}
          </Flex>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {/* Total Connections Card (stays first and clickable to show all) */}
            <Card
              onClick={() => setPlatformFilter('all')}
              className={cn(
                'cursor-pointer transition-all duration-150 select-none hover:shadow-md hover:border-primary/50 relative overflow-hidden',
                platformFilter === 'all'
                  ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-sm'
                  : 'hover:bg-muted/30 border-border/60'
              )}
            >
              <CardContent className="pt-5 pb-5">
                <Flex between align="center">
                  <Text size="xs" color="muted" weight="medium">Total Connections</Text>
                  {platformFilter === 'all' && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20">
                      All Active
                    </Badge>
                  )}
                </Flex>
                <Text size="2xl" weight="bold" className="mt-1 text-foreground">
                  {totalConnections || connections.length}
                </Text>
                <Text size="xs" color="muted" className="mt-1">
                  Click to show all platforms
                </Text>
              </CardContent>
            </Card>

            {/* Individual Platforms sorted descending by count */}
            {sortedPlatforms.map(([platform, count]) => {
              const isSelected = platformFilter.toLowerCase() === platform.toLowerCase();
              return (
                <Card
                  key={platform}
                  onClick={() => handlePlatformClick(platform)}
                  className={cn(
                    'cursor-pointer transition-all duration-150 select-none hover:shadow-md relative overflow-hidden active:scale-[0.98]',
                    isSelected
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/60 dark:bg-blue-950/25 shadow-sm'
                      : 'hover:border-primary/40 hover:bg-muted/30 border-border/60'
                  )}
                >
                  <CardContent className="pt-5 pb-5">
                    <Flex between align="center">
                      <Text size="xs" color={isSelected ? 'foreground' : 'muted'} weight="semibold" className="capitalize">
                        {platform}
                      </Text>
                      {isSelected && (
                        <span className="h-4 w-4 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </Flex>
                    <Text
                      size="2xl"
                      weight="bold"
                      className={cn('mt-1', isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-foreground')}
                    >
                      {count}
                    </Text>
                    <Text size="xs" color="muted" className="mt-1 truncate">
                      {isSelected ? 'Filtered in table below' : 'Click to filter accounts'}
                    </Text>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </MotionBox>

      {/* Filters & Connected Accounts Table */}
      <MotionBox variant="fade" delay={0.1}>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <Flex between className="items-center flex-wrap gap-4">
              <Box>
                <Flex align="center" gap={2}>
                  <CardTitle className="text-xl">Connected Accounts</CardTitle>
                  <SectionGuide
                    title="Accounts Table"
                    description="Displays the connected handle, real user identity (Name, ID, Email), associated workspace, token status, and connection date. Click the trash button to revoke access."
                    example="Shows real user name, email, and ID alongside workspace link."
                  />
                </Flex>
                {platformFilter !== 'all' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 capitalize text-xs">
                      Filtered by: {platformFilter} ({connections.length} {connections.length === 1 ? 'account' : 'accounts'})
                    </Badge>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setPlatformFilter('all')}
                      className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                    >
                      Show all ({totalConnections})
                    </Button>
                  </div>
                ) : (
                  <Text size="xs" color="muted" className="mt-1">
                    Showing all {connections.length} active platform connections
                  </Text>
                )}
              </Box>

              <Flex gap={3} align="center" className="flex-wrap">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[170px] h-9 text-xs">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms ({totalConnections || connections.length})</SelectItem>
                    {allPlatformOptions.map((p) => {
                      const count = platformStats[p] || 0;
                      return (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p} {count > 0 ? `(${count})` : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </Flex>
            </Flex>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Flex centerX centerY className="py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </Flex>
            ) : connections.length === 0 ? (
              <Flex column centerX centerY className="py-16 gap-3">
                <Layers className="h-10 w-10 text-muted-foreground/40" />
                <Text color="muted" size="base">
                  No {platformFilter !== 'all' ? `${platformFilter} ` : ''}connections found
                </Text>
                {platformFilter !== 'all' && (
                  <Button variant="outline" size="sm" onClick={() => setPlatformFilter('all')}>
                    View all platform connections
                  </Button>
                )}
              </Flex>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left">
                      <th className="py-3 px-3 font-medium text-muted-foreground">Platform</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Account / Username</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Workspace</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Token Expiry</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Connected</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {connections.map((conn) => (
                      <tr key={conn.id} className="hover:bg-muted/30 transition-colors">
                        {/* Platform Badge */}
                        <td className="py-3.5 px-3 font-medium capitalize">
                          <Badge variant="outline" className="font-medium capitalize text-xs">
                            {conn.platform}
                          </Badge>
                        </td>

                        {/* Connected Account / Handle */}
                        <td className="py-3.5 px-3">
                          <Text weight="semibold" className="text-foreground">
                            @{conn.username.replace(/^@/, '')}
                          </Text>
                        </td>

                        {/* Workspace Cell with Real User Name, ID, Email & Workspace link */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1 min-w-[200px]">
                            {/* Real User Name */}
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-foreground text-sm">
                                {conn.userName || 'Unknown User'}
                              </span>
                            </div>

                            {/* Real User Email */}
                            {conn.userEmail ? (
                              <div className="text-xs text-muted-foreground font-mono truncate max-w-[260px]" title={conn.userEmail}>
                                {conn.userEmail}
                              </div>
                            ) : null}

                            {/* Real User ID */}
                            {conn.userId ? (
                              <div
                                className="text-[11px] text-muted-foreground/75 font-mono truncate max-w-[260px]"
                                title={`User ID: ${conn.userId}`}
                              >
                                ID: {conn.userId}
                              </div>
                            ) : null}

                            {/* Workspace Link */}
                            <div className="pt-0.5">
                              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400 font-normal inline-flex items-center gap-1" asChild>
                                <Link href={`/admin/workspaces/${conn.workspaceId}`} prefetch={true} title="Open workspace details">
                                  <span>{conn.workspaceName || 'My Workspace'}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3">
                          <Badge
                            className={cn(
                              'text-xs capitalize font-medium',
                              conn.status === 'connected'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20'
                            )}
                          >
                            {conn.status}
                          </Badge>
                        </td>

                        {/* Token Expiry */}
                        <td className="py-3.5 px-3 text-xs text-muted-foreground font-mono">
                          {conn.expiresAt ? new Date(conn.expiresAt).toLocaleDateString() : 'Never / Long-lived'}
                        </td>

                        {/* Connected Date */}
                        <td className="py-3.5 px-3 text-xs text-muted-foreground font-mono">
                          {new Date(conn.createdAt).toLocaleDateString()}
                        </td>

                        {/* Action / Disconnect */}
                        <td className="py-3.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(conn.id, `@${conn.username}`)}
                            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                            title="Disconnect connection"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </MotionBox>
    </Box>
  );
}
