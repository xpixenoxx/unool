# UX AUDIT — UNOOL (`unool.co`) Extreme UI/UX & Accessibility Investigation

Evaluation of every page, user journey, persona perspective, form validation, error state, responsive layout, and WCAG accessibility requirement across the application.

---

## 1. User Journey Evaluation by Persona (Stage 5)

| Persona | Journey Tested | Key Friction & Defects Discovered | Status |
|---|---|---|---|
| **1. First-Time Visitor** | Landing page (`/`) -> Pricing (`/pricing`) -> Templates (`/templates`) -> Contact (`/contact`) | 1. Clicking a pricing tier CTA (`/signup?plan=pro`) or template CTA (`/signup?template=the-club`) navigates to `/signup`, which now persists both query parameters (`app/signup/page.tsx` — **FIXED**).<br>2. Submitting the `/contact` support/grievance form now dispatches `mailto:support@unool.co` (`app/contact/page.tsx` — **FIXED**). | **FIXED & VERIFIED** |
| **2. New Registered User** | Signup (`/signup`) -> 6-Digit OTP -> Onboarding (`/onboarding/start` -> `/onboarding/connect`) | 1. `app/signup/page.tsx` now persists `who`, `plan`, and `template` in `sessionStorage` (**FIXED**).<br>2. After OTP verification, authenticated sessions route directly to `/onboarding/start` (**FIXED**).<br>3. `/onboarding/start` saves the selected persona (`role`) and `template` to `POST /api/profile` (**FIXED**).<br>4. `/onboarding/connect/add/page.tsx:76` competitor copy replaced with *"Unool"* (**FIXED**). | **FIXED & VERIFIED** |
| **3. Experienced Creator / Operator** | Composer (`/dashboard/composer`) -> Publish Queue (`/dashboard/publish`) -> FlightPlan (`/dashboard/flightplan`) -> SignalDM (`/dashboard/automation`) | 1. Editing variant copy in `/dashboard/publish` and clicking `"Publish Now"` flushes unsaved `drafts` (`PublishClient.tsx` — **FIXED**).<br>2. FlightPlan scheduling in half-hour or 1-digit offset timezones (`Asia/Kolkata` `GMT+5:30`, `America/Denver` `GMT-7`) fixed in `localToUtc()` (`hooks/flightplan/useTimezone.ts` — **FIXED**).<br>3. `BrandMaterialsSection.tsx:1623, 1819` links updated from `/dashboard/settings/accounts` to `/dashboard/settings` (**FIXED**). | **FIXED & VERIFIED** |
| **4. User Who Makes Mistakes / Multi-Account User** | Settings (`/dashboard/settings`) -> Billing (`/dashboard/billing`) -> Sign Out / Account Switch | 1. In Settings -> Templates (`TemplatesTab.tsx`), `"Save Changes"` button initialized properly (**FIXED**).<br>2. `BillingClient.tsx` `window.open` capture scoped strictly to Cashfree/payment URLs (**FIXED**).<br>3. Module-level `let memory*` caches across dashboard files registered with `clientCache.ts` and cleared on sign-out or user/workspace switch (**FIXED**). | **FIXED & VERIFIED** |
| **5. Visitor on Public Profile (`/u/[subdomain]`)** | Social link preview -> Public Folio (`/u/[subdomain]`) -> Brand Materials Gate (`/u/[subdomain]/[slug]`) | 1. Added server-side `generateMetadata()` in `app/u/[subdomain]/layout.tsx` for social OpenGraph/Twitter previews (**FIXED**).<br>2. `TiltCard.tsx` initialized `scale` to `1` (**FIXED**). | **FIXED & VERIFIED** |
| **6. Mobile & Small-Screen User** | 320px–375px viewport across Dashboard & Templates | Responsive overflow containers and layout bounds verified across dashboard views. | **VERIFIED** |
| **7. Keyboard & Screen-Reader User** | Tab navigation, modal dialogs, form controls | 1. Custom modals (`ScheduledPostModal.tsx`, `ScheduleNewPostModal.tsx`, `StudioOnboardingModal.tsx`, `UnoolCheckoutModal.tsx`) include `role="dialog"` and `aria-modal="true"` (**FIXED**).<br>2. Persona cards (`app/onboarding/start/page.tsx`) include `role="radio"`, `aria-checked`, `tabIndex={0}`, and keyboard `Enter`/`Space` support (**FIXED**). | **FIXED & VERIFIED** |

---

## 2. Disconnected, Stubbed, or Misleading UI Controls

| Component & Line | UI Control | Observed Behavior | Classification |
|---|---|---|---|
| `app/contact/page.tsx:12-15` | Public Contact & Grievance Form `"Send Message"` | Wired to `mailto:support@unool.co` (`FIX-10`) | **P0 (FIXED)** |
| `components/dashboard/settings/tabs/TemplatesTab.tsx:69-96` | Settings -> Templates `"Save Changes"` | Initialized `savedTemplate` so button renders reliably (`FIX-10`) | **P1 (FIXED)** |
| `app/analytics/linkedin/LinkedInAnalyticsClient.tsx:220-224` | LinkedIn Analytics `"Copy reply"` button | Copies suggested reply to clipboard and displays real `Reactions / Comments / Reposts` breakdown (`FIX-18`) | **P1 (FIXED)** |
| `components/dashboard/settings/tabs/DangerZoneTab.tsx:52-68` | Settings -> Danger Zone `"Delete Account"` | Requires explicit `"DELETE"` text confirmation, calls `DELETE /api/user/delete`, clears caches, and redirects to `/signin` (`FIX-24`) | **P1 (FIXED)** |
| `components/dashboard/settings/tabs/SecurityTab.tsx:18-41` | Settings -> Security `"Multi-Factor Authentication"` toggle | Persists email-OTP MFA requirement (`mfa_enabled`) in Supabase user metadata | **P2 (VERIFIED)** |
| `components/dashboard/settings/tabs/WorkspaceTab.tsx:130-137` | Settings -> Workspace `"Upgrade"` button | Wired `onClick` to navigate to `/dashboard/billing` (`FIX-24`) | **P2 (FIXED)** |
| `components/dashboard/settings/tabs/NotificationsTab.tsx:27-57` | Settings -> Notifications toggles | Persists notification preferences to `localStorage` (`unool_notification_prefs`) with switch controls (`FIX-24`) | **P2 (FIXED)** |
| `components/dashboard/settings/tabs/IntegrationsTab.tsx:435-441` | Settings -> Integrations `"Add Endpoint"` (Webhooks) | Interactive HTTPS webhook URL configuration with validation and persistence (`FIX-24`) | **P2 (FIXED)** |
| `app/onboarding/connect/page.tsx:258-266` | Onboarding -> Connect `"Remove account"` menu item | Calls `DELETE /api/platform/connections/[platform]` and updates state (`FIX-24`) | **P2 (FIXED)** |
| `components/dashboard/settings/tabs/TemplateAnalyticsTab.tsx:180-183` | Settings -> Analytics trend badges | Computes period-over-period trend from `viewsByDay` / `clicksByDay` series instead of fabricated multipliers (`FIX-24`) | **P2 (FIXED)** |

