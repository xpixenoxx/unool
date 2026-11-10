# FEATURE INVENTORY — UNOOL (`unool.co`)

Complete end-to-end mapping of every module in the repository (`Frontend → Backend API → Service/Library → Database Tables → External Dependencies`) and its verified implementation status.

---

## 1. Authentication, Onboarding & Workspace Management

| Feature | Frontend Route / Component | Backend API Route(s) | Service / Library | Database Tables | External Dependencies | Status |
|---|---|---|---|---|---|---|
| **Email + OTP Signup** | `app/signup/page.tsx` | `POST /api/auth/signup`, `POST /api/auth/signup/verify-otp`, `POST /api/auth/resend-otp` | `lib/auth/otp.ts`, `lib/auth/password.ts`, `lib/auth/email.ts`, `lib/referrals/service.ts` | `auth.users`, `users`, `workspaces`, `workspace_members`, `auth_otp_challenges`, `referrals` | Supabase Auth Admin, Resend API, Upstash Redis | **FIXED & VERIFIED** (`findUserByEmail()` removes 50-user cap; persists `?plan=`, `?template=`, `who` state) |
| **Email + Password / OTP Signin** | `app/signin/page.tsx` | `POST /api/auth/signin`, `POST /api/auth/signin/verify-otp` | `lib/auth/otp.ts`, `lib/auth/password.ts` | `auth.users`, `users`, `auth_otp_challenges` | Supabase Auth, Resend API, Upstash Redis | **FIXED & VERIFIED** (`findUserByEmail()` removes 50-user cap) |
| **Google OAuth Signin** | `app/signin/page.tsx`, `app/signup/page.tsx` | `GET /api/auth/callback` | `@supabase/ssr` | `auth.users`, `users`, `workspaces`, `workspace_members` | Google OAuth via Supabase Auth | **WIRED & VERIFIED** |
| **Password Reset** | `app/forgot-password/page.tsx` | `POST /api/auth/reset-password/request`, `POST /api/auth/reset-password/verify-and-update` | `lib/auth/otp.ts`, `lib/auth/password.ts`, `lib/auth/email.ts` | `auth.users`, `users`, `auth_otp_challenges` | Supabase Auth Admin, Resend API | **FIXED & VERIFIED** (`findUserByEmail()` removes 50-user cap) |
| **Edge Auth & Subdomain Routing** | All routes | `middleware.ts` | `lib/auth/server.ts`, `lib/auth/context.ts`, `lib/auth/admin-jwt.ts` | `workspace_members`, `workspaces` | Supabase SSR | **FIXED & VERIFIED** (Fixed P0 `x-user-id` header spoofing & unverified cookie JWT decode) |
| **Onboarding Wizard** | `app/onboarding/start/page.tsx`, `app/onboarding/connect/page.tsx`, `app/onboarding/connect/add/page.tsx` | `GET/POST/DELETE /api/onboarding`, `GET /api/auth/platform/connect`, `DELETE /api/platform/connections/[platform]` | `lib/platforms/index.ts` | `onboarding_checklists`, `platform_connections` | Social OAuth Providers | **FIXED & VERIFIED** (`start/page.tsx` saves persona/template to `/api/profile` with ARIA keyboard support; `connect/page.tsx` "Remove account" wired to `DELETE /api/platform/connections/[platform]`; `connect/add/page.tsx` copy fixed) |
| **Team & Workspace Settings** | `components/dashboard/settings/tabs/WorkspaceTab.tsx` | `GET/PUT/POST/DELETE /api/workspace` | `lib/auth/workspaceAccess.ts` | `workspaces`, `workspace_members` | Supabase | **FIXED & VERIFIED** (Added `workspace_members` invitation columns in migration `20261110000002`; wired Upgrade button to `/dashboard/billing`) |

---

## 2. Multi-Platform Publishing, AI Composer & FlightPlan Scheduling

| Feature | Frontend Route / Component | Backend API Route(s) | Service / Library | Database Tables | External Dependencies | Status |
|---|---|---|---|---|---|---|
| **AI Multi-Platform Adaptation** | `app/dashboard/composer/ComposerClient.tsx` | `POST /api/composer/adapt` | `lib/ai/PostAdapter.ts`, `ContentGuard.ts`, `studioContext.ts`, `ImageOptimizer.ts` | `posts`, `post_variants`, `profiles`, `ai_usage` | Groq / Anthropic / OpenAI / Gemini APIs | **FIXED** (Fixed cross-tenant `existingPostId` IDOR & `ai_usage` schema columns) |
| **Hook Scorer, Fold Linter, Beat Sheet, Humanizer** | `app/dashboard/composer/ComposerClient.tsx` | `POST /api/composer/hook-score`, `/fold-lint`, `/beat-sheet`, `/humanize` | `HookScorer.ts`, `FoldLinter.ts`, `BeatSheetGenerator.ts`, `ContentHumanizer.ts` | `ai_usage` | AI Provider (`lib/ai/provider.ts`) | **WIRED** |
| **Media Upload & Proxy** | `ComposerClient.tsx`, `hooks/flightplan/useImageUpload.ts` | `POST /api/composer/upload`, `GET /api/media/[...path]` | `lib/storage/r2.ts` | `media_uploads` | Cloudflare R2 (S3 SDK) | **FIXED** (Restricted upload MIME types & added CSP sandbox on media proxy to block Stored XSS) |
| **Immediate Broadcast Publishing** | `ComposerClient.tsx`, `app/dashboard/publish/PublishClient.tsx` | `POST /api/publish`, `POST /api/publish/[postId]`, `PATCH/DELETE /api/publish/variants/[variantId]` | `lib/services/PublishService.ts`, `QueueService.ts`, 26 Platform Adapters (`lib/platforms/*.ts`) | `posts`, `post_variants`, `platform_posts`, `platform_connections` | Upstash QStash, 26 Social APIs | **FIXED** (Added auth & workspace ownership check to `/api/publish`; flushed unsaved draft edits in `PublishClient.tsx`) |
| **FlightPlan 7-Day AI Arc & Calendar** | `app/dashboard/flightplan/page.tsx`, `components/flightplan/FlightPlanClient.tsx`, `WeekCanvas.tsx` | `POST /api/composer/arc/generate`, `POST /api/composer/schedule`, `/schedule/week`, `PATCH/DELETE /api/composer/schedule/[postId]`, `POST /api/composer/schedule/hold` | `WeekArcGenerator.ts`, `ScheduleService.ts`, `QueueService.ts` | `content_arcs`, `posts`, `post_variants`, `workspaces` | Upstash QStash, AI Provider | **FIXED** (Fixed `localToUtc` timezone conversion & `useTimeSelector` hour 24 overflow) |
| **Scheduled Post Cron & QStash Worker** | Background / Self-healing | `GET/POST /api/cron/publish-scheduled`, `POST /api/webhooks/qstash/publish` | `ScheduleService.ts`, `PublishService.ts`, `firstComment.ts` | `posts`, `post_variants`, `platform_posts` | Vercel Cron, Supabase `pg_cron`, Upstash QStash | **WIRED** (Note: `pg_cron` SQL migration lacks `CRON_SECRET` header) |

---

## 3. SignalDM — Instagram & LinkedIn Comment-to-DM Automation

| Feature | Frontend Route / Component | Backend API Route(s) | Service / Library | Database Tables | External Dependencies | Status |
|---|---|---|---|---|---|---|
| **Instagram Webhook Ingestion (Comments & DMs)** | `app/dashboard/automation/AutomationClient.tsx` | `GET/POST /api/webhooks/instagram` | `InstagramCommentAutomation.ts`, `lib/webhooks/verify.ts`, `QueueService.ts`, `velocityThrottle`, `lexicalEntropyGuard` | `instagram_automation_config`, `instagram_comment_logs`, `instagram_dm_logs`, `instagram_flagged_comments`, `instagram_flagged_dms`, `instagram_outbound_jobs` | Meta Graph API (`v22.0`), Groq LLM, Upstash QStash | **WIRED & TESTED** |
| **QStash Outbound Worker & Follow-Gate Verification** | Background Worker | `POST /api/webhooks/qstash/instagram-outbound` | `InstagramCommentAutomation.ts` (`processDmFollowGate`), `linkResolver.ts` | `instagram_outbound_jobs`, `instagram_comment_logs`, `instagram_dm_logs`, `brand_materials_pages`, `profiles` | Meta Graph API (`is_user_follow_business`), Upstash QStash, Groq | **WIRED & TESTED** |
| **Active Comment Polling / Fallback Sync** | `AutomationClient.tsx`, Vercel Cron | `GET /api/cron/instagram-sync`, `POST /api/instagram/sync` | `InstagramCommentAutomation.ts`, `velocityThrottle`, `lexicalEntropyGuard` | `instagram_automation_config`, `instagram_comment_logs`, `instagram_flagged_comments`, `platform_connections` | Meta Graph API, Groq | **FIXED** (Enforced auth on `/api/instagram/sync` & `/api/cron/instagram-sync`; fixed `workspace_memberships` table typo) |
| **Brand Materials & Follow-Gate Hub** | `app/dashboard/automation/BrandMaterialsSection.tsx`, `app/dashboard/follow-gates/FollowGateManager.tsx`, `app/u/[subdomain]/[slug]/BrandMaterialsPageView.tsx`, `app/gate/[gateId]/page.tsx` | `GET/POST/DELETE /api/brand-materials`, `GET/POST/PUT/DELETE /api/follow-gate/**` | `lib/follow-gate/service.ts`, `linkResolver.ts` | `brand_materials_pages`, `follow_gates`, `follow_gate_sessions` | Supabase, Resend API | **FIXED** (Fixed P0 `brand_materials_pages` PUBLIC RLS vulnerability via migration `20261110000002`) |
| **LinkedIn Automation & Analytics** | `app/dashboard/automation/LinkedInAutomationClient.tsx`, `app/analytics/linkedin/LinkedInAnalyticsClient.tsx` | `GET/POST /api/linkedin/**` | `LinkedInAdapter.ts` | `platform_connections`, `posts` | LinkedIn API | **FIXED & VERIFIED** (`LinkedInAnalyticsClient` "Copy reply" copies to clipboard and displays real `Reactions / Comments / Reposts` breakdown; removed hardcoded fallback strings) |

---

## 4. Public Identity, Folio Templates & Analytics

| Feature | Frontend Route / Component | Backend API Route(s) | Service / Library | Database Tables | External Dependencies | Status |
|---|---|---|---|---|---|---|
| **Presence Builder & Avatar Upload** | `app/dashboard/presence/PresenceClient.tsx` | `GET/PUT/POST /api/profile`, `POST /api/profile/avatar`, `GET/POST /api/subdomains/check` | `SupabaseProfileRepository.ts`, `lib/storage/r2.ts` | `profiles`, `analytics_events` | Cloudflare R2 | **FIXED** (Fixed theme merge in `/api/profile`, `version` increment in `SupabaseProfileRepository`, and SVG XSS in `/api/profile/avatar`) |
| **Public Profile (`/u/[subdomain]`) & 23 Persona Templates** | `app/u/[subdomain]/page.tsx`, `components/profile/ProfilePreview.tsx`, `components/profile/templates/persona/**` | `GET /api/profile/[subdomain]` | `SupabaseProfileRepository.ts`, `SupabasePostRepository.ts`, `lib/analytics/track.ts` | `profiles`, `posts`, `post_variants`, `platform_posts`, `analytics_events` | Upstash Redis, Three.js / Framer Motion | **FIXED** (Fixed Upstash rate limiter parsing & blocked unpublished draft post leakage in `/api/profile/[subdomain]`; fixed `TiltCard` `scale: 0` bug) |
| **Signal Analytics & Resonance** | `app/dashboard/signal/SignalClient.tsx` | `GET /api/analytics/**`, `POST /api/analytics/time-spent` | `lib/analytics/events.ts`, `lib/services/analytics/normalize.ts` | `analytics_events`, `posts`, `post_variants`, `platform_posts` | Social Platform Insights APIs | **WIRED** |

---

## 5. Billing, Referrals, Settings & Superadmin Console

| Feature | Frontend Route / Component | Backend API Route(s) | Service / Library | Database Tables | External Dependencies | Status |
|---|---|---|---|---|---|---|
| **Cashfree Billing & Subscriptions** | `app/dashboard/billing/BillingClient.tsx`, `components/billing/UnoolCheckoutModal.tsx` | `POST /api/billing/create-order`, `GET /api/billing/verify`, `POST /api/webhooks/cashfree`, `POST /api/billing/cancel`, `GET /api/billing/current`, `GET /api/billing/plans` | `lib/billing/cashfree.ts`, `lib/billing/subscription.ts`, `lib/billing/plans.ts`, `lib/plan-enforcement.ts` | `payment_orders`, `subscriptions`, `plans`, `webhook_events`, `workspaces`, `referrals` | Cashfree PG API (`2023-08-01`), Upstash Redis | **FIXED** (Fixed Redis `plan:${planId}` cache collision, `markOrderPaid` race condition, webhook double-upsert/referral reward, and `BillingClient` `window.open` hijacking) |
| **Referral Program** | `app/dashboard/referrals/ReferralsPage.tsx`, `components/referrals/ReferralDashboard.tsx` | `GET/POST /api/referrals` | `lib/referrals/service.ts` | `referral_codes`, `referrals`, `workspaces` | Supabase Realtime | **FIXED & VERIFIED** (Scoped Realtime channel filter by `workspace_id` and relaxed fallback poll interval to 30s) |
| **Settings Tabs** | `app/dashboard/settings/SettingsClient.tsx`, `components/dashboard/settings/tabs/**` | `GET/POST/DELETE /api/keys`, `DELETE /api/user/delete` | `SupabaseApiKeyRepository.ts` | `api_keys`, `workspaces`, `profiles` | Supabase | **FIXED & VERIFIED** (`TemplatesTab` save button fixed; `DangerZoneTab` wired to `DELETE /api/user/delete` with `DELETE` confirmation; `NotificationsTab` & `IntegrationsTab` webhooks persisted; `TemplateAnalyticsTab` period-split trend computed from real series) |
| **Superadmin Console** | `app/admin/**` | `POST /admin/api/login`, `GET/POST /api/admin/**` | `lib/auth/admin.ts`, `lib/auth/admin-jwt.ts`, `SupabaseAdminRepository.ts` | `admin_users`, `admin_audit_log`, `admin_feature_flags`, `user_plan_overrides` | Supabase | **FIXED** (Removed hardcoded `PIXER#USHA` password backdoor in `/admin/api/login`) |
| **Public Contact Page** | `app/contact/page.tsx` | Client `mailto:` dispatch | — | — | Email client | **FIXED** (Wired form submit to `mailto:support@unool.co` instead of silently discarding message) |

