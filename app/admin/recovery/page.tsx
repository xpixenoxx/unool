'use client';

import * as React from 'react';
import {
  RotateCcw,
  Trash2,
  Ban,
  Search,
  RefreshCw,
  ExternalLink,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  User as UserIcon,
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
  Button,
  Badge,
  Input,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui';
import { SectionGuide } from '@/components/admin/section-guide';

interface RecoverableItem {
  id: string;
  type: 'deleted' | 'suspended';
  profileId: string | null;
  userId: string;
  subdomain: string | null;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  workspaceId: string | null;
  reason: string;
  timestamp: string;
}

let cachedRecoveryItems: RecoverableItem[] | null = null;

export default function AdminRecoveryPage() {
  const [items, setItems] = React.useState<RecoverableItem[]>(cachedRecoveryItems || []);
  const [loading, setLoading] = React.useState(!cachedRecoveryItems);
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'deleted' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [recoveringId, setRecoveringId] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchItems = React.useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    else if (!cachedRecoveryItems) setLoading(true);
    try {
      const res = await fetch('/api/admin/recovery');
      if (res.ok) {
        const data = await res.json();
        const list = data.items || [];
        setItems(list);
        cachedRecoveryItems = list;
      } else {
        console.error('Failed to load recovery items');
      }
    } catch (err) {
      console.error('Failed to fetch recovery items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchItems(false);
  }, [fetchItems]);

  const handleRecover = async (item: RecoverableItem) => {
    const confirmationText =
      item.type === 'deleted'
        ? `Are you sure you want to recover profile "${item.name || item.subdomain}"? This will restore public access and un-delete the profile.`
        : `Are you sure you want to unsuspend user "${item.email}"? This will lift the login ban and restore active access.`;

    if (!confirm(confirmationText)) return;

    setRecoveringId(item.id);
    setActionMessage(null);

    try {
      const res = await fetch('/api/admin/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: item.profileId,
          userId: item.userId,
          type: item.type,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Recovery failed');
      }

      setActionMessage({
        type: 'success',
        text: `Successfully recovered ${item.type === 'deleted' ? 'profile' : 'account'} for ${item.name || item.email}!`,
      });

      // Remove recovered item from state immediately for responsive feel
      setItems((prev) => prev.filter((i) => i.id !== item.id));

      // Refresh in background
      setTimeout(() => fetchItems(false), 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to recover account/profile';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setRecoveringId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesFilter;
    const matchesQuery =
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.subdomain && item.subdomain.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.userId && item.userId.toLowerCase().includes(query)) ||
      (item.profileId && item.profileId.toLowerCase().includes(query));
    return matchesFilter && matchesQuery;
  });

  const deletedCount = items.filter((i) => i.type === 'deleted').length;
  const suspendedCount = items.filter((i) => i.type === 'suspended').length;

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Flex between className="flex-wrap gap-4 items-center">
        <Box>
          <Flex align="center" gap={2}>
            <Text size="3xl" weight="bold">
              Account & Profile Recovery
            </Text>
            <SectionGuide
              title="Profile & Account Recovery"
              description="A central console for restoring soft-deleted creator profiles and lifting account suspensions. Recovering restores full public visibility, subdomains, and user login capabilities."
              example="Deleted Profile: @samuel (deleted 2 days ago)\nSuspended Account: alex@startup.io (banned by admin)\nClick 'Recover' to instantly reinstate them."
            />
          </Flex>
          <Text color="muted">
            Recover deleted profiles and restore suspended creator accounts
          </Text>
        </Box>

        <Flex gap={2} align="center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchItems(true)}
            disabled={refreshing}
            className="h-9 gap-1.5"
            title="Refresh recovery items"
          >
            <RefreshCw className={refreshing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
            <span>Refresh</span>
          </Button>
        </Flex>
      </Flex>

      {/* Action Notification Banner */}
      {actionMessage && (
        <Box
          className={`p-4 rounded-xl flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
          }`}
        >
          <Flex align="center" gap={2}>
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <Text size="sm" weight="medium">
              {actionMessage.text}
            </Text>
          </Flex>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionMessage(null)}
            className="h-7 px-2 text-xs"
          >
            Dismiss
          </Button>
        </Box>
      )}

      {/* Summary KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card variant="analytics" padding="md">
          <Flex between className="items-center">
            <Box>
              <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wider">
                Total In Recovery
              </Text>
              <Text size="2xl" weight="bold" className="mt-1">
                {items.length}
              </Text>
            </Box>
            <Box className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <RotateCcw className="h-5 w-5" />
            </Box>
          </Flex>
        </Card>

        <Card variant="analytics" padding="md">
          <Flex between className="items-center">
            <Box>
              <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wider">
                Deleted Accounts & Profiles
              </Text>
              <Text size="2xl" weight="bold" className="mt-1 text-rose-600 dark:text-rose-400">
                {deletedCount}
              </Text>
            </Box>
            <Box className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <Trash2 className="h-5 w-5" />
            </Box>
          </Flex>
        </Card>

        <Card variant="analytics" padding="md">
          <Flex between className="items-center">
            <Box>
              <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wider">
                Suspended Accounts
              </Text>
              <Text size="2xl" weight="bold" className="mt-1 text-amber-600 dark:text-amber-400">
                {suspendedCount}
              </Text>
            </Box>
            <Box className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Ban className="h-5 w-5" />
            </Box>
          </Flex>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Flex between className="gap-3 flex-wrap items-center">
        <Flex gap={2} className="flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Items ({items.length})
          </Button>
          <Button
            variant={filter === 'deleted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('deleted')}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Deleted Profiles ({deletedCount})
          </Button>
          <Button
            variant={filter === 'suspended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('suspended')}
            className="gap-1.5"
          >
            <Ban className="h-3.5 w-3.5" />
            Suspended Accounts ({suspendedCount})
          </Button>
        </Flex>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, subdomain, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </Flex>

      {/* Main Table Card */}
      <Card variant="default" padding="none">
        <CardHeader className="px-6 py-4 border-b">
          <Flex between className="items-center">
            <Box>
              <CardTitle>Recoverable Profiles & Accounts</CardTitle>
              <CardDescription>
                Click &quot;Recover&quot; to restore a deleted profile or unsuspend a locked user account.
              </CardDescription>
            </Box>
            <Badge variant="outline" className="text-xs">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </Flex>
        </CardHeader>
        <CardContent className="p-0">
          <Box className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Profile / User</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Subdomain</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type & Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Reason</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                      <Flex align="center" column gap={2} className="justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        <Text size="sm" color="muted">Loading recovery items...</Text>
                      </Flex>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Flex column align="center" gap={3}>
                        <Box className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
                          <ShieldCheck className="h-6 w-6" />
                        </Box>
                        <Box>
                          <Text weight="medium" size="base">
                            No {filter === 'all' ? 'deleted or suspended' : filter} items found
                          </Text>
                          <Text size="sm" color="muted" className="mt-1 max-w-md">
                            All user profiles and accounts are currently in active, healthy standing. When profiles are deleted or users are suspended, they will appear here ready for one-click recovery.
                          </Text>
                        </Box>
                      </Flex>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isRecovering = recoveringId === item.id;
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                        {/* Profile / User Info */}
                        <td className="p-4">
                          <Flex align="center" gap={3} className="min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage
                                src={
                                  item.avatarUrl ||
                                  `https://api.dicebear.com/7.x/identicon/svg?seed=${item.profileId || item.userId}`
                                }
                                alt={item.name || item.email}
                              />
                              <AvatarFallback>
                                {(item.name || item.email).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <Box className="min-w-0">
                              <Text weight="medium" className="truncate">
                                {item.name || item.email}
                              </Text>
                              <Text size="xs" color="muted" className="truncate">
                                {item.email}
                              </Text>
                              <Text size="xs" color="muted" className="font-mono truncate text-[11px]">
                                UID: {item.userId.substring(0, 8)}...
                              </Text>
                            </Box>
                          </Flex>
                        </td>

                        {/* Subdomain */}
                        <td className="p-4">
                          {item.subdomain ? (
                            <Flex align="center" gap={1.5}>
                              <Badge variant="outline" size="sm" className="font-mono">
                                @{item.subdomain}
                              </Badge>
                              <a
                                href={`/u/${item.subdomain}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                                title={`Preview URL /u/${item.subdomain}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Flex>
                          ) : (
                            <Text size="xs" color="muted">—</Text>
                          )}
                        </td>

                        {/* Type & Status */}
                        <td className="p-4">
                          {item.type === 'deleted' ? (
                            <Badge
                              variant="outline"
                              size="sm"
                              className="border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 gap-1"
                            >
                              <Trash2 className="h-3 w-3" /> {item.profileId ? 'Deleted Profile' : 'Deleted Account'}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              size="sm"
                              className="border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 gap-1"
                            >
                              <Ban className="h-3 w-3" /> Suspended Account
                            </Badge>
                          )}
                        </td>

                        {/* Reason */}
                        <td className="p-4">
                          <Text size="xs" color="muted" className="max-w-[200px] truncate">
                            {item.reason}
                          </Text>
                        </td>

                        {/* Timestamp */}
                        <td className="p-4">
                          <Text size="xs" color="muted">
                            {new Date(item.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                        </td>

                        {/* Recover Action */}
                        <td className="p-4 text-right">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isRecovering}
                            onClick={() => handleRecover(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 gap-1.5 h-8 text-xs font-medium shadow-sm"
                            title={`Recover ${item.name || item.email}`}
                          >
                            <RotateCcw className={isRecovering ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
                            <span>{isRecovering ? 'Recovering...' : 'Recover'}</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
