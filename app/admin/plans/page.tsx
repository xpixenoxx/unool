'use client';

import * as React from 'react';
import {
  MoreVertical, Edit, Trash2, Plus, Loader2, DollarSign,
  UserPlus, X, Search, IndianRupee, Layers, Sliders, Sparkles, Check, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Box, Flex, Text, Card, CardHeader, CardTitle, CardContent,
  Badge, Button, Input, DropdownMenu, DropdownMenuTrigger,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, Label,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SectionGuide } from '@/components/admin/section-guide';
import { useState, useEffect, useCallback } from 'react';
import { Plan } from '@/lib/repositories/interfaces/IAdminRepository';

// ── Types ──────────────────────────────────────────────────────

interface PlanOverride {
  id: string;
  workspace_id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  plan_id: string;
  custom_monthly_inr: number | null;
  custom_yearly_inr: number | null;
  custom_annual_monthly_inr: number | null;
  custom_monthly_usd: number | null;
  custom_yearly_usd: number | null;
  note: string | null;
  created_at: string;
}

// ── Plan Card Preview (matches marketing cards) ────────────────

function PlanCardPreview({
  name,
  tagline,
  monthlyInr,
  bullets,
}: {
  name: string;
  tagline: string;
  monthlyInr: string;
  bullets: string[];
}) {
  const displayBullets = bullets.length > 0 ? bullets : [
    'Everything in Spark, plus:',
    'Unlimited posts/month',
    '4 connected platforms',
    'All 16 persona templates',
    'No "Made with Unool" badge',
    'Basic DM Concierge & 90-day analytics',
  ];

  return (
    <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm max-w-sm w-full mx-auto font-sans">
      <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
        {name || 'Plan Name'}
      </h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 min-h-[1.25rem]">
        {tagline || 'For growing creators & personal brands'}
      </p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {monthlyInr ? `₹${monthlyInr}` : '₹0'}
        </span>
        <span className="text-xs font-semibold text-zinc-500">/mo</span>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800/80 my-4" />

      <ul className="space-y-2.5 text-xs">
        {displayBullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-zinc-800 dark:text-zinc-200">
            <span className="text-red-600 dark:text-red-500 font-bold shrink-0 mt-0.5">✓</span>
            <span className="leading-snug">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <button
          type="button"
          disabled
          className="w-full py-2.5 px-4 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold shadow-md cursor-default text-center"
        >
          Start 14-day trial
        </button>
      </div>
    </div>
  );
}

// ── Plan Table ─────────────────────────────────────────────────

interface PlanTableProps {
  plans: Plan[];
  loading: boolean;
  onToggleActive: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  onOpenCreate: () => void;
}

function PlanTable({ plans, loading, onToggleActive, onDelete, onEdit, onOpenCreate }: PlanTableProps) {
  /** Extract INR monthly price from the features JSONB */
  const getInrMonthly = (plan: Plan): string => {
    if (plan.id === 'spark' || plan.priceMonthlyUsd === 0) {
      return 'Free';
    }
    const f = plan.features as Record<string, unknown>;
    if (typeof f?.price_monthly_inr === 'number') {
      if (f.price_monthly_inr === 0) return 'Free';
      return '₹' + (f.price_monthly_inr / 100).toLocaleString('en-IN');
    }
    return '—';
  };

  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-6 py-4 border-b">
        <Flex between className="items-center">
          <Flex align="center" gap={2}>
            <CardTitle>Pricing Plans</CardTitle>
            <SectionGuide
              title="Pricing Plans Table"
              description="Controls all tiers shown on the pricing page, billing page, and at Cashfree checkout. Edit a plan's INR or USD price, quotas, and metrics — changes reflect everywhere in real time."
              example="Creator: ₹899/mo | Pro: ₹1,999/mo | Studio: ₹4,999/mo"
            />
          </Flex>
          <Button variant="outline" size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Plan
          </Button>
        </Flex>
      </CardHeader>
      <CardContent className="p-0">
        {!loading && !plans.length ? (
          <Box className="p-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <Text weight="medium">No plans configured</Text>
            <Text size="sm" color="muted" className="mt-1">
              Create your first pricing plan to get started
            </Text>
            <Button variant="outline" className="mt-3" size="sm" onClick={onOpenCreate}>
              New Plan
            </Button>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Plan</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">₹ Monthly (INR)</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">$ Monthly (USD)</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const f = (plan.features as Record<string, unknown>) || {};
                  const l = (plan.limits as Record<string, unknown>) || {};
                  const posts = typeof l.posts_per_month === 'number' ? (l.posts_per_month === -1 ? 'Unlimited' : String(l.posts_per_month)) : '—';
                  const channels = typeof l.channels === 'number' ? (l.channels === -1 ? 'Unlimited' : String(l.channels)) : '—';
                  const templates = String(f.template_count || l.template_count || (plan.id === 'spark' ? 5 : 16));

                  return (
                    <tr key={plan.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <Box>
                          <Text weight="medium">{plan.name}</Text>
                          <Text size="xs" color="muted" className="font-mono truncate">{plan.id}</Text>
                          {plan.description && (
                            <Text size="sm" color="muted" className="line-clamp-1 mt-1">
                              {plan.description}
                            </Text>
                          )}
                          {/* Metrics summary badges */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                              Posts: {posts}
                            </span>
                            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                              Platforms: {channels}
                            </span>
                            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                              Templates: {templates}
                            </span>
                            {Boolean(f.badge_removal) && (
                              <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                No Badge
                              </span>
                            )}
                            {Boolean(f.custom_domain) && (
                              <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                Custom Domain
                              </span>
                            )}
                            {Boolean(f.dm_concierge) && (
                              <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                DM Concierge
                              </span>
                            )}
                          </div>
                        </Box>
                      </td>
                      <td className="p-4 align-top">
                        <Text weight="medium">{getInrMonthly(plan)}</Text>
                        <Text size="xs" color="muted">/month</Text>
                      </td>
                      <td className="p-4 align-top">
                        <Text weight="medium">${plan.priceMonthlyUsd / 100}</Text>
                        <Text size="xs" color="muted">/month</Text>
                      </td>
                      <td className="p-4 align-top">
                        <Badge variant="secondary" size="sm">{plan.sortOrder}</Badge>
                      </td>
                      <td className="p-4 align-top">
                        <button
                          type="button"
                          onClick={() => onToggleActive(plan)}
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors',
                            plan.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                          )}
                        >
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 text-right align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(plan)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Plan & Metrics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDelete(plan)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Plan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ── Overrides Section ──────────────────────────────────────────

interface OverridesSectionProps {
  overrides: PlanOverride[];
  loadingOverrides: boolean;
  onRemove: (id: string) => void;
  onOpenCreate: () => void;
}

function OverridesSection({ overrides, loadingOverrides, onRemove, onOpenCreate }: OverridesSectionProps) {
  const formatOverrideInr = (ov: PlanOverride): string => {
    if (ov.custom_monthly_inr != null) {
      return '₹' + (ov.custom_monthly_inr / 100).toLocaleString('en-IN') + '/mo';
    }
    if (ov.custom_yearly_inr != null) {
      return '₹' + (ov.custom_yearly_inr / 100).toLocaleString('en-IN') + '/yr';
    }
    return '—';
  };

  const formatOverrideUsd = (ov: PlanOverride): string => {
    if (ov.custom_monthly_usd != null) {
      return '$' + (ov.custom_monthly_usd / 100) + '/mo';
    }
    if (ov.custom_yearly_usd != null) {
      return '$' + (ov.custom_yearly_usd / 100) + '/yr';
    }
    return '—';
  };

  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-6 py-4 border-b">
        <Flex between className="items-center">
          <Flex align="center" gap={2}>
            <CardTitle>Custom Pricing Overrides</CardTitle>
            <SectionGuide
              title="Per-User Custom Pricing"
              description="Give friends, VIPs, or partners a custom price for any plan (e.g. Creator for ₹499 instead of ₹899). When this user logs in, they see their custom price on the pricing page, billing page, and checkout. Remove the override anytime to revert them to standard pricing."
              example="friend@gmail.com -> Creator at ₹499/mo (saved $4/mo)"
            />
          </Flex>
          <Button variant="outline" size="sm" onClick={onOpenCreate}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User Pricing
          </Button>
        </Flex>
      </CardHeader>
      <CardContent className="p-0">
        {loadingOverrides ? (
          <Box className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </Box>
        ) : !overrides.length ? (
          <Box className="p-8 text-center">
            <Text color="muted">No custom pricing overrides active.</Text>
            <Text size="xs" color="muted" className="mt-1">
              Click &quot;Add User Pricing&quot; to assign custom pricing to a specific user.
            </Text>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">User</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Custom INR</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Custom USD</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Note</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {overrides.map((ov) => (
                  <tr key={ov.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <Text weight="medium">{ov.user_email}</Text>
                      {ov.user_name && <Text size="xs" color="muted">{ov.user_name}</Text>}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" size="sm" className="capitalize">{ov.plan_id}</Badge>
                    </td>
                    <td className="p-4">
                      <Text weight="medium" className="text-emerald-600 dark:text-emerald-400">
                        {formatOverrideInr(ov)}
                      </Text>
                    </td>
                    <td className="p-4">
                      <Text weight="medium">{formatOverrideUsd(ov)}</Text>
                    </td>
                    <td className="p-4">
                      <Text size="xs" color="muted">{ov.note || '—'}</Text>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(ov.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ── Canonical default plans (shown when DB unseeded or fetching) ──
const DEFAULT_ADMIN_PLANS: Plan[] = [
  {
    id: 'spark',
    name: 'Spark',
    description: 'Free forever — your profile, your identity.',
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    features: {
      price_monthly_inr: 0,
      price_yearly_inr: 0,
      price_annual_monthly_inr: 0,
      custom_domain: false,
      badge_removal: false,
      dm_concierge: false,
      dm_concierge_full: false,
      lead_scoring: false,
      follow_to_unlock: true,
      white_label: false,
      api_access: false,
      approval_workflows: false,
      priority_support: false,
      template_count: 5,
      feature_bullets: [
        '1 profile at yourname.unool.co',
        '15 scheduled posts/month',
        '2 connected platforms',
        '5 persona templates',
        'Follow-to-Unlock gates',
        '250 automated IG comments/mo',
      ],
    },
    limits: {
      posts_per_month: 15,
      channels: 2,
      ai_credits_per_month: 25,
      ig_comments_per_month: 250,
      linkedin_comments_per_month: 50,
      team_seats: 1,
      brand_voices: 0,
      analytics_retention_days: 30,
      workspaces: 1,
      template_count: 5,
    },
    isActive: true,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Professional brand, zero third-party branding.',
    priceMonthlyUsd: 900,
    priceYearlyUsd: 9000,
    features: {
      price_monthly_inr: 89900,
      price_yearly_inr: 799000,
      price_annual_monthly_inr: 66600,
      custom_domain: false,
      badge_removal: true,
      dm_concierge: true,
      dm_concierge_full: false,
      lead_scoring: false,
      follow_to_unlock: true,
      white_label: false,
      api_access: false,
      approval_workflows: false,
      priority_support: false,
      template_count: 16,
      feature_bullets: [
        'Everything in Spark, plus:',
        'Unlimited posts/month',
        '4 connected platforms',
        'All 16 persona templates',
        'No "Made with Unool" badge',
        'Basic DM Concierge & 90-day analytics',
      ],
    },
    limits: {
      posts_per_month: -1,
      channels: 4,
      ai_credits_per_month: 150,
      ig_comments_per_month: 500,
      linkedin_comments_per_month: 250,
      team_seats: 1,
      brand_voices: 1,
      analytics_retention_days: 90,
      workspaces: 1,
      template_count: 16,
    },
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'The full engine for serious creators.',
    priceMonthlyUsd: 2400,
    priceYearlyUsd: 24000,
    features: {
      price_monthly_inr: 199900,
      price_yearly_inr: 1999000,
      price_annual_monthly_inr: 166600,
      custom_domain: true,
      badge_removal: true,
      dm_concierge: true,
      dm_concierge_full: true,
      lead_scoring: true,
      follow_to_unlock: true,
      flightplan_ai: true,
      white_label: false,
      api_access: false,
      approval_workflows: false,
      priority_support: true,
      template_count: 16,
      feature_bullets: [
        'Everything in Creator, plus:',
        '8 connected platforms',
        'Custom domain (yourdomain.com)',
        'Full DM Concierge + Knowledge Base',
        'FlightPlan AI & Lead Scoring',
        '3 team seats & priority support',
      ],
    },
    limits: {
      posts_per_month: -1,
      channels: 8,
      ai_credits_per_month: 500,
      ig_comments_per_month: 3000,
      linkedin_comments_per_month: 1500,
      team_seats: 3,
      brand_voices: 5,
      analytics_retention_days: 365,
      workspaces: 1,
      template_count: 16,
    },
    isActive: true,
    sortOrder: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Multi-brand agency powerhouse.',
    priceMonthlyUsd: 5900,
    priceYearlyUsd: 59000,
    features: {
      price_monthly_inr: 499900,
      price_yearly_inr: 4999000,
      price_annual_monthly_inr: 416600,
      custom_domain: true,
      badge_removal: true,
      dm_concierge: true,
      dm_concierge_full: true,
      lead_scoring: true,
      follow_to_unlock: true,
      flightplan_ai: true,
      white_label: true,
      api_access: true,
      approval_workflows: true,
      priority_support: true,
      template_count: 16,
      feature_bullets: [
        'Everything in Pro, plus:',
        '3 workspaces (3 brands/clients)',
        'Full white-label (zero branding)',
        'Unlimited channels & AI credits',
        '10 team seats + granular roles',
        'Webhook API + Zapier triggers',
        'Priority support + onboarding call',
      ],
    },
    limits: {
      posts_per_month: -1,
      channels: -1,
      ai_credits_per_month: -1,
      ig_comments_per_month: -1,
      linkedin_comments_per_month: -1,
      team_seats: 10,
      brand_voices: -1,
      analytics_retention_days: -1,
      workspaces: 3,
      template_count: 16,
    },
    isActive: true,
    sortOrder: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

let cachedPlansData: Plan[] | null = null;

// ── Main Page Component ────────────────────────────────────────

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>(cachedPlansData || DEFAULT_ADMIN_PLANS);
  const [loading, setLoading] = useState(!cachedPlansData);
  const [error, setError] = useState<string | null>(null);

  // Overrides state
  const [overrides, setOverrides] = useState<PlanOverride[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(true);

  // Create plan dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createId, setCreateId] = useState('');
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createMonthlyInr, setCreateMonthlyInr] = useState('799');
  const [createYearlyInr, setCreateYearlyInr] = useState('7990');
  const [createAnnualMonthlyInr, setCreateAnnualMonthlyInr] = useState('666');
  const [createMonthlyUsd, setCreateMonthlyUsd] = useState('9');
  const [createYearlyUsd, setCreateYearlyUsd] = useState('90');
  const [createOrder, setCreateOrder] = useState('0');

  // Create Metrics & Quotas
  const [createPostsPerMonth, setCreatePostsPerMonth] = useState('-1');
  const [createChannels, setCreateChannels] = useState('4');
  const [createTemplateCount, setCreateTemplateCount] = useState('16');
  const [createWorkspaces, setCreateWorkspaces] = useState('1');
  const [createTeamSeats, setCreateTeamSeats] = useState('1');
  const [createAiCredits, setCreateAiCredits] = useState('150');
  const [createIgComments, setCreateIgComments] = useState('500');
  const [createLinkedinComments, setCreateLinkedinComments] = useState('250');
  const [createAnalyticsDays, setCreateAnalyticsDays] = useState('90');

  // Create Feature Toggles
  const [createBadgeRemoval, setCreateBadgeRemoval] = useState(true);
  const [createCustomDomain, setCreateCustomDomain] = useState(false);
  const [createDmConcierge, setCreateDmConcierge] = useState(true);
  const [createDmConciergeFull, setCreateDmConciergeFull] = useState(false);
  const [createFlightplanAi, setCreateFlightplanAi] = useState(false);
  const [createWhiteLabel, setCreateWhiteLabel] = useState(false);
  const [createApiAccess, setCreateApiAccess] = useState(false);
  const [createPrioritySupport, setCreatePrioritySupport] = useState(false);
  const [createFollowToUnlock, setCreateFollowToUnlock] = useState(true);

  // Create Feature Bullets (Image 3)
  const [createFeatureBullets, setCreateFeatureBullets] = useState(
    'Everything in Spark, plus:\nUnlimited posts/month\n4 connected platforms\nAll 16 persona templates\nNo "Made with Unool" badge\nBasic DM Concierge & 90-day analytics'
  );

  // Edit plan dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMonthlyInr, setEditMonthlyInr] = useState('');
  const [editYearlyInr, setEditYearlyInr] = useState('');
  const [editAnnualMonthlyInr, setEditAnnualMonthlyInr] = useState('');
  const [editMonthlyUsd, setEditMonthlyUsd] = useState('');
  const [editYearlyUsd, setEditYearlyUsd] = useState('');
  const [editOrder, setEditOrder] = useState('0');

  // Edit Metrics & Quotas
  const [editPostsPerMonth, setEditPostsPerMonth] = useState('-1');
  const [editChannels, setEditChannels] = useState('4');
  const [editTemplateCount, setEditTemplateCount] = useState('16');
  const [editWorkspaces, setEditWorkspaces] = useState('1');
  const [editTeamSeats, setEditTeamSeats] = useState('1');
  const [editAiCredits, setEditAiCredits] = useState('150');
  const [editIgComments, setEditIgComments] = useState('500');
  const [editLinkedinComments, setEditLinkedinComments] = useState('250');
  const [editAnalyticsDays, setEditAnalyticsDays] = useState('90');

  // Edit Feature Toggles
  const [editBadgeRemoval, setEditBadgeRemoval] = useState(false);
  const [editCustomDomain, setEditCustomDomain] = useState(false);
  const [editDmConcierge, setEditDmConcierge] = useState(false);
  const [editDmConciergeFull, setEditDmConciergeFull] = useState(false);
  const [editFlightplanAi, setEditFlightplanAi] = useState(false);
  const [editWhiteLabel, setEditWhiteLabel] = useState(false);
  const [editApiAccess, setEditApiAccess] = useState(false);
  const [editPrioritySupport, setEditPrioritySupport] = useState(false);
  const [editFollowToUnlock, setEditFollowToUnlock] = useState(true);

  // Edit Feature Bullets
  const [editFeatureBullets, setEditFeatureBullets] = useState('');
  const [saving, setSaving] = useState(false);

  // Create override dialog state
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [ovUserEmail, setOvUserEmail] = useState('');
  const [ovPlanId, setOvPlanId] = useState('creator');
  const [ovMonthlyInr, setOvMonthlyInr] = useState('');
  const [ovYearlyInr, setOvYearlyInr] = useState('');
  const [ovAnnualMonthlyInr, setOvAnnualMonthlyInr] = useState('');
  const [ovMonthlyUsd, setOvMonthlyUsd] = useState('');
  const [ovYearlyUsd, setOvYearlyUsd] = useState('');
  const [ovNote, setOvNote] = useState('');
  const [ovSearchResult, setOvSearchResult] = useState<string | null>(null);
  const [ovSearching, setOvSearching] = useState(false);
  const [ovSaving, setOvSaving] = useState(false);

  // ── Fetchers ─────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/plans', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      const planList: Plan[] = Array.isArray(data) ? data : data?.plans || [];
      if (planList.length > 0) {
        setPlans(planList);
        cachedPlansData = planList;
      }
    } catch (err) {
      console.warn('Using canonical default plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverrides = useCallback(async () => {
    setLoadingOverrides(true);
    try {
      const res = await fetch('/api/admin/plan-overrides', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch overrides');
      const data = await res.json();
      setOverrides(data || []);
    } catch {
      setOverrides([]);
    } finally {
      setLoadingOverrides(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchOverrides();
  }, [fetchPlans, fetchOverrides]);

  // ── Plan CRUD handlers ───────────────────────────────────────

  const handleToggleActive = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update plan');
      }
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p)));
      await fetchPlans();
    } catch (err) {
      console.error('Failed to toggle plan:', err);
      alert(err instanceof Error ? err.message : 'Failed to toggle plan');
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete plan');
      }
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      await fetchPlans();
    } catch (err) {
      console.error('Failed to delete plan:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  // Helper: parse INR rupee display value -> paise integer
  const parseInrPaise = (val: string): number | undefined => {
    const n = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (isNaN(n)) return undefined;
    return Math.round(n * 100);
  };

  // Helper: parse USD dollar display value -> cents integer
  const parseUsdCents = (val: string): number | undefined => {
    const n = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (isNaN(n)) return undefined;
    return Math.round(n * 100);
  };

  const handleCreate = async () => {
    if (!createId || !createName) { alert('Plan ID and Name are required'); return; }
    setSaving(true);
    try {
      const monthlyInrPaise = parseInrPaise(createMonthlyInr);
      const yearlyInrPaise = parseInrPaise(createYearlyInr);
      const annualMonthlyInrPaise = parseInrPaise(createAnnualMonthlyInr);
      const monthlyUsdCents = parseUsdCents(createMonthlyUsd);
      const yearlyUsdCents = parseUsdCents(createYearlyUsd);

      const bullets = createFeatureBullets
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: createId.trim().toLowerCase(),
          name: createName.trim(),
          description: createDesc.trim() || undefined,
          priceMonthlyUsd: monthlyUsdCents ?? 0,
          priceYearlyUsd: yearlyUsdCents ?? 0,
          priceMonthlyInr: monthlyInrPaise,
          priceYearlyInr: yearlyInrPaise,
          priceAnnualMonthlyInr: annualMonthlyInrPaise,
          sortOrder: parseInt(createOrder) || 0,
          isActive: true,
          features: {
            ...(monthlyInrPaise != null ? { price_monthly_inr: monthlyInrPaise } : {}),
            ...(yearlyInrPaise != null ? { price_yearly_inr: yearlyInrPaise } : {}),
            ...(annualMonthlyInrPaise != null ? { price_annual_monthly_inr: annualMonthlyInrPaise } : {}),
            badge_removal: createBadgeRemoval,
            custom_domain: createCustomDomain,
            dm_concierge: createDmConcierge,
            dm_concierge_full: createDmConciergeFull,
            flightplan_ai: createFlightplanAi,
            white_label: createWhiteLabel,
            api_access: createApiAccess,
            priority_support: createPrioritySupport,
            follow_to_unlock: createFollowToUnlock,
            template_count: parseInt(createTemplateCount) || 16,
            feature_bullets: bullets,
          },
          limits: {
            posts_per_month: parseInt(createPostsPerMonth) || -1,
            channels: parseInt(createChannels) || 4,
            template_count: parseInt(createTemplateCount) || 16,
            workspaces: parseInt(createWorkspaces) || 1,
            team_seats: parseInt(createTeamSeats) || 1,
            ai_credits_per_month: parseInt(createAiCredits) || 150,
            ig_comments_per_month: parseInt(createIgComments) || 500,
            linkedin_comments_per_month: parseInt(createLinkedinComments) || 250,
            analytics_retention_days: parseInt(createAnalyticsDays) || 90,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create plan');
      }
      setCreateOpen(false);
      setCreateId(''); setCreateName(''); setCreateDesc('');
      await fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (plan: Plan) => {
    const f = (plan.features as Record<string, unknown>) || {};
    const l = (plan.limits as Record<string, unknown>) || {};
    const getInrRupees = (key: string) => {
      const v = f[key];
      return typeof v === 'number' ? (v / 100).toString() : '';
    };
    setEditingPlan(plan);
    setEditName(plan.name);
    setEditDesc(plan.description || '');
    setEditMonthlyInr(getInrRupees('price_monthly_inr'));
    setEditYearlyInr(getInrRupees('price_yearly_inr'));
    setEditAnnualMonthlyInr(getInrRupees('price_annual_monthly_inr'));
    setEditMonthlyUsd((plan.priceMonthlyUsd / 100).toString());
    setEditYearlyUsd((plan.priceYearlyUsd / 100).toString());
    setEditOrder(plan.sortOrder.toString());

    // Quotas & metrics
    setEditPostsPerMonth(typeof l.posts_per_month === 'number' ? l.posts_per_month.toString() : (plan.id === 'spark' ? '15' : '-1'));
    setEditChannels(typeof l.channels === 'number' ? l.channels.toString() : '4');
    setEditTemplateCount(
      typeof f.template_count === 'number'
        ? f.template_count.toString()
        : typeof l.template_count === 'number'
          ? l.template_count.toString()
          : (plan.id === 'spark' ? '5' : '16')
    );
    setEditWorkspaces(typeof l.workspaces === 'number' ? l.workspaces.toString() : '1');
    setEditTeamSeats(typeof l.team_seats === 'number' ? l.team_seats.toString() : '1');
    setEditAiCredits(typeof l.ai_credits_per_month === 'number' ? l.ai_credits_per_month.toString() : '150');
    setEditIgComments(typeof l.ig_comments_per_month === 'number' ? l.ig_comments_per_month.toString() : '500');
    setEditLinkedinComments(typeof l.linkedin_comments_per_month === 'number' ? l.linkedin_comments_per_month.toString() : '250');
    setEditAnalyticsDays(typeof l.analytics_retention_days === 'number' ? l.analytics_retention_days.toString() : '90');

    // Feature toggles
    setEditBadgeRemoval(Boolean(f.badge_removal));
    setEditCustomDomain(Boolean(f.custom_domain));
    setEditDmConcierge(Boolean(f.dm_concierge));
    setEditDmConciergeFull(Boolean(f.dm_concierge_full));
    setEditFlightplanAi(Boolean(f.flightplan_ai));
    setEditWhiteLabel(Boolean(f.white_label));
    setEditApiAccess(Boolean(f.api_access));
    setEditPrioritySupport(Boolean(f.priority_support));
    setEditFollowToUnlock(f.follow_to_unlock !== false);

    // Feature bullets
    if (Array.isArray(f.feature_bullets) && f.feature_bullets.length > 0) {
      setEditFeatureBullets(f.feature_bullets.join('\n'));
    } else {
      const defaultBulletsMap: Record<string, string[]> = {
        spark: [
          '1 profile at yourname.unool.co',
          '15 scheduled posts/month',
          '2 connected platforms',
          '5 persona templates',
          'Follow-to-Unlock gates',
          '250 automated IG comments/mo',
        ],
        creator: [
          'Everything in Spark, plus:',
          'Unlimited posts/month',
          '4 connected platforms',
          'All 16 persona templates',
          'No "Made with Unool" badge',
          'Basic DM Concierge & 90-day analytics',
        ],
        pro: [
          'Everything in Creator, plus:',
          '8 connected platforms',
          'Custom domain (yourdomain.com)',
          'Full DM Concierge + Knowledge Base',
          'FlightPlan AI & Lead Scoring',
          '3 team seats & priority support',
        ],
        studio: [
          'Everything in Pro, plus:',
          '3 workspaces (3 brands/clients)',
          'Full white-label (zero branding)',
          'Unlimited channels & AI credits',
          '10 team seats + granular roles',
          'Webhook API + Zapier triggers',
          'Priority support + onboarding call',
        ],
      };
      setEditFeatureBullets((defaultBulletsMap[plan.id] || []).join('\n'));
    }

    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const monthlyInrPaise = parseInrPaise(editMonthlyInr);
      const yearlyInrPaise = parseInrPaise(editYearlyInr);
      const annualMonthlyInrPaise = parseInrPaise(editAnnualMonthlyInr);
      const monthlyUsdCents = parseUsdCents(editMonthlyUsd);
      const yearlyUsdCents = parseUsdCents(editYearlyUsd);

      const bullets = editFeatureBullets
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || undefined,
          priceMonthlyUsd: monthlyUsdCents,
          priceYearlyUsd: yearlyUsdCents,
          priceMonthlyInr: monthlyInrPaise,
          priceYearlyInr: yearlyInrPaise,
          priceAnnualMonthlyInr: annualMonthlyInrPaise,
          sortOrder: parseInt(editOrder) || 0,
          features: {
            badge_removal: editBadgeRemoval,
            custom_domain: editCustomDomain,
            dm_concierge: editDmConcierge,
            dm_concierge_full: editDmConciergeFull,
            flightplan_ai: editFlightplanAi,
            white_label: editWhiteLabel,
            api_access: editApiAccess,
            priority_support: editPrioritySupport,
            follow_to_unlock: editFollowToUnlock,
            template_count: parseInt(editTemplateCount) || 16,
            feature_bullets: bullets,
          },
          limits: {
            posts_per_month: parseInt(editPostsPerMonth) || -1,
            channels: parseInt(editChannels) || 4,
            template_count: parseInt(editTemplateCount) || 16,
            workspaces: parseInt(editWorkspaces) || 1,
            team_seats: parseInt(editTeamSeats) || 1,
            ai_credits_per_month: parseInt(editAiCredits) || 150,
            ig_comments_per_month: parseInt(editIgComments) || 500,
            linkedin_comments_per_month: parseInt(editLinkedinComments) || 250,
            analytics_retention_days: parseInt(editAnalyticsDays) || 90,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to update plan');
      }

      const updatedPlan = await res.json().catch(() => null);
      if (updatedPlan) {
        setPlans((prev) =>
          prev.map((p) => (p.id === updatedPlan.id ? { ...p, ...updatedPlan } : p))
        );
      }

      setEditOpen(false);
      setEditingPlan(null);
      await fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // ── Override handlers ────────────────────────────────────────

  const handleSearchUser = async () => {
    if (!ovUserEmail.trim()) return;
    setOvSearching(true);
    setOvSearchResult(null);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(ovUserEmail.trim())}&pageSize=5`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const users = data.data || data.items || [];
      const found = users.find((u: { email: string }) =>
        u.email?.toLowerCase() === ovUserEmail.trim().toLowerCase()
      );
      setOvSearchResult(found ? `✓ Found: ${found.email} (Plan: ${found.plan})` : '✗ No user with that email');
    } catch {
      setOvSearchResult('✗ Could not search. Check the email and try again.');
    } finally {
      setOvSearching(false);
    }
  };

  const handleCreateOverride = async () => {
    if (!ovUserEmail.trim()) { alert('User email is required'); return; }
    const monthlyInr = parseInrPaise(ovMonthlyInr);
    const yearlyInr = parseInrPaise(ovYearlyInr);
    const annualMonthlyInr = parseInrPaise(ovAnnualMonthlyInr);
    const monthlyUsd = parseUsdCents(ovMonthlyUsd);
    const yearlyUsd = parseUsdCents(ovYearlyUsd);

    if (!monthlyInr && !yearlyInr && !monthlyUsd && !yearlyUsd) {
      alert('Provide at least one custom price (monthly or yearly)');
      return;
    }
    setOvSaving(true);
    try {
      const res = await fetch('/api/admin/plan-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: ovUserEmail.trim(),
          planId: ovPlanId,
          customMonthlyInr: monthlyInr,
          customYearlyInr: yearlyInr,
          customAnnualMonthlyInr: annualMonthlyInr,
          customMonthlyUsd: monthlyUsd,
          customYearlyUsd: yearlyUsd,
          note: ovNote.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create override');
      }
      setOverrideOpen(false);
      setOvUserEmail(''); setOvPlanId('creator'); setOvMonthlyInr('');
      setOvYearlyInr(''); setOvAnnualMonthlyInr(''); setOvMonthlyUsd('');
      setOvYearlyUsd(''); setOvNote(''); setOvSearchResult(null);
      await fetchOverrides();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create override');
    } finally {
      setOvSaving(false);
    }
  };

  const handleRemoveOverride = async (id: string) => {
    if (!confirm('Remove this custom pricing? The user will revert to standard plan price.')) return;
    try {
      const res = await fetch(`/api/admin/plan-overrides/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove');
      await fetchOverrides();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove override');
    }
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <Box className="space-y-8">
      {/* Header — Notice: redundant Create Plan button removed as requested */}
      <Flex between className="flex-wrap gap-4 items-center">
        <Box>
          <Flex align="center" gap={2}>
            <Text size="3xl" weight="bold">Plans Configuration</Text>
            <SectionGuide
              title="Pricing & Plan Tiers"
              description="Edit plan prices, quotas, and feature metrics here — changes apply to the homepage, billing page, and Cashfree checkout automatically. You can also assign custom prices to individual users."
              example="Creator: ₹899/mo | Pro: ₹1,999/mo | Studio: ₹4,999/mo"
            />
          </Flex>
          <Text color="muted">Manage pricing plans, features, quotas, and user-level overrides</Text>
        </Box>
      </Flex>

      {error && (
        <Card variant="error" padding="md">
          <CardContent className="flex items-center justify-between">
            <Text color="destructive">Error: {error}</Text>
            <Button variant="ghost" size="sm" onClick={fetchPlans}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Plans Table */}
      <PlanTable
        plans={plans}
        loading={loading}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onEdit={openEdit}
        onOpenCreate={() => {
          setCreateId('');
          setCreateName('');
          setCreateDesc('For growing creators & personal brands');
          setCreateMonthlyInr('799');
          setCreateYearlyInr('7990');
          setCreateAnnualMonthlyInr('666');
          setCreateMonthlyUsd('9');
          setCreateYearlyUsd('90');
          setCreateOrder((plans.length).toString());
          setCreatePostsPerMonth('-1');
          setCreateChannels('4');
          setCreateTemplateCount('16');
          setCreateWorkspaces('1');
          setCreateTeamSeats('1');
          setCreateAiCredits('150');
          setCreateIgComments('500');
          setCreateLinkedinComments('250');
          setCreateAnalyticsDays('90');
          setCreateBadgeRemoval(true);
          setCreateCustomDomain(false);
          setCreateDmConcierge(true);
          setCreateDmConciergeFull(false);
          setCreateFlightplanAi(false);
          setCreateWhiteLabel(false);
          setCreateApiAccess(false);
          setCreatePrioritySupport(false);
          setCreateFollowToUnlock(true);
          setCreateFeatureBullets(
            'Everything in Spark, plus:\nUnlimited posts/month\n4 connected platforms\nAll 16 persona templates\nNo "Made with Unool" badge\nBasic DM Concierge & 90-day analytics'
          );
          setCreateOpen(true);
        }}
      />

      {/* Custom Pricing Overrides */}
      <OverridesSection
        overrides={overrides}
        loadingOverrides={loadingOverrides}
        onRemove={handleRemoveOverride}
        onOpenCreate={() => setOverrideOpen(true)}
      />

      {/* ── Create Plan Dialog (Organized with Tabs & Card Preview) ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Create Pricing Plan
            </DialogTitle>
            <DialogDescription>
              Define a new subscription tier with prices, quotas, feature flags, and pricing card marketing bullets.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="pricing" className="w-full mt-2">
            <TabsList className="grid grid-cols-4 w-full mb-4">
              <TabsTrigger value="pricing" className="text-xs">Pricing & Info</TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs">Metrics & Limits</TabsTrigger>
              <TabsTrigger value="features" className="text-xs">Feature Toggles</TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">Card Bullets & Preview</TabsTrigger>
            </TabsList>

            {/* TAB 1: General & Pricing */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-id">Plan ID * (slug, e.g. &apos;studio&apos;)</Label>
                  <Input id="plan-id" placeholder="e.g. vip, growth" value={createId} onChange={(e) => setCreateId(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-name">Display Name *</Label>
                  <Input id="plan-name" placeholder="e.g. VIP Creator" value={createName} onChange={(e) => setCreateName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-desc">Description / Tagline</Label>
                <Input id="plan-desc" placeholder="For growing creators & personal brands" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
              </div>

              <div className="border-t pt-3">
                <Text size="sm" weight="medium" className="mb-2.5 flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" /> INR Pricing (enter in rupees)
                </Text>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="c-monthly-inr" className="text-xs">Monthly (₹)</Label>
                    <Input id="c-monthly-inr" type="number" placeholder="799" value={createMonthlyInr} onChange={(e) => setCreateMonthlyInr(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-yearly-inr" className="text-xs">Yearly total (₹)</Label>
                    <Input id="c-yearly-inr" type="number" placeholder="7990" value={createYearlyInr} onChange={(e) => setCreateYearlyInr(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-ann-mo-inr" className="text-xs">Annual /mo display (₹)</Label>
                    <Input id="c-ann-mo-inr" type="number" placeholder="666" value={createAnnualMonthlyInr} onChange={(e) => setCreateAnnualMonthlyInr(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <Text size="sm" weight="medium" className="mb-2.5">$ USD Pricing (enter in dollars)</Text>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="c-monthly-usd" className="text-xs">Monthly ($)</Label>
                    <Input id="c-monthly-usd" type="number" placeholder="9" value={createMonthlyUsd} onChange={(e) => setCreateMonthlyUsd(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-yearly-usd" className="text-xs">Yearly ($)</Label>
                    <Input id="c-yearly-usd" type="number" placeholder="90" value={createYearlyUsd} onChange={(e) => setCreateYearlyUsd(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="plan-order">Sort Order (0, 1, 2…)</Label>
                <Input id="plan-order" type="number" value={createOrder} onChange={(e) => setCreateOrder(e.target.value)} />
              </div>
            </TabsContent>

            {/* TAB 2: Metrics & Quotas (Image 3) */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground mb-3">
                💡 Enter <strong>-1</strong> for Unlimited quotas (e.g. Unlimited posts/month, Unlimited channels).
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-posts" className="text-xs font-semibold">Scheduled Posts / month</Label>
                  <Input id="c-posts" type="number" placeholder="-1 for Unlimited" value={createPostsPerMonth} onChange={(e) => setCreatePostsPerMonth(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">-1 = Unlimited posts</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-channels" className="text-xs font-semibold">Connected Platforms / Channels</Label>
                  <Input id="c-channels" type="number" placeholder="4" value={createChannels} onChange={(e) => setCreateChannels(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">e.g. 2, 4, 8, or -1 for unlimited</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-tpl" className="text-xs font-semibold">Persona Templates Count</Label>
                  <Input id="c-tpl" type="number" placeholder="16" value={createTemplateCount} onChange={(e) => setCreateTemplateCount(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">e.g. 5 for basic, 16 for all templates</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-analytics-days" className="text-xs font-semibold">Analytics Retention (Days)</Label>
                  <Input id="c-analytics-days" type="number" placeholder="90" value={createAnalyticsDays} onChange={(e) => setCreateAnalyticsDays(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">e.g. 30, 90, 365, or -1 for unlimited</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-seats" className="text-xs font-semibold">Team Seats</Label>
                  <Input id="c-seats" type="number" placeholder="1" value={createTeamSeats} onChange={(e) => setCreateTeamSeats(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">Number of team member seats</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-workspaces" className="text-xs font-semibold">Workspaces</Label>
                  <Input id="c-workspaces" type="number" placeholder="1" value={createWorkspaces} onChange={(e) => setCreateWorkspaces(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">Separate brand workspaces</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-ai" className="text-xs font-semibold">AI Credits / mo</Label>
                  <Input id="c-ai" type="number" placeholder="150" value={createAiCredits} onChange={(e) => setCreateAiCredits(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-ig" className="text-xs font-semibold">IG Comments / mo</Label>
                  <Input id="c-ig" type="number" placeholder="500" value={createIgComments} onChange={(e) => setCreateIgComments(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-li" className="text-xs font-semibold">LinkedIn Comments / mo</Label>
                  <Input id="c-li" type="number" placeholder="250" value={createLinkedinComments} onChange={(e) => setCreateLinkedinComments(e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Feature Toggles */}
            <TabsContent value="features" className="space-y-3">
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={createBadgeRemoval} onCheckedChange={(c) => setCreateBadgeRemoval(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">No &quot;Made with Unool&quot; badge</Text>
                    <Text size="xs" color="muted">Removes branding from profile header/footer</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={createCustomDomain} onCheckedChange={(c) => setCreateCustomDomain(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Custom Domain</Text>
                    <Text size="xs" color="muted">Connect your own custom domain (e.g. name.com)</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={createDmConcierge} onCheckedChange={(c) => setCreateDmConcierge(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Basic DM Concierge</Text>
                    <Text size="xs" color="muted">Automated Instagram DM trigger responses</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={createDmConciergeFull} onCheckedChange={(c) => setCreateDmConciergeFull(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Full DM Concierge + Knowledge Base</Text>
                    <Text size="xs" color="muted">Full AI concierge trained on creator profile</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={createFlightplanAi} onCheckedChange={(c) => setCreateFlightplanAi(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">FlightPlan AI & Lead Scoring</Text>
                    <Text size="xs" color="muted">Advanced AI content suggestions and lead qualification</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={createWhiteLabel} onCheckedChange={(c) => setCreateWhiteLabel(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Full White-Label</Text>
                    <Text size="xs" color="muted">100% agency white-label experience</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={createApiAccess} onCheckedChange={(c) => setCreateApiAccess(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Webhook API & Zapier</Text>
                    <Text size="xs" color="muted">Integrations & automation webhooks</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={createPrioritySupport} onCheckedChange={(c) => setCreatePrioritySupport(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Priority Support</Text>
                    <Text size="xs" color="muted">Dedicated priority support channel</Text>
                  </div>
                </label>
              </div>
            </TabsContent>

            {/* TAB 4: Marketing Card Bullets & Live Preview (Image 3) */}
            <TabsContent value="preview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-2">
                  <Label htmlFor="c-bullets" className="text-xs font-semibold">
                    Pricing Card Feature Bullets (one per line):
                  </Label>
                  <Textarea
                    id="c-bullets"
                    rows={8}
                    placeholder={'Everything in Spark, plus:\nUnlimited posts/month\n4 connected platforms\nAll 16 persona templates\nNo "Made with Unool" badge\nBasic DM Concierge & 90-day analytics'}
                    value={createFeatureBullets}
                    onChange={(e) => setCreateFeatureBullets(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    These bullets appear with checkmarks on the homepage & billing pricing cards.
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Live Card Preview (as shown to users)
                  </div>
                  <PlanCardPreview
                    name={createName}
                    tagline={createDesc}
                    monthlyInr={createMonthlyInr}
                    bullets={createFeatureBullets.split('\n').map((s) => s.trim()).filter(Boolean)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !createId || !createName}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Plan Dialog (Organized with Tabs & Card Preview) ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Edit Plan: {editingPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Changes to pricing, limits, quotas, and feature flags apply to the homepage, billing page, and Cashfree checkout immediately after save.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="pricing" className="w-full mt-2">
            <TabsList className="grid grid-cols-4 w-full mb-4">
              <TabsTrigger value="pricing" className="text-xs">Pricing & Info</TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs">Metrics & Limits</TabsTrigger>
              <TabsTrigger value="features" className="text-xs">Feature Toggles</TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">Card Bullets & Preview</TabsTrigger>
            </TabsList>

            {/* TAB 1: General & Pricing */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Display Name</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-order">Sort Order</Label>
                  <Input id="edit-order" type="number" value={editOrder} onChange={(e) => setEditOrder(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-desc">Description / Tagline</Label>
                <Input id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>

              <div className="border-t pt-3">
                <Text size="sm" weight="medium" className="mb-2.5 flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" /> INR Pricing (enter in rupees, e.g. 899)
                </Text>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="e-monthly-inr" className="text-xs">Monthly (₹)</Label>
                    <Input id="e-monthly-inr" type="number" value={editMonthlyInr} onChange={(e) => setEditMonthlyInr(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="e-yearly-inr" className="text-xs">Yearly total (₹)</Label>
                    <Input id="e-yearly-inr" type="number" value={editYearlyInr} onChange={(e) => setEditYearlyInr(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="e-ann-mo-inr" className="text-xs">Annual /mo display (₹)</Label>
                    <Input id="e-ann-mo-inr" type="number" value={editAnnualMonthlyInr} onChange={(e) => setEditAnnualMonthlyInr(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <Text size="sm" weight="medium" className="mb-2.5">$ USD Pricing (enter in dollars)</Text>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="e-monthly-usd" className="text-xs">Monthly ($)</Label>
                    <Input id="e-monthly-usd" type="number" value={editMonthlyUsd} onChange={(e) => setEditMonthlyUsd(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="e-yearly-usd" className="text-xs">Yearly ($)</Label>
                    <Input id="e-yearly-usd" type="number" value={editYearlyUsd} onChange={(e) => setEditYearlyUsd(e.target.value)} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Metrics & Quotas (Image 3) */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground mb-3">
                💡 Enter <strong>-1</strong> for Unlimited quotas (e.g. Unlimited posts/month, Unlimited channels).
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="e-posts" className="text-xs font-semibold">Scheduled Posts / month</Label>
                  <Input id="e-posts" type="number" placeholder="-1 for Unlimited" value={editPostsPerMonth} onChange={(e) => setEditPostsPerMonth(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">-1 = Unlimited posts</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-channels" className="text-xs font-semibold">Connected Platforms / Channels</Label>
                  <Input id="e-channels" type="number" placeholder="4" value={editChannels} onChange={(e) => setEditChannels(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">e.g. 2, 4, 8, or -1 for unlimited</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="e-tpl" className="text-xs font-semibold">Persona Templates Count</Label>
                  <Input id="e-tpl" type="number" placeholder="16" value={editTemplateCount} onChange={(e) => setEditTemplateCount(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">e.g. 5 for basic, 16 for all templates</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-analytics-days" className="text-xs font-semibold">Analytics Retention (Days)</Label>
                  <Input id="e-analytics-days" type="number" placeholder="90" value={editAnalyticsDays} onChange={(e) => setEditAnalyticsDays(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">e.g. 30, 90, 365, or -1 for unlimited</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="e-seats" className="text-xs font-semibold">Team Seats</Label>
                  <Input id="e-seats" type="number" placeholder="1" value={editTeamSeats} onChange={(e) => setEditTeamSeats(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">Number of team member seats</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-workspaces" className="text-xs font-semibold">Workspaces</Label>
                  <Input id="e-workspaces" type="number" placeholder="1" value={editWorkspaces} onChange={(e) => setEditWorkspaces(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">Separate brand workspaces</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e-ai" className="text-xs font-semibold">AI Credits / mo</Label>
                  <Input id="e-ai" type="number" placeholder="150" value={editAiCredits} onChange={(e) => setEditAiCredits(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-ig" className="text-xs font-semibold">IG Comments / mo</Label>
                  <Input id="e-ig" type="number" placeholder="500" value={editIgComments} onChange={(e) => setEditIgComments(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-li" className="text-xs font-semibold">LinkedIn Comments / mo</Label>
                  <Input id="e-li" type="number" placeholder="250" value={editLinkedinComments} onChange={(e) => setEditLinkedinComments(e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Feature Toggles */}
            <TabsContent value="features" className="space-y-3">
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={editBadgeRemoval} onCheckedChange={(c) => setEditBadgeRemoval(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">No &quot;Made with Unool&quot; badge</Text>
                    <Text size="xs" color="muted">Removes branding from profile header/footer</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={editCustomDomain} onCheckedChange={(c) => setEditCustomDomain(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Custom Domain</Text>
                    <Text size="xs" color="muted">Connect your own custom domain (e.g. name.com)</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={editDmConcierge} onCheckedChange={(c) => setEditDmConcierge(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Basic DM Concierge</Text>
                    <Text size="xs" color="muted">Automated Instagram DM trigger responses</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={editDmConciergeFull} onCheckedChange={(c) => setEditDmConciergeFull(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Full DM Concierge + Knowledge Base</Text>
                    <Text size="xs" color="muted">Full AI concierge trained on creator profile</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={editFlightplanAi} onCheckedChange={(c) => setEditFlightplanAi(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">FlightPlan AI & Lead Scoring</Text>
                    <Text size="xs" color="muted">Advanced AI content suggestions and lead qualification</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={editWhiteLabel} onCheckedChange={(c) => setEditWhiteLabel(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Full White-Label</Text>
                    <Text size="xs" color="muted">100% agency white-label experience</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={editApiAccess} onCheckedChange={(c) => setEditApiAccess(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Webhook API & Zapier</Text>
                    <Text size="xs" color="muted">Integrations & automation webhooks</Text>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox checked={editPrioritySupport} onCheckedChange={(c) => setEditPrioritySupport(Boolean(c))} />
                  <div>
                    <Text size="xs" weight="medium">Priority Support</Text>
                    <Text size="xs" color="muted">Dedicated priority support channel</Text>
                  </div>
                </label>
              </div>
            </TabsContent>

            {/* TAB 4: Marketing Card Bullets & Live Preview (Image 3) */}
            <TabsContent value="preview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-2">
                  <Label htmlFor="e-bullets" className="text-xs font-semibold">
                    Pricing Card Feature Bullets (one per line):
                  </Label>
                  <Textarea
                    id="e-bullets"
                    rows={8}
                    placeholder={'Everything in Spark, plus:\nUnlimited posts/month\n4 connected platforms\nAll 16 persona templates\nNo "Made with Unool" badge\nBasic DM Concierge & 90-day analytics'}
                    value={editFeatureBullets}
                    onChange={(e) => setEditFeatureBullets(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    These bullets appear with checkmarks on the homepage & billing pricing cards.
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Live Card Preview (as shown to users)
                  </div>
                  <PlanCardPreview
                    name={editName}
                    tagline={editDesc}
                    monthlyInr={editMonthlyInr}
                    bullets={editFeatureBullets.split('\n').map((s) => s.trim()).filter(Boolean)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Override Dialog ── */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Custom Pricing for a User</DialogTitle>
            <DialogDescription>
              Enter the user&apos;s email and set their custom price. This overrides the standard plan price for that user only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* User search */}
            <div className="space-y-2">
              <Label htmlFor="ov-email">User Email *</Label>
              <div className="flex gap-2">
                <Input
                  id="ov-email"
                  type="email"
                  placeholder="friend@example.com"
                  value={ovUserEmail}
                  onChange={(e) => { setOvUserEmail(e.target.value); setOvSearchResult(null); }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearchUser}
                  disabled={ovSearching || !ovUserEmail.trim()}
                  className="shrink-0"
                >
                  {ovSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {ovSearchResult && (
                <Text
                  size="xs"
                  className={ovSearchResult.startsWith('✓') ? 'text-green-600' : 'text-destructive'}
                >
                  {ovSearchResult}
                </Text>
              )}
            </div>

            {/* Plan selector */}
            <div className="space-y-2">
              <Label htmlFor="ov-plan">Plan to Override *</Label>
              <select
                id="ov-plan"
                value={ovPlanId}
                onChange={(e) => setOvPlanId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {plans.filter((p) => p.id !== 'spark' && p.id !== 'free').length > 0 ? (
                  plans
                    .filter((p) => p.id !== 'spark' && p.id !== 'free')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                ) : (
                  <>
                    <option value="creator">Creator</option>
                    <option value="pro">Pro</option>
                    <option value="studio">Studio</option>
                  </>
                )}
              </select>
            </div>

            {/* INR custom prices */}
            <div className="border-t pt-3">
              <Text size="sm" weight="medium" className="mb-3 flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" /> Custom INR Price (enter in rupees)
              </Text>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ov-monthly-inr" className="text-xs">Monthly (₹)</Label>
                  <Input id="ov-monthly-inr" type="number" placeholder="499" value={ovMonthlyInr} onChange={(e) => setOvMonthlyInr(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ov-yearly-inr" className="text-xs">Yearly total (₹)</Label>
                  <Input id="ov-yearly-inr" type="number" placeholder="4990" value={ovYearlyInr} onChange={(e) => setOvYearlyInr(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ov-ann-mo-inr" className="text-xs">Annual /mo display</Label>
                  <Input id="ov-ann-mo-inr" type="number" placeholder="416" value={ovAnnualMonthlyInr} onChange={(e) => setOvAnnualMonthlyInr(e.target.value)} />
                </div>
              </div>
            </div>

            {/* USD custom prices */}
            <div className="border-t pt-3">
              <Text size="sm" weight="medium" className="mb-3">$ Custom USD Price (optional)</Text>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ov-monthly-usd" className="text-xs">Monthly ($)</Label>
                  <Input id="ov-monthly-usd" type="number" placeholder="5" value={ovMonthlyUsd} onChange={(e) => setOvMonthlyUsd(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ov-yearly-usd" className="text-xs">Yearly ($)</Label>
                  <Input id="ov-yearly-usd" type="number" placeholder="50" value={ovYearlyUsd} onChange={(e) => setOvYearlyUsd(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="ov-note">Admin Note (reason)</Label>
              <Input
                id="ov-note"
                placeholder="e.g. Early supporter discount, Friend of founder"
                value={ovNote}
                onChange={(e) => setOvNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOverride} disabled={ovSaving || !ovUserEmail.trim()}>
              {ovSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Apply Custom Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
