'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Hash,
  FileText,
  Loader2,
  Download,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';
import { useState, useEffect, useMemo } from 'react';

interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: string;
  targetUserEmail?: string | null;
  targetUserName?: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: Record<string, boolean>;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const actionColors: Record<string, string> = {
  admin_user_create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  admin_user_update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  admin_user_delete: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
  plan_create: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  plan_update: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  plan_delete: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
  plan_override_create: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  plan_override_remove: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  workspace_plan_update: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  workspace_status_update: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  subscription_change_plan: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  subscription_plan_change: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  subscription_cancel: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
  user_suspend: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  user_unsuspend: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  user_create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  user_update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  user_delete: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
  impersonate: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

function formatAction(action: string): string {
  return action
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmountPaise(paise: unknown): string | null {
  if (typeof paise !== 'number' || isNaN(paise)) return null;
  const inr = Math.round(paise / 100);
  return `₹${inr.toLocaleString('en-IN')}`;
}

function getLogUserInfo(log: AdminAuditLog) {
  const meta = log.metadata || {};
  const email =
    log.targetUserEmail ||
    (meta.userEmail as string) ||
    (meta.targetEmail as string) ||
    (meta.email as string) ||
    null;
  const name =
    log.targetUserName ||
    (meta.userName as string) ||
    (meta.name as string) ||
    null;
  const workspaceName = (meta.workspaceName as string) || null;
  return { email, name, workspaceName };
}

function getChangeSummaryText(log: AdminAuditLog): string {
  const meta = log.metadata || {};
  switch (log.action) {
    case 'user_suspend': {
      const reason = (meta.reason as string) || 'Suspended by admin';
      const duration = meta.isPermanent ? 'Permanent' : meta.durationHours ? `${meta.durationHours}h ban` : '';
      return `Suspended: ${reason}${duration ? ` (${duration})` : ''}`;
    }
    case 'user_unsuspend':
      return 'Suspension lifted • Access restored';
    case 'subscription_change_plan':
    case 'subscription_plan_change': {
      const oldPlan = (meta.oldPlanId || meta.oldPlan || '') as string;
      const newPlan = (meta.newPlanId || meta.newPlan || '') as string;
      const oldAmt = formatAmountPaise(meta.oldAmountPaise);
      const newAmt = formatAmountPaise(meta.newAmountPaise);
      const diff = oldPlan && newPlan ? `${oldPlan} → ${newPlan}` : '';
      const priceDiff = oldAmt && newAmt ? ` (${oldAmt} → ${newAmt})` : '';
      return `Plan changed: ${diff}${priceDiff}`;
    }
    case 'plan_override_create': {
      const price = meta.customMonthlyInr ? `₹${meta.customMonthlyInr}/mo` : '';
      const plan = (meta.planId as string) || '';
      return `Override created: ${price}${plan ? ` for ${plan}` : ''}`;
    }
    case 'plan_override_remove':
      return 'Override removed • Reset to standard catalog rate';
    case 'workspace_plan_update':
      return `Workspace plan: ${(meta.oldPlan as string) || ''} → ${(meta.newPlan as string) || ''}`;
    case 'user_delete':
      return `Deleted • Reason: ${(meta.reason as string) || 'Admin action'}`;
    default:
      return (meta.reason as string) || '';
  }
}

function renderAuditChange(log: AdminAuditLog) {
  const meta = log.metadata || {};
  const { action } = log;

  switch (action) {
    case 'user_suspend': {
      const reason = (meta.reason as string) || 'Suspended by admin';
      const isPermanent = meta.isPermanent === true;
      const durationHours = meta.durationHours as number | undefined;
      return (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded px-2 py-0.5 w-fit flex-wrap">
          <ShieldAlert className="h-3 w-3 flex-shrink-0" />
          <span>
            Reason: <strong className="font-semibold">{reason}</strong>
          </span>
          <span className="opacity-40">•</span>
          <span className="font-medium">
            {isPermanent ? 'Permanent' : durationHours ? `${durationHours}h ban` : 'Temporary'}
          </span>
        </div>
      );
    }

    case 'user_unsuspend': {
      return (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded px-2 py-0.5 w-fit">
          <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
          <span>Suspension lifted • Access restored</span>
        </div>
      );
    }

    case 'subscription_change_plan':
    case 'subscription_plan_change': {
      const oldPlan = (meta.oldPlanId || meta.oldPlan || '') as string;
      const newPlan = (meta.newPlanId || meta.newPlan || '') as string;
      const oldAmt = formatAmountPaise(meta.oldAmountPaise);
      const newAmt = formatAmountPaise(meta.newAmountPaise);
      const reason = meta.reason as string | undefined;

      return (
        <div className="mt-1 flex items-center gap-1.5 text-xs bg-muted/60 border rounded px-2 py-0.5 w-fit flex-wrap">
          {oldPlan && newPlan && (
            <span className="font-semibold capitalize flex items-center gap-1">
              {oldPlan} <ArrowRight className="h-3 w-3 text-muted-foreground inline" /> {newPlan}
            </span>
          )}
          {oldAmt && newAmt && (
            <span className="text-primary font-medium">
              ({oldAmt} → {newAmt})
            </span>
          )}
          {reason && <span className="text-muted-foreground italic">"{reason}"</span>}
        </div>
      );
    }

    case 'subscription_cancel': {
      const reason = meta.reason as string | undefined;
      return (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded px-2 py-0.5 w-fit">
          <span>Subscription cancelled {reason ? `• "${reason}"` : ''}</span>
        </div>
      );
    }

    case 'plan_override_create': {
      const monthlyInr = meta.customMonthlyInr ? `₹${meta.customMonthlyInr}/mo` : null;
      const planId = (meta.planId || '') as string;
      return (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded px-2 py-0.5 w-fit">
          <Sparkles className="h-3 w-3 flex-shrink-0" />
          <span>
            Custom override: <strong>{monthlyInr || 'Custom pricing'}</strong>
            {planId ? ` for ${planId}` : ''}
          </span>
        </div>
      );
    }

    case 'plan_override_remove': {
      const planId = (meta.planId || '') as string;
      return (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded px-2 py-0.5 w-fit">
          <span>Custom override removed {planId ? `(${planId})` : ''} • Reset to standard</span>
        </div>
      );
    }

    case 'workspace_plan_update': {
      const oldPlan = (meta.oldPlan || '') as string;
      const newPlan = (meta.newPlan || '') as string;
      const reason = meta.reason as string | undefined;
      return (
        <div className="mt-1 flex items-center gap-1.5 text-xs bg-muted/60 border rounded px-2 py-0.5 w-fit flex-wrap">
          <span className="font-semibold capitalize flex items-center gap-1">
            {oldPlan} <ArrowRight className="h-3 w-3 text-muted-foreground inline" /> {newPlan}
          </span>
          {reason && <span className="text-muted-foreground italic">• "{reason}"</span>}
        </div>
      );
    }

    case 'user_delete': {
      const reason = (meta.reason as string) || 'Deleted by admin';
      return (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-0.5 w-fit">
          <span>Deleted • Reason: "{reason}"</span>
        </div>
      );
    }

    case 'impersonate': {
      return (
        <div className="mt-1 text-xs text-muted-foreground">
          Impersonation session launched
        </div>
      );
    }

    default: {
      if (meta.reason && typeof meta.reason === 'string') {
        return (
          <div className="mt-1 text-xs text-muted-foreground italic">
            Reason: "{meta.reason}"
          </div>
        );
      }
      return null;
    }
  }
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <Text size="sm" color="muted">Page {page} of {totalPages}</Text>
      <Flex gap={2}>
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Flex>
    </div>
  );
}

function LogTable({
  logs,
  loading,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  adminUsers,
}: {
  logs: AdminAuditLog[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  adminUsers: AdminUser[];
}) {
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const userMap = useMemo(() => new Map(adminUsers.map(u => [u.id, u])), [adminUsers]);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedLogs = logs.slice(start, end);

  return (
    <>
      <Card variant="default" padding="none">
        <CardHeader className="px-6 py-4 border-b">
          <Flex between className="flex-wrap gap-4 items-center">
            <Flex align="center" gap={2}>
              <CardTitle>Audit Log Records</CardTitle>
              <SectionGuide
                title="Audit Log Records"
                description="Chronological record of every administrative action executed across the panel. Tracks exact user targets, change reasons/plan diffs, admin emails, and audit metadata."
                example="Action: Subscription Change Plan\nTarget: Alex (alex@agency.com)\nDiff: 1000 -> 900 (spark -> pro)\nAdmin: usha@pixenox.com"
              />
            </Flex>
            <Flex gap={3} className="items-center">
              <Select value={String(pageSize)} onValueChange={v => { onPageSizeChange(Number(v)); onPageChange(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => {
                const csv = [
                  ['ID', 'Action', 'Target Type', 'Target ID', 'Target User Email', 'Target User Name', 'Change Summary', 'Admin User', 'Date', 'IP Hash', 'Metadata'].join(','),
                  ...paginatedLogs.map(log => {
                    const userInfo = getLogUserInfo(log);
                    return [
                      log.id,
                      log.action,
                      log.targetType,
                      log.targetId || '',
                      userInfo.email || '',
                      userInfo.name || '',
                      `"${getChangeSummaryText(log).replace(/"/g, '""')}"`,
                      userMap.get(log.adminUserId)?.email || 'Unknown',
                      log.createdAt,
                      log.ipHash || '',
                      JSON.stringify(log.metadata).replace(/"/g, '""'),
                    ].join(',');
                  })
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }} title="Export CSV">
                <Download className="h-4 w-4" />
              </Button>
            </Flex>
          </Flex>
        </CardHeader>
        <CardContent className="p-0">
          <Box className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[180px]">Action</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Target & What Changed</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[180px]">Admin</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[160px]">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px]">IP</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[90px]">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading && !paginatedLogs.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No audit log entries found</td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const admin = userMap.get(log.adminUserId);
                    const userInfo = getLogUserInfo(log);
                    return (
                      <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4 align-top">
                          <Badge
                            variant="outline"
                            size="sm"
                            className={actionColors[log.action] || 'bg-muted text-muted-foreground'}
                          >
                            {formatAction(log.action)}
                          </Badge>
                        </td>
                        <td className="p-4 align-top">
                          <Box className="space-y-1">
                            <Flex align="center" gap={2} style={{ flexWrap: 'wrap' }}>
                              <Badge variant="secondary" size="sm" className="font-mono text-[11px] uppercase tracking-wider">
                                {log.targetType}
                              </Badge>
                              {userInfo.email ? (
                                <Flex align="center" gap={1.5} className="flex-wrap">
                                  <Text size="sm" weight="medium" className="text-foreground">
                                    {userInfo.name ? `${userInfo.name} ` : ''}
                                    <span className="text-muted-foreground font-normal">({userInfo.email})</span>
                                  </Text>
                                  {userInfo.workspaceName && (
                                    <Badge variant="outline" size="sm" className="text-[11px]">
                                      ws: {userInfo.workspaceName}
                                    </Badge>
                                  )}
                                </Flex>
                              ) : log.targetId ? (
                                <Text size="sm" color="muted" className="font-mono truncate max-w-xs" title={log.targetId}>
                                  {log.targetId}
                                </Text>
                              ) : (
                                <Text size="sm" color="muted">Global / System</Text>
                              )}
                            </Flex>

                            {userInfo.email && log.targetId && (
                              <div className="text-[11px] text-muted-foreground/60 font-mono">
                                id: {log.targetId}
                              </div>
                            )}

                            {renderAuditChange(log)}
                          </Box>
                        </td>
                        <td className="p-4 align-top">
                          <Flex align="center" gap={2}>
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Text size="sm" className="truncate max-w-[160px]" title={admin?.email || 'Unknown'}>
                              {admin?.email || 'Unknown'}
                            </Text>
                          </Flex>
                        </td>
                        <td className="p-4 align-top">
                          <Flex align="center" gap={2}>
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Text size="sm" color="muted">{formatDate(log.createdAt)}</Text>
                          </Flex>
                        </td>
                        <td className="p-4 align-top">
                          <Flex align="center" gap={2}>
                            <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Text size="xs" color="muted" className="font-mono">{log.ipHash || 'N/A'}</Text>
                          </Flex>
                        </td>
                        <td className="p-4 text-right align-top">
                          <Flex align="center" end gap={1}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedLog(log)}
                              title="View full audit metadata"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(log.metadata, null, 2));
                                alert('Metadata copied to clipboard');
                              }}
                              title="Copy JSON metadata"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Flex>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Box>
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </CardContent>
      </Card>

      {/* Metadata Detail Dialog */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={open => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Audit Log Details</span>
              {selectedLog && (
                <Badge variant="outline" className={actionColors[selectedLog.action]}>
                  {formatAction(selectedLog.action)}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Recorded on {selectedLog ? formatDate(selectedLog.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <Box className="space-y-4 text-sm mt-2">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border text-xs">
                <div>
                  <span className="text-muted-foreground block">Target Type:</span>
                  <span className="font-medium">{selectedLog.targetType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Target ID:</span>
                  <span className="font-mono truncate block">{selectedLog.targetId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Target User:</span>
                  <span className="font-medium text-primary">
                    {getLogUserInfo(selectedLog).email || 'Unresolved'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Admin User:</span>
                  <span className="font-medium">{userMap.get(selectedLog.adminUserId)?.email || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">IP Hash:</span>
                  <span className="font-mono">{selectedLog.ipHash || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">User Agent:</span>
                  <span className="truncate block" title={selectedLog.userAgent || ''}>{selectedLog.userAgent || 'N/A'}</span>
                </div>
              </div>

              <div>
                <Flex between className="mb-1.5 items-center">
                  <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Change Metadata</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedLog.metadata, null, 2));
                      alert('Copied metadata to clipboard');
                    }}
                  >
                    Copy JSON
                  </Button>
                </Flex>
                <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-60 border">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, usersRes] = await Promise.all([
        fetch('/api/admin/audit?limit=500', { credentials: 'include' }),
        fetch('/api/admin/users?pageSize=200', { credentials: 'include' }),
      ]);
      if (!logsRes.ok) throw new Error('Failed to fetch audit logs');
      if (!usersRes.ok) throw new Error('Failed to fetch admin users');
      const logsData = await logsRes.json();
      const usersData = await usersRes.json();
      setLogs(logsData || []);
      setAdminUsers(usersData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering enriched with target user and summary search
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(log => {
      const userInfo = getLogUserInfo(log);
      const summary = getChangeSummaryText(log).toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.targetType.toLowerCase().includes(q) ||
        log.targetId?.toLowerCase().includes(q) ||
        userInfo.email?.toLowerCase().includes(q) ||
        userInfo.name?.toLowerCase().includes(q) ||
        userInfo.workspaceName?.toLowerCase().includes(q) ||
        summary.includes(q) ||
        JSON.stringify(log.metadata).toLowerCase().includes(q) ||
        log.ipHash?.toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery]);

  if (loading && !logs.length) {
    return (
      <MotionBox variant="fade">
        <Box className="space-y-6">
          <Flex between>
            <Box>
              <Text size="3xl" weight="bold">Audit Log</Text>
              <Text color="muted">Track all administrative actions</Text>
            </Box>
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

  return (
    <MotionBox variant="fade" className="space-y-6">
      <Flex between className="flex-wrap gap-4 items-center">
        <Box>
          <Flex align="center" gap={2}>
            <Text size="3xl" weight="bold">Security Audit Log</Text>
            <SectionGuide
              title="Security & Compliance Audit"
              description="Immutable security log verifying every modification executed in the admin system. Meets SOC2 compliance requirements. Metadata includes exact before/after states of changed entities."
              example="Filter by user email, 'user_suspend', or 'subscription_change_plan' to trace who made specific changes and when."
            />
          </Flex>
          <Text color="muted">Track all administrative actions across the platform</Text>
        </Box>
        <Flex gap={3} className="items-center">
          <Input
            placeholder="Search by action, user email, reason..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-80"
          />
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Card variant="error" padding="md">
          <CardContent className="flex items-center justify-between">
            <Text color="destructive">Error: {error}</Text>
            <Button variant="ghost" size="sm" onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      )}

      <LogTable
        logs={filteredLogs}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalPages={Math.ceil(filteredLogs.length / pageSize)}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        adminUsers={adminUsers}
      />
    </MotionBox>
  );
}
