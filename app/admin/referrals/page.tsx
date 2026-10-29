'use client';

import * as React from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Users,
  Link as LinkIcon,
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
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';
import { SectionGuide } from '@/components/admin/section-guide';

interface ReferralCodeItem {
  id: string;
  userId: string;
  workspaceId: string;
  workspaceName?: string;
  code: string;
  clickCount: number;
  signupCount: number;
  conversionCount: number;
  rewardsEarned: number;
  monthsEarned: number;
  createdAt: string;
}

interface ReferralItem {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  status: 'signed_up' | 'converted' | 'rewarded';
  rewardType: string | null;
  rewardAppliedAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  signed_up: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  converted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  rewarded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function ReferralsAdminPage() {
  const [activeTab, setActiveTab] = React.useState('codes');

  // Codes state
  const [codes, setCodes] = React.useState<ReferralCodeItem[]>([]);
  const [codesLoading, setCodesLoading] = React.useState(true);
  const [codesTotal, setCodesTotal] = React.useState(0);
  const [codesPage, setCodesPage] = React.useState(1);
  const [codesSearch, setCodesSearch] = React.useState('');

  // Log state
  const [log, setLog] = React.useState<ReferralItem[]>([]);
  const [logLoading, setLogLoading] = React.useState(true);
  const [logTotal, setLogTotal] = React.useState(0);
  const [logPage, setLogPage] = React.useState(1);

  const fetchCodes = React.useCallback(async () => {
    setCodesLoading(true);
    try {
      const params = new URLSearchParams({
        view: 'codes',
        page: codesPage.toString(),
        pageSize: '20',
      });
      if (codesSearch) params.set('search', codesSearch);

      const res = await fetch(`/api/admin/referrals?${params}`);
      const data = await res.json();
      setCodes(data.data || []);
      setCodesTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch referral codes:', err);
    } finally {
      setCodesLoading(false);
    }
  }, [codesPage, codesSearch]);

  const fetchLog = React.useCallback(async () => {
    setLogLoading(true);
    try {
      const params = new URLSearchParams({
        view: 'log',
        page: logPage.toString(),
        pageSize: '20',
      });

      const res = await fetch(`/api/admin/referrals?${params}`);
      const data = await res.json();
      setLog(data.data || []);
      setLogTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch referrals log:', err);
    } finally {
      setLogLoading(false);
    }
  }, [logPage]);

  React.useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  React.useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  // Aggregate summary metrics
  const totalSignups = codes.reduce((acc, c) => acc + (c.signupCount || 0), 0);
  const totalConversions = codes.reduce((acc, c) => acc + (c.conversionCount || 0), 0);
  const totalMonthsEarned = codes.reduce((acc, c) => acc + (c.monthsEarned || 0), 0);

  return (
    <Box className="space-y-6">
      {/* Header */}
      <MotionBox variant="fade">
        <Flex between className="items-center">
          <Box>
            <Flex align="center" gap={2}>
              <Text size="2xl" weight="bold" color="foreground">
                Referral Management
              </Text>
              <SectionGuide
                title="Referral & Affiliate Engine"
                description="Tracks user invitation links (unool.co?ref=CODE), signup tracking, and subscription conversions. Successful conversions automatically reward the referrer with free bonus months."
                example="Referral: USHA10 -> 40 clicks -> 8 signups -> 2 paid conversions -> 2 free months awarded."
              />
            </Flex>
            <Text size="sm" color="muted">
              Track affiliate codes, referral conversions, and rewarded free months
            </Text>
          </Box>
          <Button variant="outline" size="sm" onClick={() => { fetchCodes(); fetchLog(); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </Flex>
      </MotionBox>

      {/* Metrics Cards */}
      <MotionBox variant="fade" delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Flex align="center" gap={1.5}>
                <Text size="xs" color="muted">Active Codes</Text>
                <SectionGuide
                  title="Active Codes"
                  description="Number of personalized referral links created by users."
                  example="42 total referral links generated"
                />
              </Flex>
              <Text size="2xl" weight="bold" className="mt-1">{codesTotal}</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Flex align="center" gap={1.5}>
                <Text size="xs" color="muted">Total Signups</Text>
                <SectionGuide
                  title="Referred Signups"
                  description="Users who registered with an active referral cookie attached."
                  example="118 users registered through invite links"
                />
              </Flex>
              <Text size="2xl" weight="bold" className="mt-1 text-blue-600 dark:text-blue-400">{totalSignups}</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Flex align="center" gap={1.5}>
                <Text size="xs" color="muted">Paid Conversions</Text>
                <SectionGuide
                  title="Paid Conversions"
                  description="Referred users who purchased a paid monthly or annual subscription."
                  example="24 users upgraded to Creator or Pro"
                />
              </Flex>
              <Text size="2xl" weight="bold" className="mt-1 text-green-600 dark:text-green-400">{totalConversions}</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Flex align="center" gap={1.5}>
                <Text size="xs" color="muted">Free Months Rewarded</Text>
                <SectionGuide
                  title="Months Rewarded"
                  description="Total subscription period extensions credited to affiliates."
                  example="24 free months credited to referrers"
                />
              </Flex>
              <Text size="2xl" weight="bold" className="mt-1 text-purple-600 dark:text-purple-400">{totalMonthsEarned}</Text>
            </CardContent>
          </Card>
        </div>
      </MotionBox>

      {/* Tabs */}
      <MotionBox variant="fade" delay={0.1}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="codes" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Referral Codes ({codesTotal})
            </TabsTrigger>
            <TabsTrigger value="log" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Referrals Log ({logTotal})
            </TabsTrigger>
          </TabsList>

          {/* Codes Tab */}
          <TabsContent value="codes">
            <Card>
              <CardHeader>
                <Flex between className="items-center flex-wrap gap-4">
                  <Flex align="center" gap={2}>
                    <CardTitle>Referral Codes</CardTitle>
                    <SectionGuide
                      title="Codes Table"
                      description="Displays each user's unique referral link with engagement funnel metrics: clicks -> signups -> conversions."
                      example="Code: USHA2026\nClicks: 240\nSignups: 32\nPaid: 5"
                    />
                  </Flex>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search code..."
                      className="pl-10"
                      value={codesSearch}
                      onChange={(e) => {
                        setCodesSearch(e.target.value);
                        setCodesPage(1);
                      }}
                    />
                  </div>
                </Flex>
              </CardHeader>
              <CardContent>
                {codesLoading ? (
                  <Flex centerX centerY className="py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </Flex>
                ) : codes.length === 0 ? (
                  <Flex centerX centerY className="py-12">
                    <Text color="muted">No referral codes found</Text>
                  </Flex>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 px-2 font-medium text-muted-foreground">Code</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Workspace</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Clicks</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Signups</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Conversions</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Months Earned</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codes.map((c) => (
                          <tr key={c.id} className="border-b hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-2 font-mono font-bold text-primary">{c.code}</td>
                            <td className="py-3 px-2">{c.workspaceName || c.workspaceId.slice(0, 8)}</td>
                            <td className="py-3 px-2">{c.clickCount}</td>
                            <td className="py-3 px-2 font-medium">{c.signupCount}</td>
                            <td className="py-3 px-2 font-medium text-green-600 dark:text-green-400">
                              {c.conversionCount}
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant="outline">{c.monthsEarned} mo</Badge>
                            </td>
                            <td className="py-3 px-2 text-xs text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {codesTotal > 20 && (
                  <Flex between className="items-center px-4 py-3 border-t">
                    <Text size="sm" color="muted">
                      Showing {(codesPage - 1) * 20 + 1} to {Math.min(codesPage * 20, codesTotal)} of {codesTotal} codes
                    </Text>
                    <Flex gap={2}>
                      <Button variant="outline" size="sm" disabled={codesPage === 1} onClick={() => setCodesPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={codesPage * 20 >= codesTotal} onClick={() => setCodesPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Flex>
                  </Flex>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Log Tab */}
          <TabsContent value="log">
            <Card>
              <CardHeader>
                <Flex align="center" gap={2}>
                  <CardTitle>Referral Events</CardTitle>
                  <SectionGuide
                    title="Audit Log of Referrals"
                    description="Individual records matching who referred whom, their current lifecycle status, and whether the free month reward has been dispatched."
                    example="Referrer: 8fa9... | Referred: c012... | Status: rewarded"
                  />
                </Flex>
              </CardHeader>
              <CardContent>
                {logLoading ? (
                  <Flex centerX centerY className="py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </Flex>
                ) : log.length === 0 ? (
                  <Flex centerX centerY className="py-12">
                    <Text color="muted">No referral events found</Text>
                  </Flex>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 px-2 font-medium text-muted-foreground">Referral Code</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Referrer User</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Referred User</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Status</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Reward Type</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Reward Applied</th>
                          <th className="py-3 px-2 font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {log.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-2 font-mono font-bold text-primary">{item.referralCode}</td>
                            <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{item.referrerUserId.slice(0, 8)}...</td>
                            <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{item.referredUserId.slice(0, 8)}...</td>
                            <td className="py-3 px-2">
                              <Badge className={cn('text-xs capitalize', statusColors[item.status])}>
                                {item.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-xs">{item.rewardType || '—'}</td>
                            <td className="py-3 px-2 text-xs text-muted-foreground">
                              {item.rewardAppliedAt ? new Date(item.rewardAppliedAt).toLocaleDateString() : 'Pending'}
                            </td>
                            <td className="py-3 px-2 text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {logTotal > 20 && (
                  <Flex between className="items-center px-4 py-3 border-t">
                    <Text size="sm" color="muted">
                      Showing {(logPage - 1) * 20 + 1} to {Math.min(logPage * 20, logTotal)} of {logTotal} events
                    </Text>
                    <Flex gap={2}>
                      <Button variant="outline" size="sm" disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={logPage * 20 >= logTotal} onClick={() => setLogPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Flex>
                  </Flex>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionBox>
    </Box>
  );
}
