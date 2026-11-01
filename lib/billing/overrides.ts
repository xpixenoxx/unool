/**
 * lib/billing/overrides.ts
 *
 * Server-side helpers for user-level custom plan pricing overrides.
 * Admin can grant a specific user/workspace a custom price for any plan.
 * These overrides take priority over the standard plan prices in create-order.
 *
 * Resilience:
 * Primary: Uses `user_plan_overrides` table in Supabase.
 * Fallback: If `user_plan_overrides` table has not yet been migrated (PGRST205 / schema cache),
 * seamlessly stores and reads overrides inside `plans.features.user_overrides`.
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

function isTableMissingError(err: unknown): boolean {
  if (!err) return false;
  const errorObj = err as Record<string, unknown>;
  const msg = String(
    errorObj.message || errorObj.details || errorObj.hint || err
  ).toLowerCase();
  const code = String(errorObj.code || '');
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('user_plan_overrides') ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  );
}

/**
 * Fallback storage: Persist override inside `plans.features.user_overrides`.
 */
async function saveOverrideToPlanFeatures(input: {
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

  const { data: planData } = await client
    .from('plans')
    .select('*')
    .eq('id', input.planId)
    .maybeSingle();

  let existingFeatures: Record<string, any> = {};
  if (planData?.features && typeof planData.features === 'object') {
    existingFeatures = { ...planData.features };
  }

  const existingOverrides: PlanOverride[] = Array.isArray(existingFeatures.user_overrides)
    ? existingFeatures.user_overrides
    : [];

  // Deactivate any existing active override for this workspace
  const updatedOverrides = existingOverrides.map((o) => {
    if (o.workspace_id === input.workspaceId && o.is_active) {
      return {
        ...o,
        is_active: false,
        removed_at: new Date().toISOString(),
        removed_by_admin_id: input.createdByAdminId,
        updated_at: new Date().toISOString(),
      };
    }
    return o;
  });

  const newOverride: PlanOverride = {
    id: crypto.randomUUID(),
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
    removed_by_admin_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    removed_at: null,
  };

  updatedOverrides.unshift(newOverride);

  const updatedFeatures = {
    ...existingFeatures,
    user_overrides: updatedOverrides,
  };

  if (planData) {
    const { error: updateError } = await client
      .from('plans')
      .update({
        features: updatedFeatures,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.planId);

    if (updateError) {
      throw new Error(updateError.message || 'Failed to update plan overrides in features');
    }
  } else {
    // If the plan is not in DB yet, upsert it
    const { error: upsertError } = await client
      .from('plans')
      .upsert({
        id: input.planId,
        name: input.planId.charAt(0).toUpperCase() + input.planId.slice(1),
        description: '',
        price_monthly_usd: 0,
        price_yearly_usd: 0,
        features: updatedFeatures,
        limits: {},
        is_active: true,
        sort_order: 1,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      throw new Error(upsertError.message || 'Failed to create plan for override');
    }
  }

  return newOverride;
}

/**
 * Get the active custom pricing override for a workspace + plan combination.
 * Returns null if no override exists or if DB is unavailable.
 */
export async function getActiveOverrideForWorkspace(
  workspaceId: string,
  planId: string
): Promise<PlanOverride | null> {
  const client = getAdminClient();

  // 1. Try dedicated table
  try {
    const { data, error } = await client
      .from('user_plan_overrides')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('plan_id', planId)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) return data as PlanOverride;
  } catch {
    // Continue to fallback
  }

  // 2. Fallback to plans.features.user_overrides
  try {
    const { data: planData, error: planError } = await client
      .from('plans')
      .select('features')
      .eq('id', planId)
      .maybeSingle();

    if (!planError && planData?.features) {
      const feat = planData.features as Record<string, any>;
      if (Array.isArray(feat.user_overrides)) {
        const found = feat.user_overrides.find(
          (o: any) => o && o.workspace_id === workspaceId && o.is_active
        );
        if (found) return found as PlanOverride;
      }
    }
  } catch (err) {
    console.warn('[getActiveOverrideForWorkspace] Fallback check failed:', err);
  }

  return null;
}

/**
 * Get all active overrides for a workspace (for billing page display).
 * Returns a map of planId → override for O(1) lookup.
 */
export async function getAllOverridesForWorkspace(
  workspaceId: string
): Promise<Record<string, PlanOverride>> {
  const client = getAdminClient();
  const result: Record<string, PlanOverride> = {};

  // 1. Try dedicated table
  try {
    const { data, error } = await client
      .from('user_plan_overrides')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    if (!error && Array.isArray(data)) {
      for (const o of data as PlanOverride[]) {
        result[o.plan_id] = o;
      }
    }
  } catch {
    // Table missing or query error, fall through
  }

  // 2. Fallback to plans.features.user_overrides
  try {
    const { data: plansData, error: plansError } = await client
      .from('plans')
      .select('id, features');

    if (!plansError && Array.isArray(plansData)) {
      for (const p of plansData) {
        if (!result[p.id]) {
          const feat = p.features as Record<string, any> | null;
          if (feat && Array.isArray(feat.user_overrides)) {
            const found = feat.user_overrides.find(
              (o: any) => o && o.workspace_id === workspaceId && o.is_active
            );
            if (found) {
              result[p.id] = found as PlanOverride;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[getAllOverridesForWorkspace] Fallback check failed:', err);
  }

  return result;
}

/**
 * List ALL active overrides (admin view). Ordered by created_at desc.
 */
export async function listAllActiveOverrides(): Promise<PlanOverride[]> {
  const client = getAdminClient();
  let dbOverrides: PlanOverride[] = [];

  // 1. Try dedicated table
  try {
    const { data, error } = await client
      .from('user_plan_overrides')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      dbOverrides = data as PlanOverride[];
    }
  } catch {
    // Table might be missing
  }

  // 2. Check plans.features.user_overrides fallback
  try {
    const { data: plansData, error: plansError } = await client
      .from('plans')
      .select('id, features');

    if (!plansError && Array.isArray(plansData)) {
      const fallbackOverrides: PlanOverride[] = [];
      for (const p of plansData) {
        const feat = p.features as Record<string, any> | null;
        if (feat && Array.isArray(feat.user_overrides)) {
          for (const ov of feat.user_overrides) {
            if (ov && ov.is_active) {
              fallbackOverrides.push(ov as PlanOverride);
            }
          }
        }
      }

      const seenIds = new Set(dbOverrides.map((o) => o.id));
      for (const ov of fallbackOverrides) {
        if (!seenIds.has(ov.id)) {
          dbOverrides.push(ov);
          seenIds.add(ov.id);
        }
      }
    }
  } catch (err) {
    console.warn('[listAllActiveOverrides] Fallback check failed:', err);
  }

  return dbOverrides.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
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

  // Try dedicated table first
  try {
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

    if (!error && data) {
      return data as PlanOverride;
    }

    if (error && !isTableMissingError(error)) {
      throw new Error(error.message || 'Failed to create override');
    }
  } catch (err) {
    if (!isTableMissingError(err)) {
      throw err;
    }
  }

  // Fallback to storing inside `plans.features.user_overrides`
  return await saveOverrideToPlanFeatures(input);
}

/**
 * Remove (deactivate) an override by ID.
 */
export async function removeOverride(
  overrideId: string,
  removedByAdminId: string
): Promise<boolean> {
  const client = getAdminClient();
  let removed = false;

  // 1. Try dedicated table
  try {
    const { data, error } = await client
      .from('user_plan_overrides')
      .update({
        is_active: false,
        removed_at: new Date().toISOString(),
        removed_by_admin_id: removedByAdminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', overrideId)
      .eq('is_active', true)
      .select('id');

    if (!error && Array.isArray(data) && data.length > 0) {
      removed = true;
    }
  } catch {
    // Table missing or failed
  }

  // 2. Also remove from plans.features.user_overrides
  try {
    const { data: plansData, error: plansError } = await client
      .from('plans')
      .select('id, features');

    if (!plansError && Array.isArray(plansData)) {
      for (const p of plansData) {
        const feat = p.features as Record<string, any> | null;
        if (feat && Array.isArray(feat.user_overrides)) {
          let modified = false;
          const updatedOverrides = feat.user_overrides.map((o: any) => {
            if (o && o.id === overrideId && o.is_active) {
              modified = true;
              return {
                ...o,
                is_active: false,
                removed_at: new Date().toISOString(),
                removed_by_admin_id: removedByAdminId,
                updated_at: new Date().toISOString(),
              };
            }
            return o;
          });

          if (modified) {
            await client
              .from('plans')
              .update({
                features: {
                  ...feat,
                  user_overrides: updatedOverrides,
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', p.id);
            removed = true;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[removeOverride] Fallback removal failed:', err);
  }

  return removed;
}
