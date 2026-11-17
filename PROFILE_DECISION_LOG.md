# UN OOL STUDIO — PROFILE ARCHITECTURE & PRODUCT DECISION LOG

**Purpose**: Record key architectural, product, design-system, and security decisions made during the Definitive Profile Audit & Blueprint (`profileprompt`), including evaluated alternatives and why they were rejected.  
**Last Verified**: 2026-11-15 (audited directly against current source files).

---

## Decision Log

### `DEC-01`: Consolidate Profile Storage & Eliminate `profiles.theme` JSONB Overloading
- **Context**: Currently, [`SupabaseProfileRepository.ts:29-40,143-154`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/lib/repositories/supabase/SupabaseProfileRepository.ts#L143-L154) reads/writes `onboarding_completed`, `onboarding_answers`, and `studio_profile` both inside top-level SQL columns (falling back silently if `42703`) AND inside `profiles.theme` JSONB alongside visual theme properties (`template`, `preset`, `accentColor`, `customCss`, `conversationUrl`). Worse, `SupabaseProfileRepository.update()` initializes `let themeObj = data.theme || {}` when updating `studioProfile` or `onboardingAnswers`, which **wipes out** `theme.template`, `theme.accentColor`, and `theme.conversationUrl` whenever `PUT /api/studio/profile` or `PUT /api/profile/onboarding` is called!
- **Decision**:
  1. Separate **Visual Theme (`profiles.theme`)** strictly from **AI Persona (`profiles.studio_profile`, `profiles.onboarding_answers`, `profiles.onboarding_completed`)**.
  2. In `SupabaseProfileRepository.update()`, never construct `updateData.theme` unless `data.theme !== undefined`, and perform an atomic Postgres JSONB merge (`COALESCE(profiles.theme, '{}'::jsonb) || $new_theme::jsonb`) or server-side read-merge so partial updates can never clobber sibling keys.
- **Alternatives Considered & Rejected**:
  - *Alternative A*: Keep storing `studio_profile` inside `profiles.theme` and require every API caller (`PUT /api/studio/profile`, `PUT /api/profile/onboarding`, `PUT /api/profile`) to manually read and pass back `existing.theme`.
  - *Why Rejected*: Fragile and error-prone; any future endpoint updating a single property will re-introduce silent template/CTA data loss.

---

### `DEC-02`: Single Canonical Profile Editor (`/dashboard/profile`) vs. Duplicate Settings Tabs
- **Context**: Verified direct inspection of [`PresenceClient.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/dashboard/presence/PresenceClient.tsx), [`SettingsClient.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/dashboard/settings/SettingsClient.tsx), and [`TemplatesTab.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/dashboard/settings/tabs/TemplatesTab.tsx) shows users currently encounter fragmented profile workflows:
  1. `/dashboard/profile` (`PresenceClient.tsx`, rendered via `/dashboard/profile` and redirected cleanly from `/dashboard/presence`) — edits Name, Headline, Role, Company, Avatar, Bio, Links, Proof Points, Open-To, Conversation URL, Subdomain, Analytics view mode, and Template (`TemplateGallery`, which lacks search and plan-lock UI). Currently offers only `3` tabs (`profile`, `links`, `templates`) and hides the live template preview when editing `profile` or `links`.
  2. `/dashboard/settings?tab=templates` (`SettingsClient.tsx` section `'templates'` + `TemplatesTab.tsx`) — duplicates template selection using a *different* picker (`TemplateSelector.tsx`), which pulls `TEMPLATE_REGISTRY` without plan-lock indicators (`SPARK_FREE_TEMPLATE_IDS`) and imports heavy `MagneticCard`/`OrbitalBackground` wrappers, while `handleSaveTemplate` (`SettingsClient.tsx:184`) sends `profileId: workspaceId` in analytics and omits updating `memorySettingsTemplate`. *(Note: earlier discovery docs inaccurately claimed an `account` tab existed in `SettingsClient`; current sections are `workspace`, `studio`, `integrations`, `templates`, `analytics`, `notifications`, `security`, `danger`.)*
  3. `/dashboard/settings?tab=analytics` (`TemplateAnalyticsTab.tsx`) — duplicates analytics viewing outside `PresenceClient`.
  4. `/dashboard/settings?tab=studio` (`StudioTab.tsx`) & `/dashboard` (`ProfileCompletionQuest.tsx`) — edits the Studio AI Persona (`role`, `businessStage`, `businessDomain`, `doing`, `audience`, `tone`, `style`, `workInterests`, `interests`).
- **Decision**:
  1. Make **`/dashboard/profile`** the **single canonical workspace** for Public Profile, Appearance/Templates, Visibility, and Profile Analytics (with a persistent side-by-side live preview on desktop and a sticky drawer on mobile).
  2. Replace duplicate `TemplatesTab` and `TemplateAnalyticsTab` inside `/dashboard/settings` with clean deep-link cards redirecting to `/dashboard/profile?tab=templates` and `/dashboard/profile?view=analytics`.
  3. Consolidate `TemplateGallery` and `TemplateSelector` into one accessible picker enforcing `isTemplateAllowedForPlan` indicators upfront before calling `PUT /api/profile`.
- **Alternatives Considered & Rejected**:
  - *Alternative A*: Maintain both `TemplateGallery` in `/dashboard/profile` and `TemplateSelector` inside `TemplatesTab` in `/dashboard/settings`.
  - *Why Rejected*: Causes divergent caching (`memoryPresenceProfile` vs `memorySettingsTemplate`), missing plan-lock indicators, and wasted maintenance.

---

### `DEC-03`: Unify Public Identity & Studio AI Persona Context (`buildStudioContext`)
- **Context**: Users fill out `name`, `headline`, `role`, `company`, `bio`, and `proofPoints` in `/dashboard/profile`, but [`studioIdeas/route.ts:84-109`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/api/studio/ideas/route.ts#L84-L109) drops `style` and `interests`, `WeekArcGenerator.ts:364` reads `onboardingAnswers` (dropping `businessStage`, `businessDomain`, and `workInterests`), and [`app/api/composer/adapt/route.ts:89-94`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/api/composer/adapt/route.ts#L89-L94) returns `400` if no `profiles` row exists.
- **Decision**:
  1. Introduce a unified `buildCreatorIdentityContext(profile)` builder reading both `studioProfile` AND core public profile identity (`name`, `headline`, `role`, `company`, `bio`, `proofPoints`) across `studioIdeas`, `PostAdapter`, and `WeekArcGenerator`.
  2. Automatically synthesize baseline context from public profile identity (`role`, `company`, `headline`, `bio`) when the Studio quiz has not been completed, and never hard-fail `POST /api/composer/adapt` with `400` when a workspace has not created a profile row yet.
- **Alternatives Considered & Rejected**:
  - *Alternative A*: Force users to enter Role and Bio separately in Public Profile and Studio Settings and gate post adaptation with HTTP 400.
  - *Why Rejected*: Creates needless friction, contradictory AI outputs, and broken Day-1 Composer adoption.

---

### `DEC-04`: Constrained, Token-Driven Template Customization & XSS Elimination
- **Context**: UN OOL has 23 templates ranging from editorial cards to interactive concepts (`the-cube`, `the-bookshelf`, `the-metro`, `the-noren`, `the-desktop`, `the-calendar`). *Corrected code verification (updating earlier strategy notes)*: `app/api/profile/route.ts` persists arbitrary `customCss` and `javascript:` URLs without sanitization, though [`app/u/[subdomain]/page.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/app/u/%5Bsubdomain%5D/page.tsx) does **not** currently inject `customCss`. However, **`4` templates** (`the-stack`, `the-bookshelf`, `the-cube`, `the-monolith`) inject unescaped `JSON.stringify(structuredData)` into `<script type="application/ld+json" dangerouslySetInnerHTML>` (`</script>` XSS vector), **`11` templates** interpolate `${accentColor...}` directly into `<style dangerouslySetInnerHTML>`, and `template` styling breaks WCAG contrast in `22/23` templates.
- **Decision**:
  1. **Keep Fixed per Template**: Structural layout, interactive physics/mechanics (3D cube rotation, Noren curtain split, Bookshelf spine pull-out, Metro route geometry, Calendar tear-off header), and typographic scale ratio.
  2. **Make Safely Customizable via Zod-Validated `theme.customization`**:
     - `accentColor` (strict `#RRGGBB` hex validation + automatic WCAG AA foreground contrast computation)
     - `colorMode` (`'auto' | 'light' | 'dark'` where supported)
     - `fontPairing` (curated 3-preset override: `editorial`, `modern`, `mono`)
     - `sectionVisibility` (`showProofs`, `showOpenTo`, `showRecentActivity`, `showContactCTA`)
     - `templateMeta` (`location`, `timezone`, `availabilityText`) so bespoke templates never display hardcoded `"Tokyo, JP"` or `"Accepting Select Briefs"`.
  3. **Deprecate `customCss` & Eliminate Unescaped HTML/CSS String Interpolation**: Remove `customCss` storage/rendering, apply CSS custom properties via React `style={{ '--accent': safeHex }}` instead of `<style dangerouslySetInnerHTML>` template string interpolation, and escape `<` as `\u003c` in all JSON-LD scripts via a shared `<SafeJsonLd />` helper.
- **Alternatives Considered & Rejected**:
  - *Alternative A*: Ship raw user-editable `customCss` with regex stripping.
  - *Why Rejected*: High security risk (`</style>`, `@import`, UI redress), impossible to guarantee WCAG AA or mobile non-overflow across 23 distinct layouts.

---

### `DEC-05`: Real Contact/Lead Capture API & SSR-First Public Microsite Rendering
- **Context**: [`ClubTemplateV2.tsx:1249`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/ClubTemplateV2.tsx#L1249) submits visitor inquiries to a **nonexistent `/api/profile/contact` (`404`)** route, while `the-bookshelf` & `the-stack` display `"Phone number not listed"` toast buttons when no phone exists. Furthermore, `ClubTemplateV2.tsx:26` loads `ClubHero3D` with `ssr: false` (plus compiles a broken fragment shader at `ClubHero3D.tsx:168`), and `app/u/[subdomain]/page.tsx` renders an empty loading spinner before client-fetching `/api/profile/[subdomain]`.
- **Decision**:
  1. Implement `POST /api/profile/contact` (Zod-validated, rate-limited, honeypot/anti-spam protected, forwarding inquiries cleanly to workspace notification email + optional lead log) and replace dead toast `Call`/`WhatsApp` buttons with conditional rendering + shared contact modal/CTA using `conversationUrl`.
  2. Convert `app/u/[subdomain]/page.tsx` to an **SSR/ISR Server Component** passing sanitized public profile + recent activity props down to client islands, with static CSS/HTML hero fallbacks for `ClubTemplateV2` so SSR HTML never returns `null` or depends on WebGL shader compilation for above-the-fold readability.
- **Alternatives Considered & Rejected**:
  - *Alternative A*: Keep client-side loading spinner in `/u/[subdomain]` and rely solely on `mailto:` links.
  - *Why Rejected*: Hurts SEO/social sharing latency, exposes double-fetch database overhead, and breaks parity with competitor conversion flows (Stan Store / Contra / Beacons).

---

### `DEC-06`: Subdomain Governance, Soft-Delete Enforcement & Private Viewer Allowlist
- **Context**: `PUT /api/profile` omits subdomain regex and reserved-word checks (`'admin'` is claimable), `check` vs `claim` reserved word lists disagree (`ftp`, `ssh`, `vpn`), `SupabaseProfileRepository` never filters `.is('deleted_at', null)`, and `profile_viewers` (`/api/profile/viewers`) is completely unwired inside `GET /api/profile/[subdomain]`.
- **Decision**:
  1. Centralize `validateAndNormalizeSubdomain()` in `lib/validation/subdomain.ts` and invoke it identically in `/api/subdomains/check`, `/api/subdomains/claim`, AND `PUT/POST /api/profile` (also checking `.is('deleted_at', null)`).
  2. Enforce `.is('deleted_at', null)` across every active lookup in `SupabaseProfileRepository` (`findById`, `findBySubdomain`, `findByUserId`, `findByWorkspaceId`), keeping an explicit `findDeletedByWorkspaceId()` only for `recover()`.
  3. Wire authenticated `getCurrentAuth(request)` viewer allowlist verification inside `GET /api/profile/[subdomain]` (and `app/u/[subdomain]`) for `visibility === 'private'` profiles—matching `profile.userId` or a `profile_viewers` row—and exempt the profile owner from incrementing public view metrics.
- **Alternatives Considered & Rejected**:
  - *Alternative A*: Delete `profile_viewers` table entirely and only support binary public/private without owner/invited previews.
  - *Why Rejected*: The database schema (`20260923232041_add_profile_visibility.sql`) and CRUD API already exist cleanly; wiring the 10-line read check unlocks private portfolio sharing for VIP prospects/clients.
