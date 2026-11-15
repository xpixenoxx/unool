# UN OOL STUDIO — PROFILE REMEDIATION & PRODUCT ROADMAP + RELEASE GATES

**Audit Date**: 2026-11-15  
**Companion Blueprint**: [`PROFILE_PRODUCT_BLUEPRINT.md`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/PROFILE_PRODUCT_BLUEPRINT.md)  
**Target Outcome**: Resolve all P0 security/data-loss blockers immediately, restore template & analytics correctness across all 23 templates, unify builder UX & AI memory, and establish automated CI release gates before public production promotion.

---

## Part 16.5 — 7-Phase Implementation Roadmap

### Phase 0: Emergency Security & Spark Free Unblock *(Priority: Immediate P0 — Effort: 1–2 Days)*
- **Dependencies**: None.
- **Concrete Scope & Changes**:
  1. Remove `?workspaceId=` unauthenticated IDOR bypass & cross-workspace `findByUserId` fallback in [`app/api/profile/analytics/route.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/api/profile/analytics/route.ts#L78-L102).
  2. Fix `DEFAULT_TEMPLATE = 'minimalist'` -> `'lone'` in [`PresenceClient.tsx:151`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/dashboard/presence/PresenceClient.tsx#L151) (and map `'minimalist'` -> `'lone'` inside `isTemplateAllowedForPlan` for legacy clients).
  3. Extract shared `lib/validation/subdomain.ts` enforcing regex & full reserved list (`admin`, `api`, `ftp`, `ssh`, `vpn`, etc.) inside [`PUT/POST /api/profile`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/api/profile/route.ts) and [`subdomains/check`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/api/subdomains/check/route.ts).
  4. Reject `javascript:` / `data:` URLs in `links` & `conversationUrl`, remove raw `customCss` write capability, and wrap the 4 JSON-LD templates (`the-stack`, `the-bookshelf`, `the-cube`, `the-monolith`) in `<SafeJsonLd />` (`<` -> `\u003c`).
- **Expected Outcome**: Zero unauthenticated analytics leaks, zero `403` onboarding blockers for Free users, zero `'admin'` subdomain hijacks, zero JSON-LD script breakout XSS.
- **Acceptance Criteria & Regression Tests**:
  - `PROF-01`, `PROF-06`, `PROF-07`, `PROF-10`, `PROF-11`, `PROF-14` converted from bug-reproducing tests to permanent green security assertions (`401` on anon analytics, `200` on Spark initial save, `400` on `'admin'` / `javascript:` URLs).

---

### Phase 1: Repository, Soft-Delete & Partial Update Integrity *(Priority: P0/P1 — Effort: 2–3 Days)*
- **Dependencies**: Phase 0.
- **Concrete Scope & Changes**:
  1. Rewrite [`SupabaseProfileRepository.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/lib/repositories/supabase/SupabaseProfileRepository.ts):
     - Add `.is('deleted_at', null)` to `findById`, `findBySubdomain`, `findByUserId`, `findByWorkspaceId`, and `subdomains/check`.
     - Stop initializing `themeObj = data.theme || {}` when updating `studioProfile` or `onboardingAnswers`; use atomic JSONB merge or separate columns (`studio_profile`, `onboarding_answers`, `onboarding_completed`).
  2. Respect client-provided `version` in `PUT /api/profile` for real optimistic locking; eliminate 2-step `create` -> `update` (`v1 -> v2`) write amplification.
  3. Wire `profile_viewers` allowlist check + owner exemption inside `GET /api/profile/[subdomain]` and strip AI persona fields (`studioProfile`, `onboardingAnswers`) from public JSON.
  4. Add SSRF private/loopback IP blocklist (`127.0.0.0/8`, `10.0.0.0/8`, `169.254.169.254/32`, `::1`) and consolidate `/api/profile/generate` into `/api/profile/extract`, plus verify magic-byte image headers on `/api/profile/avatar`.
- **Acceptance Criteria & Regression Tests**:
  - `PROF-03`, `PROF-04`, `PROF-08`, `PROF-09`, `PROF-12`, `PROF-13`, `PROF-15`, `PROF-22` passing in CI + live Postgres migration verification.

---

### Phase 2: Template Runtime, Accessibility & Cross-Template Parity *(Priority: P1 — Effort: 4–5 Days)*
- **Dependencies**: Phase 0 (Safe JSON-LD helper).
- **Concrete Scope & Changes**:
  1. Replace `<style dangerouslySetInnerHTML>` dynamic `${accentColor}` interpolation (`11` templates) with React inline CSS custom properties (`style={{ '--accent': hex }}`) + `resolveAccessiblePalette()` auto-contrast (`>= 4.5:1` / `>= 3.0:1`), fixing severe failures on `vision` (`1.04:1`), `human` (`1.23:1`), `the-noren` (`2.65:1`), `the-builder` (`2.68:1`), `the-desktop` (`2.80:1`), `lone` (`2.86:1`), `rebellion` (`3.19:1`), and `RecentActivitySection` buttons/cards.
  2. Fix structural template defects observed in Chromium:
     - Declare `uniform float uScrollProgress;` in [`ClubHero3D.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/sections/ClubHero3D.tsx#L115), render CSS hero before WebGL mounts, reveal below-fold sections without `opacity: 0` viewport lock, and fix `the-club` minimal empty-state.
     - Fix `the-metro` `+1px`/`+590px` mobile horizontal overflow (`grid-cols-1`, `min-w-0`, wrapping pills).
     - Fix `(profile as any)?.activity` -> `profile.recentActivity` on `the-metro`, `the-noren`, `the-desktop`, `the-calendar`.
     - Add semantic `<h1>` on `the-machine` & `the-builder`; fix clipping on `rebellion`, `human`, `the-studio`, `the-cube`, `the-monolith`, `the-bookshelf` (plus `"Github"` -> `"GitHub"` & `Research Notes`), and `the-desktop` mobile titlebar.
     - Restore `profile.bio` rendering in `the-visionary`, strip Minimal fabricated placeholder essays across all `13` offending templates, remove dead `Call`/`WhatsApp` toast buttons in `the-bookshelf`/`the-stack`, add `prefers-reduced-motion` across all `10` missing templates, and wire `OpenToBadges` + `conversationUrl` uniformly via `<ProfileTemplateShell>`.
- **Acceptance Criteria & Regression Tests**:
  - Updated Playwright Chromium matrix across all `23 × 4` runs achieves: **`0` JS/WebGL errors, `0` `>0px` horizontal overflow, `100%` `hasH1 = true`, `0` WCAG AA text contrast violations (`<4.5:1`), `<= 40` char text on Minimal fixtures**.

---

### Phase 3: Unified Builder UX & Native Lead/Contact Capture *(Priority: P1 — Effort: 4–5 Days)*
- **Dependencies**: Phases 0–2.
- **Concrete Scope & Changes**:
  1. Split & upgrade `PresenceClient.tsx` (`1,737` LOC) into a persistent desktop split-screen builder (`Identity`, `Links & Proof`, `Appearance & Templates`, `Domain, Privacy & Analytics`) with live Desktop/Mobile viewport toggle visible on **all** tabs.
  2. Merge `TemplateGallery` + `TemplateSelector` into `<UnifiedTemplatePicker>` with search, category pills, upfront `Spark Free` vs `Creator/Pro` plan gating (`isTemplateAllowedForPlan`), Accent Color + WCAG indicator, and Section Visibility controls.
  3. Expose UI controls for `visibility` (`Public` / `Private`), `profile_viewers` invite manager, and template metadata (`location`, `timezone`, `availabilityBadge`), plus `beforeunload` warning & explicit error/conflict banners (`403`/`409`/`500`).
  4. Replace `TemplatesTab` & `TemplateAnalyticsTab` inside `SettingsClient.tsx` with clean redirects to `/dashboard/profile` and eliminate `memoryPresenceProfile`/`memorySettingsTemplate` cross-account leak vectors.
  5. Implement `POST /api/profile/contact` + `profile_leads` storage and wire all templates (starting with `ClubTemplateV2`) to a unified Contact Modal when `conversationUrl` is unset.
- **Acceptance Criteria & Regression Tests**:
  - `PROF-02`, `PROF-05`, `PROF-21`, `PROF-32`, `PROF-33`, `PROF-34` pass in React Testing Library + Playwright authenticated builder E2E.

---

### Phase 4: AI Personalization & Context Unification *(Priority: P1 — Effort: 2–3 Days)*
- **Dependencies**: Phase 1 (`studio_profile` decoupling).
- **Concrete Scope & Changes**:
  1. Replace `buildStudioContext` input handling with unified `buildCreatorIdentityContext(profile)` merging `studioProfile` + public identity (`name`, `headline`, `role`, `company`, `bio`, `proofPoints`).
  2. Fix field propagation drops in [`app/api/studio/ideas/route.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/api/studio/ideas/route.ts) (preserve `style`, `interests`) and [`WeekArcGenerator.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/lib/ai/WeekArcGenerator.ts) (preserve `businessStage`, `businessDomain`, `workInterests`).
  3. Upgrade prompt-injection sanitization in `lib/ai/studioContext.ts` from `^`-anchored matching to full multi-line / structural delimiter escaping; allow `POST /api/composer/adapt` to succeed gracefully even before first profile save.
- **Acceptance Criteria & Regression Tests**:
  - `PROF-27`, `PROF-28`, and updated `studioIdeas.test.ts` / `studioContext.test.ts` assert zero dropped fields & mid-string injection neutralization.

---

### Phase 5: Analytics Integrity, Repo Test Repair & SSR Performance *(Priority: P1/P2 — Effort: 3–4 Days)*
- **Dependencies**: Phases 1–3.
- **Concrete Scope & Changes**:
  1. Fix [`app/api/profile/analytics/route.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/api/profile/analytics/route.ts): eliminate `templateUsageMap` `2×` double-counting (`L186`/`L210`), fix `.split(':')` HTTPS URL truncation (`L257`), register all `23+` templates in `TEMPLATE_NAMES`, replace `avgSessionDuration: 45` mock value, fix `SettingsClient` `profileId: workspaceId`, and move raw event aggregation to parameterized Postgres RPC / indexed range queries.
  2. Convert `app/u/[subdomain]/page.tsx` to Server Component SSR (`60s` ISR + `revalidateTag` on profile save/publish) eliminating double DB queries and spinner LCP flash.
  3. Sync stale assertions in [`lib/limits/freeTier.test.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/lib/limits/freeTier.test.ts) (`11` failing tests) against authoritative `PLANS_FALLBACK` billing limits.
- **Acceptance Criteria & Regression Tests**:
  - `PROF-23`, `PROF-24`, `PROF-25`, `PROF-37` pass; existing `vitest run` reaches `100%` pass rate (`8/8` files, `0` failures).

---

### Phase 6: Template Family Consolidation, Custom Domains & `The Bento` Archetype *(Priority: P2 — Effort: 5–7 Days)*
- **Dependencies**: Phases 2–5.
- **Concrete Scope & Changes**:
  1. Consolidate the `8` redundant SaaS card templates (`lover`, `lone`, `energy`, `vision`, `the-hustler`, `the-aesthete`, `the-creator`, `the-voice`) onto a shared configurable `EditorialCardEngine` with `ThemePresetConfig` (preserving all existing template URLs/IDs cleanly via alias mapping).
  2. Launch **`The Bento`** archetype + upgraded `ProfileLink v2` schema (`subtitle`, `tileSize`, `isPinned`) & `ProofPoint` URL verification link support.
  3. Implement Pro/Studio Custom Domain CNAME verification UI + middleware host resolution (`yourname.com` -> `/u/[subdomain]`).
- **Acceptance Criteria & Regression Tests**:
  - Bundle size per template compliant with `registry.ts` budgets (`25KB–150KB`), full Bento Playwright viewport sweep (`0` overflow / `0` contrast failures), custom domain middleware integration tests.

---

## Part 17 — Mandatory Production Release Gates

No Profile change set may be promoted to production unless **every** gate below passes on clean CI/Staging runners after the final mutation:

| Gate | Objective Pass Threshold | Required Proof Artifact |
| :--- | :--- | :--- |
| **1. Security & Privacy Gate** | `0` unauthenticated IDOR routes (`analytics`), `0` reserved-word/protocol bypasses (`admin`, `javascript:`), `0` JSON-LD / `<style>` XSS vectors, `0` `deleted_at` leaks, verified live Supabase Postgres RLS tests (`anon` vs `auth` vs `service_role`) enforcing private profiles & `profile_viewers`, SSRF CIDR tests blocking `169.254.169.254` / loopback. | API Security Vitest + Live DB RLS Test Log (`0` failures) |
| **2. Functional & Entitlement Gate** | Spark Free users save initial profile cleanly (`200 OK`); plan UI matches server enforcement (`SPARK_FREE_TEMPLATE_IDS`); Studio/Onboarding saves preserve `theme.template` & `conversationUrl` `100%`; optimistic concurrency rejects stale `version` (`409`); zero `404` endpoints (`POST /api/profile/contact` returns `201`); zero dead buttons. | Full Integration Suite + Builder E2E Log |
| **3. Visual & Responsive Gate** | Real Chromium Playwright run across **all** templates (`1440×900`, `390×844` Full, Minimal, Extreme): `0` crashes, `0` console/WebGL errors, **`0px` horizontal overflow** everywhere, `<= 40` char text on Minimal fixture (zero fabricated placeholders), and clean screenshot visual diff (`the-club` hero & fold visible, `the-metro` contained, `the-desktop` unclipped, `the-noren` panels visible). | Playwright Visual Matrix + PNG Diff Report |
| **4. Accessibility (WCAG 2.1 AA) Gate** | `100%` of templates expose exactly one `<h1>`, **`0` elements `< 4.5:1` (`< 3.0:1` large)** contrast ratio in Light/Dark/Accent modes, `100%` keyboard reachable controls (`Tab`/`Enter`/drawer escape), decorative SVGs marked `aria-hidden="true"`, and `@media (prefers-reduced-motion: reduce)` honored universally. | Axe/Chromium Contrast & Landmark Audit (`0` violations) |
| **5. Performance & Scale Gate** | SSR TTFB `< 250ms` cached on `/u/[subdomain]` (no client waterfall spinner), zero broken shader compilations, bundle sizes strictly within `registry.ts` budgets (`<= maxBundleSizeKB`), `analytics` SQL RPC queries run `< 150ms` at `100k` event rows. | Lighthouse/Bundle Analyzer + Load Query Benchmark |
| **6. AI Personalization Gate** | All `StudioProfile` fields (`role`, `doing`, `audience`, `tone`, `style`, `interests`, `businessStage`, `businessDomain`, `workInterests`) + Public Profile identity propagate intact to `studioIdeas`, `PostAdapter`, and `WeekArcGenerator` without `400` failures or mid-string prompt injection bypasses. | AI Context Unit & Route Suite (`0` drops) |
| **7. Verification Integrity Gate** | `tsc --noEmit` (`0` errors), full repository `vitest run` (`100%` passing — `freeTier.test.ts` synced), production Next.js build (`next build` exit `0`), and staging full-stack Playwright `e2e/public-profile.spec.ts` passing against real Supabase + R2 + Upstash Redis. | Clean Post-Edit CI Pipeline Log |

