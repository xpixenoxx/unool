# Unool Studio — Settings Final Product Architecture & Experience Specification

**Status:** Implemented Across Stages 0–8 in Workspace (`app/dashboard/settings/`, `components/dashboard/settings/`, `app/api/`, `lib/`, `supabase/migrations/20261116*`); Live DB Apply & Stage 9 Production Verification Gated on Human Sign-Off  
**Supersedes:** Conflicting 7/8/9-tab layout in `SETTINGS_COMPLETE_PRODUCT_INVESTIGATION_AND_TRANSFORMATION_BLUEPRINT.md`

> **Implementation Reconciliations (Observed in Repository):**
> - **Fonts (`CHG-14`):** `app/layout.tsx` consolidates to 3 families (`Cormorant Garamond`, `Geist Mono`, `Geist`) via `<link>` stylesheet rather than `next/font/google` so offline/air-gapped builds never hang fetching fonts at compile time.
> - **Legacy Profile Tabs (`CMP-01`):** `?tab=templates` and `?tab=template-analytics` normalize to `ai-voice` with an inline `presenceNotice` callout linking to `/dashboard/profile` (`components/dashboard/settings/types.ts`, `SettingsClient.tsx`). `/dashboard/channels` server-redirects to `/dashboard/settings?tab=channels`, while Dashboard Overview `<PlatformConnections>` modal stays active.
> - **Notification Schema (`user_preferences`):** Persists `theme`, `timezone`, `time_format`, `date_format`, `currency_display`, `digest_frequency`, `notify_token_expiry`, `notify_security_alerts`, `notify_publishing`, and `ai_personalization_enabled` (`supabase/migrations/20261116000001_settings_security_rls_and_tables.sql`).

---

## 1. Independent Information Architecture Evaluation (`PART 3.3` & `PART 5`)

### 1.1 Structurally Distinct Options Compared

| Dimension | Option A: Prior Blueprint Flat 8/9-Tab Model | Option B: Minimal 4-Tab Hub (`Account`, `Workspace`, `Channels`, `Billing`) | **Option C (RECOMMENDED): Clean 2-Group 6-Section IA (`Personal` + `Workspace`)** |
|---|---|---|---|
| **Navigation Structure** | 8–9 items (`Platforms`, `Workspace`, `Team`, `AI Voice`, `Notifications`, `Billing`, `Security`, `Developers`, `Danger Zone`) | 4 broad tabs mixing unrelated domains (`Account+Security+Privacy`, `Workspace+Team+AI`) | **Personal (3):** `account`, `security`, `notifications` / **Workspace (3):** `channels`, `ai-voice`, `workspace` |
| **Personal vs. Workspace Clarity** | Weak — personal Security & workspace Channels/Developers sit in one mixed column | Partial — multi-concern tabs become long scrolling forms | **Crystal Clear** — two labeled rail groups (`Your Account` vs `Workspace: <Name>`) |
| **Honesty vs. Vaporware** | Ships unbacked `Developers` & future `Notifications` | Forces `Billing` to duplicate `/dashboard/billing` (2,963 lines) | Zero fake features; `Developers` decommissioned until `/api/v1/*` ships; Plan summary links to `/dashboard/billing` |
| **Role & Scope Safety** | `Danger Zone` blends Workspace delete & Personal account delete | Risky mixing of `Viewer`-editable prefs & `Owner`-only governance inside shared panes | Workspace destruction lives safely inside `workspace`; Personal Erasure lives safely at bottom of `account` |
| **Mobile Ergonomics** | 9 horizontal pills or cramped drawer | Fast switching, overly deep vertical scroll per tab | Clean 6-item list / sticky section bar, zero overflow, shallow per-section focus |
| **Verdict** | **Rejected** — internal count contradiction + dead developer tab | **Rejected** — conflates AI defaults with team governance & forces mega-forms | **Recommended** — simplest truthful architecture aligned to real Unool capabilities |

---

## 2. Final Recommended Settings Structure (`PART 5` Deliverable)

### 2.1 Exact Navigation Hierarchy, Names, Descriptions & Deep Links

| Group | Canonical Tab ID (`?tab=`) | Display Name | Plain-English Subtitle (UI) | Why This Section Exists |
|---|---|---|---|---|
| **Personal** *(Your Account)* | `account` *(Provisional Default Landing — see Unresolved Decision `UD-01`)* | **Account & Preferences** | Your name, timezone, display formats, data export, and account closure. | Gives every user (including Viewers) one unmistakable personal home synced across devices, without touching shared team config. |
| **Personal** | `security` | **Security & Sessions** | Password, two-factor authentication, active devices, and quick-switch hygiene. | Centralizes credential protection, TOTP verification, `auth.sessions` visibility, and saved-device switch token revocation. |
| **Personal** | `notifications` | **Notifications & Privacy** | Email alerts we send, AI processing disclosure, and privacy preferences. | Replaces static toggles with honest DB-backed email alerts (`Token Expiry`, `Publish Failure`, `Security`, `Product Updates`) + transparent AI opt-in controls. |
| **Workspace** *(`Active Workspace`)* | `channels` | **Connected Channels** | Social accounts, connection health, permissions, and stream settings. | Primary operational control plane for connecting/reconnecting 19+ platforms per workspace with zero cross-workspace bleed. |
| **Workspace** | `ai-voice` | **AI & Brand Voice** | Tone, audience, topics, and brand persona used by Composer, Ideas, and FlightPlan. | Eliminates `?tab=persona` failures and tunes AI output consistently across Unool Studio while letting users retake the Guided Calibrator. |
| **Workspace** | `workspace` | **Workspace, Team & Plan** | Workspace name, team roles, seat usage, plan summary, and workspace closure. | Consolidates workspace identity, RBAC-protected team management, honest Cashfree plan/usage summary (linking to `/dashboard/billing`), and workspace deletion/leave. |

### 2.2 Complete Change Disposition (`PART 5`)

- **Retained**: Connected social accounts OAuth & custom platform connect modals (`channels`); Studio AI 7-field form & Guided Calibrator launch (`ai-voice`); Account Deletion modal confirmation guardrail (hardened in `account` & `workspace`).
- **Improved**: Workspace name save (`workspace`, real RBAC & persistence feedback); Token expiry alerts & notifications (`notifications`, real DB persistence); Sign-out flow (clears `unool_saved_accounts_v1` & impersonation cookies safely); Mobile responsive shell (`<=48px` targets cleanly -> `>=44px`).
- **Redesigned**: Page typography & Warm Biscuit WCAG AA tokens; 2-group navigation rail with active workspace indicator; Truth-backed Readiness Strip; Multi-account Connected Channel cards with explicit Reconnect vs Disconnect (showing automation dependency impact).
- **Relocated**: Active Template summary & 320px preview (`Templates` tab) and 30-day Profile metrics (`Template Analytics` tab) -> live exclusively inside `/dashboard/profile` (`Public Profile Builder`); Full Cashfree checkout/invoice history -> `/dashboard/billing`; Data Export & Personal Deletion -> bottom of `account`; Leave / Delete Workspace -> bottom of `workspace`.
- **Consolidated**: Studio Onboarding Calibration + Edit Persona + Composer persona banner -> unified `ai-voice` section; Duplicate `/api/auth/logout` & `/api/auth/signout` -> single canonical sign-out contract.
- **Replaced**: Legacy `/dashboard/settings/billing/BillingClient.tsx` (`free/basic/growth/scale` Stripe dead code) -> deleted after confirming `/dashboard/settings/billing` redirects to `/dashboard/billing`; Generic `Danger Zone` tab -> distinct **Workspace Hazard** (Owner leave/delete) vs **Personal Account Erasure** cards so users never confuse closing a team workspace with erasing their entire Unool login.
- **Removed**: `IntegrationsTab` (API keys pointing to non-existent `api_keys` DB table + `localStorage`-only webhooks) behind `public_api_enabled = false` until real `/api/v1/*` and server webhook dispatch exist; fake `mfaEnabled` dead state; `loadTemplate()` mount waterfall & hardcoded fake social URLs in `SettingsClient.tsx`; production `debug[]` leakage from `/api/platform/connections`.
- **Newly Introduced**:
  1. `GET /api/user/export` (DPDP/GDPR JSON portability download);
  2. `GET /api/auth/sessions` + `POST /api/auth/sessions/revoke-others` (`auth.sessions` management);
  3. Real `POST /api/auth/change-password` rotating `security_version` cleanly;
  4. DB-persisted `user_preferences` / `notification_preferences` (timezone, 12h/24h time, date format, currency display preference INR/USD, 4 truthful email alert switches, `ai_personalization_enabled`);
  5. Workspace Ownership Transfer flow & multi-member deletion guardrails;
  6. Admin Impersonation lock banner + backend write blocks.

### 2.3 Legacy URL & Deep-Link Compatibility Map (`PART 5.8–5.9` & `PART 7.4`)

| Incoming Path / Query | Source Callers in Repo | Resolved Behavior |
|---|---|---|
| `/dashboard/settings` *(no query)* | Sidebar nav, `AnalyticsDNA`, `FollowGateManager`, `StoryIntake`, `BrandMaterialsSection` | Lands on `account` *(or `channels` if `UD-01` selects `channels`)*; update the 4 "Connect Social Accounts" callers to explicitly use `/dashboard/settings?tab=channels` |
| `/dashboard/settings?tab=platforms` | Legacy bookmarks, `privacy/page.tsx` refs | Maps seamlessly to `channels` tab |
| `/dashboard/settings?tab=studio` or `?tab=persona` | `ComposerClient.tsx:1827,2043`, `StudioIdeaGenerator.tsx:394` | Maps seamlessly to `ai-voice` tab (also updates callers to canonical `?tab=ai-voice`) |
| `/dashboard/settings?tab=billing` | `enforcer.ts:48`, `profile/route.ts:128,142`, `profile/domain/route.ts:61` | Opens `workspace` scrolled/highlighted to `#plan-usage` summary card with instant `"Open Billing & Upgrade"` CTA (update backend `upgradeUrl`s to `/dashboard/billing`) |
| `/dashboard/settings/billing` | Direct URL / old bookmarks | Existing server redirect (`app/dashboard/settings/billing/page.tsx`) continues -> `/dashboard/billing` |
| `/dashboard/settings?tab=templates` | Legacy bookmarks | Renders clean 1-click redirect banner -> `/dashboard/profile?tab=design` (or auto-redirects with query notice) |
| `/dashboard/settings?tab=template-analytics` | Legacy bookmarks | Renders clean 1-click redirect banner -> `/dashboard/profile?tab=domain` |
| `/dashboard/settings?tab=danger` | `privacy/page.tsx:534` (`Delete Account` wording) | Maps to `account#delete-account` anchor cleanly |
| `/dashboard/settings?tab=integrations` | Legacy bookmarks | Redirects to `account` with non-error info toast (`"Developer API is currently in private roadmap"`) unless feature flag enabled |

### 2.4 Placement of Advanced & Destructive Controls
- **Zero separate `"Danger Zone"` nav item**: Prevents casual misclicks and separates workspace-level lifecycle (`Transfer Ownership`, `Leave Workspace`, `Delete Workspace`) from user-level lifecycle (`Export Personal Data`, `Delete Unool Account`).
- Each destructive zone renders inside a subdued `#FFF8F6` (`#9E2A2B` border) hazard container at the bottom of its respective tab, disabled during **Admin Impersonation**, requiring both explicit confirmation input (`DELETE` or workspace name) AND password/OTP re-verification for account erasure.

---

## 3. Configuration Readiness Indicator (Non-Gamified `PART 3.2`)

A single slim **Workspace & Account Readiness Strip** renders at the top of Settings only while `<4` checks remain incomplete (collapsible once complete—no XP numbers, no percentages, no confetti badges):

1. **Connected Channel**: Pass if >=1 active non-expired row in active workspace's `platform_connections` (`status = 'connected'` and `(expires_at IS NULL OR expires_at > now())`). Warns amber if any channel is `expired` -> CTA jumps to `?tab=channels`.
2. **AI Brand Voice**: Pass if `studio_profile` has non-empty `role`, `audience`, `tone`, and `businessDomain`/`doing` -> CTA jumps to `?tab=ai-voice`.
3. **Timezone Verified**: Pass if user/workspace has explicit IANA timezone saved (`Asia/Kolkata`, etc., matching or deliberately differing from browser) -> CTA jumps to `?tab=account#locale`.
4. **Account Security**: Pass if email confirmed & password set (shows subtle bonus badge if TOTP 2FA is active) -> CTA jumps to `?tab=security`.

---

## 4. Roles, Permissions & Collaboration Matrix (`PART 3.7`)

*(Enforced identically by backend APIs, Postgres RLS, and UI controls. Note: multi-seat workspaces only exist on eligible paid plans; solo Spark/Creator users implicitly hold `owner` of 1 workspace.)*

| Control / Section | Owner | Admin | Editor | Viewer | Suspended / Revoked | Admin Impersonating User |
|---|---|---|---|---|---|---|
| **Account & Locale (`account`)** | Edit | Edit | Edit | Edit | Blocked at middleware -> `/signin` or `/suspended` | **Read-Only** (Name/Timezone disabled) |
| **Data Export (`GET /api/user/export`)** | Allowed (Personal + Owned WS) | Allowed (Personal data) | Allowed (Personal data) | Allowed (Personal data) | Denied (`403`) | **Blocked (`403`)** — PII protection |
| **Delete Personal Account** | Allowed (Blocked/guarded if other members exist without transfer) | Allowed (Leaves workspace first) | Allowed | Allowed | Support only | **Blocked (`403`)** |
| **Security: Password, 2FA, Sessions (`security`)** | Edit | Edit | Edit | Edit | Denied | **Blocked (`403`)** |
| **Notifications & AI Prefs (`notifications`)** | Edit | Edit | Edit | Edit | Denied | **Read-Only** |
| **Connected Channels: View (`channels`)** | View | View | View | View (Handles/Status only; no OAuth actions) | Denied | View |
| **Connected Channels: Connect / Reconnect / Disconnect / Kick Stream** | Edit | Edit | Disabled (`"Admin/Owner only"`) *unless workspace setting delegates* | Hidden / `403` | Denied | **Blocked (`403`)** for Disconnect/Stream secret change |
| **AI & Brand Voice (`ai-voice`)** | Edit | Edit | Edit *(Workspace voice)* / Read | Read-Only (`"Owner/Admin/Editor configures brand voice"`) | Denied | View only |
| **Workspace Name (`workspace`)** | Edit | Edit | Read-Only (`"Owner/Admin only"`) | Read-Only | Denied | **Blocked (`403`)** |
| **Team: View Members** | View | View | View (Active members only; hides email PII if configured) | View | Denied | View |
| **Team: Invite / Remove / Role Change** | Full (except self-remove as sole owner) | Invite/Remove Editors & Viewers; cannot remove Owner/Admin | Hidden (`403`) | Hidden (`403`) | Denied | **Blocked (`403`)** |
| **Plan Summary / Open `/dashboard/billing` / Cancel** | Full (Can upgrade & cancel) | View plan & usage; Cancel blocked (`Owner only` — *or configurable in UD-04*) | View plan name only | View plan name only | View status only | **Blocked (`403`)** for Cancel |
| **Workspace Ownership Transfer & Delete Workspace** | Allowed (`Transfer` -> any active Admin/Member; `Delete` deletes WS) | Leave Workspace only; Transfer/Delete disabled (`"Owner only"`) | Leave Workspace only | Leave Workspace only | Denied | **Blocked (`403`)** |

**Lifecycle Edge Rules (`PART 3.7`)**:
- **Ownership Transfer**: Two-step invite/accept or instant transfer among verified active workspace members -> promotes target to `owner`, demotes previous owner to `admin`, logs `workspace_security_events`, invalidates cached workspace context.
- **Owner Leaving**: Blocked with explicit message `"Transfer ownership to another member or delete this workspace before leaving"` until resolved.
- **Member Removal**: Immediately deletes `workspace_members` row, invalidates active `active_workspace_id` context on next request (`verifyWorkspaceAccess` -> `false` redirects user back to their remaining workspace or personal fallback), preserves workspace posts/connections untouched.
- **Pending Invites & Seat Quotas**: `usedSeats = count(status = 'active') + count(status = 'invited')`; UI renders two subtle counts (`"3 active • 2 pending (5 of 5 seats used)"`) with **Resend** and **Revoke** actions so orphaned pending invites never mysteriously block seat limits.

---

## 5. Data Ownership & Configuration Boundaries (`PART 3.8`)

| Setting / Data Item | Authoritative Level | Canonical Storage Table.Column | Duplicate / Legacy Conflict Removed | Notes |
|---|---|---|---|---|
| **Display Name / Full Name** | **Individual User** | `public.users.full_name` *(mirrored to `auth.users.raw_user_meta_data.full_name` on save)* | Stop diverging across `users` vs `user_metadata`; keep `profiles.name` independent as *Public Bio Card Display Name* | Clearly distinguish Account Name vs Public Portfolio Name |
| **Email & Verification State** | **Individual User** | `auth.users.email` + `public.users.email` *(triggered sync)* | Remove unsynced direct copies except display snapshot | Public portfolio opt-in `profiles.email` remains separate at Profile level |
| **Timezone & Locale Formatting** | **Dual Clear Boundary** *(User default + Workspace publish TZ)* | **Personal UI/Digest TZ:** `user_preferences.timezone`, `time_format`, `date_format`, `currency_display` / **Workspace Schedule Default:** `workspaces.settings.timezone` | Stop storing primary account timezone exclusively on `profiles.timezone` | Profile card still lets creator display or hide city/timezone on `/u/...`, seeded by default from User TZ |
| **Password Auth & Security Epoch** | **Individual User** | Supabase native Auth OR dedicated non-JWT server table `user_auth_secrets` *(plus `public.users.security_version INT DEFAULT 1`)* | Remove `password_hash` from JWT-exposed `raw_user_meta_data` | `switchToken` embeds `sv` claim matching `public.users.security_version` |
| **Email Notification & AI Opt-In Prefs** | **Individual User** | `user_preferences` (1 row per `user_id`, small JSONB or typed booleans) | Eliminate empty/static `NotificationsTab` local state | Triggers check `user_preferences` before dispatching email |
| **Saved Quick-Switch List** | **Browser Device Only** | `localStorage['unool_saved_accounts_v1']` (max 8 accounts, capped by device logout & `security_version`) | Wiped completely on explicit Sign Out or `"Clear saved accounts on this device"` | Marked clearly in `security` as device-local convenience |
| **Workspace Name & Operational Settings** | **Workspace** | `workspaces.name`, `workspaces.settings` | Never store active workspace preferences inside `profiles` | Strict Owner/Admin write guard |
| **Connected Social Channels & Kick RTMP** | **Workspace + Account** | `platform_connections` (`workspace_id`, `platform`, `platform_user_id`, `created_by_user_id`) | Fix RLS (`user_id = auth.uid()` -> workspace-aware membership check) + remove Strategy 3 cross-workspace bleed | Connected channels belong to the **Workspace**, tracking which member linked them (`user_id`) |
| **AI & Brand Voice (`Studio Profile`)** | **Workspace** *(tied to workspace's active brand)* | `profiles.studio_profile` *(or `workspaces.settings.studio_profile` fallback when no public profile exists yet!)* | Fix dependency where headless users without `profiles` row fail to save AI voice! | Fall back cleanly to `workspaces.settings.studio_profile` if workspace hasn't initialized `profiles` |
| **Subscription, Plan Limits & Payment Orders** | **Workspace** *(paid by Owner/Billing Admin)* | `workspaces.plan` (normalized `'spark' | 'creator' | 'pro' | 'studio'`), `subscriptions`, `payment_orders` | Align DB default `'free'` -> `'spark'`; align `subscriptions` RLS to include workspace owners/admins for viewing history; remove dead `stripe_*` UI refs | Single canonical `lib/billing/plans.ts` (`spark`/`creator`/`pro`/`studio`) |

---

## 6. Typography & Visual Identity System (`PART 3.4` & `PART 6`)

### 6.1 Consolidating the 7-Font Conflict
- **Current Bug**: Root layout loads `Cormorant Garamond` (14 faces), `Geist`, `Geist Mono`, `Plus Jakarta Sans`, `Syne`; `overview.css` imports `Lora`; `automation.css` imports `Newsreader` + `Plus Jakarta Sans`; `globals.css` adds Inter `cv02/03/04/11` to `Geist` and invalid `ring: 2px;`.
- **Target System (`next/font/google` / `@next/font` — 0 render-blocking `<link>` tags)**:
  1. **Primary UI Sans — `Geist`** (`400`, `500`, `600`, `700`; fallback `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`): Chosen for crisp optical kerning, legible `13px–14px` form labels, strong `tabular-nums` alignment for seat counts, token expiry timers, and billing amounts, and consistency with `DESIGN.md` & existing `globals.css` `--font-geist`. **Action:** Remove Inter-only `font-feature-settings: "cv02", "cv03", "cv04", "cv11"` from `globals.css:48`.
  2. **Monospace — `Geist Mono`** (`400`, `500`; fallback `'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace`): Used strictly for workspace IDs, OAuth handles/URLs, DNS `_unool-challenge` records, RTMP URLs/keys, and 2FA setup secrets.
  3. **Selective Editorial Accent — `Cormorant Garamond`** *(max 2 weights: `500`, `600 italic` — down from 14 faces!)*: Kept solely for sidebar brand mark & optional Overview editorial quotes (`overview.css` / `automation.css` migrated cleanly off separate `Lora`/`Newsreader`/`Syne` imports onto canonical CSS tokens). Settings itself uses **Geist exclusively** for maximum form clarity and zero font-shift CLS.

### 6.2 Settings Type Scale & Responsive Specs
| Role | Desktop Size / Line Height | Mobile (`<640px`) | Weight & Tracking | CSS Rule / Token |
|---|---|---|---|---|
| **Page Title (`H1`)** | `24px / 32px` | `22px / 28px` | `600` (Semibold), `-0.02em` | `--text-settings-h1` |
| **Section Heading (`H2`)** | `18px / 26px` | `17px / 24px` | `600` (Semibold), `-0.015em` | `--text-settings-h2` |
| **Card Group Title (`H3`)** | `14px / 20px` | `14px / 20px` | `600`, `-0.01em` *(Never 11px all-caps with poor contrast!)* | `--text-settings-h3` |
| **Body & Setting Title** | `14px / 21px` | `14px / 21px` | `500` (title) / `400` (prose), `0em` | `text-sm` |
| **Helper / Description** | `13px / 19px` | `13px / 19px` | `400`, `0em` | `#6E5A48` *(>=6.1:1 on `#FAF7F2`)* |
| **Field Label** | `13px / 18px` | `13px / 18px` | `500`, `0em` | `#3D2B1F` (`12.3:1`) |
| **Form Inputs** | `14px / 20px` (`h-10` = `40px`) | `16px / 22px` (`h-11` = `44px` prevents iOS Safari auto-zoom!) | `400` | `text-base sm:text-sm` |
| **Buttons (Primary/Secondary)** | `13px–14px` (`h-9`–`h-10`) | `14px` (`h-11` >=44px touch target) | `600`, `0em` | Primary CTA: `#3D2B1F` bg + `#FFFFFF` text (`13.1:1`) |
| **Numeric Quotas / Dates** | `14px / 20px` | `14px / 20px` | `600` + `font-variant-numeric: tabular-nums` | Never jitter layout during refresh |

### 6.3 Harmonized Tokens & Accessibility Contrast Fixes (`PART 6`)
- **Canvas & Surfaces** *(Harmonized with Unool's Warm Biscuit Dashboard Shell, replacing Cyan/Purple v1 orphan tokens & fixing dark mode parity)*:
  - Canvas BG: `#FAF7F2` (Light) / `#16120F` (Dark warm charcoal — eliminating washed zinc contrast gaps)
  - Card Surface: `#FFFFFF` (Light) / `#1F1A16` (Dark)
  - Subtle Surface / Inset: `#F4EFE6` (Light) / `#28211C` (Dark)
  - Border: `#E4D9C8` (Light) / `#382F27` (Dark)
  - Primary Ink: `#3D2B1F` (Light, `12.3:1`) / `#F5EFE6` (Dark, `13.4:1`)
  - Secondary Muted Ink: **`#6E5A48`** *(Light — replaces failing `#8B7355` 4.21:1 -> verified `6.12:1` AA!)* / `#B8A896` (Dark)
  - Primary Interactive CTA Fill: **`#3D2B1F`** with `#FFFFFF` text (`13.1:1`), Hover `#261B13`
  - Warm Brass Accent (`Border / Focus Ring / Subtle Chip Fill only`): `#C4A265` (**never white text on `#C4A265`!** Badge text on `#F5EFE2` uses `#5C4315` `>7:1`)
  - Terracotta Emphasis / Primary Link: `#A43D1E` (`>5.5:1` on `#FAF7F2` & `#FFFFFF`)
  - Focus Ring: Replace invalid `ring: 2px;` in `globals.css` with `outline: 2px solid #A43D1E; outline-offset: 2px;` + `input::selection { background: #E9D8B8; color: #261B13; }` (replacing `#2563eb` blue clash).

---

## 7. Layout Architecture & Implementation-Ready Wireframes (`PART 6`)

### 7.1 Desktop (`>=1024px`), Tablet (`640–1023px`), and Mobile (`<640px`) Layout
- **Desktop**: Centered max-width `1080px` within dashboard main pane (`px-8 py-8`). **Left sticky navigation rail (`240px`)** + **Single clean content column (`minmax(0, 1fr)`, max `740px` readable measure)** -> eliminates cramped multi-column grids and guarantees comfortable 60–75 char prose measure.
- **Tablet (`768px`)**: `200px` compact rail + fluid right column; multi-column summary tiles collapse cleanly to 2 columns.
- **Mobile (`390px`)**: Two-step clean drill-down OR sticky section bar:
  - When `/dashboard/settings` loads on `<640px` with no explicit interaction focus lock, display a compact **Settings Directory** header card (`Account`, `Security`, `Notifications` / `Channels`, `AI Voice`, `Workspace`) **plus** the active section directly below selectable via a full-width sticky `44px` section pill/sheet picker (`<button>` with `ChevronDown` opening an accessible listbox/sheet), ensuring 1-tap access to any section AND zero nested horizontal scrollbars.
  - Zero `h-7` (`28px`) icon buttons; every actionable control `min-h-[44px] min-w-[44px]` on touch viewports.

### 7.2 Section Wireframes

```text
+-----------------------------------------------------------------------------------+
| SETTINGS                          [Readiness Strip: o Channels  ✓ Voice  ✓ TZ ]   |
| Manage your personal account and active workspace ("Acme Studio").                |
+-----------------------+-----------------------------------------------------------+
| YOUR ACCOUNT          | [Active Section Content — max-width 740px]                |
|  * Account & Prefs    |                                                           |
|    Security & Access  | +-------------------------------------------------------+ |
|    Notifs & Privacy   | | Identity                                              | |
|                       | | Full Name      [ Aarav Mehta           ] [Save]       | |
| WORKSPACE: ACME       | | Login Email    aarav@acme.com   (Verified)            | |
|  [Switch v]  Owner    | +-------------------------------------------------------+ |
|    Connected Channels | | Timezone & Formats                                    | |
|    AI & Brand Voice   | | Timezone       [ Asia/Kolkata (UTC+05:30)       v ]   | |
|    Workspace & Team   | | Time Format    (o) 12-hour   ( ) 24-hour              | |
|                       | | Currency View  (o) INR (₹)  ( ) USD ($)               | |
|                       | |                  [Unsaved changes] [Discard] [Save]   | |
|                       | +-------------------------------------------------------+ |
|                       | | Data Portability & Closure (Personal)                 | |
|                       | | [Download Personal Data (.json)]                      | |
|                       | | [Hazard Card] Permanently Delete My Unool Account ->  | |
+-----------------------+-----------------------------------------------------------+
```

**Section Content Summary (`PART 5` Responsibilities)**:
1. **`account`**: Name (synced cleanly), verified email badge, Timezone & locale detector (alerts if browser TZ differs from saved TZ), Time/Date/Currency formatting prefs, Sign out current device (clearing local quick-switch cache safely), Data Export (JSON), Personal Account Deletion.
2. **`security`**: Current-password verified Change Password (or Set Password flow), real TOTP Two-Factor Auth (`Enable / Disable 2FA` + QR + backup/factor management), Active Sessions table (`Current Device` badge + `User-Agent` / `Created` / `Revoke Other Sessions`), Saved Quick-Switch Accounts (`unool_saved_accounts_v1` list on this browser with 1-click `"Remove saved accounts from this browser"`), Security Activity Log (last 10 security events).
3. **`notifications`**: Email Delivery toggles (only real/queued notifications: `Channel Token Expiry`, `Scheduled Publish Failure`, `Security & Sign-in Alerts`, `Product Announcements`), AI Processing & Privacy Card (explaining Anthropic/OpenAI/Groq context transmission + toggle `"Auto-apply Brand Voice in Composer & Ideas"` + DPDP/GDPR links).
4. **`channels`**: Active workspace indicator + filter pills (`All`, `Connected (3)`, `Needs Reconnect (1)`). Each connected account renders avatar, platform icon, `@handle`, connection expiry/health badge, dependency count badge (`"Used by SignalDM"`), explicit **`Reconnect`** CTA alongside **`Disconnect`**, plus Kick RTMP modal properly scoped to `connectionId` & workspace RBAC. Disconnected platforms sit in collapsible/searchable Connect catalog below.
5. **`ai-voice`**: Readiness pill + `"Launch 7-Step Calibrator"` + streamlined 2-column Editor (`Role`, dynamic `Stage`, `Domain`, `Audience`, `Tone`, `Style`, `Topics/Interests`) with live `80`/`120` character counters + non-intrusive `"Used across Composer, Ideas & FlightPlan"` note + **Reset to defaults** / Save bar.
6. **`workspace`**: Workspace Name input (Owner/Admin only), Team Members & Pending Invites (`Active: X`, `Pending: Y`, `Seats: X+Y / Max`, Invite form, Role dropdown, Remove button, Resend/Revoke Invite), Plan & Usage Summary (`Spark / Creator / Pro / Studio` name, usage bars for Posts/AI/Channels, Cashfree status + Next billing/period end + `"Manage Plan & Invoices -> /dashboard/billing"` CTA), and Owner-only **Workspace Governance Hazard** (`Transfer Ownership` selector & `Delete This Workspace` distinct from deleting user account).

---

## 8. Micro-Interaction & Resilience Spec (`PART 3.5`)

- **Loading**: Reserve skeleton layout dimensions matching real cards (`SettingsSkeleton`) so switching SSR->client produces zero vertical layout jump.
- **Saving & Dirty State**: Replace silent `onBlur` auto-saves on text inputs with explicit per-card **`Save Changes`** + dirty indicator + `beforeunload` & cross-tab unsaved-changes prompt (`"You have unsaved changes in Account. Discard or Save?"`). Immediate binary switches (`Notifications`, `AI Auto-Apply`) save optimistically with inline `Saving...` -> `Saved` subtle state and automatic revert + inline **`Retry`** banner on error.
- **Confirmations & Destructive Actions**: Never use native browser `confirm()` (`IntegrationsTab` had bare `confirm()`) or `alert()` (`BillingClient` had bare `alert()`); use accessible Radix `Dialog` with `aria-describedby`, explicit dependency count (`"Disconnecting @handle pauses Instagram Auto-Reply and 2 scheduled posts"`), and typed confirmation + re-authentication for account/workspace deletion.
- **Keyboard & Browser History**: Update URL via `router.replace('/dashboard/settings?tab=...', { scroll: false })` **or** `pushState` on tab switch so browser Back/Forward traverses visited Settings sections cleanly; use proper ARIA `role="tablist"` only when panels render cleanly with valid `aria-controls` IDs (or semantic `<nav aria-label="Settings">` links with `aria-current="page"`—much cleaner and avoids invalid `aria-controls` to unmounted tabs!).

---

## 9. Market Benchmarking, I18n & Legal Readiness (`PART 3.9`, `PART 3.10`, `PART 8`, `PART 3.11`)

- **SaaS Pattern Synthesis (`PART 8`)**:
  - **Linear**: Two-group (`Personal` / `Workspace`) calm left rail + crisp inline read-only role locks. Adopted. Avoided Linear's deep 25-subpage tree (overkill for Unool).
  - **Vercel**: Clear single-column cards (`max-w-[740px]`), contextual Plan/Usage pointer card + typed destructive confirmation dialogs + session/token table. Adopted.
  - **Buffer**: Dedicated Connected Channels list displaying channel health, token expiry alerts, and explicit Reconnect vs Disconnect without mixing billing into channel cards. Adopted.
- **Internationalization (`PART 3.9`)**: Build `user_preferences.timezone` (valid IANA zone validated via `Intl.DateTimeFormat`), `time_format` (`'12h' | '24h'`), `date_format`, `currency_display` (`'INR' | 'USD'`), keeping `locale: 'en'` ready for future `next-intl` string extraction without adding translation boilerplate today. Format all currencies (`₹` / `$`) and numbers (`Intl.NumberFormat`) cleanly.
- **Privacy & Legal Guardrails (`PART 3.10`)**: Replace stale copy in `app/privacy/page.tsx` and `app/terms/page.tsx` (`"Unool Pro"`, `"Account Settings"`, `"Connected Platforms"`, `"Delete Account"`, `"30 days"` Meta wording) after qualified legal review confirms Indian DPDP Act 2023 + GDPR retention wording (especially 7-year statutory financial invoice retention vs user deletion).
- **Operational Maintainability (`PART 3.11`)**: Keep all Settings mutations inside dedicated, typed Next.js Route Handlers backed by shared Zod schemas (`lib/validation/settingsSchemas.ts`), thin client tab views (`<300` lines per file), one unified `SettingsShell` with clean `SettingsContext` / props, and one canonical `requireWorkspaceRole` helper so security rules can never drift across routes.

