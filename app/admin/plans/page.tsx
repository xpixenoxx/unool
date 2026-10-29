'use client';

import * as React from 'react';
import {
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Loader2,
  DollarSign,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
} from '@/components/ui';
import { SectionGuide } from '@/components/admin/section-guide';
import { useState, useEffect, useCallback } from 'react';
import { Plan } from '@/lib/repositories/interfaces/IAdminRepository';

interface PlanTableProps {
  plans: Plan[];
  loading: boolean;
  onToggleActive: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  onOpenCreate: () => void;
}

function PlanTable({
  plans,
  loading,
  onToggleActive,
  onDelete,
  onEdit,
  onOpenCreate,
}: PlanTableProps) {
  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-6 py-4 border-b">
        <Flex between className="items-center">
          <Flex align="center" gap={2}>
            <CardTitle>Pricing Plans</CardTitle>
            <SectionGuide
              title="Pricing Plans Table"
              description="Controls all commercial tiers shown on the customer pricing and checkout pages. Toggle Active to enable or disable new customer subscriptions for that tier. Inactive tiers remain valid for existing subscribers."
              example="Spark: Free tier ($0)\nCreator: $9/mo ($90/yr)\nPro: $29/mo ($290/yr)\nStudio: $79/mo ($790/yr)"
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Monthly</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Yearly</th>
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
                      <Text weight="medium">${plan.priceMonthlyUsd}</Text>
                      <Text size="xs" color="muted">/month</Text>
                    </td>
                    <td className="p-4">
                      <Text weight="medium">${plan.priceYearlyUsd}</Text>
                      <Text size="xs" color="muted">/year</Text>
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

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createId, setCreateId] = useState('');
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createMonthly, setCreateMonthly] = useState('0');
  const [createYearly, setCreateYearly] = useState('0');
  const [createOrder, setCreateOrder] = useState('0');

  // Edit Dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMonthly, setEditMonthly] = useState('0');
  const [editYearly, setEditYearly] = useState('0');
  const [editOrder, setEditOrder] = useState('0');
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

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
    if (!confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete plan');
      await fetchPlans();
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  const handleCreate = async () => {
    if (!createId || !createName) {
      alert('Plan ID and Name are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: createId.trim().toLowerCase(),
          name: createName.trim(),
          description: createDesc.trim() || undefined,
          priceMonthlyUsd: parseFloat(createMonthly) || 0,
          priceYearlyUsd: parseFloat(createYearly) || 0,
          sortOrder: parseInt(createOrder) || 0,
          isActive: true,
          features: {},
          limits: {},
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create plan');
      }
      setCreateOpen(false);
      setCreateId('');
      setCreateName('');
      setCreateDesc('');
      await fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setEditName(plan.name);
    setEditDesc(plan.description || '');
    setEditMonthly(plan.priceMonthlyUsd.toString());
    setEditYearly(plan.priceYearlyUsd.toString());
    setEditOrder(plan.sortOrder.toString());
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || undefined,
          priceMonthlyUsd: parseFloat(editMonthly) || 0,
          priceYearlyUsd: parseFloat(editYearly) || 0,
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

  return (
    <Box className="space-y-6">
      <Flex between className="flex-wrap gap-4 items-center">
        <Box>
          <Flex align="center" gap={2}>
            <Text size="3xl" weight="bold">Plans Configuration</Text>
            <SectionGuide
              title="Pricing & Plan Tiers"
              description="Configure the platform plans, USD rates, sorting order, and active availability. These tiers determine the feature flags and limits injected into client workspaces."
              example="ID: creator | Monthly: $9 | Yearly: $90 | Active: Yes"
            />
          </Flex>
          <Text color="muted">Manage pricing plans, features, and limits</Text>
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

      <PlanTable
        plans={plans}
        loading={loading}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onEdit={openEdit}
        onOpenCreate={() => setCreateOpen(true)}
      />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Pricing Plan</DialogTitle>
            <DialogDescription>Define a new subscription tier for the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-id">Plan ID * (unique slug, e.g. &apos;studio&apos;)</Label>
              <Input id="plan-id" value={createId} onChange={(e) => setCreateId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-name">Display Name *</Label>
              <Input id="plan-name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-desc">Description</Label>
              <Input id="plan-desc" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-monthly">Price Monthly ($)</Label>
                <Input id="plan-monthly" type="number" value={createMonthly} onChange={(e) => setCreateMonthly(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-yearly">Price Yearly ($)</Label>
                <Input id="plan-yearly" type="number" value={createYearly} onChange={(e) => setCreateYearly(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-order">Sort Order (0, 1, 2...)</Label>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan: {editingPlan?.name}</DialogTitle>
            <DialogDescription>Update pricing and display details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Input id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-monthly">Price Monthly ($)</Label>
                <Input id="edit-monthly" type="number" value={editMonthly} onChange={(e) => setEditMonthly(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-yearly">Price Yearly ($)</Label>
                <Input id="edit-yearly" type="number" value={editYearly} onChange={(e) => setEditYearly(e.target.value)} />
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
    </Box>
  );
}
