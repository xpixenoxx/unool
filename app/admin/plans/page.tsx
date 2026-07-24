'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Plus, Loader2, Shield, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Box, Flex, Text, Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui';
import { MotionBox, MotionStack, hoverLift, staggerItem } from '@/components/ui/motion';
import { useState, useEffect } from 'react';
import { Plan, CreatePlanInput, UpdatePlanInput } from '@/lib/repositories/interfaces/IAdminRepository';

interface PlanTableProps {
  plans: Plan[];
  loading: boolean;
  onToggleActive: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

function PlanTable({ plans, loading, onToggleActive, onDelete }: PlanTableProps) {
  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-6 py-4 border-b">
        <Flex between>
          <CardTitle>Pricing Plans</CardTitle>
          <Button asChild variant="outline" size="sm">
            <a href="/admin/plans/new"><Plus className="mr-2 h-4 w-4" /> New Plan</a>
          </Button>
        </Flex>
      </CardHeader>
      <CardContent className="p-0">
        {!loading && !plans.length ? (
          <Box className="p-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <Text weight="medium">No plans configured</Text>
            <Text size="sm" color="muted" className="mt-1">Create your first pricing plan to get started</Text>
            <Button asChild variant="outline" className="mt-3" size="sm">
              <a href="/admin/plans/new">Create Plan</a>
            </Button>
          </Box>
        ) : (
          <>
            <Box className="overflow-x-auto">
              <table className="w-full" role="table">
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
                          <Text weight="medium"> {plan.name} </Text>
                          <Text size="xs" color="muted" className="font-mono truncate">{plan.id}</Text>
                          {plan.description && <Text size="sm" color="muted" className="line-clamp-1 mt-1">{plan.description}</Text>}
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
                      <td className="p-4"><Badge variant="secondary" size="sm">{plan.sortOrder}</Badge></td>
                      <td className="p-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={plan.isActive}
                            onChange={() => onToggleActive(plan)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
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
                            <DropdownMenuItem asChild>
                              <a href={`/admin/plans/${plan.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Plan
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(plan)}>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPlansPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPlans = React.useCallback(async () => {
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

  React.useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleToggleActive = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update plan');
      fetchPlans();
    } catch (err) {
      console.error('Failed to toggle plan:', err);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete plan');
      fetchPlans();
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  if (loading && !plans.length) {
    return (
      <MotionBox variant="fade">
        <Box className="space-y-6">
          <Flex between>
            <Box>
              <Text size="3xl" weight="bold">Plans</Text>
              <Text color="muted">Manage pricing plans and subscriptions</Text>
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
      <Flex between className="flex-wrap gap-4">
        <Box>
          <Text size="3xl" weight="bold">Plans</Text>
          <Text color="muted">Manage pricing plans, features, and limits</Text>
        </Box>
        <Button asChild variant="outline" size="sm">
          <a href="/admin/plans/new"><Plus className="mr-2 h-4 w-4" /> Create Plan</a>
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

      <MotionStack space={6} stagger={0.05}>
        <PlanTable plans={plans} loading={loading} onToggleActive={handleToggleActive} onDelete={handleDelete} />
      </MotionStack>
    </MotionBox>
  );
}