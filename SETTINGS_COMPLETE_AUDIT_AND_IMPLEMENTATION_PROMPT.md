> [!WARNING]
> **SUPERSEDED HISTORICAL DOCUMENT (v1):** Superseded by `SETTINGS_FINAL_EXECUTION_PROMPT.md` and the 5 primary reconciled Settings documents (`SETTINGS_FINAL_*.md`, `SETTINGS_REGRESSION_AND_ACCEPTANCE_MATRIX.md`, `SETTINGS_UNRESOLVED_DECISIONS.md`). Retained only for historical traceability.

# UNool Studio — Settings Transformation: Complete Execution-Ready Implementation Prompt

> **Target Usage:** Hand this standalone prompt verbatim to a Principal Full-Stack Engineer / Coding Agent in the Unool Studio repository (`C:\Users\HP\.gemini\antigravity\worktrees\UNOOLNEW\studio_prompt_audit_low_power` or main branch) after installing dependencies (`npm ci`) and reviewing the Approval Gates below.  
> **Companion Reference:** [`SETTINGS_COMPLETE_PRODUCT_INVESTIGATION_AND_TRANSFORMATION_BLUEPRINT.md`](./SETTINGS_COMPLETE_PRODUCT_INVESTIGATION_AND_TRANSFORMATION_BLUEPRINT.md)

---

## ROLE & MISSION

Act as a Principal SaaS Architect, Senior Full-Stack Next.js / TypeScript Engineer, UI/UX Designer, and Security Engineer.

Your mission is to transform the **Settings** experience of **Unool Studio** (operated by Pixenox Solutions) from a fragmented, partially broken, `localStorage`-mocked 8-tab page into an enterprise-grade, accessible, visually cohesive, multi-tenant-safe control center across frontend UI, Next.js App Router API routes, authentication/RBAC helpers, Supabase PostgreSQL migrations, cross-app links, billing/usage parity, and automated test suites.

**You must maintain strict factual integrity:** run `tsc --noEmit`, `eslint`, Vitest, and Playwright E2E checks against real dependencies after your edits, never fake verification, never swallow errors silently, and NEVER apply live production DDL migrations or alter legal/billing semantics without passing the **Mandatory Human Approval Gates** in Section 3.

---

## 1. VERIFIED PRODUCT CONTEXT & BASELINE DEFECTS TO FIX

### 1.1 Unool Studio Architecture
- **Stack:** Next.js `15.5.18` (App Router), React `19`, TypeScript, Tailwind + Radix UI primitives, Supabase Auth/Postgres (`36` live `public` tables on `bhkpkylcwcxtpxbxrpag`), Argon2id passwords, Upstash Redis/QStash, Cloudflare R2 (`@aws-sdk/client-s3`), Cashfree PG payments (**no Stripe**), Resend transactional email, Vitest `2.1.0`, Playwright `1.61.1`.
- **Dashboard Visual Design System (`app/dashboard/layout.tsx`):** Warm editorial Biscuit Cream `#FAF7F2`, Porcelain `#FFFDF9`, Rail `#F5EFE2`, Warm Border `#E8DFD5`, Espresso Ink `#231C16`, Warm Slate `#7A6B60`, Terracotta `#C8613D`. Light-only shell.
- **Core Modules:** Overview (`/dashboard`), Studio & Composer (`/dashboard/studio`, `/dashboard/composer`), Signal (`/dashboard/signal`), Schedule (`/dashboard/schedule`), Automation (`/dashboard/automation`), Follow Gates (`/dashboard/follow-gates`), Profile Builder (`/dashboard/profile`, redirect from `/dashboard/presence`), Referrals (`/dashboard/referrals`), Billing (`/dashboard/billing`), Settings (`/dashboard/settings`), Admin (`/admin/*`).

### 1.2 Confirmed Bugs & Vulnerabilities (Exact Verified Locations)

#### P0 Critical Security, Multi-Tenancy & Data Integrity Bugs
1. **Shared Workspace Data Wipe in Self-Delete (`app/api/user/delete/route.ts:29-34, 118-171`, RPC `delete_workspace_data`):**
   - `ownedWorkspaceIds` unconditionally appends `auth.workspaceId` (`...(workspaceId ? [workspaceId] : [])`) even if caller is a non-owner member! Both the RPC and Step 4 fallback loop delete every `workspace_id IN ownedWorkspaceIds` row across posts, connections, profiles, etc., leaving another owner's workspace shell wiped empty!
   - Also: `getCurrentAuth(request)` (`L15`) runs **outside** `try/catch`, turning unauthenticated calls into `500` via `lib/auth/server.ts:75-100`.
   - Also: Step 2/2b (`L37-115`) uses ONLY `config.CF_R2_BUCKET_NAME` instead of `CF_R2_MEDIA_BUCKET_NAME` & `CF_R2_AVATARS_BUCKET_NAME`, skips `avatars/${userId}-*` (`app/api/profile/avatar/route.ts:117`), and scans `brand-materials/${wsId}/` whereas uploads go under `materials/`.
   - Also: JS fallback `L178` queries `{ table: 'referrals', column: 'referrer_id' }` instead of actual column `referrer_user_id`.
   - Also: Deletes `payment_orders` & `subscriptions` (`L150-151, 181-182`) against `/privacy` § 7's 7-year Indian tax-record retention rule, makes **0 Cashfree cancellation** or provider OAuth revocation calls, and misses `public.users`, FB/Threads tables in fallback loop, and has no server-side `"DELETE"` / re-auth check.
2. **15 Custom Platform Connect Routes Have Unauthenticated / Cross-Tenant IDOR + SSRF:**
   - All 15 routes `app/api/auth/platform/{bluesky,devto,hashnode,lemmy,listmonk,mastodon,medium,mewe,nostr,skool,slack,telegram,twitch,warpcast,whop}/connect/route.ts` sit under `/api/auth/*`, which `middleware.ts:5-17, 209` exempts as `publicPaths`.
   - None verify session requirement cleanly, none call `verifyWorkspaceAccess`, none check `planCtx.limits.channels`, and `lemmy/connect/route.ts:58-59` fetches caller-supplied HTTPS URLs without SSRF IP filtering.
3. **`/api/onboarding` IDOR (`app/api/onboarding/route.ts:62-65, 193-194, 234-235`):** Reads `x-user-id` & `workspaceId` directly from headers/query/body without calling `verifyWorkspaceAccess`.
4. **Live DB Drift & Broken Plan Enforcement Query (`lib/middleware/plan-enforcement-middleware.ts:51, 71`):**
   - Queries **nonexistent `workspaces.features`** column (`bhkpkylcwcxtpxbxrpag` `workspaces` has `settings jsonb`, NO `features`). Also conflicts with `lib/plan-enforcement.ts` (`replied` vs `auto_replied` on `instagram_comment_logs`, fail-open `catch -> 0` vs fail-closed) and dead `lib/limits/enforcer.ts` (`0` callers for `enforceLimit`/`trackApiCall`).
5. **Nonexistent `api_keys` Table + Tautological RLS + Unused Auth Helper (`supabase/migrations/20250123000001_create_api_keys_table.sql:39-70`, `app/api/keys/*`, `lib/auth/api-key.ts`, `IntegrationsTab.tsx`):**
   - `api_keys` table **does not exist on live Supabase** (`bhkpkylcwcxtpxbxrpag`).
   - Migration RLS policies check `workspace_id IN (SELECT id FROM workspaces WHERE id = api_keys.workspace_id)` (tautology with zero `auth.uid()` check!).
   - `SupabaseApiKeyRepository.ts:38` stores static `key_prefix: plaintextKey.substring(0, 8)` -> always `'uk_live_'`.
   - `IntegrationsTab.tsx` sends `expiresAt` (API reads `expiresInDays`) and `'webhooks:manage'` (API rejects `'webhooks:manage'`, allowing only `'webhooks:read'|'webhooks:write'`).
   - `validateApiKey` / `requireApiKey` (`lib/auth/api-key.ts`) has **0 callers repo-wide**.
6. **Deceptive `localStorage`-Only Features Presented as Cloud-Saved:**
   - `NotificationsTab.tsx:12-76`: Saves 4 switches ONLY to `localStorage` (`unool_notification_prefs`). Never read by Resend emails or publishing workers.
   - `IntegrationsTab.tsx:59-110`: Saves webhook URLs ONLY to `localStorage` (`unool_webhook_endpoints`). Zero DB persistence or HTTP delivery engine.

#### P1/P2 Auth, RBAC, Navigation, Design, Compliance & Code Bugs
7. **`lib/auth/server.ts:75-100`:** Throws `'Auth resolution failed'` instead of returning `null`, turning missing sessions into HTTP `500` in callers like `DELETE /api/user/delete`. Also single-workspace `.single()` locks multi-workspace (`Studio`) users out of secondary workspaces.
8. **`verifyWorkspaceAccess` (`lib/auth/workspaceAccess.ts:9-34`):** Ignores `workspace_members.status` (must require `'active'`) and `role`.
9. **Missing Workspace/Key RBAC:** `PUT/POST /api/workspace` & `/api/keys/*` lack `owner`/`admin` checks (`POST /api/workspace:114` also has unimplemented `// TODO: Send invitation email`).
10. **Security Flow Bypasses & Stubs:**
    - `POST /api/auth/switch-account` (`L60-177`) bypasses `user_metadata.mfa_enabled`.
    - `SecurityTab.tsx:32` calls client `supabase.auth.updateUser({ data: { mfa_enabled } })` directly (and `SettingsClient.tsx:75-76, 102-110` duplicates unused `mfaEnabled` state). Auth/security flags (`password_hash`, `mfa_enabled`, `is_deleted`) live in client-writable `user_metadata`.
    - `POST /api/auth/reset-password/request` skips `is_deleted` / `banned_until`; `verify-and-update` fails to revoke active sessions; zero authenticated Change Password UI/route exists; `SecurityTab.tsx:103-107` renders static `"coming in v1.1"` sessions placeholder.
11. **Broken URL Routing & Inbound Links:**
    - `SettingsClient.tsx:66-67` calls `useSearchParams()` without reading `?tab=`.
    - Broken links: `/dashboard/settings?tab=persona` (`ComposerClient.tsx:1827, 2043`, `StudioIdeaGenerator.tsx:394`), `/dashboard/settings?tab=billing` (`domain/route.ts:61`, `profile/route.ts:128, 142`, `enforcer.ts:48`), `/dashboard/channels` (`lib/auth/email.ts:157` -> 404), `/dashboard/settings` (`AnalyticsDNA.tsx:426`, `BrandMaterialsSection.tsx:1623, 1819`, `StoryIntake.tsx:437`, `FollowGateManager.tsx:254`), `/privacy` § 8 `"Dashboard > Settings > Connected Platforms"`, and `layout.tsx:458` `"Set up your subdomain in Presence first"` + swapped descriptions on `Studio` (`L358`) and `Signal` (`L372`).
    - Settings OAuth banner (`SettingsClient.tsx:205-225`) drops `?detail=`, `?platform=`, `?channel_limit_exceeded=` and fails to clean URL params.
12. **UI/UX, Accessibility, Copy & Cache Bugs:**
    - `SettingsClient.tsx:121-150` + `WorkspaceTab.tsx:27-30`: `handleSaveWorkspace` swallows failure with `toast.error` without throwing, so `WorkspaceTab` pops `toast.success` **simultaneously on error**, never updates `memorySettingsWorkspace`, and `handleSignOut` omits `clearAllClientCaches()`.
    - `DangerZoneTab.tsx:57`: renders literal `"You&apos;ll"`.
    - Hardcoded `'usha'` / `'usha@unool.co'` in `app/dashboard/layout.tsx:695,742,827` and `ComposerClient.tsx:1705`.
    - `SettingsClient.tsx:323` fires `onFocus` tab activation (breaking keyboard tab navigation) and uses `aria-controls` pointing to unmounted inactive panels; `SecurityTab.tsx:71-80` `<button role="switch">` lacks `type="button"`, `aria-label`, combines `aria-checked`+`aria-pressed`, hides focus ring; icon buttons (`WorkspaceTab.tsx:90-93`, `IntegrationsTab.tsx:344,459`) lack `aria-label`.
    - Conflicting palette (`#F5EFE2`/`#C4A265`/`#3D2B1F` + broken `dark:*` inside light `#FAF7F2` shell); mobile narrow `w-44`/`w-56` inputs & non-responsive `LoadingSkeleton`.
13. **Pricing, Billing, Admin, Meta & Studio AI Drift:**
    - `WorkspaceTab.tsx:118` checks obsolete `'premium'`, ignores `/api/billing/current` reconciliation & usage quotas. Dead orphaned `app/dashboard/settings/billing/BillingClient.tsx` references `free/basic/growth/scale` + Stripe.
    - `PricingPageClient.tsx` vs `lib/billing/plans.ts` vs `registry.ts`: `16` vs `24` templates, `5` vs `6` `SPARK_FREE_TEMPLATE_IDS`, Creator `$10/$8` vs `$9/$90` & `'None'` vs `1` Brand Voice.
    - `/api/billing/cancel` updates DB only (never calls Cashfree); `/api/billing/pay-qr/route.ts:85` leaks `err.message`; `/terms` promises GST electronic invoices not present in UI (`GST_ENABLED = false`).
    - `/privacy` § 10 promises machine-readable data export (`GET /api/user/export` missing); § 7 promises 30-day workspace purge (`deleted_accounts` table missing on live DB & lacks RLS; Meta `data-deletion` `GET` fakes `'completed'` for any code & misses FB/Threads).
    - `PUT /api/studio/profile:121-127` throws `500` on `VERSION_CONFLICT` (should be `409`); `POST /api/flightplan/generate` skips direct `studioProfile`.
    - `app/admin/settings/page.tsx:308-418` hardcodes 4 green health cards including `"Migrations: Up to date"`.
    - Legacy docs `BUG_REGISTER.md` and `FEATURE_INVENTORY.md` contain stale resolved claims.

---

## 2. TARGET ARCHITECTURE & FILE-BY-FILE IMPLEMENTATION SPECIFICATION

### 2.1 Canonical Settings Information Architecture (`/dashboard/settings?tab=<id>`)

Replace the 8 current tabs (`Templates` and `Profile Metrics` removed from Settings -> redirected cleanly to `/dashboard/profile?tab=design` and `/dashboard/profile?tab=domain`) with a clean **2-Group + Danger Zone** layout:

- **Group 1 — Your Account** (Personal to authenticated `userId`):
  1. `account` (**My Account**): Edit `users.full_name`, personal avatar upload, read-only verified `email`, personal `timezone` (synced with `profiles.timezone`), `12h/24h` time format, `reduced_motion` toggle, Multi-Workspace default/switcher, accessible `Sign Out` button (`clearAllClientCaches()`).
  2. `notifications` (**Notifications**): DB-backed toggles + digest cadence (`publish_failed`, `post_published`, `token_expiring`, `lead_inquiries`, `moderation_flags`, `weekly_digest`, `ai_suggestions`), plus non-suppressible Security & Billing transactional notice disclosure.
  3. `security` (**Security & Privacy**): Authenticated `Change Password`, `Email 2-Step Verification (OTP)` server-managed toggle (+ TOTP slot if approved), `Active Sessions & Sign Out All Other Devices`, recent login history, `Download My Data (GDPR/DPDP JSON Export)`.
- **Group 2 — Workspace** (Scoped to active `auth.workspaceId` with explicit RBAC badges):
  4. `workspace` (**Workspace & Team**, default landing tab when `?tab=` omitted): Workspace Name (Owner/Admin), copyable Workspace ID, Multi-Workspace Switcher dropdown (when >1 workspace exists), **Team Members & Pending Invites** (`owner`/`admin`/`editor`/`viewer`, Resend invite email flow completing `POST /api/workspace` TODO, `Leave Workspace` for members, `Transfer Ownership` for owners).
  5. `channels` (**Connected Channels**): Shared `<PlatformConnections>` component with Connected vs Available tabs, OAuth vs Custom Token status, token expiry countdown & 1-click Reconnect, channel slot quota bar, OAuth error/limit alert banner cleanly stripped from URL.
  6. `ai-voice` (**AI & Brand Voice**): Existing Studio AI voice signature + form + `Launch Calibrator` modal, downstream consumers card, `409 Conflict` reload/merge recovery, AI Guardrails (`bannedTerms`, default personalization, hashtag/emoji density), monthly AI credits meter, link to Brand Materials.
  7. `billing` (**Plan, Usage & Billing**): Unified `/api/billing/current` + `/api/billing/usage` view (5 progress bars: Posts, Channels, AI Credits, Brand Voices, Team Seats), active plan + override badge, Upgrade/Manage CTA (`-> /dashboard/billing`), GSTIN / Billing Address form & Invoice History receipts, Cancel Subscription w/ Cashfree API sync + downgrade deflection.
  8. `developers` (**API & Webhooks**): Gated honestly — either enabled once hardened `api_keys` + `/api/v1/*` + DB-backed HMAC `webhook_endpoints` ship, OR cleanly feature-flagged (`Early Access`) until Public API v1 goes live.
- **Footer Group — Danger Zone**:
  9. `danger` (**Danger Zone**): Scope-clear **Leave Shared Workspace** vs **Delete Workspace (Owner)** vs **Permanently Delete My Account** (`"DELETE"` + password/OTP verification + Cashfree cancel + tax-ledger handling + accurate policy copy).

**Mandatory Alias & Route Map:**
- `?tab=persona` / `?tab=studio` -> `ai-voice`
- `?tab=billing` -> `billing`
- `?tab=channels` -> `channels`
- `?tab=integrations` -> `developers` (show inline link to `Connected Channels` for social platforms)
- `?tab=templates` -> redirect to `/dashboard/profile?tab=design`
- `?tab=analytics` -> redirect to `/dashboard/profile?tab=domain`
- **New redirect route:** `app/dashboard/channels/page.tsx` -> `redirect('/dashboard/settings?tab=channels')` (fixes `lib/auth/email.ts:157`).

---

## 3. MANDATORY HUMAN APPROVAL GATES (STOP BEFORE PROCEEDING PAST GATE)

Do **NOT** execute or merge any action below without explicit human approval:

1. **Gate 1 — Live Supabase Schema Migrations (`bhkpkylcwcxtpxbxrpag`):**
   - Author SQL migrations for: (a) hardened `api_keys` (owner/admin RLS + `uk_live_<8chars>` prefix, drop weak `20250123000001` tautology); (b) `user_preferences` & `notification_preferences`; (c) `webhook_endpoints` & `webhook_deliveries` (if Webhooks included); (d) `deleted_accounts` with service-role-only RLS + updated `delete_workspace_data(p_user_id, p_workspace_ids)` checking `workspaces.owner_id = p_user_id`; (e) `workspaces` GST billing columns & `meta_deletion_requests`.
   - **Action:** Present exact SQL migration diff and run against a staging/branch database first. Obtain sign-off before running `apply_migration` on production.
2. **Gate 2 — Product & Legal Policy Decisions (`Decision 1–5` from Blueprint § 25):**
   - Confirm: (a) Feature-flag vs Public API v1 build for API Keys & Webhooks; (b) 30-day soft-delete grace (`deleted_accounts`) vs immediate hard purge + `/privacy` wording sync; (c) `GST_ENABLED` activation & invoice compliance vs `/terms` update; (d) Pricing/template parity values (`5` vs `6` Spark templates, `16` vs `24` count, Creator `$9` vs `$10`, Brand Voices `0` vs `1`); (e) Email change / TOTP Authenticator scope.
3. **Gate 3 — Cashfree Billing & Destructive Account Flows:**
   - Before wiring `/api/billing/cancel` or `/api/user/delete` outbound Cashfree calls, verify Cashfree Merchant Dashboard mode (`sandbox` vs `production`) and Subscription/Order cancellation API contract in staging.

---

## 4. FILE-BY-FILE EXECUTION ORDER

### Phase 0: Emergency Security, Multi-Tenancy & Broken Link Hotfixes
1. `lib/auth/server.ts`: Fix `getCurrentAuth()` to return `null` on unauthenticated/expired sessions instead of throwing `'Auth resolution failed'`; replace brittle `.single()` workspace lookup with deterministic multi-workspace cookie + active membership resolution.
2. `lib/auth/workspaceAccess.ts`: Enforce `status = 'active'` on `workspace_members` and add `{ requiredRoles?: WorkspaceRole[] }` RBAC validation.
3. `app/api/user/delete/route.ts` (+ RPC migration):
   - Wrap entire `DELETE` handler including `getCurrentAuth` cleanly (`401` on `!auth`).
   - Query `ownedWorkspaceIds` strictly via `.eq('owner_id', userId)` — NEVER append `auth.workspaceId` blindly! Remove user from non-owned `workspace_members`.
   - Validate server-side `confirmText === 'DELETE'` + re-auth credential/OTP.
   - Clean BOTH `CF_R2_MEDIA_BUCKET_NAME` and `CF_R2_AVATARS_BUCKET_NAME` across `${wsId}/`, `avatars/${userId}-`, and `materials/${wsId}/`.
   - Fix `referrals.referrer_user_id`, add missing tables / tax-invoice redaction handling, call Cashfree cancel + provider cleanup.
4. `middleware.ts` + all 15 custom connect routes `app/api/auth/platform/*/connect/route.ts`: Remove custom connect endpoints from unauthenticated `publicPaths`; enforce `getCurrentAuth` (`401`), `verifyWorkspaceAccess` (`403`), `channels` limit check (`403`), and shared `isSafePublicHttpsUrl` SSRF guard (`400`, esp. `lemmy`/`mastodon`/`listmonk`).
5. `app/api/onboarding/route.ts`: Enforce `getCurrentAuth` + `verifyWorkspaceAccess` across `GET/POST/DELETE`.
6. `lib/middleware/plan-enforcement-middleware.ts`, `lib/plan-enforcement.ts`, `lib/limits/enforcer.ts`: Remove nonexistent `workspaces.features` SQL selection; reconcile `instagram_comment_logs` column filter; retire dead `lib/limits/enforcer.ts` after extracting `trackAiUsage`.
7. Fix `switch-account/route.ts` MFA OTP check, `reset-password/request` deleted/banned check + `verify-and-update` global session revocation, and remove client-writable `user_metadata` security trust.
8. Create `app/dashboard/channels/page.tsx` redirect (`-> /dashboard/settings?tab=channels`), wire `?tab=` + aliases in `SettingsClient.tsx`, fix all hardcoded `?tab=persona` / `?tab=billing` / `'usha'` / `'Presence'` / `&apos;` / swapped nav copy across `layout.tsx`, `ComposerClient.tsx`, `StudioIdeaGenerator.tsx`, `AnalyticsDNA.tsx`, `BrandMaterialsSection.tsx`, `StoryIntake.tsx`, `FollowGateManager.tsx`, `domain/route.ts`, `profile/route.ts`, `DangerZoneTab.tsx`.
9. Fix `WorkspaceTab.tsx` + `SettingsClient.tsx` error swallowing & double toast; update `handleSignOut` to invoke `clearAllClientCaches()` + `memoryConnectionsCache.clear()`. Remove `localStorage` lies in `NotificationsTab.tsx` & `IntegrationsTab.tsx` (replace with gated state or real endpoints once Phase 1/2 lands).

### Phase 1 & 2: Schema, Editorial Design System, Accessibility, Core Settings & Channels/Billing
10. Apply approved SQL migrations (`api_keys` w/ owner/admin RLS & `uk_live_<8chars>`, `notification_preferences`, `user_preferences`, `deleted_accounts` RLS, GST fields).
11. Refactor `app/dashboard/settings/page.tsx` for SSR bootstrap props + `SettingsClient.tsx` + `components/dashboard/settings/tabs/shared.tsx`:
    - Unool Cream `#FAF7F2` / Porcelain `#FFFDF9` / Warm Border `#E8DFD5` / Espresso `#231C16` / Terracotta `#C8613D`; purge ad-hoc `dark:*` classes.
    - Manual ARIA tablist activation (remove `onFocus` tab switch), `<Switch>` with `type="button"` + `aria-labelledby` + `#C8613D` focus ring, `aria-label` on all icon buttons, `<select>` mobile bar (`< 768px`), responsive `LoadingSkeleton`, dirty-state bar + `beforeunload`.
    - Delete `TemplatesTab.tsx`, `TemplateAnalyticsTab.tsx`, and dead `app/dashboard/settings/billing/BillingClient.tsx`.
12. Implement `AccountTab.tsx` + `/api/user/profile` + `/api/workspace/switch` + sidebar multi-workspace switcher.
13. Implement real `NotificationsTab.tsx` + `/api/notifications/preferences` + wire `lib/auth/email.ts`, publish workers, lead contact (`profile/contact/route.ts`), and weekly digest cron.
14. Implement `ChannelsTab.tsx` sharing `<PlatformConnections>` cleanly, full OAuth callback banner parsing (`detail`, `platform`, `channel_limit_exceeded`), URL cleanup via `router.replace`.
15. Implement `BillingTab.tsx` + `/api/billing/usage` + `/api/billing/invoices` + `/api/billing/cancel` Cashfree sync + `PricingPageClient.tsx`/`plans.ts`/`registry.ts` single-source-of-truth parity.

### Phase 3 & 4: Team Members, Hardened Security/Export, Developers, AI Guardrails & Admin Sync
16. Implement `Members` UI in `WorkspaceTab.tsx` + `/api/workspace/members` & `/invites` + Resend invitation emails + `/invite/[token]` + `Leave Workspace` / `Transfer Ownership`.
17. Upgrade `SecurityTab.tsx` + `/api/user/security/{password,sessions,mfa}` + `/api/user/export` (GDPR/DPDP JSON/ZIP without tokens/secrets).
18. Either enable fixed `api_keys` + `/api/v1/*` (`requireApiKey`) + DB-backed HMAC `webhook_endpoints` OR cleanly gate `DevelopersTab` behind feature flag.
19. Upgrade `StudioTab.tsx` (`AIVoiceTab`) + `/api/studio/profile` (`409` conflict recovery) + `/api/flightplan/generate` (`studioProfile` support) + AI Guardrails + structured telemetry (`settings_viewed`, `settings_save_*`, etc.).
20. Upgrade `app/admin/settings/page.tsx` (`GET /api/admin/health` live checks replacing fake green cards), `app/api/webhooks/meta/{data-deletion,deauthorize}/route.ts` (real status store + FB/Threads purge), and synchronize `/privacy`, `/terms`, `BUG_REGISTER.md`, and `FEATURE_INVENTORY.md`.

---

## 5. REQUIRED AUTOMATED TEST & VERIFICATION COMMANDS (AFTER FINAL EDIT)

Do **not** skip or weaken assertions, and do **not** mock away ownership checks in `DELETE /api/user/delete` tests without strict query assertions:

1. **Create comprehensive new tests:**
   - `app/api/workspace/__tests__/route.test.ts` (RBAC owner/admin vs editor/viewer, member invite emails, switch cookie validation)
   - `app/api/user/delete/__tests__/route.test.ts` (rewrite: `401` unauth, shared-workspace isolation preserving non-owned data, dual R2 buckets/prefixes, `referrer_user_id`, Cashfree cancel, confirmation requirement)
   - `app/api/auth/platform/__tests__/customConnectSecurity.test.ts` (all 15 custom connect routes: `401`, foreign `workspaceId` `403`, channel cap `403`, SSRF `400`)
   - `app/api/onboarding/__tests__/route.test.ts` (`403` IDOR block)
   - `app/api/notifications/preferences/__tests__/route.test.ts`, `app/api/keys/__tests__/route.test.ts`, `app/api/billing/__tests__/routes.test.ts`, `app/api/user/export/__tests__/route.test.ts`
   - Component & `axe-core` tests under `components/dashboard/settings/__tests__/`
   - Playwright E2E spec `e2e/settings.spec.ts` (desktop `1440px` + mobile `390px` persistence, legacy aliases, keyboard accessibility, cache isolation across logout/switch).
2. **Run full verification suite cleanly in populated CI / host shell:**
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npx vitest run`
   - `npx playwright test e2e/settings.spec.ts e2e/public-profile.spec.ts`
3. Inspect database migrations against a staging branch (`verify` RLS with anon/user JWTs) before requesting production rollout approval.

