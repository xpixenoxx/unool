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
  const [allConnections, setAllConnections] = React.useState<PlatformConn[]>([]);
  const [totalConnections, setTotalConnections] = React.useState<number>(0);
  const [platformStats, setPlatformStats] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [showAllForUsers, setShowAllForUsers] = React.useState(false);

  const fetchConnections = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/platforms?${params}`);
      const data = await res.json();
      const loaded: PlatformConn[] = data.data || [];
      setAllConnections(loaded);
      setTotalConnections(data.total || loaded.length);
      setPlatformStats(data.platformStats || {});
    } catch (err) {
      console.error('Failed to fetch platform connections:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

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

  // Resolve unique user identifier across connections
  const getUserKey = React.useCallback((conn: PlatformConn) => {
    return conn.userId || (conn.userEmail ? conn.userEmail.toLowerCase() : null) || conn.workspaceId || 'unknown';
  }, []);

  // Map each user to the set of platforms they have connected
  const userPlatformsMap = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    allConnections.forEach((conn) => {
      const key = getUserKey(conn);
      if (!map.has(key)) {
        map.set(key, new Set<string>());
      }
      if (conn.platform) {
        map.get(key)!.add(conn.platform.toLowerCase());
      }
    });
    return map;
  }, [allConnections, getUserKey]);

  // Set of user keys who have connected ALL selected platforms
  const qualifyingUserKeys = React.useMemo(() => {
    if (selectedPlatforms.length === 0) return null;
    const targets = selectedPlatforms.map((p) => p.toLowerCase());
    const qualifying = new Set<string>();

    userPlatformsMap.forEach((userPlatforms, userKey) => {
      const hasAll = targets.every((tp) => userPlatforms.has(tp));
      if (hasAll) {
        qualifying.add(userKey);
      }
    });
    return qualifying;
  }, [selectedPlatforms, userPlatformsMap]);

  // Displayed connections in the table
  const displayedConnections = React.useMemo(() => {
    if (selectedPlatforms.length === 0) {
      return allConnections;
    }
    if (!qualifyingUserKeys || qualifyingUserKeys.size === 0) {
      return [];
    }
    const targets = selectedPlatforms.map((p) => p.toLowerCase());
    return allConnections.filter((conn) => {
      const key = getUserKey(conn);
      if (!qualifyingUserKeys.has(key)) return false;
      if (showAllForUsers) return true;
      return targets.includes((conn.platform || '').toLowerCase());
    });
  }, [allConnections, selectedPlatforms, qualifyingUserKeys, showAllForUsers, getUserKey]);

  // Count of distinct users matching the criteria
  const matchingUsersCount = React.useMemo(() => {
    if (selectedPlatforms.length === 0) {
      return userPlatformsMap.size;
    }
    return qualifyingUserKeys ? qualifyingUserKeys.size : 0;
  }, [selectedPlatforms, qualifyingUserKeys, userPlatformsMap]);

  // Toggle platform selection (multi-select)
  const handlePlatformClick = (platformName: string) => {
    const target = platformName.toLowerCase();
    setSelectedPlatforms((prev) => {
      if (prev.includes(target)) {
        return prev.filter((p) => p !== target);
      } else {
        return [...prev, target];
      }
    });
  };

  // Remove specific platform from filter
  const handleRemovePlatform = (platformName: string) => {
    const target = platformName.toLowerCase();
    setSelectedPlatforms((prev) => prev.filter((p) => p !== target));
  };

  // Clear all platform selections
  const handleClearPlatforms = () => {
    setSelectedPlatforms([]);
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
                description="Audits all OAuth token associations across LinkedIn, Pinterest, Instagram, Bluesky, Facebook, YouTube, Threads, Telegram, etc. Click any platform cards to multi-select and view users who connected ALL selected platforms."
                example="Click LinkedIn, Instagram, and Bluesky to find users who have connected all 3 platforms."
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

      {/* Stats Cards - Sorted in Descending Order & Multi-Selectable */}
      <MotionBox variant="fade" delay={0.05}>
        <div className="space-y-3">
          <Flex between className="items-center flex-wrap gap-2">
            <Flex align="center" gap={2}>
              <Text size="sm" weight="semibold" color="muted" className="uppercase tracking-wide">
                Connected Channels Distribution
              </Text>
              <SectionGuide
                title="Multi-Platform Selection"
                description="Aggregated count of active OAuth credentials per network provider, sorted in descending order of connection volume. Select multiple cards to filter for users who have connected ALL chosen platforms."
                example="Select LinkedIn and Instagram simultaneously to filter users with both accounts."
              />
            </Flex>
            {selectedPlatforms.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'platform' : 'platforms'} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearPlatforms}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <X className="h-3 w-3" /> Clear selection
                </Button>
              </div>
            )}
          </Flex>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {/* Total Connections Card (stays first, click to reset and show all) */}
            <Card
              onClick={handleClearPlatforms}
              className={cn(
                'cursor-pointer transition-all duration-150 select-none hover:shadow-md hover:border-primary/50 relative overflow-hidden active:scale-[0.98]',
                selectedPlatforms.length === 0
                  ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-sm'
                  : 'hover:bg-muted/30 border-border/60'
              )}
            >
              <CardContent className="pt-5 pb-5">
                <Flex between align="center">
                  <Text size="xs" color="muted" weight="medium">Total Connections</Text>
                  {selectedPlatforms.length === 0 && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20">
                      All Active
                    </Badge>
                  )}
                </Flex>
                <Text size="2xl" weight="bold" className="mt-1 text-foreground">
                  {totalConnections || allConnections.length}
                </Text>
                <Text size="xs" color="muted" className="mt-1">
                  {selectedPlatforms.length === 0 ? 'Showing all platforms' : 'Click to show all'}
                </Text>
              </CardContent>
            </Card>

            {/* Individual Platforms sorted descending by count */}
            {sortedPlatforms.map(([platform, count]) => {
              const isSelected = selectedPlatforms.includes(platform.toLowerCase());
              return (
                <Card
                  key={platform}
                  onClick={() => handlePlatformClick(platform)}
                  className={cn(
                    'cursor-pointer transition-all duration-150 select-none hover:shadow-md relative overflow-hidden active:scale-[0.98]',
                    isSelected
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 shadow-sm'
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
                    <Text size="xs" color={isSelected ? 'foreground' : 'muted'} className="mt-1 truncate text-[11px]">
                      {isSelected ? '✓ In filter (click to remove)' : 'Click to add to filter'}
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
                    description="Displays the connected handle, real user identity (Name, ID, Email), associated workspace, token status, and connection date. When multiple platforms are selected, only users who connected ALL selected platforms are shown."
                    example="Filter by LinkedIn and Instagram to see only accounts belonging to users who connected both."
                  />
                </Flex>

                {selectedPlatforms.length > 0 ? (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-medium mr-0.5">
                        Users having ALL of ({selectedPlatforms.length}):
                      </span>
                      {selectedPlatforms.map((p) => (
                        <Badge
                          key={p}
                          variant="secondary"
                          className="capitalize text-xs py-0.5 px-2 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-medium inline-flex items-center gap-1"
                        >
                          <span>{p}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePlatform(p);
                            }}
                            className="hover:text-destructive hover:bg-black/10 rounded-full p-0.5 transition-colors"
                            title={`Remove ${p} from filter`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleClearPlatforms}
                        className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground ml-1"
                      >
                        Clear filters ({totalConnections} total)
                      </Button>
                    </div>

                    <Flex align="center" gap={3} className="text-xs text-muted-foreground flex-wrap pt-0.5">
                      <Text size="xs" color="muted">
                        Found <strong className="text-foreground">{matchingUsersCount}</strong> {matchingUsersCount === 1 ? 'user' : 'users'} connected to all {selectedPlatforms.length} platforms ({displayedConnections.length} accounts shown)
                      </Text>

                      {matchingUsersCount > 0 && selectedPlatforms.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllForUsers((prev) => !prev)}
                          className="h-6 px-2 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        >
                          {showAllForUsers
                            ? 'Show only selected platform rows'
                            : 'Show all platform accounts for these users'}
                        </Button>
                      )}
                    </Flex>
                  </div>
                ) : (
                  <Text size="xs" color="muted" className="mt-1">
                    Showing all {allConnections.length} active platform connections across all users
                  </Text>
                )}
              </Box>

              <Flex gap={3} align="center" className="flex-wrap">
                {/* Platform Quick Toggle Dropdown */}
                <Select
                  value={selectedPlatforms.length === 1 ? selectedPlatforms[0] : selectedPlatforms.length === 0 ? 'all' : 'multi'}
                  onValueChange={(val) => {
                    if (val === 'all') {
                      setSelectedPlatforms([]);
                    } else if (val !== 'multi') {
                      handlePlatformClick(val);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px] h-9 text-xs">
                    <SelectValue placeholder="Add / toggle platform">
                      {selectedPlatforms.length === 0
                        ? `All Platforms (${totalConnections || allConnections.length})`
                        : selectedPlatforms.length === 1
                        ? `Platform: ${selectedPlatforms[0]}`
                        : `${selectedPlatforms.length} Platforms Selected`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms ({totalConnections || allConnections.length})</SelectItem>
                    {allPlatformOptions.map((p) => {
                      const count = platformStats[p] || 0;
                      const isSel = selectedPlatforms.includes(p.toLowerCase());
                      return (
                        <SelectItem key={p} value={p} className="capitalize">
                          <span className="flex items-center gap-1.5">
                            {isSel && <Check className="h-3 w-3 text-blue-600" />}
                            <span>{p} {count > 0 ? `(${count})` : ''}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
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
            ) : displayedConnections.length === 0 ? (
              <Flex column centerX centerY className="py-16 gap-3">
                <Layers className="h-10 w-10 text-muted-foreground/40" />
                <Text color="foreground" size="base" weight="semibold">
                  {selectedPlatforms.length > 0
                    ? `No users found who have connected ALL ${selectedPlatforms.length} selected platforms`
                    : 'No connections found'}
                </Text>
                {selectedPlatforms.length > 0 && (
                  <Text color="muted" size="sm" className="text-center max-w-md">
                    None of the registered users currently have active connections to all of:{' '}
                    <span className="capitalize font-medium text-foreground">
                      {selectedPlatforms.join(', ')}
                    </span>
                    . Try deselecting one or more platforms to broaden your search.
                  </Text>
                )}
                {selectedPlatforms.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={handleClearPlatforms}>
                      Clear platform filters
                    </Button>
                  </div>
                )}
              </Flex>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left">
                      <th className="py-3 px-3 font-medium text-muted-foreground">Platform</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Account / Username</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Workspace & User Details</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Token Expiry</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground">Connected</th>
                      <th className="py-3 px-3 font-medium text-muted-foreground text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {displayedConnections.map((conn) => {
                      const userKey = getUserKey(conn);
                      const userPlatforms = Array.from(userPlatformsMap.get(userKey) || []);

                      return (
                        <tr key={conn.id} className="hover:bg-muted/30 transition-colors">
                          {/* Platform Badge */}
                          <td className="py-3.5 px-3 font-medium capitalize">
                            <Badge
                              variant="outline"
                              className={cn(
                                'font-medium capitalize text-xs',
                                selectedPlatforms.includes(conn.platform.toLowerCase())
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                  : ''
                              )}
                            >
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
                            <div className="space-y-1 min-w-[220px]">
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

                              {/* All Connected Platforms Badges for this User */}
                              {userPlatforms.length > 1 && (
                                <div className="flex flex-wrap items-center gap-1 pt-1">
                                  <span className="text-[10px] text-muted-foreground">Connected ({userPlatforms.length}):</span>
                                  {userPlatforms.map((p) => {
                                    const isTarget = selectedPlatforms.includes(p);
                                    return (
                                      <Badge
                                        key={p}
                                        variant="outline"
                                        className={cn(
                                          'text-[10px] capitalize px-1 py-0 h-4 leading-none',
                                          isTarget
                                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40 font-semibold'
                                            : 'bg-muted/40 text-muted-foreground border-border/40 font-normal'
                                        )}
                                      >
                                        {p}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
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
                      );
                    })}
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
