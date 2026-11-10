# AUDIT FINDINGS — UNOOL (`unool.co`) Forensic Investigation

This document synthesizes the primary and second-pass forensic findings across all 12 stages of the audit protocol.

---

## 1. Executive Summary of Findings

- **Total Confirmed Issues Identified**: **35 Primary Bugs + 12 Secondary UX/Performance Items (47 Total)**
  - **P0 (Critical / Immediate Launch Blockers)**: **12** (**12/12 Fixed & Verified**)
  - **P1 (High / Serious Functional, Security, or Reliability Risks)**: **14** (**14/14 Fixed & Verified**)
  - **P2 (Medium / Quality, UX, Memory, or Hygiene Issues)**: **6 Primary + 12 Secondary** (**All Fixed & Verified**)
  - **P3 (Low / Dead Code & Minor Polish)**: **3** (**3/3 Fixed & Verified**)

---

## 2. Primary Audit Findings by Domain (Stages 1–7)

### 2.1 Authentication & Access Control (`middleware.ts`, `lib/auth/**`, `app/api/**`)
1. **Header Spoofing Auth Bypass (`BUG-001` / P0 — FIXED)**: `middleware.ts:186` only injected `x-user-id` when `!request.headers.get('x-user-id')` and never stripped client-supplied `x-user-id` or `x-workspace-id` headers. Meanwhile, `getCurrentAuth()` (`lib/auth/server.ts:19-34`) and `getAuthContext()` (`lib/auth/context.ts:89-95`) trusted those headers as Priority 1. Any unauthenticated client supplying `x-user-id: <victim-uuid>` achieved full account/workspace takeover.
2. **Hardcoded Super-Admin Backdoor (`BUG-002` / P0 — FIXED)**: `app/admin/api/login/route.ts:64-78` contained a hardcoded password override (`PIXER#USHA` / `PIXER@USHA`) for `usha@pixenox.com` that bypassed Argon2 verification even after a password hash was set in the database.
3. **Unverified JWT Cookie Decoding (`BUG-003` / P0 — FIXED)**: `lib/auth/context.ts:23-80` (`extractUserFromCookieStore`) base64-decoded the middle segment of `sb-*-auth-token` cookies and returned `{ userId: payload.sub }` without verifying the JWT signature.
4. **Hard 50-User Pagination Cap on `supabaseAdmin.auth.admin.listUsers()` (`BUG-009` / P0 — FIXED)**: Nine routes (`signin`, `signin/verify-otp`, `signup`, `signup/verify-otp`, `resend-otp`, `reset-password/request`, `reset-password/verify-and-update`, `workspace`, `admin/api/setup`) called `supabaseAdmin.auth.admin.listUsers()` without pagination and filtered in memory. Remediated via `lib/auth/findUserByEmail.ts` + migration `20261110000003_auth_user_lookup.sql`.
5. **Unauthenticated Endpoints & Cross-Tenant IDORs (`BUG-005`, `BUG-006`, `BUG-007` / P0 — FIXED)**:
   - `POST /api/publish` lacked `getCurrentAuth()` and workspace ownership verification.
   - `POST /api/composer/adapt` allowed overwriting any post and deleting its `post_variants` via `postId` without checking `existingPost.workspaceId === workspaceId`.
   - `GET/POST /api/instagram/test-comment`, `POST /api/instagram/sync`, and `GET /api/instagram/posts` allowed unauthenticated callers to inspect connections, trigger AI syncs, or post live Instagram replies, and `GET /api/instagram/posts` leaked `platform_posts` across all workspaces.
   - `GET /api/cron/instagram-sync` failed open when `CRON_SECRET` was unset and did not pass `Authorization: Bearer ${cronSecret}` to `/api/instagram/sync`.

### 2.2 Billing, Plan Enforcement & Data Integrity (`lib/plan-enforcement.ts`, `lib/billing/**`, `supabase/**`)
1. **Cross-Tenant Redis Plan Cache Collision (`BUG-004` / P0 — FIXED)**: `lib/plan-enforcement.ts:119,128,186` used the literal Redis key `'plan:'` instead of `` `plan:${planId}` ``, causing all workspaces across all tiers to overwrite and read the same cached plan object for 60 seconds.
2. **Non-Existent `workspaces.plan_tier` Column in `lib/limits/enforcer.ts` (`BUG-012` / P1 — FIXED)**: Selected `plan_tier` instead of `plan`, causing every workspace to default to `'free'`.
3. **Cashfree Webhook Double-Upsert & Non-Atomic `markOrderPaid` Race (`BUG-008` / P0 — FIXED)**: `app/api/webhooks/cashfree/route.ts:100-135` called `markOrderPaid` (which already upserted the subscription with `cfSubscriptionId` and rewarded the referrer) and then immediately called `upsertSubscription` a second time without `cfSubscriptionId` (wiping `cf_subscription_id` to `null`) and `recordReferralConversion` a second time. Furthermore, `markOrderPaid` (`lib/billing/subscription.ts:203`) did not check whether `.update(...).eq('status', 'PENDING')` matched a row, allowing concurrent `/api/billing/verify` and webhook calls to execute side effects twice.
4. **`brand_materials_pages` PUBLIC RLS Vulnerability (`BUG-010` / P0 — FIXED)**: Migration `20261018000001_brand_materials_pages.sql:39-43` created policy `"Service role all access brand materials pages" FOR ALL USING (true) WITH CHECK (true)` without `TO service_role`, granting full read/write/delete access to `anon`.
5. **Broken Optimistic Locking on `profiles` (`BUG-016` / P1 — FIXED)**: `SupabaseProfileRepository.update()` checked `.eq('version', expectedVersion)` but never incremented `version: expectedVersion + 1`.

### 2.3 SSRF, Stored XSS & Public Profile Data Leaks
1. **SSRF Validation Bypass (`BUG-011` / P0 — FIXED)**: `lib/utils/url-validation.ts:108-115` skipped validation with `continue` whenever `isValidIpv4(ip)` and `isValidIpv6(ip)` both returned `false`—which happened for IPv4-mapped IPv6 addresses (`::ffff:127.0.0.1`, `::ffff:169.254.169.254`) and DNS resolution fallbacks.
2. **Stored XSS via Same-Origin Media Proxy (`BUG-013` / P1 — FIXED)**: `/api/composer/upload` and `/api/profile/avatar` permitted `image/svg+xml` / arbitrary MIME types served same-origin by `/api/media/[...path]` without `Content-Security-Policy: sandbox` or `Content-Disposition: attachment`.
3. **Public Profile Rate-Limiter Failure & Unpublished Post Leak (`BUG-014`, `BUG-015` / P1 — FIXED)**: `GET /api/profile/[subdomain]` parsed Upstash REST `{ result: number }` as a raw number (`NaN`), never set a key TTL, and fell back to exposing unpublished `'draft'`/`'scheduled'` posts when a workspace had zero published posts.

### 2.4 Frontend State, UX & Component Bugs
1. **Global `window.open` Hijacking in `BillingClient.tsx` (`BUG-017` / P0 — FIXED)**: `BillingClient.tsx:12-22` monkey-patched `window.open` globally and closed the most recently opened window on mount/cleanup regardless of domain.
2. **Silent Data Loss on Publish (`BUG-018` / P1 — FIXED)**: `PublishClient.tsx:278-295` did not include edited `drafts` in `POST /api/publish`, discarding unsaved variant edits.
3. **Deadlocked Save Button in `TemplatesTab.tsx` & Theme Clobbering (`BUG-019` / P1 — FIXED)**: `savedTemplate` initialized to `null`, preventing the `"Save Changes"` button from ever rendering; `/api/profile` overwrote the entire `theme` JSONB object on partial updates.
4. **Invisible `TiltCard` (`scale: 0`) (`BUG-020` / P1 — FIXED)**: `components/ui/3d/TiltCard.tsx:26` initialized `isHovered = useMotionValue(0)` and bound it directly to `scale`, rendering cards at `scale(0)` until hovered.
5. **Broken `localToUtc` Timezone Regex & Hour 24 Overflow (`BUG-021` / P1 — FIXED)**: `hooks/flightplan/useTimezone.ts:158` failed to match 1-digit offsets (`GMT+5:30`, `GMT-7`) and double-applied local browser timezone offsets; `useTimeSelector.ts:47` produced hour `24`.
6. **Blackholed Public Contact Form (`BUG-022` / P0 — FIXED)**: `app/contact/page.tsx:12-15` prevented default and showed a fake success screen without sending the message anywhere.
7. **Systemic Unkeyed Module-Level Caches (`BUG-027` / P1 — FIXED)**: Dashboard client modules stored state in module-scope variables (`memoryPresenceProfile`, `memoryComposerProfile`, etc.) without keying by `workspaceId` or clearing on sign-out. Remediated via `lib/utils/clientCache.ts` (`registerClientCacheReset`, `clearAllClientCaches`, `syncClientCacheScope`).

---

## 3. Stage 9 — Independent Second-Pass Audit Challenges

During the mandatory Stage 9 second-pass review, we challenged our initial assumptions and uncovered four deeper systemic truths:
1. **Intentional Double `postPublicReply` in Follow-Gate Mode Verified by Tests**: Initially flagged as a suspected bug in `app/api/webhooks/qstash/instagram-outbound/route.ts:274-307`, our inspection of `app/api/webhooks/qstash/instagram-outbound/__tests__/route.test.ts:545-572` proved that posting two public replies (the conversational reply + the follow-gate instruction) while withholding `sendDmForComment` is an explicit product design to preserve Meta's single Private Reply slot per comment until after follow verification.
2. **`tsconfig.json` Excluded `**/*.test.ts` and `**/*.spec.ts`**: `tsconfig.json:27` excludes test files from `npm run typecheck`, masking any type drift in test suites unless verified by Vitest execution.
3. **`pg_cron` vs. `CRON_SECRET` Mismatch (`supabase/migrations/20261027_pg_cron_publish_scheduled.sql`)**: The database `pg_cron` job calls `net.http_get(url := 'https://unool.co/api/cron/publish-scheduled')` with no `Authorization` header, which `/api/cron/publish-scheduled` rejects with `401` whenever `CRON_SECRET` is set. Vercel Cron (`vercel.json`) automatically injects `Authorization: Bearer <CRON_SECRET>`, so `pg_cron` must either read the secret from Supabase Vault or rely on Vercel Cron + QStash.
4. **Repository Root Hygiene Contamination**: `git ls-files` confirmed that `tmp-conns.json` (containing real workspace/user IDs and encrypted OAuth tokens), `cookies.txt` / `cookies.json`, 13 `.log` files, and a malformed Windows filename (`C\357\200\272UsersUSHARANIDesktop...sql`) were committed to git history.

