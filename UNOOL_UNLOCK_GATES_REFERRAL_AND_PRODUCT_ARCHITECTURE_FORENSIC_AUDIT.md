# UNOOL — UNLOCK GATES, REFERRAL & PRODUCT-WIDE ARCHITECTURE FORENSIC AUDIT

**Audit Date:** 2026-11-17  
**Target Repository / Commit:** `audit_unlock_gates_referral` worktree @ `b03bbf5` (`main` head)  
**Cross-Checked Audit Branch:** `signal_investigation_deep_dive` @ `2e56d4e` (read-only via `git show` for prior Signal, Settings, and Profile baseline reconciliation)  
**Audit Mode:** Strictly Read-Only Forensic Investigation (Zero source, schema, route, config, or existing documentation modifications)  
**Evidence Standard:** Every factual claim is tagged `VERIFIED`, `PARTIALLY VERIFIED`, `INFERRED`, `UNVERIFIED`, `NOT IMPLEMENTED`, or `BLOCKED` and grounded in exact file paths, symbols, line ranges, and database migrations observed in this session.

---

## 1. Executive Findings

Unool has outgrown its current information architecture faster than its shared infrastructure. Across **`53` Next.js page routes (`app/**/page.tsx`)** and **`160` API route handlers (`app/api/**/route.ts`)** (plus top-level route handlers such as `app/r/[code]/route.ts` and `app/auth/callback/route.ts`) at commit `b03bbf5`, capabilities were built feature-by-feature with overlapping names, duplicate enforcement modules, parallel gating surfaces, and unmerged branch rebuilds.

### Top 10 Forensic Truths (`VERIFIED` in Repository Source)

1. **The Public "Unlock Gates" Product (`/dashboard/unlock-gates` → `/gate/[gateId]`) Is Broken End-to-End for Visitors:**
   - [`app/dashboard/unlock-gates/page.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/dashboard/unlock-gates/page.tsx#L1-L15) wraps [`FollowGateManagerPage`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/dashboard/follow-gates/FollowGateManagerPage.tsx#L13-L56), while `/dashboard/follow-gates` redirects back to `/dashboard/unlock-gates`.
   - [`FollowGateManager.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/components/follow-gate/FollowGateManager.tsx#L73-L93) discards `platformUserId` from `/api/platform/connections` and sends `igUserId: selectedConn?.platform_user_id || '0'` ([`L656`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/components/follow-gate/FollowGateManager.tsx#L656)) to [`POST /api/follow-gate`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/api/follow-gate/route.ts#L54-L73) — because `'0'` is truthy in JS, **every gate persists `ig_user_id = '0'`**.
   - Public visitor card [`FollowGateCard.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/components/follow-gate/FollowGateCard.tsx#L100-L127) opens `instagram.com/{handle}` with zero visitor IG OAuth and polls `/api/follow-gate/{gateId}/check?sessionToken=...` **without `visitorIgUserId`**, so [`check/route.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/api/follow-gate/%5BgateId%5D/check/route.ts#L51-L57) returns `{ followVerified: false, message: 'Waiting for visitor IG authentication' }` until timeout. Even if Meta sent a webhook, [`handleFollowWebhookEvent`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/follow-gate/service.ts#L362-L403) filters on `visitor_ig_user_id` (`NULL`), and [`checkFollowViaApi`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/follow-gate/service.ts#L287-L289) calls Meta's `/{creatorIgUserId}/followers` endpoint which is unsupported for arbitrary visitor verification.
   - Meanwhile, [`GET /api/follow-gate/[gateId]`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/api/follow-gate/%5BgateId%5D/route.ts#L12-L36) has a **P0 Cross-Workspace IDOR** exposing `unlockedContent`, and `FollowGateCard.tsx:274,287` renders unsanitized `unlockedContent.url` links (`javascript:` XSS).
2. **A Second, Working Follow-Gate Exists Separately Inside Automation (`require_follow_for_dm`):**
   - [`InstagramCommentAutomation.processDmFollowGate`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/services/InstagramCommentAutomation.ts#L864-L1188) uses Meta's real Messaging API (`/{IGSID}?fields=name,username,is_user_follow_business`) with Quick Reply `"I Followed! ✅"` inside Instagram DM conversations. Unlike standalone `/gate/[gateId]`, this pattern works within Meta's API rules, yet sits isolated inside Automation with no Spark entitlement block (`dm_concierge` bypassed at [`webhooks/instagram/route.ts:858`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/api/webhooks/instagram/route.ts#L858)), no monthly DM quota, and public comment prompts that ignore custom `followAskMessage`.
3. **Referral AI Credits Are a 100% Phantom Ledger & "1 Free Month" Fails for Free (`Spark`) Users:**
   - [`lib/referrals/service.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/referrals/service.ts#L195-L240) awards `+200` AI credits on signup and `+1000` on paid conversion by updating `referral_codes.rewards_earned` and writing `referral_rewards`. **Zero AI routes or quota enforcers read `referral_codes.rewards_earned` or `referral_rewards`.**
   - Paid conversion's `"1 free month"` ([`service.ts:260-287`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/referrals/service.ts#L260-L287)) only updates existing `status = 'active'` rows in `subscriptions`: **`Spark` referrers receive `0` free days**, and multi-workspace paid referrers fail `.maybeSingle()` silently.
4. **Referral Attribution & Admin Telemetry Have Severe Integrity & Abuse Flaws:**
   - [`MadeWithUnoolCTA.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/components/profile/MadeWithUnoolCTA.tsx#L46-L86) appends `?ref=<subdomain>` instead of `referral_codes.code`, dropping 100% of profile-badge referrals.
   - [`GET /auth/callback`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/auth/callback/route.ts#L115-L123) runs `recordReferralSignup` on every Google OAuth sign-in, letting existing accounts retroactively trigger signup credits.
   - [`GET /api/referrals`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/api/referrals/route.ts#L40-L43) races `getOrCreateReferralCode` against `getReferralStats` in `Promise.all` (returning `code: null` on first visit); [`ReferralDashboard.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/components/referrals/ReferralDashboard.tsx#L105-L129) subscribes to a non-existent `referrer_workspace_id` column and shares `/signup?ref=` instead of `/r/[code]`.
   - [`SupabaseAdminRepository.listReferralCodes`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/repositories/supabase/SupabaseAdminRepository.ts#L2919-L2964) **fabricates `clickCount = Math.max(row.click_count || 0, signupCount * 3)`** and mutates DB rows during `GET` requests.
5. **No Connection Exists Between Unlock Gates and Referrals (and None Should Be Created):**
   - `follow_gates` and `referrals` are completely disconnected in code and database schemas. Linking them would couple a broken B2C audience mechanic with a broken B2B referral ledger.
6. **Four Overlapping Entitlement & Limit Modules Create Enforcement Drift and Phantom Plan Promises:**
   - Unool ships [`lib/plan-enforcement.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/plan-enforcement.ts), [`lib/middleware/plan-enforcement-middleware.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/middleware/plan-enforcement-middleware.ts), [`lib/middleware/plan-enforcement.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/middleware/plan-enforcement.ts) (which **silently returns `{ allowed: true }`** for 23 of 30 `PlanAction`s), and [`lib/limits/enforcer.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/limits/enforcer.ts) + [`freeTier.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/limits/freeTier.ts) (used by Overview SSR [`app/dashboard/page.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/dashboard/page.tsx) without cross-checking `subscriptions`).
   - Paid plan capabilities (`custom_domain`, `approval_workflows`, `api_access` `/api/keys` consumers, `brand_voices` quota, `linkedin_comments_per_month`, `lead_scoring`) are unimplemented, unenforced, or mismatched in schema (`linkedin_comment_logs` table does not exist).
7. **Critical P0 Security Gaps Still Live on `main` (`b03bbf5`):**
   - [`middleware.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/middleware.ts#L10-L188) exits early for `/api/auth` before stripping `x-user-id`, allowing an unauthenticated attacker supplying a victim UUID header to mint a 30-day switch token via [`GET /api/auth/switch-account`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/api/auth/switch-account/route.ts#L16-L58) and overwrite the victim's password on `POST` (`updateUserById`). Legitimate account switching also destroys the user's password on every switch.
   - [`POST /api/analytics/time-spent`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/api/analytics/time-spent/route.ts#L67-L82) trusts unauthenticated `x-user-id` / `body.userId`, [`GET /api/profile/analytics`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/api/profile/analytics/route.ts#L78-L84) exposes an unauthenticated `?workspaceId=` IDOR, and [`/api/onboarding`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/api/onboarding/route.ts#L62-L255) omits `verifyWorkspaceAccess`.
8. **Multi-Workspace Support Crashes Authentication & Spawns Ghost Free Workspaces:**
   - [`middleware.ts:214`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/middleware.ts#L211-L215), [`lib/auth/context.ts:143`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/auth/context.ts#L139-L165), and [`lib/auth/server.ts:85`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/lib/auth/server.ts#L81-L85) call `.single()` on `workspace_members`; belonging to `>1` workspace causes `context.ts` to insert a new `'Personal Workspace'` (`plan: 'free'`) on every SSR render, and no Workspace Switcher exists.
9. **Significant Prior Audit & Rebuild Drift Across Branches:**
   - Branch `signal_investigation_deep_dive` (`2e56d4e`) holds rebuilt Signal (`4` views), Settings (`6` sections), and Profile audit fixes plus middleware patches that remain unmerged into `main` (`b03bbf5`).
10. **Product Overload Diagnosis:** Unool splits core jobs across 10 sidebar items, 5 legacy redirect/sub-routes, 2 disconnected analytics UIs (`/dashboard/signal` and out-of-shell `/analytics/linkedin`), 3+ overlapping onboarding/quest prompts, 2 follow-gate engines, and a Brand Materials public page builder buried inside Automation. Consolidation cuts top-level nav complexity while fixing user trust.

---

## 2. Current Product Architecture (`b03bbf5`)

Observed route topology across **`53` page routes** (`16` dashboard, `17` admin, `1` external analytics, `1` public gate, `3` onboarding, `3` auth, `10` public marketing/legal, `2` public profiles) and **`160` API handlers**:

| Surface | Route(s) | Primary Purpose | Current Status (`b03bbf5`) |
|---|---|---|---|
| **Dashboard Shell** | `app/dashboard/layout.tsx` | 3-group sidebar (`Overview`, `Create`: Studio / Flight plan / Signal / Automation, `Grow`: Unlock gates / Referrals, `Account`: Profile / Billing / Settings), `SignalStrip`, `SubdomainClaimPopup`, `DashboardTimeTracker`, Multi-Account Switcher | `VERIFIED` (hardcoded `'usha'` fallbacks at lines 695, 742, 827) |
| **Overview** | `/dashboard` (`DashboardClient.tsx`) | Greeting, KPI sparklines, platform connection tiles with multi-account pills, 4 tool cards, recent broadcasts, `ProfileCompletionQuest` | `VERIFIED` (uses `freeTier.ts`, links stale `/dashboard/schedule` at L1343) |
| **Create — Studio** | `/dashboard/studio` (alias `/dashboard/composer`), `/dashboard/publish` | AI adaptation, hook scorer, fold linter, beat sheet, humanizer, quick broadcast | `VERIFIED` (`STUDIO_AUDIT_REPORT.md`: `STU-001`..`STU-026`; `/publish` unlinked fallback) |
| **Create — Flight Plan** | `/dashboard/flightplan` (alias `/dashboard/schedule`) | 7-day AI narrative arc planner (`WeekArcGenerator`) & post scheduler | `VERIFIED` (legacy `/api/flightplan/generate` still alive) |
| **Create — Signal** | `/dashboard/signal` + out-of-shell `/analytics/linkedin` | Cross-platform deployment feed (`SignalClient.tsx`, 2,039 lines), DNA charts, resonance | `VERIFIED` (unmerged vs `signal_investigation_deep_dive`; `/analytics/linkedin` outside dashboard nav) |
| **Create — Automation** | `/dashboard/automation` (flag `automationEnabled`) | 4 platform tabs (IG, FB, Threads, LinkedIn) + embedded **Brand Materials** builder + In-DM Follow Gate | `VERIFIED` |
| **Grow — Unlock Gates** | `/dashboard/unlock-gates` (redirect `/dashboard/follow-gates`), `/gate/[gateId]` | Standalone Instagram follow-to-unlock micro-gates | `VERIFIED` (public visitor unlock flow broken) |
| **Grow — Referrals** | `/dashboard/referrals`, `/r/[code]` | Referral link sharing, AI credits + free month tracking | `VERIFIED` (AI credits unspendable; free month broken for Spark) |
| **Account — Profile** | `/dashboard/profile` (redirect `/dashboard/presence`), `/u/[subdomain]`, `/u/[subdomain]/[slug]` | 23 persona/category public profile templates, links, proofs, Brand Materials public view | `VERIFIED` |
| **Account — Billing** | `/dashboard/billing` (redirect `/dashboard/settings/billing`), `/pricing` | 4-tier Cashfree checkout (`Spark`, `Creator`, `Pro`, `Studio`), overrides, cancel (`BillingClient.tsx`, 2,963 lines) | `VERIFIED` |
| **Account — Settings** | `/dashboard/settings` | Legacy 8-tab client (`Workspace`, `Studio AI`, `Integrations`, `Templates`, `Analytics`, `Notifications`, `Security`, `Danger Zone`) | `VERIFIED` (older 8-tab client on `main`; unmerged vs 6-section rebuild) |
| **Onboarding & Auth** | `/onboarding/{start,connect,connect/add}`, `/signin`, `/signup`, `/forgot-password` | Role/persona selection, OTP auth, Google OAuth, social channel connection | `VERIFIED` |
| **Public Growth & Legal** | `/`, `/templates`, `/switch-from-linktree`, `/switch-from-zorcha`, `/contact`, `/privacy`, `/terms`, `/refund`, `/shipping` | Marketing landing, templates (`23` in registry), competitor pages, legal pages | `VERIFIED` |
| **Superadmin Console** | `/admin/*` (`17` pages incl. `users/[id]` & `workspaces/[id]`) | Ops dashboard, `user_section_time`, plan editor, custom overrides, feature flags, referrals, impersonation | `VERIFIED` |

---

## 3. Unlock Gates Forensic Reconstruction

### 3.1 Disambiguation Across All 10 Mechanism Types (Part 2 Taxonomy)

| Part-2 Category | What Exists in Unool (`b03bbf5`) | Exact Mechanism Classification |
|---|---|---|
| 1. **Subscription entitlement** | `plans.features` JSONB, `workspaces.plan`, `subscriptions`, `user_plan_overrides` (price only) | **`GATE-3`** (Plan tiers: `spark`, `creator`, `pro`, `studio`) |
| 2. **Feature access control** | `planEnforcement` boolean gates (`flightplan_ai`, `content_humanizer`, `dm_concierge`, `auto_hide_spam`, `api_keys`, `badge_removal`) + `isTemplateAllowedForPlan` + `admin_feature_flags` (`automationEnabled`) | **`GATE-3`** (Boolean entitlements + Ops kill-switch) |
| 3. **Usage limits** | Monthly/resource counters (`posts_per_month`, `channels`, `team_seats`, `workspaces`, `ai_credits_per_month`, `ig_comments_per_month`, `aiTokensPerMonth` legacy) | **`GATE-3`** (Usage quotas — split across 4 competing modules) |
| 4. **Progress-based unlocking** | `NOT IMPLEMENTED` (`OnboardingChecklist` XP does not unlock features) | None (visual/orphaned only -> see `GATE-4`) |
| 5. **Referral rewards** | `referral_codes.rewards_earned`, `months_earned`, `referral_rewards` (`200` / `1000` credits, `+30d`) | **Referral Program** (Section 7 — **zero connection** to feature gating) |
| 6. **Achievement systems** | `NOT IMPLEMENTED` (no badges/achievements unlock features) | None |
| 7. **Onboarding completion** | `ProfileCompletionQuest` (6 steps), orphaned `OnboardingChecklist`, `SubdomainClaimPopup`, unmounted `StudioOnboardingModal` | **`GATE-4`** (Visual setup checklists; `/api/studio/ideas` checks profile completeness implicitly) |
| 8. **Permission restrictions** | `verifyWorkspaceAccess()` (`workspace_members`) & `requireAdmin()` | **Membership check only** (`role` owner/admin/member/viewer exists in schema, **not enforced** in `verifyWorkspaceAccess`) |
| 9. **Contextual feature discovery** | Tool cards in `DashboardClient`, Automation Force-Follow toggle, Brand Materials picker | UI discovery only |
| 10. **Marketing upgrade prompts** | `/pricing`, `BillingClient`, `403 PLAN_LIMIT_EXCEEDED` modals/toasts, `freeTier.ts` `upgradeUrl` | **`GATE-3`** UI surfaces |

Additionally, Unool implements two creator-to-audience **Follow-to-Unlock Gates**:
- **`GATE-1`:** **Standalone Web Follow-to-Unlock Gates** (`/dashboard/unlock-gates` → `/gate/[gateId]`) — **100% Broken**
- **`GATE-2`:** **In-DM Automation Force-Follow Gate** (`require_follow_for_dm` in `/dashboard/automation`) — **Core Meta DM Flow Working**

---

### 3.2 Complete 18-Attribute Forensic Specification Per Discovered Mechanism (`GATE-1` – `GATE-4`)

| Attribute | GATE-1: Standalone Web Follow Gates | GATE-2: In-DM Force-Follow Gate | GATE-3: Plan Entitlements, Quotas & Kill-Switch | GATE-4: Onboarding Quests & Popups |
|---|---|---|---|---|
| **Exact Name** | Sidebar: `"Unlock gates"`; Heading: `"Unlock Gates"`; Modal: `"Create Follow-to-Unlock Gate"` | `"Force-Follow Before Unlocking Link"` (`require_follow_for_dm`) | `PlanAction` (30 actions), `freeTier` limits, `automationEnabled` flag | `ProfileCompletionQuest` (`"Creator Identity Quest"`), `OnboardingChecklist` (orphaned), `SubdomainClaimPopup`, `StudioOnboardingModal` |
| **Location** | Sidebar `Grow -> Unlock gates`; public `/gate/[gateId]` | `/dashboard/automation` → Instagram → DM Concierge (`AutomationClient.tsx:843-885`) | Across Studio, FlightPlan, Profile, Automation, Overview, Billing, Settings | Overview modal/card (`DashboardClient`), `DashboardLayout` (30s timer), orphaned API |
| **Route** | `/dashboard/unlock-gates` (redirect `/dashboard/follow-gates`), `/gate/[gateId]` | `/dashboard/automation` (runtime via Meta webhooks & QStash workers) | `/pricing`, `/dashboard/billing`, plus gated `/api/*` routes | `/onboarding/{start,connect,connect/add}`, `/dashboard`, `/api/onboarding` |
| **Component** | `FollowGateManagerPage.tsx`, `FollowGateManager.tsx`, `FollowGateCard.tsx` | `AutomationClient.tsx`, `BrandMaterialsSection.tsx` (delivery target) | `BillingClient.tsx`, `PricingPageClient.tsx`, composer/schedule/presence clients | `ProfileCompletionQuest.tsx`, `OnboardingChecklist.tsx` (0 callers), `SubdomainClaimPopup.tsx`, `StudioOnboardingModal.tsx` (unmounted) |
| **Trigger Condition** | Visitor opens `/gate/[gateId]` and clicks Follow CTA | Comment (`link_request`/`purchase_intent`) or inbound IG DM when `require_follow_for_dm = true` | Creator calls gated API (`use_ai`, `create_post`, `flightplan_ai`, `templateCount`, etc.) or `automationEnabled === false` | Profile incomplete (no subdomain / <6 steps) on dashboard load or Studio voice call |
| **Eligibility Logic** | Intended: visitor IG ID follows `gate.ig_user_id`. **Actual:** `ig_user_id` stored as `'0'`; `visitorIgUserId` never passed | Queries Meta `/{IGSID}?fields=name,username,is_user_follow_business` or recent `instagram_dm_logs.follow_verified` | Resolves `subscriptions` (`status='active'`) + `workspaces.plan` + `plans.features` + `admin_feature_flags` (inconsistent across 4 libs) | Checks client props (`profile`, `recentPosts`) for quest; `/api/onboarding` reads `onboarding_checklists` |
| **Backend Implementation** | `lib/follow-gate/service.ts` (`createGate`, `getGate`, `createSession`, `checkFollowViaApi`, `handleFollowWebhookEvent`) | `InstagramCommentAutomation.processDmFollowGate` (`L864-1188`), `resolveCreatorDeliveryLink` | `lib/plan-enforcement.ts`, `lib/middleware/plan-enforcement-middleware.ts`, `lib/middleware/plan-enforcement.ts`, `lib/limits/freeTier.ts`, `lib/feature-flags-server.ts` | `app/api/onboarding/route.ts`, `app/api/subdomains/claim/route.ts` |
| **DB Dependencies** | `follow_gates`, `follow_gate_sessions`, `platform_connections` | `instagram_automation_config`, `instagram_dm_logs`, `brand_materials_pages`, `platform_connections` | `plans`, `workspaces`, `subscriptions`, `user_plan_overrides`, `posts`, `ai_usage`, `platform_connections`, `instagram_comment_logs`, `admin_feature_flags`, `api_keys` | `onboarding_checklists`, `profiles`, `posts` |
| **API Dependencies** | `GET/POST /api/follow-gate`, `GET/PATCH/DELETE /api/follow-gate/[gateId]`, `/public`, `/session`, `/check` | `GET/PUT /api/instagram/automation`, `POST /api/webhooks/instagram`, `POST /api/webhooks/qstash/instagram-outbound`, `instagram/sync`, `instagram/simulate` | `/api/billing/*`, `/api/webhooks/cashfree`, `/api/keys`, `/api/admin/{plans,plan-overrides,feature-flags}`, `/api/feature-flags` | `GET/POST/DELETE /api/onboarding`, `POST /api/subdomains/claim`, `POST /api/studio/ideas` (`400 PROFILE_INCOMPLETE`) |
| **Workspace Dependency** | `follow_gates.workspace_id`; **missing** in `GET /api/follow-gate/[gateId]` (IDOR) | `workspace_id` scopes `instagram_automation_config` & `instagram_dm_logs` | All quotas scoped by `workspace_id` (**broken** by multi-workspace `.single()` crash) | `onboarding_checklists` has `workspace_id`, but `/api/onboarding` omits `verifyWorkspaceAccess` |
| **User Dependency** | Visitor has zero Unool auth; IG identity never captured (`visitor_ig_user_id = NULL`) | Visitor identified by Instagram `IGSID` inside DM webhook | Creator `user.id` checked for membership (`owner` vs `member` roles ignored!) | `user.id` checked in `/api/onboarding` without workspace check |
| **Permission Dependency** | Any workspace member can create/edit/delete; **any user** can read any `gateId` via IDOR | Any workspace member (not role-restricted) can toggle `require_follow_for_dm` | Any workspace member triggers plan usage; role hierarchy (`owner`/`admin`/`member`/`viewer`) unchecked | Any user in workspace can dismiss/complete steps |
| **Plan Dependency** | `follow_to_unlock: true` on all 4 plans; API never checks plan | Should require `dm_concierge` (`Creator+`), **but `PUT` & webhook bypass it for Spark!** | Core tier table: `spark` (free), `creator`, `pro`, `studio` | Free / all plans |
| **State Persistence** | `follow_gate_sessions` 30-min DB row; **UI keeps unlock only in React `useState` -> reload re-locks!** | Persisted in `instagram_dm_logs.follow_verified` | DB `subscriptions` + `workspaces.plan` + Redis 60s cache + 5m in-memory `plans.ts` cache | `ProfileCompletionQuest`: stateless client props; `SubdomainClaimPopup`: `profiles.subdomain`; `/api/onboarding`: DB JSONB |
| **Unlock Condition** | Intended: `followVerified === true` from webhook or IG API. **Currently unachievable** | Meta returns `is_user_follow_business: true` (or prior verified DM log) + user taps `"I Followed! ✅"` or asks for link | Active paid subscription matching feature/quota, or `automationEnabled = true` | Completing 6 profile/post items (`ProfileCompletionQuest`) or claiming subdomain |
| **Failure Behaviour** | Polls every 5s x 36 (3 min) returning `followVerified: false`, then `"Follow not detected yet"`; ignores 404/500 errors | If `is_user_follow_business = false`, sends Quick Reply `"I Followed! ✅"`; at 15 AI turns escalates to `instagram_flagged_dms` | Returns `403 PLAN_LIMIT_EXCEEDED` JSON (except open `middleware/plan-enforcement.ts` returning `allowed: true` for 23 actions!) | `StudioOnboardingModal` unmounted -> `/api/studio/ideas` fails (`400 PROFILE_INCOMPLETE`) or falls back |
| **User-Facing Explanation** | Claims `"Follow verified automatically via Instagram API"`, never tells visitor how identity is matched | DM explicitly asks visitor to follow `@brand` and tap `"I Followed! ✅"` | Upgrade prompt / error toast (Overview counters mislead by showing `freeTier.ts` `published`-only counts) | Quest step progress bar + contextual labels (`OnboardingChecklist` still lists deleted WhatsApp!) |
| **Action After Unlocking** | Renders `UnlockedView` (card with URL `<a href>` — XSS risk if `javascript:` — coupon copy, or message) | Sends `followVerifiedMessage` with `resolveCreatorDeliveryLink()` (Brand Materials page or external link) | Caller proceeds with AI generation, scheduled post, automation, or template save | Quest marks step complete visually; unclaimed subdomain popup stops appearing |

---

### 3.3 All 20 Mandatory Questions — Answered Per Gating Mechanism

| # | Mandatory Question | GATE-1: Public Follow Gates (`/gate/[id]`) | GATE-2: In-DM Follow Gate (`require_follow_for_dm`) | GATE-3: Plan Entitlements & Feature Flags | GATE-4: Onboarding & Completion Quests |
|---|---|---|---|---|---|
| **1** | **What exactly is being locked?** | Creator perk (`link`, `file`, `coupon`, `message`, `video`) in `follow_gates.unlocked_content`. | Creator `linkUrl` / Brand Materials page inside IG DM flow. | SaaS capabilities (`posts_per_month`, `channels`, `ai_credits_per_month`, `templateCount`, `flightplan_ai`, `content_humanizer`, `first_comment`, `dm_concierge`, `auto_hide_spam`, `api_keys`, `badge_removal`) + `automationEnabled`. | Visual setup checklist steps (`ProfileCompletionQuest`) or orphaned XP items (`OnboardingChecklist`). |
| **2** | **Why is it being locked?** | Creator audience growth (trade IG follow for lead magnet). | Creator IG follower conversion + inbox delivery outside Meta Message Requests. | SaaS monetization (`Spark` -> `Creator`/`Pro`/`Studio`) + ops kill-switch. | New-user activation & profile setup completion. |
| **3** | **Who decided this should be locked?** | Creator (per gate) / Product wedge (`switch-from-zorcha`). | Creator (per workspace IG automation toggle). | Product / Admin (`lib/billing/plans.ts`, `/admin/plans`, `/admin/settings`). | Product / UX onboarding design. |
| **4** | **Technically enforced or only visual?** | **Broken technical gate:** `unlockedContent` omitted from `/public` and SSR props, **leaked via IDOR** in `GET /api/follow-gate/[gateId]`, and `/check` never unlocks. | **Technically enforced** server-side via Meta `is_user_follow_business`. | **Mixed:** Core AI/post/schedule/template/IG checks execute server-side; `custom_domain`, `approval_workflows`, `brand_voices`, `lead_scoring`, `linkedin_comments_per_month`, `follow_to_unlock` are unimplemented/unenforced. | **Visual only** (`ProfileCompletionQuest` client-only; `OnboardingChecklist` orphaned). |
| **5** | **Can user bypass via direct API request?** | **YES (P0 IDOR):** Authenticated user calls `GET /api/follow-gate/{victimGateId}?workspaceId={ownWsId}` and reads `unlockedContent` (`follow-gate/[gateId]/route.ts:29-31`). | **No** for IG consumer (Meta webhook drives verification). **YES** for Spark creator toggling `requireFollowForDm` via `PUT /api/instagram/automation` without `dm_concierge`. | **YES** on `/api/studio/ideas` (no `useAI`), `/api/brand-materials` (no `brand_voice`), `/api/follow-gate` (no `follow_to_unlock`), `DELETE /api/publish/[postId]` (`STU-001` quota reset), `FB/Threads/LI` automation (`automationEnabled` skipped), and `/api/onboarding` (no workspace check). | Not a security boundary; `/api/onboarding` accepts arbitrary `workspaceId` mutations. |
| **6** | **Is condition checked on the server?** | Intended on server (`/check`), fails because creator ID is `'0'` and visitor ID is `NULL`. | Yes (`webhooks/instagram` & `qstash/instagram-outbound`). | Yes in `plan-enforcement-middleware.ts` / `plan-enforcement.ts`, inconsistently applied across routes. | `ProfileCompletionQuest`: client-only; `/api/onboarding`: server DB JSONB without tenant check. |
| **7** | **Checked consistently across all entry points?** | **No.** `GET /api/follow-gate/[gateId]` skips `workspaceId` filter; manager sends `'0'`. | **Partially.** Webhook, QStash, and `instagram/sync` check `require_follow_for_dm`, **but** public comment reply ignores custom `followAskMessage`. | **No.** 4 enforcement files; Overview reads `freeTier.ts` (ignoring `subscriptions` & `scheduled` posts); `middleware/plan-enforcement.ts` auto-allows 23 actions; `linkedin_comment_logs` queries non-existent table. | **No.** 4 separate quests/popups operate independently without shared completion state. |
| **8** | **Can users see inconsistent lock states?** | **Yes.** Creator sees `"Live & Protecting"`, while visitors fail 100% on `"Follow not detected yet"`. | **Yes.** Creator customizes `followAskMessage`, yet comment replies post hardcoded prompt. | **Yes.** Overview displays Spark `15` limit from `freeTier.ts` even when active `Pro` subscription exists in `subscriptions`. | **Yes.** Overview shows 6 quest items, `/onboarding/start` asks role, 30s popup interrupts with subdomain claim, Studio onboarding modal never mounts. |
| **9** | **Does UI explain what is required?** | Misleading copy (`"Follow verified automatically via Instagram API"`), fails to tell visitor how IG identity could be matched. | Yes — DM clearly instructs user to follow and tap `"I Followed! ✅"`. | Partially — 403 JSON specifies reason/limit, **but** `/pricing` advertises unimplemented features (`Custom domain`, `Approval workflows`, `API access`). | Yes, though `OnboardingChecklist` still displays removed WhatsApp integration. |
| **10** | **Is the unlock condition achievable?** | **NO (`VERIFIED`):** `FollowGateCard` never passes `visitorIgUserId`, `ig_user_id = '0'`, and Meta `/{id}/followers` is not usable for arbitrary consumer lookup. | **YES** (for IG users who DM or tap Quick Reply, subject to Meta App Review `is_user_follow_business`). | **Yes** via Cashfree upgrade or admin update — though earned Referral AI credits cannot expand AI limits. | `ProfileCompletionQuest` achievable; `OnboardingChecklist` `connect_whatsapp` unachievable. |
| **11** | **Does unlocking persist correctly?** | Session row expires in 30 min; `FollowGateCard` stores `unlockedContent` only in React `useState` (page reload re-locks). | **Yes** (`instagram_dm_logs.follow_verified = true`, checked across recent DM logs). | **Yes** when `subscriptions` + `workspaces` agree (up to 60s/5m cache TTL), except `GET /api/billing/current` can overwrite manual admin adjustments when a paid order is <32 days old. | `ProfileCompletionQuest` derives live state; `onboarding_checklists` persists in Postgres. |
| **12** | **Can a user lose access after unlocking?** | Yes — page refresh loses React state and 30-min session expires; creator pause/delete locks immediately. | Yes — Meta `checkUserFollowsBusiness` queries live status on every unverified DM (though prior `alreadyUnlocked` log short-circuits delivery). | Yes — on expiry/cancel (`planStatus !== 'active'` or `planExpiresAt < now`), `getPlanContext` enforces Spark limits (`L167-175`). | `ProfileCompletionQuest` step regresses if profile fields or posts are deleted. |
| **13** | **What happens when user's workspace changes?** | `workspace_id`-scoped, but `FollowGateManagerPage` caches `workspaceId` in module scope until explicit clear; `.single()` breaks auth. | Config is `workspace_id`-scoped (`instagram_automation_config`). | **Broken for multi-workspace:** `.single()` throws -> `getAuthContext()` spawns `'Personal Workspace'` (`free`), stripping paid plan access. | Ghost workspace spawns a clean new empty quest. |
| **14** | **What happens when subscription changes?** | Nothing — `follow_to_unlock` is `true` on Spark and unchecked on API. | Upgrade enables `dm_concierge`; downgrade leaves existing `instagram_automation_config` rows `true` in DB until `PUT` re-save (inbound checks `ig_comments_per_month` & `dmAutoReplyEnabled`). | `getPlanContext` syncs from `subscriptions` + `workspaces.plan`, lagging only up to Redis 60s / memory 5m cache TTLs. | No dependency. |
| **15** | **What happens when user is invited into another workspace?** | `.single()` crashes auth (`>1` `workspace_members` row) -> lands in ghost workspace; `follow_gates` RLS lacks `owner_id` check. | Same `.single()` crash blocks accessing invited workspace without switcher. | Same `.single()` crash + `POST /api/workspace` has `// TODO` email invite (`L114`) so unregistered users receive no invite email. | Same `.single()` crash; no workspace switcher exists. |
| **16** | **Can admins or owners override the condition?** | Owners pause/delete gates; admins have no follow-gate manager in `/admin`. | Owners toggle `require_follow_for_dm`; admins can globally disable Automation (`automationEnabled`). | Admins edit `workspaces.plan` (`/admin/workspaces/[id]`), `plans` (`/admin/plans`), `user_plan_overrides` (pricing only), or `automationEnabled` — **no per-workspace feature flag override UI exists**. | Admins cannot edit quests; users can ignore quest. |
| **17** | **Are unlock events recorded?** | `follow_gate_sessions.verified_at` & `follow_gates.unlock_count` exist (non-atomic `+1`, unreached in practice). | **Yes:** `instagram_dm_logs` persists `follow_verified`, `follow_status`, `reasoning`. | **Partially:** Allowed actions insert into `ai_usage`/`posts`/`admin_audit_log`; denied `403 PLAN_LIMIT_EXCEEDED` attempts log only to stdout logger. | `onboarding_checklists.steps[].completedAt` (orphaned). |
| **18** | **Can the same gate be triggered repeatedly?** | Yes — every CTA click inserts a new session & increments `view_count` (`POST /session` unthrottled). | Yes — up to `DM_TURN_LIMIT = 15` prior AI turns per thread, then escalated to `instagram_flagged_dms`. | Quota re-checked per request (non-atomic count-then-insert permits slight concurrent overshoot). | `POST /api/onboarding` is idempotent per `stepId`. |
| **19** | **Can a gate interfere with another feature's workflow?** | **Yes:** Confuses creators expecting In-DM follow delivery, duplicates Brand Materials pages, and copies `"profile embed"` Gate IDs that Profile ignores. | **Yes (Suppresses FAQ AI):** When `require_follow_for_dm = true`, non-followers are intercepted *before* FAQ `dmAutoReplyEnabled` replies (`webhooks/instagram/route.ts:858`) and public comments replace normal AI replies with hardcoded follow prompts. | **Yes:** Overview (`freeTier.ts`) vs Studio (`plan-enforcement-middleware.ts`) display conflicting quotas; unmounted `StudioOnboardingModal` causes `/api/studio/ideas` `PROFILE_INCOMPLETE` friction. | **Yes:** `SubdomainClaimPopup` interrupts users 30s into Studio/FlightPlan/Automation work. |
| **20** | **Is the gate genuinely valuable to the product?** | **NO in current architecture** (technically broken & redundant with In-DM Follow Gate + Brand Materials). Concept has value *only* inside Instagram DM where `IGSID` works. | **YES (High Value):** Genuine ManyChat/Zorcha creator growth wedge supported natively by Meta's API. | **YES (Essential):** Core monetization & ops backbone once unified and aligned with real implemented features. | **Partially:** One unified, non-blocking checklist helps activation; 4 fragmented prompts/popups cause clutter. |

---

## 4. Unlock Gate Placement Analysis

### 4.1 Explicit Placement Evaluation Across All 9 Product Modules

1. **Signal (`/dashboard/signal`):** Must display **outcomes only** (In-DM Follow-Gate conversions, `"Delivered vs Pending Follow"` funnel metrics from `instagram_dm_logs`, aligned with `signal_investigation_deep_dive:docs/SIGNAL_INFORMATION_ARCHITECTURE.md` View 4 `Channels & Funnel`), **never** gate configuration UI.
2. **Automation (`/dashboard/automation`):** Already houses the working In-DM `require_follow_for_dm` gate AND Meta's `is_user_follow_business` verification only operates inside Instagram Messaging threads. **This is the sole rightful home for Follow-to-Unlock.**
3. **Studio (`/dashboard/studio`):** Should **consume** centralized SaaS entitlements (`use_ai`, `content_humanizer`, `posts_per_month`) with calm inline usage/upgrade indicators, and optionally tag/link a draft to a Brand Page or Automation campaign — never host Unlock Gate setup.
4. **Flight Plan (`/dashboard/flightplan`):** Should **consume** `flightplan_ai` and `posts_per_month` / `first_comment` entitlements cleanly through the same unified service.
5. **Profile (`/dashboard/profile`):** Currently **ignores `follow_gates`** despite `FollowGateManager.tsx:540` claiming `"click to copy for profile embed"`. Because **Brand Materials (`[subdomain].unool.co/[slug]`)** are public web pages styled with profile branding, Brand Materials creation belongs inside **Profile -> Resource Drops / Subpages**, while Automation selects from those pages for DM delivery.
6. **Workspace Settings (`/dashboard/settings`):** Must own plan summary, quota meters, active workspace switcher, team seats, and billing/upgrade CTAs (aligned with `SETTINGS_FINAL_PRODUCT_ARCHITECTURE.md`'s 2-Group 6-Section IA), removing redundant Settings `Templates`/`Analytics`/`Developers` tabs.
7. **Dashboard Overview (`/dashboard`):** Must surface **one** unified setup checklist (replacing 4 overlapping quests/popups) plus **one truthful quota summary** reading from the same unified entitlement engine as Studio and Billing.
8. **Onboarding (`/onboarding/*`):** Should collect creator persona/voice cleanly, align 1:1 with Studio personas, and drop the user into Overview's single unified Setup Strip rather than spawning disconnected checklists (`OnboardingChecklist.tsx`).
9. **Other Relevant Modules (`/pricing`, `/billing`, `/admin/*`):** `/pricing` and `/dashboard/billing` must display **only verified implemented entitlements**; `/admin/*` should provide per-workspace feature override visibility cleanly without fabricating metrics or mutating state on `GET`.

### 4.2 Option A vs. Option B vs. Option C — Architectural Trade-Off Matrix

| Criterion | Option A: Centralized Engine + Keep `/dashboard/unlock-gates` Hub | Option B: Contextual Module Ownership + Shared Backend Rules | Option C: Consolidated Experience (**RECOMMENDED**) |
|---|---|---|---|
| **Definition** | Unified backend entitlement engine + keep standalone `Grow -> Unlock gates` hub alongside Automation's In-DM gate. | Both `/dashboard/unlock-gates` and Automation keep separate follow-gate UXs reading shared plan rules. | **1.** Remove broken standalone `/dashboard/unlock-gates` (`/gate/[gateId]`, `/follow-gates`).<br>**2.** Consolidate real Follow-to-Unlock strictly inside **Automation -> Instagram** (`is_user_follow_business`), delivering links / Profile Resource Pages.<br>**3.** Unify all 4 SaaS limit/flag files into **1** `lib/entitlements/` engine with contextual upgrade prompts across modules. |
| **User Clarity** | Medium — preserves confusing split between "Unlock gates", "Force-Follow Before Unlocking Link", and "Plan locks". | Low — forces creators to guess which Follow Gate actually works. | **Highest** — "Follow-to-Unlock" means the working IG DM flow; "Plan Limits" means one consistent quota everywhere. |
| **Discoverability** | High nav visibility, but leads creators to a broken `/gate/[id]` flow. | Split across `Grow` and `Create -> Automation`. | **High & Honest** — Follow-to-Unlock sits directly inside IG Comment-to-DM / DM Concierge where creators set the trigger and delivery asset. |
| **Cognitive Load** | Medium-High (keeps dead `Grow -> Unlock gates` nav item). | High (duplicate terminology & mental models). | **Lowest** — removes an entire top-level nav item, legacy redirect, and parallel concept. |
| **Consistency** | High for SaaS billing; Low for follow gates. | Medium-Low (UI diverges). | **Highest** — 1 entitlement engine, 1 follow-gate runtime, 1 public asset system. |
| **Maintainability** | Medium (keeps dead Meta `/followers` & `/gate/` polling code). | Low (maintains 2 follow-gate UIs & services). | **Highest** — removes ~1,500+ LOC of dead web gate + duplicate limit-checker code. |
| **Security** | Still exposes unauthenticated `/gate/[id]/session` abuse if kept. | Same expanded attack surface. | **Highest** — removes `GET /api/follow-gate/[id]` IDOR, `FollowGateCard` XSS surface, and unauthenticated `/session` endpoint. |
| **Commercial Value / Conversion** | Weak — broken Day-1 gate hurts conversion. | Weak — fragmented experience undermines Zorcha/ManyChat positioning. | **Strong** — delivers a reliable ManyChat/Zorcha-grade In-DM Follow Gate on `Creator+` plus truthful quota upgrade triggers. |
| **Implementation Complexity** | Medium-High (cannot verify anonymous web visitors without forcing consumer IG OAuth). | High. | **Low-Medium** — cuts dead code, strengthens existing `processDmFollowGate`, consolidates `lib/entitlements/`. |

**Final Placement Decision:** **Option C — Consolidated Experience.**

---

## 5. Unlock Gate UX and User Journeys

Reconstructed across **all 13 Part-3 User Journeys** (`GATE-1` Web Gate, `GATE-2` In-DM Gate, `GATE-3` SaaS Plan Entitlements):

| # | Part-3 Journey | What User Sees | What User Understands | What User Must Do | What System Does | What Data Changes | What Happens Next | Where User Becomes Confused | Where Workflow Can Fail (`VERIFIED`) |
|---|---|---|---|---|---|---|---|---|---|
| **1** | **Discovers locked feature** | `Grow -> Unlock gates` (`/dashboard/unlock-gates`); `"Force-Follow"` toggle in Automation; locked features on `/pricing` / Studio | Thinks Unool offers both clickable web follow gates and DM gates; expects paid features listed on `/pricing` to work | Clicks nav tab, toggles DM setting, or hits a quota/feature prompt | Renders `FollowGateManager`, `AutomationClient`, or Overview quota card (`freeTier.ts`) | None | Creator opens builder or quota check | Two unrelated things share `"Unlock"` / `"Follow"` naming across `Grow`, `Automation`, and `Plans` | Overview shows `freeTier` limits (`15`) while user holds paid `subscriptions` row (`445310c` only fixed enforcement, not `app/dashboard/page.tsx`) |
| **2** | **Clicks locked feature** | Creator opens `Create Gate`; Visitor opens `/gate/[id]`; Creator clicks `Schedule`/`AI` when over limit | Visitor expects clicking `"Follow"` unlocks perk; Creator expects upgrade or limit info | Creator fills gate form (`igUserId` hidden `'0'`); Visitor clicks CTA button; User hits `403` | `POST /session` opens IG tab; `withPlanEnforcement` checks `isEnforceAction` or `checkQuota` | `follow_gate_sessions` row inserted + `view_count + 1` (web); none (plan) | Opens `instagram.com/{handle}` (web) or `403 PLAN_LIMIT_EXCEEDED` UI | Visitor isn't asked who they are on IG; creator isn't warned `igUserId` became `'0'` | **Plan:** 23 actions via `lib/middleware/plan-enforcement.ts` don't even lock (fail open)! **Web:** unthrottled session spam |
| **3** | **Reads unlocking requirements** | Web card promises `"Follow verified automatically via IG API"`; DM sends `"Follow @brand then tap I Followed!"`; `403` toast shows tier limit | Web visitor thinks Unool automatically knows when they follow; DM visitor sees Quick Reply button; Creator sees tier upgrade requirement | Follow creator on Instagram (web/DM) or upgrade plan | Renders UI copy or returns HTTP `403` JSON payload | None | Waits for user action | Web copy overpromises automatic detection when no IG OAuth or handle capture exists | Custom `followAskMessage` in `GATE-2` is ignored on public IG comment replies (`webhooks/instagram/route.ts:698`) |
| **4** | **Attempts to complete requirements** | Web visitor follows @handle in new tab & returns; DM user taps `"I Followed! ✅"` (`CONFIRM_FOLLOW`); Creator opens `/dashboard/billing` | Expects instant check or smooth Cashfree checkout | Clicks `"✓ I followed"` (web) or Quick Reply (DM) or completes Cashfree payment | Web polls `GET /check?sessionToken=...` every 5s x 36; DM runs `processDmFollowGate`; Billing creates `payment_orders` | Cashfree order `PENDING` created (Billing); DM log checked (DM) | Verification loop executes | Web spinner waits up to 3 minutes without error; Cashfree vs `BillingClient` state can lag | **Web:** `FollowGateCard.tsx:102` omits `visitorIgUserId`; `/studio/ideas` lacks `useAI` check cleanly; `/onboarding` misses workspace check |
| **5** | **Completes requirements** | DM user receives delivery link; Upgraded user sees plan badge | Believes unlock/upgrade succeeded | Reads delivered resource / retries Studio or Flight Plan | DM sets `follow_verified = true` & sends DM link; Cashfree webhook/`verify` calls `markOrderPaid` | `instagram_dm_logs.follow_verified = true`; `workspaces.plan` & `subscriptions` updated | Access unlocked (DM / Paid SaaS) | Web visitor **never** reaches this step! Paid user returns to Overview and may briefly see cached limits (`60s`/`5m`) | **Web (`F-UG-02`):** Impossible condition (`ig_user_id='0'`, `visitor_ig_user_id=NULL`, unsupported `/followers` call) |
| **6** | **System verifies eligibility** | Web shows `"Verifying your follow…"`; DM runs Meta Graph call; SaaS checks `getPlanContext()` | Expects reliable real-time server truth | Wait passively | Web queries `check/route.ts`; DM calls Meta `/{IGSID}?fields=is_user_follow_business`; SaaS checks DB/Redis | `instagram_dm_logs` written on DM match | Unlock granted or denied | DM `require_follow_for_dm` intercepts *before* FAQ DM AI (`webhooks/instagram/route.ts:858`) | Meta App Review permission lapse or cached Redis/in-memory plan (`plan-enforcement.ts:142`) delays verification |
| **7** | **Feature becomes available** | Web would render `UnlockedView`; DM sends `followVerifiedMessage + linkUrl`; Paid user uses Pro tools | User accesses promised reward/tool | Clicks unlocked link or uses Pro feature | DM delivers `resolveCreatorDeliveryLink()` (Brand Page/URL); SaaS passes `enforcePlanLimit` | `follow_gates.unlock_count` (never reached); `ai_usage` / `posts` | Task proceeds | In web mock/preview (`UnlockedView`), `<a href>` executes unvalidated URLs | **P0 Stored XSS (`F-UG-03`):** `javascript:` URLs execute in `FollowGateCard.tsx:274,287` |
| **8** | **Enters unlocked feature** | Opens delivered Brand Materials page (`/u/[sub]/[slug]`) or Studio/FlightPlan | Seamless consumption / creation | Uses link/tool | Renders public SSR page (`BrandMaterialsPageView`) or workspace app | Analytics click/view events (Brand page) | Ongoing creator/audience engagement | Brand Materials is inside Automation while public URL lives under `/u/[sub]/[slug]` (Profile domain) | `GET /api/brand-materials?subdomain=` omits `.is('deleted_at', null)` (`L38-42`), serving soft-deleted drops! |
| **9** | **Returns later** | Reloads `/gate/[id]`; sends second DM; revisits Dashboard | Expects unlock/subscription to stay unlocked | Reloads page or re-enters dashboard | **Web:** React `useState` wiped -> shows Lock again! **DM:** reads last 30 `instagram_dm_logs` (`alreadyUnlocked`) -> skips nagging. **Dashboard:** `getPlanContext` checks `subscriptions` | None / session fetch | Preserved in DM & SaaS; **lost** in Web gate | Web visitor had to re-verify on every tab reload within 30 min; `FollowGateManagerPage` caches stale `workspaceId` | `BillingClient` & `FollowGateManagerPage` module globals retain stale workspace data across reloads/switches |
| **10** | **Changes workspace** | Currently **no Workspace Switcher UI exists** (only Multi-Account user login switcher!) | Expects to switch between Studio's 3 workspaces or invited client workspaces cleanly | Uses Multi-Account switcher or accepts invite | `.single()` on `workspace_members` (`middleware.ts:214`, `context.ts:143`, `server.ts:85`) throws `multiple rows` -> `context.ts` creates new **`'Personal Workspace'` (`free`)!** + password wiped on `switch-account`! | Orphaned `'Personal Workspace'` DB row inserted; `auth.users` password overwritten! | User trapped in empty free workspace | Confuses Account Switcher (auth login) with Workspace Switcher (multi-tenant) | **P0/P1 Breakdown:** Multi-workspace auth crash (`F-UG-08`) + Password overwrite (`F-UG-01`) + stale `follow_gates` RLS |
| **11** | **Loses eligibility** | Gate toggled inactive (`"Drop Currently Paused"`); Plan expires (`403 PLAN_LIMIT_EXCEEDED`); DM unfollow detected | Understands why access ended | Re-follows, renews subscription, or stops | `getPlanContext` reverts to `spark` (`L167-175`); In-DM re-queries `is_user_follow_business` | `workspaces.plan` / `subscriptions.status` (`expire`/cron or check) | Access blocked or downgraded | Downgrading leaves `instagram_automation_config.require_follow_for_dm = true` in DB; `freeTier.ts` Overview still misreports limits | Stale Overview usage vs actual API blocks (`freeTier.ts` ignores `subscriptions` expiry check) |
| **12** | **Encounters an error** | Web stays silent on 404/500 & says `"Follow not detected yet"` after 3 min; Follow-Gate toggle/delete shows **false success toast on HTTP 500** (`FollowGateManager.tsx:109,128`); `StudioOnboardingModal` unmounted causes `/studio/ideas` `400` | Expects actionable error (`Reconnect Instagram`, `Renew Plan`) | Retries blindly or contacts support | `FollowGateCard` catches/swallows HTTP 404/500 and keeps polling; `FollowGateManager` ignores `!res.ok` | Incomplete / corrupted state | Abandonment & support tickets | Silent polling errors look like Meta/user failure rather than broken backend | Zero retry recovery or truthful Meta error propagation on `/gate/[id]` |
| **13** | **Attempts to unlock feature already available** | Creator creates Studio/Pro gate on Spark; Paid user clicks upgrade/checkout; DM follower who already unlocked asks again | Expects instant access without redundant payment or prompt | Clicks CTA anyway | **DM:** checks `alreadyUnlocked` log & delivers link if asking for it; **Billing:** allows re-order or shows current plan; **Web:** creates duplicate `follow_gate_sessions` row | Extra `follow_gate_sessions` + `view_count` inflation (Web) | Redundant DB writes (Web) or direct delivery (DM) | Web card never checks existing unlock state on mount before rendering CTA | `FollowGateCard` shows locked card even if already verified in session |

**UX Overload Verdict:** **YES — Unool would be significantly clearer and higher-converting with fewer gates.** Removing the broken standalone `/dashboard/unlock-gates` (`/gate/[id]`), removing the 3 redundant quests/popups (`OnboardingChecklist`, 30s `SubdomainClaimPopup`, unmounted `StudioOnboardingModal`), removing unimplemented paid promises (`Custom domain`, `Approval workflows`, unbacked `API access`), and focusing strictly on **one working In-DM Follow-to-Unlock flow + one truthful plan meter** dramatically reduces friction.

---

## 6. Referral Forensic Reconstruction

### 6.1 Discovery Audit (`VERIFIED`)
- **Where discovered:** Sidebar `"Grow -> Referrals"` (`/dashboard/referrals`, `app/dashboard/layout.tsx:397-402`) and public `"Made with UNOOL"` badge on Spark profiles ([`MadeWithUnoolCTA.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/components/profile/MadeWithUnoolCTA.tsx)).
- **Location fit:** **Misplaced in primary `Grow` sidebar.** Creators do not invite peers to Unool every day as part of their content creation workflow; occupying top-level sidebar real estate alongside `Unlock gates` adds nav bloat. It belongs under **Account (`Invite & Earn` / Settings / Billing)** plus the fixed viral public profile badge.
- **Clarity of value proposition:** UI copy (`ReferralDashboard.tsx:198-206`) clearly states `200 AI credits per signup` + `1 free month per paid conversion`, **but the promise is currently false in execution** (credits cannot be spent; free users get 0 free days).
- **Workflow interruption:** Does not interrupt Studio/Flight Plan, though badge CTA (`MadeWithUnoolCTA`) currently wastes 100% of badge clicks due to passing `subdomain` instead of `code`.

### 6.2 Referral Link & Code Creation Trace (`VERIFIED`)
- **Code generation (`lib/referrals/service.ts:49-60`):** Takes up to 4 uppercase alphanumeric chars from `displayName` (fallback `'UNO'`) + 4 random chars from a 32-char unambiguous alphabet via `crypto.getRandomValues`, with up to 5 collision retries. Uniqueness enforced by `UNIQUE` constraint on `referral_codes.code`.
- **When created (3 paths):**
  1. **OTP Signup (`app/api/auth/signup/verify-otp/route.ts:166-173`):** Calls `getOrCreateReferralCode(userId, userId, name)` — **stores `userId` inside `referral_codes.workspace_id`** instead of a real workspace UUID because the workspace hasn't been created yet!
  2. **First `/dashboard/referrals` load (`GET /api/referrals/route.ts:40-43`):** Runs `Promise.all([getOrCreateReferralCode(...), getReferralStats(user.id)])`. Because `getReferralStats` queries `.single()` simultaneously with insert, Google OAuth users can hit a **race condition returning `{ code: null, referrals: [] }` on first load**.
  3. **Admin inspect (`GET /api/admin/users/[id]` & `SupabaseAdminRepository.listReferralCodes`):** Mutates DB by auto-creating codes during `GET` requests!
- **Ownership, Expiry, Regeneration, QR, Campaign Params:**
  - Owned by `user_id` (`UNIQUE(user_id)` / workspace field inconsistently populated).
  - **Code expiration:** None (`referral_codes` has no `expires_at`).
  - **Link regeneration:** `NOT IMPLEMENTED`.
  - **QR code:** `NOT IMPLEMENTED`.
  - **Campaign/UTM parameters:** `NOT IMPLEMENTED`.
  - **Deep link / Share format conflict:** [`ReferralDashboard.tsx:128`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/components/referrals/ReferralDashboard.tsx#L128) shares `${origin}/signup?ref=${code}`, **bypassing [`app/r/[code]/route.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/app/r/%5Bcode%5D/route.ts)** — which exists solely for share links yet has **zero UI callers**!

---

## 7. Referral Attribution and Reward Analysis

### 7.1 End-to-End Attribution Lifecycle (`VERIFIED`)

```text
1. Profile Badge Click    ──► MadeWithUnoolCTA.tsx:46,82 links /?ref=<subdomain> or /signup?ref=<subdomain>
                              └─► FAILS 100%: recordReferralSignup() checks referral_codes.code, NOT profiles.subdomain!

2. /r/[code] Click        ──► r/[code]/route.ts:15 increments click_count (+1) + sets `unool_ref` cookie (30d) + 302 to /signup?ref=[code]
                              └─► DOUBLE-COUNT BUG: /signup mounts -> signup/page.tsx:45 calls POST /api/referrals/click AGAIN (+2 per 1 visit!)

3. Landing / Cookie       ──► middleware.ts:94-102 sets `unool_ref` ONLY if `!existingRefCookie` (first-touch sticky, maxAge 2592000s)
                              └─► CONFLICT BUG: signup/page.tsx:38-42 OVERWRITES cookie/sessionStorage whenever `?ref=` appears in URL!

4. Email + OTP Signup     ──► POST /api/auth/signup stores ref code in auth_otp_challenges.metadata (`otp.ts:97`)
                              └─► resend-otp preserves metadata.referral_code (`resend-otp/route.ts:84`)
                              └─► verify-otp calls recordReferralSignup(userId, referral_code) (`verify-otp/route.ts:153`)
                              └─► BUG: Duplicate-user branch (`verify-otp/route.ts:140`) returns early and SKIPS referral attribution!

5. Google OAuth Signup    ──► GET /auth/callback/route.ts:115-123 reads `unool_ref` cookie and calls recordReferralSignup(user.id, refCode)
                              └─► EXPLOIT BUG: No check whether user is newly created — existing accounts trigger signup rewards on login!
                              └─► DEAD DUPLICATE: POST /api/auth/callback omits referral attribution completely.

6. Onboarding / Activity  ──► NOT GATED: Signup reward grants IMMEDIATELY on signup (`verify-otp` / OAuth), zero profile/workspace/post required.

7. Conversion             ──► Cashfree webhook / `GET /api/billing/verify` -> `markOrderPaid()` (`lib/billing/subscription.ts:285-286`)
                              └─► Calls recordReferralConversion(userId) when order transitions PENDING -> PAID.
```

- **When is a referral considered successful?**
  - **Signup stage:** Email verified (OTP) or OAuth callback completes -> status `'signed_up'` (`+200` phantom credits).
  - **Conversion stage:** First paid Cashfree order (`markOrderPaid`) -> status `'rewarded'` (`+1000` phantom credits + `months_earned += 1` + attempted `subscriptions` extension).
- **Cross-device / deleted accounts / conflicting links:** Cross-device loses `unool_ref` cookie (and `/signup` has no manual promo/ref code field); `signup/page.tsx` overwrites first-touch `middleware.ts` cookie; deleted referred users get their `referrals` row hard-deleted by RPC `20261113000001:115-116`, leaving stale referrer `signup_count` without row traceability.

### 7.2 Reward Model Truth Audit (`VERIFIED`)

| Question (Part 4.4) | Verified Code Behavior (`lib/referrals/service.ts`) |
|---|---|
| **What reward exists?** | `200 AI credits` on signup; `1000 AI credits` + `1 free month` on paid conversion. |
| **Who receives it?** | **Referrer only.** Referred user gets **0** signup bonus (`bonus_credits` / trial). |
| **When is it issued / trigger?** | Automatic on `recordReferralSignup` (`verify-otp` / OAuth) and `recordReferralConversion` (`markOrderPaid`). |
| **Are AI credits actually usable?** | **NO (`VERIFIED`):** `rewards_earned` on `referral_codes` and rows in `referral_rewards` are **never read** by `plan-enforcement.ts`, `plan-enforcement-middleware.ts`, `ai/*`, `composer/adapt`, or `flightplan`. |
| **Does `"1 free month"` work?** | **Broken for `Spark` & Multi-Workspace (`VERIFIED`):** `service.ts:264-275` queries `subscriptions.eq('user_id', referrerUserId).eq('status', 'active').maybeSingle()`. Free `Spark` users have no active subscription row (**0 days granted**, even though `months_earned` increments!); users with >1 active workspace subscription fail `.maybeSingle()` silently! Also zero Cashfree recurring sync. |
| **Expiration / Limits?** | **None:** `referral_rewards` has no expiration, max lifetime cap, or monthly redemption limit enforced in code. |
| **Reversible on cancel / refund?** | **NO:** `webhooks/cashfree/route.ts` handles only `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `PAYMENT_USER_DROPPED`. Refunds never reverse `rewards_earned`, `months_earned`, or extended subscription days. |
| **Can balances become negative?** | No deduction/redemption/reversal code exists today (`grantAiCredits` only adds positive numbers; non-atomic read-modify-write). Adding future refund revocation without clamping/redeem-tracking *would* allow negative balances unless guarded (`GREATEST(balance - delta, 0)` + clawback tracking). |
| **Is it auditable?** | **Weak:** `grantAiCredits` inserts into `referral_rewards` **without checking returned `{ error }`** (`L343-352`), so failed ledger inserts pass silently while counters still increment. |

### 7.3 Referral Dashboard & Admin Metrics Verification (All 11 Part-4.5 Metrics)

| Part-4.5 Metric | Visible to User? | Visible in `/admin`? | Exact Calculation / Source & Accuracy Verdict |
|---|---|---|---|
| **1. Total referrals** | Derived implicitly from `Your referrals` list | Yes | Lists rows from `referrals` (`referrer_user_id`). **Missing real-time updates:** `ReferralDashboard.tsx:105` filters Realtime by non-existent column `referrer_workspace_id`! |
| **2. Link clicks** | **No** (omitted from `ReferralDashboard`) | Yes | `referral_codes.click_count` — **Double-counted** via `/r/[code]` -> `/signup` (`signup/page.tsx:45`); **Fabricated in Admin (`SupabaseAdminRepository.ts:2919`)** as `Math.max(row.click_count || 0, signupCount * 3)`! |
| **3. Signups** | Yes (`ReferralDashboard.tsx:249`) | Yes | `referral_codes.signup_count` — non-atomic increment; inflates on existing Google OAuth logins via `GET /auth/callback:115`. |
| **4. Qualified referrals** | No | No | `NOT IMPLEMENTED` (zero post-signup activity qualification check). |
| **5. Successful referrals (`Conversions`)** | Yes (`ReferralDashboard.tsx:255`) | Yes | `referral_codes.conversion_count` — increments via `markOrderPaid`; never decremented on refund; Admin marks non-paying plan edits as converted (`SupabaseAdminRepository.ts:2870`). |
| **6. Pending referrals** | Yes (`status = 'signed_up'` badge in list) | Yes | Reflects `referrals` row status; accurate for unrefunded flow once OAuth exploit fixed. |
| **7. Reward balance** | Displayed as `AI Credits Earned` (`L261`) | Summed | `referral_codes.rewards_earned` — **Phantom number** (0 spent, 0 spendable). |
| **8. Earned rewards** | Same (`AI Credits` + `Free Months` `L267`) | Same | `months_earned` increments even when `Spark` user received **0 free subscription days**. |
| **9. Redeemed rewards** | No | No | `NOT IMPLEMENTED` (no redemption exists). |
| **10. Conversion rate** | No | Partially (overview ratios) | `NOT IMPLEMENTED` on creator Referral Dashboard. |
| **11. Referral history** | Yes (`Your referrals` `L274-292`) | Yes | Shows `User #<8-char UUID>`, date, status; accurate once Realtime filter fixed (though hard-deleted if referred user deletes account). |

---

## 8. Referral Security Analysis

Evaluated across all **12 Part-4.6 dimensions**:

1. **Referral-code manipulation:** Read-only code strings generated server-side, **but** admin `GET /api/admin/users/[id]` & `SupabaseAdminRepository.listReferralCodes` mutate `referral_codes`/`referrals` rows during `GET` requests.
2. **User impersonation / header spoofing:** Upstream `middleware.ts` `/api/auth` early-return allows spoofing `x-user-id` into `/api/auth/switch-account`, enabling account takeover + referral wallet control of any user (`F-UG-01`).
3. **Self-referral:** Only blocks `referrerUserId === referredUserId` (`service.ts:160`). Same person can create 10 `+alias` Gmail or disposable email accounts and farm credits.
4. **Multiple-account abuse:** **Zero protection** — no IP throttling on OTP signup (`signup/route.ts` uses per-email limits only), no device fingerprint, no normalized-email uniqueness check, no activation gate.
5. **Existing-user OAuth farming (P1):** `GET /auth/callback:115-123` triggers `recordReferralSignup` whenever `user` isn't already in `referrals`, letting existing users log in with Google while carrying `unool_ref` cookie to credit any accomplice.
6. **Reward manipulation & double webhook race:** `markOrderPaid()` uses optimistic `PENDING -> PAID` lock (`subscription.ts:204-225`) + `webhook_events.cf_payment_id UNIQUE`, **but** `recordReferralConversion` (`service.ts:228-235`) updates `referrals` without `.eq('status', 'signed_up')`.
7. **Counter race conditions:** `incrementClickCount`, `recordReferralSignup`, `recordReferralConversion`, and `grantAiCredits` use non-atomic JS read-modify-write instead of SQL `col = col + delta`.
8. **Unauthorized reward modification & RLS:** `20261023_billing_tables.sql` & `20261030_referral_rewards_ledger.sql` use `auth.role() = 'service_role'` without `TO service_role` role binding, and omit `ON DELETE CASCADE`.
9. **Workspace ownership conflicts:** `verify-otp:169` writes `userId` into `referral_codes.workspace_id`; `recordReferralConversion:267` fails `.maybeSingle()` for multi-workspace subscribers; `Dashboard` Realtime filters by non-existent `referrer_workspace_id`.
10. **Public endpoint abuse (`POST /api/referrals/click`, `GET /r/[code]`):** Zero rate limiting -> trivial `click_count` flooding + double-counting on redirect.
11. **Audit logs & error suppression:** `grantAiCredits` ignores Supabase `{ error }` on `referral_rewards` insert; admin console fabricates `clickCount = signupCount * 3`.
12. **Verdict — Is Referral Safe for Real Financial/Credit Consequences?** **NO (`VERIFIED`).** Before wiring spendable AI credits, Spark free-month vouchers, or cash/billing discounts, Unool must fix OAuth existing-user attribution, atomic SQL increments, activation qualification, click rate limiting, refund revocation, and admin read-time mutations.

---

## 9. Unlock Gate and Referral Relationship

- **Are Unlock Gates and Referrals Connected Today?** **NO (`VERIFIED`).**
  - `follow_gates` / `follow_gate_sessions` and `instagram_automation_config.require_follow_for_dm` have **zero references** to `referrals`, `referral_codes`, or `referral_rewards`.
  - `referrals` awards only `200`/`1000` phantom AI credits and `1 free month` extension on `subscriptions` — it never unlocks Follow Gates or SaaS feature flags (`flightplan_ai`, `dm_concierge`, etc.).
- **Evaluation of Conditional Part-5 Questions:** All conditional branches ("Which features does referral unlock?", "Does it require conversion/meaningful activity?", "Is unlocking temporary?", "Audit trail?") evaluate to **Not Applicable / None Implemented Today**, because zero referral-based feature unlocking exists.
- **Should Referral Unlock Features or Unlock Gates? Definitive Recommendation: NO.**
  1. **Different Actors & Value:** **Unlock Gates** (`Follow-to-Unlock`) are B2C creator-to-follower growth mechanics on Instagram; **Referrals** are B2B SaaS user-to-creator acquisition loops. Mixing them confuses users (`"Do my followers have to sign up for Unool to get my Reel resource?"`).
  2. **Growth Anti-Pattern:** Gating core SaaS tools behind `"Invite 3 friends to unlock Flight Plan"` frustrates paying-intent creators, encourages disposable fake-account spam, and cannibalizes `Spark -> Creator` upgrade revenue.
  3. **Where They Complement Without Coupling:** Fix **`MadeWithUnoolCTA.tsx`** on public `/u/[subdomain]` profiles (and optional footer on `/u/[subdomain]/[slug]`) to pass the creator's true **`referral_codes.code`** (`?ref=USHA4K9M`, never `?ref=subdomain`), rewarding real qualified creator signups inside **Account -> Invite & Earn / Billing**.

---

## 10. Complete Product Feature Inventory

*(Exhaustive per-feature and per-route matrices across all `53` pages and capabilities live in [`UNOOL_REMAINING_FEATURES_AND_AUDIT_TRACKER.md`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/UNOOL_REMAINING_FEATURES_AND_AUDIT_TRACKER.md). Summary below reconciles prior audits against `b03bbf5`.)*

| Domain | Prior Audit Documentation | Status vs. `b03bbf5` (`HEAD`) | Intended User & Core Problem Solved | Completeness Classification |
|---|---|---|---|---|
| **Studio** (`/dashboard/studio`, `/publish`) | `STUDIO_AUDIT_REPORT.md` (commit `370c0d5`, 26 findings) | **AUDITED (CURRENT)** — Minor `4640854` multi-account publishing added; core `STU-001`..`STU-026` confirmed applicable | Creators adapting & publishing content across platforms | **Partially implemented** (`/studio/ideas` lacks `useAI`; `StudioOnboardingModal` unmounted) |
| **Flight Plan** (`/dashboard/flightplan`) | Post-`923011d` reliability fixes | **INSPECTED (THIS REPORT)** — Legacy `/api/flightplan/generate` left behind | Creators generating 7-day narrative arcs & schedules | **Implemented but not verified** (needs Vitest run post-`923011d`) |
| **Signal Analytics** (`/dashboard/signal`, `/analytics/linkedin`) | `signal_investigation_deep_dive:docs/SIGNAL_*.md` (12 docs) | **AUDITED (BRANCH / DRIFTED)** — `b03bbf5` still runs old 2,039-line `SignalClient.tsx` + orphan `/analytics/linkedin` | Creators analyzing cross-platform post resonance & DM/profile outcomes | **Duplicated / Drifted** (`597d092` multi-platform sync added on `main`) |
| **Automation — IG + Follow Gate** | IG tested in `5746d08`; **Follow-Gate audited here** | **AUDITED (THIS REPORT)** | Creators converting post comments & DMs into followers & leads | **Partially implemented** (DM check works; Spark bypasses gate; comment prompt hardcoded) |
| **Automation — FB, Threads, LinkedIn** | Shipped in `80e0775`, `531f2b5`, `e4b37f6` | **INSPECTED (NEEDS TARGETED FOLLOW-UP)** | Multi-channel creators running comment/DM automation | **Implemented but not verified** (missing kill-switch; LinkedIn stores logs in `workspaces.settings` JSONB while `plan-enforcement` queries missing table) |
| **Brand Materials** (`BrandMaterialsSection`, `/u/[sub]/[slug]`) | Unaudited placement | **AUDITED (THIS REPORT)** — Buried inside Automation | Creators sharing public resource/download landing pages | **Implemented but misplaced** (misses `.is('deleted_at', null)` on `?subdomain=`; `brand_voices` quota unenforced) |
| **Standalone Unlock Gates** (`/dashboard/unlock-gates`, `/gate/[id]`) | Unaudited beyond 1 line in `FEATURE_INVENTORY` | **AUDITED (THIS REPORT)** | Creators gating web perks behind IG follows | **Broken** (`igUserId='0'`, no visitor ID, P0 IDOR, XSS) |
| **Referrals** (`/dashboard/referrals`, `/r/[code]`, `/admin/referrals`) | Unaudited beyond 1 line | **AUDITED (THIS REPORT)** | Existing users inviting peers for credits / free months | **Broken / Backend phantom** (credits unspendable; badge broken; OAuth exploit; Admin `* 3` fabrication) |
| **Profile & Public Bio** (`/dashboard/profile`, `/u/[sub]`) | `PROFILE_AUDIT_REPORT.md` (`main`) + branch `PROFILE_SECTION_AUDIT_REPORT.md` | **AUDITED (BRANCH / DRIFTED)** — P0 `/api/profile/analytics` IDOR live on `b03bbf5` | Creators owning a public bio page (23 templates) | **Partially implemented / P0 IDOR** |
| **Billing & Pricing** (`/dashboard/billing`, `/pricing`, `/api/billing/*`) | Partial `445310c` | **AUDITED (THIS REPORT)** | Free & paid creators upgrading/canceling Cashfree subscriptions | **Partially implemented** (2,963-line client; phantom features on `/pricing`; no Cashfree refund webhook) |
| **Settings** (`/dashboard/settings`) | `signal_investigation_deep_dive:SETTINGS_FINAL_*.md` | **AUDITED (BRANCH / UNMERGED)** — `b03bbf5` runs legacy 8-tab client | Workspace owners configuring account, AI voice, channels, team | **Duplicated / Unmerged** (legacy tabs + fake `uk_live_*` API keys) |
| **Dashboard Overview, Switcher & Quests** (`/dashboard`, `layout.tsx`) | Unaudited post-`b03bbf5` switcher | **AUDITED (THIS REPORT)** | All creators landing in workspace | **Broken (`F-UG-01` Switcher password wipe + `x-user-id` bypass) / Fragmented quests** |
| **Onboarding & Auth** (`/onboarding/*`, `/signin`, `/signup`) | `5746d08` baseline | **AUDITED (THIS REPORT)** | New/returning users entering Unool | **Partially implemented** (`middleware.ts` P0 `/api/auth` bypass, `.single()` crash, duplicated `POST /api/auth/callback`) |
| **Marketing, Templates & Legal** (`/`, `/templates`, `/switch-from-*`, `/terms` etc.) | Unaudited | **INSPECTED (THIS REPORT)** | Prospective signups evaluating Unool | **Implemented / Misaligned copy** (`16 templates` copy vs `23` in registry; unimplemented `Custom domain` sold) |
| **Superadmin Console** (`/admin/*` — 17 pages) | Partial (`referrals`, `plans`, `feature-flags` checked) | **INSPECTED (NEEDS TARGETED FOLLOW-UP)** | Unool internal team & support ops | **Partially implemented** (`referrals` fabricates `* 3` clicks & mutates on `GET`; `listUsers({ perPage: 1000 })`) |

---

## 11. Remaining Unaudited Features

### Clear Separation of Coverage Status (No Inflated Claims)

1. **Completed Previously & Still Valid (`DO NOT RE-AUDIT BLINDLY`):**
   - **Studio AI Engines, Composer & 27 Adapters** (`STUDIO_AUDIT_REPORT.md`: `STU-001`..`STU-026`) -> ready for engineering remediation + `useAI` check on `/api/studio/ideas`.
   - **Signal 4-View Rebuild** (`signal_investigation_deep_dive:docs/SIGNAL_*.md`) -> ready for branch merge onto `main` + reconciliation with `597d092`.
   - **Profile 23 Templates & 6-Section Settings IA** (`PROFILE_SECTION_AUDIT_REPORT.md`, `SETTINGS_FINAL_*.md`) -> ready for branch merge + `GET /api/profile/analytics` IDOR fix.
2. **Newly Audited End-to-End in This Report:**
   - All 4 Unlock/Gate mechanisms (`GATE-1`..`GATE-4`), full Referral lifecycle + Admin referral reporting, 4 Entitlement/Limit modules, Dashboard Overview & Multi-Account Switcher (`b03bbf5`), Auth middleware & `.single()` workspace crash, Brand Materials placement, Billing/Pricing alignment.
3. **Narrow Remaining Surfaces Requiring Targeted Follow-Up Audit Before Full Ship (Honest Gap List):**
   - **Track A — Facebook, Threads & LinkedIn Automation Security & Scale Audit:** Inspect webhook signature verification/replay prevention, comment-reply self-loop guards, LinkedIn JSONB log growth inside `workspaces.settings`, and `isAutomationEnabledServer()` wiring (`FB`/`Threads`/`LinkedIn`).
   - **Track B — Superadmin Console Security Audit (`/admin/*` — 17 pages):** Full security audit of `/api/admin/impersonate` magiclink flow, `/api/admin/recovery`, `/api/admin/content`, `/api/admin/payments`, `/api/admin/plans`, `/api/admin/workspaces/[id]`, replacing `listUsers({ perPage: 1000 })`, and cleaning legacy `admin_users` RLS (`20250723000001`).
   - **Track C — Live Execution Verification (`BLOCKED` Locally):** Run `tsc --noEmit`, `vitest`, Meta webhook/Graph API verification (`data-deletion`, `deauthorize`, `is_user_follow_business`), and `pg_cron` (`STU-010`) against an environment with dependencies & sandbox credentials.

---

## 12. Feature Placement Decisions

### Explicit Answers to All 8 Part-7 "Specifically Investigate" Questions

1. **Should Unlock Gates appear independently in Signal and Automation?**
   - **NO.** Automation owns configuring the **In-DM Force-Follow Gate** (`require_follow_for_dm`); Signal (View 4 `Channels & Funnel`) displays conversion outcomes (`DMs sent -> Follows verified -> Links unlocked`). Zero creation controls belong in Signal.
2. **Is a shared access/entitlement layer appropriate?**
   - **YES — Mandatory.** All 4 competing entitlement files (`lib/plan-enforcement.ts`, `lib/middleware/plan-enforcement-middleware.ts`, `lib/middleware/plan-enforcement.ts`, `lib/limits/*`) must collapse into **one single server module (`lib/entitlements/`)** powering SSR pages, API routes, webhooks, and client limit meters equally.
3. **Where does Referral belong (central growth area vs. account area vs. workspace area vs. other)?**
   - **Account Area (`Invite & Earn` inside Account Footer / Settings / Billing)** — *not* a primary left-sidebar `Grow` section. Referring peers to Unool is an infrequent account-level advocate action, not a daily content-creation workflow.
4. **Should Referral be visible inside relevant contextual workflows?**
   - **Subtly & non-intrusively yes (1 touchpoint):** Inside `/dashboard/billing` when viewing AI credit usage / plan upgrade (`"Running low on AI credits? Earn spendable credits by inviting creators"` once credits are real) + as the fixed public **`MadeWithUnoolCTA`** footer badge carrying the creator's true `?ref=CODE`. Never interrupt Composer/Studio mid-draft with referral modals.
5. **Should referral-related unlocking remain a separate concern?**
   - **YES, and keep Referral separate from feature unlocking.** Referrals should award **real spendable AI credit top-ups or billing discounts / 30-day Creator trial vouchers** — never gate core features behind invite quotas.
6. **Do existing onboarding, upgrade, and invitation experiences overlap?**
   - **YES — Severely.** Unool currently spreads activation across `/onboarding/start`, `/onboarding/connect`, `ProfileCompletionQuest`, orphaned `OnboardingChecklist`, 30s `SubdomainClaimPopup`, unmounted `StudioOnboardingModal`, and an unfinished team invite flow (`POST /api/workspace` `TODO` email) mixed with an Instagram-style *login* switcher. Consolidate onboarding into **one non-blocking Setup Strip** on Overview, separate team **Workspace Invites/Switcher** from user auth switching, and standardize upgrade triggers in the unified entitlement layer.
7. **Do multiple sections repeat the same metrics, controls, or explanations?**
   - **YES — Documented Duplicates:** Overview KPIs (`freeTier.ts`) vs Signal (`SignalClient`) vs LinkedIn (`/analytics/linkedin`) vs Settings `Template Analytics` repeat engagement/post stats; Overview vs Composer count `published` vs `published + scheduled` differently; Settings `Templates` duplicates Profile; `Follow Gates` duplicates `require_follow_for_dm` and `Brand Materials`.
8. **Should features be merged into existing sections rather than creating more navigation items?**
   - **YES.** Removing `Grow -> Unlock gates`, moving `Referrals` into Account, moving `Brand Materials` into `Profile`, and folding `/analytics/linkedin` + `/dashboard/publish` into `Signal` / `Studio` reduces top-level nav to **6 focused workspaces** (`Overview`, `Studio`, `Flight Plan`, `Signal`, `Automation`, `Profile`) without adding a single new nav item.

---

## 13. Merge, Move, Remove and Improve Recommendations

Every decision below specifies all **11 Part-7 required attributes** (`1. Current implementation`, `2. Current location`, `3. Why problematic/effective`, `4. Recommended location`, `5. Module relationships`, `6. User benefit`, `7. Technical impact`, `8. Product impact`, `9. Risks`, `10. Required changes`, `11. Verification requirements`):

| Feature & Disposition | Current Implementation & Location | Why Problematic / Effective | Recommended Location & Module Relationships | User & Product Impact | Technical Impact, Risks & Required Changes | Verification Requirements |
|---|---|---|---|---|---|---|
| **Standalone Follow Gates** -> **REMOVE / MERGE** | UI `/dashboard/unlock-gates`, `/gate/[gateId]`, `FollowGateManager`, `FollowGateCard`, `/api/follow-gate/**` | **Problematic:** `igUserId='0'`, missing visitor ID, unsupported `/followers` call, P0 IDOR (`GET /api/follow-gate/[id]`), XSS, duplicates IG DM gate | Retires `/dashboard/unlock-gates` & `/gate/[id]`; active asset payloads migrate to **Profile Brand Pages** + gated by **Automation In-DM Follow Gate** | **User:** Stops creator/visitor dead-ends. **Product:** Removes 2 broken pages & closes 2 P0 vulnerabilities | Delete `/gate/[id]` polling & `follow-gate` endpoints after data export/migration & HTTP 308 redirect from `/dashboard/unlock-gates` to `/dashboard/automation?tab=instagram`. Risk: existing printed `/gate/` links -> serve sunset fallback card | Route tests confirm 404/sunset handling; zero XSS/IDOR vectors; exported perks preserved |
| **In-DM Force-Follow Gate** (`require_follow_for_dm`) -> **KEEP & IMPROVE** | `AutomationClient.tsx:843-885`, `InstagramCommentAutomation.processDmFollowGate` | **Effective core:** Real Meta `is_user_follow_business` verification works; **Problematic:** Spark bypasses `dm_concierge`, no DM quota, ignores custom `followAskMessage` on comments | **Automation -> Instagram** (single owner of Follow-to-Unlock), consuming **Profile Brand Pages** for delivery & reporting outcomes to **Signal** | **User:** Working ManyChat-grade follow growth loop. **Product:** Real `Creator+` upgrade wedge | Wire `dm_concierge` entitlement + monthly DM quota check in `PUT /api/instagram/automation` & webhooks; honor `followAskMessage`; surface stats. Risk: existing Spark toggles -> gracefully disable/notify on save or runtime | Unit/integration test for Spark 403 block, custom comment prompt usage, and `is_user_follow_business` true/false branches |
| **Brand Materials Builder** -> **MOVE** | `BrandMaterialsSection.tsx` inside `/dashboard/automation`; public `/u/[sub]/[slug]` | **Problematic:** Public web pages sit under Automation nav while URLs live under Profile domain (`[sub].unool.co/[slug]`); misses `.is('deleted_at', null)`; `brand_voices` limit unchecked | Authoring moves to **Profile -> Resource Drops** (`/dashboard/profile?tab=pages`); Automation retains a **Resource Picker** | **User:** Matches "public pages live in Profile" mental model. **Product:** Raises discoverability across BIO & DMs | Extract `BrandMaterialsSection` into `PresenceClient`, keep picker inside `AutomationClient`, add `.is('deleted_at', null)` & quota check on `/api/brand-materials`. Risk: creators expecting link in Automation -> picker shows "+ New in Profile" | Verify create/edit in Profile renders in `/u/[sub]/[slug]` & selects cleanly inside Automation; soft-deleted slugs return 404 |
| **Referrals** -> **MOVE & IMPROVE** | Sidebar `Grow -> Referrals` (`/dashboard/referrals`), `/r/[code]`, `MadeWithUnoolCTA`, `/admin/referrals` | **Problematic:** Occupies top-level nav despite broken badge (`?ref=subdomain`), unspendable credits, 0-day Spark bug, OAuth abuse, Admin `* 3` fabrication | Move UI to **Account Footer (`Invite & Earn` / Settings)** + billing contextual nudge; keep public `/r/[code]` canonical link & fix `MadeWithUnoolCTA` badge | **User:** Promised credits & free month actually work! **Product:** Converts free profiles into real organic acquisition | Serialize `GET /api/referrals`, fix badge code lookup, fix Realtime filter, block existing OAuth logins, wire spendable bonus credits into `lib/entitlements/`, grant Spark 30d `Creator` grant + Cashfree refund reversal, strip admin `* 3` & `GET` mutations. Risk: fraud -> require email verify + onboarding activation | Integration test: badge -> `/r/[code]` (1 click) -> OTP signup -> activation -> credits usable in `use_ai` -> paid upgrade -> Spark gets 30d Creator -> refund revokes |
| **Entitlements & Quotas** -> **CENTRALIZE** | 4 modules (`plan-enforcement.ts`, `plan-enforcement-middleware.ts`, `middleware/plan-enforcement.ts`, `limits/freeTier.ts`) | **Problematic:** 23 actions fail open in `middleware/plan-enforcement.ts`; Overview (`freeTier.ts`) diverges from Composer; `linkedin_comment_logs` doesn't exist; phantom features on `/pricing` | Single server module **`lib/entitlements/index.ts`** consumed by **Overview, Studio, Flight Plan, Automation, Profile, Billing, Webhooks** | **User:** Identical quota truth everywhere; zero phantom feature deception. **Product:** Prevents AI leakage & refund disputes | Migrate 3 callers off `middleware/plan-enforcement.ts` & Overview off `freeTier.ts`, delete both legacy modules, guard `/api/studio/ideas` + `/api/brand-materials` + FB/Threads/LI `automationEnabled`, fix LinkedIn JSONB log count, align `/pricing`. Risk: migration mismatch -> snapshot-test all 4 plan tiers | `vitest` suite covering all 30 actions across `spark`/`creator`/`pro`/`studio`, cache busting on upgrade, and Overview/API parity |
| **Signal & `/analytics/linkedin`** -> **REPLACE & MOVE** | `SignalClient.tsx` (2,039 lines on `main`) + detached `/analytics/linkedin` outside dashboard nav | **Problematic:** Main lags `signal_investigation_deep_dive` 4-view rebuild; LinkedIn insights strips sidebar navigation | Merge branch **Signal 4-View Rebuild** onto `main` + embed `/analytics/linkedin` as a Channel sub-view inside `/dashboard/signal` | **User:** Single continuous Analytics hub inside workspace nav. **Product:** Completes Signal product vision | Merge `signal_investigation_deep_dive` Signal changes reconciling `597d092` multi-platform engagement sync + redirect `/analytics/linkedin` into Signal tab. Risk: merge conflicts with `597d092` -> test sync + charts together | All 4 Signal views + LinkedIn metrics render inside `DashboardLayout` with green `tsc` + tests |
| **Settings & Multi-Account Switcher** -> **REPLACE & FIX CRITICAL SECURITY** | 8-tab `SettingsClient.tsx` + sidebar login switcher (`middleware.ts` bypass + `switch-account` password wipe) + `.single()` workspace crash | **Problematic:** P0 `x-user-id` account takeover, password destruction, multi-workspace `.single()` crash, duplicate `Templates`/`Analytics`/fake `api_keys` tabs | Merge branch **6-section Settings** (`Personal 3 + Workspace 3`) + add safe **Workspace Switcher** (fixing `.single()` & `middleware.ts`) + enforce role checks | **User:** Safe multi-account & multi-workspace switching; clean Settings. **Product:** Closes P0 breach & unblocks `Pro`/`Studio` teams | Move `middleware.ts` header strip above `publicPaths`, replace `updateUserById({ password })`, fix 3x `.single()` calls, implement email invite claim flow & active workspace cookie. Risk: OAuth cookie/session regression -> full auth E2E suite | Spoofed `x-user-id` returns 401; multi-workspace user switches cleanly without spawning `'Personal Workspace'` |
| **Onboarding Quests & Popups** -> **MERGE & SIMPLIFY** | `ProfileCompletionQuest`, orphaned `OnboardingChecklist`, 30s `SubdomainClaimPopup`, unmounted `StudioOnboardingModal`, `/onboarding/*` | **Problematic:** 4 disconnected prompts; stale WhatsApp step; `/api/onboarding` IDOR; 30s popup interrupts Studio | Delete orphaned `OnboardingChecklist` + secure/retire `/api/onboarding`; remove 30s popup; unify into **1 Overview Setup Strip** + Studio inline calibration | **User:** Calm first-run path without mid-task modals. **Product:** Faster time-to-first-post & profile publish | Remove `SubdomainClaimPopup` timer from `layout.tsx`, align 5 onboarding roles with `studioOnboarding.ts`, render compact Overview strip, mount inline Studio voice check. Risk: subtle activation drop -> measure setup completion post-deploy | Overview Setup Strip updates deterministically; `/api/onboarding` closed (`401`/`403` or deleted); `/studio/ideas` guides voice setup smoothly |
| **Unimplemented Plan Features** (`Custom Domain`, `Approvals`, `uk_live_*` API) -> **REMOVE FROM PRICING / DEFER** | Listed in `plans.ts`, `/pricing`, `BillingClient`, Settings `IntegrationsTab` | **Problematic:** Sold to paying users with 0 runtime consumers or verification backend | Remove claims from `/pricing`, `BillingClient`, and `Settings`; **DEFER** real implementation until Wave 4 | **User:** Zero deceptive upgrade expectations. **Product:** Eliminates 7-day refund disputes | Edit pricing copy/matrix cleanly while preserving existing issued DB `api_keys` rows cleanly marked deprecated if any exist. Risk: checking live Pro/Studio customers who bought for those claims -> grandfather/communicate transparently | Visual & snapshot check confirming `/pricing` matches runtime-enforced `plans.features` 100% |

---

## 14. Product Overload Analysis

Examined across all **12 Part-8 complexity symptoms**:

1. **Too many sections:** `10` top-level sidebar items across 3 sections + `17` admin pages + out-of-shell `/analytics/linkedin` + `/dashboard/publish` + `/gate/[gateId]`.
2. **Too many submenus / tabs:** Settings has `8` legacy tabs (2 repeating Studio/Profile/Signal concerns); Automation hides `4` channel tabs plus an unrelated `Brand Materials` builder.
3. **Repeated CTAs & prompts:** `30s SubdomainClaimPopup` + `ProfileCompletionQuest` modal/card + `/onboarding/connect` + upgrade banners + `MadeWithUnoolCTA`.
4. **Too many separate dashboards:** KPI Overview (`freeTier`), Signal (`2,039` lines), LinkedIn Insights (`/analytics/linkedin`), Settings `Template Analytics` tab, and Follow-Gate counters track overlapping numbers differently.
5. **Confusing terminology:** `Unlock gates` vs `follow-gates` vs `follow_to_unlock` vs `Force-Follow Before Unlocking Link`; `Studio` vs `Composer`; `Flight plan` vs `Schedule`; `Profile` vs `Presence` vs `Brand Materials`; `Signal` vs `Publish`.
6. **Unclear ownership:** Public `[subdomain].unool.co/[slug]` web pages authored inside **Automation**; LinkedIn analytics sitting outside **Dashboard**; `/api/onboarding` orphaned with no UI caller.
7. **Features exposing internal architecture:** Overview counts `published` posts via `freeTier.ts` while Composer counts `published + scheduled` via `plan-enforcement-middleware.ts`; users encounter conflicting numbers and broken `'usha'` fallback strings (`app/dashboard/layout.tsx:695,742,827`).
8. **First-time user walkthrough failure:** A new Spark user invited by referral signs up -> skips social connect -> lands on Overview with 4 tool cards, 6-step quest, 27 platform tiles, and 30s later an interrupting popup -> builds an **Unlock Gate** that 100% fails for visitors -> earns **200 AI credits** that cannot extend their 25/mo limit -> opens **Studio** where `StudioOnboardingModal` never mounts.

**Complexity Reduction Result:** Moving to **6 primary sidebar items** (`Overview`, `Studio`, `Flight Plan`, `Signal`, `Automation`, `Profile`) + **Account Footer** (`Billing`, `Invite & Earn`, `6-section Settings`) cuts top-level creator navigation by **40% (`10 -> 6`)** while eliminating zero working capabilities.

---

## 15. Cross-Module Integration Map

All **11 Part-9 modules & core integrations** mapped **Origin → Trigger → Validation → Backend Processing → Data Change → Destination → User Outcome**:

| # | Cross-Module Journey | Origin -> Trigger -> Validation -> Backend -> DB Change -> Destination -> User Outcome | Integration Defects Identified (`VERIFIED`) |
|---|---|---|---|
| **1** | **Profile Badge -> Referral -> Auth -> Billing -> Entitlements** | `/u/[sub]` (`MadeWithUnoolCTA`) -> click `?ref=sub` -> `signup/route` / `OAuth` -> `verify-otp` / `auth/callback` -> `referrals` + `referral_codes` + `referral_rewards` -> Cashfree checkout -> `markOrderPaid` -> `recordReferralConversion` -> `subscriptions` -> Studio `use_ai` | **Broken links in chain:** Origin sends `subdomain` (0% match); `/r/[code]` + `/signup` double-count; `auth/callback` attributes old accounts; **Entitlement engine ignores `referral_rewards`**; `Spark` referrers get `0` free days! |
| **2** | **Studio -> Flight Plan -> Publish -> Signal** | `/dashboard/studio` -> AI adapt (`planEnforcement.useAI`) -> `schedule` / `broadcast` -> `posts` + `post_variants` + `platform_posts` -> `syncEngagement.ts` (`597d092`) -> `/dashboard/signal` & `/analytics/linkedin` | `/studio/ideas` omits `useAI`; `DELETE /api/publish/[id]` resets monthly quota (`STU-001`); `b03bbf5` lags branch 4-view Signal rebuild; `/analytics/linkedin` outside dashboard nav; `DashboardClient:1343` links deprecated `/dashboard/schedule`. |
| **3** | **Automation -> In-DM Follow Gate -> Profile Brand Materials -> Signal** | IG post comment -> `webhooks/instagram` -> QStash outbound -> public prompt -> user DMs -> `processDmFollowGate` -> Meta `is_user_follow_business` -> Quick Reply / `resolveCreatorDeliveryLink` -> `instagram_dm_logs` -> `/u/[sub]/[slug]` | Works via Meta API, **but:** `webhooks/instagram:858` lets Spark bypass `dm_concierge`; comment reply ignores custom `followAskMessage`; `BrandMaterials` lives inside Automation & omits `.is('deleted_at', null)` on `?subdomain=`; Signal doesn't highlight Follow-Gate funnel. |
| **4** | **Standalone Unlock Gates (`/dashboard/unlock-gates` -> `/gate/[id]`)** | `FollowGateManager` -> `POST /api/follow-gate` -> `/gate/[id]` -> `POST /session` -> visitor IG tab -> `GET /check` -> `follow_gate_sessions` / `follow_gates` -> (intended) `UnlockedView` | `FollowGateManager` forces `igUserId='0'`; `/check` lacks `visitorIgUserId`; webhook filters `NULL`; `/followers` API unsupported; `GET /api/follow-gate/[id]` leaks `unlockedContent` (IDOR); `FollowGateCard` renders raw URL (XSS); Profile ignores gate embed. |
| **5** | **Workspace Settings -> Team Invite -> Multi-Workspace Auth** | `WorkspaceTab` -> `POST /api/workspace` (`invite_member`) -> inserts `workspace_members` -> user logs in -> `middleware.ts` + `lib/auth/context.ts` + `lib/auth/server.ts` -> Workspace UI | **Circular failure:** Unregistered invitee gets no email (`TODO` at L114); existing multi-workspace user crashes `.single()`, causing `context.ts` to create a brand-new `'Personal Workspace'` (`free`) on every render! |
| **6** | **Account & Security Switcher (`b03bbf5`)** | Sidebar footer -> `GET /api/auth/switch-account` (`getCurrentAuth`) -> `localStorage` -> click account -> `POST /api/auth/switch-account` (`updateUserById` password + `signInWithPassword`) -> reload `/dashboard` | **P0 Takeover & Data Loss:** `middleware.ts` exempts `/api/auth` before header sanitization, allowing spoofed `x-user-id` switch-token theft; switching overwrites user's real Supabase password! |
| **7** | **Billing -> Cashfree Webhook -> Overview & Enforcement** | `BillingClient` -> `/api/billing/create-order` (`getActiveOverrideForWorkspace`) -> Cashfree -> `webhooks/cashfree` + `/api/billing/verify` -> `markOrderPaid` -> `payment_orders` + `workspaces.plan` + `subscriptions` -> API enforcement + Overview SSR | **Split brain:** APIs read `plan-enforcement-middleware.ts` (`subscriptions` cross-check + Redis 60s), while Overview (`app/dashboard/page.tsx`) reads `freeTier.ts` (`workspaces.plan` & `published`-only posts); `create-order` ignores referral credits; no Cashfree refund webhook. |
| **8** | **Onboarding -> Overview Quests -> Studio Voice** | `/onboarding/start` -> `/onboarding/connect` -> `/dashboard` (`ProfileCompletionQuest`) + `30s SubdomainClaimPopup` + Studio (`StudioOnboardingModal`) | Disconnected: 5 onboarding roles vs Studio personas; `OnboardingChecklist` orphaned & exposed via `/api/onboarding` IDOR; `StudioOnboardingModal` unmounted. |
| **9** | **Superadmin -> Plans / Flags / Referrals / Insights** | `/admin/*` -> `requireAdmin` -> `admin_feature_flags` / `plans` / `user_plan_overrides` / `user_section_time` / `referral_*` | **Mixed enforcement:** `automationEnabled` skipped on FB/Threads/LI; `/api/analytics/time-spent` accepts unauth `body.userId`; `/admin/referrals` fabricates `* 3` clicks & mutates DB on `GET`; `listUsers({ perPage: 1000 })` caps at 1,000 users. |

---

## 16. Backend and Data Architecture Findings

### 16.1 Full 10-Layer Request Traces (Part 10 Required Traceability)

- **Trace 1 (`GATE-1` Web Follow Gate Check):** `Visitor clicks "I Followed"` -> `FollowGateCard.checkFollowStatus()` -> `GET /api/follow-gate/[id]/check?sessionToken=...` (omits `visitorIgUserId`) -> Public route (no auth) -> Looks up `follow_gate_sessions` (`404` if expired) -> Checks `if (!visitorIgUserId)` -> **Early return `{ followVerified: false }` before Meta check** -> Browser polls 36 times ignoring 404/500 errors -> Fails.
- **Trace 2 (`GATE-2` In-DM Follow Gate):** `IG User comments / DMs` -> Meta webhook `POST /api/webhooks/instagram` -> Signature check (`verifyMetaSignature`) -> Async dispatch via QStash or direct DM handler (`webhooks/instagram:858`) -> **Skips `dm_concierge` tier check** -> `processDmFollowGate` queries Meta `/{IGSID}?fields=is_user_follow_business` -> Updates `instagram_dm_logs.follow_verified` -> Sends Quick Reply `"I Followed! ✅"` or `resolveCreatorDeliveryLink()` Brand Materials URL -> Creator sees log; **Spark bypassed paywall**.
- **Trace 3 (Referral Conversion -> Free Month):** `Cashfree payment` -> `POST /api/webhooks/cashfree` (`verifySignature`) + `GET /api/billing/verify` -> `markOrderPaid()` optimistic lock `.eq('status','PENDING')` -> Sets `workspaces.plan` & `subscriptions` -> Calls `recordReferralConversion(userId)` -> Updates `referrals` (`'rewarded'`, lacking `.eq('status','signed_up')`), adds `+1000` unread `rewards_earned`, increments `months_earned`, queries `subscriptions.eq('status','active').maybeSingle()` -> **Returns `null` for `Spark` (0 days added) or errors for multi-workspace** -> Silent failure while UI claims `+1 Free Month`.
- **Trace 4 (Overview vs. Studio Plan Enforcement):** `Creator opens /dashboard` -> SSR `app/dashboard/page.tsx` calls `getLimitsForTier()` + `getCurrentUsage()` (`lib/limits/freeTier.ts`) reading `workspaces.plan` + `published`-only posts -> Displays X/15. Same creator opens `/dashboard/studio` -> Calls `POST /api/composer/adapt` -> `plan-enforcement-middleware.ts:getPlanContext()` queries `subscriptions` + `posts (published + scheduled)` + Redis 60s cache -> Enforces different limit & tier!
- **Trace 5 (Multi-Account Switcher):** `Attacker / User calls GET /api/auth/switch-account` -> `middleware.ts:153` matches `publicPaths` (`'/api/auth'`) and returns **before `L185` header sanitization** -> `getCurrentAuth()` trusts attacker `x-user-id` header (`server.ts:19`) -> Issues 30-day HMAC `switchToken` -> `POST` validates HMAC -> `updateUserById({ password: random32 })` -> Overwrites password & returns valid Supabase session cookies.

### 16.2 Structural Backend & Data Debt (`VERIFIED`)
1. **Four Competing Limit Engines:** `lib/plan-enforcement.ts`, `lib/middleware/plan-enforcement-middleware.ts`, `lib/middleware/plan-enforcement.ts` (`isEnforceAction` skips 23/30 actions!), and `lib/limits/{enforcer,freeTier}.ts`.
2. **Broken Schema/Storage Mismatches:**
   - `plan-enforcement-middleware.ts:348` queries non-existent table `linkedin_comment_logs`, while `app/api/linkedin/comments/route.ts:290` stores comment logs inside `workspaces.settings` JSONB (`linkedin_comment_logs` key), and `plan-enforcement.ts:424` hardcodes `linkedinCommentsThisMonth: 0`.
   - `ReferralDashboard.tsx:105` subscribes to Supabase Realtime on non-existent column `referrer_workspace_id` on `referrals`.
   - `app/api/user/delete/route.ts:178` uses non-existent column `referrer_id` instead of `referrer_user_id`.
3. **Cache Divergence & Module Globals:** `plan-enforcement.ts` caches `plan:${id}` in Redis for 60s; `plans.ts` keeps a 5-min in-memory cache; `BillingClient.tsx` and `FollowGateManagerPage.tsx` hold module-level global caches spanning workspace switches.
4. **Database Hygiene & Constraints:** Non-atomic read-modify-write counters across `follow_gates` (`view_count`, `unlock_count`) and `referral_codes` (`click_count`, `signup_count`, `conversion_count`, `rewards_earned`, `months_earned`); missing foreign-key cascades & non-null role constraints; duplicate legacy routes (`/api/flightplan/generate`, `POST /api/auth/callback`).

---

## 17. Security and Reliability Findings

*(All **17 Part-13 fields** strictly supplied per finding. Note: `npx tsc --noEmit` & `vitest` could not run inside this worktree — `BLOCKED` by missing `node_modules` and sandbox `npm error 403`; all code defects below are `VERIFIED` via repository trace at `b03bbf5`.)*

### Finding F-UG-01 — P0: Unauthenticated `x-user-id` Header Spoofing Account Takeover + Password Destruction in `/api/auth/switch-account`
1. **Finding ID:** `F-UG-01`
2. **Feature or workflow:** Multi-Account Switcher & Edge Auth Middleware (`/api/auth/*`)
3. **Severity:** **P0 (Critical)**
4. **Current behaviour:** `middleware.ts` lists `'/api/auth'` in `publicPaths` (`L10`) and returns early at `L153-155` **before** stripping `x-user-id`/`x-workspace-id` at `L185-188`. `GET /api/auth/switch-account` (`L18`) calls `getCurrentAuth(request)`, which trusts `x-user-id` (`lib/auth/server.ts:19-34`), returning a 30-day HMAC-signed `switchToken` for any UUID. `POST` (`L117`) also overwrites the target user's password via `updateUserById({ password: tempPassword })`.
5. **Expected behaviour:** Strip `x-user-id`/`x-workspace-id` on ALL `/api/*` requests prior to any `publicPaths` return; verify a real Supabase session in `GET /api/auth/switch-account`; preserve user passwords during account switching.
6. **Exact source file & function:** `middleware.ts` (`middleware`, `L5-17, L153-155, L185-188`), `lib/auth/server.ts` (`getCurrentAuth`, `L14-34`), `app/api/auth/switch-account/route.ts` (`GET` `L16-58`, `POST` `L60-184`).
7. **Route or API reference:** `GET/POST /api/auth/switch-account`, plus `/api/auth/me`, `/api/auth/status`, `/api/auth/platform/connect`.
8. **Database dependency:** `auth.users`
9. **Reproduction steps:** Send `GET /api/auth/switch-account` with header `x-user-id: <victim-uuid>` and no cookies -> receive `switchToken` -> `POST` `{ switchToken }` -> receive victim session cookies + corrupt victim password.
10. **User impact:** Legitimate users lose password login ability on every account switch; accounts can be hijacked.
11. **Business impact:** Full multi-tenant authentication compromise.
12. **Security or data impact:** Unauthenticated full account takeover + unauthorized password overwrite.
13. **Root cause:** Early return on `publicPaths` precedes header strip; password-reset workaround used instead of token exchange.
14. **Recommended resolution:** Strip incoming `x-user-id`/`x-workspace-id` at top of `middleware()`, remove unverified header trust in `getCurrentAuth()`, and replace password reset with magiclink OTP token / encrypted session refresh handling.
15. **Acceptance criteria:** Spoofed `x-user-id` returns `401` on `/api/auth/switch-account`; legitimate user password continues working after switching.
16. **Verification method:** Vitest route handler test + login roundtrip check.
17. **Verification status:** `VERIFIED` (code trace at `b03bbf5`).

### Finding F-UG-02 — P0: Public Unlock Gates (`/gate/[gateId]`) Non-Functional End-to-End
1. **Finding ID:** `F-UG-02`
2. **Feature or workflow:** Standalone Web Follow-to-Unlock Gates (`/dashboard/unlock-gates`, `/gate/[gateId]`)
3. **Severity:** **P0 (Critical — 100% Broken Core Feature)**
4. **Current behaviour:** `FollowGateManager.tsx` discards `platformUserId` (`L86`) and posts `igUserId: '0'` (`L656`), bypassing `POST /api/follow-gate` validation (`L56`). On `/gate/[gateId]`, `FollowGateCard.tsx` never captures visitor IG identity and polls `/api/follow-gate/[gateId]/check?sessionToken=...` without `visitorIgUserId` (`L102`), always returning `followVerified: false` until 3-minute timeout. Webhook handler filters `visitor_ig_user_id` (`NULL`), and `checkFollowViaApi` queries unsupported Meta `/{id}/followers` endpoint (`service.ts:287`).
5. **Expected behaviour:** Follow verification must run only in channels where Meta provides `IGSID` + `is_user_follow_business` (Instagram DM automation).
6. **Exact source file & function:** `components/follow-gate/FollowGateManager.tsx` (`L73-93, L648-660`), `app/api/follow-gate/route.ts` (`L54-73`), `components/follow-gate/FollowGateCard.tsx` (`L100-127`), `app/api/follow-gate/[gateId]/check/route.ts` (`L51-98`), `lib/follow-gate/service.ts` (`checkFollowViaApi` `L277-327`, `handleFollowWebhookEvent` `L362-403`).
7. **Route or API reference:** `/dashboard/unlock-gates`, `/gate/[gateId]`, `POST /api/follow-gate`, `GET /api/follow-gate/[gateId]/check`.
8. **Database dependency:** `follow_gates`, `follow_gate_sessions`, `platform_connections`.
9. **Reproduction steps:** Create Unlock Gate -> open `/gate/{id}` -> click `"Follow @..."` -> click `"✓ I followed"` -> polls 36 times returning `followVerified: false` -> fails.
10. **User impact:** Visitors follow creator and receive nothing; creators look fraudulent.
11. **Business impact:** Destroys flagship differentiator advertised on `/switch-from-zorcha`.
12. **Security or data impact:** Unauthenticated `POST /session` inflates `view_count` via non-atomic increments.
13. **Root cause:** Architected web follow-check without visitor Instagram OAuth or Graph API support.
14. **Recommended resolution:** Decommission standalone `/dashboard/unlock-gates` & `/gate/[gateId]` (after safe export/redirect) and elevate working In-DM Follow Gate inside Automation.
15. **Acceptance criteria:** Zero broken `/gate/[id]` follow-check links exposed; In-DM follow-to-unlock delivers Brand Materials reliably.
16. **Verification method:** Trace UI & run In-DM webhook/automation tests.
17. **Verification status:** `VERIFIED` (code trace); live Meta `/followers` call `BLOCKED` (no live token).

### Finding F-UG-03 — P0: Cross-Workspace IDOR + Stored `javascript:` XSS in Follow-Gate APIs
1. **Finding ID:** `F-UG-03`
2. **Feature or workflow:** Follow-Gate API & Public Card Rendering
3. **Severity:** **P0 (Critical Security)**
4. **Current behaviour:** `GET /api/follow-gate/[gateId]` checks caller membership on caller's `workspaceId`, then returns `getGate(gateId)` **without verifying `gate.workspaceId === workspaceId`**, exposing any creator's `unlockedContent`. `POST /api/follow-gate` / `PATCH /api/follow-gate/[gateId]` accept `javascript:` URIs rendered inside `<a href={content.url}>` (`FollowGateCard.tsx:274,287`).
5. **Expected behaviour:** Scope `getGate(gateId, workspaceId)` strictly by tenant; reject non-`https?://` URLs with `400`.
6. **Exact source file & function:** `app/api/follow-gate/[gateId]/route.ts` (`GET` `L12-37`), `app/api/follow-gate/route.ts` (`POST` `L75-82`), `components/follow-gate/FollowGateCard.tsx` (`L273-294`).
7. **Route or API reference:** `GET /api/follow-gate/[gateId]?workspaceId=<ownWsId>`, `POST /api/follow-gate`, `/gate/[gateId]`.
8. **Database dependency:** `follow_gates`.
9. **Reproduction steps:** Authenticated User A calls `GET /api/follow-gate/{victimGateId}?workspaceId={wsA}` -> `200 OK` leaks victim's coupon/link.
10. **User impact:** Secret gated coupons/links stolen; XSS risk on visitor click.
11. **Business impact:** Multi-tenant confidentiality failure.
12. **Security or data impact:** Cross-tenant IDOR + Stored XSS.
13. **Root cause:** Missing `workspace_id` check on `GET`; missing protocol validation.
14. **Recommended resolution:** Enforce `gate.workspaceId === workspaceId` immediately (even before retiring `/gate/[gateId]`) and validate `https?://` schemes.
15. **Acceptance criteria:** Cross-tenant `GET` returns `404`/`403`; `javascript:` payloads return `400`.
16. **Verification method:** Vitest route tests for tenant isolation & URL validation.
17. **Verification status:** `VERIFIED` (code trace).

### Finding F-UG-04 — P0: Unauthenticated `/api/profile/analytics` IDOR, `/api/analytics/time-spent` Forgery & `/api/onboarding` Missing Workspace Check
1. **Finding ID:** `F-UG-04`
2. **Feature or workflow:** Profile Analytics, User Insights Telemetry & Onboarding API
3. **Severity:** **P0 (Critical Security)**
4. **Current behaviour:** `GET /api/profile/analytics` (`L79`) sets `effectiveWorkspaceId = auth?.workspaceId || queryWorkspaceId` with no login required. `POST /api/analytics/time-spent` (`L68-78`) accepts unauthenticated `x-user-id` / `body.userId`, mutating `user_section_time` and `auth.users.user_metadata`. `/api/onboarding` (`L62-255`) skips `verifyWorkspaceAccess(userId, workspaceId)`.
5. **Expected behaviour:** Require authenticated session + `verifyWorkspaceAccess` on all three routes; derive `userId` strictly from authenticated session.
6. **Exact source file & function:** `app/api/profile/analytics/route.ts` (`GET` `L71-106`), `app/api/analytics/time-spent/route.ts` (`POST` `L34-82`), `app/api/onboarding/route.ts` (`GET/POST/DELETE` `L62-255`).
7. **Route or API reference:** `GET /api/profile/analytics`, `POST /api/analytics/time-spent`, `/api/onboarding`.
8. **Database dependency:** `analytics_events`, `profiles`, `user_section_time`, `auth.users`, `onboarding_checklists`.
9. **Reproduction steps:** Unauthenticated `GET /api/profile/analytics?workspaceId=<uuid>` -> `200 OK`; unauthenticated `POST /api/analytics/time-spent` with `{"userId":"<uuid>","section":"studio","durationSeconds":999}` -> `200 OK`.
10. **User impact:** Exposure of private analytics & forged user engagement metrics.
11. **Business impact:** Multi-tenant privacy leak & corrupted internal analytics.
12. **Security or data impact:** Broken access control (OWASP A01).
13. **Root cause:** Unauthenticated convenience fallbacks (`queryWorkspaceId`, `bodyUserId`, omitted `verifyWorkspaceAccess`).
14. **Recommended resolution:** Enforce `getCurrentAuth()` (`401` on null) & `verifyWorkspaceAccess()` (`403` on non-member); remove `body.userId` fallback and `DashboardTimeTracker.tsx:83-85` spoofable header.
15. **Acceptance criteria:** Unauthenticated or cross-workspace requests return `401`/`403`.
16. **Verification method:** Vitest route tests with `auth = null` and foreign `workspaceId`.
17. **Verification status:** `VERIFIED` (code trace).

### Finding F-UG-05 — P1: Referral Rewards Are Unspendable Phantom AI Credits & `"1 Free Month"` Fails for `Spark` Users
1. **Finding ID:** `F-UG-05`
2. **Feature or workflow:** Referral Rewards (`grantAiCredits`, `recordReferralConversion`) & AI Quotas
3. **Severity:** **P1 (High — Broken Product Promise)**
4. **Current behaviour:** `ReferralDashboard.tsx:198-206` promises `200 AI credits` and `1 free month`. `lib/referrals/service.ts` writes `referral_codes.rewards_earned` & `referral_rewards`, **but 0 AI routes or plan limiters read either**. `recordReferralConversion` (`L260-287`) only extends `subscriptions.eq('status', 'active').maybeSingle()` — **`Spark` referrers get `0` free days**, multi-workspace paid referrers fail `.maybeSingle()` silently, and Cashfree has no refund webhook revocation.
5. **Expected behaviour:** Earned credits expand usable `use_ai` quota in the unified entitlement engine; Spark referrers receive a real 30-day `Creator` grant (or real billing discount); Cashfree refunds reverse unearned rewards safely without negative balances.
6. **Exact source file & function:** `lib/referrals/service.ts` (`L196, L237-287, L321-358`), `lib/plan-enforcement.ts` (`L555-566`), `lib/middleware/plan-enforcement-middleware.ts` (`L344`), `app/api/webhooks/cashfree/route.ts` (`L67-157`).
7. **Route or API reference:** `/dashboard/referrals`, `POST /api/webhooks/cashfree`, `GET /api/billing/verify`.
8. **Database dependency:** `referral_codes`, `referral_rewards`, `referrals`, `subscriptions`, `workspaces`, `ai_usage`.
9. **Reproduction steps:** Free referrer converts User B -> `rewards_earned = 1200`, `months_earned = 1` -> Free referrer remains blocked at `25` AI credits/mo and stays on `spark`.
10. **User impact:** Referrers earn unusable points and zero free days.
11. **Business impact:** Destroys referral loop trust.
12. **Security or data impact:** `grantAiCredits` ignores Supabase `{ error }` (`L343-352`); non-atomic counters drop updates; missing check `.eq('status','signed_up')` in conversion update.
13. **Root cause:** Referral ledger built separately from quota enforcement and free-tier trial provisioning.
14. **Recommended resolution:** Wire spendable bonus AI credits into central `lib/entitlements/` `use_ai` allowance; issue explicit 30-day `Creator` grant/trial to Spark referrers + extend paid workspaces safely by owner workspace ID; add Cashfree refund webhook reversal.
15. **Acceptance criteria:** Referrer with `+200` earned credits can call `planLimit + 200` AI actions; Spark referrer upgrades to `Creator` for 30 days on qualified conversion.
16. **Verification method:** Vitest integration tests across AI credit consumption & Spark/paid conversion rewards.
17. **Verification status:** `VERIFIED` (code trace).

### Finding F-UG-06 — P1: Referral Attribution Breaks on Profile Badge (`?ref=subdomain`), Races on First Load, Double-Counts Clicks, & Rewards Existing Google OAuth Accounts
1. **Finding ID:** `F-UG-06`
2. **Feature or workflow:** Referral Link Distribution, Click Counting & Attribution
3. **Severity:** **P1 (High)**
4. **Current behaviour:** (a) `MadeWithUnoolCTA.tsx:46,82` appends `?ref=<subdomain>` instead of `referral_codes.code`, dropping 100% of badge attributions; (b) `ReferralDashboard.tsx:128` distributes `/signup?ref=` bypassing `/r/[code]`, and visiting `/r/[code]` -> `/signup` counts `+2` clicks per visit (`signup/page.tsx:45`) with zero rate limit; (c) `GET /api/referrals:40-43` races `getOrCreateReferralCode` against `getReferralStats` (`Promise.all`), returning `code: null`; (d) `ReferralDashboard.tsx:105` filters Realtime on non-existent `referrer_workspace_id`; (e) `GET /auth/callback:115-123` triggers signup rewards on existing Google OAuth accounts; (f) `verify-otp:140` skips referral attribution on duplicate-user branch; (g) `signup/page.tsx:38-42` overwrites `middleware.ts`'s first-touch cookie.
5. **Expected behaviour:** Badge resolves creator's real `referral_codes.code`; `/r/[code]` is the sole click-tracking redirect; `GET /api/referrals` creates then queries sequentially; Realtime uses `referrer_user_id`; `/auth/callback` checks `isNewUser`; first-touch policy matches client + middleware.
6. **Exact source file & function:** `components/profile/MadeWithUnoolCTA.tsx` (`L46,L82`), `components/referrals/ReferralDashboard.tsx` (`L105,L128`), `app/api/referrals/route.ts` (`L40-43`), `app/r/[code]/route.ts`, `app/signup/page.tsx` (`L36-68`), `app/auth/callback/route.ts` (`L115-123`), `app/api/auth/signup/verify-otp/route.ts` (`L127-153`).
7. **Route or API reference:** `/r/[code]`, `/signup`, `/auth/callback`, `GET /api/referrals`, `POST /api/referrals/click`.
8. **Database dependency:** `referral_codes`, `referrals`, `profiles`.
9. **Reproduction steps:** Click `"Made with UNOOL"` on `/u/alex` -> `/signup?ref=alex` -> `recordReferralSignup` fails to find `'alex'`; log into old Google account holding `unool_ref` cookie -> triggers signup credit.
10. **User impact:** Badge referrals lost; first Referrals page visit shows blank link/spinner.
11. **Business impact:** Zero viral badge conversion + OAuth farming exposure.
12. **Security or data impact:** Retroactive OAuth credit abuse + public click spam.
13. **Root cause:** Disconnected attribution code across 6 files.
14. **Recommended resolution:** Resolve badge code cleanly server-side; standardize on `/r/[code]` & remove `/signup` mount `/click` call; serialize `GET /api/referrals`; gate `/auth/callback` attribution to new users (`created_at` fresh) + minimum activation before granting credits.
15. **Acceptance criteria:** 1 visit to badge -> `/r/[code]` -> new OTP/OAuth signup counts `1` click & `1` attributed signup; existing OAuth users yield `0` attribution.
16. **Verification method:** Vitest attribution suite + route mocks.
17. **Verification status:** `VERIFIED` (code trace).

### Finding F-UG-07 — P1: Fragmented Entitlement Engine & Sold Unimplemented Plan Promises (`Custom domain`, `Approvals`, `uk_live_*`, `linkedin_comment_logs`)
1. **Finding ID:** `F-UG-07`
2. **Feature or workflow:** SaaS Plans, Usage Limits & Pricing Matrix
3. **Severity:** **P1 (High)**
4. **Current behaviour:** 4 separate entitlement modules diverge: `lib/middleware/plan-enforcement.ts:268` skips enforcement on 23 of 30 `PlanAction`s; Overview `app/dashboard/page.tsx` uses `lib/limits/freeTier.ts` (counts `published` only, skips `subscriptions`); `plan-enforcement-middleware.ts:348` queries non-existent table `linkedin_comment_logs` while `plan-enforcement.ts:424` hardcodes `0`; `/api/studio/ideas` skips `useAI`; `/api/brand-materials` skips `brand_voice`; `/pricing` & `BillingClient` sell unimplemented `Custom domain`, `Approval workflows`, and external `API access` (`uk_live_*` keys have 0 consumers).
5. **Expected behaviour:** Single server entitlement engine used identically across Overview, APIs, and Billing; pricing reflects verified live features only.
6. **Exact source file & function:** `lib/middleware/plan-enforcement.ts` (`L46-64, L268-278`), `lib/middleware/plan-enforcement-middleware.ts` (`L348`), `lib/plan-enforcement.ts` (`L424`), `lib/limits/freeTier.ts`, `app/dashboard/page.tsx` (`L104, L135-183`), `app/api/studio/ideas/route.ts`, `app/api/brand-materials/route.ts`, `app/api/keys/route.ts`, `app/pricing/PricingPageClient.tsx`.
7. **Route or API reference:** `/pricing`, `/dashboard`, `/dashboard/billing`, `/api/studio/ideas`, `/api/brand-materials`, `/api/keys`.
8. **Database dependency:** `plans`, `workspaces`, `subscriptions`, `user_plan_overrides`, `posts`, `ai_usage`, `api_keys`.
9. **Reproduction steps:** Exhaust Spark AI credits -> call `POST /api/studio/ideas` -> succeeds; create Studio API key -> zero `/api/v1/*` routes exist.
10. **User impact:** Contradictory quota counters & paid features that don't exist.
11. **Business impact:** Revenue loss on AI/DM usage + 7-day refund disputes (`app/refund/page.tsx`).
12. **Security or data impact:** `withPlanEnforcement` fails open (`allowed: true`) on 23 actions.
13. **Root cause:** Legacy limit helpers left mounted alongside newer middleware; aspirational features placed in `plans.ts`.
14. **Recommended resolution:** Merge into single `lib/entitlements/index.ts`, fix `linkedin_comment_logs` count from `workspaces.settings`, guard all AI/brand-material/automation endpoints, remove unbacked claims from `/pricing`.
15. **Acceptance criteria:** Overview & API routes report exact same tier & quota counts; 0 callers of `freeTier.ts` or legacy `middleware/plan-enforcement.ts`.
16. **Verification method:** Static import grep + Vitest matrix across all 30 actions & 4 plans.
17. **Verification status:** `VERIFIED` (code trace).

### Finding F-UG-08 — P1: Multi-Workspace `.single()` Crash Spawns Ghost Workspaces & Team Invites Are Incomplete
1. **Finding ID:** `F-UG-08`
2. **Feature or workflow:** Workspace Resolution, Team Invitations & Role Permissions
3. **Severity:** **P1 (High)**
4. **Current behaviour:** `middleware.ts:214`, `lib/auth/context.ts:143`, and `lib/auth/server.ts:85` call `.single()` on `workspace_members`. Belonging to `>1` workspace errors -> `context.ts:145-164` creates a brand-new `'Personal Workspace'` (`plan: 'free'`) on every render! `POST /api/workspace:114` omits sending email (`// TODO`), `verifyWorkspaceAccess` ignores role (`owner`/`member`/`viewer`), and no Workspace Switcher UI exists.
5. **Expected behaviour:** Active workspace cookie/header validated against `workspace_members` + `workspaces.owner_id`, falling back cleanly via `.limit(1)`, paired with real invite emails, role checks, and a Workspace Switcher UI.
6. **Exact source file & function:** `middleware.ts` (`L211-220`), `lib/auth/context.ts` (`L139-165`), `lib/auth/server.ts` (`L24-28, L81-85`), `app/api/workspace/route.ts` (`L68-142`).
7. **Route or API reference:** `POST /api/workspace`, all `/dashboard/*` SSR routes.
8. **Database dependency:** `workspaces`, `workspace_members`.
9. **Reproduction steps:** Invite an existing Pro user into Workspace B -> navigate to `/dashboard` -> `.single()` fails (`multiple rows`) -> creates empty `'Personal Workspace'`.
10. **User impact:** Invited users lose access to both paid & invited workspaces.
11. **Business impact:** Breaks `Pro` (3 seats) and `Studio` (3 workspaces / 10 seats) selling points.
12. **Security or data impact:** Uncontrolled orphan `workspaces` rows; any invited member has full owner-like mutation access.
13. **Root cause:** Early 1-user=1-workspace `.single()` assumption.
14. **Recommended resolution:** Replace `.single()` with active-workspace resolution + `.order('created_at').limit(1).maybeSingle()`; add Workspace Switcher + role enforcement + transactional invite emails.
15. **Acceptance criteria:** User with 2+ memberships switches cleanly without generating extra `'Personal Workspace'` rows.
16. **Verification method:** Vitest multi-workspace auth test.
17. **Verification status:** `VERIFIED` (code trace).

### Finding F-UG-09 — P1: Admin Referral Click Fabrication (`signupCount * 3`), Read-Time DB Mutations & 1,000-User Cap Scan
1. **Finding ID:** `F-UG-09`
2. **Feature or workflow:** Admin Referrals & User Lookup (`/admin/referrals`, `/admin/users/[id]`)
3. **Severity:** **P1 (High — Integrity & Scalability)**
4. **Current behaviour:** `SupabaseAdminRepository.listReferralCodes` (`L2919-3005`) sets `clickCount: Math.max(row.click_count || 0, signupCount * 3)` and mutates DB rows (`referrals`/`referral_codes`) during `GET` requests. `app/api/admin/users/[id]/route.ts` also auto-creates referral codes on `GET` and scans `supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })`.
5. **Expected behaviour:** Admin `GET` endpoints are strictly side-effect-free, display authentic stored metrics (`click_count`), and query indexed DB/auth lookups cleanly beyond 1,000 users.
6. **Exact source file & function:** `lib/repositories/supabase/SupabaseAdminRepository.ts` (`listReferralCodes` `L2919-3005`), `app/api/admin/referrals/route.ts`, `app/api/admin/users/[id]/route.ts` (`L130-151, L269-281`).
7. **Route or API reference:** `/admin/referrals`, `GET /api/admin/referrals`, `GET /api/admin/users/[id]`.
8. **Database dependency:** `referral_codes`, `referrals`, `workspaces`, `auth.users`.
9. **Reproduction steps:** Inspect user with 2 real signups & 1 real click -> `/admin/referrals` displays `6` clicks (`2 * 3`).
10. **User impact:** None directly; operators receive fabricated growth metrics.
11. **Business impact:** False CAC/funnel decisions by founders/ops; breaks past 1,000 auth users.
12. **Security or data impact:** `GET` HTTP requests mutate persistent database records.
13. **Root cause:** Admin repair/backfill heuristic left inline inside `GET` repository method.
14. **Recommended resolution:** Remove `* 3` fabrication & read-time mutations immediately; move any repair script into explicit `POST` admin action; replace `listUsers({ perPage: 1000 })` with paginated lookup/RPC.
15. **Acceptance criteria:** `GET /api/admin/referrals` performs 0 DB writes and returns true `click_count`.
16. **Verification method:** Vitest repository unit test checking exact `clickCount === row.click_count` & zero `.insert`/`.update` calls on `GET`.
17. **Verification status:** `VERIFIED` (code trace).

### Finding F-UG-10 — P2 (P1 in Live DB If Unpatched): Incomplete GDPR Account Deletion (`referrer_id` / `referral_rewards`) & Legacy `admin_users` Tautological RLS
1. **Finding ID:** `F-UG-10`
2. **Feature or workflow:** GDPR Account Deletion & Supabase RLS Policies
3. **Severity:** **P2 (P1 if legacy `20250723000001` policies remain active in prod DB)**
4. **Current behaviour:** `20261110000002` dropped `"Service role only"` policies on `admin_users` & `admin_audit_log`, leaving `20250723000001_admin_analytics_tables.sql` tautological `SELECT` policies (`L54,78`) and permissive `analytics_events` `INSERT WITH CHECK (true)` (`L172`). Meanwhile `app/api/user/delete/route.ts:178` fallback array still deletes `referrals` by non-existent `referrer_id` (instead of `referrer_user_id`), omits `referral_rewards` (also omitted from RPC `20261113000001`), omits `public.users`, and referral tables lack `ON DELETE CASCADE`.
5. **Expected behaviour:** All admin/audit tables deny `anon`/`authenticated`; `DELETE /api/user/delete` and deletion RPC erase every user-owned referral, reward, and public user record completely (or explicitly anonymize financial/referral history).
6. **Exact source file & function:** `supabase/migrations/20250723000001_admin_analytics_tables.sql` (`L54,L78,L172`), `supabase/migrations/20261110000002_security_rls_and_schema_fixes.sql`, `supabase/migrations/20261113000001_automation_audit2_fixes.sql` (`L66-120`), `app/api/user/delete/route.ts` (`L174-205`).
7. **Route or API reference:** `DELETE /api/user/delete`.
8. **Database dependency:** `admin_users`, `admin_audit_log`, `analytics_events`, `referrals`, `referral_rewards`, `referral_codes`, `users`.
9. **Reproduction steps:** Invoke fallback path of `DELETE /api/user/delete` -> query `{ table: 'referrals', column: 'referrer_id' }` errors silently and `referral_rewards` persists.
10. **User impact:** Incomplete personal data erasure upon account deletion.
11. **Business impact:** GDPR/DPDP compliance risk & Supabase RLS audit failure.
12. **Security or data impact:** Exposed `admin_users` / `admin_audit_log` rows if legacy `20250723000001` policy survives in prod (`UNVERIFIED` on live Postgres).
13. **Root cause:** Incomplete RLS policy drop & partial column fix (`20261113000001` fixed RPC `referrer_user_id`, missed `delete/route.ts` and `referral_rewards`).
14. **Recommended resolution:** Ship migration dropping legacy `20250723000001` admin/analytics policies cleanly; fix `delete/route.ts` & deletion RPC to include `referral_rewards` & `public.users` (`referrer_user_id`).
15. **Acceptance criteria:** Live Postgres `pg_policies` confirms zero tautological policies; account deletion leaves 0 orphaned user rows.
16. **Verification method:** SQL policy inspection in Supabase + Vitest deletion route test.
17. **Verification status:** `VERIFIED` in repo source (`b03bbf5`); live prod RLS state `BLOCKED` / `UNVERIFIED`.

### Finding F-UG-11 — P2: In-DM Follow Gate Tier Bypass & Prompt Override + Brand Materials Soft-Delete Leak + Hardcoded `'usha'` Fallbacks
1. **Finding ID:** `F-UG-11`
2. **Feature or workflow:** In-DM Automation (`require_follow_for_dm`), Brand Materials Delivery & Dashboard Shell Hygiene
3. **Severity:** **P2 (Medium)**
4. **Current behaviour:** (a) `PUT /api/instagram/automation` gates `dmAutoReplyEnabled` on `dm_concierge`, **but does not gate `requireFollowForDm`**, and `webhooks/instagram/route.ts:858` intercepts DMs for `requireFollowForDm` *before* `dmAutoReplyEnabled`; (b) public comment follow prompt hardcodes text (`webhooks/instagram/route.ts:698`) ignoring custom `followAskMessage`; (c) `GET /api/brand-materials?subdomain=` (`L38-42`) omits `.is('deleted_at', null)`; (d) `FB`/`Threads`/`LI` automation endpoints skip `isAutomationEnabledServer()`; (e) `app/dashboard/layout.tsx:695,742,827` hardcodes `'usha'`, `'usha@unool.co'`, `'usha.unool.co'` fallbacks and `DashboardClient.tsx:1343` links deprecated `/dashboard/schedule`.
5. **Expected behaviour:** Enforce `dm_concierge` + monthly DM quota on `require_follow_for_dm`; use custom comment prompt if configured; filter `.is('deleted_at', null)` on all Brand Materials reads; enforce `automationEnabled` across all 4 channels; eliminate founder hardcoded strings.
6. **Exact source file & function:** `app/api/instagram/automation/route.ts`, `app/api/webhooks/instagram/route.ts` (`L698, L858`), `app/api/brand-materials/route.ts` (`L38-42`), `app/dashboard/layout.tsx` (`L695,L742,L827`), `app/dashboard/DashboardClient.tsx` (`L1343`).
7. **Route or API reference:** `/dashboard/automation`, `PUT /api/instagram/automation`, `POST /api/webhooks/instagram`, `GET /api/brand-materials`.
8. **Database dependency:** `instagram_automation_config`, `brand_materials_pages`, `workspaces`, `admin_feature_flags`.
9. **Reproduction steps:** On Spark workspace, set `requireFollowForDm = true` (`PUT /api/instagram/automation` without turning on `dmAutoReplyEnabled`) -> inbound DMs trigger Follow Gate bypassing Spark `dm_concierge` restriction.
10. **User impact:** Deleted resource pages remain viewable; new users briefly see founder name `'usha'`; custom copy ignored.
11. **Business impact:** Unmetered free Meta API/Groq DM usage by Spark workspaces; sloppy white-label polish.
12. **Security or data impact:** Tier bypass on DM automation + soft-delete exposure.
13. **Root cause:** Incremental additions to `webhooks/instagram`, `brand-materials`, and `layout.tsx` without centralized checks.
14. **Recommended resolution:** Require `dm_concierge` on `require_follow_for_dm` in `PUT` & webhook/worker; honor custom follow prompt; add `.is('deleted_at', null)`; add `isAutomationEnabledServer()` to FB/Threads/LI; scrub `'usha'` strings & stale `/dashboard/schedule` link.
15. **Acceptance criteria:** Spark `PUT` with `requireFollowForDm: true` returns `403`; 0 `'usha'` matches in `app/` or `components/`; soft-deleted Brand Pages return 404.
16. **Verification method:** Static grep + Vitest tests on `/api/instagram/automation` & `/api/brand-materials`.
17. **Verification status:** `VERIFIED` (code trace).

---

## 18. Competitive Research

### Clearly Separated Evidence vs. Observation Layers (Part 11 Standard)

- **Verified Market & Competitor Observations (`search_web` verified):**

| Competitor | Access / Entitlement Model | Follow-to-Unlock Mechanic | Referral / Growth Model | Product Architecture Takeaway for Unool |
|---|---|---|---|---|
| **ManyChat** | Free up to 1,000 contacts; Pro ($15+/mo) gates conditionals & integrations | **Native In-DM Condition (`is_user_follow_business`)** via Comment-to-DM / Story Reply + Quick Reply re-check | Agency/Partner affiliate program (separate from creator DM flows) | Validates **Option C**: IG Follow-to-Unlock only succeeds reliably inside IG DM threads (`IGSID`), never anonymous web `/gate/[id]` links. |
| **Zorcha** (Unool's direct India competitor on `/switch-from-zorcha`) | Freemium + **AI credits** / tier limits | IG Comment-to-DM & In-DM Follow Gate | Creator tier scaling | Unool's `InstagramCommentAutomation` matches Zorcha's core loop — *only* if Unool retires broken `/gate/[id]` and fixes quotas. |
| **Stan Store** | Paid-first / trial, creator stores | None | **Direct affiliate payouts / recurring %** | Rewards must be **tangible and spendable** (bill discount, usable AI credits, real trial months), never dead ledger numbers. |
| **Linktree** | Freemium; Pro gates custom domains, themes, badge removal | None | Partner perks | Public bio pages + subpages (`Brand Materials`) belong under **Profile**, never Automation. |
| **Buffer / Typefully** | Clear queue, channel, & post quotas per tier | None | Recurring referral commission | Users expect **one truthful quota count** from Overview through Composer and Billing. |

### 10-Question Capability Evaluation Matrix (`PART 11`)

| # | Evaluation Question | Standalone `/gate/[id]` | In-DM `require_follow_for_dm` | Referral Program | Unified Entitlement Engine |
|---|---|---|---|---|---|
| **1** | What user problem does it solve? | Lead magnet gated by IG follow (broken today) | Instant IG follower growth via DM asset delivery | Word-of-mouth user acquisition | Transparent limits & self-serve monetization |
| **2** | How frequently does it occur? | High (if functional) | **High** — every Reel/post CTA campaign | Low/occasional (satisfied advocates) | **Constant** — every AI, post & sync call |
| **3** | Does it improve activation? | **Hurts** (Day-1 failure) | **Yes** (fast tangible follower conversion) | Only if invited peer also receives starter value | **Yes** (when transparent, non-broken) |
| **4** | Does it improve retention? | **Hurts** | **High** (recurring DM lead growth loop) | **High** *only* once AI credits/free months work | **Yes** (eliminates surprise blocks) |
| **5** | Does it improve collaboration? | No | No | Weak | **High** once multi-workspace `.single()` fixed |
| **6** | Does it improve acquisition? | Negative WOM | Indirect ("Powered by" footer) | **High** once `MadeWithUnoolCTA` uses true `?ref=CODE` | Supports Free -> Paid funnel |
| **7** | Monetization opportunity? | Weak | **High** (`Creator`/`Pro` wedge vs Zorcha) | Indirect (offsets paid subscription cost) | Core SaaS billing backbone |
| **8** | Cognitive load impact? | **High** (duplicate nav + broken gate) | **Low** (lives naturally in IG Automation) | **Medium** (relocate to Account Footer) | **Reduces** cognitive load |
| **9** | Operational cost? | DB session bloat + failed Meta API calls | Meta Graph API + QStash + Groq turns | AI inference cost + trial margin (once real) | Net-negative code cost (deletes 3 engines) |
| **10** | Genuinely differentiates Unool? | **No** (broken clone) | **Yes** (paired with Studio + Profile + LinkedIn) | Only via organic `/u/[sub]` badge loop | Foundation allowing honest differentiation |

---

## 19. Product-Market-Fit Hypotheses

*(Strict Part-11 epistemic separation preserved below:)*

- **Repository Findings (`VERIFIED`):** Strong underlying engines exist in AI adaptation (`Studio`), 7-day narrative planning (`Flight Plan`), In-DM Follow Gate (`InstagramCommentAutomation`), 23 Profile templates, and Cashfree billing — currently undermined by broken standalone `/gate/[id]`, unspendable referral credits, phantom pricing features, and 10-item nav clutter.
- **Unverified Assumptions (`UNVERIFIED` / `BLOCKED`):** **Product-market fit has NOT been established.** The repository holds zero live retention cohorts, activation funnel percentages, DM conversion metrics, or churn reasons (`BLOCKED`: no production DB / telemetry access).
- **Testable PMF Hypotheses (`PRODUCT HYPOTHESES` — to validate after fixes):**
  1. **H1 (In-DM Follow-Gate + Brand Page Wedge):** Creators running `Comment -> DM Force-Follow -> Brand Resource Page` from one unified Automation + Profile flow will retain better weekly than creators using Unool solely as a static Link-in-Bio.
  2. **H2 (Viral Badge Attribution):** Repairing `MadeWithUnoolCTA` to pass true `referral_codes.code` + giving referred creators a starter bonus (e.g., bonus AI credits / trial) will make free Spark profiles a positive-ROI acquisition loop.
  3. **H3 (Navigation Simplification):** Cutting sidebar items from 10 to 6 + unifying Overview Setup Strip + fixing Overview quota counts will improve Day-1 activation (`First Post + Connected IG`) without reducing power-user workflows.
- **Evidence-Grounded Recommendations:** Execute Wave 1 security/integrity fixes and Wave 2 consolidation (`Option C`) first; instrument real activation/conversion funnels before building new Wave 4 tier features (`Custom domains`, `Approvals`, `Public API`).

---

## 20. Edge-Case Matrix

*(50 concrete cases covering all 18 Unlock Gate cases, all 20 Referral cases, and all 12 Product-Wide Placement cases from Part 12)*

### 20.1 Unlock Gates & Entitlements Edge Cases (18 Cases)

| Edge Case | Expected Behavior | Current Behavior (`b03bbf5`) | Evidence | Severity | Required Correction |
|---|---|---|---|---|---|
| **1. First-time user (web `/gate/[id]`)** | Clear follow verification & unlock | Polls forever (`visitorIgUserId` missing); never unlocks | `FollowGateCard.tsx:102`, `check/route.ts:51` | **P0** | Sunset `/gate/[id]`; route creators to In-DM Follow Gate |
| **2. Returning user (`/gate/[id]` reload)** | Preserve unlocked state across reload | Refresh wipes React `useState`; lock reappears | `FollowGateCard.tsx:39,165` | **P1** | Retire `/gate/[id]` (or persist session verification) |
| **3. User already eligible (already follows)** | Instant unlock without extra friction | Web gate fails (`followVerified: false`); **In-DM** queries `is_user_follow_business` & unlocks immediately | `InstagramCommentAutomation.ts:1136-1141` | **P0 (Web)** / **PASS (DM)** | Consolidate on In-DM flow |
| **4. User becomes ineligible (unfollows)** | Prompt to follow again | In-DM re-queries `is_user_follow_business` on unverified requests (`alreadyUnlocked` log short-circuits prior unlocks) | `InstagramCommentAutomation.ts:993,1072` | **P2** | Keep live check cleanly |
| **5. Workspace switch** | Gates & limits re-scope immediately | `FollowGateManagerPage` caches `workspaceId` in module var; `.single()` breaks multi-workspace auth | `FollowGateManagerPage.tsx:8-11`, `context.ts:143` | **P1** | Fix `.single()` + add workspace-keyed cache/switcher |
| **6. Plan upgrade (`Spark` -> `Creator`/`Pro`)** | Immediate quota/feature unlock | `markOrderPaid` updates DB; Redis `plan:${id}` (60s) & `plans.ts` (5m) caches briefly lag | `subscription.ts:231-266`, `plan-enforcement.ts:142` | **P2** | Invalidate both caches synchronously on upgrade |
| **7. Plan downgrade** | Paid features lock cleanly on save & runtime | Existing `requireFollowForDm` stays `true` in DB; `Overview` (`freeTier.ts`) doesn't cross-check `subscriptions` | `plan-enforcement-middleware.ts:166-175`, `app/dashboard/page.tsx` | **P1** | Unify Overview onto `lib/entitlements/`; check `dm_concierge` at runtime |
| **8. Expired entitlement** | Revert to `Spark` smoothly with clear upgrade prompt | `getPlanContext` enforces `spark` (`L167-175`); **Overview doesn't**, and Follow-Gate webhooks still fire if `ig_comments_per_month` remains | `plan-enforcement-middleware.ts:167-175` | **P1** | Enforce `dm_concierge` on In-DM Follow Gate + unify Overview |
| **9. Owner versus member** | Owner controls Billing/Teams/Danger; Member respects role | `verifyWorkspaceAccess` checks membership existence only — any member can delete gates or mutate automation! | `workspaceAccess.ts` | **P1** | Add role enforcement (`owner`/`admin`/`member`/`viewer`) |
| **10. Multiple workspaces owned by user** | Independent quotas/gates per workspace | `.single()` fails across `middleware.ts`, `context.ts`, `server.ts`, spawning ghost `'Personal Workspace'` | `middleware.ts:214`, `context.ts:143` | **P1** | Active-workspace switcher + `.limit(1)` resolution |
| **11. Concurrent unlock attempts** | Atomic increment & quota lock | Non-atomic read-modify-write (`view_count`, `unlock_count`); TOCTOU count-then-insert on `ai_usage`/`posts` | `service.ts:177-193,244-256` | **P2** | Atomic Postgres `SET col = col + 1` / transactional increment |
| **12. Repeated requests (rate abuse)** | Public endpoints throttled | `POST /api/follow-gate/[gateId]/session` has 0 rate limit -> infinite session row/view spam | `session/route.ts:10-35` | **P2** | Retire endpoint (or enforce Upstash IP rate limit) |
| **13. Backend failure during verification** | Clear actionable retry message | `check/route.ts:64-76` error ignored by `FollowGateCard`, which silently keeps polling 36 times | `check/route.ts:71-75`, `FollowGateCard.tsx:104-122` | **P2** | Surface backend errors immediately & halt polling |
| **14. Partial success (toggle/delete fail)** | Rollback optimistic UI + show error | `FollowGateManager.tsx:109,128` ignores `!res.ok` HTTP errors, flashing success on 500! | `FollowGateManager.tsx:100-132` | **P2** | Guard `if (!res.ok) throw` before confirming state |
| **15. Stale frontend state** | Revalidate on workspace/plan mutation | `BillingClient` & `FollowGateManagerPage` hold module globals persisting across workspace changes | `BillingClient.tsx:28-33`, `FollowGateManagerPage.tsx:8-11` | **P2** | Scope caches by `workspaceId` & invalidate on change |
| **16. Direct API access (bypass)** | `401`/`403` enforced server-side | `GET /api/follow-gate/[id]` IDOR; `/api/studio/ideas` unchecked; `/api/onboarding` unchecked; `/api/profile/analytics` unauth IDOR | See `F-UG-03`, `F-UG-04`, `F-UG-07` | **P0/P1** | Scope all queries by authenticated `workspaceId` & unified guard |
| **17. Deleted workspace** | Clean cascade purge of gates/sessions | Deletion RPC cleans `follow_gate_sessions`, `follow_gates`, `brand_materials_pages`; expired sessions otherwise accumulate | `20261113000001:66-74,192` | **P2** | Clean cascade + scheduled TTL purge if retained |
| **18. Deleted account** | Complete GDPR/DPDP purge | Fallback `api/user/delete/route.ts:178` queries wrong `referrer_id` column, omits `referral_rewards` & `public.users` | `api/user/delete/route.ts:174-205` | **P1** | Fix fallback array & RPC (`referrer_user_id`, `referral_rewards`, `public.users`) |

### 20.2 Referral Edge Cases (20 Cases)

| Edge Case | Expected Behavior | Current Behavior (`b03bbf5`) | Evidence | Severity | Required Correction |
|---|---|---|---|---|---|
| **1. No referral code** | Normal signup | Cleanly proceeds with 0 referral rows | `signup/route.ts:129` | `VERIFIED` | Keep |
| **2. Invalid referral code** | Graceful ignore | `recordReferralSignup` logs warn & skips; `/r/INVALID` redirects to `/signup` | `service.ts:151-154`, `r/[code]/route.ts:15` | `VERIFIED` | Keep |
| **3. Expired referral link** | Clear non-expiring / expiry rule | Codes never expire; `unool_ref` cookie expires after 30 days | `middleware.ts:101` | `VERIFIED` | Document 30d attribution window explicitly |
| **4. Self-referral** | Blocked | Only checks `referrerUserId === referredUserId` (`service.ts:160`) — bypassable via alt email | `service.ts:160` | **P2** | Add normalized-email check + IP signup burst throttle |
| **5. Existing user** | Must NOT attribute as referral signup | `GET /auth/callback:115-123` triggers signup reward for existing Google OAuth users! | `app/auth/callback/route.ts:115-123` | **P1** | Require newly-created account check (`created_at`) |
| **6. Duplicate signup** | Single idempotent referral | `referrals.referred_user_id UNIQUE`; duplicate-user branch (`verify-otp:140`) omits referral | `20261023_billing_tables.sql:75`, `verify-otp/route.ts:140` | **P2** | Ensure consistent idempotent branch |
| **7. Multiple referrers** | Consistent first- or last-touch | `middleware.ts:94` enforces first-touch, **but `signup/page.tsx:41` overwrites cookie!** | `middleware.ts:94`, `signup/page.tsx:38-42` | **P2** | Unify strict first-touch (or explicit policy) everywhere |
| **8. Cross-device signup** | Preserved or manual fallback | Cookie/sessionStorage drops across devices; no manual referral input on `/signup` | `signup/page.tsx` | **P3** | Optional promo/referral code field on `/signup` |
| **9. Unverified email** | Zero reward until verified | OTP grants referral strictly inside `verify-otp` (`L153`) — good | `signup/route.ts`, `verify-otp/route.ts` | `VERIFIED` | Keep |
| **10. Incomplete onboarding** | Require meaningful activity before credit | `+200` granted immediately on signup with zero usage | `service.ts:196` | **P2** | Gate signup bonus behind profile claim or channel connect |
| **11. Failed conversion** | Remains `'signed_up'` | `markOrderFailed` ignores referral conversion | `cashfree/route.ts:131` | `VERIFIED` | Keep |
| **12. Cancelled subscription / refund** | Revoke unearned free month & credits | **Zero Cashfree refund handler;** rewards stay permanently (`months_earned`, extended days) | `cashfree/route.ts:67-157` | **P1** | Add refund webhook handler revoking reward safely (`>= 0`) |
| **13. Duplicate webhook** | Single conversion award | `webhook_events.cf_payment_id UNIQUE` + `PENDING -> PAID` lock; conversion SQL itself lacks `.eq('status','signed_up')` | `subscription.ts:204-225`, `service.ts:228-235` | **P2** | Add `.eq('status','signed_up')` atomic update |
| **14. Reward already issued** | No duplicate payout on renewals | Queries `.eq('status', 'signed_up')`, so `'rewarded'` does not re-trigger | `service.ts:215` | `VERIFIED` | Keep |
| **15. Reward reversal / redemption** | Usable balance; clamped non-negative | Credits unspendable (never read anywhere); reversal unimplemented | `service.ts:321`, `plan-enforcement.ts:555` | **P1** | Wire bonus balance into `lib/entitlements/` + safe clawback |
| **16. Deleted referrer** | Clean deletion without errors | `delete/route.ts:178` fails on wrong column `referrer_id`; `referral_rewards` omitted | `delete/route.ts:178-180` | **P1** | Fix fallback array & RPC |
| **17. Deleted referred user** | Referrer history remains consistent | Deletion RPC removes `referrals` row while leaving referrer `signup_count` elevated | `20261113000001:115-116` | **P2** | Anonymize `referred_user_id` or adjust view cleanly |
| **18. Workspace transfer / multi-workspace** | Deterministic reward target workspace | `verify-otp:169` stores `userId` in `workspace_id`; conversion `.maybeSingle()` fails on `>1` active subscription | `verify-otp/route.ts:169`, `service.ts:267` | **P1** | Target user's owned workspace deterministically; grant Spark 30d Creator |
| **19. Fraudulent activity** | Rate limits & honest telemetry | Unthrottled `/click`; Admin fabricates `signupCount * 3` clicks | `click/route.ts`, `SupabaseAdminRepository.ts:2919` | **P1** | Rate-limit clicks, remove `* 3` fabrication & read-time mutations |
| **20. Concurrent referral claims** | First load returns generated code cleanly | `GET /api/referrals:40-43` races `Promise.all([getOrCreateReferralCode, getReferralStats])`, returning `code: null` | `app/api/referrals/route.ts:40-43` | **P1** | `await getOrCreateReferralCode()` before stats query |

### 20.3 Product-Wide Feature Placement Edge Cases (12 Cases)

| Edge Case | Expected Behavior | Current Behavior (`b03bbf5`) | Required Correction |
|---|---|---|---|
| **1. Feature moved (`/dashboard/unlock-gates` retired)** | Redirect `/unlock-gates` & `/follow-gates` cleanly -> Automation Follow Gate | `/follow-gates` redirects to `/unlock-gates` | Redirect both cleanly to `/dashboard/automation?tab=instagram&section=follow-gate` |
| **2. Old `/gate/[gateId]` accessed directly** | Graceful sunset card pointing to creator's Instagram DM / Profile | Renders broken verification spinner | Render static fallback pointing visitors to follow creator / DM directly |
| **3. Existing bookmarks (`/composer`, `/schedule`, `/presence`, `/settings/billing`)** | Preserve query params on HTTP 308 redirect | `schedule/page.tsx` & `settings/billing/page.tsx` drop query params; `DashboardClient:1343` still links `/dashboard/schedule` | Preserve `?query` on redirects & update `DashboardClient:1343` |
| **4. Deep links (`/dashboard/settings?tab=billing|persona|accounts`)** | Open matching section cleanly | `SettingsClient.tsx` drops unrecognized `?tab=` to `workspace` | Map legacy `?tab=` params cleanly & fix internal callers (`enforcer.ts:48`) |
| **5. Permissions (Owner vs Member vs Viewer)** | Role checks enforced before destructive/billing changes | `verifyWorkspaceAccess` checks membership existence only | Enforce role hierarchy on billing, team, delete, automation config |
| **6. Workspace switching** | Clear all module caches & reload active workspace | Zero Workspace Switcher UI; `.single()` breaks | Build Workspace Switcher + scope client caches by `workspaceId` |
| **7. Navigation history (`DashboardTimeTracker`)** | Map consolidated routes cleanly to analytics buckets | `/unlock-gates` -> `'unlock-gates'`, `/analytics/linkedin` -> `'overview'` (`helpers.ts`) | Update `normalizeSectionName` for consolidated Signal/Automation IA |
| **8. Duplicate entry points** | Single canonical entry point | `/dashboard/publish`, `/analytics/linkedin`, `POST /api/flightplan/generate`, `POST /api/auth/callback` | Consolidate/redirect cleanly & retire dead APIs |
| **9. Feature disabled (`automationEnabled = false`)** | Hides nav & returns `403` across all 4 channel APIs | Only `instagram/automation` & `brand-materials` enforce `isAutomationEnabledServer()` — **FB, Threads, LinkedIn & Follow-Gate skip it!** | Enforce `isAutomationEnabledServer()` uniformly on all 4 automation APIs |
| **10. Feature deprecated (`OnboardingChecklist`)** | Code & `/api/onboarding` cleanly retired | Component orphaned (0 UI callers), **API route remains exposed without workspace auth!** | Retire UI & close `/api/onboarding` IDOR |
| **11. Existing user data (`follow_gates`, `brand_materials_pages`)** | Zero data loss during consolidation | `follow_gates` has existing rows; `brand_materials_pages` holds live URLs | Export/migrate active `follow_gates` assets into Profile Brand Pages cleanly |
| **12. Existing external integrations (Meta webhooks, Cashfree, QStash)** | Zero URL downtime during consolidation | All webhook URLs active | Keep `/api/webhooks/*` paths stable; refactor internal handlers cleanly |

---

## 21. Prioritized Implementation Recommendations

*(Part 15 Compliance: Priority `P0–P3`, explicit Separation into **Immediate Corrections**, **Architectural Transformation**, and **Future Opportunities**, plus all 7 Part-15 table dimensions)*

### Phase Group 1 — Immediate Security & Data-Integrity Corrections (`P0`)

| ID | Priority & Type | Action | Expected User Value | Business Value | Tech Complexity | Dependencies | Risk | Acceptance Criteria |
|---|---|---|---|---|---|---|---|---|
| **REC-P0-1** | **P0** · Immediate Correction | Fix `middleware.ts` header strip on ALL `/api/*` (incl. `/api/auth`) + stop `updateUserById({ password })` overwrite in `/api/auth/switch-account` | Protects user passwords & prevents session takeover | Prevents multi-tenant breach & support lockouts | Low-Med | Auth test suite | Med (test OAuth/switch) | Spoofed `x-user-id` returns `401`; original password stays valid after switching |
| **REC-P0-2** | **P0** · Immediate Correction | Fix IDOR & XSS: scope `GET /api/follow-gate/[gateId]` by `workspaceId`, block `javascript:` URLs, require auth on `GET /api/profile/analytics`, remove unauth `body.userId` in `/api/analytics/time-spent`, add workspace auth (or retire) `/api/onboarding` | Protects creator analytics, perks & visitor browsers | Prevents data leaks & stored XSS | Low | None | Low | Unauth/`foreign workspaceId` returns `401`/`403`; `javascript:` URL rejected (`400`) |
| **REC-P0-3** | **P0** · Immediate Correction | Replace `.single()` crashes in `middleware.ts`, `context.ts`, `server.ts` + fix `DELETE /api/user/delete` (`referrer_user_id`, `referral_rewards`, `public.users`) + drop legacy `20250723000001` admin/analytics RLS policies | Multi-workspace/team members stop landing in ghost free workspaces; GDPR deletion complete | Unblocks `Pro`/`Studio` team revenue & compliance | Med | Live DB migration | Low-Med | Multi-workspace auth creates 0 ghost rows; account deletion leaves 0 orphaned rows; RLS denies non-admin reads |

### Phase Group 2 — Core Functional Fixes & Architectural Consolidation (`P1–P2`)

| ID | Priority & Type | Action | Expected User Value | Business Value | Tech Complexity | Dependencies | Risk | Acceptance Criteria |
|---|---|---|---|---|---|---|---|---|
| **REC-P1-1** | **P1** · Architectural Transformation | **Retire broken `/gate/[gateId]` & `/dashboard/unlock-gates`; elevate In-DM Follow-Gate** (`require_follow_for_dm`): enforce `Creator+` (`dm_concierge`) + monthly quota, honor custom `followAskMessage`, surface stats in Automation & Signal | Creators get a 100% reliable Instagram Follow-to-Unlock flow | Replaces broken flagship feature with working ManyChat/Zorcha tier wedge | Med | Export/migrate existing `follow_gates` content | Med (`308` redirect + fallback `/gate/` card) | Comment -> DM -> `is_user_follow_business` -> link delivery succeeds; Spark gated cleanly |
| **REC-P1-2** | **P1** · Immediate + Transformation | **Repair Referrals & Make Rewards Real:** Fix `MadeWithUnoolCTA` to pass `referral_codes.code`, canonicalize `/r/[code]`, serialize `GET /api/referrals`, fix Realtime filter, block existing OAuth logins, strip Admin `* 3` clicks & `GET` writes, wire `referral_rewards` to usable AI credits + Spark 30d `Creator` grant + Cashfree refund reversal, relocate to **Account (`Invite & Earn`)** | Promised credits & free month deliver real usable value | Turns free Spark badges into measurable low-CAC acquisition | Med-High | `REC-P1-3` unified entitlement engine | Med (anti-abuse rules) | Badge signup attributes accurately; `rewards_earned` extends `use_ai` quota; Spark referrer receives 30d Creator |
| **REC-P1-3** | **P1** · Architectural Transformation | **Unify 4 Entitlement Modules into 1 (`lib/entitlements/`):** Delete `lib/limits/*` & permissive `lib/middleware/plan-enforcement.ts`; switch Overview & APIs to one truth; guard `/api/studio/ideas`, `/api/brand-materials`, & FB/Threads/LI `automationEnabled`; fix `linkedin_comment_logs` count; strip unbacked `Custom domain`/`Approvals`/`API access` from `/pricing` | Honest quota meters everywhere; zero deceptive upgrade promises | Stops AI/DM cost leakage & refund disputes | Med-High | `BillingClient`, `PricingPageClient`, `DashboardPage` | Low-Med | 1 canonical `getWorkspaceEntitlements()` powers Overview, Studio, Automation, Billing & webhooks |
| **REC-P1-4** | **P1** · Architectural Transformation | **Merge `signal_investigation_deep_dive` (`Signal` 4-view, `Settings` 6-section, `Profile` fixes) into `main`**, reconciling post-`5746d08` sync commits (`597d092`, `4640854`) | Upgrades Analytics, Settings & Profile to audited quality | Eliminates stale 8-tab Settings & broken charts | High | Git conflict resolution | Med | Rebuilt Signal & Settings run cleanly on `main` with `tsc` & tests passing |
| **REC-P2-1** | **P2** · Architectural Transformation | **Move Brand Materials UI from Automation into Profile (`/dashboard/profile?tab=pages`)** (keeping Picker in Automation) + `.is('deleted_at', null)`; **Embed `/analytics/linkedin` inside Signal** | Intuitive information architecture matching creator mental models | Increases resource page & analytics adoption | Med | `PresenceClient`, `SignalClient`, `REC-P1-4` | Low | Resource pages authored in Profile & attachable in Automation; LinkedIn insights visible inside Dashboard nav |
| **REC-P2-2** | **P2** · Architectural Transformation | **Consolidate 4 Onboarding Quests into 1 Overview Setup Strip** (delete orphaned `OnboardingChecklist`, remove 30s `SubdomainClaimPopup`, mount Studio voice calibration cleanly, purge `'usha'` fallbacks & `/dashboard/schedule` link) | Calm, non-interrupting activation journey | Lifts Day-1 completion without modal fatigue | Low-Med | `DashboardClient`, `ComposerClient` | Low | 0 `'usha'` fallbacks; 1 setup strip on Overview; `/studio/ideas` works smoothly |
| **REC-P2-3** | **P2** · Architectural Transformation | **Ship Safe Workspace Switcher + Role-Based `verifyWorkspaceAccess` + Team Invite Email Flow** | Agencies/teams switch workspaces cleanly without password wipe or ghost rows | Unlocks `Pro` (3 seats) & `Studio` (3 workspaces / 10 seats) | Med | `REC-P0-1`, `REC-P0-3` | Low | Role permissions enforced; multi-workspace users switch deterministically |

### Phase Group 3 — Future Commercial Opportunities (`P3` — Build Only After P0–P2)

| ID | Priority & Type | Action | Expected User Value | Business Value | Tech Complexity | Dependencies | Risk | Acceptance Criteria |
|---|---|---|---|---|---|---|---|---|
| **REC-P3-1** | **P3** · Future Opportunity | Build real **Custom Domains** (`CNAME` + Vercel Domains API + `middleware.ts` host routing) for `Pro`/`Studio` | Branded Creator Pages on creator's own domain | Strong Pro/Studio upgrade differentiator | High | Unified entitlements, DNS/Vercel infra | Med (SSL/DNS support) | Custom domain verifies & serves `/u/[subdomain]` & `[slug]` securely |
| **REC-P3-2** | **P3** · Future Opportunity | Build **Approval Workflows** (`pending_approval` post state) & **Public API (`/api/v1/*`)** consuming `uk_live_*` keys for `Studio` | Agency team sign-off & external scheduling automation | Justifies top `Studio` pricing tier | High | Workspace roles (`REC-P2-3`) | Med | Collaborators submit for approval; `uk_live_*` Bearer keys authenticate `/api/v1/*` |

---

## 22. Dependencies and Blockers

| Blocker / Dependency | Classification | Exact Observed Evidence & Impact |
|---|---|---|
| **TypeScript & Vitest Local Execution** | `BLOCKED` | `Test-Path node_modules` returned `False` in `C:\Users\HP\.gemini\antigravity\worktrees\UNOOLNEW\audit_unlock_gates_referral`; both `npx tsc --noEmit --incremental false` and `npx vitest run` exited with `code 1` (`npm error code E403: 403 Forbidden - GET https://registry.npmjs.org/...`). No compile/test runtime checks could execute in this session. |
| **Live Production Postgres / RLS State** | `BLOCKED` / `UNVERIFIED` | No live database queries executed. Exact applied state of migrations through `20261114000002_ensure_fb_threads_automation_tables.sql` vs legacy `20250723000001` policies in prod DB remains unverified. |
| **Live Meta Graph API & App Review** | `BLOCKED` / `UNVERIFIED` | No live IG token or Meta webhook payload was triggered; `is_user_follow_business` execution relies on live Meta App Review scopes (`instagram_business_manage_messages` / `instagram_manage_comments`). |
| **Cashfree Production Subscription Behavior** | `UNVERIFIED` | `cashfree.ts` issues one-time payment orders (`payment_orders`) while `subscriptions` tracks `current_period_end` in Postgres — external Cashfree auto-debit / mandate configuration is not visible in repo source. |
| **Branch Reconciliation Dependency** | Dependency | Merging `signal_investigation_deep_dive` (`2e56d4e`) Signal/Settings/Profile changes into `main` (`b03bbf5`) must carefully preserve post-`5746d08` commits (`4640854`, `597d092`, `c98c69b`, `b03bbf5`). |

---

## 23. Final Recommended Product Architecture

> **Direct Answer to the Final Product-Owner Question:**  
> *If I were responsible for making Unool a world-class product, here is what I would **keep, change, merge, move, remove, and build next** — anchored in one definitive architecture.*

### 23.1 Definitive Target Architecture: **Option C — "4 Core Pillars + 1 Identity Home + 1 Shared Core"**

```text
UNOOL WORKSPACE SHELL (Active Workspace Switcher + Account Footer)
│
├── 0. Overview (/dashboard)
│      • Single Non-Blocking Setup Strip (replaces 4 fragmented quests/popups)
│      • Single Truthful Usage Meter + KPI Snapshot (from `lib/entitlements/`)
│      • Connected Channels Health & Quick Actions
│
├── 1. Studio (/dashboard/studio)                     [Create Content]
│      • Write once -> AI Voice Calibration -> Adapt per Account -> Publish
│
├── 2. Flight Plan (/dashboard/flightplan)            [Plan & Schedule]
│      • 7-Day AI Narrative Arc + Calendar Scheduling
│
├── 3. Signal (/dashboard/signal)                     [Measure Outcomes]
│      • Merged 4-View Analytics (`signal_investigation_deep_dive`) + `597d092` Sync
│      • Absorbs `/analytics/linkedin` + Profile Clicks + In-DM Follow-Gate Conversions
│
├── 4. Automation (/dashboard/automation)             [Convert Audience -> Followers & Leads]
│      • IG / FB / Threads / LinkedIn Comment & DM Automation
│      • SOLE Home of Follow-to-Unlock (Working In-DM `is_user_follow_business`)
│      • Attaches any Resource Drop authored in Profile (`[sub].unool.co/[slug]`)
│
└── 5. Profile (/dashboard/profile)                   [Public Identity & Drops]
       • Bio Identity Page Builder (23 Persona Templates -> `/u/[subdomain]`)
       • Absorbs Brand Materials / Resource Drops (-> `/u/[subdomain]/[slug]`)
       • Spark Badge emits true `?ref=CODE` -> `/r/CODE` Referral Loop
│
└── Account Footer (`Billing` · `Invite & Earn` · `Settings`)
       ├── Billing (/dashboard/billing)        -> Honest Cashfree checkout + real Credits/Trial ledger
       ├── Invite & Earn (Account / Settings)  -> `/r/[code]` + spendable AI credits + Spark 30d Creator grant
       └── Settings (/dashboard/settings)      -> Clean 2-Group 6-Section IA (Personal 3 + Workspace 3)
```

### 23.2 Explicit Executive Decisions (Keep / Change / Merge / Move / Remove / Build Next)

- **KEEP:** **Studio**, **Flight Plan**, **Signal** (4-view rebuild + engagement sync), **Automation** (IG/FB/Threads/LI + working In-DM `is_user_follow_business`), **Profile** (23 templates), **Superadmin** (minus read-time mutations & fabricated `* 3` metrics).
- **CHANGE:** Fix P0 security flaws (`middleware.ts` `/api/auth` strip, password-safe account switching, analytics/onboarding IDORs, GDPR delete, `admin_users` RLS); fix multi-workspace `.single()` crash + add role enforcement; replace 4 limit modules with **1** `lib/entitlements/` engine; repair Referral attribution (`MadeWithUnoolCTA` true code, `/r/[code]`, OAuth new-user check, atomic SQL) and make AI credits spendable + give Spark referrers a real 30-day Creator grant; enforce `Creator+` (`dm_concierge`) on In-DM Follow Gate.
- **MERGE:** Merge **Unlock Gates** into **Automation -> Instagram -> Follow-to-Unlock** (`require_follow_for_dm`); merge 4 fragmented **onboarding quests/popups** into **1** Overview Setup Strip; merge **`/analytics/linkedin`** (and `/dashboard/publish` retry drawer) into **Signal / Studio**.
- **MOVE:** Move **Brand Materials** from Automation into **Profile -> Resource Drops** (leaving a picker in Automation); move **Referrals** out of the primary `Grow` sidebar into **Account (`Invite & Earn`)**.
- **REMOVE:** Broken standalone **`/dashboard/unlock-gates`**, **`/dashboard/follow-gates`**, and **`/gate/[gateId]`** (with safe export/migration & redirect); phantom pricing claims (`Custom domain`, `Approvals`, external `API access`) until built; orphaned **`OnboardingChecklist`**; 30s **`SubdomainClaimPopup`**; **`lib/limits/*`** & fail-open **`lib/middleware/plan-enforcement.ts`**; legacy **`POST /api/flightplan/generate`** & **`POST /api/auth/callback`**; hardcoded **`'usha'`** strings; fabricated **`signupCount * 3`** counts.
- **BUILD NEXT (Sequenced Waves):** **Wave 1 (`P0`)** Auth/IDOR/RLS/Multi-workspace fixes -> **Wave 2 (`P1`)** Unified `lib/entitlements/`, Real Referrals, Working In-DM Follow Gate + sunset `/gate/[id]`, Branch Merge (`Signal`/`Settings`/`Profile`) -> **Wave 3 (`P2`)** IA consolidation (Brand Materials -> Profile, LinkedIn -> Signal, 6-item sidebar, Workspace Switcher) -> **Wave 4 (`P3`)** Real Custom Domains (`Pro+`) and Approvals + `/api/v1/*` API (`Studio`).

### 23.3 Why Competing Architectures Were Rejected
- **Rejected Option A (Unified Engine + Keeping Standalone `/dashboard/unlock-gates`):** Keeps a fundamentally broken web follow-gate (`/gate/[id]`) that Meta's Instagram API cannot fulfill without consumer OAuth friction, splitting creator focus across two Follow-Gate surfaces.
- **Rejected Option B (Module-Owned Gate Logic):** Institutionalizes the exact split-brain bugs proven today (`Overview` showing Spark `15` vs `Composer` Pro limits; `middleware/plan-enforcement.ts` failing open on 23 actions; `linkedin_comment_logs` missing table).

---

## 24. Remaining Risks and Unverified Areas

1. **Untested Branch Merge Conflict Surface (`P1 Risk`):** Merging `signal_investigation_deep_dive` (`2e56d4e`) onto `main` (`b03bbf5`) without regressing post-`5746d08` multi-account publishing (`4640854`) and 5-platform engagement sync (`597d092`) requires careful reconciliation + full typecheck/Vitest pass in a dependency-installed environment.
2. **Untested TypeScript & Automated Suite (`BLOCKED`):** Zero `tsc` or `vitest` execution occurred in this worktree (`E403` offline npm); unseen compile errors or regression test failures may exist across recent commits.
3. **Production Supabase Drift (`UNVERIFIED`):** Live DB policies (`admin_users`, `follow_gates`, `referrals`), seeded `plans.features` JSONB rows vs `PLANS_FALLBACK`, and active `follow_gates` row count were not inspectable read-only from this environment.
4. **FB / Threads / LinkedIn Automation Webhooks & JSONB Scale (`INSPECTED — PARTIAL`):** Detailed replay/loop resistance and scaling of `workspaces.settings.linkedin_comment_logs` require dedicated follow-up verification.
5. **Superadmin Surface (`17` Pages) Security (`INSPECTED — PARTIAL`):** `/api/admin/impersonate`, `/api/admin/recovery`, `/api/admin/content`, and `/api/admin/payments` remain outside the deep trace scope and are logged in [`UNOOL_REMAINING_FEATURES_AND_AUDIT_TRACKER.md`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/UNOOL_REMAINING_FEATURES_AND_AUDIT_TRACKER.md) as the #2 focused next audit.
6. **Zero Customer PMF Evidence (`UNVERIFIED`):** Architecture recommendations optimize product clarity and fix broken technical loops; commercial PMF hypotheses (`H1–H3`) remain unvalidated until measured against live user cohorts.

---

*End of Forensic Audit Report (`UNOOL_UNLOCK_GATES_REFERRAL_AND_PRODUCT_ARCHITECTURE_FORENSIC_AUDIT.md`). Companion Master Tracker: [`UNOOL_REMAINING_FEATURES_AND_AUDIT_TRACKER.md`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/audit_unlock_gates_referral/UNOOL_REMAINING_FEATURES_AND_AUDIT_TRACKER.md).*
