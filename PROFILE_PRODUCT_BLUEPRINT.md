# UN OOL STUDIO — MARKET-LEADING PROFILE PRODUCT BLUEPRINT

**Audit Basis**: Built directly on observed failures, UX bottlenecks, and 2025–2026 competitive market whitespace (`PROFILE_COMPETITOR_ANALYSIS.md`), preserving UN OOL's rare visual template artistry while eliminating structural fragility and unlocking proof-of-work + conversion superiority.  
**Target State**: Production-grade personal & creator microsite OS natively integrated with Studio AI content workflows.

---

## 1. Future Profile Architecture (`Part 16.1`)

### 1.1 Domain Data Boundary Separation (Ending `profiles.theme` Overloading)
Separate today's tangled `profiles.theme` JSONB column into **4 strictly typed domains**:

1. **Identity Core (`profiles` SQL columns)**:
   - `subdomain` (validated, lowercase, partial-unique `WHERE deleted_at IS NULL`)
   - `name`, `headline`, `bio`, `role`, `company`, `location`, `timezone`, `availability_status`, `avatar_url`, `email` (optional public contact address / private owner fallback — NEVER exposed when `showEmail !== true`), `conversation_url`, `open_to`, `visibility` (`'public' | 'private'`), `version`, `deleted_at`.
2. **Visual Appearance (`profiles.theme` JSONB — Zod-validated)**:
   - Strictly visual & structural configuration: `templateId`, `customization: { accentColor, colorMode, fontPairing, avatarStyle, sectionVisibility, templateMeta }`.
   - `customCss` is **removed** (eliminates Stored XSS and CSS parsing risk).
3. **AI Persona & Voice Memory (`profiles.studio_profile` SQL JSONB + `onboarding_completed`)**:
   - Decoupled completely from `profiles.theme`! Repository `update()` performs atomic column-level updates and merges JSONB via Postgres `COALESCE(theme, '{}'::jsonb) || $patch::jsonb` so saving AI preferences in `/dashboard/settings?tab=studio` can **never** overwrite visual template choices.
   - Unified `buildCreatorIdentityContext(profile)` merges `studioProfile` + `name`, `headline`, `role`, `company`, `bio`, and `proofPoints` so filling out a public profile immediately personalizes Studio Ideas, Post Adapter, and Week Arcs without duplicate typing.
4. **Access Control & Lead Capture (`profile_viewers` + new `profile_leads` / `custom_domains`)**:
   - `profile_viewers`: enforced server-side inside `GET /api/profile/[subdomain]` & SSR `/u/[subdomain]` when `visibility === 'private'` (`profile.userId === auth.userId` OR membership in `profile_viewers`).
   - `profile_leads`: lightweight contact submissions created by `POST /api/profile/contact` (replacing `ClubTemplateV2`'s broken 404 endpoint and powering lead capture across *all* templates).

### 1.2 Request & Rendering Architecture
```
Visitor Request (/u/[subdomain])
  ├── Next.js Server Component (`app/u/[subdomain]/page.tsx`)
  │     ├── Check `deleted_at IS NULL` & resolve auth cookie (`getCurrentAuth`)
  │     ├── If `visibility === 'private'`: allow ONLY owner (`auth.userId === profile.userId`) OR `profile_viewers` member; otherwise `notFound()`
  │     ├── Fetch latest published Studio transmission (`recentActivity`) + Brand Material slugs in parallel (0 client waterfall)
  │     ├── Async non-blocking telemetry (`profile_view` skipped for bots, previews, AND owner self-views)
  │     └── Strip private email + AI persona fields (`studioProfile`, `onboardingAnswers`) before RSC hydration
  └── Selected Template Component (<TemplateFrame /> + Archetype Renderer)
        ├── Auto-contrasted CSS variables (`--accent`, `--accent-fg`, `--surface`, `--surface-fg`) injected via inline React `style`
        ├── `<SafeJsonLd data={structuredData} />` escaping `<` -> `\u003c`
        ├── Shared accessible `<RecentActivitySection />` + `<OpenToBadges />` + `<ContactDrawerTrigger />`
        └── Click tracking beacon (`POST /api/analytics/track`)
```

### 1.3 Subdomain, Custom Domain & Cache Discipline
- **Single Subdomain Policy Module (`lib/validation/subdomain.ts`)**: Used identically across `GET /api/subdomains/check`, `POST /api/subdomains/claim`, and `PUT/POST /api/profile` — rejecting `admin`, `api`, `vpn`, `ssh`, `ftp`, invalid slugs, and collisions against active (`deleted_at IS NULL`) profiles.
- **Custom Domain Support Path (Pro/Studio Tier)**: Add `custom_domain` & `custom_domain_verified_at` on `profiles` backed by Vercel Domains API verification + Host-header resolution in Next middleware (`middleware.ts` -> rewrite to `/u/[subdomain]`).
- **Workspace-Scoped Cache Isolation**: Eliminate module-level singletons (`memoryPresenceProfile`, `memorySettingsTemplate`); replace with workspace/user-keyed React Query / SWR cache invalidated cleanly on account switch or sign-out.

---

## 2. Next-Generation Template Architecture (`Part 16.2`)

### 2.1 Consolidating 23 Files into 3 Tiered Architectural Families + Typed Schema
Keep the **brand names and visual craft** users love while eliminating duplicate rendering bugs across `8` near-identical SaaS clones and fixing `17` missing-feature templates:

1. **Family 1 — `Minimal / Editorial Cards` (Deduplicates `lover`, `lone`, `energy`, `vision`, `the-hustler`, `the-aesthete`, `the-creator`, `the-voice` + `the-visionary`, `the-builder`)**:
   - Powered by a shared composable **`EditorialCardEngine`** reading a declarative **`ThemePresetConfig`** (`surface`, `typography`, `layoutVariant`: `'journal' | 'stark' | 'kinetic' | 'grid' | 'essay' | 'bento'`).
   - Preserves distinct visual identities (`The Lone`, `The Lover`, `The Energy`, `The Visionary`, etc.) while inheriting **one** WCAG AA contrast solver, **one** `<h1>` landmark guarantee, **one** `OpenToBadges` slot, **one** `conversationUrl` CTA bar, and **one** `RecentActivitySection` contract!
2. **Family 2 — `Bespoke Tactile & Spatial Signatures` (`rebellion`, `human`, `the-machine`, `the-studio`, `the-stack`, `the-bookshelf`, `the-cube`, `the-monolith`, `the-metro`, `the-noren`, `the-desktop`, `the-calendar`, `the-club`)**:
   - Retains bespoke art direction and interactive mechanics per component, **but wraps every template** inside a shared **`<ProfileTemplateShell>`** that handles:
     - Safe `<SafeJsonLd />` emission (no copy-pasted `<script dangerouslySetInnerHTML>`).
     - Strict `TemplateProps v2` adapter normalizing `recentActivity`, `openTo`, `links`, `proofPoints`, `contactAction` (`conversationUrl` OR native Lead Modal OR `mailto:` only when explicit email enabled), and `timezone`/`location` (zero hardcoded `"Tokyo, JP"` / `"UTC UTC"`).
     - Guaranteed SSR non-blank fallback (fixing `ClubTemplateV2` blank SSR + fixing `uScrollProgress` in `ClubHero3D.tsx` fragment shader).
3. **Net-New Post-Parity Archetype — `The Bento` (`individual` / `startup` / `creator`)**:
   - Fills the **Bento.me market void** with `1×1`, `2×1`, and `2×2` visual grid tiles supporting rich link cards (`title`, `subtitle`, `previewImageUrl`, `pinnedBadge`), live metric tiles, and embedded Studio post highlight.

### 2.2 Canonical `TemplateCustomizationSchema` & `ProfileLink v2`
```ts
export const TemplateCustomizationSchema = z.object({
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorMode: z.enum(['auto', 'light', 'dark']).default('auto'),
  fontPairing: z.enum(['default', 'editorial-serif', 'geometric-sans', 'technical-mono']).default('default'),
  avatarStyle: z.enum(['circle', 'rounded', 'monogram', 'hidden']).default('circle'),
  sectionVisibility: z.object({
    showProofs: z.boolean().default(true),
    showOpenTo: z.boolean().default(true),
    showRecentActivity: z.boolean().default(true),
    showContactCTA: z.boolean().default(true),
    showLocation: z.boolean().default(true),
  }).default({}),
  templateMeta: z.object({
    location: z.string().max(80).optional(),
    timezone: z.string().max(40).optional(),
    availabilityBadge: z.string().max(60).optional(),
  }).optional(),
});

export const ProfileLinkV2Schema = z.object({
  id: z.string(),
  label: z.string().min(1).max(80),
  url: z.string().url().refine(u => /^https?:\/\//i.test(u) || /^mailto:|^tel:/i.test(u), 'Unsafe protocol'),
  icon: z.string().max(40).optional(),
  subtitle: z.string().max(120).optional(),
  tileSize: z.enum(['compact', 'wide', 'hero']).default('compact'),
  isPinned: z.boolean().default(false),
  isVisible: z.boolean().default(true),
});
```

### 2.3 Automatic WCAG AA Contrast Engine
Introduce `resolveAccessiblePalette(bgHex, requestedAccentHex)` in `lib/profile/contrast.ts`:
- Calculates relative luminance $L$ and WCAG ratio $(L_1 + 0.05) / (L_2 + 0.05)$.
- Guarantees every CTA button (`Get in Touch`, `LinkedIn`, `Schedule`), badge (`UNOOL`), and muted caption (`1H AGO`, `New Post`) achieves **`>= 4.5:1`** normal text (`>= 3.0:1` large display/UI components) by automatically selecting dark (`#0A0A0A`) vs light (`#FFFFFF`) text foreground and darkening/lightening saturated accent fills on mismatch.

---

## 3. UI/UX Blueprint for Major Screens (`Part 16.3`)

### 3.1 Unified Profile Studio (`/dashboard/profile`)
Replace today's hidden-preview 3-tab form with a **persistent split-pane builder** matching Linktree/Beacons/Stan Store ergonomics in UN OOL's warm **Biscuit (`#F7F3ED` / `#C4A265`)** aesthetic:
- **Left Pane (`~55%` desktop, structured sub-tabs)**:
  1. **`Identity & Bio`**: Avatar drag-and-drop (client + magic-byte server validation), Name, Role, Company, Headline, Bio, Location/Timezone/Availability badge, AI URL Auto-Fill (`POST /api/profile/extract` unified — delete `/api/profile/generate`), **AI Persona Sync status pill** ("Synced to Studio AI Ideas & Composer").
  2. **`Links & Proof`**: Reorderable Links (label, safe `https://` URL validation, optional subtitle + `Bento` tile size + Pin highlight), Proof Points (label, metric value, optional verification URL for Peerlist-grade credibility), **Open-To Intent Pills** (`<OpenToSelector>`), and Primary Contact Action (`conversationUrl` OR Native Lead Capture Drawer).
  3. **`Design & Templates`**: Accessible Template Picker (`TEMPLATE_REGISTRY` search + category filter + clear **`Spark Free` vs `Creator/Pro` plan badges** BEFORE selection + upgrade sheet rather than background `403` failures!), Accent Color Picker with **live WCAG contrast indicator**, Font Pairing, Color Mode, and Section Visibility toggles (`showProofs`, `showOpenTo`, `showRecentActivity`).
  4. **`Domain, Privacy & Analytics`**: Subdomain checker/claim/release (using unified validator), Custom Domain setup (Pro+), Profile **Visibility (`Public` vs `Private Invite-Only`) + Viewer Allowlist Manager** (wiring `profile_viewers` UI!), and Inline Profile Analytics (fixed CTR, full un-truncated URLs, zero owner self-views, 24-template labels).
- **Right Pane (`~45%` desktop sticky, `Preview` floating pill + sheet on `<1024px` mobile)**:
  - Always-on live `<ProfilePreview>` with **Desktop / Mobile (`390px`) viewport toggle** and **Normal / Minimal / Live Link Preview** state indicator.
- **Persistence & Error States**:
  - Header save indicator displays explicit states: `Saving...`, `Saved ✓`, `Plan Upgrade Required (403)` / `Version Conflict — Reload Latest (409)` / `Retry Save` button, plus `beforeunload` confirmation guard if unsaved changes exist inside the debounce buffer.

### 3.2 First-Run Zero-to-Published Onboarding Flow
1. On account/workspace creation, seed default template **`'lone'`** (inside `SPARK_FREE_TEMPLATE_IDS`) rather than nonexistent `'minimalist'`, ensuring Day-1 saves ALWAYS succeed cleanly (`200 OK`).
2. User enters optional website/LinkedIn/X URL -> single-pass AI extraction previews extracted fields + suggests initial Studio AI voice (`role`, `audience`, `doing`, `interests`) in one unified confirmation step.
3. Claimed subdomain preview + 1-click **Publish & Copy Link**.

### 3.3 Public Microsite (`/u/[subdomain]`) Empty, Error, & Loading States
- **Minimal / Incomplete Profile**: Never fabricate fake bios (`"I work at the intersection..."`), fake schedules (`the-calendar`), or fake train stops (`the-metro`) when fields are empty! Hide empty optional sections gracefully and maintain crisp hero spacing.
- **No-Phone Contact Handling**: Never render clickable `Call` or `WhatsApp` buttons that fail with `"Phone number not listed"` toasts; only render channels the creator configured, or route CTAs cleanly to the Native Contact Form / `conversationUrl`.
- **Accessibility Standards (WCAG 2.1 AA)**:
  - Exactly `1` semantic `<h1>` per profile page (`the-machine` & `the-builder` fixed).
  - Decorative SVGs and 3D canvases carry `aria-hidden="true"`.
  - Global `@media (prefers-reduced-motion: reduce)` CSS/React override across **all 23+ templates** disabling animations immediately so `the-noren` curtain panels never hang invisible at `opacity: 0; scaleY(0)`.

---

## 4. Component-Level Action Plan (`Part 16.4`)

| Target File / Component | Action | Specific Blueprint Directive |
| :--- | :--- | :--- |
| `app/api/profile/generate/route.ts` | **Consolidate / Remove** | Merge duplicate logic into `app/api/profile/extract/route.ts` + SSRF CIDR guard; redirect/retire duplicate route. |
| `app/api/profile/studio/route.ts` | **Retain (Thin Alias)** | Keep clean alias to `/api/studio/profile` for backwards compatibility while standardizing client calls. |
| `lib/repositories/supabase/SupabaseProfileRepository.ts` | **Replace / Rewrite Update & Queries** | Add `.is('deleted_at', null)` to all active readers (`findBy*`); fix `update()` to stop overwriting `theme` when updating `studioProfile`/`onboardingAnswers`; read explicit `expectedVersion`. |
| `app/api/profile/route.ts` | **Improve** | Add Zod validation (`javascript:` link rejection, drop `customCss`, validate `#RRGGBB` `accentColor`, invoke shared subdomain validator), fix `POST` double-write (`create` with initial fields directly), pass `body.version`. |
| `app/api/profile/analytics/route.ts` | **Replace / Fix Security & Math** | Require strict `getCurrentAuth(request)` (`401` on missing auth; ignore arbitrary `?workspaceId=` query unless validated workspace member); remove `findByUserId` fallback; fix double-counting (`L186`/`L210`); parse key without `.split(':')` (`URL` or JSON delimiter); include all `23+` template names; compute real metrics or remove mock `avgSessionDuration: 45`. |
| `app/api/profile/[subdomain]/route.ts` | **Improve** | Enforce `deleted_at IS NULL`; wire `profile_viewers` check for `visibility === 'private'`; exclude authenticated owner (`auth?.userId === profile.userId`) from incrementing views/analytics; strip `studioProfile`/`onboardingAnswers`. |
| `app/api/subdomains/check/route.ts` & `claim/route.ts` | **Consolidate** | Extract `lib/validation/subdomain.ts` unified regex + reserved list (`ftp`/`ssh`/`vpn` included) + `.is('deleted_at', null)`. |
| `app/api/profile/contact/route.ts` | **Introduce** | New Zod-validated, rate-limited endpoint backing `ClubTemplateV2` & unified creator Contact Drawer (`profile_leads` + email notify). |
| `app/dashboard/presence/PresenceClient.tsx` | **Split & Redesign** | Break `1,737` LOC monolith into `<IdentityEditor>`, `<LinksProofsEditor>`, `<AppearanceCustomizer>`, `<DomainPrivacyPanel>`, `<AnalyticsPanel>`, and persistent right-hand `<LivePreviewPane>`; change `DEFAULT_TEMPLATE` -> `'lone'`; expose `visibility`, `profile_viewers`, `accentColor`, `location`/`timezone`, `beforeunload`, & clear error banners. |
| `components/profile/TemplateGallery.tsx` & `TemplateSelector.tsx` | **Consolidate** | Merge into `<UnifiedTemplatePicker>` with search bar, category filters, `SPARK_FREE_TEMPLATE_IDS` plan lock badges + upgrade trigger, and zero `OrbitalBackground` modal overhead. |
| `components/dashboard/settings/tabs/TemplatesTab.tsx` & `TemplateAnalyticsTab.tsx` | **Replace with Redirect Cards** | Remove duplicate settings template/analytics state; render deep links to `/dashboard/profile?tab=templates` and `/dashboard/profile?view=analytics`. |
| `app/u/[subdomain]/page.tsx` | **Replace Client Fetch with SSR/ISR** | Fetch initial sanitized profile + `recentActivity` server-side (`Promise.all` with `layout.tsx`), eliminating double client query & loading spinner flash. |
| `components/profile/RecentActivitySection.tsx` & `activityVariants.tsx` | **Improve** | Enforce contrast-safe foreground/background tokens on buttons & cards (fixing white-on-white LinkedIn & invisible quote bugs); accept single normalized `recentActivity` object cleanly across all templates. |
| `components/profile/templates/persona/ClubTemplateV2.tsx` & `ClubHero3D.tsx` | **Improve / Fix Shader & SSR** | Declare `uniform float uScrollProgress;` in `ClubHero3D.tsx` fragment shader (`L115`); render CSS fallback hero during SSR; lift initial `opacity: 0` trap on below-fold sections; wire `recentActivity`. |
| `components/profile/templates/persona/the-visionary/index.tsx` & `rebellion`, `human`, `the-machine`, `the-builder`, `the-studio` | **Improve / Redesign** | Fix missing `<h1>` (`the-machine`, `the-builder`), render `profile.bio` (`the-visionary`), fix clipped badges (`rebellion`, `human`, `the-machine`), overlap (`the-studio`), `openTo` & `conversationUrl`, & remove Minimal fake copy. |
| `components/profile/templates/persona/{the-stack,the-bookshelf,the-cube,the-monolith,the-metro,the-noren,the-desktop,the-calendar}/index.tsx` | **Improve** | Escape JSON-LD via `<SafeJsonLd />` (`4` templates); read `profile.recentActivity` instead of `.activity` (`4` Japanese/editorial templates); fix `the-metro` `+590px` mobile grid overflow (`min-w-0` / responsive stacking); fix `the-noren` curtain reduced-motion; fix `the-desktop` mobile titlebar clipping; fix `the-bookshelf` spine clipping & typo (`"Github"` -> `"GitHub"`); remove dead `Call`/`WhatsApp` toast buttons (`the-bookshelf`/`the-stack`). |
| `lover`, `lone`, `energy`, `vision`, `the-hustler`, `the-aesthete`, `the-creator`, `the-voice` | **Consolidate** | Refactor shared card chrome into `<EditorialCardEngine>` while keeping distinct preset tokens, fixing `vision` `1.04:1` CTA contrast, adding `OpenToBadges`, and stripping CSS `${...}` `<style dangerouslySetInnerHTML>` interpolation. |
| `lib/ai/studioContext.ts`, `studioIdeas.ts`, `WeekArcGenerator.ts`, `app/api/composer/adapt/route.ts` | **Improve** | Introduce `buildCreatorIdentityContext(profile)` merging `studioProfile` + public profile identity + preserving `style`, `interests`, `businessStage`, `businessDomain`, `workInterests`; harden injection filter without `^`-only anchor limitation; stop rejecting post adaptation with `400` if profile row absent. |

