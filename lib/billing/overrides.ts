/**
 * lib/billing/overrides.ts
 *
 * Server-side helpers for user-level custom plan pricing overrides.
 * Admin can grant a specific user/workspace a custom price for any plan.
 * These overrides take priority over the standard plan prices in create-order.
 */

import { createClient } from '@supabase/supabase-js';

export interface PlanOverride {
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
  is_active: boolean;
  created_by_admin_id: string;
  removed_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
  removed_at: string | null;
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

/**
 * Get the active custom pricing override for a workspace + plan combination.
 * Returns null if no override exists or if DB is unavailable.
 */
export async function getActiveOverrideForWorkspace(
  workspaceId: string,
  planId: string
): Promise<PlanOverride | null> {
  try {
    const client = getAdminClient();
    const { data, error } = await client
      .from('user_plan_overrides')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('plan_id', planId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as PlanOverride;
  } catch {
    return null;
  }
}

/**
 * Get all active overrides for a workspace (for billing page display).
 * Returns a map of planId → override for O(1) lookup.
 */
export async function getAllOverridesForWorkspace(
  workspaceId: string
): Promise<Record<string, PlanOverride>> {
  try {
    const client = getAdminClient();
    const { data, error } = await client
      .from('user_plan_overrides')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    if (error || !data) return {};
    return Object.fromEntries((data as PlanOverride[]).map((o) => [o.plan_id, o]));
  } catch {
    return {};
  }
}

/**
 * List ALL active overrides (admin view). Ordered by created_at desc.
 */
export async function listAllActiveOverrides(): Promise<PlanOverride[]> {
  try {
    const client = getAdminClient();
    const { data, error } = await client
      .from('user_plan_overrides')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as PlanOverride[];
  } catch {
    return [];
  }
}

/**
 * Create a custom pricing override for a user/workspace.
 * If an active override already exists for the same workspace+plan, it is
 * deactivated first (replaced by the new one).
 */
export async function createOverride(input: {
  workspaceId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  planId: string;
  customMonthlyInr?: number;
  customYearlyInr?: number;
  customAnnualMonthlyInr?: number;
  customMonthlyUsd?: number;
  customYearlyUsd?: number;
  note?: string;
  createdByAdminId: string;
}): Promise<PlanOverride> {
  const client = getAdminClient();

  // Deactivate any existing active override for the same workspace+plan
  await client
    .from('user_plan_overrides')
    .update({
      is_active: false,
      removed_at: new Date().toISOString(),
      removed_by_admin_id: input.createdByAdminId,
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', input.workspaceId)
    .eq('plan_id', input.planId)
    .eq('is_active', true);

  const { data, error } = await client
    .from('user_plan_overrides')
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      user_email: input.userEmail,
      user_name: input.userName || null,
      plan_id: input.planId,
      custom_monthly_inr: input.customMonthlyInr ?? null,
      custom_yearly_inr: input.customYearlyInr ?? null,
      custom_annual_monthly_inr: input.customAnnualMonthlyInr ?? null,
      custom_monthly_usd: input.customMonthlyUsd ?? null,
      custom_yearly_usd: input.customYearlyUsd ?? null,
      note: input.note || null,
      is_active: true,
      created_by_admin_id: input.createdByAdminId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create override');
  return data as PlanOverride;
}

/**
 * Remove (deactivate) an override by ID.
 */
export async function removeOverride(
  overrideId: string,
  removedByAdminId: string
): Promise<boolean> {
  try {
    const client = getAdminClient();
    const { error } = await client
      .from('user_plan_overrides')
      .update({
        is_active: false,
        removed_at: new Date().toISOString(),
        removed_by_admin_id: removedByAdminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', overrideId)
      .eq('is_active', true);

    return !error;
  } catch {
    return false;
  }
}

