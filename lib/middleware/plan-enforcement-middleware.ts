// ============================================================
// COMPATIBILITY FACADE — Delegates 100% to `@/lib/entitlements`
// Do NOT duplicate plan or quota logic here.
// ============================================================

export {
  type PlanEnforcementContext,
  type RequestEnforcementResult as PlanEnforcementResult,
  getPlanContext,
  checkQuota,
  enforcePlanLimit,
  withMiddlewarePlanEnforcement as withPlanEnforcement,
  createPlanEnforcementMiddleware,
  planEnforcement,
  getReferralBonusAiCredits,
} from '@/lib/entitlements';
