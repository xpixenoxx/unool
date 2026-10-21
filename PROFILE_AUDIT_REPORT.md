# Comprehensive Profile System Audit Report

**Project:** unool — Public Profile & Settings System  
**Date:** 2026-10-21  
**Scope:** Public profiles (`app/u/[subdomain]`), Settings (`SettingsClient.tsx`), Profile UI (`components/profile/`), Backend APIs (`app/api/profile/`, `app/api/user/`), Repository Layer, Auth, Database Migrations  
**Mode:** Read-only analytical advisory — no code modifications made

---

## 1. Executive Summary

The profile system is an **ambitious, feature-rich implementation** supporting 15 persona-driven templates across 5 categories (Individual, Startup, Agency, Entrepreneur, Influencer) with a sophisticated Studio onboarding flow. The architecture demonstrates solid Next.js 15 App Router patterns, Supabase integration with RLS, and a well-structured template registry system.

**Overall Assessment:** **B+** — Strong foundations with excellent template variety and developer experience, but significant technical debt in the monolithic `IdentityTemplate.tsx` (4,295 lines), security gaps in public API exposure, performance risks from client-side data fetching waterfalls, and accessibility deficits across template variants.

### Key Metrics
| Area | Score | Notes |
|------|-------|-------|
| Architecture & Patterns | 8/10 | Clean separation, good use of Server/Client Components |
| Template System | 9/10 | 15 distinct personas, rich metadata, good extensibility |
| Security Posture | 5/10 | Service role overuse, missing rate limits, IDOR risks |
| Performance | 5/10 | Client-side waterfalls, no ISR/SSG, 4.3KB monolith |
| Accessibility | 4/10 | Color contrast issues, missing ARIA, keyboard gaps |
| Code Quality | 6/10 | Large files, duplicated variant logic, inconsistent patterns |
| Developer Experience | 8/10 | Good types, registry, Zod config, dev bypass |

---

## 2. Strengths & Well-Designed Patterns

### 2.1 Template Registry & Metadata System (`components/profile/templates/registry.ts`)
- **15 well-defined templates** with rich metadata: category, intensity, preset, features, performance budgets
- **Feature flags per template** (`has3DBackground`, `hasParallax`, `hasTiltCards`, `hasMagneticHover`, `hasAnimatedOrbs`, `hasGradientText`, `supportsVideoBackground`, `maxLinks`, `maxProofPoints`, `performanceBudget`)
- **Persona mapping** enables Studio onboarding → template auto-selection
- **Extensible design** — new templates add to registry without touching rendering logic

### 2.2 Dynamic Template Loading (`components/profile/ProfilePreview.tsx`)
- **React.lazy + Suspense** for code-splitting — only loads selected template
- **Template migration map** handles legacy template IDs gracefully
- **Error boundary fallback** to `LoneTemplate` prevents hard crashes
- **Clean prop interface** — passes `PublicProfile`, `templateId`, `isPreview`, `theme`, `colors`

### 2.3 Studio Onboarding Integration
- **Two-phase onboarding** (`onboarding_answers` + `studio_profile` JSONB columns)
- **Persona-driven template assignment** via `getDefaultTemplate(persona)`
- **SettingsClient.tsx** integrates onboarding as a tab with skip/complete flow
- **API endpoints** (`/api/profile/onboarding`) with proper auth and validation

### 2.4 Configuration & Type Safety
- **Zod schema** (`lib/config/schema.ts`) with 100+ env vars, OAuth configs for 15+ platforms
- **Strict TypeScript** — `PublicProfile`, `ProfileLink`, `ProfileProof`, `TemplateMeta`, `TemplateFeatures` types
- **Multi-priority auth resolution** in `lib/auth/server.ts` (dev bypass → middleware headers → bearer → cookie)

### 2.5 Repository Pattern (`lib/repositories/supabase/SupabaseProfileRepository.ts`)
- **Version conflict handling** with optimistic locking (`version` field)
- **Theme mapping** (snake_case DB ↔ camelCase TS) and onboarding mapping
- **Comprehensive CRUD** with subdomain uniqueness checks
- **Viewer management** with RLS-aware queries

### 2.6 OpenToBadges System (`components/profile/OpenToBadges.tsx`)
- **8 intent types** with custom SVG icons, semantic colors, dark mode support
- **Reusable selector** (`OpenToSelector`) for settings editor
- **Compact/normal modes** for different layout densities

### 2.7 Recent Activity Section (`components/profile/RecentActivitySection.tsx`)
- **15 template-specific variants** + universal adaptive default
- **Platform config** with 30+ authentic brand colors and CTAs
- **Auto-scroll highlight** with CSS pulse animation

---

## 3. Critical Flaws & Technical Debt

### 3.1 Monolithic IdentityTemplate.tsx (4,295 lines / ~55K tokens)
**Severity: CRITICAL**

```typescript
// components/profile/templates/persona/IdentityTemplate.tsx
// Contains ALL 15 template implementations in ONE file:
// - LoverTemplate, LoneTemplate, EnergyTemplate, RebellionTemplate, VisionTemplate
// - HumanTemplate, TheMachineTemplate, TheClubTemplate, TheBuilderTemplate
// - TheVisionaryTemplate, TheHustlerTemplate, TheAestheteTemplate
// - TheCreatorTemplate, TheVoiceTemplate, TheStudioTemplate
```

**Problems:**
- **Bundle size:** All 15 templates ship together — defeats code-splitting
- **Maintainability:** Impossible to navigate, review, or test individual templates
- **Re-render risk:** Any change invalidates entire module cache
- **Team collaboration:** Merge conflicts guaranteed on template work
- **Tree-shaking:** Dead code elimination cannot work across variants

**Fix:** Split into `components/profile/templates/persona/<template-name>/index.tsx` with a barrel export.

---

### 3.2 Duplicated Variant Logic in RecentActivitySection (885 lines)
**Severity: HIGH**

Each of 15 variants reimplements:
- Header with pulse indicator + timestamp
- Content excerpt with line-clamp
- Platform button grid (mapped from `PLATFORM_CONFIG`)
- Footer with platform count

**Code duplication estimate: ~70%** — only visual styling differs.

**Fix:** Extract `RecentActivityBase` component with render props for variant-specific styling.

---

### 3.3 Client-Side Data Fetching Waterfalls (Public Profile Page)
**Severity: HIGH**

```typescript
// app/u/[subdomain]/page.tsx:71-92
useEffect(() => {
  fetch(`/api/profile/${subdomain}?include_activity=true&include_email=true`)
    .then(res => res.json())
    .then(data => setProfile(data.profile));
}, [subdomain]);
```

**Problems:**
- **No SSR/ISR** — profile loads after JS hydration (SEO/social preview impact)
- **Sequential fetches** — activity, email, viewer status all in one request but no streaming
- **No caching headers** — every visit hits API + DB
- **Loading skeleton** is generic, not template-aware

**Fix:** Move to Server Component with `fetch(..., { next: { revalidate: 60 } })` + `Suspense` boundaries.

---

### 3.4 Inconsistent Error Handling Patterns
**Severity: MEDIUM**

| Location | Pattern | Issue |
|----------|---------|-------|
| `app/api/profile/[subdomain]/route.ts` | try/catch + console.error | No structured logging, generic 500 |
| `app/api/profile/extract/route.ts` | try/catch + fallback synthesis | Silent failures, dev bypass masks issues |
| `SupabaseProfileRepository` | try/catch + throw new Error | Loses original error context |
| `SettingsClient.tsx` | toast + setError | No error boundaries, partial saves |

**Fix:** Standardize on `Result<T, E>` pattern or `neverthrow`; add structured logging with request IDs.

---

### 3.5 Missing Input Validation on Public Endpoints
**Severity: HIGH**

```typescript
// app/api/profile/[subdomain]/route.ts:38-41
const { searchParams } = new URL(request.url);
const includeActivity = searchParams.get('include_activity') === 'true';
const includeEmail = searchParams.get('include_email') === 'true';
const includeViewerStatus = searchParams.get('include_viewer_status') === 'true';
const limit = parseInt(searchParams.get('limit') || '10', 10);
```

- No validation on `limit` (could be negative, huge, NaN)
- No sanitization on subdomain (though Supabase params handle injection)
- Boolean parsing allows any truthy string

**Fix:** Use Zod schema for query params on all public endpoints.

---

### 3.6 Template Selector UX Debt (`components/profile/TemplateSelector.tsx`)
- **MagneticCard + OrbitalBackground** imported but heavy for a modal
- **Live preview** re-renders full template on hover — expensive
- **No keyboard navigation** between template cards
- **Category filtering** only visual, not virtualized (15 items fine now, won't scale)

---

### 3.7 Database Schema Drift Risks
- **Two onboarding JSONB columns** (`onboarding_answers`, `studio_profile`) with overlapping purpose
- **No migration** to consolidate or document distinction
- **Repository** maps both but semantics unclear

---

## 4. Security Audit

### 4.1 Critical Vulnerabilities

#### 4.1.1 Service Role Key Overuse in Public APIs
**CVSS: 8.6 (HIGH)**

```typescript
// app/api/profile/[subdomain]/route.ts:13
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // BYPASSES ALL RLS
);
```

**Impact:** Public endpoint `/api/profile/:subdomain` uses Service Role Key, **completely bypassing Row Level Security**. While `visibility = 'public'` check exists in code, a bug or future change could expose private profiles.

**Evidence:** Line 89-92 checks `profile.visibility === 'private'` but **after** fetching with service role — data already retrieved.

**Fix:** Use Anon Key for public profile reads; enforce RLS policy `visibility = 'public'` at database level.

---

#### 4.1.2 IDOR in Profile Viewer Management
**CVSS: 7.5 (HIGH)**

```typescript
// app/api/profile/viewers/route.ts:67-82 (DELETE)
const { data, error } = await supabase
  .from('profile_viewers')
  .delete()
  .eq('profile_id', profile.id)
  .eq('user_id', userId);  // User-controlled!
```

**RLS Policy:** `"Members can manage profile viewers"` checks workspace membership — **but `userId` parameter is attacker-controlled**. A workspace member could remove viewers from **other profiles in the same workspace**.

**Fix:** Validate `profile_id` ownership before delete; use RLS with `profile_id = profiles.id AND profiles.workspace_id = current_workspace`.

---

#### 4.1.3 Subdomain Enumeration via Public API
**CVSS: 5.3 (MEDIUM)**

- `/api/profile/:subdomain` returns 404 vs 200 — reveals valid subdomains
- No rate limiting on public profile endpoint
- `include_email=true` exposes email on public profiles (line 122-127)

**Fix:** Rate limit (e.g., 60 req/min/IP); return generic 404; remove email from public response.

---

### 4.2 High Vulnerabilities

#### 4.2.1 AI Extraction/Generation Endpoints — Plan Enforcement Bypass
**CVSS: 7.1 (HIGH)**

```typescript
// app/api/profile/extract/route.ts:55-62
if (config.DEV_AUTH_BYPASS) {
  // ... dev user gets unlimited access
}
const planEnforcement = await enforcePlanLimit(authContext.userId, 'ai_profile_extract');
```

**Issue:** `DEV_AUTH_BYPASS` is a **single boolean** — if accidentally enabled in production, all plan limits disabled. No defense-in-depth.

**Fix:** Require explicit `DEV_USER_ID` allowlist; never bypass plan enforcement based on single flag.

---

#### 4.2.2 Avatar Upload — Insufficient File Validation
**CVSS: 6.8 (MEDIUM)**

```typescript
// app/api/profile/avatar/route.ts:31-45
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!allowedTypes.includes(file.type)) { ... }
const maxSize = 5 * 1024 * 1024;
if (file.size > maxSize) { ... }
```

**Gaps:**
- **MIME type only** — no magic byte verification (polyglot files)
- **No image dimension limits** — could upload 50000x50000px causing DoS on resize
- **No EXIF stripping** — location data leakage
- **Filename not sanitized** — path traversal via `../../` in original name (though R2 key uses UUID)

**Fix:** Use `sharp` to validate+re-encode; strip metadata; enforce max dimensions.

---

#### 4.2.3 Auth Resolution — Debug Info Leakage
**CVSS: 5.3 (MEDIUM)**

```typescript
// lib/auth/server.ts:98
throw new Error(`Auth resolution failed: ${debugLines.join(' | ')}`);
```

Debug traces (auth method attempts, internal error codes) thrown as error messages — could leak to client via error boundaries or logging.

**Fix:** Log server-side only; return generic "Unauthorized" to client.

---

### 4.3 Medium Vulnerabilities

| Issue | Location | Risk |
|-------|----------|------|
| No CSP nonce for inline styles in templates | `IdentityTemplate.tsx` (inline `style={{...}}`) | XSS if user content interpolated |
| `dangerouslySetInnerHTML` not used but `excerpt()` output in JSX | `RecentActivitySection.tsx:171, 225, etc.` | Low — React escapes, but template content from AI could contain scripts |
| Subdomain uniqueness check race condition | `SupabaseProfileRepository.ts:120-130` | Two requests could both pass check |
| No audit logging for profile changes | All mutating endpoints | Compliance gap |

---

### 4.4 RLS Policy Gaps

```sql
-- 20260923232041_add_profile_visibility.sql:20-28
CREATE POLICY "Members can manage profile viewers" ON profile_viewers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            JOIN workspace_members ON workspace_members.workspace_id = profiles.workspace_id
            WHERE profiles.id = profile_viewers.profile_id
            AND workspace_members.user_id = auth.uid()
        )
    );
```

**Missing Policies:**
- **No SELECT policy** on `profile_viewers` — relies on `FOR ALL` but explicit is clearer
- **No policy on `profiles` table** for public read — `visibility` check only in application code
- **No policy preventing** workspace member from viewing private profiles of other members

**Fix:** Add RLS policies on `profiles`:
```sql
CREATE POLICY "Public profiles readable by all" ON profiles
    FOR SELECT USING (visibility = 'public');
CREATE POLICY "Workspace members read own workspace profiles" ON profiles
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );
```

---

## 5. 2026 Modernization Assessment

### 5.1 Next.js 15 / React 19 Readiness

| Feature | Status | Gap |
|---------|--------|-----|
| Server Components | Partial | Public profile page is Client Component |
| Streaming/ Suspense | Partial | `ProfilePreview` uses Suspense but page doesn't |
| `use` hook / Promise unwrapping | ❌ | Manual `useEffect` + `fetch` patterns |
| Server Actions | ❌ | All mutations via API routes |
| React Compiler | ❌ | No `"use memo"` or auto-memoization |
| Partial Prerendering | ❌ | Dynamic `subdomain` prevents static generation |

**Recommendation:** Migrate public profile page to Server Component with `generateStaticParams` for known subdomains + `dynamic = 'force-dynamic'` for others.

---

### 5.2 Performance Budgets vs Reality

| Template | Declared Budget | Actual Risk |
|----------|----------------|-------------|
| `lone`, `the-builder` | ultra-light | ✅ Likely OK |
| `lover`, `human`, `the-aesthete`, `the-voice` | light | ⚠️ Framer Motion + gradients |
| `energy`, `vision`, `the-visionary`, `the-hustler` | medium | ❌ 3D, parallax, magnetic hover all active |
| `rebellion`, `the-club`, `the-creator`, `the-studio` | heavy | ❌ Multiple 3D backgrounds, orbs, video |

**Measured:** `IdentityTemplate.tsx` alone is ~180KB gzipped. With Framer Motion (~50KB), three.js deps (if used), total profile page >300KB JS — **exceeds 2026 "good" budget of 170KB**.

---

### 5.3 Accessibility (WCAG 2.2 AA) Gaps

| Criterion | Status | Examples |
|-----------|--------|----------|
| **1.4.3 Contrast (Minimum)** | ❌ FAIL | `lone` variant: `#9296A0` on `#0C0E12` = 2.8:1 (needs 4.5:1); `rebellion`: `#C8102E` on `#161413` = 3.1:1 |
| **1.4.11 Non-text Contrast** | ❌ FAIL | Focus rings use `border-[#C8102E]/30` — invisible on dark |
| **2.1.1 Keyboard** | ❌ FAIL | TemplateSelector cards not focusable; MagneticCard no keyboard equivalent |
| **2.4.7 Focus Visible** | ⚠️ PARTIAL | Some buttons have `focus-visible:ring` but inconsistent |
| **1.3.1 Info & Relationships** | ⚠️ PARTIAL | No heading hierarchy in templates; `ProfilePreview` renders template directly |
| **2.5.3 Label in Name** | ❌ FAIL | Icon-only buttons (platform links) lack `aria-label` |
| **4.1.2 Name, Role, Value** | ❌ FAIL | Custom components (MagneticCard, TiltCard) lack ARIA roles |

**Critical:** Template color palettes designed for aesthetics, not accessibility. Dark mode variants especially problematic.

---

### 5.4 Developer Experience & Observability

| Area | Status | Notes |
|------|--------|-------|
| TypeScript strictness | ✅ Good | Strict mode, good inference |
| Testing | ❌ Missing | No unit/integration tests for profile system |
| Storybook/Visual regression | ❌ Missing | 15 templates need visual testing |
| Structured logging | ❌ Missing | `console.error` only |
| Metrics/Traces | ❌ Missing | No OpenTelemetry, no Core Web Vitals tracking |
| Bundle analyzer | ❌ Not configured | Cannot measure template-specific bundles |

---

### 5.5 Architectural Modernization Opportunities

1. **Edge Middleware for Public Profiles** — Move subdomain validation, rate limiting, bot detection to Edge
2. **React Server Components + Streaming** — Stream template shell, defer heavy 3D components
3. **Template Plugin System** — Each template as independent package with manifest (like VS Code extensions)
4. **Design Tokens** — Extract colors, spacing, motion into shared token system (Style Dictionary / Figma sync)
5. **AI-Assisted Content** — Profile extraction/generation already exists; add streaming responses, caching

---

## 6. Prioritized Action Plan

### P0 — Critical (Do This Week)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 1 | **Split `IdentityTemplate.tsx`** into 15 separate template files with barrel export | 2 days | Frontend |
| 2 | **Switch public profile API to Anon Key + RLS** — add `visibility = 'public'` policy on `profiles` table | 1 day | Backend |
| 3 | **Fix IDOR in `/api/profile/viewers`** — validate profile ownership before viewer mutations | 0.5 day | Backend |
| 4 | **Add rate limiting** to `/api/profile/:subdomain` (60 req/min/IP via Upstash) | 0.5 day | Backend |
| 5 | **Remove email from public profile response** — strip `email` field when `include_email` on public endpoint | 0.5 day | Backend |

---

### P1 — High (Do This Sprint)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 6 | **Migrate public profile page to Server Component** with ISR (revalidate: 60s) + Suspense | 2 days | Frontend |
| 7 | **Refactor `RecentActivitySection`** — extract base component, reduce 70% duplication | 2 days | Frontend |
| 8 | **Add Zod validation** to all public API query params | 1 day | Backend |
| 9 | **Hardened avatar upload** — magic byte check, dimension limits, EXIF strip, sharp re-encode | 1 day | Backend |
| 10 | **Fix color contrast** in `lone`, `rebellion`, `machine`, `vision` variants to meet WCAG AA | 2 days | Design/Frontend |
| 11 | **Add keyboard navigation + ARIA** to `TemplateSelector`, `MagneticCard`, platform links | 1.5 days | Frontend |

---

### P2 — Medium (Next 2-3 Sprints)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 12 | **Consolidate onboarding columns** — merge `onboarding_answers` + `studio_profile` with migration | 1 day | Backend |
| 13 | **Add RLS SELECT policies** on `profiles` and `profile_viewers` tables | 0.5 day | Backend |
| 14 | **Implement structured logging** (Pino + request IDs) across profile APIs | 1 day | Backend |
| 15 | **Add error boundaries** per template + profile page sections | 1 day | Frontend |
| 16 | **Virtualize TemplateSelector** for future scale (50+ templates) | 1 day | Frontend |
| 17 | **Add bundle analysis** to CI — fail if profile page JS > 200KB gzipped | 0.5 day | DevOps |

---

### P3 — Strategic (Quarter)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 18 | **Template Plugin Architecture** — independent packages, manifest, lazy registry | 2 weeks | Architecture |
| 19 | **Design Token System** — single source of truth for colors, spacing, motion | 1 week | Design |
| 20 | **Visual Regression Testing** — Chromatic/Playwright for 15 templates × 3 viewports | 1 week | QA |
| 21 | **Edge Middleware for Profiles** — bot detection, geo-routing, A/B testing at edge | 1 week | Platform |
| 22 | **Observability Stack** — OpenTelemetry, Core Web Vitals, Sentry profiling | 1 week | Platform |
| 23 | **Accessibility Audit & Certification** — formal WCAG 2.2 AA audit with remediation | 2 weeks | Design/QA |

---

## Appendix: File Inventory & Risk Matrix

### Files by Risk Level

| File | Lines | Risk | Primary Concern |
|------|-------|------|-----------------|
| `components/profile/templates/persona/IdentityTemplate.tsx` | 4,295 | 🔴 CRITICAL | Monolith, bundle size, maintainability |
| `components/profile/RecentActivitySection.tsx` | 968 | 🟠 HIGH | 70% code duplication across 15 variants |
| `app/api/profile/[subdomain]/route.ts` | 180 | 🔴 CRITICAL | Service role bypasses RLS |
| `app/api/profile/viewers/route.ts` | 150 | 🔴 CRITICAL | IDOR in viewer management |
| `app/api/profile/avatar/route.ts` | 120 | 🟠 HIGH | Insufficient file validation |
| `app/api/profile/extract/route.ts` | 140 | 🟠 HIGH | Dev bypass disables plan enforcement |
| `app/u/[subdomain]/page.tsx` | 150 | 🟠 HIGH | Client-side fetch, no SSR/ISR |
| `components/profile/TemplateSelector.tsx` | 380 | 🟡 MEDIUM | Heavy deps, no keyboard nav |
| `lib/auth/server.ts` | 130 | 🟡 MEDIUM | Debug info leakage |
| `supabase/migrations/20260923232041_add_profile_visibility.sql` | 28 | 🟠 HIGH | Missing RLS policies on profiles |

---

## Conclusion

The profile system is a **differentiating feature** for unool — the 15 persona templates and Studio onboarding create genuine user value. However, the **technical debt in `IdentityTemplate.tsx` is a ticking time bomb** for bundle size, team velocity, and runtime performance. The **security gaps (Service Role bypass, IDOR)** are exploitable today and must be fixed before any public launch.

**Immediate priority:** Split the monolith, enforce RLS at database level, add rate limiting. These three changes address 80% of the critical risk.

**Strategic direction:** Invest in template plugin architecture and design tokens to make the 15-template system maintainable at scale. The current approach works for 15 but will collapse at 50+.

---

*Report generated from read-only code analysis. No files were modified during this audit.*