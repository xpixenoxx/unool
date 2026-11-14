# Studio Audit Progress

Started: 2026-11-14T10:58+05:30  
Completed: 2026-11-14T14:00+05:30  
Current section: Section 14 (Completion Gate Passed) & Section 13 (`STUDIO_AUDIT_REPORT.md` finalized)

---

## Section 4: Complete Studio Ecosystem Checklist & Files Read (`path | one-line summary | date/time`)

### 4.1 Entry points and UI
- [x] `app/dashboard/studio/page.tsx` | Server page entry for `/dashboard/studio`; authenticates user/workspace and renders `<ComposerClient />` (contains UTF-8 mojibake in `metadata.title: 'Studio â€” Unool'`, line 6) | 2026-11-14T11:05+05:30
- [x] `app/dashboard/composer/page.tsx` | Legacy `/dashboard/composer` route that preserves query params and redirects to `/dashboard/studio` | 2026-11-14T11:05+05:30
- [x] `app/dashboard/composer/ComposerClient.tsx` | Main 2,780-line Studio client UI handling AI Composer mode, Quick Broadcast mode, account-level platform selection, media upload, HookScorer/FoldLinter/BeatSheet/Humanizer panels, scheduling, and publishing | 2026-11-14T11:30+05:30
- [x] `app/dashboard/composer/IPhonePreview.tsx` | 620-line interactive mobile device preview component rendering platform-specific cards for connected platforms | 2026-11-14T11:32+05:30
- [x] `app/dashboard/composer/types.ts` | TypeScript interfaces for `PlatformType`, `DraftVariant`, `ComposerMediaItem`, `ComposerProfile`, and `ConnectedAccountItem` | 2026-11-14T11:06+05:30
- [x] `app/dashboard/composer/BrandIcons.tsx` | Re-exports `PlatformSVGs` as `BrandIcons` for platform badges | 2026-11-14T11:06+05:30
- [x] `components/dashboard/StudioIdeaGenerator.tsx` | 500-line AI Idea Generator drawer/panel calling `POST /api/studio/ideas`, managing `alreadyShown` in `localStorage`, and populating the composer | 2026-11-14T11:10+05:30
- [x] `components/dashboard/StudioOnboardingModal.tsx` | 1,121-line 7-question persona calibration modal saving to `PUT /api/studio/profile` (never mounted in `/dashboard/studio`, only in `StudioTab.tsx`) | 2026-11-14T12:15+05:30
- [x] `components/dashboard/StudioToast.tsx` | 354-line custom toast notification system (`studioToast`) for publish/schedule/safety alerts (hardcodes broken `/terms` link at lines 300, 315) | 2026-11-14T11:12+05:30
- [x] `components/dashboard/settings/tabs/StudioTab.tsx` | 569-line Settings tab for viewing/editing `studioProfile` and launching `StudioOnboardingModal` | 2026-11-14T11:15+05:30
- [x] `components/profile/templates/persona/StudioTemplate.tsx` | 2,074-line public bio-link persona template ("The Studio") with GSAP/Three.js editorial layout | 2026-11-14T12:20+05:30
- [x] `components/profile/templates/persona/the-studio/index.tsx` | 4-line barrel file re-exporting `StudioTemplate` | 2026-11-14T12:20+05:30
- [x] `app/dashboard/layout.tsx` (plus grep of all `/dashboard/studio` & `/dashboard/composer` links) | Dashboard sidebar navigation linking to `/dashboard/studio` (`lines 206-212`, where descriptions of `Studio` and `Signal` are swapped) | 2026-11-14T13:27+05:30

### 4.2 API routes
- [x] `app/api/studio/ideas/route.ts` | `POST` route generating 3 AI post ideas via `GroqProvider` (`qwen/qwen3.8-27b`) with 2 attempts and silent fallback to `synthesizeFallbackIdeas` | 2026-11-14T11:20+05:30
- [x] `app/api/studio/profile/route.ts` | `GET`/`PUT` route reading and updating `profiles.studio_profile` and syncing `onboarding_answers` | 2026-11-14T11:20+05:30
- [x] `app/api/profile/studio/route.ts` | 1-line unreferenced duplicate route re-exporting `{ GET, PUT, POST } from '@/app/api/studio/profile/route'` (`POST` does not exist on target) | 2026-11-14T11:20+05:30
- [x] `app/api/composer/adapt/route.ts` | `POST` route adapting an idea into platform- or account-targeted drafts via `PostAdapter` + `ContentGuard` + `planEnforcement.useAI` | 2026-11-14T11:22+05:30
- [x] `app/api/composer/arc/generate/route.ts` | `POST` route generating a 7-day Flight Plan narrative arc via `WeekArcGenerator` with idempotency key and fallback synthesizer | 2026-11-14T11:25+05:30
- [x] `app/api/composer/beat-sheet/route.ts` | Unauthenticated `POST` route running deterministic `BeatSheetGenerator.generate(idea, platform)` | 2026-11-14T11:25+05:30
- [x] `app/api/composer/broadcast/route.ts` | `POST` route creating a post + account-targeted variants and publishing immediately (or enqueueing QStash background publish) | 2026-11-14T11:28+05:30
- [x] `app/api/composer/fold-lint/route.ts` | Unauthenticated `POST` route running deterministic `FoldLinter.lint(content, platform)` | 2026-11-14T11:28+05:30
- [x] `app/api/composer/hook-score/route.ts` | Unauthenticated `POST` route running deterministic `HookScorer.score(hook, platform)` | 2026-11-14T11:28+05:30
- [x] `app/api/composer/humanize/route.ts` | `POST` route running deterministic `ContentHumanizer.humanize` + optional LLM rewrite `ContentHumanizer.humanizeWithAI` | 2026-11-14T11:30+05:30
- [x] `app/api/composer/save-draft/route.ts` | `POST` route saving or updating a draft post and syncing `post_variants` without triggering plan post limits | 2026-11-14T11:32+05:30
- [x] `app/api/composer/schedule/route.ts`, `schedule/hold/route.ts`, `schedule/week/route.ts`, `schedule/[postId]/route.ts` | Scheduling routes for single/cascading/batch scheduling, holding workspace queue, fetching 7-day calendar with self-healing due-post trigger, and rescheduling/cancelling a scheduled post | 2026-11-14T11:38+05:30
- [x] `app/api/composer/upload/route.ts` | `POST` route generating R2 presigned upload URLs (or server-side R2/Supabase fallback upload) | 2026-11-14T11:40+05:30
- [x] `app/api/publish/route.ts`, `app/api/publish/[postId]/route.ts`, `app/api/publish/variants/[variantId]/route.ts` | Routes for creating/listing posts, publishing/fetching/deleting a post by ID, and editing/publishing a single variant | 2026-11-14T12:25+05:30
- [x] `app/api/posts/pending-count/route.ts` | `GET` route returning draft and scheduled post counts for the dashboard sidebar badge | 2026-11-14T11:42+05:30
- [x] `app/api/media/[...path]/route.ts` | Unauthenticated `GET` media proxy streaming R2/Supabase objects for `/api/media/<bucket>/<key>` | 2026-11-14T11:42+05:30

### 4.3 AI and personalisation layer
- [x] `lib/ai/studioContext.ts` | Sanitizes `StudioProfileData` fields (`sanitizeProfileValue`, `sanitizeInterests`) and builds the role-aware `CREATOR PROFILE` prompt context block | 2026-11-14T11:45+05:30
- [x] `lib/ai/studioIdeas.ts` | Builds the idea prompt with seasonal hooks (`UPCOMING_HOOKS`), parses/validates 3 ideas, deduplicates against `alreadyShown`, enforces in-memory rate limit, and synthesizes static fallback ideas | 2026-11-14T11:46+05:30
- [x] `lib/ai/PostAdapter.ts` | Core adaptation engine (`adaptSinglePlatform`, `adaptMultiPlatform`, `adaptAccountTargets`) with per-platform rules, character limits, and deterministic fallback truncation | 2026-11-14T11:50+05:30
- [x] `lib/ai/ContentGuard.ts` | Input/output safety validator (`validateInput`, `validateOutput`, `filterHashtags`, `SAFETY_SYSTEM_PREFIX`) checking regex patterns and Shannon entropy | 2026-11-14T11:52+05:30
- [x] `lib/ai/GapRecommender.ts` | Deterministic helper recommending the next best day/platform slot for the 7-day calendar | 2026-11-14T11:53+05:30
- [x] `lib/ai/WeekArcGenerator.ts` | Generates 7-day multi-platform content arcs from a single update, with fact-grounded fallback synthesizer | 2026-11-14T11:55+05:30
- [x] `lib/ai/ProfileExtractor.ts` | Extracts profile fields from bio text using `AIProvider.generateObject` | 2026-11-14T12:30+05:30
- [x] `lib/ai/provider.ts`, `lib/ai/types.ts`, `lib/ai/providers/GroqProvider.ts`, `AnthropicProvider.ts`, `OpenAIProvider.ts` | Provider factory (`FallbackAIProvider`: Groq -> Anthropic -> OpenAI) and concrete LLM client implementations | 2026-11-14T11:58+05:30
- [x] `lib/ai/engines/ContentHumanizer.ts`, `FoldLinter.ts`, `HookScorer.ts`, `BeatSheetGenerator.ts` | Deterministic (and hybrid AI for `ContentHumanizer`) scoring/linting/rewriting engines | 2026-11-14T12:00+05:30
- [x] `lib/config/studioOnboarding.ts` | Defines the 7-question Studio onboarding schema, role-based question branching (`ROLE_CONFIGS`), and `validateStudioProfile` | 2026-11-14T12:02+05:30
- [x] `lib/onboarding/types.ts` | Legacy onboarding checklist and step types | 2026-11-14T12:30+05:30

### 4.4 Publishing, scheduling, media, platforms
- [x] `lib/services/PublishService.ts` | Decrypts tokens, refreshes expiring tokens, runs `ImageOptimizer`, invokes platform adapters, and records `platform_posts` | 2026-11-14T12:05+05:30
- [x] `lib/services/ScheduleService.ts` | Schedules single, cascading, and 7-day Flight Plan posts, dispatches QStash delayed jobs, and runs `processDueScheduledPosts` | 2026-11-14T12:08+05:30
- [x] `lib/services/QueueService.ts` | Upstash QStash wrapper for immediate publish tasks, delayed scheduled tasks, and cancellation | 2026-11-14T12:10+05:30
- [x] `lib/platforms/adapter.ts`, `index.ts`, `connectionStatus.ts`, `firstComment.ts`, `apiVersions.ts` | Platform adapter interface, registry of 27 platforms, connection status resolver, delayed first-comment helper, and API version constants | 2026-11-14T12:12+05:30
- [x] All 27 platform adapters in `lib/platforms/*`: `InstagramAdapter.ts`, `LinkedInAdapter.ts`, `FacebookAdapter.ts`, `ThreadsAdapter.ts`, `XAdapter.ts`, `ManualAdapter.ts`, `YoutubeAdapter.ts`, `PinterestAdapter.ts`, `BlueskyAdapter.ts`, `RedditAdapter.ts`, `MastodonAdapter.ts`, `TelegramAdapter.ts`, `DiscordAdapter.ts`, `SlackAdapter.ts`, `TwitchAdapter.ts`, `DribbbleAdapter.ts`, `SkoolAdapter.ts`, `WhopAdapter.ts`, `KickAdapter.ts`, `WarpcastAdapter.ts`, `MeweAdapter.ts`, `NostrAdapter.ts`, `MediumAdapter.ts`, `LemmyAdapter.ts`, `ListmonkAdapter.ts`, `HashnodeAdapter.ts`, `DevtoAdapter.ts` | All 27 adapter files read in full and classified (21 real native APIs, 4 webhook relays, 1 RTMP ffmpeg streamer, 1 manual stub) | 2026-11-14T12:50+05:30
- [x] `lib/media/ImageOptimizer.ts`, `lib/storage/r2.ts` | Server-side image resizer/converter and Cloudflare R2 S3 client + presigned URL generator | 2026-11-14T12:35+05:30
- [x] `app/api/webhooks/qstash/publish/route.ts`, `app/api/cron/publish-scheduled/route.ts`, `app/api/platform/connections/route.ts` | QStash webhook consumer, cron scheduled-post publisher, and platform connections manager | 2026-11-14T13:16+05:30

### 4.5 Data layer
- [x] `lib/repositories/supabase/SupabaseProfileRepository.ts`, `SupabasePostRepository.ts` | Repositories for `profiles`, `posts`, and `post_variants` including optimistic locking (`version`) and atomic status claims (`claimForPublishing`) | 2026-11-14T12:40+05:30
- [x] Migrations: `20261012000001_scheduling_engine.sql`, `20261014140000_add_studio_onboarding_to_profiles.sql`, `20261015110000_add_studio_profile_to_profiles.sql`, `20261021000001_enable_profiles_rls_public.sql`, `20261023000001_add_publishing_post_status.sql`, `20261023_billing_tables.sql`, `20261027_pg_cron_publish_scheduled.sql`, `20261110000002_security_rls_and_schema_fixes.sql`, `20261111000001_complete_account_deletion_and_audit_fixes.sql`, `20261112000001_flightplan_reliability.sql`, `20261114000001_multi_account_platform_connections.sql` | Schema definitions, indexes, constraints, `pg_cron` jobs, and RLS policies for Studio tables | 2026-11-14T13:18+05:30
- [x] `app/api/profile/route.ts`, `app/api/profile/[subdomain]/route.ts`, `app/u/[subdomain]/page.tsx` | Profile CRUD route and public profile endpoints | 2026-11-14T13:21+05:30

### 4.6 Cross-cutting
- [x] `middleware.ts`, `lib/auth/server.ts`, `lib/auth/context.ts` | Edge middleware stripping/injecting `x-user-id`/`x-workspace-id` headers and server auth resolvers | 2026-11-14T13:12+05:30
- [x] `lib/billing/plans.ts`, `lib/limits/enforcer.ts`, `lib/limits/freeTier.ts`, `lib/middleware/plan-enforcement-middleware.ts` | Billing plan definitions, feature flags, and usage limit middlewares | 2026-11-14T12:55+05:30
- [x] `lib/config/schema.ts`, `lib/config/platformLimits.ts`, `lib/config/platformConfig.ts`, `.env.example` | Environment schema, platform character limits, UI platform config, and documented env vars | 2026-11-14T13:25+05:30
- [x] All Studio tests: `app/api/studio/ideas/__tests__/route.test.ts`, `app/api/studio/profile/__tests__/route.test.ts`, `lib/ai/__tests__/studioContext.test.ts`, `lib/ai/__tests__/studioIdeas.test.ts`, `lib/config/__tests__/studioOnboarding.test.ts`, `app/dashboard/composer/__tests__/ComposerClient.test.tsx`, `app/dashboard/composer/__tests__/IPhonePreview.test.tsx` | 7 test suites (55 tests total; 54 passing, 1 failing in `ComposerClient.test.tsx`) | 2026-11-14T13:13+05:30

## Files still to read
None — 100% of Section 4 files have been read in full.

---

## Studio Architecture Summary (Section 4 — Max 40 Lines)

### Data Flow Diagram (Text)
```text
[Browser: /dashboard/studio (ComposerClient.tsx)]
  ├─► Profile & Voice Calibration: GET/PUT /api/studio/profile ──► Supabase `profiles.studio_profile` (+ `onboarding_answers`)
  ├─► Idea Generation: POST /api/studio/ideas ──► buildStudioContext() + buildIdeasPrompt() ──► GroqProvider ('qwen/qwen3.8-27b')
  │     └─► (On AI error / invalid model) ──► synthesizeFallbackIdeas() ──► Returns 3 static templates (HTTP 200)
  ├─► Draft Adaptation: POST /api/composer/adapt ──► ContentGuard.validateInput() ──► buildStudioContext() ──► PostAdapter
  │     └─► FallbackAIProvider (Groq -> Anthropic -> OpenAI) ──► ContentGuard.validateOutput() ──► Returns `variants` & `targetVariants`
  ├─► Deterministic Linting/Scoring: POST /api/composer/{hook-score,fold-lint,beat-sheet,humanize} ──► Synchronous regex/heuristic engines
  ├─► Media Upload: POST /api/composer/upload ──► Presigned R2 PUT URL (or server fallback) ──► Cloudflare R2 (`post-media`) ──► /api/media/[...path]
  ├─► Immediate Publish: POST /api/composer/broadcast ──► Creates `posts` + `post_variants` ──► PublishService (<=3 variants inline) OR QStash
  └─► Schedule / 7-Day Flight Plan: POST /api/composer/schedule (& /arc/generate) ──► ScheduleService ──► Upstash QStash (`/api/webhooks/qstash/publish`)
        └─► PublishService.publishPost() ──► decryptToken() ──► ImageOptimizer ──► PlatformAdapter (27 adapters) ──► `platform_posts`
```
### External Services
- **Supabase (PostgreSQL + Auth + Storage fallback + `pg_cron`/`pg_net`)**: Primary relational store, RLS, and session cookies.
- **LLM Providers**: Groq (`api.groq.com/openai/v1/chat/completions`), Anthropic (`@ai-sdk/anthropic`), OpenAI (`@ai-sdk/openai`).
- **Cloudflare R2**: S3-compatible object storage (`post-media`, `avatars` buckets) for uploaded and `ImageOptimizer`-resized media.
- **Upstash QStash & Upstash Redis**: Asynchronous webhook dispatch/scheduling (`/api/webhooks/qstash/publish`) and rate limiting.
- **26 External Social Platform APIs**: LinkedIn, X, Instagram, Facebook, Threads, YouTube, Pinterest, Bluesky, Reddit, Mastodon, Telegram, Discord, Slack, Twitch, Dribbble, Skool, Whop, Kick, Warpcast, MeWe, Nostr, Medium, Lemmy, Listmonk, Hashnode, DEV.to.

### Database Tables
- `profiles` (`studio_profile`, `onboarding_completed`, `onboarding_answers`), `workspaces`, `workspace_members`, `subscriptions`.
- `posts` (`status`, `scheduled_at`, `qstash_message_id`, `schedule_strategy`, `arc_id`, `arc_beat`, `media_urls`).
- `post_variants` (`platform`, `platform_connection_id`, `adapted_content`, `character_count`, `status`, `scheduled_at`, `qstash_message_id`, `auto_first_comment`, `media_urls`).
- `platform_connections` (`access_token_encrypted`, `refresh_token_encrypted`, `platform_user_id`, `status`), `platform_posts`, `content_arcs`, `ai_usage`, `media_uploads`.

### Key Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`.
- `GROQ_API_KEY`, `AI_GROQ_MODEL` (undocumented in `.env.example`, defaults to invalid `'qwen/qwen3.8-27b'`), `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `OPENAI_API_KEY`, `AI_OPENAI_MODEL`.
- `CF_R2_ACCOUNT_ID`, `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`, `CF_R2_MEDIA_BUCKET_NAME`, `CF_R2_MEDIA_PUBLIC_URL`.
- `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `CRON_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

### Background Jobs
1. **Upstash QStash Webhook (`POST /api/webhooks/qstash/publish`)**: Executes background broadcasts, scheduled posts, cascading variants, and T+90s `first-comment:` dispatches.
2. **Scheduled Cron (`GET/POST /api/cron/publish-scheduled`)**: Sweeps due `scheduled` posts via `ScheduleService.processDueScheduledPosts` (broken from `pg_cron` due to missing `Authorization` header, `STU-010`; also triggered on-demand from `GET /api/composer/schedule/week`).

---

## Section 5: Feature-by-Feature Investigation (`Feature | Q1..Q6 | Verdict`)

### 5.1 Studio Onboarding and Profile
- **Verdict:** **PARTIAL** (`STU-002`, `STU-007`, `STU-018`, `STU-020`)
- **Q1 (Intended behavior):** Present a 7-step role-branched wizard (`role`, `businessStage`, `businessDomain`, `audience`, `tone`, `style`, `interests`) to new users on Studio, validate and save `studio_profile` (and legacy `onboarding_answers`) per workspace, and allow editing in Settings.
- **Q2 (Actual code behavior):** `StudioOnboardingModal.tsx` implements the 7-step wizard and calls `PUT /api/studio/profile` (`app/api/studio/profile/route.ts:53-144`), which validates via `validateStudioProfile` (`lib/config/studioOnboarding.ts:435-518`) and updates `profiles.studio_profile` with optimistic locking (`existingProfile.version`). However:
  1. `StudioOnboardingModal` is **never mounted** in `app/dashboard/studio/page.tsx` or `ComposerClient.tsx` (`STU-020`); it only exists in `components/dashboard/settings/tabs/StudioTab.tsx:558`.
  2. When `PUT /api/studio/profile` syncs `onboardingAnswers` (`lines 116-125`), it omits `businessStage` and `workInterests` (`STU-018`).
- **Q3 (Bad/huge/hostile input):** `validateStudioProfile` rejects strings `> 80` chars (`workInterests > 120` chars), but does **not** cap the array length of `interests` (`validateStudioProfile` returned `valid: true` for 13+ interests in `eval_studio.test.ts`; only `buildStudioContext` slices to 12 at read time). `sanitizeProfileValue` strips `ignore previous instructions` and replaces `\n` with spaces, but leaves inline backticks ```` ```json ```` and closing tags `</script>` intact.
- **Q4 (Provider/DB failure):** If `PUT /api/studio/profile` hits a DB error or `VERSION_CONFLICT`, the route catches it at `line 138` and returns HTTP 500 `{ error: 'Failed to save studio profile' }` (unlike `PUT /api/profile` which returns 409 on `VERSION_CONFLICT`).
- **Q5 (Concurrency / multi-tab / workspace switch):** `SupabaseProfileRepository.update` increments `version` and throws `VERSION_CONFLICT` on concurrent edits. However, `ComposerClient.tsx:137-144` caches `memoryStudioProfile` in a module-level variable not keyed by `userId`/`workspaceId` (`STU-021`). Also, public RLS on `profiles` (`20261021000001_enable_profiles_rls_public.sql:10-13`) exposes `studio_profile` to `anon` PostgREST queries (`STU-002`).
- **Q6 (Tests):** `lib/config/__tests__/studioOnboarding.test.ts` (10 tests) and `app/api/studio/profile/__tests__/route.test.ts` (8 tests) pass and test validation rules and mocked repository calls, but do not test `VERSION_CONFLICT`, `interests.length > 12`, or whether `StudioOnboardingModal` is mounted on `/dashboard/studio`.

### 5.2 AI Idea Generator (`POST /api/studio/ideas`)
- **Verdict:** **BROKEN** (falls back to static templates by default; `STU-005`, `STU-006`, `STU-007`, `STU-024`)
- **Q1 (Intended behavior):** Generate 3 timely, deeply personalized post ideas (`title`, `hook`, `format`, `why_it_works`) tailored to the user's `studioProfile` and current date, avoiding repeats.
- **Q2 (Actual code behavior):** `StudioIdeaGenerator.tsx` calls `POST /api/studio/ideas`. The route (`app/api/studio/ideas/route.ts:104-174`) instantiates `GroqProvider` with `config.AI_GROQ_MODEL || 'qwen/qwen3.8-27b'` (a non-existent Groq model, `STU-005`) and `responseFormatJson: true` (`response_format: { type: 'json_object' }`) while prompting `Return ONLY a JSON array` (`STU-006`). Both AI attempts fail, and lines `176-184` return `synthesizeFallbackIdeas` with HTTP `200 OK` and no fallback indicator.
- **Q3 (Bad/huge/hostile input):** `sanitizeAlreadyShown` trims and caps `alreadyShown` to 15 items × 120 chars. However, `body.studioProfile` from the client is trusted over the DB without running `validateStudioProfile` (`STU-007`), and `filterDuplicates` (`studioIdeas.ts:249-273`) ignores all words `<= 3` chars (`STU-024`).
- **Q4 (Provider failure):** Returns HTTP 200 with 3 static template ideas from `synthesizeFallbackIdeas` (`STU-005`). Even for a `Student` or `Fitness & nutrition` `Creator`, `synthesizeFallbackIdeas` outputs B2B SaaS copy (`"pushing a feature nobody asked for"`, `"something breaks in production"`).
- **Q5 (Concurrency / rate limit / quota):** Rate limiting (`checkIdeasRateLimit`) uses a per-instance in-memory `Map` (`STU-007`), and `planEnforcement.useAI` / `ai_usage` tracking is completely missing (`STU-007`). Timeout is 25s × 2 = 50s against `maxDuration = 60`.
- **Q6 (Tests):** `lib/ai/__tests__/studioIdeas.test.ts` (13 tests) and `app/api/studio/ideas/__tests__/route.test.ts` (4 tests) pass, but `route.test.ts` mocks `GroqProvider.generateText` to return a JSON array string, hiding both the invalid model name (`'qwen/qwen3.8-27b'`) and the `json_object` vs JSON array conflict.

### 5.3 Composer: Write, Adapt, Preview (`POST /api/composer/adapt`, `IPhonePreview`, Engines)
- **Verdict:** **PARTIAL** (`STU-012`, `STU-014`, `STU-016`, `STU-017`, `STU-018`, `STU-021`)
- **Q1 (Intended behavior):** Let the user write one source idea, adapt it via AI into platform-native drafts for each selected account, score/lint/humanize drafts, and preview them live in an iPhone frame.
- **Q2 (Actual code behavior):** `POST /api/composer/adapt` (`app/api/composer/adapt/route.ts`) enforces `planEnforcement.useAI`, runs `ContentGuard.validateInput`, builds `studioContext`, and calls `PostAdapter.adaptAccountTargets` (or `adaptMultiPlatform`), clamping output to `PLATFORM_LIMITS[platform].maxChars`. However, `PostAdapter` duplicates the entire `systemPrompt` inside both `prompt` and `options.systemPrompt` (`STU-016`), `retrySingleDraft` in `ComposerClient.tsx:1013-1068` drops `studioProfile` and breaks multi-account retry (`STU-021`), and `ContentHumanizer` ignores `studioProfile` and produces ungrammatical regex replacements (`"explore into"`, `"approach shift"`, `STU-018`).
- **Q3 (Bad/huge/hostile input):** `adapt/route.ts` validates `idea` (1–10,000 chars) and runs `ContentGuard`. However, `/api/composer/fold-lint` and `/api/composer/beat-sheet` have no auth and no `.max()` on input strings (`STU-012`). Emoji length is counted via JS `.length` (UTF-16 code units) rather than Twitter weighted length or grapheme clusters.
- **Q4 (Provider failure):** `PostAdapter` falls back across `Groq -> Anthropic -> OpenAI`, and if all 3 fail, uses deterministic `createFallbackAdaptation` (`PostAdapter.ts:744-779`) and sets `degraded: true`. However, an intentional LLM safety refusal (`{"refused": true, "content": ""}`) fails `AdaptedPostSchema` (`content.min(1)`) and triggers retries across all providers (`STU-017`).
- **Q5 (Concurrency / multi-tab):** No `localStorage` draft auto-save or `beforeunload` warning exists (`STU-021`); refreshing the page loses all unsaved work.
- **Q6 (Tests):** `IPhonePreview.test.tsx` (2 tests) passes; `ComposerClient.test.tsx` fails 1 of 2 tests (`STU-023`); `/api/composer/adapt`, `PostAdapter`, `ContentHumanizer`, `FoldLinter`, `HookScorer`, and `BeatSheetGenerator` have no unit test files in the repo.

### 5.4 Drafts, Scheduling, and Publishing (`save-draft`, `broadcast`, `schedule/*`, `publish/*`)
- **Verdict:** **PARTIAL** (`STU-001`, `STU-003`, `STU-009`, `STU-010`, `STU-011`, `STU-013`, `STU-022`)
- **Q1 (Intended behavior):** Save drafts, publish immediately across all selected accounts (with partial-failure retry), or schedule simultaneous/cascading/7-day Flight Plan posts that publish reliably in the background.
- **Q2 (Actual code behavior):**
  - `POST /api/composer/save-draft` creates/updates draft posts and variants cleanly.
  - `POST /api/composer/broadcast` publishes inline when `<= 3` variants (and no video) or enqueues QStash `/api/webhooks/qstash/publish`.
  - `ScheduleService` schedules simultaneous or cascading variants via QStash and provides `processDueScheduledPosts` for cron/self-healing.
  - Critical/High flaws: `DELETE /api/publish/[postId]` resets monthly post quota and orphans QStash tasks (`STU-001`); `webhooks/qstash/publish` fails open if signing keys are unset (`STU-003`); `pg_cron` fails with 401 every 2 minutes (`STU-010`); delayed `first-comment:` truncates LinkedIn URNs and double-posts on Instagram (`STU-011`).
- **Q3 (Bad input / past time / timezones):** `ScheduleService` validates future timestamps (with a 2-minute grace window on single schedule) and stores UTC ISO timestamps.
- **Q4 (Platform API failure):** `PublishService` records per-variant `status: 'failed'` and `error_message` without blocking sibling platforms, and `ComposerClient.tsx` allows retrying failed platforms. However, `XAdapter` silently drops media while returning `success: true` (`STU-009`).
- **Q5 (Concurrency / double-run):** `SupabasePostRepository.claimForPublishing` and `claimVariantForPublishing` (`SupabasePostRepository.ts:392-488`) perform atomic status transitions (`scheduled -> publishing`) to prevent double-publishing on concurrent cron/QStash runs.
- **Q6 (Tests):** Zero unit/integration tests exist for `save-draft`, `broadcast`, `schedule/*`, `publish/*`, `PublishService`, or `ScheduleService` (`STU-023`).

### 5.5 Media Upload (`/api/composer/upload`, `/api/media/[...path]`, `ImageOptimizer`, `r2.ts`)
- **Verdict:** **PARTIAL** (`STU-004`, `STU-008`, `STU-012`, `STU-015`)
- **Q1 (Intended behavior):** Validate and upload images/videos to Cloudflare R2 within plan limits, optimize images per platform before publishing, and serve media securely.
- **Q2 (Actual code behavior):** `POST /api/composer/upload` checks `planEnforcement.createPost` instead of `uploadMedia`, never inserts into `media_uploads`, runs two failing `PutBucketCorsCommand` calls on every request, and signs R2 presigned URLs without `ContentLength` enforcement (`STU-008`). `ImageOptimizer` is vulnerable to SSRF (`STU-004`) and has a `ReferenceError: supabaseAdmin is not defined` in its Supabase fallback (`STU-015`). `/api/media/[...path]` is unauthenticated and hardcodes a production `.r2.dev` URL (`STU-012`).
- **Q3 (Bad/huge/hostile input):** In presigned mode (`mode: 'presigned'`), only the client-declared `type` and `size` JSON fields are checked; the actual bytes uploaded directly to R2 are not checked for magic bytes or `ContentLength` (`STU-008`).
- **Q4 (Storage failure):** If R2 fails during `ImageOptimizer.uploadBuffer`, the fallback throws `ReferenceError: supabaseAdmin is not defined` and returns the unoptimized original URL (`STU-015`).
- **Q5 (Abandoned uploads / quota):** Abandoned uploads in R2 are never garbage-collected, and `media_uploads` is never populated (`STU-008`).
- **Q6 (Tests):** Zero tests exist for `/api/composer/upload`, `/api/media/[...path]`, `ImageOptimizer`, or `r2.ts`.

### 5.6 Personal Context and Persona Consistency (`lib/ai/studioContext.ts`)
- **Verdict:** **PARTIAL** (`STU-018`, `STU-020`)
- **Q1 (Intended behavior):** Inject sanitized, role-specific creator context into every AI generation route so all Studio outputs sound like the user.
- **Q2 (Actual code behavior):** `buildStudioContext` (`lib/ai/studioContext.ts:171-229`) is well-structured and role-aware (`Student`, `Founder`, `Software engineer`, `Creator`), and is used in `/api/studio/ideas` and `/api/composer/adapt`. However, it is **not used** in `/api/composer/humanize` or `/api/composer/arc/generate` (`STU-018`), and when a user has not completed onboarding, `ComposerClient.tsx:420-436` injects a fabricated `'Founder & Creator'` profile (`STU-020`).

| AI Route | Uses `buildStudioContext`? | Evidence |
|---|---|---|
| `POST /api/studio/ideas` | **YES** | `lib/ai/studioIdeas.ts:73` calls `buildStudioContext(profile)` |
| `POST /api/composer/adapt` | **YES** | `app/api/composer/adapt/route.ts:144` calls `buildStudioContext(effectiveStudioProfile)` |
| `POST /api/composer/humanize` | **NO** | `app/api/composer/humanize/route.ts:85` calls `ContentHumanizer.humanizeWithAI` with hardcoded founder prompt (`STU-018`) |
| `POST /api/composer/arc/generate` | **NO** | `app/api/composer/arc/generate/route.ts:231` passes legacy `onboardingAnswers` (`STU-018`) |
| `POST /api/composer/beat-sheet` | **N/A (Deterministic)** | `lib/ai/engines/BeatSheetGenerator.ts` is heuristic-only (no LLM call) |

### 5.7 Platform Coverage Inside Studio (All 27 Adapters Audited)
- **Verdict:** **PARTIAL** (`STU-009`, `STU-011`, `STU-013`)
- All 27 platform adapters in `lib/platforms/` were read in full. Summary of real vs webhook/manual status:
  - **21 Native API Adapters:** `linkedin` (works; delayed first-comment broken by URN colon split, `STU-011`), `x` (text works; silently drops all media & overflows 280 chars on firstComment, `STU-009`), `instagram` (works; double-posts firstComment, `STU-011`), `facebook` (works for 1st page; ignores `platformUserId` for multi-page users, `STU-013`), `threads` (publish works; omits `refreshToken` on auth, `STU-013`), `youtube` (native video upload; rejects text-only), `pinterest` (image works; hardcodes `image_url` on video, `STU-013`), `bluesky` (AT Protocol works), `reddit` (text-only to `u_<username>`, drops media & subreddits, `STU-013`), `mastodon` (works; unvalidated `instanceUrl` SSRF, `STU-004`), `telegram` (Bot API works), `discord` (webhook publish works until OAuth token refresh wipes `webhookUrl: ''`, `STU-013`), `slack` (works), `twitch` (posts to chat/announcement; returns error if channel offline), `dribbble` (image shot upload works), `whop` (forum post works), `medium` (works), `lemmy` (works; unvalidated `instanceUrl` SSRF, `STU-004`), `listmonk` (creates + starts email campaign; SSRF on `instanceUrl`, `STU-004`), `hashnode` (GraphQL `publishPost` works), `devto` (Forem API works).
  - **4 Webhook Relays (`SkoolAdapter`, `WarpcastAdapter`, `NostrAdapter`, `MeweAdapter` fallback):** Generic HTTP `POST` to user-supplied webhook URL (vulnerable to SSRF, `STU-004`; `warpcast` and `nostr` misleadingly labeled `publishMode: 'native'` in `lib/platforms/index.ts:128-129`, `STU-013`).
  - **1 Serverless RTMP Streamer (`KickAdapter`):** Spawns `ffmpeg -re` inside serverless handler (`STU-013`).
  - **1 Manual Stub (`ManualAdapter`):** Used only as fallback when platform is unknown.

---

## Findings So Far
`STU-001`, `STU-002`, `STU-003`, `STU-004`, `STU-005`, `STU-006`, `STU-007`, `STU-008`, `STU-009`, `STU-010`, `STU-011`, `STU-012`, `STU-013`, `STU-014`, `STU-015`, `STU-016`, `STU-017`, `STU-018`, `STU-019`, `STU-020`, `STU-021`, `STU-022`, `STU-023`, `STU-024`, `STU-025`, `STU-026` (all documented in `d:\UNOOLNEW\studio_audit_findings.md`).

## Open Questions
None — all architectural, security, AI-quality, billing, and platform questions have been resolved with code and test evidence.

## Commands Run (`command | result summary`)
1. `Set-Location "d:\UNOOLNEW"; npx vitest run app/api/studio/ideas/__tests__/route.test.ts app/api/studio/profile/__tests__/route.test.ts lib/ai/__tests__/studioContext.test.ts lib/ai/__tests__/studioIdeas.test.ts lib/config/__tests__/studioOnboarding.test.ts app/dashboard/composer/__tests__/ComposerClient.test.tsx app/dashboard/composer/__tests__/IPhonePreview.test.tsx` | **6 test files passed, 1 failed (`ComposerClient.test.tsx`), 54 tests passed, 1 failed (55 total)** (`STU-023`).
2. `Set-Location "d:\UNOOLNEW"; npx tsc --noEmit --incremental false` | **Exit code 0 (0 TypeScript errors)**.
3. `Set-Location "d:\UNOOLNEW"; npx next lint --no-cache --file app/dashboard/studio/page.tsx --file app/dashboard/composer/page.tsx --file app/dashboard/composer/ComposerClient.tsx --file app/api/studio/ideas/route.ts --file app/api/studio/profile/route.ts --file lib/ai/studioContext.ts --file lib/ai/studioIdeas.ts --file lib/config/studioOnboarding.ts` | **Exit code 0 (0 errors, 94 warnings in `ComposerClient.tsx` including missing `workspaceId` dependency in `useEffect` at line 823, 2 unused-var warnings in `lib/ai/studioIdeas.ts`)**.
4. `Set-Location "d:\UNOOLNEW"; npx vitest run --config "C:\Users\HP\.gemini\antigravity\brain\aafb8144-d0a8-43a5-b125-9d0f93fdfd40\scratch\vitest.eval.config.ts"` | **Exit code 0 (1 passed)**: Executed pure-function edge-case/hostile-input tests (`sanitizeProfileValue`, `validateStudioProfile`, `parseRawIdeasResponse`, `validateSingleIdea`, `filterDuplicates`, `ContentGuard.validateInput`, `ContentHumanizer.humanize`, `FoldLinter.lint`, `HookScorer.score`, `BeatSheetGenerator.generate`) and generated Section 8.3 outputs across all 4 persona profiles (`PersonaA_Founder`, `PersonaB_Student`, `PersonaC_Creator`, `PersonaD_Empty`).

## Limitations Hit
1. **No Live LLM API Calls (Rule 6):** Per Rule 6 (never touch production / no external side effects) and `STU-005` (`AI_GROQ_MODEL` defaults to non-existent `'qwen/qwen3.8-27b'`), live LLM completions against Groq/Anthropic/OpenAI were not executed; all prompt builders, fallback synthesizers, and deterministic engines were executed and verified locally via Vitest.
2. **No Live Social Platform Publishing (Rule 6):** Per Rule 6 ("No live posts to real social accounts"), all 27 platform adapters were audited via full line-by-line static analysis of their HTTP requests, headers, payloads, and response parsers.
3. **No Live Production Database / Cloudflare R2 Inspection (Rule 6):** Database schema, indexes, `pg_cron` jobs, and RLS policies were audited from the 60 SQL migrations in `supabase/migrations/`.

## Next Exact Step
All sections complete. `STUDIO_AUDIT_REPORT.md` written and verified against Section 14 completion gate.
