'use client';

import * as React from 'react';
import {
  MoreVertical, Edit, Trash2, Plus, Loader2, DollarSign,
  UserPlus, X, Search, IndianRupee,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Box, Flex, Text, Card, CardHeader, CardTitle, CardContent,
  Badge, Button, Input, DropdownMenu, DropdownMenuTrigger,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, Label,
} from '@/components/ui';
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
    const f = plan.features as Record<string, unknown>;
    if (typeof f?.price_monthly_inr === 'number') {
      return `₹${(f.price_monthly_inr / 100).toLocaleString('en-IN')}`;
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
              description="Controls all tiers shown on the pricing page, billing page, and at Cashfree checkout. Edit a plan's INR or USD price and save — the change reflects everywhere within seconds. INR monthly is what Indian users see and pay."
              example="Creator: ₹799/mo | Pro: ₹1,999/mo | Studio: ₹4,999/mo"
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
              Create Plan
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
                {plans.map((plan) => (
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
                      </Box>
                    </td>
                    <td className="p-4">
                      <Text weight="medium">{getInrMonthly(plan)}</Text>
                      <Text size="xs" color="muted">/month</Text>
                    </td>
                    <td className="p-4">
                      <Text weight="medium">${plan.priceMonthlyUsd / 100}</Text>
                      <Text size="xs" color="muted">/month</Text>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" size="sm">{plan.sortOrder}</Badge>
                    </td>
                    <td className="p-4">
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
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(plan)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Plan
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
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ── Custom Pricing (Overrides) Section ─────────────────────────

interface OverridesSectionProps {
  overrides: PlanOverride[];
  loadingOverrides: boolean;
  onRemove: (id: string) => void;
  onOpenCreate: () => void;
}

function OverridesSection({ overrides, loadingOverrides, onRemove, onOpenCreate }: OverridesSectionProps) {
  const fmtInr = (v: number | null) => v != null ? `₹${(v / 100).toLocaleString('en-IN')}` : '—';

  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-6 py-4 border-b">
        <Flex between className="items-center">
          <Flex align="center" gap={2}>
            <CardTitle>Custom User Pricing</CardTitle>
            <SectionGuide
              title="Per-User Price Overrides"
              description="Grant a specific user a custom price for any paid plan. When active, this overrides the standard plan price for that user at Cashfree checkout and on their billing page. You can remove it any time."
              example="user@example.com → Creator at ₹499/mo instead of ₹799/mo"
            />
          </Flex>
          <Button variant="outline" size="sm" onClick={onOpenCreate}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Custom Price
          </Button>
        </Flex>
      </CardHeader>
      <CardContent className="p-0">
        {loadingOverrides ? (
          <Box className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </Box>
        ) : !overrides.length ? (
          <Box className="p-10 text-center">
            <IndianRupee className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <Text weight="medium">No custom pricing yet</Text>
            <Text size="sm" color="muted" className="mt-1">
              Click "Add Custom Price" to give a specific user a special rate.
            </Text>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                  <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Plan</th>
                  <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Custom Monthly</th>
                  <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Custom Yearly</th>
                  <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Note</th>
                  <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Since</th>
                  <th className="h-11 px-4 text-right align-middle font-medium text-muted-foreground">Remove</th>
                </tr>
              </thead>
              <tbody>
                {overrides.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <Text weight="medium" className="truncate max-w-[180px]">{o.user_email}</Text>
                      {o.user_name && <Text size="xs" color="muted">{o.user_name}</Text>}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" size="sm" className="capitalize">{o.plan_id}</Badge>
                    </td>
                    <td className="p-4">
                      <Text weight="medium">{fmtInr(o.custom_monthly_inr)}</Text>
                      {o.custom_monthly_usd != null && (
                        <Text size="xs" color="muted">${(o.custom_monthly_usd / 100).toFixed(2)}</Text>
                      )}
                    </td>
                    <td className="p-4">
                      <Text weight="medium">{fmtInr(o.custom_yearly_inr)}</Text>
                    </td>
                    <td className="p-4 max-w-[160px]">
                      <Text size="sm" color="muted" className="line-clamp-2">{o.note || '—'}</Text>
                    </td>
                    <td className="p-4">
                      <Text size="xs" color="muted">
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemove(o.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove override</span>
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

// ── Module-level cache ─────────────────────────────────────────
let cachedPlansData: Plan[] | null = null;

// ── Main Page ──────────────────────────────────────────────────

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>(cachedPlansData || []);
  const [loading, setLoading] = useState(!cachedPlansData);
  const [error, setError] = useState<string | null>(null);

  // Overrides state
  const [overrides, setOverrides] = useState<PlanOverride[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(true);

  // Create plan dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createId, setCreateId] = useState('');
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createMonthlyInr, setCreateMonthlyInr] = useState('');
  const [createYearlyInr, setCreateYearlyInr] = useState('');
  const [createAnnualMonthlyInr, setCreateAnnualMonthlyInr] = useState('');
  const [createMonthlyUsd, setCreateMonthlyUsd] = useState('0');
  const [createYearlyUsd, setCreateYearlyUsd] = useState('0');
  const [createOrder, setCreateOrder] = useState('0');

  // Edit plan dialog
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
  const [saving, setSaving] = useState(false);

  // Create override dialog
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
    if (!cachedPlansData) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(data || []);
      cachedPlansData = data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverrides = useCallback(async () => {
    setLoadingOverrides(true);
    try {
      const res = await fetch('/api/admin/plan-overrides');
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
      if (!res.ok) throw new Error('Failed to update plan');
      await fetchPlans();
    } catch (err) {
      console.error('Failed to toggle plan:', err);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete plan');
      await fetchPlans();
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  // Helper: parse INR rupee display value → paise integer
  const parseInrPaise = (val: string): number | undefined => {
    const n = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (isNaN(n)) return undefined;
    return Math.round(n * 100);
  };

  // Helper: parse USD dollar display value → cents integer
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
          },
          limits: {},
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create plan');
      }
      setCreateOpen(false);
      setCreateId(''); setCreateName(''); setCreateDesc('');
      setCreateMonthlyInr(''); setCreateYearlyInr(''); setCreateAnnualMonthlyInr('');
      setCreateMonthlyUsd('0'); setCreateYearlyUsd('0'); setCreateOrder('0');
      await fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (plan: Plan) => {
    const f = (plan.features as Record<string, unknown>) || {};
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
        }),
      });
      if (!res.ok) throw new Error('Failed to update plan');
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
    if (!ovUserEmail.trim() || !ovPlanId) {
      alert('User email and plan are required');
      return;
    }
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
      {/* Header */}
      <Flex between className="flex-wrap gap-4 items-center">
        <Box>
          <Flex align="center" gap={2}>
            <Text size="3xl" weight="bold">Plans Configuration</Text>
            <SectionGuide
              title="Pricing & Plan Tiers"
              description="Edit plan prices here — changes apply to the homepage, billing page, and Cashfree checkout automatically. You can also assign custom prices to individual users."
              example="Creator: ₹799/mo | Pro: ₹1,999/mo | Studio: ₹4,999/mo"
            />
          </Flex>
          <Text color="muted">Manage pricing plans, features, and user-level overrides</Text>
        </Box>
        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Plan
        </Button>
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
        onOpenCreate={() => setCreateOpen(true)}
      />

      {/* Custom Pricing Overrides */}
      <OverridesSection
        overrides={overrides}
        loadingOverrides={loadingOverrides}
        onRemove={handleRemoveOverride}
        onOpenCreate={() => setOverrideOpen(true)}
      />

      {/* ── Create Plan Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Pricing Plan</DialogTitle>
            <DialogDescription>Define a new subscription tier. Enter prices in actual rupees/dollars (e.g. 799 for ₹799).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-id">Plan ID * (slug, e.g. &apos;studio&apos;)</Label>
                <Input id="plan-id" value={createId} onChange={(e) => setCreateId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-name">Display Name *</Label>
                <Input id="plan-name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-desc">Description / Tagline</Label>
              <Input id="plan-desc" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
            </div>
            <div className="border-t pt-3">
              <Text size="sm" weight="medium" className="mb-3 flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" /> INR Pricing (paise — enter rupees, e.g. 799)
              </Text>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-monthly-inr" className="text-xs">Monthly (₹)</Label>
                  <Input id="c-monthly-inr" type="number" placeholder="799" value={createMonthlyInr} onChange={(e) => setCreateMonthlyInr(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-yearly-inr" className="text-xs">Yearly total (₹)</Label>
                  <Input id="c-yearly-inr" type="number" placeholder="7990" value={createYearlyInr} onChange={(e) => setCreateYearlyInr(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-ann-mo-inr" className="text-xs">Annual /mo display (₹)</Label>
                  <Input id="c-ann-mo-inr" type="number" placeholder="666" value={createAnnualMonthlyInr} onChange={(e) => setCreateAnnualMonthlyInr(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="border-t pt-3">
              <Text size="sm" weight="medium" className="mb-3">$ USD Pricing (enter dollars, e.g. 9)</Text>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-monthly-usd" className="text-xs">Monthly ($)</Label>
                  <Input id="c-monthly-usd" type="number" placeholder="9" value={createMonthlyUsd} onChange={(e) => setCreateMonthlyUsd(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-yearly-usd" className="text-xs">Yearly ($)</Label>
                  <Input id="c-yearly-usd" type="number" placeholder="90" value={createYearlyUsd} onChange={(e) => setCreateYearlyUsd(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-order">Sort Order (0, 1, 2…)</Label>
              <Input id="plan-order" type="number" value={createOrder} onChange={(e) => setCreateOrder(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !createId || !createName}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Plan Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Plan: {editingPlan?.name}</DialogTitle>
            <DialogDescription>Changes apply to the homepage, billing page, and Cashfree checkout immediately after save.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description / Tagline</Label>
              <Input id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className="border-t pt-3">
              <Text size="sm" weight="medium" className="mb-3 flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" /> INR Pricing (enter in rupees, e.g. 799)
              </Text>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e-monthly-inr" className="text-xs">Monthly (₹)</Label>
                  <Input id="e-monthly-inr" type="number" value={editMonthlyInr} onChange={(e) => setEditMonthlyInr(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-yearly-inr" className="text-xs">Yearly total (₹)</Label>
                  <Input id="e-yearly-inr" type="number" value={editYearlyInr} onChange={(e) => setEditYearlyInr(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-ann-mo-inr" className="text-xs">Annual /mo display (₹)</Label>
                  <Input id="e-ann-mo-inr" type="number" value={editAnnualMonthlyInr} onChange={(e) => setEditAnnualMonthlyInr(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="border-t pt-3">
              <Text size="sm" weight="medium" className="mb-3">$ USD Pricing (enter in dollars)</Text>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e-monthly-usd" className="text-xs">Monthly ($)</Label>
                  <Input id="e-monthly-usd" type="number" value={editMonthlyUsd} onChange={(e) => setEditMonthlyUsd(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-yearly-usd" className="text-xs">Yearly ($)</Label>
                  <Input id="e-yearly-usd" type="number" value={editYearlyUsd} onChange={(e) => setEditYearlyUsd(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-order">Sort Order</Label>
              <Input id="edit-order" type="number" value={editOrder} onChange={(e) => setEditOrder(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
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
                <option value="creator">Creator</option>
                <option value="pro">Pro</option>
                <option value="studio">Studio</option>
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
