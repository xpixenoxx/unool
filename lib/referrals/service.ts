// ============================================================
// lib/referrals/service.ts — Referral System Core
// Generates codes, tracks clicks/signups atomically, issues
// spendable AI credits + Spark 30d Creator rewards, and reverses
// rewards cleanly on refunds.
// ============================================================
import { resolvePrimaryWorkspaceId } from '@/lib/auth/workspaceAccess';
import { normalizePlanId } from '@/lib/billing/plans';
import { clearPlanCache } from '@/lib/entitlements';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ── Constants ──────────────────────────────────────────────────────────────────

/** AI credits awarded to referrer when a free signup happens */
export const REWARD_FREE_SIGNUP_CREDITS = 200;

/** Free months & bonus AI credits when referral converts to paid */
export const REWARD_PAID_CONVERSION_MONTHS = 1;
export const AI_CREDITS_PER_MONTH = 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReferralCode {
  id: string;
  userId: string;
  workspaceId: string;
  code: string;
  clickCount: number;
  signupCount: number;
  conversionCount: number;
  rewardsEarned: number;
  creditsUsed: number;
  availableCredits: number;
  monthsEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  status: 'signed_up' | 'converted' | 'rewarded' | 'refunded';
  rewardType: string | null;
  rewardAppliedAt: string | null;
  createdAt: string;
}

// ── Code Generation ────────────────────────────────────────────────────────────

function generateCode(name: string): string {
  const clean = (name || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = clean.length >= 3 ? clean.slice(0, 4) : 'UNO';
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += charset[bytes[i] % charset.length];
  }
  return `${prefix}${suffix}`;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Get or create a referral code for a user.
 * Uses real resolved workspaceId (never stores userId as workspaceId if a workspace exists).
 */
export async function getOrCreateReferralCode(
  userId: string,
  workspaceId: string,
  displayName: string
): Promise<ReferralCode> {
  const resolvedWsId =
    workspaceId && workspaceId !== userId
      ? workspaceId
      : (await resolvePrimaryWorkspaceId(userId)) || workspaceId || userId;

  const { data: existing } = await supabaseAdmin
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (existing.workspace_id === userId && resolvedWsId !== userId) {
      await supabaseAdmin
        .from('referral_codes')
        .update({ workspace_id: resolvedWsId, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      (existing as Record<string, unknown>).workspace_id = resolvedWsId;
    }
    return rowToCode(existing as Record<string, unknown>);
  }

  let code = generateCode(displayName || 'USER');
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: collision } = await supabaseAdmin
      .from('referral_codes')
      .select('id')
      .eq('code', code)
      .limit(1)
      .maybeSingle();

    if (!collision) break;
    code = generateCode(displayName || 'USER');
  }

  const { data, error } = await supabaseAdmin
    .from('referral_codes')
    .insert({ user_id: userId, workspace_id: resolvedWsId, code })
    .select()
    .single();

  if (error) {
    // Handle concurrent insert race cleanly
    if (error.code === '23505') {
      const { data: raced } = await supabaseAdmin
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (raced) return rowToCode(raced as Record<string, unknown>);
    }
    throw new Error(`getOrCreateReferralCode: ${error.message}`);
  }
  return rowToCode(data as Record<string, unknown>);
}

export function sanitizeReferralCodeInput(raw: string | null | undefined): string {
  const cleaned = (raw || '').trim();
  if (!cleaned || cleaned.length < 3 || cleaned.length > 32) return '';
  if (!/^[A-Za-z0-9_-]+$/.test(cleaned)) return '';
  return cleaned.toUpperCase();
}

/**
 * Resolve a referral code row by exact `code` OR fallback creator `profiles.subdomain`
 * (used when MadeWithUnoolCTA falls back to `?ref=<subdomain>`).
 */
async function resolveReferralCodeRecord(rawCode: string): Promise<Record<string, unknown> | null> {
  const cleanCode = sanitizeReferralCodeInput(rawCode);
  if (!cleanCode) return null;

  const { data: directRow, error: directErr } = await supabaseAdmin
    .from('referral_codes')
    .select('*')
    .eq('code', cleanCode)
    .limit(1)
    .maybeSingle();

  if (!directErr && directRow) {
    return directRow as Record<string, unknown>;
  }

  // Fallback: check if the code matches an active creator profile subdomain
  try {
    const subdomainCandidate = cleanCode.toLowerCase();
    const { data: profileRow } = await supabaseAdmin
      .from('profiles')
      .select('user_id, workspace_id, name, subdomain')
      .eq('subdomain', subdomainCandidate)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    const prof = profileRow as Record<string, unknown> | null;
    if (prof?.user_id) {
      const created = await getOrCreateReferralCode(
        prof.user_id as string,
        (prof.workspace_id as string) || (prof.user_id as string),
        (prof.name as string) || (prof.subdomain as string) || 'USER'
      );
      const { data: resolvedRow } = await supabaseAdmin
        .from('referral_codes')
        .select('*')
        .eq('code', created.code)
        .limit(1)
        .maybeSingle();
      if (resolvedRow) {
        return resolvedRow as Record<string, unknown>;
      }
      return {
        id: created.id,
        user_id: created.userId,
        workspace_id: created.workspaceId,
        code: created.code,
        click_count: created.clickCount,
        signup_count: created.signupCount,
        conversion_count: created.conversionCount,
        rewards_earned: created.rewardsEarned,
        credits_used: created.creditsUsed,
        months_earned: created.monthsEarned,
        created_at: created.createdAt,
        updated_at: created.updatedAt,
      };
    }
  } catch {
    // Non-fatal if profiles table is mocked or unavailable
  }

  return null;
}

/**
 * Atomically record a referral click.
 */
export async function recordReferralClick(code: string): Promise<ReferralCode | null> {
  const cleanCode = sanitizeReferralCodeInput(code);
  if (!cleanCode) return null;

  try {
    const { data: rpcRows, error: rpcErr } = await supabaseAdmin.rpc('increment_referral_click', {
      target_code: cleanCode,
    });
    if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
      return rowToCode(rpcRows[0] as Record<string, unknown>);
    }
  } catch {
    // Fallback below if RPC is unavailable, mocked, or code is a subdomain alias
  }

  const data = await resolveReferralCodeRecord(cleanCode);
  if (!data) return null;

  const canonicalCode = ((data.code as string) || cleanCode).trim().toUpperCase();

  // If cleanCode was a subdomain alias, try atomic RPC on the resolved canonical code first
  if (canonicalCode !== cleanCode) {
    try {
      const { data: aliasRpcRows, error: aliasRpcErr } = await supabaseAdmin.rpc('increment_referral_click', {
        target_code: canonicalCode,
      });
      if (!aliasRpcErr && Array.isArray(aliasRpcRows) && aliasRpcRows.length > 0) {
        return rowToCode(aliasRpcRows[0] as Record<string, unknown>);
      }
    } catch {
      // Fallback update below
    }
  }

  const nextCount = (Number(data.click_count) || 0) + 1;
  await supabaseAdmin
    .from('referral_codes')
    .update({
      click_count: nextCount,
      updated_at: new Date().toISOString(),
    })
    .eq('code', canonicalCode);

  return rowToCode({ ...data, click_count: nextCount });
}

/**
 * Record signup attribution once per new referred user and award signup AI credits.
 */
export async function recordReferralSignup(
  referredUserId: string,
  referralCode: string
): Promise<void> {
  const cleanInput = sanitizeReferralCodeInput(referralCode);
  if (!cleanInput || !referredUserId) return;

  const codeRow = await resolveReferralCodeRecord(cleanInput);
  if (!codeRow) {
    logger.warn('recordReferralSignup: code not found', { referralCode: cleanInput });
    return;
  }

  const code = codeRow;
  const cleanCode = ((code.code as string) || cleanInput).trim().toUpperCase();
  const referrerUserId = code.user_id as string;
  if (!referrerUserId || referrerUserId === referredUserId) return;

  const { data: existing } = await supabaseAdmin
    .from('referrals')
    .select('id')
    .eq('referred_user_id', referredUserId)
    .limit(1)
    .maybeSingle();

  if (existing) return;

  const { error: insertErr } = await supabaseAdmin.from('referrals').insert({
    referrer_user_id: referrerUserId,
    referred_user_id: referredUserId,
    referral_code: cleanCode,
    status: 'signed_up',
  });

  if (insertErr) {
    if (insertErr.code !== '23505') {
      logger.error('recordReferralSignup insert failed', {
        error: new Error(insertErr.message),
      });
    }
    return;
  }

  // Atomically increment signup_count + rewards_earned
  let appliedViaRpc = false;
  try {
    const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('apply_referral_signup_reward', {
      target_code: cleanCode,
      reward_credits: REWARD_FREE_SIGNUP_CREDITS,
    });
    if (!rpcErr && Array.isArray(rpcRes) && rpcRes.length > 0) {
      appliedViaRpc = true;
    }
  } catch {
    appliedViaRpc = false;
  }

  if (!appliedViaRpc) {
    await supabaseAdmin
      .from('referral_codes')
      .update({
        signup_count: (Number(code.signup_count) || 0) + 1,
        rewards_earned: (Number(code.rewards_earned) || 0) + REWARD_FREE_SIGNUP_CREDITS,
        updated_at: new Date().toISOString(),
      })
      .eq('code', cleanCode);
  }

  if (typeof code.workspace_id === 'string' && code.workspace_id) {
    clearPlanCache(code.workspace_id);
  }

  await logReferralLedger(referrerUserId, REWARD_FREE_SIGNUP_CREDITS, 'referral_signup');

  logger.info('Referral signup recorded + credits granted', {
    referrerUserId,
    referredUserId,
    referralCode: cleanCode,
    credits: REWARD_FREE_SIGNUP_CREDITS,
  });
}

/**
 * Record paid conversion atomically:
 *  - Claims pending referral (`status = 'signed_up' -> 'rewarded'`) once
 *  - Grants spendable AI credits + conversion counters
 *  - Extends active paid subscription OR upgrades Spark referrer to 30-day Creator plan
 */
export async function recordReferralConversion(referredUserId: string): Promise<void> {
  const { data: claimedRows, error: claimErr } = await supabaseAdmin
    .from('referrals')
    .update({
      status: 'rewarded',
      reward_type: 'creator_30d_and_credits',
      reward_applied_at: new Date().toISOString(),
    })
    .eq('referred_user_id', referredUserId)
    .eq('status', 'signed_up')
    .select('*');

  if (claimErr || !claimedRows || claimedRows.length === 0) {
    logger.debug('recordReferralConversion: no pending referral to claim', { referredUserId });
    return;
  }

  const ref = claimedRows[0] as Record<string, unknown>;
  const referrerUserId = ref.referrer_user_id as string;
  const referralCode = ((ref.referral_code as string) || '').trim().toUpperCase();
  const creditsToGrant = REWARD_PAID_CONVERSION_MONTHS * AI_CREDITS_PER_MONTH;

  // Adjust referral_codes counters + credits atomically
  let adjustedViaRpc = false;
  try {
    const { data: rpcRows, error: rpcErr } = await supabaseAdmin.rpc('adjust_referral_conversion_rewards', {
      target_code: referralCode,
      delta_conversions: 1,
      delta_credits: creditsToGrant,
      delta_months: REWARD_PAID_CONVERSION_MONTHS,
    });
    if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
      adjustedViaRpc = true;
    }
  } catch {
    adjustedViaRpc = false;
  }

  if (!adjustedViaRpc) {
    const { data: codeRow } = await supabaseAdmin
      .from('referral_codes')
      .select('conversion_count, months_earned, rewards_earned')
      .eq('code', referralCode)
      .limit(1)
      .maybeSingle();

    if (codeRow) {
      const cr = codeRow as Record<string, unknown>;
      await supabaseAdmin
        .from('referral_codes')
        .update({
          conversion_count: (Number(cr.conversion_count) || 0) + 1,
          months_earned: (Number(cr.months_earned) || 0) + REWARD_PAID_CONVERSION_MONTHS,
          rewards_earned: (Number(cr.rewards_earned) || 0) + creditsToGrant,
          updated_at: new Date().toISOString(),
        })
        .eq('code', referralCode);
    }
  }

  await logReferralLedger(referrerUserId, creditsToGrant, 'referral_conversion');

  // Grant real workspace plan time on referrer's primary owned workspace
  try {
    const { data: ownedWs } = await supabaseAdmin
      .from('workspaces')
      .select('id, plan, plan_status, plan_expires_at')
      .eq('owner_id', referrerUserId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownedWs?.id) {
      const { data: activeSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id, plan_id, current_period_end, amount_paise')
        .eq('workspace_id', ownedWs.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      const nowMs = Date.now();
      const currentPlan = normalizePlanId(ownedWs.plan as string | undefined);

      if (activeSub?.id && activeSub.current_period_end) {
        const currentEndMs = new Date(activeSub.current_period_end).getTime();
        const newEnd = new Date(Math.max(currentEndMs, nowMs) + THIRTY_DAYS_MS).toISOString();

        await supabaseAdmin
          .from('subscriptions')
          .update({ current_period_end: newEnd, updated_at: new Date().toISOString() })
          .eq('id', activeSub.id);

        await supabaseAdmin
          .from('workspaces')
          .update({ plan_expires_at: newEnd, updated_at: new Date().toISOString() })
          .eq('id', ownedWs.id);

        clearPlanCache(ownedWs.id);
        logger.info('Extended referrer active subscription by 30 days', { referrerUserId, workspaceId: ownedWs.id, newEnd });
      } else if (currentPlan === 'spark') {
        const nowIso = new Date(nowMs).toISOString();
        const creatorEndIso = new Date(nowMs + THIRTY_DAYS_MS).toISOString();

        await supabaseAdmin
          .from('workspaces')
          .update({
            plan: 'creator',
            plan_status: 'active',
            plan_expires_at: creatorEndIso,
            updated_at: nowIso,
          })
          .eq('id', ownedWs.id);

        await supabaseAdmin
          .from('subscriptions')
          .upsert(
            {
              workspace_id: ownedWs.id,
              user_id: referrerUserId,
              plan_id: 'creator',
              billing_cycle: 'monthly',
              amount_paise: 0,
              currency: 'INR',
              status: 'active',
              current_period_start: nowIso,
              current_period_end: creatorEndIso,
              trial_end: creatorEndIso,
              metadata: { source: 'referral_reward', referred_user_id: referredUserId },
              updated_at: nowIso,
            },
            { onConflict: 'workspace_id' }
          );

        clearPlanCache(ownedWs.id);
        logger.info('Granted 30-day Creator plan voucher to Spark referrer', {
          referrerUserId,
          workspaceId: ownedWs.id,
          expiresAt: creatorEndIso,
        });
      } else {
        // Paid workspace without an active subscriptions row or current_period_end:
        // still extend workspaces.plan_expires_at by 30 days so paid referrers never miss their reward.
        const existingExpiresMs = ownedWs.plan_expires_at ? new Date(ownedWs.plan_expires_at as string).getTime() : 0;
        const baseMs = Number.isFinite(existingExpiresMs) && existingExpiresMs > nowMs ? existingExpiresMs : nowMs;
        const newEndIso = new Date(baseMs + THIRTY_DAYS_MS).toISOString();

        await supabaseAdmin
          .from('workspaces')
          .update({
            plan_status: 'active',
            plan_expires_at: newEndIso,
            updated_at: new Date(nowMs).toISOString(),
          })
          .eq('id', ownedWs.id);

        clearPlanCache(ownedWs.id);
        logger.info('Extended referrer workspace plan_expires_at by 30 days', {
          referrerUserId,
          workspaceId: ownedWs.id,
          newEnd: newEndIso,
        });
      }
    }
  } catch (subErr) {
    logger.warn('Failed to apply plan duration reward for referrer', { error: subErr, referrerUserId });
  }
}

/**
 * Reverse referral conversion rewards if the referred user's paid order is refunded.
 */
export async function revokeReferralConversionOnRefund(
  referredUserId: string,
  orderId?: string
): Promise<{ revoked: boolean; referrerUserId?: string }> {
  const { data: claimedRows, error: claimErr } = await supabaseAdmin
    .from('referrals')
    .update({ status: 'refunded' })
    .eq('referred_user_id', referredUserId)
    .in('status', ['converted', 'rewarded'])
    .select('*');

  if (claimErr || !claimedRows || claimedRows.length === 0) {
    return { revoked: false };
  }

  const ref = claimedRows[0] as Record<string, unknown>;
  const referrerUserId = ref.referrer_user_id as string;
  const referralCode = ((ref.referral_code as string) || '').trim().toUpperCase();
  const creditsToDebit = REWARD_PAID_CONVERSION_MONTHS * AI_CREDITS_PER_MONTH;

  let adjustedViaRpc = false;
  try {
    const { data: rpcRows, error: rpcErr } = await supabaseAdmin.rpc('adjust_referral_conversion_rewards', {
      target_code: referralCode,
      delta_conversions: -1,
      delta_credits: -creditsToDebit,
      delta_months: -REWARD_PAID_CONVERSION_MONTHS,
    });
    if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
      adjustedViaRpc = true;
    }
  } catch {
    adjustedViaRpc = false;
  }

  if (!adjustedViaRpc) {
    const { data: codeRow } = await supabaseAdmin
      .from('referral_codes')
      .select('conversion_count, months_earned, rewards_earned, credits_used')
      .eq('code', referralCode)
      .limit(1)
      .maybeSingle();

    if (codeRow) {
      const cr = codeRow as Record<string, unknown>;
      const used = Number(cr.credits_used) || 0;
      await supabaseAdmin
        .from('referral_codes')
        .update({
          conversion_count: Math.max(0, (Number(cr.conversion_count) || 0) - 1),
          months_earned: Math.max(0, (Number(cr.months_earned) || 0) - REWARD_PAID_CONVERSION_MONTHS),
          rewards_earned: Math.max(used, (Number(cr.rewards_earned) || 0) - creditsToDebit),
          updated_at: new Date().toISOString(),
        })
        .eq('code', referralCode);
    }
  }

  await logReferralLedger(referrerUserId, -creditsToDebit, 'referral_refund_reversal');

  // Reverse the 30-day workspace plan grant / extension if applicable
  try {
    const { data: ownedWs } = await supabaseAdmin
      .from('workspaces')
      .select('id, plan, plan_expires_at')
      .eq('owner_id', referrerUserId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownedWs?.id) {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('id, plan_id, amount_paise, status, current_period_end, metadata')
        .eq('workspace_id', ownedWs.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (sub?.id) {
        const nowMs = Date.now();
        const isReferralGrantSub =
          Number(sub.amount_paise) === 0 &&
          sub.plan_id === 'creator' &&
          (sub.metadata as Record<string, unknown> | null)?.source === 'referral_reward';

        if (isReferralGrantSub) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'expired', updated_at: new Date(nowMs).toISOString() })
            .eq('id', sub.id);

          await supabaseAdmin
            .from('workspaces')
            .update({ plan: 'spark', plan_status: 'active', plan_expires_at: null, updated_at: new Date(nowMs).toISOString() })
            .eq('id', ownedWs.id);
        } else if (sub.current_period_end) {
          const reducedMs = new Date(sub.current_period_end).getTime() - THIRTY_DAYS_MS;
          const clampedIso = new Date(Math.max(nowMs, reducedMs)).toISOString();

          await supabaseAdmin
            .from('subscriptions')
            .update({ current_period_end: clampedIso, updated_at: new Date(nowMs).toISOString() })
            .eq('id', sub.id);

          await supabaseAdmin
            .from('workspaces')
            .update({ plan_expires_at: clampedIso, updated_at: new Date(nowMs).toISOString() })
            .eq('id', ownedWs.id);
        }

        clearPlanCache(ownedWs.id);
      }
    }
  } catch (subErr) {
    logger.warn('Failed to reverse referrer plan extension on refund', {
      error: subErr,
      referrerUserId,
      orderId,
    });
  }

  logger.info('Referral conversion reversed on refund', {
    referrerUserId,
    referredUserId,
    orderId,
  });

  return { revoked: true, referrerUserId };
}

/**
 * Get referral stats for a user's dashboard.
 */
export async function getReferralStats(userId: string): Promise<{
  code: ReferralCode | null;
  referrals: Referral[];
}> {
  const [codeResult, referralsResult] = await Promise.all([
    supabaseAdmin
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return {
    code: codeResult.data ? rowToCode(codeResult.data as Record<string, unknown>) : null,
    referrals: (referralsResult.data ?? []).map(rowToReferral),
  };
}

// ── Internal: Ledger Helper ───────────────────────────────────────────────────

async function logReferralLedger(userId: string, credits: number, reason: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('referral_rewards').insert({
      user_id: userId,
      credits,
      reason,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Failed to insert referral_rewards ledger row', {
        userId,
        credits,
        reason,
        error: new Error(error.message),
      });
    }
  } catch (err) {
    logger.error('referral_rewards ledger write threw', {
      userId,
      credits,
      reason,
      error: err instanceof Error ? err : new Error(String(err)),
    });
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToCode(row: Record<string, unknown>): ReferralCode {
  const rewardsEarned = Number(row.rewards_earned ?? 0);
  const creditsUsed = Number(row.credits_used ?? 0);
  return {
    id: row.id as string,
    userId: row.user_id as string,
    workspaceId: row.workspace_id as string,
    code: row.code as string,
    clickCount: Number(row.click_count ?? 0),
    signupCount: Number(row.signup_count ?? 0),
    conversionCount: Number(row.conversion_count ?? 0),
    rewardsEarned,
    creditsUsed,
    availableCredits: Math.max(0, rewardsEarned - creditsUsed),
    monthsEarned: Number(row.months_earned ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToReferral(row: Record<string, unknown>): Referral {
  return {
    id: row.id as string,
    referrerUserId: row.referrer_user_id as string,
    referredUserId: row.referred_user_id as string,
    referralCode: row.referral_code as string,
    status: row.status as Referral['status'],
    rewardType: (row.reward_type as string) ?? null,
    rewardAppliedAt: (row.reward_applied_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}
