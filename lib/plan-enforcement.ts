// ============================================================
// COMPATIBILITY FACADE — Delegates 100% to `@/lib/entitlements`
// Do NOT duplicate plan or quota logic here.
// ============================================================

export {
  type PlanLimits,
  type PlanFeatures,
  type WorkspacePlanInfo,
  type UsageSnapshot,
  type LimitCheckResult,
  type EntitlementPlanResult as PlanEnforcementResult,
  type PlanAction,
  clearPlanCache,
  getWorkspacePlanInfo,
  getUsageSnapshot,
  enforcePlanLimits,
  withWorkspacePlan as withPlanEnforcement,
  type WorkspacePlanEnforcementOptions as PlanEnforcementOptions,
  getEffectiveLimit,
  isFeatureEnabled,
  getPlanDisplayInfo,
  getReferralBonusAiCredits,
} from '@/lib/entitlements';
