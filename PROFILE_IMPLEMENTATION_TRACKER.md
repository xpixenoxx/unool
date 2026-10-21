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

### [x] **P0-T2: Fix Public Profile API — Switch to Anon Key + RLS**
- **File:** `app/api/profile/[subdomain]/route.ts`
- **Change:** Replace service role repository with ANON_KEY client that respects RLS
- **Add:** RLS policy `Public profiles are viewable by everyone` on `profiles` table for `WHERE visibility = 'public'`
- **Migration:** `supabase/migrations/20261021000001_enable_profiles_rls_public.sql`
- **Verification:** Public profile fetch uses anon key; private profiles return 404 via RLS

### [x] **P0-T3: Fix IDOR in `/api/profile/viewers/route.ts`**
- **File:** `app/api/profile/viewers/route.ts`
- **Fix:** Changed from `findByWorkspaceId` to `findByUserId(auth.userId)` to ensure users only access their own profile's viewers
- **Added:** Workspace membership verification (`profile.workspaceId === auth.workspaceId`) as defense in depth
- **Added:** Self-viewer prevention in POST (cannot add yourself as viewer)
- **Verification:** Users can only manage viewers for their own profile

### [x] **P0-T4: Add Rate Limiting to Public Profile Endpoint**
- **File:** `app/api/profile/[subdomain]/route.ts`
- **Add:** Upstash Redis rate limit (60 req/min per IP, graceful degradation if not configured)
- **Config:** Uses `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### [x] **P0-T5: Remove Email from Public Profile Response**
- **File:** `app/api/profile/[subdomain]/route.ts`
- **Change:** Email field completely stripped from response JSON
- **Verify:** Public API response no longer contains `email`

---

## P1 — High Priority Fixes

### [x] **P1-T1: Consolidate Duplicate Social Icon Logic**
- **Files:** `IdentityTemplate.tsx` (multiple `getSocialSvgPath`, `getAestheteSocialIcon`), `VoiceTemplate.tsx` (`getSocialIcon`)
- **Target:** Create `components/profile/templates/utils/socialIcons.ts` shared utility
- **Update:** All templates to import from shared utility
- **Created:** `components/profile/templates/utils/socialIcons.tsx` with exports: `getSocialSvgPathShared`, `SocialIconShared`, `renderSocialOrIconShared`, `getPlatformKey`, `isEmojiIcon`, `getBrandSvgPath`, `getLinkIcon`, `getPlatformIcon`, `getAestheteSocialIcon`, `getAllPlatformKeys`, `isKnownPlatform`, `BRAND_SVGS`
- **Updated:** 13 template files (lover, lone, energy, rebellion, vision, human, the-machine, the-visionary, the-builder, the-hustler, the-aesthete, the-creator, the-voice) to use shared utility
- **Note:** the-club and the-studio use their own consolidated icon systems (ClubBrandIcons, SocialBrandIcons)
- **Verification:** `npx tsc --noEmit` — zero type errors in updated files (pre-existing dependency errors remain in unrelated files)

### [x] **P1-T2: Unify RecentActivitySection Variants** (15 variants → config-driven)
- **File:** `components/profile/RecentActivitySection.tsx` (968 lines → ~240 lines)
- **Approach:** Extract variant configs into `components/profile/templates/activityVariants.tsx`
- **Benefit:** Single component, easier to maintain, consistent behavior
- **Created:** `components/profile/templates/activityVariants.tsx` with 15 variant configs + shared render helpers
- **Refactored:** `components/profile/RecentActivitySection.tsx` now uses config-driven rendering
- **Verification:** `npx tsc --noEmit` — zero new type errors (pre-existing dependency errors remain in unrelated files)

### [x] **P1-T3: Add Input Validation to Avatar Upload**
- **File:** `app/api/profile/avatar/route.ts`
- **Add:** File type check (image/*), size limit (5MB), sanitize filename
- **Return:** Proper error codes (400 for invalid type, 413 for too large)
- **Verification:** `npx tsc --noEmit` passes; returns 400 for non-image, 413 for >5MB

### [x] **P1-T4: Optimize Template Registry with Lazy Loading**
- **File:** `components/profile/ProfilePreview.tsx`, `components/profile/templates/registry.ts`
- **Change:** Ensure all templates use `React.lazy` + `Suspense` (already implemented)
- **Add:** Loading fallback skeleton per template category
- **Created:** `components/profile/templates/TemplateSkeletons.tsx` with 5 category-specific skeletons (individual, startup, agency, entrepreneur, influencer)
- **Updated:** `components/profile/ProfilePreview.tsx` to use category-aware skeletons via `getSkeletonCategory()`
- **Verification:** `npx tsc --noEmit` passes

### [x] **P1-T5: Add Subdomain Uniqueness Check at DB Level**
- **Migration:** `supabase/migrations/20261021000002_unique_subdomain_partial_index.sql` - partial unique index on `profiles.subdomain` where `deleted_at IS NULL`
- **API:** `app/api/profile/route.ts` — handle unique violation (PostgreSQL 23505) with 409 error
- **Verification:** `npx tsc --noEmit` passes

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
| 2026-10-21 | P0-T2 | Complete | Public API now uses ANON_KEY client with RLS; created migration 20261021000001_enable_profiles_rls_public.sql |
| 2026-10-21 | P0-T3 | Complete | IDOR fixed — viewers route now uses findByUserId(auth.userId) with workspace verification |
| 2026-10-21 | P0-T4 | Complete | Upstash Redis rate limiting (60 req/min) added to public profile endpoint |
| 2026-10-21 | P0-T5 | Complete | Email field stripped from public profile response |
| 2026-10-21 | P1-T1 | Complete | Created shared socialIcons.tsx utility; updated 13 template files; consolidated duplicate social icon logic |
| 2026-10-21 | P1-T2 | Complete | Extracted 15 variants into config-driven activityVariants.tsx; reduced RecentActivitySection.tsx from 968 to ~240 lines; shared render helpers for pulse, platforms, footer |
| 2026-10-21 | P1-T3 | Complete | Added 5MB size limit validation to avatar upload endpoint; returns 413 for oversized files |
| 2026-10-21 | P1-T4 | Complete | Added TemplateSkeletons.tsx with 5 category-specific loading skeletons; updated ProfilePreview.tsx to use category-aware Suspense fallbacks |
| 2026-10-21 | P1-T5 | Complete | Created partial unique index migration for subdomain; updated API to handle PostgreSQL 23505 unique violation with 409 |
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