# Profile System Implementation Tracker

> **Status Legend:** `[ ]` Not Started | `[~]` In Progress | `[x]` Complete | `[!]` Blocked

---

## P0 — Critical Security & Architecture (Must Fix First)

### [x] **P0-T1: Split IdentityTemplate.tsx Monolith** (4,295 lines → 15 files + barrel)
- **Target:** `components/profile/templates/persona/` — create 15 individual template files + `index.ts` barrel export
- **Files to create:**
  - `components/profile/templates/persona/lover/index.tsx` — `LoverTemplate`
  - `components/profile/templates/persona/lone/index.tsx` — `LoneTemplate`
  - `components/profile/templates/persona/energy/index.tsx` — `EnergyTemplate`
  - `components/profile/templates/persona/rebellion/index.tsx` — `RebellionTemplate`
  - `components/profile/templates/persona/vision/index.tsx` — `VisionTemplate`
  - `components/profile/templates/persona/human/index.tsx` — `HumanTemplate`
  - `components/profile/templates/persona/the-machine/index.tsx` — `MachineTemplate`
  - `components/profile/templates/persona/the-club/index.tsx` — `ClubTemplate` (note: uses `ClubTemplateV2`)
  - `components/profile/templates/persona/the-studio/index.tsx` — `StudioTemplate`
  - `components/profile/templates/persona/the-builder/index.tsx` — `BuilderTemplate`
  - `components/profile/templates/persona/the-visionary/index.tsx` — `VisionaryTemplate`
  - `components/profile/templates/persona/the-hustler/index.tsx` — `HustlerTemplate`
  - `components/profile/templates/persona/the-aesthete/index.tsx` — `AestheteTemplate`
  - `components/profile/templates/persona/the-creator/index.tsx` — `CreatorTemplate`
  - `components/profile/templates/persona/the-voice/index.tsx` — `VoiceTemplate`
- **Barrel export:** `components/profile/templates/persona/index.ts`
- **Update:** `components/profile/ProfilePreview.tsx` dynamic imports, `components/profile/templates/registry.ts`
- **Verification:** `npx tsc --noEmit` — zero type errors

### [ ] **P0-T2: Fix Public Profile API — Switch to Anon Key + RLS**
- **File:** `app/api/profile/[subdomain]/route.ts`
- **Change:** Replace `createClient(SUPABASE_URL, SERVICE_ROLE_KEY)` with `createClient(SUPABASE_URL, ANON_KEY)`
- **Add:** RLS policy `public_profile_select` on `profiles` table for `WHERE visibility = 'public'`
- **Migration:** Create new migration for RLS policy
- **Verification:** Test public profile fetch without auth; verify private profiles return 404

### [ ] **P0-T3: Fix IDOR in `/api/profile/viewers/route.ts`**
- **File:** `app/api/profile/viewers/route.ts`
- **Fix:** Add ownership check — verify requester owns the profile before returning viewer data
- **Current:** Returns viewers for any `subdomain` without auth validation
- **Required:** `getCurrentAuth(request)` → validate `workspaceId` matches profile's workspace

### [ ] **P0-T4: Add Rate Limiting to Public Profile Endpoint**
- **File:** `app/api/profile/[subdomain]/route.ts`
- **Add:** Upstash Redis rate limit (e.g., 60 req/min per IP)
- **Config:** Use `RATE_LIMIT_PROFILE_PUBLIC_PER_MIN` env var (default 60)

### [ ] **P0-T5: Remove Email from Public Profile Response**
- **File:** `app/api/profile/[subdomain]/route.ts`
- **Change:** Strip `email` field from response JSON before returning
- **Verify:** Public API response no longer contains `email`

---

## P1 — High Priority Fixes

### [ ] **P1-T1: Consolidate Duplicate Social Icon Logic**
- **Files:** `IdentityTemplate.tsx` (multiple `getSocialSvgPath`, `getAestheteSocialIcon`), `VoiceTemplate.tsx` (`getSocialIcon`)
- **Target:** Create `components/profile/templates/utils/socialIcons.ts` shared utility
- **Update:** All templates to import from shared utility

### [ ] **P1-T2: Unify RecentActivitySection Variants** (15 variants → config-driven)
- **File:** `components/profile/RecentActivitySection.tsx` (968 lines)
- **Approach:** Extract variant configs into `components/profile/templates/activityVariants.ts`
- **Benefit:** Single component, easier to maintain, consistent behavior

### [ ] **P1-T3: Add Input Validation to Avatar Upload**
- **File:** `app/api/profile/avatar/route.ts`
- **Add:** File type check (image/*), size limit (5MB), sanitize filename
- **Return:** Proper error codes (400 for invalid type, 413 for too large)

### [ ] **P1-T4: Optimize Template Registry with Lazy Loading**
- **File:** `components/profile/ProfilePreview.tsx`, `components/profile/templates/registry.ts`
- **Change:** Ensure all templates use `React.lazy` + `Suspense`
- **Add:** Loading fallback skeleton per template category

### [ ] **P1-T5: Add Subdomain Uniqueness Check at DB Level**
- **Migration:** Add unique index on `profiles.subdomain` where `deleted_at IS NULL`
- **API:** `app/api/profile/route.ts` — handle unique violation with 409 error

---

## P2 — Code Quality & Maintainability

### [ ] **P2-T1: Extract Template Props Interface**
- **File:** `components/profile/templates/types.ts`
- **Define:** `TemplateProps` interface with all profile fields
- **Update:** All 15 template files to use typed props

### [ ] **P2-T2: Add Template Performance Budgets**
- **File:** `components/profile/templates/registry.ts`
- **Add:** `maxBundleSizeKB`, `maxRenderMs` per template
- **CI:** Add bundle size check script

### [ ] **P2-T3: Document Template Customization API**
- **File:** `docs/profile-templates.md` (create)
- **Content:** How to add new templates, override styles, extend props

### [ ] **P2-T4: Add E2E Tests for Public Profile Flow**
- **Target:** Playwright tests for `app/u/[subdomain]/page.tsx`
- **Scenarios:** Public profile loads, private returns 404, rate limit triggers

### [ ] **P2-T5: Migrate SettingsClient.tsx Tabs to Separate Components**
- **File:** `app/dashboard/settings/SettingsClient.tsx` (1,340 lines)
- **Split:** Each tab → own component in `components/dashboard/settings/tabs/`

---

## P3 — Polish & Future-Proofing

### [ ] **P3-T1: Add Template Preview in Settings**
- **Feature:** Live preview pane in template selector modal

### [ ] **P3-T2: Template Analytics Dashboard**
- **Feature:** Track template usage, conversion, performance

### [ ] **P3-T3: Accessibility Audit**
- **Scope:** All 15 templates + ProfilePreview + SettingsClient
- **Focus:** Color contrast, ARIA labels, keyboard navigation

---

## Implementation Log

| Date | Task | Status | Notes |
|------|------|--------|-------|
| 2026-10-21 | P0-T1 | Complete | Split IdentityTemplate.tsx into 15 individual template files + barrel export; updated ProfilePreview.tsx dynamic imports; all template files type-check (pre-existing dependency errors in unrelated files remain) |
| 2026-10-21 | P0-T2 | Not Started | Fix Public Profile API — Switch to Anon Key + RLS |
| | | | |
| | | | |

---

## Verification Gates (Run After Each Task)

```bash
# Type checking — MUST pass before commit
npx tsc --noEmit

# Lint
npm run lint

# Unit tests (if any)
npm test

# Build verification
npm run build
```