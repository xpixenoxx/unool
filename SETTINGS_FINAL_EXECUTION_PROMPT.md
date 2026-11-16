# UNool Studio — Final Settings Execution Prompt

> **Purpose:** Self-contained, execution-ready implementation specification for restructuring and hardening UNool Studio Settings (`CHG-01` through `CHG-28` across `Stage 0`–`Stage 9`).  
> **Execution Status:** Stages 0–8 are implemented in workspace code, unit/API/component tests, Playwright E2E spec, and idempotent migrations (`20261116000001_settings_security_rls_and_tables.sql`, `20261116000002_settings_lifecycle_rpcs.sql`) using the provisional `UD-01`–`UD-08` defaults (`ai-voice` banner for `templates`/`template-analytics` linking to `/dashboard/profile`, 3-font Google Fonts `<link>` in `app/layout.tsx`, `user_preferences` with `digest_frequency` + `notify_publishing`, `security_version DEFAULT 0`, native `@playwright/test` checks without `@axe-core/playwright`). **Stage 9** (live Supabase migration apply on `bhkpkylcwcxtpxbxrpag`, Supabase TOTP MFA verification, authenticated E2E run, legal review of Privacy/`terms`, and production deploy) remains gated pending explicit human approval.

---

```markdown
# EXECUTION BRIEF — UNOOL STUDIO SETTINGS RESTRUCTURING (STAGE 0 → STAGE 9)

You are acting as a Principal Full-Stack, Security, Database, and UI/UX Engineer executing the approved restructuring of UNool Studio Settings.

Read and respect these six governing documents in the repository root before writing any code or SQL:
1. `SETTINGS_FINAL_FORENSIC_AUDIT.md` — forensic truth of routes, APIs, DB schema, RLS, UX, and failure modes.
2. `SETTINGS_FINAL_PRODUCT_ARCHITECTURE.md` — target 2-group / 6-section IA, Warm Biscuit WCAG AA visual system, compatibility rules, collaboration & data ownership boundaries.
3. `SETTINGS_FINAL_IMPLEMENTATION_ROADMAP.md` — authoritative change register (`CHG-01`–`CHG-28`) and gated `Stage 0`–`Stage 9` execution order.
4. `SETTINGS_REGRESSION_AND_ACCEPTANCE_MATRIX.md` — mandatory dependency preservation matrix, compatibility rules, and test acceptance scenarios (`FN-*`, `API-*`, `DB-*`, `INT-*`, `E2E-*`, `VIS-*`, `A11Y-*`, `SEC-*`, `REL-*`, `CMP-*`).
5. `SETTINGS_UNRESOLVED_DECISIONS.md` — human decisions for `UD-01` through `UD-08`.

---

## 0. PRE-EXECUTION GATES & MANDATORY DECISIONS

Before modifying any file or database object:
1. Confirm human sign-off values for **`UD-01` through `UD-08`**:
   - `UD-01`: Default tab on bare `/dashboard/settings` (`account` provisional default).
   - `UD-02`: Timing & client-telemetry audit for live Postgres RLS hardening (`CHG-04`).
   - `UD-03`: Account deletion policy for multi-member owned workspaces + missing `deleted_accounts` table disposition (`CHG-03`, `CHG-25`).
   - `UD-04`: Workspace vs user subscription ownership, cancel RBAC (`owner` vs `owner`/`admin`), and Cashfree renewal copy (`CHG-09`, `CHG-19`).
   - `UD-05`: `password_hash` migration target (`public.user_credentials` vs native GoTrue passwords) & reset session revocation rules (`CHG-05`, `CHG-07`, `CHG-23`).
   - `UD-06`: `user_preferences` vs `workspaces.settings` timezone boundary & default email toggle booleans (`CHG-22`).
   - `UD-07`: `IntegrationsTab` / `/api/keys/*` / unapplied `20250123000001_create_api_keys_table.sql` disposition (`admin_feature_flags.public_api_enabled = false` vs removal).
   - `UD-08`: Approved legal copy in `app/privacy/page.tsx` & `app/terms/page.tsx` (`CHG-13`) and confirmation that Supabase Auth TOTP MFA is enabled on project `bhkpkylcwcxtpxbxrpag` before Stage 6 (`CHG-24`).
2. Confirm clean toolchain baseline in the workspace (`npm ci` / `node_modules` present so `npm run typecheck`, ESLint, Vitest, Playwright, and `next build` run locally).
3. Never hardcode secrets, service role keys, customer PII, or production credentials in source, tests, or logs.

---

## 1. TARGET PRODUCT & INFORMATION ARCHITECTURE

Replace the legacy Settings structure with **Option C (2-Group / 6-Section IA)** at `/dashboard/settings?tab=<section>`:

### Group 1 — Personal (`Your Account`)
1. `account` *(Default on bare `/dashboard/settings` per `UD-01`)*
   - Identity (`full_name` synced cleanly with `public.users` and auth metadata, email read-only/status).
   - Personal timezone & display format preferences (`user_preferences`).
   - Sign out action (unified through `/api/auth/signout`, clearing impersonation & local saved-account state safely).
   - Personal JSON Data Export (`GET /api/user/export`).
   - **Personal Account Deletion** hazard card (strictly scoped to personal user lifecycle; enforces multi-member owned workspace guard per `UD-03`).
2. `security`
   - Change Password (`POST /api/auth/change-password`) using dual-read credential storage (`CHG-07`) and optional other-device session revocation (`CHG-05`).
   - Real TOTP Two-Factor Authentication powered by Supabase Auth MFA (`supabase.auth.mfa.*`, `CHG-24`).
   - Active Sessions viewer & revoke actions (`auth.sessions`, `CHG-23`).
   - Saved Accounts / Quick-Switch hygiene (`unool_saved_accounts_v1` synced with `security_version`, `CHG-05`).
   - Security Activity Log (`security_events`, `CHG-27`).
3. `notifications`
   - Postgres-backed `user_preferences` email controls (`CHG-22`):
     - `notify_token_expiry`
     - `notify_publish_failure`
     - `notify_security_alerts`
     - `notify_product_updates`
   - AI Personalization toggle (`ai_personalization_enabled`) with transparent AI Voice data-usage disclosure.

### Group 2 — Workspace (`Workspace: <Active Name>`)
4. `channels`
   - Connected social platforms (19+ platforms) and multi-account health (`platform_connections`).
   - Distinction between non-destructive **Reconnect** (refreshing OAuth tokens cleanly) and destructive **Disconnect** (explicit impact warning for active automations, scheduled posts, and composer drafts).
   - Multi-account management & Kick RTMP stream settings modal strictly bound to `connectionId` and verified workspace RBAC (`CHG-06`).
   - Platform connection request submission backed by authenticated API (`CHG-08`).
5. `ai-voice`
   - 7-field studio voice signature & Calibrator modal.
   - Reliable persistence to `studio_profiles` with fallback read/write alignment to `workspaces.settings.studio_profile` (`CHG-18`) — zero silent local/form state drops.
6. `workspace`
   - Active workspace rename & details (`Owner` / `Admin` RBAC enforced).
   - Team Members list & **pending seat accounting** (`workspace_members` + pending invites, `CHG-25`).
   - Plan & Usage Summary Card linking to canonical `/dashboard/billing` (`CHG-19`), displaying truthful Cashfree validity/renewal status (`UD-04`).
   - Ownership Transfer (`transfer_workspace_ownership` RPC, `CHG-25`) & **Leave / Delete Workspace** hazard separated from personal account deletion.

### Relocated, Consolidated, or Gated Legacy Modules
- **`TemplatesTab` & `TemplateAnalyticsTab`**: Remove from Settings IA; canonical home is `/dashboard/profile` (`?tab=design` / `?tab=domain`).
- **`IntegrationsTab`**: Gate behind `admin_feature_flags.public_api_enabled = false` per `UD-07`; remove misleading `localStorage`-only webhooks from active UX; defer `/api/v1/*` + QStash webhooks to Post-Release Milestone (`CHG-28`).
- **Orphan Billing Duplicate**: Remove `app/dashboard/settings/billing/BillingClient.tsx`; **retain** `app/dashboard/settings/billing/page.tsx` as server redirect to `/dashboard/billing` (`CHG-19`).
- **4-Item Non-Gamified Readiness Strip**: Display calm, actionable setup checks inside Settings linking directly to `channels`, `ai-voice`, `security`, and `notifications` (no XP/points/gamification).

### Mandatory Legacy Deep-Link Compatibility Map (`CMP-01`)
Preserve all existing bookmarks and cross-app links on `/dashboard/settings?tab=*`:
- `?tab=platforms` -> `channels`
- `?tab=studio` or `?tab=persona` -> `ai-voice`
- `?tab=billing` -> `workspace#plan-usage`
- `?tab=templates` -> redirect to `/dashboard/profile?tab=design`
- `?tab=template-analytics` -> redirect to `/dashboard/profile?tab=domain`
- `?tab=danger` -> `account#delete-account`
- `?tab=integrations` -> `channels` / `integrations` ONLY if `public_api_enabled = true`; otherwise normalize to `account` and show an informative toast explaining Public API integrations are disabled.

---

## 2. VISUAL, TYPOGRAPHY & ACCESSIBILITY SYSTEM (`WCAG 2.2 AA`)

- **Typography (`CHG-14`)**: Consolidate font loading to **3 fonts** via `next/font/google` in `app/layout.tsx` matching Warm Biscuit brand identity without bloat or unstyled fallbacks.
- **Warm Biscuit WCAG AA Token Repair (`CHG-14`, `A11Y-01`, `VIS-01`)**:
  - Eliminate unreadable `#FFFFFF` text on Warm Brass `#C4A265` (`~2.41:1` contrast fail in `StudioTab.tsx`) and low-contrast `#8B7355` body text on `#FAF7F2` (`~4.21:1` fail).
  - Primary CTA surfaces & high-emphasis badges: **`#3D2B1F` background with `#FFFFFF` text (`13.1:1`)**.
  - Secondary/muted prose on `#FAF7F2`: **`#6E5A48` (`6.12:1`)**.
  - Interactive touch targets across Settings forms, tabs, switches, modals, and channel cards: **`>= 44x44px` on mobile/touch viewports** with zero horizontal overflow (`390px`, `768px`, `1440px`).
  - Forms & UX (`CHG-16`, `CHG-26`): Unsaved/dirty-state guard on tab switch & navigation, inline field validation, loading skeletons, SSR initial hydration without client auth flicker, full keyboard navigation + `<nav aria-label="Settings">` landmarks (`aria-current="page"`, avoiding unmounted `aria-controls` IDs) & `aria-live` save announcements.

---

## 3. MANDATORY SECURITY & DATABASE INVARIANTS (NON-NEGOTIABLE)

Never relax or bypass any of these invariants across Stages 1–8:

1. **Header Trust Boundary (`CHG-01`)**: Strip client-supplied `x-user-id`, `x-workspace-id`, and `x-plan-tier` in `middleware.ts` **before** evaluating `publicPaths` or forwarding requests; remove header-identity fallbacks on `/api/auth/*`.
2. **Multi-Workspace Context Integrity (`CHG-02`)**: Replace `.single()` queries on `workspace_members` (`lib/auth/context.ts`, `middleware.ts`) with deterministic ordered `.limit(1)` selection and validate any `active_workspace_id` cookie with `verifyWorkspaceAccess()`. Only provision a default `'spark'` workspace when verified membership count is `0`.
3. **Destructive Lifecycle Correctness (`CHG-03`)**: Fix `referrals.referrer_id` -> `referrals.referrer_user_id` inside live RPC `delete_workspace_data` and `app/api/user/delete/route.ts`. Execute `public.users` & workspace dependency cleanup **before** `auth.admin.deleteUser()`. Guard or remove references to tables absent in live Postgres (`api_keys`, `media_uploads`, `deleted_accounts`).
4. **Live Postgres RLS Tightening (`CHG-04`)**: Drop permissive tautologies on `admin_users` and `admin_audit_log`; remove `{public}` insert policy on `analytics_events` (after verifying no browser code writes directly via anon client); enforce strict workspace-membership scoping on `workspace_members`, `platform_connections`, and `subscriptions`.
5. **Account Switch & Sign-Out Security (`CHG-05`)**: Add `public.users.security_version INT DEFAULT 1`; bind HMAC `switchToken` (`lib/auth/account-switch-token.ts`) to `sv`; bump `security_version` on password change/reset and security revocations; clear `unool_saved_accounts_v1` and impersonation cookies on unified `/api/auth/signout`.
6. **Channel & Kick IDOR Elimination (`CHG-06`)**: Remove cross-workspace fallback (Strategy 3) and `debug[]` payload leaks in `app/api/platform/connections/route.ts`. Validate `workspaceId` & `connectionId` ownership and replace `.single()` in `app/api/platform/kick/stream-settings/route.ts`.
7. **Credential Storage Migration (`CHG-07`)**: Move `password_hash` out of client-readable `auth.users.raw_user_meta_data` using a zero-downtime **dual-read transition** per approved `UD-05`.
8. **Endpoint Auth & RBAC Matrix (`CHG-08`, `CHG-09`)**:
   - Require valid session auth on `/api/analytics/time-spent` and `/api/platform/request`.
   - Enforce `requireWorkspaceRole` on `/api/billing/cancel`, `/api/workspace`, `/api/subdomains/claim`, `/api/profile/domain`, and `/api/platform/connections/[platform]`.
9. **Impersonation Guard (`CHG-10`)**: Detect `isImpersonated` cleanly and return `403 IMPERSONATION_RESTRICTED` on destructive actions, password/2FA/credential changes, session revocation, and billing mutations; show a clear read-only / restricted banner in Settings UI.
10. **Identity & Plan Defaults (`CHG-11`)**: Keep `public.users.full_name` and Supabase auth metadata synchronized; align `handle_new_user()` trigger and DB defaults from legacy `'free'` to `'spark'`.
11. **CORS & Rate Limiting (`CHG-12`)**: Replace wildcard `Access-Control-Allow-Origin: *` in `vercel.json` and enforce server rate limiting on Settings/Auth mutation routes (`change-password`, `delete`, `connections`, `workspace`, `export`, `switch-account`).

---

## 4. STAGE-BY-STAGE IMPLEMENTATION ORDER

Execute strictly in sequence matching `SETTINGS_FINAL_IMPLEMENTATION_ROADMAP.md`. Every stage must pass its tests and type/build checks before starting the next:

- **Stage 0 — Pre-Implementation Baseline & Decision Sign-Off**: Obtain written sign-off on `UD-01`–`UD-08`, verify `node_modules` installed cleanly (`npm ci`), and record baseline `typecheck`, `lint`, `vitest run`, `e2e`, and staging env/MFA status.
- **Stage 1 — Critical Security & Data-Integrity Corrections (`P0`: `CHG-01`–`CHG-04`)**: Strip incoming identity headers in `middleware.ts` prior to `publicPaths` (`CHG-01`), fix `.single()` multi-workspace multiplication (`CHG-02`), repair `delete_workspace_data` RPC & `/api/user/delete` `referrer_user_id` + `public.users` purge + missing table guards (`CHG-03`), and harden live Postgres RLS policies (`CHG-04`).
- **Stage 2 — Existing Functionality Stabilization (`P1`/`P2`: `CHG-05`–`CHG-12`)**: Ship `security_version` + `switchToken` `sv` + sign-out cleanup (`CHG-05`), remove `connections` Strategy 3 cross-workspace bleed & `debug[]` + fix Kick RTMP IDOR (`CHG-06`), migrate `password_hash` out of client-visible `user_metadata` via dual-read (`CHG-07`), close `time-spent` & `platform/request` spoofing (`CHG-08`), enforce `requireWorkspaceRole` across billing/workspace/domain/channel endpoints (`CHG-09`), add `isImpersonated` guardrails (`CHG-10`), sync `full_name` & `'spark'` plan defaults (`CHG-11`), and replace wildcard CORS + add rate limits (`CHG-12`).
- **Stage 3 — Final Information Architecture & Design System (`P1`: `CHG-14` + Shell Primitives)**: Consolidate fonts onto `next/font/google` (`Geist`, `Geist Mono`, 2-weight `Cormorant Garamond`), fix `globals.css` / Warm Biscuit WCAG AA tokens (`#3D2B1F`/`#FFFFFF` 13.1:1 CTA, `#6E5A48` 6.12:1 muted ink), and build reusable Settings shell & form/dialog primitives.
- **Stage 4 — Core Settings Restructuring (`P1`: `CHG-13`, `CHG-15`–`CHG-19`)**: Switch Settings UI to the 2-group **6-section IA** (`account`, `security`, `notifications`, `channels`, `ai-voice`, `workspace`), fix repo deep links (`CHG-13`) and deploy the legacy `?tab=` compatibility map (`CMP-01`), delete orphan `app/dashboard/settings/billing/BillingClient.tsx` (preserving `billing/page.tsx` redirect), gate `IntegrationsTab` behind `public_api_enabled = false`, separate Personal vs Workspace hazard controls, and implement Channels impact/Kick targeting (`CHG-17`), AI Voice fallback (`CHG-18`), Workspace/Team/Plan card (`CHG-19`), dirty-state protection, and `>=44px` mobile polish (`CHG-16`).
- **Stage 5 — Missing Core Functionality (`P1`: `CHG-20`–`CHG-23`)**: Ship the 4-item truth-backed Readiness Strip (`CHG-20`), `GET /api/user/export` (`CHG-21`), Postgres `user_preferences` + `/api/user/preferences` wired to Notifications/Timezone/AI opt-in (`CHG-22`), and real `auth.sessions` management + `POST /api/auth/change-password` (`CHG-23`).
- **Stage 6 — Advanced Governance Capabilities (`P2`: `CHG-24`, `CHG-25`, `CHG-27`)**: Implement live Supabase TOTP 2FA (`CHG-24`, after `UD-08` MFA confirmation), atomic `transfer_workspace_ownership` RPC + pending invite seat accounting + multi-member deletion guardrails (`CHG-25`), and append-only `security_events` activity log (`CHG-27`).
- **Stage 7 — Performance & Accessibility Optimization (`P2`: `CHG-26`)**: Move critical first-fold loads into `app/dashboard/settings/page.tsx` SSR `Promise.all`, code-split heavy secondary modals (`ai-voice` Calibrator, `security` 2FA QR), replace unmounted `aria-controls` tabs with clean nav landmarks, and pass automated `axe-core` WCAG 2.2 AA scans.
- **Stage 8 — Cross-Product Integration & Cleanup (`P2`)**: Verify synchronization across Composer (`StudioProfile` sync + opt-in), FlightPlan (`timezone`), Profile Builder (`?tab=design`/`domain`), approved legal copy in `app/privacy/page.tsx` & `app/terms/page.tsx` (`UD-08`), and final removal of obsolete mocks/`'usha'` placeholders.
- **Stage 9 — Final Regression & Release Verification**: Execute the full verification matrix (`SETTINGS_REGRESSION_AND_ACCEPTANCE_MATRIX.md`) against clean CI/staging (Upstash, Cashfree sandbox, Supabase), staged rollout, and 24h log/Sentry monitoring.
- **Post-Release / Separate Milestone (`P3`: `CHG-28`)**: Deferred `/api/v1/*` + QStash SSRF-safe HMAC outbound webhooks (`public_api_enabled = true`), GSTIN company invoicing fields in billing, and multi-locale `next-intl` string extraction.

---

## 5. DATABASE & MIGRATION SAFEGUARDS

1. Always verify live Postgres tables and columns before writing SQL (`api_keys`, `media_uploads`, `deleted_accounts`, `notification_preferences` do **not** exist in live `public` schema).
2. All SQL migrations must be additive or idempotently guarded (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `IF EXISTS`), include explicit `RLS ENABLE`, and never grant `anon` or `authenticated` broad write access to audit/credential tables.
3. Never leave breaking window between migration apply and API deploy (use dual-read transitions for `password_hash` and `user_preferences` defaults).
4. Include explicit rollback instructions in each migration PR.

---

## 6. MANDATORY VERIFICATION GATE & ACCEPTANCE CRITERIA

A stage or final release is **NOT COMPLETE** until every applicable check runs and passes after the final edit:

1. **Static & Build Checks:**
   - `npm run typecheck` (`tsc --noEmit`) — zero errors
   - `npm run lint` — zero errors
   - `npm run build` — clean production Next.js build
2. **Automated Test Matrix (`SETTINGS_REGRESSION_AND_ACCEPTANCE_MATRIX.md`):**
   - Functional (`FN-01..03`), API (`API-01..03`), Database/RPC (`DB-01..03`), Integration (`INT-01..02`), E2E (`E2E-01..02`), Visual/Responsive (`VIS-01` at `390px`, `768px`, `1440px`), Accessibility (`A11Y-01` WCAG 2.2 AA contrast `>=4.5:1`, keyboard nav, `>=44px` touch targets), Security (`SEC-01..02` header spoofing rejected, IDOR blocked, RLS verified, impersonation `403`, stale `sv` rejected), Reliability (`REL-01`), Backward Compatibility (`CMP-01` all legacy `?tab=` & `/settings/billing` URLs).
3. **Zero Silent Failures:** No broken imports, no dead controls masquerading as saved settings, no console errors, no plaintext secrets/tokens leaked in API payloads.
```
