'use client';

import * as React from 'react';
import {
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
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

interface PlatformConn {
  id: string;
  workspaceId: string;
  workspaceName: string;
  platform: string;
  username: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function PlatformConnectionsPage() {
  const [connections, setConnections] = React.useState<PlatformConn[]>([]);
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
    if (!confirm(`Are you sure you want to disconnect ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/platforms?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to disconnect');
      await fetchConnections();
    } catch {
      alert('Failed to disconnect account');
    }
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <MotionBox variant="fade">
        <Flex between className="items-center">
          <Box>
            <Text size="2xl" weight="bold" color="foreground">
              Platform Connections
            </Text>
            <Text size="sm" color="muted">
              Monitor and manage all connected social media accounts across workspaces
            </Text>
          </Box>
          <Button variant="outline" size="sm" onClick={fetchConnections}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </Flex>
      </MotionBox>

      {/* Stats Cards */}
      <MotionBox variant="fade" delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Text size="xs" color="muted">Total Connections</Text>
              <Text size="2xl" weight="bold" className="mt-1">{connections.length}</Text>
            </CardContent>
          </Card>
          {Object.entries(platformStats).map(([platform, count]) => (
            <Card key={platform}>
              <CardContent className="pt-6">
                <Text size="xs" color="muted" className="capitalize">{platform}</Text>
                <Text size="2xl" weight="bold" className="mt-1">{count}</Text>
              </CardContent>
            </Card>
          ))}
        </div>
      </MotionBox>

      {/* Filters & Table */}
      <MotionBox variant="fade" delay={0.1}>
        <Card>
          <CardHeader>
            <Flex between className="items-center flex-wrap gap-4">
              <CardTitle>Connected Accounts</CardTitle>
              <Flex gap={3}>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="pinterest">Pinterest</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
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
          <CardContent>
            {loading ? (
              <Flex centerX centerY className="py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </Flex>
            ) : connections.length === 0 ? (
              <Flex centerX centerY className="py-12">
                <Text color="muted">No platform connections found</Text>
              </Flex>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-2 font-medium text-muted-foreground">Platform</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Account / Username</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Workspace</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Token Expiry</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Connected</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((conn) => (
                      <tr key={conn.id} className="border-b hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-2 font-medium capitalize">
                          <Badge variant="outline">{conn.platform}</Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Text weight="medium">@{conn.username}</Text>
                        </td>
                        <td className="py-3 px-2">
                          <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                            <a href={`/admin/workspaces/${conn.workspaceId}`}>
                              {conn.workspaceName} <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            className={cn(
                              'text-xs capitalize',
                              conn.status === 'connected'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            )}
                          >
                            {conn.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground">
                          {conn.expiresAt ? new Date(conn.expiresAt).toLocaleDateString() : 'Never / Long-lived'}
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground">
                          {new Date(conn.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(conn.id, `@${conn.username}`)}
                            className="text-destructive hover:text-destructive"
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

