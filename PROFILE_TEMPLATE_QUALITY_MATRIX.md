# UN OOL STUDIO — PROFILE TEMPLATE QUALITY MATRIX (ALL 23 TEMPLATES)

**Audit Date**: 2026-11-15  
**Source Registry**: [`components/profile/templates/registry.ts`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/registry.ts)  
**Preview & Loader**: [`components/profile/ProfilePreview.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/ProfilePreview.tsx)  
**Verification Method**: Static AST/feature audit across all 23 template components + SSR HTML render verification (`scratch/audit-verification.test.tsx`) + Real headless Chromium visual/DOM inspection (`180` JSON rows across two sequential sweeps totaling `92` unique `(template × mode × viewport)` runs covering `1440×900` FULL, `390×844` FULL, `390×844` MINIMAL, and `390×844` EXTREME) + Direct visual inspection of captured PNG screenshots in `screenshots/`.

---

## 1. Executive Summary Across All 23 Templates

- **Total Registered Templates**: **23** across 5 categories (`individual`, `startup`, `agency`, `entrepreneur`, `influencer`).
- **Crash / Blank Render Rate (`92` Chromium Runs)**: `0 / 92` uncaught crashes or empty screens after ESM dynamic import resolution (`the-club` requires client mount to render `ClubHero3D` because `ClubTemplateV2.tsx:26` uses `next/dynamic(..., { ssr: false })` and throws a **WebGL Fragment Shader error on every load** in [`ClubHero3D.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/sections/ClubHero3D.tsx#L115-L176): `ERROR: 0:217: 'uScrollProgress' : undeclared identifier`).
- **Architectural Split Observed**:
  - **Tier A — 8 Structural Near-Duplicates ("SaaS Dark/Light Card Family")**: `lover`, `lone`, `energy`, `vision`, `the-hustler`, `the-aesthete`, `the-creator`, `the-voice`. Clean `Minimal` behavior (`10–26` chars, zero fake fallback copy), `0px` horizontal overflow, and `conversationUrl` wiring (`7/8`), **but** suffer from cookie-cutter layout monotony (weak hero differentiation beyond palette swaps), white-on-white/near-invisible text inside `RecentActivitySection` buttons/cards, and `0/8` render `OpenToBadges`.
  - **Tier B — 4 Medium Persona Experiments (`rebellion`, `human`, `the-machine`, `the-builder`, `the-visionary`, `the-club`, `the-studio` = 7 templates)**: Strong visual ambition, **high defect density**:
    - `the-machine` & `the-builder` emit **no `<h1>` landmark** (`hasH1 = false` across all 4 Chromium modes).
    - `the-visionary` **discards `profile.bio`** unless a custom `positioning` property is present and hardcodes **495 chars of fabricated philosophical copy** in Minimal mode.
    - `the-club` renders a WebGL shader compilation error, leaves everything below the `100vh` fold **pitch black** on initial load (`the-club-desktop-1440.png` / `the-club-mobile-390.png`) due to scroll-reveal gating, hardcodes **1,936 chars** of club fallback copy in Minimal mode, and submits its Contact drawer to a **nonexistent `POST /api/profile/contact` (`404`)**.
    - `the-studio` overlaps `"X / Twitter"` with its `>` carousel arrow (`the-studio-desktop-1440.png`), hardcodes `"Accepting Select Briefs"`, and renders duplicate `"UTC UTC"`.
    - `rebellion` clips metric values (`"184..."`) and divider text (`"ARCH"`) inside `overflow-hidden` on mobile (`rebellion-mobile-390.png`), plus `342` chars of fake copy in Minimal mode.
    - `human` truncates header badges (`"THE BABBAGE EN"`) and suffers `1.23:1` dark-on-navy contrast inside `RecentActivitySection`.
  - **Tier C — 8 Bespoke Interactive Editions (`the-stack`, `the-bookshelf`, `the-cube`, `the-monolith`, `the-metro`, `the-noren`, `the-desktop`, `the-calendar`)**: Highest creative distinctiveness on the market (`88`–`96` aesthetic uniqueness), **but** shipped with systematic production parity bugs:
    - **4 Japanese/Editorial templates (`the-metro`, `the-noren`, `the-desktop`, `the-calendar`) check `(profile as any)?.activity` instead of `profile.recentActivity`**, so published Studio posts **never render** on `/u/[subdomain]` or preview!
    - **4 Bespoke templates (`the-stack`, `the-bookshelf`, `the-cube`, `the-monolith`) embed unescaped JSON-LD** `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />` (XSS vector via `</script>` inside bio/name).
    - **`the-metro` fails responsive containment on `390×844`**, overflowing `+1px` in FULL mode and **`+590px` in EXTREME mode**.
    - **`the-bookshelf` & `the-stack` render dead `Call`/`WhatsApp` buttons** when no phone number exists, showing `"Phone number not listed"` toasts (`the-bookshelf:1157-1165`, `the-stack:783-815`).
    - **All 8 bespoke templates fail Minimal empty-state restraint**, fabricating `324–449` chars of mock copy/stations/books/schedules for a minimal profile with only a name, and **0/8 support `prefers-reduced-motion`**.

---

## 2. Weighted Evaluation Rubric (0–100 Scale)

Per the audit specification:
1. **Visual quality and composition (`20` pts)**: Visual hierarchy, proportion, whitespace, asset sharpness, clipping-free framing.
2. **Typography and readability (`15` pts)**: Font pairing, line-height, measure length, scannability under full & extreme text.
3. **Content hierarchy (`15` pts)**: Above-the-fold identity clarity (`Name`, `Headline`, `Primary CTA`), graceful `Minimal` empty-state behavior without fake copy.
4. **Responsiveness (`15` pts)**: Desktop (`1440×900`) and mobile (`390×844`) reflow, zero horizontal overflow, extreme stress resilience.
5. **Customization flexibility (`10` pts)**: Real responsiveness to `accentColor`, `conversationUrl`, `openTo`, avatar fallback, and `links`/`proofs`.
6. **Accessibility and contrast (`10` pts)**: `<h1>` landmark presence, WCAG 2.1 AA contrast (`≥4.5:1`), decorative `aria-hidden` SVG hygiene, `prefers-reduced-motion` compliance.
7. **Functional completeness (`10` pts)**: `recentActivity` wiring, `openTo` rendering, `conversationUrl` wiring, zero dead buttons/404s, escaped JSON-LD/CSS.
8. **Distinctiveness (`5` pts)**: Genuine visual memorability vs. generic SaaS clone.

---

## 3. Master Template Quality & Telemetry Matrix (All 23 Templates)

### 3A. Observed Feature Parity, DOM Metrics & Runtime Telemetry

| Template ID | Category | Path | LOC | `<h1>` | `openTo` | `convUrl` | `recentActivity` Bug? | Security Vector (`JSON-LD` / `CSS`) | `reduced-motion` | Overflow `390px` (Full / Ext) | `Minimal` Text Len (Clean ≤40) | Unhidden SVGs (`Full@1440`) | Low Contrast (`Full@1440`) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `lover` | individual | [`lover/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/lover/index.tsx) | 659 | ✅ | ❌ | ✅ | ✅ (`recentActivity`) | CSS `${...}` | ✅ | `0 / 0` | **26** ✅ | 1 | **5** (4.03–4.23) |
| `lone` | individual | [`lone/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/lone/index.tsx) | 567 | ✅ | ❌ | ✅ | ✅ (`recentActivity`) | CSS `${...}` | ✅ | `0 / 0` | **18** ✅ | 1 | **2** (2.86, **1.00**) |
| `energy` | individual | [`energy/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/energy/index.tsx) | 564 | ✅ | ❌ | ✅ | ✅ (`recentActivity`) | CSS `${...}` | ✅ | `0 / 0` | **10** ✅ | 1 | **1** (**1.00** UNOOL) |
| `rebellion` | startup | [`rebellion/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/rebellion/index.tsx) | 536 | ✅ | ❌ | ❌ | ✅ (`recentActivity`) | Static `<style>` | ✅ | `0 / 0` (clips text) | **342** ❌ | 1 | **3** (3.19, **1.00**) |
| `vision` | startup | [`vision/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/vision/index.tsx) | 531 | ✅ | ❌ | ✅ | ✅ (`recentActivity`) | CSS `${...}` | ✅ | `0 / 0` | **10** ✅ | 1 | **5** (**1.04** white CTA) |
| `human` | startup | [`human/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/human/index.tsx) | 434 | ✅ | ❌ | ❌ | ✅ (`recentActivity`) | Static `<style>` | ❌ | `0 / 0` | **89** ⚠️ | 10 | **5** (**1.23** text) |
| `the-machine` | agency | [`the-machine/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-machine/index.tsx) | 412 | ❌ | ❌ | ✅ | ✅ (`recentActivity`) | None | ✅ | `0 / 0` | **34** ✅ | 5 | **5** (4.23) |
| `the-club` | agency | [`ClubTemplateV2.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/ClubTemplateV2.tsx) | 1322 | ✅ | ⚠️ (Client) | ❌ | ❌ **Dropped** | WebGL Shader Err | ✅ | `0 / 0` | **1,936** ❌ | 16 | **1** (**1.00**; fold black) |
| `the-builder` | entrepreneur | [`the-builder/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-builder/index.tsx) | 185 | ❌ | ❌ | ❌ | ✅ (`recentActivity`) | None | ❌ | `0 / 0` | **216** ❌ | 5 | **5** (2.68) |
| `the-visionary` | entrepreneur | [`the-visionary/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-visionary/index.tsx) | 206 | ✅ | ❌ | ❌ | ✅ (`recentActivity`) | Static `<style>` | ✅ | `0 / 0` | **495** ❌ | 1 | **5** (low contrast) |
| `the-hustler` | entrepreneur | [`the-hustler/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-hustler/index.tsx) | 551 | ✅ | ❌ | ✅ | ✅ (`recentActivity`) | CSS `${...}` | ✅ | `0 / 0` | **18** ✅ | 1 | **5** (white-on-white btn) |
| `the-aesthete` | influencer | [`the-aesthete/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-aesthete/index.tsx) | 615 | ✅ | ❌ | ✅ | ✅ (`recentActivity`) | CSS `${...}` | ✅ | `0 / 0` | **18** ✅ | 1 | **5** (white-on-white btn) |
| `the-creator` | influencer | [`the-creator/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-creator/index.tsx) | 564 | ✅ | ❌ | ✅ | ✅ (`recentActivity`) | CSS `${...}` | ✅ | `0 / 0` | **10** ✅ | 1 | **4** (activity white quote) |
| `the-voice` | influencer | [`the-voice/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-voice/index.tsx) | 634 | ✅ | ❌ | ❌ | ✅ (`recentActivity`) | Static `<style>` | ✅ | `0 / 0` | **10** ✅ | 1 | **5** (faint grey text) |
| `the-studio` | agency | [`StudioTemplate.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/StudioTemplate.tsx) | 2074 | ✅ | ❌ (`L1235` dead) | ❌ | ✅ (`recentActivity`) | Static `<style>` | ✅ | `0 / 0` | **496** ❌ | 1 | **5** (`INITIATE BRIEF`) |
| `the-stack` | individual | [`the-stack/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-stack/index.tsx) | 865 | ✅ | ✅ | ❌ | ✅ (`recentActivity`) | **Unescaped JSON-LD** | ❌ | `0 / 0` | **365** ❌ | 7 | **5** (white-on-sage btn) |
| `the-bookshelf` | influencer | [`the-bookshelf/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-bookshelf/index.tsx) | 1232 | ✅ | ✅ | ❌ | ✅ (`recentActivity`) | **Unescaped JSON-LD** | ❌ | `0 / 0` | **357** ❌ | 6 | **3** (tan `1H AGO` header) |
| `the-cube` | startup | [`the-cube/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-cube/index.tsx) | 935 | ✅ | ✅ | ❌ | ✅ (`recentActivity`) | **Unescaped JSON-LD** | ❌ | `0 / 0` | **449** ❌ | 8 | **5** (`4.23` white-on-orange) |
| `the-monolith` | agency | [`the-monolith/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-monolith/index.tsx) | 896 | ✅ | ✅ | ❌ | ✅ (`recentActivity`) | **Unescaped JSON-LD** | ❌ | `0 / 0` | **373** ❌ | 6 | **5** (`3.33` cream-on-orange) |
| `the-metro` | individual | [`the-metro/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-metro/index.tsx) | 541 | ✅ | ❌ | ❌ | ❌ Reads `.activity` | CSS `${...}` | ❌ | **`+1 / +590px`** ❌ | **324** ❌ | 3 | **2** (`3.75`, **1.00** UNOOL) |
| `the-noren` | agency | [`the-noren/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-noren/index.tsx) | 593 | ✅ | ❌ | ❌ | ❌ Reads `.activity` | CSS `${...}` | ❌ | `0 / 0` | **353** ❌ | 3 | **5** (`2.65–3.18` terracotta) |
| `the-desktop` | startup | [`the-desktop/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-desktop/index.tsx) | 548 | ✅ | ❌ | ❌ | ❌ Reads `.activity` | CSS `${...}` | ❌ | `0 / 0` | **443** ❌ | 7 | **5** (`2.80` Kanji badge) |
| `the-calendar` | entrepreneur | [`the-calendar/index.tsx`](file:///C:/Users/HP/.gemini/antigravity/worktrees/UNOOLNEW/studio_prompt_audit_low_power/components/profile/templates/persona/the-calendar/index.tsx) | 539 | ✅ | ❌ | ❌ | ❌ Reads `.activity` | CSS `${...}` | ❌ | `0 / 0` | **380** ❌ | 3 | **5** (`3.96` cream/orange) |

---

### 3B. Scored Evaluation Rubric (0–100) & Verdicts

> Scores reflect verified visual composition, Playwright DOM metrics, functional wiring, and accessibility compliance as of 2026-11-15.

| Template | Visual (`20`) | Type (`15`) | Hierarchy (`15`) | Responsive (`15`) | Custom (`10`) | A11y (`10`) | Function (`10`) | Distinct (`5`) | **Total (`100`)** | **Verdict** | **Primary Screenshot & Code Evidence** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| `lover` | 14 | 12 | 13 | 14 | 6 | 6 | 6 | 2 | **73** | **Improve** | Clean minimal/extreme scaling; Spark Free safe; white-on-white `LinkedIn` btn in `RecentActivitySection`; lacks `openTo`. |
| `lone` | 15 | 13 | 13 | 14 | 6 | 6 | 6 | 3 | **76** | **Improve** | Clean stark dark card layout & `25KB/40ms` budget; `New Post Shared With You` is `2.86:1` blue-on-dark (`lone@1440`); lacks `openTo`. |
| `energy` | 15 | 12 | 13 | 14 | 6 | 7 | 6 | 3 | **76** | **Improve** | Strong contrast overall (`1` UNOOL badge sample); Spark Free safe; lacks `openTo`; shares card skeleton with `lover`/`lone`/`vision`. |
| `rebellion` | 11 | 10 | 8 | 10 | 4 | 5 | 4 | 4 | **56** | **Redesign** | `rebellion-mobile-390.png` clips `"184..."` & `"ARCH"` in `overflow-hidden`; `3.19:1` red-on-dark; `342` chars fake Minimal copy; no `openTo`/`convUrl`. |
| `vision` | 13 | 12 | 13 | 14 | 6 | 4 | 6 | 2 | **70** | **Consolidate / Improve** | **Severe CTA contrast `1.04:1`** (`Get in Touch` white on `#FAFAFC`); identical card layout to `lone`/`energy`; Spark Free safe. |
| `human` | 11 | 10 | 9 | 12 | 4 | 3 | 5 | 3 | **57** | **Redesign** | `human-desktop-1440.png` truncates `"THE BABBAGE EN"`; `1.23:1` dark text on `#123040` in `RecentActivitySection`; `10` unhidden SVGs; no reduced-motion. |
| `the-machine` | 10 | 10 | 8 | 11 | 5 | 3 | 6 | 3 | **56** | **Redesign** | **No `<h1>`** (`<div className="m-giant-name">`); orange badge overflows/clips right edge (`the-machine-desktop-1440.png`); white social icons invisible on white bg. |
| `the-club` | 9 | 9 | 5 | 10 | 4 | 4 | 2 | 4 | **47** | **Redesign** | **WebGL shader compile error** (`uScrollProgress`); fold below hero renders **solid black** on initial load (`the-club-desktop-1440.png`); **1,936 chars** fake Minimal copy; `404` `/api/profile/contact`. |
| `the-builder` | 12 | 11 | 10 | 12 | 4 | 3 | 4 | 3 | **59** | **Improve** | **No `<h1>`** across all 4 modes; `2.68:1` sage text (`POSITION`/`NETWORK`); `216` chars fake Minimal copy; drops `openTo`/`convUrl`. |
| `the-visionary` | 13 | 11 | 6 | 13 | 4 | 5 | 4 | 3 | **59** | **Redesign** | **Silently discards `profile.bio`** unless `positioning` prop is supplied (`the-visionary-desktop-1440.png`); injects 495 chars of hardcoded essays; white-on-white `LinkedIn` pill. |
| `the-hustler` | 13 | 12 | 13 | 14 | 6 | 5 | 6 | 2 | **71** | **Consolidate** | Visual skeleton near-identical to `the-creator`/`the-aesthete`; white-on-white `LinkedIn` pill (`the-hustler-desktop-1440.png`); lacks `openTo`. |
| `the-aesthete` | 14 | 12 | 13 | 14 | 6 | 5 | 6 | 2 | **72** | **Consolidate** | Clean serif accents but structurally redundant with `lover`/`the-creator`; white-on-white `LinkedIn` pill (`the-aesthete-desktop-1440.png`); lacks `openTo`. |
| `the-creator` | 13 | 11 | 13 | 14 | 6 | 4 | 6 | 2 | **69** | **Consolidate / Improve** | `the-creator-desktop-1440.png` shows near-invisible white quote text on light-gray `RecentActivitySection` + dark green label on black; `130KB/210ms` budget without 3D justification. |
| `the-voice` | 13 | 12 | 13 | 14 | 5 | 4 | 5 | 2 | **68** | **Consolidate / Improve** | `the-voice-desktop-1440.png` has faint grey text on grey activity card + dark header label on black; lacks `openTo` & `convUrl`. |
| `the-studio` | 13 | 11 | 9 | 12 | 5 | 5 | 6 | 4 | **65** | **Improve** | `the-studio-desktop-1440.png` shows `>` arrow overlapping `"X / Twitter"`, hardcoded `"Accepting Select Briefs"`, duplicate `"UTC UTC"`, `496` chars fake Minimal copy, `2,074` LOC monolith. |
| `the-stack` | 13 | 12 | 11 | 13 | 5 | 4 | 4 | 4 | **66** | **Improve** | `the-stack-desktop-1440.png`: ~50% empty whitespace inside Card 1; unescaped JSON-LD XSS; renders dead-toast `Call`/`WhatsApp` buttons without phone; `365` chars fake Minimal copy. |
| `the-bookshelf` | 14 | 11 | 11 | 12 | 5 | 4 | 4 | 5 | **66** | **Improve** | High craft concept, but clips `"itHub Repositor"` on first spine (`the-bookshelf-desktop-1440.png`), misspells `"Github"`, omits `Research Notes` in footer, renders dead `Call`/`WhatsApp` toasts, unescaped JSON-LD XSS. |
| `the-cube` | 12 | 12 | 10 | 10 | 5 | 4 | 5 | 5 | **63** | **Improve** | `the-cube-mobile-390.png` overlaps `"science."` bio text with `<` nav arrow; fixed `100vh` card traps huge empty space; `4.23:1` white-on-orange contrast; unescaped JSON-LD XSS. |
| `the-monolith` | 12 | 12 | 10 | 11 | 5 | 4 | 5 | 5 | **64** | **Improve** | `the-monolith-desktop-1440.png` overlaps `MADE WITH UNOOL` badge across `02/03/04` nav tabs; `3.33:1` cream-on-orange; `373` chars fake Minimal copy; unescaped JSON-LD XSS. |
| `the-metro` | 11 | 11 | 9 | 5 | 4 | 4 | 3 | 4 | **51** | **Redesign (Responsive + Wiring)** | **Mobile overflow `+1px` (full) / `+590px` (extreme)** on `390px`; reads `.activity` (never shows Studio posts); `3.75:1` accent contrast; `324` chars fake Minimal copy; CSS `${...}` interp. |
| `the-noren` | 11 | 11 | 9 | 12 | 4 | 3 | 3 | 5 | **58** | **Improve** | **Curtain panels 2–4 clipped/half-hidden at load** (`scaleY(0)` + `0.3s–0.66s` delay + `1s` animation, zero reduced-motion); reads `.activity`; `2.65–3.18:1` terracotta contrast; clips `"GitHub Repo"`. |
| `the-desktop` | 12 | 11 | 9 | 10 | 4 | 4 | 3 | 5 | **58** | **Improve** | `the-desktop-mobile-390.png` clips Win95 titlebar `"System Identity"` & `"4 Object(s)"` behind `-`/`x` buttons; drops proof values (`125K+`); reads `.activity`; `2.80:1` `"窓 OS 95"`. |
| `the-calendar` | 13 | 12 | 10 | 13 | 4 | 4 | 3 | 5 | **64** | **Improve** | Strong visual identity, but reads `.activity` (drops `recentActivity`), `3.96:1` cream-on-orange contrast, `380` chars fake Minimal copy, no reduced-motion, CSS `${...}` interp. |

---

## 4. Template Consolidation & Classification (Fixed vs. Customizable)

### 4A. SaaS Card Redundancy Analysis
Eight templates (`lover`, `lone`, `energy`, `vision`, `the-hustler`, `the-aesthete`, `the-creator`, `the-voice`) share an almost identical vertical card skeleton (`Avatar` -> `Name/Headline` -> `Bio` -> `Proof Grid` -> `Link Stack` -> `RecentActivitySection` -> `Contact/CTA`), differing primarily in CSS variables (`bg`, `card`, `accent`, `font`). Rather than maintaining 8 separate `434–659` LOC files with duplicated bugs, these should be consolidated into **3 strongly differentiated archetype families** (`Editorial Journal`, `Dark Stark Canvas`, `Bold High-Contrast Deck`) driven by curated design tokens.

### 4B. Fixed vs. Safely Customizable Matrix

| Control Axis | Fixed (Owned by Template Archetype) | Safely Customizable (`theme.customization` Schema) | Never Exposed (Security / Layout Safety) |
| :--- | :--- | :--- | :--- |
| **Spatial Layout & Mechanics** | Grid geometry, 3D cube faces, Noren curtain panels, Bookshelf spine angle, Metro route SVG, Win95 window chrome, Calendar binder | Optional section visibility toggles (`showProofs`, `showOpenTo`, `showRecentActivity`, `showAvailability`) | Freeform drag-and-drop coordinates or raw HTML injection |
| **Typography** | Scale ratios (`h1`/`body` clamp curves), tracking, heading weight | Curated 3-option font pack per family (`editorial-serif`, `geometric-sans`, `technical-mono`) | Arbitrary external `@import` CSS URLs |
| **Color & Contrast** | Background/surface lightness polarity, border tokens, WCAG AA auto-contrast foreground calculator | Accent color (`#RRGGBB` Zod-validated) + `colorMode` (`auto` / `light` / `dark` on multi-mode templates) | Unchecked `${accentColor}` interpolation into `<style dangerouslySetInnerHTML>` or raw `customCss` |
| **Profile Content & Metadata** | Empty-state suppression (zero fabricated essays/statuses when fields are empty) | `availabilityStatus`, `timezone`, `location`, `conversationUrl`, pinned link badge, `openTo` pills, `links`, `proofPoints` | Hardcoded `"Tokyo, JP"`, `"Accepting Briefs"`, or fallback `"I work at the intersection..."` overriding user `bio` |

---

## 5. New-Template Justification & Gap Analysis

Before introducing *any* net-new template, the existing **23 templates must be repaired and deduplicated**, because adding a 24th template today would multiply maintenance entropy (`RecentActivitySection` contrasts, `openTo` omissions, `.activity` typos, and `customCss` hazards).

**Once P0–P2 parity fixes land**, competitor analysis against Bento.me (shut down), Peerlist, and Contra justifies **1 high-ROI architectural addition** (replacing redundant SaaS card clones rather than inflating total count):

1. **Recommended New / Evolved Archetype: `The Bento` (Interactive Modular Bento Grid)** *(High Market Justification)*:
   - **Market Gap**: With **Bento.me shut down**, creators/developers lack a modern Apple-inspired modular tile layout (`2×2` wide hero link card, `1×1` social handle counter, `2×1` latest Studio post showcase, verified metric tile). None of UN OOL's 23 templates currently render a true responsive `bento` grid with rich link previews.
2. **Optional Upgrade (Not Separate Template): Creator Media-Kit & Services Block Mode**:
   - Instead of creating separate "Beacons Clone" or "Contra Clone" templates, enrich `ProfileLink` and `ProofPoint` schemas (`linkStyle: 'pill' | 'rich-card' | 'service-tier'`, optional `subtitle` / `price` / `ctaLabel`) so existing editorial templates (`the-studio`, `the-stack`, `the-bookshelf`) natively serve freelancers and sponsored creators cleanly.
