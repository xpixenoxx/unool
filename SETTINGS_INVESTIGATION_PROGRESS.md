> [!WARNING]
> **SUPERSEDED HISTORICAL LOG (v1):** Initial Phase 1–5 read-only investigation log. Live execution status, additional Stage 0 findings, and post-edit verification results are tracked in `SETTINGS_FINAL_IMPLEMENTATION_ROADMAP.md` and `SETTINGS_REGRESSION_AND_ACCEPTANCE_MATRIX.md`.

# UNool Studio — Settings Investigation Progress Log

> **Workspace:** `C:\Users\HP\.gemini\antigravity\worktrees\UNOOLNEW\studio_prompt_audit_low_power`  
> **Branch / Head Audited:** Commit `2ea0a39` (Static Codebase + Read-Only Live Production Supabase Schema Audit on `bhkpkylcwcxtpxbxrpag`)  
> **Scope Constraint Honored:** Investigation and documentation only. Zero edits to application source code, database schemas, configs, dependencies, or production data.

---

## 1. Chronological Audit Log

### Phase 1 — Product Discovery & Settings Surface Mapping
- Inspected repository root configuration (`package.json`, `vitest.config.ts`, `playwright.config.ts`, legacy `BUG_REGISTER.md`, `FEATURE_INVENTORY.md`) and full dashboard navigation topology (`app/dashboard/layout.tsx`, `git ls-files app/dashboard e2e "*.test.*" "*.spec.*"`).
- Delegated structured deep-dive research to three dedicated read-only subagents:
  - `Unool Product and Context Researcher` (`e4803bec-e36b-439c-b4e1-dc5a6172409f`): Mapped complete product architecture, AI pipeline, Cashfree billing structure, legal disclosures, root doc drift, and decentralized settings across all non-Settings modules.
  - `Settings UI and Tabs Auditor` (`f2c59181-41ef-4f93-b68b-7a4a3b9ff6d0`): Audited `SettingsClient.tsx`, all 8 tabs under `components/dashboard/settings/tabs/*`, `/dashboard/billing/BillingClient.tsx`, orphaned `app/dashboard/settings/billing/BillingClient.tsx`, `/admin/settings`, `PlatformConnections.tsx`, `PresenceClient.tsx`, `StudioOnboardingModal.tsx`, and inbound URL matrices.
  - `Settings Backend and Security Tracer` (`37bb0a2e-20b6-439c-b4e1-dc5a6172409f`): Audited request auth (`middleware.ts`, `lib/auth/*`), workspace/key/billing/delete/onboarding/platform-connect API handlers, plan enforcement layers, Meta compliance webhooks, and the full 46-file test suite.

### Phase 2 — Direct Source Verification Across Frontend, Links & Legal Surfaces
- Directly read and verified line-by-line:
  - Settings shell & tabs: `app/dashboard/settings/page.tsx`, `app/dashboard/settings/SettingsClient.tsx`, `components/dashboard/settings/tabs/WorkspaceTab.tsx`, `StudioTab.tsx`, `IntegrationsTab.tsx`, `TemplatesTab.tsx`, `TemplateAnalyticsTab.tsx`, `NotificationsTab.tsx`, `SecurityTab.tsx`, `DangerZoneTab.tsx`, `shared.tsx`.
  - Dashboard shell & broken cross-app links (`git grep`): `app/dashboard/layout.tsx`, `app/dashboard/composer/ComposerClient.tsx`, `components/dashboard/StudioIdeaGenerator.tsx`, `components/analytics/AnalyticsDNA.tsx`, `app/dashboard/automation/BrandMaterialsSection.tsx`, `components/flightplan/StoryIntake.tsx`, `components/follow-gate/FollowGateManager.tsx`, `app/dashboard/presence/page.tsx`, `app/dashboard/presence/PresenceClient.tsx`, `components/dashboard/PlatformConnections.tsx`, `app/dashboard/studio/page.tsx`. Checked `Test-Path app\dashboard\channels` -> confirmed `False` (404).
  - Billing, pricing, templates, admin & legal compliance: `app/dashboard/billing/page.tsx`, `app/dashboard/billing/BillingClient.tsx`, `app/dashboard/settings/billing/page.tsx`, `app/dashboard/settings/billing/BillingClient.tsx`, `app/pricing/PricingPageClient.tsx`, `lib/billing/plans.ts`, `components/profile/templates/registry.ts`, `app/admin/settings/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`.

### Phase 3 — Backend API, Security & Auth Trace Verification
- Verified backend routes, libraries, and migrations directly:
  - Workspace, keys & onboarding: `app/api/workspace/route.ts`, `app/api/keys/route.ts`, `app/api/keys/[id]/route.ts`, `lib/auth/api-key.ts`, `lib/repositories/interfaces/IApiKeyRepository.ts`, `lib/repositories/supabase/SupabaseApiKeyRepository.ts`, `lib/repositories/supabase/SupabaseWorkspaceRepository.ts`, `app/api/onboarding/route.ts`.
  - Auth, security & deletion: `middleware.ts`, `lib/auth/server.ts`, `lib/auth/context.ts`, `lib/auth/workspaceAccess.ts`, `lib/auth/email.ts`, `lib/auth/password.ts`, `lib/auth/account-switch-token.ts`, `app/api/auth/signin/route.ts`, `signin/verify-otp/route.ts`, `switch-account/route.ts`, `reset-password/verify-and-update/route.ts`, `signout/route.ts`, `logout/route.ts`, `app/api/user/delete/route.ts`, `app/api/user/context/route.ts`.
  - Platform connections, Studio AI & billing APIs: `app/api/platform/connections/route.ts`, `app/api/platform/connections/[platform]/route.ts`, `app/api/platform/request/route.ts`, `app/api/auth/platform/connect/route.ts`, `app/api/auth/platform/callback/route.ts`, `lib/platforms/connectionStatus.ts`, `app/api/studio/profile/route.ts`, `app/api/profile/studio/route.ts`, `app/api/profile/onboarding/route.ts`, `lib/config/studioOnboarding.ts`, `lib/ai/studioContext.ts`, `app/api/composer/adapt/route.ts`, `app/api/flightplan/generate/route.ts`, `app/api/studio/ideas/route.ts`, `app/api/billing/{current,cancel,plans,overrides}/route.ts`, `lib/middleware/plan-enforcement.ts`, `lib/middleware/plan-enforcement-middleware.ts`, `lib/limits/enforcer.ts`, `app/api/profile/{route,domain,analytics}/route.ts`, `app/api/webhooks/meta/data-deletion/route.ts`, `lib/config/schema.ts`.
  - Migrations checked: `supabase/migrations/20250123000001_create_api_keys_table.sql`, `20261030000002_create_deleted_accounts_table.sql`, `20261031_plan_pricing_overrides.sql`, `20261110000002_security_rls_and_schema_fixes.sql`, `20261111000001_complete_account_deletion_and_audit_fixes.sql`, `20261113000001_automation_audit2_fixes.sql`, `20261115000001_profile_blueprint_schema.sql`.

### Phase 4 — Read-Only Live Production Database Schema Check & External SaaS Benchmarking
- Executed read-only SQL metadata queries via `supabase_mcp` (`execute_sql`) against project `bhkpkylcwcxtpxbxrpag`:
  - Enumerated all **36** live `public` tables.
  - Confirmed `api_keys`, `deleted_accounts`, `notification_preferences`, `webhook_endpoints`, `brand_voices`, and `media_uploads` do **not** exist in live `public` schema.
  - Inspected columns of `workspaces` (confirmed `settings jsonb` exists, NO `features` column), `workspace_members` (`email`, `invited_at`, `invited_by`, `status`, `joined_at`), `users`, `profiles`, `platform_connections`, `subscriptions`, foreign-key constraints (`pg_constraint`), and live `public.delete_workspace_data` RPC definition (`pg_proc`).
- Executed `search_web` benchmark lookups covering current Settings IA across **Vercel**, **Linear**, **Notion**, **Buffer**, and **Beacons / Linktree**.

### Phase 5 — Test & Runtime Inspection + Deliverable Authoring
- Inspected test configuration (`vitest.config.ts`, `playwright.config.ts`), Playwright helpers/specs (`e2e/fixtures.ts`, `e2e/public-profile.spec.ts`), and Settings/Billing/Auth/Studio unit tests via subagent trace + `git ls-files`.
- Authored all three required Markdown deliverables in workspace root without modifying any application source or DB schema.

---

## 2. Environment & Runtime Constraints Encountered

1. **`node_modules` Unpopulated in Worktree:** Checking local workspace showed `node_modules` contains only 1 directory (`.vite`/`.bin` stubs); TypeScript (`tsc --noEmit`), Vitest, ESLint, and Playwright binaries are absent.
2. **Offline Sandbox Network Constraint:** Outbound package registry access fails (`403 Forbidden`), preventing `npm ci` inside the sandbox. Consequently, **zero builds, type-checks, lint checks, unit tests, or Playwright browser specs were executed in runtime**.
3. **Windows CLI Search Tooling:** `rg` binary is unavailable in PowerShell; repository-wide static searches were performed accurately using `git grep` and `git ls-files`.

---

## 3. Verification Register (Confirmed vs. Unverified)

### Confirmed via Code Inspection & Read-Only Live SQL
- Settings `SettingsClient.tsx` (`?tab=` ignored, `onFocus` activation, error swallowing in `handleSaveWorkspace`, missing `clearAllClientCaches` on sign-out, incomplete OAuth query parsing, dead `mfaEnabled` state, broken `analytics.templateChange` call).
- Tabs: `WorkspaceTab` dual-toast bug / stale `workspaces.plan` (`'premium'` check) / narrow inputs; `NotificationsTab` `localStorage`-only persistence (`unool_notification_prefs`); `IntegrationsTab` `localStorage`-only webhooks (`unool_webhook_endpoints`) + `expiresAt`/`webhooks:manage` API mismatches; `SecurityTab` direct `user_metadata` write + accessibility defects + static `v1.1` session stub; `DangerZoneTab` literal `&apos;`; redundant `TemplatesTab` & `TemplateAnalyticsTab`; orphaned `app/dashboard/settings/billing/BillingClient.tsx`.
- Live Supabase schema (`bhkpkylcwcxtpxbxrpag`, 36 tables): verified absence of `api_keys`, `deleted_accounts`, `workspaces.features`, `notification_preferences`, `webhook_endpoints`.
- Security & Backend flaws: `DELETE /api/user/delete` non-owner shared-workspace wipe + R2 bucket/prefix gaps + `referrals.referrer_id` typo + omitted Cashfree cancel & tax-record mismatch; 15 custom `/api/auth/platform/*/connect` IDOR/public-path + SSRF risks; `/api/onboarding` IDOR; `getCurrentAuth` `500` throw on unauth; `validateApiKey` `0` callers; `switch-account` MFA bypass; `reset-password` session persistence; `PUT /api/studio/profile` `500` on `VERSION_CONFLICT`; `/admin/settings` hardcoded green health badges; Meta `data-deletion` `GET` stub & missing FB/Threads cleanup.
- Cross-app link/copy drift: broken `/dashboard/settings?tab=persona`, `?tab=billing`, `/dashboard/channels` (`email.ts:157`), `/privacy` § 7/8/10 discrepancies, `/terms` GST invoice mismatch, `PricingPageClient` vs `plans.ts` vs `registry.ts` drift (`24` vs `16`, `6` vs `5`, Creator `$9` vs `$10`), hardcoded `'usha'`/`'usha@unool.co'` fallbacks, swapped `Studio`/`Signal` sidebar descriptions, `'Presence'` tooltip.

### Unverified / Deferred to Implementation Phase CI Run
- Runtime execution of `tsc --noEmit`, `eslint`, `vitest run`, and Playwright `e2e/` browser specs (blocked by empty `node_modules` and offline sandbox).
- Visual screenshot inspection and contrast/axe DOM measurements of `/dashboard/settings` at `390px` and `1440px` in a live running browser.
- Production row counts (`COUNT(*)` on live `workspace_members`, `subscriptions`, `instagram_comment_logs` column verification), production Cashfree dashboard mandate mode, and Vercel/Resend/R2 live environment secret verification.

