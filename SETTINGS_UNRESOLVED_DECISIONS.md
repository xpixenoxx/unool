

# UNool Studio — Settings Unresolved Decisions (`UD-01` – `UD-08`)

> **Status:** Provisional Recommendations Implemented in Stages 0–8 Code & Migrations — Live DB Apply & Policy Sign-Off Required Before Production Deploy  
> **Scope:** Product, security, data-lifecycle, schema, billing, legal, and rollout decisions (`CHG-01` through `CHG-28`). Code and idempotent migrations (`20261116000001`, `20261116000002`) follow the provisional recommendations with backward-compatible pre-migration fallbacks; high-stakes Postgres execution and legal/billing sign-offs remain gated below.  
> **Companion Documents:**
> - [SETTINGS_FINAL_FORENSIC_AUDIT.md](./SETTINGS_FINAL_FORENSIC_AUDIT.md)
> - [SETTINGS_FINAL_PRODUCT_ARCHITECTURE.md](./SETTINGS_FINAL_PRODUCT_ARCHITECTURE.md)
> - [SETTINGS_FINAL_IMPLEMENTATION_ROADMAP.md](./SETTINGS_FINAL_IMPLEMENTATION_ROADMAP.md)
> - [SETTINGS_REGRESSION_AND_ACCEPTANCE_MATRIX.md](./SETTINGS_REGRESSION_AND_ACCEPTANCE_MATRIX.md)
> - [SETTINGS_FINAL_EXECUTION_PROMPT.md](./SETTINGS_FINAL_EXECUTION_PROMPT.md)

---

## Executive Decision Matrix

| Decision ID | Topic | Blocking Stage(s) | Linked Changes | Default Provisional Choice (If Pre-Approved) |
| :--- | :--- | :--- | :--- | :--- |
| **UD-01** | Default Settings landing tab & bare `/dashboard/settings` links | Stage 3–4 | `CHG-13`, `CHG-15` | `account` default landing tab |
| **UD-02** | Timing & blast-radius verification for live Postgres RLS hardening | Stage 1 | `CHG-04` | Verify client direct Supabase queries, then apply scoped RLS policies |
| **UD-03** | Account deletion with multi-member workspaces & `deleted_accounts` table disposition | Stage 1, Stage 6 | `CHG-03`, `CHG-25` | Block owner deletion while other active members exist + drop dead `deleted_accounts` check in `verify-otp` (or create recovery table if soft-delete SLA required) |
| **UD-04** | Workspace vs user subscription ownership, cancel RBAC, and Cashfree recurring vs one-time model | Stage 2, Stage 4 | `CHG-09`, `CHG-19` | Workspace-scoped subscription access + Owner-only cancellation + accurate Cashfree billing cadence copy |
| **UD-05** | Password credential storage migration & JWT session invalidation on password reset | Stage 1–2, Stage 5 | `CHG-05`, `CHG-07`, `CHG-23` | Dual-read migration out of client-visible `raw_user_meta_data` + `security_version` claim + session revocation on reset |
| **UD-06** | `user_preferences` vs `workspaces.settings` timezone boundary & default opt-in state for non-essential emails | Stage 5 | `CHG-22` | Personal timezone in `user_preferences` (acting as schedule override fallback) + transactional/security alerts ON, `notify_product_updates` OFF by default |
| **UD-07** | Disposition of `IntegrationsTab`, `/api/keys/*`, and unapplied `api_keys` migration | Stage 4, Future (`CHG-28`) | `CHG-03`, `CHG-15`, `CHG-28` | Gate `IntegrationsTab` behind `admin_feature_flags` (`public_api_enabled = false`), remove local-only webhooks, defer `/api/v1/*` + QStash webhooks to `CHG-28` |
| **UD-08** | Legal copy synchronization in Privacy/Terms (`DPDP Act 2023` / GDPR / Meta SLA) & Supabase Dashboard TOTP MFA confirmation | Stage 4, Stage 6, Stage 8 | `CHG-13`, `CHG-24` | Update Privacy/Terms copy post-legal review + confirm Supabase project TOTP MFA enabled before Stage 6 |

---

## UD-01 — Default Settings Landing Tab & Bare `/dashboard/settings` Navigation

### Question
When a user navigates to bare `/dashboard/settings` (without `?tab=`), should the default active section be **Account (`account`)**, **Channels (`channels`)**, or **adaptive** based on workspace readiness, and should existing navigation links target explicit `?tab=` deep links or keep bare `/dashboard/settings`?

### Evidence & Context
- Recommended 2-Group / 6-Section IA (`SETTINGS_FINAL_PRODUCT_ARCHITECTURE.md`):
  - Personal (`Your Account`): `account`, `security`, `notifications`
  - Workspace (`Workspace: <Name>`): `channels`, `ai-voice`, `workspace`
- Linked implementation items: `CHG-13` (deep-link & copy cleanup), `CHG-15` (6-section IA shell & navigation), and legacy `?tab=` alias map (`platforms -> channels`, `studio|persona -> ai-voice`, `billing -> workspace#plan-usage`, `templates -> /dashboard/profile?tab=design`, `template-analytics -> /dashboard/profile?tab=domain`, `danger -> account#delete-account`, `integrations -> account` unless flag enabled).
- Bare `/dashboard/settings` links exist across dashboard layout and contextual banners (e.g., onboarding, sidebar, composer/channel prompts).

### Available Alternatives
1. **Option A — Static Personal Default (`?tab=account`) + Explicit Contextual Deep Links (Recommended):**
   - Bare `/dashboard/settings` always renders `account` (the first item in Group 1: Personal).
   - Contextual UI CTAs link directly to the relevant tab (`?tab=channels`, `?tab=ai-voice`, `?tab=security`, `?tab=workspace`).
2. **Option B — Workspace-First Default (`?tab=channels`):**
   - Bare `/dashboard/settings` opens `channels` because social platform connections drive core publishing workflows.
3. **Option C — Adaptive Default Based on Onboarding State:**
   - Bare `/dashboard/settings` redirects or defaults to `channels` if `0` platforms are connected, `ai-voice` if voice profile is unset, and `account` otherwise.

### Advantages & Disadvantages
| Option | Advantages | Disadvantages |
| :--- | :--- | :--- |
| **Option A (`account` default + deep links)** | Predictable bookmarking and mental model; top sidebar item matches default view; zero layout shift or unexpected redirects for returning users | Requires 1 extra click to reach `channels` if a user clicks generic "Settings" wanting to connect a social account |
| **Option B (`channels` default)** | Immediate access to social connections on first visit | Top nav order mismatches active content (or forces Workspace section above Personal Account); confusing when arriving from profile/account triggers |
| **Option C (Adaptive default)** | Guides brand-new users toward missing setup steps | Unpredictable URL behavior — the same bare URL resolves to different screens over time; breaks muscle memory and automated screenshot/E2E baselines |

### Technical Consequences
- **Option A** keeps `SettingsClient.tsx` SSR/URL state deterministic (`tab = searchParams.tab || 'account'`), simplifies tab normalization tests (`CMP-01`), and pairs cleanly with the non-gamified 4-item Readiness Strip linking directly to `channels`, `ai-voice`, `security`, and `notifications`.
- **Option C** introduces client or server redirect branches on `/dashboard/settings`, extra data dependencies before rendering the active tab, and non-deterministic E2E assertions.

### User Consequences
- First-time and returning users always land on a calm, familiar identity screen (`Account`) when clicking "Settings", while workflow CTAs ("Connect channel", "Calibrate AI Voice") take them directly to the exact sub-tab.

### Recommended Option
**Option A — `account` as default tab on bare `/dashboard/settings`, paired with explicit `?tab=` deep links from contextual product CTAs.**

### What Cannot Proceed Without Approval
- Finalizing the default tab fallback in `CHG-15` (`app/dashboard/settings/SettingsClient.tsx` & `page.tsx`) and updating sidebar/onboarding deep-link targets in `CHG-13`.

---

## UD-02 — Timing & Rollout of Live Postgres RLS Hardening

### Question
Should `CHG-04` tighten live Postgres Row-Level Security (`pg_policies`) across `admin_users`, `admin_audit_log`, `analytics_events`, `workspace_members`, `platform_connections`, and `subscriptions` in Stage 1 immediately, and how do we verify that no legitimate client-side browser flow writes directly to `analytics_events` or reads cross-member rows via the anon/authenticated Supabase client?

### Evidence & Context
- Live Postgres metadata introspection on project `bhkpkylcwcxtpxbxrpag` revealed policy defects targeted by `CHG-04`:
  - `admin_users` and `admin_audit_log` contain permissive/tautological policies.
  - `analytics_events` permits `{public}` inserts.
  - `workspace_members` non-owner `SELECT` visibility and `platform_connections` / `subscriptions` workspace scoping need tightening.
- Simultaneously, `app/api/analytics/time-spent/route.ts` and client-side analytics flows exist in the codebase (`CHG-08` also hardens `/api/analytics/time-spent` to require session auth).

### Available Alternatives
1. **Option A — Read-Only Client Audit + Server-Route Proxy + Stage 1 Scoped RLS Migration (Recommended):**
   - Grep all client (`use client`) Supabase calls to `analytics_events`, `admin_users`, `admin_audit_log`, `workspace_members`, `platform_connections`, and `subscriptions` before writing migration SQL.
   - Ensure any browser telemetry routes exclusively through authenticated Next.js API routes (which use `service_role` or validated user session context) rather than direct browser `supabase.from('analytics_events').insert(...)`.
   - Apply Stage 1 RLS migration dropping tautologies / `{public}` inserts and enforcing workspace-membership / `service_role` policies.
2. **Option B — Defer Non-Critical RLS Tightening to Stage 6 / Separate Security Sprint:**
   - Fix only `admin_users` / `admin_audit_log` in Stage 1 and defer `analytics_events` / `workspace_members` / `subscriptions` until client telemetry is refactored.
3. **Option C — Keep `{public}` Insert on `analytics_events` with Rate/Payload Constraints Only:**
   - Leave anonymous client inserts enabled for unauthenticated marketing pages (`/pricing`, public profiles).

### Advantages & Disadvantages
| Option | Advantages | Disadvantages |
| :--- | :--- | :--- |
| **Option A (Audit + server proxy + Stage 1 RLS)** | Closes privilege escalation and telemetry spam vectors before UI rollout (`SEC-01`, `DB-02`); clean server control | Requires checking client components and verifying public-profile/marketing telemetry paths before applying migration |
| **Option B (Phased RLS split)** | Reduces risk of breaking subtle UI reads during early stages | Leaves weak RLS policies live during Stages 2–5 |
| **Option C (Permissive `analytics_events`)** | Zero risk of breaking unauthenticated analytics pings | Anonymous callers can flood `analytics_events` directly via exposed anon key bypassing Next.js middleware & rate limits |

### Technical Consequences
- Tightening `admin_users`, `admin_audit_log`, `workspace_members`, `platform_connections`, and `subscriptions` directly affects every Supabase query using a user-scoped JWT instead of `service_role`.
- Applying `{public}` removal on `analytics_events` without first moving any browser-direct inserts to `/api/analytics/*` would cause silent telemetry write failures (`403` / RLS violation) in browser sessions.

### User Consequences
- **Option A** preserves seamless analytics and workspace member UI lists while guaranteeing users cannot query other workspaces' connections/subscriptions or tamper with admin/audit tables via browser dev tools.

### Recommended Option
**Option A — Pre-migration static call-site audit of client Supabase usage, route telemetry through server endpoints, and execute complete RLS hardening (`CHG-04`) in Stage 1.**

### What Cannot Proceed Without Approval
- Running or deploying the `CHG-04` Postgres RLS migration against Supabase project `bhkpkylcwcxtpxbxrpag`, and deciding whether unauthenticated public profile views (`e4803bec` / `app/api/analytics/*`) require an unauthenticated server endpoint with rate limiting (`lib/rate-limit.ts`) or signed telemetry tokens.

---

## UD-03 — Account Deletion Policy for Multi-Member Workspaces & Missing `deleted_accounts` Table

### Question
1. When a user attempts to delete their personal account while owning a workspace that contains **other active members**, should Unool **block deletion until ownership is transferred** or offer an **explicit cascade/dissolve choice**?
2. Since `deleted_accounts` does **not** exist in live Postgres (`36` tables observed in `public`), should we **remove the stale `deleted_accounts` lookup in `app/api/auth/signup/verify-otp/route.ts`** (hard delete) or **create the `deleted_accounts` table** to enforce a cooldown / recovery window?

### Evidence & Context
- Live Postgres metadata introspection confirmed `deleted_accounts` (along with `api_keys`, `media_uploads`, `notification_preferences`) does **not** exist in production `public`.
- `app/api/user/delete/route.ts` and live RPC `delete_workspace_data` currently suffer from bugs (`CHG-03`: `referrals.referrer_id` vs `referrer_user_id`, ordering relative to `auth.admin.deleteUser()`, unguarded references to missing tables `api_keys`, `media_uploads`, `deleted_accounts`).
- Stage 6 introduces `transfer_workspace_ownership` RPC (`CHG-25`), and Stage 4 separates Personal Account Deletion from Workspace Leave/Delete (`SETTINGS_FINAL_PRODUCT_ARCHITECTURE.md`).
- Legal pages (`app/privacy/page.tsx`) also reference deletion SLA timelines (`UD-08`).

### Available Alternatives
1. **Part 1 — Multi-Member Owned Workspace Policy:**
   - **1A — Block Personal Account Deletion Until Ownership Transferred (Recommended):** Personal deletion runs immediately for solo workspaces (dissolving solo workspace + personal data cleanly), but returns a clear `409 WORKSPACE_OWNERSHIP_TRANSFER_REQUIRED` with direct action to transfer ownership (`CHG-25`) or delete the shared workspace separately when other members exist.
   - **1B — Allow User-Selected "Transfer or Delete All Members' Workspace" Inside Personal Deletion Modal:** Gives owner an inline choice to promote another member or wipe the shared workspace in one step.
2. **Part 2 — `deleted_accounts` Recovery / Cooldown Table:**
   - **2A — Immediate Hard Delete + Remove Dead `deleted_accounts` Reference (Recommended unless soft-delete SLA required):** Remove dead `deleted_accounts` query from `verify-otp` and delete route; purge `public.users` and `auth.users` cleanly with zero phantom table queries.
   - **2B — Create `deleted_accounts` Table (`user_id`/`email_hash`/`purge_after`):** Implement true 30-day soft-delete tombstone preventing immediate re-signup or preserving recovery window.

### Advantages & Disadvantages
| Option | Advantages | Disadvantages |
| :--- | :--- | :--- |
| **1A (Block multi-member owner until transferred)** | Prevents accidental destruction of teammates' scheduled posts, channels, and billing history | Adds one prerequisite step before a shared-workspace owner can self-delete |
| **1B (Inline transfer/wipe during delete)** | Single workflow for owners | High risk of irreversible accidental team data loss under stress or account compromise |
| **2A (Hard delete + remove stale lookup)** | Matches immediate deletion expectations (`CHG-03`, Meta data-deletion webhook expectations); minimal schema/cron overhead | No self-service "undo account deletion" window once confirmed |
| **2B (Create `deleted_accounts` table)** | Enables 30-day recovery window & anti-abuse email cooldown | Requires scheduled hard-purge cron job, legal alignment with immediate deletion claims, and non-trivial tombstone handling on Meta/OAuth webhooks |

### Technical Consequences
- Choosing **2A** keeps `CHG-03` clean and focused: fix `referrals.referrer_user_id`, guard any optional tables, purge `public.users` before `auth.admin.deleteUser()`, and remove dead `deleted_accounts` references in `verify-otp/route.ts`.
- Choosing **1A** creates a clean dependency between Stage 1 (`CHG-03` guard returning `409` on multi-member owned workspaces) and Stage 6 (`CHG-25` `transfer_workspace_ownership` UI flow).

### User Consequences
- Team members cannot silently lose their workspace overnight because one departing owner clicked "Delete Account" under Personal Settings.
- Users deleting solo accounts succeed cleanly without database errors caused by nonexistent tables.

### Recommended Option
**Option 1A (Block personal deletion while owning a multi-member workspace until transferred or workspace explicitly deleted) + Option 2A (Immediate hard delete with stale `deleted_accounts` queries removed, unless Product explicitly mandates a 30-day soft-delete recovery window).**

### What Cannot Proceed Without Approval
- Final `delete_workspace_data` RPC contract (`CHG-03`), `verify-otp/route.ts` cleanup, and the design of the Personal vs Workspace hazard modals (`CHG-15`, `CHG-25`).

---

## UD-04 — Workspace vs User Subscription Ownership, Cancel RBAC, and Cashfree Billing Model

### Question
1. Are Unool Studio subscriptions (`subscriptions`, `lib/billing/subscription.ts`, `cashfree.ts`, `plans.ts`) strictly **Workspace-scoped** or **User-scoped** when a user belongs to multiple workspaces?
2. In Workspace RBAC (`CHG-09`), should **only the Workspace Owner** (`owner`) be allowed to cancel or modify a paid plan via `/api/billing/cancel`, or should **`admin`** also hold billing permissions?
3. Does the live Cashfree integration use **one-time fixed-term Cashfree PG orders** (manual renewal / non-auto-renewing) or **true recurring Cashfree Subscriptions**, and how must the Plan & Usage card in `workspace` (`CHG-19`) describe renewals and cancellations?

### Evidence & Context
- Code Map references `lib/billing/subscription.ts` (`1-535`), `cashfree.ts` (`1-493`), `plans.ts` (`1-250`), `app/pricing/PricingPageClient.tsx` (`1-250`), `app/dashboard/billing/BillingClient.tsx`, and orphan `app/dashboard/settings/billing/BillingClient.tsx` (to be removed while retaining redirect in `app/dashboard/settings/billing/page.tsx`).
- `CHG-02` introduces multi-workspace switching via `active_workspace_id` cookie validated against `verifyWorkspaceAccess()`.
- `CHG-04` scopes `subscriptions` RLS to workspace membership, and `CHG-09` adds `requireWorkspaceRole` to `/api/billing/cancel`.
- Misrepresenting one-time Cashfree PG orders vs auto-renewing subscriptions in Settings UI creates customer trust, refund, and compliance risk.

### Available Alternatives
1. **Scope:**
   - **S1 — Workspace-Scoped Subscriptions (Recommended):** Plan limits (`spark` fallback, paid tiers) and billing ownership attach to the active `workspace_id`, queried by `workspace_id`.
   - **S2 — User-Scoped Subscriptions:** A single user subscription unlocks tier limits across every workspace they own.
2. **Cancel/Billing RBAC:**
   - **R1 — Owner-Only Billing Mutations (`owner`) (Recommended):** Admins can manage channels/team/AI voice; only `owner` can upgrade, cancel, or inspect sensitive billing actions (plus a separate Billing Admin toggle later if needed).
   - **R2 — Owner + Admin Billing Mutations (`owner`, `admin`).**
3. **Cashfree Renewal Truthfulness:**
   - Match the exact Cashfree API mechanism implemented in `cashfree.ts` / `lib/billing/subscription.ts`: display `"Valid until <date> (manual renewal)"` if Cashfree PG one-time orders are used, or `"Renews on <date>"` only if Cashfree recurring subscription mandates are active.

### Advantages & Disadvantages
| Option | Advantages | Disadvantages |
| :--- | :--- | :--- |
| **S1 + R1 (Workspace-scoped + Owner-only cancel)** | Matches collaboration matrix (Owner holds `workspace` ownership & billing custody); prevents a departing admin from canceling a team's active paid plan (`CHG-09`); clean RLS | A single founder owning two separate brands/workspaces pays per workspace |
| **S2 + R2 (User-scoped / Admin cancel)** | Lower friction for agencies managing many workspaces | Ambiguous member seat limits (`CHG-25`), weakens RBAC boundaries, and conflicts with `subscriptions` workspace RLS (`CHG-04`) |

### Technical Consequences
- `CHG-02`, `CHG-04`, `CHG-09`, and `CHG-19` all assume workspace-level subscription scoping (`active_workspace_id` -> `subscriptions.workspace_id` -> `x-plan-tier` stripped from incoming client headers in `CHG-01`).
- If `cashfree.ts` creates fixed-duration PG orders rather than recurring mandates, Settings and `/dashboard/billing` MUST NOT claim automatic renewal or imply "Cancel stops auto-charge" when the order simply expires at period end.

### User Consequences
- Workspace teams see accurate plan status and usage in Settings (`workspace` tab -> CTA to `/dashboard/billing`) without duplicate orphan `/settings/billing` UI divergence.
- Non-owner members see read-only plan context without accidental cancellation power.

### Recommended Option
**Workspace-scoped subscriptions (`S1`), Owner-only billing cancellation (`R1`) for `CHG-09`, and exact alignment of UI renewal/expiry copy with the actual `cashfree.ts` order/subscription flow in `CHG-19`.**

### What Cannot Proceed Without Approval
- Locking RBAC roles inside `/api/billing/cancel` (`CHG-09`), deleting orphan `app/dashboard/settings/billing/BillingClient.tsx` (`CHG-19`), and writing the live Plan & Usage copy in `Workspace` settings (`CHG-19`).

---

## UD-05 — Password Authentication Storage Migration & Session Invalidation Strategy

### Question
1. Should `password_hash` be migrated out of client-visible `auth.users.raw_user_meta_data` into a **dedicated `service_role`-only `public.user_credentials` table** (`CHG-07`), or **rely solely on native Supabase Auth `auth.users.encrypted_password`** with no custom hash column?
2. When a user resets or changes their password (`CHG-05`, `CHG-23`), how strictly should active JWT sessions and `switchToken` account-switch tokens be invalidated?

### Evidence & Context
- Code Map `CHG-05` adds `public.users.security_version INT DEFAULT 1`, binds `switchToken` to an `sv` claim (`lib/auth/account-switch-token.ts`), clears `unool_saved_accounts_v1` and impersonation cookies, and unifies `/api/auth/signout`.
- Code Map `CHG-07` explicitly notes: *"Move `password_hash` out of client-visible `raw_user_meta_data` via dual-read transition."*
- Existing auth routes (`app/api/auth/{signin,reset-password/verify-and-update,signup/verify-otp}/route.ts`) rely on custom hashing / metadata checks today; `raw_user_meta_data` is readable in client JWTs/sessions and must not expose password hashes.

### Available Alternatives
1. **Part 1 — Credential Storage Target:**
   - **P1 — Dual-Read Transition to `public.user_credentials` (`service_role` RLS deny-all to `anon`/`authenticated`) (Recommended if custom password flows remain):** Read from `user_credentials` first, fall back to `raw_user_meta_data.password_hash` on sign-in, lazily migrate and scrub `raw_user_meta_data.password_hash` on login/password-change, plus optional server backfill script.
   - **P2 — Dual-Read Transition to Pure Native Supabase Auth (`supabase.auth.signInWithPassword` / `admin.updateUserById({ password })`):** Authenticate natively through GoTrue, migrating existing custom hashes lazily on login, then deleting custom hash logic entirely.
2. **Part 2 — Session Invalidation (`CHG-05`, `CHG-23`):**
   - Bump `public.users.security_version` (`sv`) + revoke other `auth.sessions` (keep current session optionally for "Change Password", revoke ALL sessions on "Reset Password" / "Sign Out All Devices") and reject `switchToken` with stale `sv`.

### Advantages & Disadvantages
| Option | Advantages | Disadvantages |
| :--- | :--- | :--- |
| **P1 (`public.user_credentials` `service_role` table)** | Zero change to existing custom OTP/signin password verification semantics (`lib/auth/server.ts`, `verify-otp`); immediate elimination of hash exposure in client metadata | Maintains a custom credential table instead of letting GoTrue manage bcrypt/Argon2 natively |
| **P2 (Pure Supabase GoTrue passwords)** | Eliminates all custom password hashing maintenance; automatic compatibility with Supabase MFA/AAL2 & native session revocation | Requires verifying custom OTP signup/reset routes match GoTrue password constraints and testing lazy migration across all sign-in variants |

### Technical Consequences
- Under **both P1 and P2**, a **dual-read transition** is mandatory so existing users are never locked out before they sign in again.
- Binding `security_version` (`CHG-05`) closes the critical loophole where `unool_saved_accounts_v1` / `switchToken` survives password resets or logouts.

### User Consequences
- Existing users continue logging in seamlessly without forced password resets.
- Users changing or resetting passwords immediately invalidate leaked tokens and unauthorized saved-account switches across devices.

### Recommended Option
**Option P1 (`service_role`-only `public.user_credentials` table with dual-read + scrub of `raw_user_meta_data.password_hash`, or P2 if engineering confirms zero custom OTP/hash coupling in `verify-otp` & `signin`) paired with strict `security_version` + `auth.sessions` revocation on password reset and explicit "Sign out other devices" option on password change.**

### What Cannot Proceed Without Approval
- Selecting P1 vs P2 before drafting Stage 2 migration `CHG-07` and implementing Stage 5 `POST /api/auth/change-password` (`CHG-23`).

---

## UD-06 — `user_preferences` Schema Boundary (Timezone Fallback) & Email Alert Defaults

### Question
1. Should timezone (`timezone`) live strictly in **personal `user_preferences`** (display/personal fallback) while workspace publishing schedules read **workspace default timezone (`workspaces.settings.timezone`)** with a defined fallback chain, or should a single workspace-wide timezone govern everyone?
2. When introducing Postgres-backed `user_preferences` (`CHG-22`: `notify_token_expiry`, `notify_publish_failure`, `notify_security_alerts`, `notify_product_updates`, `ai_personalization_enabled`), which notifications default to **ON** vs **OFF** for existing and new users?

### Evidence & Context
- Live Postgres metadata showed `notification_preferences` does **not** exist in production (`bhkpkylcwcxtpxbxrpag`), and existing notification/timezone/AI controls lack clean DB persistence (`CHG-22`).
- Recommended architecture (`SETTINGS_FINAL_PRODUCT_ARCHITECTURE.md`):
  - `account` tab: identity, timezone/formats, sign out, JSON export, personal deletion.
  - `notifications` tab: `notify_token_expiry`, `notify_publish_failure`, `notify_security_alerts`, `notify_product_updates` + `ai_personalization_enabled` + AI disclosure.
  - Scheduled publishing (`app/api/cron/publish-scheduled/route.ts`, `app/dashboard/composer/ComposerClient.tsx`) serves workspaces that may have multiple team members in different cities.

### Available Alternatives
1. **Timezone Model:**
   - **T1 — Layered Fallback Chain (`user_preferences.timezone` for UI display -> `workspaces.settings.timezone` -> browser Intl TZ / UTC) (Recommended):** Account settings edits the user's personal timezone (`user_preferences`), while workspace scheduling respects workspace timezone if explicitly configured or falls back to creator's `user_preferences.timezone`.
   - **T2 — Personal Timezone Only:** Only `user_preferences.timezone` exists; teammates always view schedules in their own local timezone.
2. **Notification Defaults on Migration (`user_preferences`):**
   - **N1 — Critical Operational & Security Alerts ON; Marketing/Product Updates OFF (Recommended):**
     - `notify_security_alerts`: `true` (and optionally non-disableable for critical password/2FA changes)
     - `notify_token_expiry`: `true`
     - `notify_publish_failure`: `true`
     - `notify_product_updates`: `false` (explicit opt-in; GDPR / DPDP Act 2023 friendly)
     - `ai_personalization_enabled`: verify against existing default behavior (keep existing user expectation intact, clearly disclosed in UI).
   - **N2 — All Four Toggles ON by Default:** Matches legacy unchecked-everything/opt-out expectations if marketing emails exist.

### Advantages & Disadvantages
| Option | Advantages | Disadvantages |
| :--- | :--- | :--- |
| **T1 + N1 (Layered TZ + Critical ON / Product Updates OFF)** | Solo creators configure timezone once under `Account`; distributed teams get coherent schedule baselines; complies cleanly with opt-in consent standards for product marketing | Must clearly label "Personal display timezone" vs workspace scheduling timezone when workspaces have >1 member |
| **T2 + N2** | Fewer schema fields; aggressive marketing reach | Distributed team members misread scheduled publish slots; risks anti-spam/privacy compliance complaints (`notify_product_updates` defaulted ON without opt-in) |

### Technical Consequences
- `user_preferences` table migration (`CHG-22`) sets explicit SQL `DEFAULT` column values once and backfills existing users idempotently.
- Downstream dispatchers (QStash/cron publish failure & OAuth token expiry alerts, `app/api/cron/publish-scheduled/route.ts`, `StudioOnboarding` / `StudioIdeaGenerator`) must query `user_preferences` cleanly with fallback defaults if no row exists yet.

### User Consequences
- Users stop losing notification/AI personalization toggles across browser refreshes or devices, and are never subscribed to unsolicited product newsletters without opting in.

### Recommended Option
**Option T1 (Personal `user_preferences.timezone` with documented workspace scheduling precedence) + Option N1 (`notify_security_alerts`, `notify_token_expiry`, `notify_publish_failure` = `true`; `notify_product_updates` = `false`).**

### What Cannot Proceed Without Approval
- Final column defaults and constraints in the Stage 5 `user_preferences` SQL migration (`CHG-22`).

---

## UD-07 — Disposition of `IntegrationsTab`, `/api/keys/*`, and Unapplied `api_keys` Migration

### Question
Since live Postgres `pg_tables` proved `api_keys` does **not** exist in production, `0` `/api/v1/*` routes call `requireApiKey`, and client webhooks inside `IntegrationsTab` are stored only in browser `localStorage`, should we **feature-flag hide `IntegrationsTab`** behind `admin_feature_flags` (`public_api_enabled = false`) for Stage 4 (`CHG-15`), or **archive/remove `/api/keys/*` and the unapplied migration cleanly** until the Future Milestone (`CHG-28`) builds real API key & QStash webhook infrastructure?

### Evidence & Context
- Code Map confirms:
  - `IntegrationsTab.tsx` (`1-562`), `app/api/keys/route.ts` (`1-143`), `app/api/keys/[id]/route.ts` (`1-66`), `lib/auth/api-key.ts` (`1-93`), `lib/repositories/supabase/SupabaseApiKeyRepository.ts` (`1-100`).
  - Migration `20250123000001_create_api_keys_table.sql` exists in repo but was **never applied** to live Postgres `bhkpkylcwcxtpxbxrpag`.
  - `0` `/api/v1/*` endpoints invoke `requireApiKey`; webhooks are browser-local-only (`localStorage`), meaning existing users cannot receive server webhooks or make real authenticated v1 API calls via those UI controls today.
- Recommended IA (`SETTINGS_FINAL_PRODUCT_ARCHITECTURE.md`): Gate `IntegrationsTab` behind `admin_feature_flags` `public_api_enabled = false`; redirect legacy `?tab=integrations` to `account` with an informational toast when disabled (`CMP-01`).

### Available Alternatives
1. **Option A — Gate `IntegrationsTab` Behind `admin_feature_flags` (`public_api_enabled = false`) + Freeze/503 Disabled Public API UI (Recommended):**
   - Hide `IntegrationsTab` from Settings navigation when `public_api_enabled` is `false`; remove non-functional client `localStorage` webhook form from active UI; return controlled `503 Feature Disabled` on `/api/keys/*` when flag is `false` so unauthenticated/broken DB queries to missing `api_keys` never crash with HTTP `500`.
   - Keep architecture path open for the Future Milestone (`CHG-28`: apply `api_keys` migration + `/api/v1/*` + QStash signed webhooks).
2. **Option B — Permanently Delete `IntegrationsTab`, `/api/keys/*`, `lib/auth/api-key.ts`, and `20250123000001_create_api_keys_table.sql` Now:**
   - Remove all dead API key & webhook scaffolding immediately; rebuild from scratch if ever prioritized later.
3. **Option C — Keep `IntegrationsTab` Visible and Apply `20250123000001` Immediately Without `/api/v1/*`:**
   - Users can generate keys in DB, even though no `/api/v1/*` routes exist to consume them and webhooks remain `localStorage`-only.

### Advantages & Disadvantages
| Option | Advantages | Disadvantages |
| :--- | :--- | :--- |
| **Option A (Feature flag `public_api_enabled = false` + guard `/api/keys/*`)** | Immediately eliminates fake/broken "placebo" UI and missing-table `500` errors while preserving repository structure for `CHG-28` | Leaves gated code files in repo until `CHG-28` executes or is formally deprecated |
| **Option B (Hard remove now)** | Zero unused API key files or migration drift | Higher rework cost if public API / Zapier-style webhooks are approved for next quarter |
| **Option C (Keep visible without endpoints)** | Preserves current tab count | **Unacceptable UX:** users generate API keys and configure webhooks that do literally nothing on any server |

### Technical Consequences
- **Option A** guarantees `app/api/user/delete/route.ts` (`CHG-03`) and `/api/keys/*` cannot trigger Postgres errors (`relation "api_keys" does not exist`) while keeping `?tab=integrations` graceful (`account` + toast in `CMP-01`).
- Also requires confirming `admin_feature_flags` has or accepts the `public_api_enabled` key cleanly (`false` by default).

### User Consequences
- Real users are no longer misled by non-working `localStorage` webhooks or non-functional API keys, making Settings cleaner and more trustworthy immediately.

### Recommended Option
**Option A — Gate `IntegrationsTab` behind `admin_feature_flags.public_api_enabled = false`, guard `/api/keys/*` cleanly when disabled, redirect `?tab=integrations -> account` with toast, and execute full API/QStash webhook delivery only if Future Milestone `CHG-28` is commissioned.**

### What Cannot Proceed Without Approval
- Inserting/configuring `public_api_enabled = false` in `admin_feature_flags` vs opting for Option B full deletion before Stage 4 (`CHG-15`) and Future Milestone `CHG-28`.

---

## UD-08 — Legal Copy Updates (`Privacy` & `Terms`) and Supabase Auth TOTP MFA Dashboard Prerequisite

### Question
1. What exact legal/compliance copy changes in `app/privacy/page.tsx` and `app/terms/page.tsx` are approved for **data-deletion timelines** (`30 days` vs immediate hard deletion & Meta `webhooks/meta/data-deletion`), stale product references (`"Unool Pro"`, `"Account Settings"`), Indian **DPDP Act 2023 / GDPR** disclosures, and GSTIN tax invoicing timelines?
2. Can an administrator confirm in the **Supabase Dashboard (`bhkpkylcwcxtpxbxrpag` Auth -> Multi-Factor Authentication)** that **TOTP MFA is enabled** (without forcing mandatory MFA enrollment on all existing users) before Stage 6 (`CHG-24`) begins?

### Evidence & Context
- Code Map & `SETTINGS_FINAL_PRODUCT_ARCHITECTURE.md`:
  - Inspected `app/privacy/page.tsx` (`451-650`), `app/terms/page.tsx` (`1-171`), and `app/api/webhooks/meta/{data-deletion,deauthorize}/route.ts`.
  - Legal pages currently contain stale labels (`"Unool Pro"`, `"Account Settings"` deep links needing alignment under `CHG-13`) and timeline statements (`"30 days"`) that must match actual technical deletion (`CHG-03`, `UD-03`) and AI personalization disclosures (`notifications` / `ai_personalization_enabled` `CHG-22`).
  - `CHG-24` replaces placeholder/non-persistent 2FA UI in `SecurityTab.tsx` with real Supabase Auth `supabase.auth.mfa.enroll / challenge / verify / unenroll` (TOTP QR + recovery codes or documented fallback), which fails at runtime if TOTP is disabled in the Supabase Auth project settings.
  - `CHG-28` covers deferred GSTIN invoicing (`UD-04` / `Billing`) alongside public APIs.

### Available Alternatives
1. **Legal Copy Sync (`CHG-13`):**
   - **L1 — Synchronize Labels, Deletion SLA, AI Personalization & Contact Paths Post-Legal Sign-Off (Recommended):** Update section titles (`Account Settings` -> exact Settings route/tab names, `"Unool Pro"` -> active Spark/Creator/Pro plan naming), align deletion copy with `UD-03` decision (immediate hard purge vs 30-day recovery window), and explicitly disclose AI voice personalization + opt-out toggle in `notifications`.
   - **L2 — Labels Only Without Deletion/AI SLA Edits:** Fix broken anchor/route text only; defer statutory DPDP/GDPR/GSTIN copy rewrite to counsel review.
2. **TOTP MFA Rollout (`CHG-24`):**
   - **M1 — Optional User-Enrolled TOTP MFA via Supabase Auth (`aal2` step-up on sensitive actions, non-mandatory enrollment) (Recommended):** Confirm TOTP enabled in Supabase Dashboard; let users enroll voluntarily via Authenticator app (`QR` + verify).
   - **M2 — Keep 2FA Hidden Behind Placeholder/Disabled Badge Until Dashboard Configured.**

### Advantages & Disadvantages
| Option | Advantages | Disadvantages |
| :--- | :--- | :--- |
| **L1 + M1 (Synced legal copy + Confirmed optional TOTP)** | Eliminates contractual contradictions with Meta Data Deletion webhook & actual DB deletion behavior; delivers trustworthy working 2FA in `Security` | Requires legal/founder review of exact SLA wording (`UD-03` dependency) and manual Supabase Auth dashboard toggle check |
| **L2 + M2** | Zero legal review delay | Leaves inaccurate deletion SLA & AI disclosure statements live; delays real 2FA protection |

### Technical Consequences
- Stage 6 `CHG-24` (`supabase.auth.mfa.*`) **cannot pass integration or E2E tests** unless TOTP MFA is enabled on Supabase project `bhkpkylcwcxtpxbxrpag`.
- Meta App Review compliance (`app/api/webhooks/meta/data-deletion`) requires Privacy Policy deletion instructions to match actual deletion API behavior (`UD-03`).

### User Consequences
- Users reading Terms & Privacy get truthful, accurate instructions and matching link names for exporting data (`CHG-21`), opting out of AI personalization (`CHG-22`), or deleting their account (`CHG-03`), plus working Authenticator 2FA (`CHG-24`).

### Recommended Option
**Option L1 (Synchronize Privacy/Terms copy with final `UD-03`/`UD-06` decisions after founder/legal review) + Option M1 (Verify Supabase TOTP MFA enabled in project settings before Stage 6 `CHG-24`).**

### What Cannot Proceed Without Approval
- Deploying edits to `app/privacy/page.tsx` & `app/terms/page.tsx` (`CHG-13`), publishing GSTIN billing commitments (`CHG-28`), and starting Stage 6 `CHG-24` (requires confirmation that TOTP MFA is enabled in Supabase Auth settings).

---

## Consolidated Pre-Production & Live Migration Sign-Off Checklist

Code implementation (backward-compatible pre-migration) and idempotent migrations (`supabase/migrations/20261116000001_settings_security_rls_and_tables.sql`, `20261116000002_settings_lifecycle_rpcs.sql`) are in the workspace using provisional recommended defaults. Before executing live DB migrations on `bhkpkylcwcxtpxbxrpag` or promoting **Stage 9** to production, the Product Owner / Engineering Lead / Legal Counsel should explicitly approve or override:

- [ ] **UD-01 (Code Defaulted: `account`):** Confirm `account` as default `?tab=` landing target on `/dashboard/settings` (`?tab=templates`/`template-analytics` map to `ai-voice` banner -> `/dashboard/profile`).
- [ ] **UD-02 (SQL Authored, Unapplied):** Approve Stage 1 scoped RLS migration (`20261116000001`) timing and verify no legacy client code depends on dropped `{public}` policies before running against `bhkpkylcwcxtpxbxrpag`.
- [ ] **UD-03 (SQL Authored, Unapplied):** Approve multi-member workspace deletion block (`WORKSPACE_HAS_ACTIVE_MEMBERS`) + explicit confirm/password re-auth (`20261116000002`, `app/api/user/delete`).
- [ ] **UD-04 (Code Implemented):** Confirm workspace-scoped subscription ownership, `owner`-only cancel RBAC (`CHG-09`), and Cashfree 24-template parity / non-auto-renewal copy (`CHG-19`, `plans.ts`, `PricingPageClient.tsx`).
- [ ] **UD-05 (Code + SQL Authored):** Confirm `public.user_credentials` dual-read migration + `public.users.security_version` (`DEFAULT 0`) session/switch-token invalidation (`CHG-05`, `CHG-07`, `CHG-23`).
- [ ] **UD-06 (Code + SQL Authored):** Confirm `user_preferences` timezone/format/notification columns (`digest_frequency`, `notify_token_expiry`, `notify_security_alerts`, `notify_publishing`, `ai_personalization_enabled`) & defaults (`CHG-22`).
- [ ] **UD-07 (Code + Seed SQL Authored):** Confirm gating `IntegrationsTab` & `/api/keys/*` (`503`) behind `admin_feature_flags.public_api_enabled = false`, GSTIN archival deferment, and deferring `/api/v1/*` to `CHG-28`.
- [ ] **UD-08 (Privacy Updated; Terms/MFA Pending):** Complete legal counsel review of updated `app/privacy/page.tsx` and deferred `app/terms/page.tsx`, and confirm Supabase Auth TOTP MFA is toggled ON in project `bhkpkylcwcxtpxbxrpag` (`CHG-13`, `CHG-24`).
