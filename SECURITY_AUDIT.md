# SECURITY AUDIT — UNOOL (`unool.co`) Red-Team Assessment

Independent OWASP Top 10 security assessment with reproducible evidence, exploit scenarios, and remediation status.

---

## 1. OWASP Top 10 Vulnerability Matrix

| OWASP Category | Finding | Severity | Location | Status |
|---|---|---|---|---|
| **A01: Broken Access Control** | Authentication bypass & arbitrary account/workspace takeover via spoofed `x-user-id` and `x-workspace-id` headers | **CRITICAL (P0)** | `middleware.ts:185-232`, `lib/auth/server.ts:18-34` | **FIXED & VERIFIED** |
| **A01: Broken Access Control** | Unverified JWT base64 payload decoding from cookies in `getAuthContext()` | **CRITICAL (P0)** | `lib/auth/context.ts:23-80, 102-133` | **FIXED & VERIFIED** |
| **A01: Broken Access Control** | Cross-tenant IDOR in `POST /api/publish` and `POST /api/composer/adapt` | **CRITICAL (P0)** | `app/api/publish/route.ts:13-42`, `app/api/composer/adapt/route.ts:159-168` | **FIXED & VERIFIED** |
| **A01: Broken Access Control** | Unauthenticated Instagram sync, test-comment, posts, and cron endpoints + cross-tenant `platform_posts` leak | **CRITICAL (P0)** | `app/api/instagram/{sync,test-comment,posts}/route.ts`, `app/api/cron/instagram-sync/route.ts` | **FIXED & VERIFIED** |
| **A01: Broken Access Control** | Supabase RLS policy on `brand_materials_pages` granted `FOR ALL USING (true)` to `PUBLIC` (`anon`) | **CRITICAL (P0)** | `supabase/migrations/20261018000001_brand_materials_pages.sql:39-43` | **FIXED (Migration `20261110000002`)** |
| **A01: Broken Access Control** | Cross-tenant Redis plan cache key collision (`plan:`) leaking Studio unlimited tier to Free users | **CRITICAL (P0)** | `lib/plan-enforcement.ts:119, 128, 186` | **FIXED & VERIFIED** |
| **A07: Identification & Auth Failures** | Hardcoded super-admin password backdoor (`PIXER#USHA` / `PIXER@USHA` for `usha@pixenox.com`) | **CRITICAL (P0)** | `app/admin/api/login/route.ts:64-78` | **FIXED & VERIFIED** |
| **A10: Server-Side Request Forgery (SSRF)** | SSRF validation bypass via IPv4-mapped IPv6 (`::ffff:127.0.0.1`, `::ffff:169.254.169.254`) and DNS resolution fallback | **CRITICAL (P0)** | `lib/utils/url-validation.ts:97-118, 213-216` | **FIXED & VERIFIED** |
| **A03: Injection / Stored XSS** | Stored XSS via `image/svg+xml` and `text/html` uploads served same-origin on `/api/media/[...path]` | **HIGH (P1)** | `app/api/composer/upload/route.ts`, `app/api/profile/avatar/route.ts`, `app/api/media/[...path]/route.ts` | **FIXED & VERIFIED** |
| **A05: Security Misconfiguration** | Wildcard `Access-Control-Allow-Origin: *` paired with `Access-Control-Allow-Credentials: true` on `/api/(.*)` | **HIGH (P1)** | `vercel.json:25-31` | **FIXED & VERIFIED** |
| **A02: Cryptographic Failures** | Committed `tmp-conns.json` with encrypted OAuth tokens & workspace UUIDs + `cookies.txt` with `dev-auth-bypass=true` | **HIGH (P1)** | `tmp-conns.json:1-63`, `cookies.txt:1-6`, `.gitignore` | **FIXED & UNTRACKED (`FIX-21`)** |
| **A07: Identification & Auth Failures** | Unauthenticated `/api/auth/platform/connect` trusts `workspaceId`/`userId` query params + unsigned `oauth_state` cookie fallback | **HIGH (P1)** | `app/api/auth/platform/connect/route.ts:91-100`, `lib/auth/oauth-state.ts:144-169` | **FIXED & VERIFIED (`FIX-13`)** |
| **A04: Insecure Design (PCI-DSS & Cost DoS)** | `/api/billing/pay-card` accepts raw PAN/CVV in JSON body; `/api/health` invokes live Anthropic completion unauthenticated | **MEDIUM (P2)** | `app/api/billing/pay-card/route.ts:26-83`, `app/api/health/route.ts:48-75` | **FIXED & VERIFIED (`FIX-14`)** |

---

## 2. Detailed Proof of Concept & Remediation Evidence for Critical Findings

### 2.1 [FIXED] Auth Bypass via `x-user-id` / `x-workspace-id` Header Injection (`BUG-001`)
- **Pre-Fix Vulnerability**:
  - `middleware.ts:186` checked `if (!request.headers.get('x-user-id'))` before resolving the Supabase user session.
  - When an external attacker sent `curl -H "x-user-id: <victim-uuid>" -H "x-workspace-id: <victim-ws-uuid>" https://unool.co/api/profile`, `middleware.ts` skipped session verification and forwarded the headers untouched to `getCurrentAuth()` (`lib/auth/server.ts:19-34`), which immediately returned `{ userId: headerUserId, workspaceId: headerWorkspaceId }`.
- **Remediation Applied**:
  - Updated `middleware.ts:185-232` to unconditionally strip `x-user-id` and `x-workspace-id` from `request.headers` on every `/api/*` request before running `supabase.auth.getUser()`, only setting them when a valid Supabase session is verified.
  - Verified by unit test `FIX-01` in `lib/utils/__tests__/forensicAuditFixes.test.ts`.

### 2.2 [FIXED] Hardcoded Super-Admin Backdoor (`BUG-002`)
- **Pre-Fix Vulnerability**:
  - `app/admin/api/login/route.ts:64-78` contained:
    ```ts
    if (!valid && emailClean === 'usha@pixenox.com') {
      if (password === 'PIXER#USHA' || password === 'PIXER@USHA') {
        valid = true;
      }
    }
    ```
  - Anyone with read access to the repository could log in as super-admin `usha@pixenox.com` regardless of the Argon2 password hash stored in `admin_users`.
- **Remediation Applied**:
  - Removed both hardcoded password backdoors from `app/admin/api/login/route.ts`.

### 2.3 [FIXED] SSRF Bypass via IPv4-Mapped IPv6 (`BUG-011`)
- **Pre-Fix Vulnerability**:
  - `lib/utils/url-validation.ts:213-216` defined `isValidIpv6` as `/^[0-9a-fA-F:]+$/`, which returned `false` for IPv4-mapped IPv6 addresses containing dots (`::ffff:127.0.0.1` or `::ffff:169.254.169.254`).
  - Both `quickUrlValidation` (line 163) and `validateUrlForFetch` (line 108: `if (!isValidIpv4(ip) && !isValidIpv6(ip)) continue;`) skipped `isPrivateIp()` when `isValidIpv6()` returned `false` (even though `isPrivateIp()` had dead code at lines 196-201 to check `::ffff:`!).
- **Remediation Applied**:
  - Updated `isValidIpv6` to strip `[` `]` brackets and validate `::ffff:<ipv4>` addresses, and changed `validateUrlForFetch` to fail closed (`return { allowed: false }`) if DNS returns 0 addresses or any unrecognized address format.
  - Verified by unit test `FIX-08` in `lib/utils/__tests__/forensicAuditFixes.test.ts`.

