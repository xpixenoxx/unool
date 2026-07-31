'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, AlertCircle, CreditCard, ArrowUpRight, Loader2, Sparkles, Shield, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Box, Flex, Text, Card, CardHeader, CardTitle, CardContent, CardDescription, Badge, Button, Separator,
} from '@/components/ui';
import { MotionBox, fadeIn, slideUp, staggerItem, hoverLift } from '@/components/ui/motion';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface PlanLimits {
  posts_per_month: number;
  profiles: number;
  api_access: boolean;
  analytics_retention_days: number;
  custom_domain: boolean;
  team_seats: number;
  ai_adaptations_per_month: number;
  media_uploads_per_month: number;
}

interface WorkspaceBillingInfo {
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  limits: PlanLimits;
}

const PLAN_FEATURES: Record<string, { name: string; description: string; icon: React.ReactNode; limits: Record<string, string> }> = {
  free: {
    name: 'Free',
    description: 'Perfect for getting started',
    icon: <span className="text-gray-500"><Zap className="h-6 w-6" /></span>,
    limits: {
      'Posts/month': '12',
      Profiles: '1',
      'AI Adaptations': '50',
      'Media uploads': '10',
      Platforms: '3 (LinkedIn, X, Threads)',
      Analytics: '30 days',
      'Team seats': '1',
    },
  },
  basic: {
    name: 'Basic',
    description: 'For solo creators posting regularly',
    icon: <span className="text-primary"><Sparkles className="h-6 w-6" /></span>,
    limits: {
      'Posts/month': '100',
      Profiles: '3',
      'AI Adaptations': '500',
      'Media uploads': '100',
      Platforms: '5 (includes Facebook, Instagram)',
      Analytics: '90 days',
      'Team seats': '1',
      'Best time to post': 'Included',
      'Hashtag suggestions': 'Included',
    },
  },
  growth: {
    name: 'Growth',
    description: 'For growing creators and small teams',
    icon: <span className="text-emerald-500"><Shield className="h-6 w-6" /></span>,
    limits: {
      'Posts/month': '500',
      Profiles: '10',
      'AI Adaptations': '2,000',
      'Media uploads': '500',
      Platforms: '6 (includes WhatsApp)',
      Analytics: '365 days',
      'Team seats': '5',
      'Content calendar': 'Included',
      'Approval workflows': 'Included',
      'White label reports': 'Included',
      'Custom domain': 'Included',
    },
  },
  scale: {
    name: 'Scale',
    description: 'For agencies and large teams',
    icon: <span className="text-amber-500"><Crown className="h-6 w-6" /></span>,
    limits: {
      'Posts/month': 'Unlimited',
      Profiles: 'Unlimited',
      'AI Adaptations': 'Unlimited',
      'Media uploads': 'Unlimited',
      Platforms: 'All 6 platforms',
      Analytics: 'Unlimited',
      'Team seats': 'Unlimited',
      'Priority support': 'Included',
      'Dedicated manager': 'Included',
      'SSO': 'Included',
      'Auto-retry failed': 'Included',
    },
  },
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  basic: { monthly: 9, yearly: 90 },
  growth: { monthly: 29, yearly: 290 },
  scale: { monthly: 79, yearly: 790 },
};

interface BillingClientProps {
  userId: string;
  workspaceId: string;
}

export function BillingClientInner({ userId, workspaceId }: BillingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(true);
  const [billing, setBilling] = React.useState<WorkspaceBillingInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = React.useState<'basic' | 'growth' | 'scale'>('basic');
  const [interval, setInterval] = React.useState<'monthly' | 'yearly'>('monthly');
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [managingPortal, setManagingPortal] = React.useState(false);

  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';

  const fetchBilling = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/workspace/billing', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch billing info');
      }
      const data = await res.json();
      setBilling(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  React.useEffect(() => {
    if (success) {
      alert('Subscription updated successfully!');
      fetchBilling();
    }
    if (canceled) {
      alert('Checkout was canceled. No changes were made.');
    }
  }, [success, canceled, fetchBilling]);

  const handleCheckout = async () => {
    if (!billing) return;
    setCheckingOut(true);
    try {
      const planPriceKey = selectedPlan;
      const priceType = interval;

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planPriceKey, interval: priceType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManagePortal = async () => {
    if (!billing) return;
    setManagingPortal(true);
    try {
      const res = await fetch('/api/billing/manage-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to open billing portal');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open portal');
    } finally {
      setManagingPortal(false);
    }
  };

  const getPlanStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'success' | 'warning' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'success', label: 'Active' },
      trialing: { variant: 'default', label: 'Trial' },
      past_due: { variant: 'warning', label: 'Past Due' },
      canceled: { variant: 'destructive', label: 'Canceled' },
      paused: { variant: 'outline', label: 'Paused' },
    };
    const config = configs[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatLimit = (value: number): string => {
    if (value === -1) return 'Unlimited';
    if (value > 999) return `${(value / 1000).toFixed(1)}k+`;
    return value.toString();
  };

  if (loading) {
    return (
      <Box className="space-y-6">
        <Flex between>
          <Box>
            <Text size="3xl" weight="bold">Billing & Subscription</Text>
            <Text color="muted">Manage your plan and billing details</Text>
          </Box>
        </Flex>
        <Card variant="default" padding="lg">
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="space-y-6">
        <Flex between>
          <Box>
            <Text size="3xl" weight="bold">Billing & Subscription</Text>
          </Box>
        </Flex>
        <Card variant="error" padding="md">
          <CardContent className="flex items-center justify-between">
            <Text color="destructive">Error: {error}</Text>
            <Button variant="ghost" size="sm" onClick={fetchBilling}>Retry</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const currentPlan = billing?.plan || 'free';
  const currentPlanInfo = PLAN_FEATURES[currentPlan];
  const isPaidPlan = currentPlan !== 'free';

  return (
    <Box className="space-y-6">
      <Flex between className="flex-wrap gap-4">
        <Box>
          <Text size="3xl" weight="bold">Billing & Subscription</Text>
          <Text color="muted">Manage your plan, billing details, and subscription</Text>
        </Box>
      </Flex>

      {/* Current Plan Card */}
      <MotionBox variants={slideUp}>
        <Card variant="default" padding="lg" className="relative overflow-hidden">
          <CardHeader className="pb-4">
            <Flex between className="flex-wrap gap-4">
              <Flex gap={4} align="center">
                <span className="p-3 bg-primary/10 rounded-xl">{currentPlanInfo.icon}</span>
                <Flex column gap={1}>
                  <Flex align="center" gap={2}>
                    <CardTitle className="mb-0">{currentPlanInfo.name}</CardTitle>
                    {billing?.trialEndsAt && (
                      <Badge variant="default" size="sm">Trial ends {new Date(billing.trialEndsAt).toLocaleDateString()}</Badge>
                    )}
                  </Flex>
                  <Text color="muted">{currentPlanInfo.description}</Text>
                </Flex>
              </Flex>
              <Flex align="center" gap={3}>
                {getPlanStatusBadge(billing?.planStatus || 'active')}
                {isPaidPlan && billing?.stripeSubscriptionId && (
                  <Flex gap={2} align="center">
                    <Button variant="outline" size="sm" onClick={handleManagePortal} disabled={managingPortal}>
                      <CreditCard className="mr-2 h-4 w-4" /> Manage Subscription
                    </Button>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </CardHeader>
          <CardContent>
            <Flex between className="flex-wrap gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
              <Flex column gap={1}>
                <Text size="sm" color="muted">CURRENT MONTHLY PRICE</Text>
                <Text size="3xl" weight="bold">
                  ${PLAN_PRICES[currentPlan].monthly}
                  <span className="text-xl font-normal text-muted-foreground">/mo</span>
                </Text>
              </Flex>
              <Flex column gap={1} align="end">
                <Text size="sm" color="muted">YEARLY (SAVE ~17%)</Text>
                <Text size="2xl" weight="bold" color="primary">
                  ${PLAN_PRICES[currentPlan].yearly}
                  <span className="text-lg font-normal text-muted-foreground">/yr</span>
                </Text>
              </Flex>
              {currentPlan !== 'scale' && (
                <Flex column gap={2} align="end">
                  <Text size="sm" color="muted">UPGRADE TO</Text>
                  <Badge variant="success" size="lg">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    {PLAN_FEATURES[Object.keys(PLAN_FEATURES).find(k =>
                      Object.keys(PLAN_FEATURES).indexOf(k) === Object.keys(PLAN_FEATURES).indexOf(currentPlan) + 1
                    ) || 'basic'].name}
                  </Badge>
                </Flex>
              )}
            </Flex>

            {/* Usage bars for paid plans */}
            {isPaidPlan && billing?.limits && (
              <Box className="space-y-4 mb-6">
                <Text weight="medium" size="sm">Current Usage</Text>
                {Object.entries(billing.limits).map(([key, limit]) => {
                  const usageKey = key.replace(/_/g, '') as keyof typeof billing.limits;
                  const current = billing?.limits?.[usageKey as keyof typeof billing.limits] || 0;
                  return (
                    <Flex key={key} between className="gap-2" style={{ flexWrap: 'wrap' }}>
                      <Flex align="center" gap={2} style={{ flexShrink: 0 }}>
                        <Text size="xs" color="muted" className="w-32 truncate">{key.replace(/_/g, ' ')}</Text>
                        <Badge variant="outline" size="sm">{formatLimit(limit)}</Badge>
                      </Flex>
                    </Flex>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      </MotionBox>

      {/* Plan Comparison / Upgrade Options */}
      <MotionBox variants={slideUp} custom={1}>
        <Card variant="default" padding="lg">
          <CardHeader>
            <Flex between>
              <Flex column gap={1}>
                <CardTitle>Choose Your Plan</CardTitle>
                <Text size="sm" color="muted">All plans include 14-day free trial. Cancel anytime.</Text>
              </Flex>
            </Flex>
          </CardHeader>
          <CardContent>
            <Flex gap={4} style={{ flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '1rem' }}>
              {(['basic', 'growth', 'scale'] as const).map((planKey, index) => {
                const plan = PLAN_FEATURES[planKey];
                const prices = PLAN_PRICES[planKey];
                const isCurrent = currentPlan === planKey;
                const isUpgrade = ['basic', 'growth', 'scale'].indexOf(planKey) > ['basic', 'growth', 'scale'].indexOf(currentPlan);

                return (
                  <Tooltip key={planKey}>
                    <TooltipTrigger asChild>
                      <MotionBox
                        variants={fadeIn}
                        custom={index * 0.1}
                        className={cn(
                          'flex-1 min-w-[280px] max-w-xs p-6 rounded-xl border-2 transition-all',
                          isCurrent
                            ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/10'
                            : 'border-border hover:border-primary/30 hover:shadow-md'
                        )}
                      >
                        <Flex column gap={4}>
                          <Flex gap={3} align="start">
                            <span className="p-2 rounded-lg bg-muted">{plan.icon}</span>
                            <Flex column gap={1}>
                              <Text weight="bold" size="lg">{plan.name}</Text>
                              <Text size="sm" color="muted">{plan.description}</Text>
                            </Flex>
                          </Flex>

                          <Separator />

                          <Flex column gap={2} align="start">
                            <Flex align="baseline" gap={1}>
                              <Text size="3xl" weight="bold">${prices.monthly}</Text>
                              <Text size="sm" color="muted">/month</Text>
                            </Flex>
                            <Text size="sm" color="muted">
                              or ${prices.yearly}/year <span className="text-emerald-600 font-medium">(save ~17%)</span>
                            </Text>
                          </Flex>

                          <Separator />

                          <Box className="space-y-3 flex-1">
                            {Object.entries(plan.limits).map(([key, value]) => (
                              <Flex key={key} gap={2} align="start" className="text-sm">
                                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <Flex column gap={0.5}>
                                  <Text weight="medium">{key}</Text>
                                  <Text size="xs" color="muted">{value}</Text>
                                </Flex>
                              </Flex>
                            ))}
                          </Box>

                          <Separator />

                          <Button
                            variant={isCurrent ? 'secondary' : 'default'}
                            className="w-full"
                            size="lg"
                            onClick={isCurrent ? undefined : () => { setSelectedPlan(planKey); handleCheckout(); }}
                            disabled={isCurrent || checkingOut}
                          >
                            {isCurrent ? (
                              <Flex className="justify-center" gap={2}>
                                <Check className="h-4 w-4" /> Current Plan
                              </Flex>
                            ) : isUpgrade ? (
                              <Flex className="justify-center" gap={2}>
                                <ArrowUpRight className="h-4 w-4" /> Upgrade to {plan.name}
                              </Flex>
                            ) : (
                              'Switch Plan'
                            )}
                          </Button>
                        </Flex>
                      </MotionBox>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      <Text size="sm">Click to {isCurrent ? 'view details' : isUpgrade ? 'upgrade' : 'switch'}</Text>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </Flex>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Billing Details */}
      {isPaidPlan && billing && (
        <MotionBox variants={slideUp} custom={2}>
          <Card variant="default" padding="lg">
            <CardHeader>
              <CardTitle>Billing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex gap={6} style={{ flexWrap: 'wrap' }}>
                <Box className="flex-1 min-w-[250px]">
                  <Text weight="medium" color="muted" size="sm">Stripe Customer ID</Text>
                  <Text size="sm" className="font-mono truncate">{billing.stripeCustomerId || 'Not set'}</Text>
                </Box>
                <Box className="flex-1 min-w-[250px]">
                  <Text weight="medium" color="muted" size="sm">Stripe Subscription ID</Text>
                  <Text size="sm" className="font-mono truncate">{billing.stripeSubscriptionId || 'Not set'}</Text>
                </Box>
                {billing.planExpiresAt && (
                  <Box className="flex-1 min-w-[250px]">
                    <Text weight="medium" color="muted" size="sm">Billing Period Ends</Text>
                    <Text size="sm">{new Date(billing.planExpiresAt).toLocaleDateString()}</Text>
                  </Box>
                )}
              </Flex>
              <Separator className="my-4" />
              <Flex gap={3} style={{ flexWrap: 'wrap' }}>
                <Button variant="outline" onClick={handleManagePortal} disabled={managingPortal}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {managingPortal ? 'Opening...' : 'Manage Subscription'}
                </Button>
                <Button variant="ghost" color="destructive">
                  Cancel Subscription
                </Button>
              </Flex>
            </CardContent>
          </Card>
        </MotionBox>
      )}

      {/* Free plan upgrade CTA */}
      {currentPlan === 'free' && (
        <MotionBox variants={slideUp} custom={3}>
          <Card variant="default" padding="lg" className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Flex column gap={2}>
                <Text size="xl" weight="bold">Ready to grow your social presence?</Text>
                <Text color="muted">Upgrade to unlock unlimited scheduling, advanced analytics, team collaboration, and more.</Text>
              </Flex>
              <Button size="lg" onClick={() => { setSelectedPlan('basic'); handleCheckout(); }}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </MotionBox>
      )}
    </Box>
  );
}

export default function BillingClientWrapper({ userId, workspaceId }: BillingClientProps) {
  return (
    <Suspense fallback={
      <Box className="space-y-6">
        <Flex between>
          <Box>
            <Text size="3xl" weight="bold">Billing & Subscription</Text>
            <Text color="muted">Manage your plan and billing details</Text>
          </Box>
        </Flex>
        <Card variant="default" padding="lg">
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </Box>
    }>
      <BillingClientInner userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}