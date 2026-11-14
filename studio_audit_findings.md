# Studio Audit Findings Log (`studio_audit_findings.md`)

**Audit Target:** Unool Studio (`d:\UNOOLNEW`)  
**Prompt Specification:** `d:\UNOOLNEW\supabase\migrations\studiopromptaudit`  
**Audit Date:** 2026-11-14  
**Mode:** Strictly Read-Only (Rule 5 & Rule 6 enforced)

---

## Summary of Findings by Severity

| Severity | Count | IDs |
|---|---|---|
| **CRITICAL** | 3 | `STU-001`, `STU-002`, `STU-003` |
| **HIGH** | 10 | `STU-004`, `STU-005`, `STU-006`, `STU-007`, `STU-008`, `STU-009`, `STU-010`, `STU-011`, `STU-012`, `STU-013` |
| **MEDIUM** | 10 | `STU-014`, `STU-015`, `STU-016`, `STU-017`, `STU-018`, `STU-019`, `STU-020`, `STU-021`, `STU-022`, `STU-023` |
| **LOW** | 2 | `STU-024`, `STU-025` |
| **INFO** | 1 | `STU-026` |
| **Total** | **26** | `STU-001` .. `STU-026` |

---

## Detailed Findings (Section 7 Template)

### STU-001 — Deleting a published or scheduled post resets monthly post quota (`posts_per_month`) and orphans active QStash jobs
- Severity: CRITICAL
- Category: Billing
- Status: FACT
- Where:
  - `app/api/publish/[postId]/route.ts:126-175`
  - `lib/middleware/plan-enforcement-middleware.ts:260-266`
  - `lib/limits/freeTier.ts:148-159`
- Evidence:
  - `app/api/publish/[postId]/route.ts:152-167`:
    ```ts
    const variants = await postRepository.findVariantsByPostId(postId);
    const variantIds = variants.map(v => v.id);

    if (variantIds.length > 0) {
      await supabaseAdmin.from('platform_posts').delete().in('post_variant_id', variantIds);
    }

    // Delete post_variants then post
    await supabaseAdmin.from('post_variants').delete().eq('post_id', postId);
    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('workspace_id', auth.workspaceId);
    ```
  - `lib/middleware/plan-enforcement-middleware.ts:260-266`:
    ```ts
    case 'posts_per_month': {
      const { count } = await supabaseAdmin
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .in('status', ['published', 'scheduled'])
        .gte('created_at', monthStartStr);
      return count || 0;
    }
    ```
- What happens:
  1. A user on the Spark (Free) plan (`posts_per_month: 15`) or Creator plan (`posts_per_month: 60`) can publish a post to all social networks and then immediately call `DELETE /api/publish/<postId>`. Because `posts_per_month` is calculated by counting existing rows in `posts` where `status IN ('published', 'scheduled')` rather than reading an append-only usage ledger, deleting the row decrements the user's monthly post count back to zero, granting unlimited free publishing.
  2. If the deleted post has `status === 'scheduled'`, `DELETE /api/publish/[postId]` does not call `queueService.cancelScheduledTask(post.qstashMessageId)` or cancel per-variant `qstashMessageId`s (unlike `DELETE /api/composer/schedule/[postId]`), leaving orphaned QStash timers running.
- How to reproduce:
  1. Authenticate as a Spark plan user and publish a post via `POST /api/composer/broadcast` (`post.status` becomes `'published'`, monthly post count increments by 1).
  2. Call `DELETE /api/publish/<postId>`.
  3. Observe HTTP 200 `{ "success": true }` and verify that `posts` row count for the month drops by 1, allowing infinite publishes.
- Root cause:
  `DELETE /api/publish/[postId]` performs a hard `DELETE` on `posts`, `post_variants`, and `platform_posts` without restricting deletion to `draft` status, without cancelling QStash jobs, and while billing enforcement relies on live row counts in `posts` instead of an immutable monthly counter or soft-delete (`deleted_at`).
- Recommended fix:
  1. If `post.status === 'scheduled'`, cancel all QStash messages (`post.qstashMessageId` and `variant.qstashMessageId`) before deletion.
  2. For `post.status === 'published'`, either disallow hard deletion or soft-delete (`deleted_at`) while counting soft-deleted published posts toward `posts_per_month` (or record publish consumption in an append-only ledger table).
- Effort: S
- Confidence: High (verified directly in route handler and both quota counters).

---

### STU-002 — `middleware.ts` bypasses header stripping on `/api/*` paths containing `.` while `getCurrentAuth` trusts unverified `x-user-id` and `x-workspace-id` headers
- Severity: CRITICAL
- Category: Security
- Status: FACT
- Where:
  - `middleware.ts:78-85, 185-189`
  - `lib/auth/server.ts:19-34`
  - `lib/auth/context.ts:90-95`
  - `app/api/profile/[subdomain]/route.ts:204-210`
  - `supabase/migrations/20261021000001_enable_profiles_rls_public.sql:10-13`
- Evidence:
  - `middleware.ts:78-85`:
    ```ts
    // Skip middleware for static assets
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }
    ```
  - `middleware.ts:185-189`:
    ```ts
    if (pathname.startsWith('/api/')) {
      const sanitizedHeaders = new Headers(request.headers);
      sanitizedHeaders.delete('x-user-id');
      sanitizedHeaders.delete('x-workspace-id');
    ```
  - `lib/auth/server.ts:19-24`:
    ```ts
    // ── Priority 1: Middleware-injected identity headers (fastest, zero network calls) ──
    if (request) {
      const headerUserId = request.headers.get('x-user-id');
      const headerWorkspaceId = request.headers.get('x-workspace-id');
      if (headerUserId && headerWorkspaceId) {
        return { userId: headerUserId, workspaceId: headerWorkspaceId, session: { user: { id: headerUserId } } };
      }
    ```
  - `app/api/profile/[subdomain]/route.ts:204-210`:
    ```ts
    const response = {
      id: profile.id,
      workspaceId: profile.workspaceId,
      workspace_id: profile.workspaceId,
      userId: profile.userId,
      user_id: profile.userId,
    ```
  - `supabase/migrations/20261021000001_enable_profiles_rls_public.sql:10-13`:
    ```sql
    CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles
    FOR SELECT
    USING (visibility = 'public');
    ```
- What happens:
  1. `middleware.ts:82` returns `NextResponse.next()` for any URL whose `pathname.includes('.')` *before* reaching the `/api/` header-sanitization block at line 185. Any `/api/*` route with a dynamic segment that accepts a period (`.`)—or any request where Next.js routes to an API handler despite a `.` in the path—retains client-supplied `x-user-id` and `x-workspace-id` headers.
  2. `getCurrentAuth` (`lib/auth/server.ts:19-24`) and `getAuthContext` (`lib/auth/context.ts:90-95`) trust `x-user-id` and `x-workspace-id` without any HMAC signature or internal secret, and without even checking that `headerUserId` belongs to `headerWorkspaceId` when both headers are present.
  3. Compounding this, `GET /api/profile/[subdomain]` (`app/api/profile/[subdomain]/route.ts:206-209`) publicly discloses every user's `userId` and `workspaceId` in its JSON response, and the `profiles` RLS policy (`20261021000001_enable_profiles_rls_public.sql:10-13`) allows `anon` callers using `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `SELECT studio_profile, onboarding_answers, user_id, workspace_id FROM profiles WHERE visibility = 'public'`.
- How to reproduce:
  1. Fetch `GET /api/profile/<any-public-subdomain>` without authentication and read `userId` and `workspaceId` from the JSON response.
  2. Send a request to any dynamic `/api/*` route with a `.` in its path segment (e.g., `/api/publish/variants/test.1` or `/api/composer/schedule/test.1`) with headers `x-user-id: <userId>` and `x-workspace-id: <workspaceId>`.
  3. `middleware.ts:82` skips header stripping because `pathname.includes('.')` is `true`, and `getCurrentAuth` authenticates the request as the victim user/workspace.
- Root cause:
  1. Overly broad static-asset check `pathname.includes('.')` placed before `/api/` security sanitization in `middleware.ts`.
  2. Unsigned trust of `x-user-id` / `x-workspace-id` headers in `lib/auth/server.ts` and `lib/auth/context.ts`.
  3. Public profile API and row-level RLS policy exposing internal `userId`, `workspaceId`, and `studio_profile` columns.
- Recommended fix:
  1. Move the `if (pathname.startsWith('/api/'))` header-stripping block above `if (pathname.includes('.'))` in `middleware.ts` (never skip `/api/` in middleware).
  2. Sign middleware-injected headers with an HMAC using a server-only secret (or remove header-based auth fallback in `getCurrentAuth`).
  3. Remove `userId`, `workspaceId`, `user_id`, and `workspace_id` from the public `GET /api/profile/[subdomain]` response, and move private profile columns (`studio_profile`, `onboarding_answers`) to a private table or view not exposed to `anon` via PostgREST.
- Effort: M
- Confidence: High (exact control flow verified across `middleware.ts`, `lib/auth/server.ts`, `app/api/profile/[subdomain]/route.ts`, and RLS SQL).

---

### STU-003 — QStash publish webhook (`POST /api/webhooks/qstash/publish`) fails open without signature verification when signing keys are unset
- Severity: CRITICAL
- Category: Security
- Status: FACT
- Where:
  - `app/api/webhooks/qstash/publish/route.ts:24-33, 38-84`
  - `lib/config/schema.ts:144-145`
- Evidence:
  - `lib/config/schema.ts:144-145`:
    ```ts
    QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
    ```
  - `app/api/webhooks/qstash/publish/route.ts:25-33, 38-84`:
    ```ts
    function getReceiver(): Receiver | null {
      if (!config.QSTASH_CURRENT_SIGNING_KEY || !config.QSTASH_NEXT_SIGNING_KEY) {
        return null;
      }
      return new Receiver({
        currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
      });
    }

    async function handler(request: NextRequest) {
      try {
        // ── Signature verification (skip in dev if keys not configured) ────────
        const receiver = getReceiver();
        if (receiver) {
          ...
        }

        // Dev mode: no signature keys configured — parse body directly
        const body = await request.json();
        return handlePublish(body, request);
    ```
- What happens:
  Unlike `app/api/cron/publish-scheduled/route.ts:63-65` (which fails closed with HTTP 500 if signing secrets are missing), `POST /api/webhooks/qstash/publish` fails **open** whenever `QSTASH_CURRENT_SIGNING_KEY` or `QSTASH_NEXT_SIGNING_KEY` is omitted from environment variables, even when `NODE_ENV === 'production'`. Because `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` are `.optional()` in `lib/config/schema.ts`, a deployment missing either key allows any unauthenticated internet caller to POST `{ "postId": "...", "workspaceId": "..." }` and force immediate publication or first-comment dispatch on any post.
- How to reproduce:
  Static analysis of `app/api/webhooks/qstash/publish/route.ts:25-84`: when either `QSTASH_CURRENT_SIGNING_KEY` or `QSTASH_NEXT_SIGNING_KEY` is empty/unset, `getReceiver()` returns `null` and lines 82–83 execute `handlePublish(body, request)` with no check on `config.NODE_ENV`.
- Root cause:
  Missing `config.NODE_ENV === 'production'` guard on the dev-mode signature bypass in `app/api/webhooks/qstash/publish/route.ts`.
- Recommended fix:
  Fail closed with HTTP 500 in `app/api/webhooks/qstash/publish/route.ts` whenever `!receiver && config.NODE_ENV === 'production'` (matching `app/api/cron/publish-scheduled/route.ts:63-65`).
- Effort: S
- Confidence: High (exact code path verified).

---

### STU-004 — Server-Side Request Forgery (SSRF) in `ImageOptimizer` and 7 platform adapters via unvalidated media, webhook, and instance URLs
- Severity: HIGH
- Category: Security
- Status: FACT
- Where:
  - `lib/media/ImageOptimizer.ts:258-266`
  - `app/api/publish/variants/[variantId]/route.ts:64-66`
  - `lib/platforms/SkoolAdapter.ts:66`
  - `lib/platforms/WarpcastAdapter.ts:68`
  - `lib/platforms/NostrAdapter.ts:74`
  - `lib/platforms/MeweAdapter.ts:462`
  - `lib/platforms/ListmonkAdapter.ts:42-48, 73, 95, 175`
  - `lib/platforms/MastodonAdapter.ts:47, 88, 122`
  - `lib/platforms/LemmyAdapter.ts:55, 81, 123, 205`
- Evidence:
  - `app/api/publish/variants/[variantId]/route.ts:64-66`:
    ```ts
    if (body.mediaUrls !== undefined) {
      updateFields.mediaUrls = Array.isArray(body.mediaUrls) ? body.mediaUrls : [];
    }
    ```
  - `lib/media/ImageOptimizer.ts:258-266`:
    ```ts
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(media.url, { signal: controller.signal });
    clearTimeout(timeout);
    ```
  - `lib/platforms/SkoolAdapter.ts:66` (and identical pattern in `WarpcastAdapter.ts:68`, `NostrAdapter.ts:74`, `MeweAdapter.ts:462`):
    ```ts
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    ```
  - `lib/platforms/ListmonkAdapter.ts:42-48`:
    ```ts
    let instanceUrl = rawInstanceUrl.trim().replace(/\/+$/, '');
    if (!instanceUrl.startsWith('http://') && !instanceUrl.startsWith('https://')) {
      instanceUrl = `https://${instanceUrl}`;
    }
    ```
- What happens:
  1. An authenticated user can call `PATCH /api/publish/variants/<variantId>` with `mediaUrls: ["http://169.254.169.254/latest/meta-data/"]` (or an internal service URL) and then publish. `PublishService.ts:173` calls `ImageOptimizer.optimizeForPlatform`, which fetches `media.url` server-side (`ImageOptimizer.ts:260`) without validating the hostname, scheme, or resolved IP against private/link-local ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
  2. When connecting or publishing to Skool, Warpcast, Nostr, MeWe, Listmonk, Mastodon, or Lemmy, the server performs outbound `GET`/`POST` requests to user-supplied `webhookUrl` or `instanceUrl` values without SSRF filtering.
- How to reproduce:
  Static analysis of `PATCH /api/publish/variants/[variantId]` -> `PublishService.publishPost` -> `ImageOptimizer.optimizeAndUpload` (`lib/media/ImageOptimizer.ts:260`), and `SkoolAdapter.ts:66` / `ListmonkAdapter.ts:73`.
- Root cause:
  No centralized outbound URL validator (`isSafeExternalUrl`) or R2-domain allowlist check before server-side `fetch()` calls.
- Recommended fix:
  1. Restrict `mediaUrls` in `PATCH /api/publish/variants/[variantId]`, `POST /api/composer/save-draft`, `POST /api/composer/broadcast`, and `ImageOptimizer.ts` to the configured Cloudflare R2 public origin (`config.CF_R2_MEDIA_PUBLIC_URL`) or `/api/media/` paths.
  2. Validate all user-supplied webhook and federation instance URLs against a strict SSRF guard (HTTPS-only, DNS resolution check blocking RFC1918, loopback, link-local `169.254.0.0/16`, and IPv6 unique-local addresses).
- Effort: M
- Confidence: High (verified in all cited files).

---

### STU-005 — Default Groq model `'qwen/qwen3.8-27b'` and `.env.example` model `'claude-sonnet-5'` do not exist, causing `/api/studio/ideas` to fail and silently return static fallback templates with HTTP 200
- Severity: HIGH
- Category: AI-Quality
- Status: FACT
- Where:
  - `lib/config/schema.ts:133`
  - `app/api/studio/ideas/route.ts:104, 176-184, 192-199`
  - `lib/ai/provider.ts:20, 23, 31, 77`
  - `lib/ai/providers/GroqProvider.ts:17, 26`
  - `.env.example:24-25, 71-72`
- Evidence:
  - `lib/config/schema.ts:133`:
    ```ts
    AI_GROQ_MODEL: z.string().default('qwen/qwen3.8-27b'),
    ```
  - `app/api/studio/ideas/route.ts:104`:
    ```ts
    const groqModel = config.AI_GROQ_MODEL || 'qwen/qwen3.8-27b';
    ```
  - `app/api/studio/ideas/route.ts:176-184, 192-199`:
    ```ts
    //Synthesize personalized fallback ideas if AI generation failed so the user is never blocked
    const fallbackIdeas = synthesizeFallbackIdeas(studioProfile, sanitizedAlreadyShown);
    logger.warn('Studio ideas returning synthesized fallback ideas after AI failure', {
      traceId,
      workspaceId: auth.workspaceId,
      model: groqModel,
    });

    return NextResponse.json({ ideas: fallbackIdeas });
    ```
  - `.env.example:24-25`:
    ```env
    ANTHROPIC_MODEL=claude-sonnet-5
    AI_DEFAULT_MODEL=claude-sonnet-5
    ```
- What happens:
  1. `AI_GROQ_MODEL` is not documented in `.env.example` (`lines 71-72` only list `GROQ_API_KEY=`), so any deployment following `.env.example` uses the default `'qwen/qwen3.8-27b'` (a non-existent Groq model ID; Groq hosts models such as `llama-3.3-70b-versatile` or `qwen-qwq-32b`). Similarly, `.env.example:24-25` sets `ANTHROPIC_MODEL=claude-sonnet-5`, which is also not a real Anthropic model ID.
  2. When a user clicks `"Inspire me with post ideas"`, `POST /api/studio/ideas` makes **two sequential failing calls** to Groq with `model: 'qwen/qwen3.8-27b'`, then catches the failure and returns `200 OK` with `{ ideas: fallbackIdeas }` (3 static string-interpolated templates from `synthesizeFallbackIdeas`) and **no `fallback: true` flag** in the response JSON.
  3. The user receives canned template ideas believing they are fresh AI ideas, while HTTP status monitoring sees `200 OK`.
  4. Worse yet, `synthesizeFallbackIdeas` (`lib/ai/studioIdeas.ts:321-373`) uses hardcoded B2B software-engineering templates (`"pushing a feature nobody asked for"`, `"retention spiked"`, `"something breaks in production"`) for **every** persona, producing nonsensical grammar for non-SaaS users. Exact output from `eval_studio.test.ts`:
     - **Student (`Computer Science & AI`):** `"The pivot that changed everything for our Computer Science & AI — We spent months pushing a feature nobody asked for. The moment we stripped it down, our retention spiked:"`
     - **Creator (`Fitness & nutrition`):** `"Our 3-step checklist before shipping any update in Fitness & nutrition — Every time we skip step 2 on this list, something breaks in production. Here is our exact pre-launch filter:"`
- How to reproduce:
  1. Leave `AI_GROQ_MODEL` unset (using default `'qwen/qwen3.8-27b'`).
  2. Call `POST /api/studio/ideas`.
  3. Both attempt 1 and attempt 2 fail against Groq's API (`model_not_found`), and the route returns HTTP 200 with the 3 static templates from `synthesizeFallbackIdeas`.
- Root cause:
  Invalid default model identifiers in `lib/config/schema.ts`, `lib/ai/provider.ts`, `lib/ai/providers/GroqProvider.ts`, `app/api/studio/ideas/route.ts`, and `.env.example`, combined with silent fallback masking in `POST /api/studio/ideas`.
- Recommended fix:
  1. Change the default `AI_GROQ_MODEL` to a valid production Groq model (e.g. `'llama-3.3-70b-versatile'`) and document `AI_GROQ_MODEL` in `.env.example`. Fix `ANTHROPIC_MODEL` in `.env.example` to `'claude-sonnet-4-20250514'`.
  2. Include `isFallback: true` in the `POST /api/studio/ideas` response when `synthesizeFallbackIdeas` is used, and surface a subtle notice in `StudioIdeaGenerator.tsx`.
- Effort: S
- Confidence: High (verified in schema, provider, route, and `.env.example`).

---

### STU-006 — `POST /api/studio/ideas` requests Groq `json_object` mode while prompting for a top-level JSON array
- Severity: HIGH
- Category: AI-Quality
- Status: FACT
- Where:
  - `app/api/studio/ideas/route.ts:119-124`
  - `lib/ai/providers/GroqProvider.ts:41-43`
  - `lib/ai/studioIdeas.ts:115-116, 232-242`
- Evidence:
  - `app/api/studio/ideas/route.ts:119-124`:
    ```ts
    const aiResult = await Promise.race([
      provider.generateText(currentPrompt, {
        systemPrompt,
        temperature: 0.95,
        maxTokens: 900,
        responseFormatJson: true,
      }),
    ```
  - `lib/ai/providers/GroqProvider.ts:41-43`:
    ```ts
    if (options?.responseFormatJson) {
      requestBody.response_format = { type: 'json_object' };
    }
    ```
  - `lib/ai/studioIdeas.ts:115-116`:
    ```ts
    Return ONLY a JSON array, no markdown and no extra text:
    [{"title":"","hook":"","format":"","why_it_works":""}]`;
    ```
  - `lib/ai/studioIdeas.ts:236-240`:
    ```ts
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (Array.isArray(parsed.ideas)) return parsed.ideas;
      if (Array.isArray(parsed.posts)) return parsed.ideas || parsed.posts;
      if (Array.isArray(parsed.items)) return parsed.items;
    }
    ```
- What happens:
  Groq's `response_format: { type: 'json_object' }` requires the root JSON value to be a JSON **object** (`{...}`), not a JSON **array** (`[...]`). When the prompt instructs `Return ONLY a JSON array: [...]`, Groq either:
  1. Rejects the completion with HTTP 400 (`json_validate_failed` when the model outputs `[...]`), OR
  2. Wraps the array in an arbitrary root object key (e.g. `{ "suggestions": [...] }`, `{ "result": [...] }`, `{ "data": [...] }`).
  As proven by our pure-function test (`eval_studio.test.ts`), `parseRawIdeasResponse` only checks `parsed.ideas`, `parsed.posts`, and `parsed.items` (`studioIdeas.ts:237-239`); any other object key returns the non-array object, which fails `validateIdeasSchema` (`Expected a JSON array of ideas`) and forces a retry + fallback!
- How to reproduce:
  Run `validateIdeasSchema(parseRawIdeasResponse(JSON.stringify({ suggestions: [idea1, idea2, idea3] })))` — returns `{ valid: false, error: 'Expected a JSON array of ideas' }`.
- Root cause:
  Contradiction between `response_format: { type: 'json_object' }` and the prompt instruction `Return ONLY a JSON array`, coupled with a hardcoded 3-key lookup in `parseRawIdeasResponse`.
- Recommended fix:
  1. Update `buildIdeasPrompt` (`lib/ai/studioIdeas.ts:115-116`) to request `{"ideas": [{"title":"","hook":"","format":"","why_it_works":""}]}` so the prompt matches `json_object` mode.
  2. In `parseRawIdeasResponse` (`lib/ai/studioIdeas.ts:236-240`), if `parsed` is a non-array object, fall back to `Object.values(parsed).find(Array.isArray)`.
- Effort: S
- Confidence: High (verified via code inspection and pure-function execution).

---

### STU-007 — `POST /api/studio/ideas` bypasses plan AI quota enforcement, uses per-instance in-memory rate limiting, and trusts unvalidated client `studioProfile`
- Severity: HIGH
- Category: Billing
- Status: FACT
- Where:
  - `app/api/studio/ideas/route.ts:39-95`
  - `lib/ai/studioIdeas.ts:279-304`
  - `app/dashboard/composer/ComposerClient.tsx:420-436, 1838, 2075`
- Evidence:
  - `app/api/studio/ideas/route.ts:51-89`:
    ```ts
    const rateLimit = checkIdeasRateLimit(auth.userId, 20);
    ...
    const clientStudioProfile =
      body.studioProfile && typeof body.studioProfile === 'object'
        ? (body.studioProfile as StudioProfileData)
        : null;
    ...
    const studioProfile = clientStudioProfile || dbStudioProfile;

    const hasValidClientProfile = Boolean(
      clientStudioProfile && (clientStudioProfile.role || clientStudioProfile.doing)
    );

    if (!studioProfile || (!studioProfile.completedAt && !profile?.onboardingCompleted && !hasValidClientProfile)) {
      return NextResponse.json(
        { error: 'Please complete your Studio profile first', code: 'PROFILE_INCOMPLETE' },
        { status: 400 }
      );
    }
    ```
  - `lib/ai/studioIdeas.ts:282`:
    ```ts
    const rateLimitMap = new Map<string, number[]>();
    ```
  - `app/dashboard/composer/ComposerClient.tsx:420-436, 1838`:
    ```ts
    const effectiveStudioProfile = useMemo(() => {
      if (studioProfile && (studioProfile.role || studioProfile.doing)) {
        return studioProfile;
      }
      ...
      return {
        role: String(fallbackRole),
        doing: String(fallbackDoing),
        audience: String(fallbackAudience),
        tone: String(fallbackTone),
        style: String(fallbackStyle),
        interests: Array.isArray(fallbackInterests) && fallbackInterests.length > 0 ? fallbackInterests : ['Technology', 'Growth'],
        completedAt: new Date().toISOString(),
      };
    }, [studioProfile, profile]);
    ...
    hasCompletedProfile={true}
    ```
- What happens:
  1. **Zero Plan Quota Enforcement:** `POST /api/studio/ideas` never calls `planEnforcement.useAI(userId, workspaceId)` and never records usage in the `ai_usage` table, allowing free-tier users to consume LLM tokens without counting toward their monthly `ai_credits_per_month` limit (25 on Spark).
  2. **In-Memory Rate Limit:** `checkIdeasRateLimit` stores timestamps in a module-scoped `Map` (`rateLimitMap`) that resets on every serverless cold start, does not share state across instances, and never evicts old keys.
  3. **Onboarding Gate & Validation Bypass:** `ComposerClient.tsx:1838, 2075` hardcodes `hasCompletedProfile={true}` and synthesizes `effectiveStudioProfile` with default strings (`role: 'Founder & Creator'`, `doing: 'Growing & Scaling'`, `completedAt: new Date().toISOString()`). `POST /api/studio/ideas` prefers `body.studioProfile` over `dbStudioProfile` and does not call `validateStudioProfile(clientStudioProfile)`.
- How to reproduce:
  1. As a new user with `studio_profile = null` and 0 remaining AI credits, call `POST /api/studio/ideas` with `{ "studioProfile": { "role": "Founder" } }`.
  2. The route bypasses both the `PROFILE_INCOMPLETE` check and `ai_credits_per_month` enforcement and returns 200.
- Root cause:
  `POST /api/studio/ideas` was implemented with a local `Map` rate limiter and a client-side fallback profile override instead of using the platform's Upstash Redis rate limiter, `planEnforcement.useAI`, and DB-stored `studioProfile`.
- Recommended fix:
  1. Enforce `planEnforcement.useAI(auth.userId, auth.workspaceId)` and log usage to `ai_usage` in `POST /api/studio/ideas`.
  2. Replace `rateLimitMap` with Upstash Redis rate limiting (`@upstash/ratelimit`).
  3. Validate any client-supplied `studioProfile` with `validateStudioProfile`, and pass the real `hasCompletedStudioProfile` boolean to `<StudioIdeaGenerator />` instead of hardcoding `true`.
- Effort: S
- Confidence: High (verified in route, helper, and client component).

---

### STU-008 — `POST /api/composer/upload` checks the wrong plan quota (`createPost` instead of `uploadMedia`), never records `media_uploads`, imposes no R2 presigned size limit, and runs two failing `PutBucketCorsCommand` calls on every upload
- Severity: HIGH
- Category: Billing
- Status: FACT
- Where:
  - `app/api/composer/upload/route.ts:10-51, 86-105`
  - `lib/storage/r2.ts:18, 153-182`
  - `lib/middleware/plan-enforcement-middleware.ts:268-274, 521`
- Evidence:
  - `app/api/composer/upload/route.ts:10-51`:
    ```ts
    let corsConfigured = false;
    async function ensureR2Cors() {
      if (corsConfigured) return;
      try {
        const s3 = getR2Client();
        ...
        await Promise.all([
          s3.send(new PutBucketCorsCommand({ Bucket: mediaBucket, CORSConfiguration: corsRules })),
          s3.send(new PutBucketCorsCommand({ Bucket: avatarsBucket, CORSConfiguration: corsRules })),
        ]);
        corsConfigured = true;
      } catch (err) {
        logger.warn('Auto-CORS configuration skipped or failed', { error: err });
      }
    }

    export const POST = withPlanEnforcement(
      planEnforcement.createPost,
      async (request: NextRequest, { userId, workspaceId }) => {
        await ensureR2Cors();
    ```
  - `lib/storage/r2.ts:18`:
    ```ts
    // Note: R2 does NOT support PutBucketCors via S3 API — configure CORS in
    ```
  - `lib/storage/r2.ts:166-175`:
    ```ts
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      ContentType: params.contentType,
    });
    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: params.expiresInSeconds ?? 600,
    });
    ```
- What happens:
  1. **Wrong Quota Check & Unrecorded Usage:** `POST /api/composer/upload` wraps the handler with `planEnforcement.createPost` (`posts_per_month`) instead of `planEnforcement.uploadMedia` (`media_uploads_per_month`), and never inserts a row into the `media_uploads` table (`plan-enforcement-middleware.ts:270`). Consequently, `media_uploads_per_month` (5 on Spark) is never enforced, while a user who has reached their monthly post limit is blocked from uploading media even for drafts.
  2. **Two Failing S3 Calls on Every Request:** `ensureR2Cors()` calls `PutBucketCorsCommand` on both R2 buckets (`post-media` and `avatars`) with `AllowedOrigins: ['*']`. As `lib/storage/r2.ts:18` notes, Cloudflare R2 does not support `PutBucketCors` via S3 API. Because `corsConfigured = true` is inside the `try` block before `catch`, every single upload request suffers two failing network round-trips to Cloudflare R2 before generating the presigned URL.
  3. **Unbounded Direct Upload Size & Unverified MIME:** `POST /api/composer/upload` returns a presigned `PutObjectCommand` URL (`mode: 'presigned'`) with no `ContentLength` condition and no post-upload head/magic-byte check, allowing a client to declare `size: 1000` in the JSON request body and then `PUT` a multi-gigabyte file or HTML/SVG payload with spoofed content to R2.
- How to reproduce:
  Static analysis of `app/api/composer/upload/route.ts:10-105` and `lib/storage/r2.ts:18, 153-182`.
- Root cause:
  Copy-paste of `planEnforcement.createPost`, missing `media_uploads` insert, left-over `ensureR2Cors()` helper that fails on every call, and lack of `ContentLength` signing constraints on R2 presigned URLs.
- Recommended fix:
  1. Remove `ensureR2Cors()` from `app/api/composer/upload/route.ts`.
  2. Replace `planEnforcement.createPost` with `planEnforcement.uploadMedia` and insert a row into `media_uploads` upon upload initiation/confirmation.
  3. Bind `ContentLength: size` in `PutObjectCommand` when generating the presigned URL so R2 rejects any `PUT` whose body size does not match the validated `size` parameter.
- Effort: S
- Confidence: High (verified directly in `upload/route.ts`, `r2.ts`, and `plan-enforcement-middleware.ts`).

---

### STU-009 — `XAdapter.publish` silently drops all media attachments while reporting success, and appends `firstComment` to the tweet body, overflowing 280 characters
- Severity: HIGH
- Category: Correctness
- Status: FACT
- Where:
  - `lib/platforms/XAdapter.ts:173-205`
  - `lib/services/PublishService.ts:169-185, 234-243`
- Evidence:
  - `lib/platforms/XAdapter.ts:179-196`:
    ```ts
    const body: Record<string, unknown> = {
      text: input.content,
    };

    if (input.mediaUrls && input.mediaUrls.length > 0) {
      logger.warn('Media upload for X not fully implemented');
    }

    if (input.firstComment) {
      body.text = `${input.content}\n\n${input.firstComment}`;
    }

    const response = await fetch(`${X_API_BASE}/tweets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    ```
- What happens:
  1. **Silent Media Loss:** When a user attaches images or video to a post targeting X (Twitter), `PublishService.ts:173` runs `ImageOptimizer.optimizeForPlatform(mediaUrls, 'x')` (downloading, resizing to 1600×900, and re-uploading `optimized/x_*.jpg` to R2), then calls `XAdapter.publish`. `XAdapter.publish` logs `Media upload for X not fully implemented`, drops `input.mediaUrls` completely, publishes a text-only tweet, and returns `success: true`. The user sees `"Published"` in Studio while their media is missing on X.
  2. **280-Character Overflow via `firstComment`:** If `firstComment` (`autoFirstComment`) is present, `XAdapter.ts:187-189` concatenates `\n\n${input.firstComment}` onto `body.text` instead of posting a reply tweet (`reply: { in_reply_to_tweet_id }`). Any adapted X post near 240–280 characters overflows X's 280-character limit and fails with HTTP `400 Bad Request`.
- How to reproduce:
  1. Create a Studio post with an image or with a 250-char X draft + 50-char `autoFirstComment` and publish to X.
  2. With media: tweet posts without the image while Studio reports success. With `firstComment`: `body.text` exceeds 280 chars and X API returns 400.
- Root cause:
  Incomplete X v1.1/v2 media upload implementation in `XAdapter.ts` and improper handling of `input.firstComment` as body concatenation rather than a reply tweet.
- Recommended fix:
  1. Implement X media upload (`https://upload.twitter.com/1.1/media/upload.json` or v2 media upload) and pass `media: { media_ids }` in `POST /2/tweets` (or explicitly block media on X in the UI until implemented instead of silently dropping it).
  2. Remove `body.text = ${input.content}\n\n${input.firstComment}` from `XAdapter.ts:188`; post `firstComment` as a reply tweet (`reply: { in_reply_to_tweet_id: tweetId }`) via `firstComment.ts` or after the main tweet succeeds.
- Effort: M
- Confidence: High (exact lines quoted from `XAdapter.ts:179-196`).

---

### STU-010 — Database `pg_cron` scheduled-publishing job calls `/api/cron/publish-scheduled` without `Authorization` header, failing with `401 Unauthorized` every 2 minutes
- Severity: HIGH
- Category: Reliability
- Status: FACT
- Where:
  - `supabase/migrations/20261027_pg_cron_publish_scheduled.sql:23-32`
  - `app/api/cron/publish-scheduled/route.ts:10-20, 76-88`
- Evidence:
  - `supabase/migrations/20261027_pg_cron_publish_scheduled.sql:23-32`:
    ```sql
    SELECT cron.schedule(
      'publish-scheduled-posts',
      '*/2 * * * *',
      $$
      SELECT net.http_get(
        url := 'https://unool.co/api/cron/publish-scheduled',
        timeout_milliseconds := 30000
      );
      $$
    );
    ```
  - `app/api/cron/publish-scheduled/route.ts:14-20, 85-88`:
    ```ts
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    // 1. Standard Bearer CRON_SECRET verification (Vercel Cron / manual trigger)
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      return { authorized: true };
    }
    ...
    if (!authCheck.authorized) {
      logger.warn('Cron request rejected: invalid or missing authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    ```
- What happens:
  The Supabase `pg_cron` job `publish-scheduled-posts` (created specifically to "Keep Scheduled posts publishing on time without requiring site visits") invokes `net.http_get(url := 'https://unool.co/api/cron/publish-scheduled')` every 2 minutes with **no `headers` argument**. `app/api/cron/publish-scheduled/route.ts` requires either `Authorization: Bearer ${CRON_SECRET}` or a valid `upstash-signature` header. Consequently, every `pg_cron` execution is rejected with `401 Unauthorized`. If QStash dispatch is unavailable or delayed (`ScheduleService.ts` fallback mode), scheduled posts only publish if a user happens to open the dashboard and trigger client-side self-healing (`GET /api/composer/schedule/week`).
- How to reproduce:
  Compare `supabase/migrations/20261027_pg_cron_publish_scheduled.sql:27-30` (no headers passed to `net.http_get`) with `app/api/cron/publish-scheduled/route.ts:10-88`.
- Root cause:
  `20261027_pg_cron_publish_scheduled.sql` omitted `headers := jsonb_build_object('Authorization', 'Bearer ' || ...)` when scheduling `net.http_get`.
- Recommended fix:
  Store `cron_secret` in Supabase Vault (`vault.decrypted_secrets`) and pass `headers := jsonb_build_object('Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret'))` in `net.http_get`, or configure an authenticated Upstash QStash Cron schedule.
- Effort: S
- Confidence: High (exact SQL migration and route handler verified).

---

### STU-011 — Auto first-comment dispatch double-posts on Instagram, fails on Facebook-Login Instagram tokens, and truncates LinkedIn post URNs (`urn:li:share:...` -> `'urn'`)
- Severity: HIGH
- Category: Correctness
- Status: FACT
- Where:
  - `app/api/webhooks/qstash/publish/route.ts:139-143, 247-257, 321-337`
  - `lib/services/ScheduleService.ts:538-555, 650-668`
  - `lib/services/PublishService.ts:238`
  - `lib/platforms/InstagramAdapter.ts:345-368`
  - `lib/platforms/firstComment.ts:19-48`
- Evidence:
  - `app/api/webhooks/qstash/publish/route.ts:139-143`:
    ```ts
    // Format: "first-comment:{originalVariantId}:{platformPostId}"
    if (variantId && variantId.startsWith('first-comment:')) {
      const parts = variantId.split(':');
      const originalVariantId = parts[1];
      const platformPostId = parts[2];
    ```
  - `lib/platforms/firstComment.ts:19-20, 40-41`:
    ```ts
    if (platform === 'linkedin') {
      const encodedUrn = encodeURIComponent(postId);
      const res = await fetch(`https://api.linkedin.com/v2/socialActions/${encodedUrn}/comments`, {
    ...
    if (platform === 'instagram') {
      const res = await fetch(`https://graph.instagram.com/${API_VERSIONS.INSTAGRAM}/${postId}/comments`, {
    ```
  - `lib/platforms/InstagramAdapter.ts:345-351`:
    ```ts
    // Post first comment if provided (best-effort — don't fail the main post)
    if (input.firstComment && publishData.id) {
      try {
        const commentParams = new URLSearchParams({
          message: input.firstComment,
          access_token: input.accessToken,
        });
        await fetch(`${apiHost}/${publishData.id}/comments`, {
    ```
- What happens:
  1. **LinkedIn First-Comment 100% Broken:** LinkedIn `platformPostId` values are URNs containing colons (e.g., `urn:li:share:7123456789` or `urn:li:ugcPost:7123456789`, returned at `LinkedInAdapter.ts:285, 319`). When `first-comment:${variantId}:${platformPostId}` is split via `variantId.split(':')` at `app/api/webhooks/qstash/publish/route.ts:140-142`, `parts[2]` extracts `'urn'` instead of `'urn:li:share:7123456789'`. Calling `https://api.linkedin.com/v2/socialActions/urn/comments` fails every time.
  2. **Instagram Double First-Comment:** During main post publication, `PublishService.ts:238` passes `firstComment: variant.autoFirstComment` to `adapter.publish()`. `InstagramAdapter.ts:345-368` immediately posts the first comment to `${apiHost}/${publishData.id}/comments`. Then `webhooks/qstash/publish/route.ts:248-256, 323-336` (and `ScheduleService.ts:539-555, 650-668`) enqueues a QStash job 90 seconds later that calls `postFirstComment()` (`lib/platforms/firstComment.ts:40`), posting the exact same comment a **second time** on Instagram.
  3. **Wrong Host in `firstComment.ts` for Instagram:** `lib/platforms/firstComment.ts:41` hardcodes `https://graph.instagram.com`, whereas `InstagramAdapter.ts:26-29` uses `resolveInstagramApiHost(accessToken)` (`graph.instagram.com` for `IG*` tokens vs `graph.facebook.com` for `EAA*` Facebook Login tokens).
- How to reproduce:
  1. For LinkedIn: trace `variantId = "first-comment:uuid:urn:li:share:123"`; `variantId.split(':')[2]` evaluates to `"urn"`.
  2. For Instagram: publish a scheduled post with `autoFirstComment` set; `InstagramAdapter.publish` posts the comment at T+0s, and QStash `first-comment:` dispatches `postFirstComment` at T+90s.
- Root cause:
  Naive `variantId.split(':')[2]` parsing on colon-delimited URNs, duplicate responsibility between inline `adapter.publish(firstComment)` and delayed QStash `first-comment:` jobs, and hardcoded `graph.instagram.com` in `firstComment.ts`.
- Recommended fix:
  1. In `app/api/webhooks/qstash/publish/route.ts:140-142`, parse `const platformPostId = parts.slice(2).join(':')`.
  2. Either post `firstComment` exclusively via the delayed QStash job (removing inline comment posting from `InstagramAdapter.publish` and `XAdapter.publish`) or skip enqueueing the QStash `first-comment:` job for platforms that already posted `firstComment` inline during `adapter.publish`.
  3. Use `resolveInstagramApiHost(accessToken)` in `lib/platforms/firstComment.ts:41`.
- Effort: S
- Confidence: High (exact string splitting and API calls verified).

---

### STU-012 — Unauthenticated composer endpoints (`/api/composer/hook-score`, `fold-lint`, `beat-sheet`) with unbounded input sizes, plus unauthenticated media proxy (`/api/media/[...path]`) with hardcoded R2 bucket URL
- Severity: HIGH
- Category: Security
- Status: FACT
- Where:
  - `app/api/composer/hook-score/route.ts:19-56`
  - `app/api/composer/fold-lint/route.ts:20-58`
  - `app/api/composer/beat-sheet/route.ts:26-63`
  - `app/api/media/[...path]/route.ts:6-122`
- Evidence:
  - `app/api/composer/fold-lint/route.ts:20-29`:
    ```ts
    const RequestSchema = z.object({
      content: z.string(),
      platform: z.enum( validPlatforms ),
    });

    export async function POST(request: NextRequest) {
      try {
        const body = await request.json();
    ```
  - `app/api/composer/beat-sheet/route.ts:26-34`:
    ```ts
    const RequestSchema = z.object({
      idea: z.string().min(1),
      platform: z.enum( validPlatforms ),
    });

    export async function POST(request: NextRequest) {
    ```
  - `app/api/media/[...path]/route.ts:86-91`:
    ```ts
    const publicBaseUrl = bucket === 'avatars'
      ? (config.CF_R2_AVATARS_PUBLIC_URL || 'https://pub-57d0363ef140459e84fc586c4719e4a4.r2.dev')
      : (config.CF_R2_MEDIA_PUBLIC_URL || 'https://pub-57d0363ef140459e84fc586c4719e4a4.r2.dev');
    ```
- What happens:
  1. `POST /api/composer/hook-score`, `POST /api/composer/fold-lint`, and `POST /api/composer/beat-sheet` do not call `getCurrentAuth(request)` and have no rate limiting. Furthermore, `fold-lint` (`content: z.string()`) and `beat-sheet` (`idea: z.string().min(1)`) enforce no maximum string length (`.max()`), allowing unauthenticated callers to send multi-megabyte strings into regex-heavy synchronous functions (`FoldLinter.lint`, `BeatSheetGenerator.generate`) and block the Node.js event loop (ReDoS / CPU DoS).
  2. `GET /api/media/[...path]` has no authentication check, streams any object from `post-media` or `avatars` (including unpublished draft media if keys are known/enumerated), and hardcodes a production Cloudflare R2 public URL (`https://pub-57d0363ef140459e84fc586c4719e4a4.r2.dev`) as the fallback for both buckets on lines 87–88.
- How to reproduce:
  Send an unauthenticated `POST` to `/api/composer/fold-lint` or `/api/composer/beat-sheet` with a 5 MB string payload; the route processes it without authentication or length rejection.
- Root cause:
  Missing `getCurrentAuth(request)` and `.max(10000)` schema bounds on the three deterministic composer routes, and hardcoded fallback bucket URL in `app/api/media/[...path]/route.ts`.
- Recommended fix:
  1. Require `getCurrentAuth(request)` on `/api/composer/hook-score`, `/api/composer/fold-lint`, and `/api/composer/beat-sheet`, and add `.max(10000)` to `content` and `idea` in their Zod schemas.
  2. Remove the hardcoded `pub-57d0363ef140459e84fc586c4719e4a4.r2.dev` fallback URL from `app/api/media/[...path]/route.ts`.
- Effort: S
- Confidence: High (exact route code quoted).

---

### STU-013 — Multiple platform adapter defects break publishing and token refresh (Discord wipes webhook, Facebook ignores page selection, Threads drops refresh token, Pinterest breaks video, Kick spawns `ffmpeg -re`, Warpcast/Nostr mislabeled native)
- Severity: HIGH
- Category: Correctness
- Status: FACT
- Where:
  - `lib/platforms/DiscordAdapter.ts:109-120`
  - `lib/platforms/FacebookAdapter.ts:259-261`
  - `lib/platforms/ThreadsAdapter.ts:88-94`
  - `lib/platforms/PinterestAdapter.ts:198-202`
  - `lib/platforms/RedditAdapter.ts:135-141, 163`
  - `lib/platforms/KickAdapter.ts:217, 269`
  - `lib/platforms/index.ts:128-129`
- Evidence:
  - `lib/platforms/DiscordAdapter.ts:113-117`:
    ```ts
    return {
      accessToken: JSON.stringify({
        accessToken: data.access_token,
        webhookUrl: '',
        channelId: '',
      }),
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
    ```
  - `lib/platforms/FacebookAdapter.ts:259-261`:
    ```ts
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;
    ```
  - `lib/platforms/ThreadsAdapter.ts:89-93`:
    ```ts
    return {
      accessToken: longLivedData.access_token,
      expiresIn: longLivedData.expires_in || 5184000, // 60 days
      tokenType: 'bearer',
    };
    ```
  - `lib/platforms/PinterestAdapter.ts:198-201`:
    ```ts
    media_source: {
      source_type: 'image_url',
      url: input.mediaUrls[0],
    },
    ```
  - `lib/platforms/KickAdapter.ts:217, 269`:
    ```ts
    '-re',
    '-i', inputSource,
    ```
  - `lib/platforms/index.ts:128-129`:
    ```ts
    warpcast: { publishMode: 'native', maxChars: 320, supportsMedia: true },
    nostr:    { publishMode: 'native', maxChars: 65535, supportsMedia: true },
    ```
- What happens:
  1. **Discord (`DiscordAdapter.ts:113-117`):** When a Discord OAuth token expires and is refreshed (automatically triggered by `GET /api/platform/connections` at `app/api/platform/connections/route.ts:26, 47` or `PublishService.ts:116`), `DiscordAdapter.refreshAccessToken` overwrites `webhookUrl: ''` and `channelId: ''` in the encrypted JSON token. Every subsequent Discord publish fails permanently with `'Discord webhook URL not found in connection credentials'` (`DiscordAdapter.ts:147`).
  2. **Facebook (`FacebookAdapter.ts:226-229`):** Ignores `input.platformUserId` and always publishes to `pagesData.data[0]`, posting to the wrong Facebook Page if the user manages multiple pages.
  3. **Threads (`ThreadsAdapter.ts:89-93`):** Does not return `refreshToken: longLivedData.access_token` during authentication, so `row.refresh_token_encrypted` is `null` and `PublishService.ts:114` / `connections/route.ts:229` never refreshes expiring Threads tokens.
  4. **Pinterest (`PinterestAdapter.ts:198-201`):** Hardcodes `source_type: 'image_url'` even when publishing video files.
  5. **Reddit (`RedditAdapter.ts:135-141, 163`):** Hardcodes `kind: 'self'` and `sr: u_${username}` (drops all `mediaUrls` and cannot post to any subreddit), and extracts post ID via `data.jquery[data.jquery.length - 1][3][0].data.id`.
  6. **Kick (`KickAdapter.ts:217, 269`):** Spawns `ffmpeg -re` (real-time 1x playback speed streaming over RTMP) inside a serverless request handler, which is guaranteed to exceed serverless `maxDuration` on any video longer than a few minutes.
  7. **Warpcast & Nostr (`lib/platforms/index.ts:128-129`):** Marked as `publishMode: 'native'`, whereas `WarpcastAdapter.ts` and `NostrAdapter.ts` are generic HTTP webhook relays (not Farcaster Ed25519 hubs or Nostr secp256k1 websocket relays).
- How to reproduce:
  Static analysis of each cited adapter method.
- Root cause:
  Incomplete adapter implementations and missing preservation of existing JSON credential fields in `tryRefreshToken` (`app/api/platform/connections/route.ts:29-45` preserves `streamUrl` for `kick` but does not preserve `webhookUrl`/`channelId` for `discord`).
- Recommended fix:
  1. Preserve `webhookUrl` and `channelId` when refreshing Discord tokens in `connections/route.ts` and `PublishService.ts`.
  2. Match `pagesData.data.find(p => p.id === input.platformUserId) || pagesData.data[0]` in `FacebookAdapter.ts:227`.
  3. Set `refreshToken: longLivedData.access_token` in `ThreadsAdapter.ts:89-93`.
  4. Reclassify `warpcast` and `nostr` as `'webhook'` in `lib/platforms/index.ts:128-129`.
- Effort: M
- Confidence: High (verified line-by-line across all 27 platform adapters).

---

### STU-014 — `AnthropicProvider.generateObject` and `OpenAIProvider.generateObject` serialize internal Zod `.shape` AST instead of JSON Schema, and `AnthropicProvider` contains retired `'claude-2.1'` and `console.log`
- Severity: MEDIUM
- Category: Correctness
- Status: FACT
- Where:
  - `lib/ai/providers/AnthropicProvider.ts:33, 41, 59, 114-127`
  - `lib/ai/providers/OpenAIProvider.ts:81-94`
- Evidence:
  - `lib/ai/providers/AnthropicProvider.ts:115-116` (and `OpenAIProvider.ts:82-83`):
    ```ts
    const schemaDescription = JSON.stringify((schema as unknown as z.ZodObject<Record<string, z.ZodTypeAny>>).shape, null, 2);
    const enhancedPrompt = `${prompt}\n\nRespond with valid JSON matching this schema:\n${schemaDescription}`;
    ```
  - `lib/ai/providers/OpenAIProvider.ts:93`:
    ```ts
    const parsed = JSON.parse(result.value.text);
    ```
  - `lib/ai/providers/AnthropicProvider.ts:33, 41, 59`:
    ```ts
    'claude-2.1',
    ...
    console.log(`[AnthropicProvider] Trying model: ${modelToTry}`);
    ```
- What happens:
  1. When Groq fails and `FallbackAIProvider` falls back to `AnthropicProvider` or `OpenAIProvider` for `generateObject` (used by `PostAdapter`, `WeekArcGenerator`, `ProfileExtractor`), `JSON.stringify(schema.shape)` serializes internal Zod v3 `_def` AST nodes rather than a clean JSON Schema, wasting tokens and confusing the LLM.
  2. `OpenAIProvider.generateObject` calls `JSON.parse(result.value.text)` without stripping ` ```json ... ``` ` markdown fences (unlike `GroqProvider.ts:126` and `AnthropicProvider.ts:125`), throwing a `SyntaxError` whenever OpenAI wraps JSON in markdown fences.
  3. `AnthropicProvider.ts:33` falls back to `'claude-2.1'` (retired by Anthropic, returns 404) and logs via `console.log` (`lines 41, 59`) instead of `logger`.
- How to reproduce:
  Static analysis of `AnthropicProvider.ts:33, 41, 59, 115` and `OpenAIProvider.ts:82, 93`.
- Root cause:
  `GroqProvider.generateObject` was updated to strip markdown fences and stop dumping `schema.shape`, but those fixes were never applied to `AnthropicProvider` and `OpenAIProvider`.
- Recommended fix:
  Apply the markdown-fence stripping logic from `GroqProvider.ts:125-134` to `OpenAIProvider.ts:93`, remove `JSON.stringify(schema.shape)` from both fallback providers, and remove `'claude-2.1'` and `console.log` from `AnthropicProvider.ts`.
- Effort: S
- Confidence: High (exact code quoted).

---

### STU-015 — `ImageOptimizer.uploadBuffer` throws `ReferenceError: supabaseAdmin is not defined` when R2 upload fails
- Severity: MEDIUM
- Category: Reliability
- Status: FACT
- Where:
  - `lib/media/ImageOptimizer.ts:431-452`
- Evidence:
  - `lib/media/ImageOptimizer.ts:431-449`:
    ```ts
    } catch (r2Err) {
      logger.warn('R2 upload failed in ImageOptimizer, falling back to Supabase Storage', { error: r2Err });
      try {
        const { config } = await import('@/lib/config/schema');
        const { createClient } = await import('@supabase/supabase-js');
        if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
          return null;
        }
        const { error: uploadError } = await supabaseAdmin.storage
          .from('post-media')
          .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) return null;
        const { data: urlData } = supabaseAdmin.storage.from('post-media').getPublicUrl(storagePath);
        return urlData?.publicUrl || null;
      } catch {
        return null;
      }
    }
    ```
- What happens:
  If R2 image upload fails in `ImageOptimizer.uploadBuffer`, the fallback block dynamically imports `createClient` from `@supabase/supabase-js` (`line 435`) but never calls it, and then references an undeclared variable `supabaseAdmin` on lines 439 and 444. This immediately throws `ReferenceError: supabaseAdmin is not defined` (caught by the inner `catch {}` which returns `null`), making the Supabase Storage fallback 100% dead code.
- How to reproduce:
  Inspect `lib/media/ImageOptimizer.ts:435-445`: `supabaseAdmin` is neither imported nor declared in `ImageOptimizer.ts`.
- Root cause:
  Incomplete refactor when migrating from `supabaseAdmin` to dynamic import.
- Recommended fix:
  Instantiate `const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)` at line 438 (or import `supabaseAdmin` from `@/lib/supabase/admin`).
- Effort: S
- Confidence: High (verified in `lib/media/ImageOptimizer.ts:431-452`).

---

### STU-016 — `PostAdapter` duplicates the entire `systemPrompt` inside the user `prompt` AND `options.systemPrompt` on every adaptation call
- Severity: MEDIUM
- Category: Performance
- Status: FACT
- Where:
  - `lib/ai/PostAdapter.ts:440-472, 560-584, 682-716`
- Evidence:
  - `lib/ai/PostAdapter.ts:440-472`:
    ```ts
    const prompt = `${systemPrompt}

    ## Task:
    Adapt the following idea/post for **${platform.toUpperCase()}**.
    ...`;

    const result = await this.aiProvider.generateObject(
      prompt,
      AdaptedPostSchema,
      {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1000,
      }
    );
    ```
- What happens:
  In `adaptSinglePlatform` (`lines 440-472`), `adaptMultiPlatform` (`lines 560-584`), and `adaptAccountTargets` (`lines 682-716`), `PostAdapter` prepends the full `systemPrompt` (`SAFETY_SYSTEM_PREFIX` + `BASE_SYSTEM_PROMPT` + `PRIORITY_GOVERNANCE_RULES` + `studioContext`, ~3,000+ characters) to the user `prompt` string AND also passes `systemPrompt` in `options.systemPrompt`. Every AI provider (`GroqProvider`, `AnthropicProvider`, `OpenAIProvider`) sends `options.systemPrompt` as the `system` message and `prompt` as the `user` message, doubling input prompt token consumption and latency on every draft generation.
- How to reproduce:
  Inspect `lib/ai/PostAdapter.ts:440-472, 560-584, 682-716`.
- Root cause:
  Redundant inclusion of `${systemPrompt}` in the user prompt template after `options.systemPrompt` support was added to `AIProvider.generateObject`.
- Recommended fix:
  Remove `${systemPrompt}\n\n` from the user `prompt` template in `adaptSinglePlatform`, `adaptMultiPlatform`, and `adaptAccountTargets`, keeping `systemPrompt` solely in `options.systemPrompt`.
- Effort: S
- Confidence: High (exact code verified in all three `PostAdapter` methods).

---

### STU-017 — `ContentGuard` safety refusal (`{"content": ""}`) fails `AdaptedPostSchema.min(1)` and triggers retries across all fallback AI providers; regex filter blocks benign idioms like `"kill it"`
- Severity: MEDIUM
- Category: Reliability
- Status: FACT
- Where:
  - `lib/ai/ContentGuard.ts:39-47, 227-228`
  - `lib/ai/PostAdapter.ts:11-15`
  - `lib/ai/provider.ts:96-135`
- Evidence:
  - `lib/ai/ContentGuard.ts:227-228`:
    ```ts
    If the user's input violates any of the above rules, DO NOT generate the post. Instead, respond ONLY with:
    {"refused": true, "reason": "Brief explanation of why this content cannot be generated", "content": "", "hashtags": [], "characterCount": 0}
    ```
  - `lib/ai/PostAdapter.ts:11-15`:
    ```ts
    const AdaptedPostSchema = z.object({
      content: z.string().min(1),
      hashtags: z.array(z.string()).default([]),
      characterCount: z.number(),
    });
    ```
  - Execution output from `eval_studio.test.ts` on `ContentGuard.validateBeforeGenerate`:
    ```json
    ContentGuard("How to kill it at your next product launch"):
    {"allowed":false,"violation":{"category":"violence_incitement","severity":"block","reason":"Content contains language that may incite violence, threats, or physical harm.","matchedPattern":"kill it","platform":"all"}}
    ```
- What happens:
  1. When an LLM obeys `SAFETY_SYSTEM_PREFIX` and refuses harmful input by returning `{"refused": true, ..., "content": ""}`, `AdaptedPostSchema` (`content: z.string().min(1)`) rejects the empty `content` string with a Zod validation error. `FallbackAIProvider.generateObject` (`lib/ai/provider.ts:96-135`) treats this validation error as a provider failure and retries the refused prompt across every fallback provider (`Groq` -> `Anthropic` -> `OpenAI`), burning 3x tokens and latency before finally failing with a generic error instead of surfacing the safety refusal reason.
  2. `ContentGuard.PROHIBITED_PATTERNS` (`lib/ai/ContentGuard.ts:44`) matches `\b(kill|murder|assassinate|shoot|stab|bomb|attack|destroy)\s+(you|them|him|her|everyone|people|all)\b/i` (which blocks benign marketing copy like `"How to crush and destroy all your Q4 goals"` or `"attack all your hardest tasks first"` when `destroy all` / `attack all` appear).
- How to reproduce:
  Call `ContentGuard.validateBeforeGenerate('How to kill it at your next product launch')` — returns `allowed: false` (`matchedPattern: "kill it"`).
- Root cause:
  1. `AdaptedPostSchema` does not allow `refused: true` with empty `content`.
  2. Inclusion of pronoun `it` in the `violence_incitement` regex (`lib/ai/ContentGuard.ts:44`).
- Recommended fix:
  1. Remove `|it` from the `violence_incitement` regex at `lib/ai/ContentGuard.ts:44`.
  2. Handle `parsed.refused === true` before `AdaptedPostSchema.parse()` so intentional LLM safety refusals return a non-retryable `REFUSED` error immediately without triggering `FallbackAIProvider`.
- Effort: S
- Confidence: High (proven by static analysis and `eval_studio.test.ts` execution).

---

### STU-018 — `POST /api/composer/humanize` and `POST /api/composer/arc/generate` ignore `studioProfile` personalisation, and `PUT /api/studio/profile` drops `businessStage` and `workInterests` when syncing `onboardingAnswers`
- Severity: MEDIUM
- Category: AI-Quality
- Status: FACT
- Where:
  - `app/api/composer/humanize/route.ts:52-100`
  - `lib/ai/engines/ContentHumanizer.ts:164-210`
  - `app/api/composer/arc/generate/route.ts:68-86, 226-236`
  - `lib/ai/WeekArcGenerator.ts:183-199`
  - `app/api/studio/profile/route.ts:116-125`
- Evidence:
  - `lib/ai/engines/ContentHumanizer.ts:171-180`:
    ```ts
    const systemPrompt = `You are a sharp, opinionated, deeply experienced human writer and practitioner.
    Your job is to rewrite the user's draft so it reads like a top 1% human practitioner on ${platform.toUpperCase()} — NOT an AI.
    ...
    5. Write like a real founder/operator talking to a smart peer over coffee: direct, grounded, slightly informal, zero fluff.`;
    ```
  - `app/api/composer/arc/generate/route.ts:226-235`:
    ```ts
    const arcResult = await weekArcGenerator.generateArc({
      coreStory,
      storyType,
      platforms,
      startDate: parsedStartDate,
      onboardingAnswers: profile?.onboardingAnswers ?? null,
    ```
  - `app/api/studio/profile/route.ts:116-125`:
    ```ts
    const syncedOnboardingAnswers = {
      ...(existingProfile.onboardingAnswers || {}),
      role: studioProfile.role,
      doing: studioProfile.doing,
      ...(studioProfile.businessDomain ? { domain: studioProfile.businessDomain } : {}),
      audience: studioProfile.audience,
      tone: studioProfile.tone,
      style: studioProfile.style,
      interests: studioProfile.interests,
    };
    ```
- What happens:
  1. **Humanizer Overwrites Persona (`ContentHumanizer.ts:164-210`):** When a user clicks `"Humanize"` on a draft, `POST /api/composer/humanize` never loads the user's `studioProfile` or calls `buildStudioContext`. Instead, `humanizeWithAI` forces every user (even a humble CS student or lifestyle creator) into a hardcoded `"real founder/operator talking to a smart peer over coffee"` persona, skips `ContentGuard`, and does not clamp the rewritten output to the platform's `maxChars`.
  2. **Flight Plan Arc Generator Ignores `studioProfile` (`arc/generate/route.ts:231`):** `POST /api/composer/arc/generate` passes `profile?.onboardingAnswers` instead of `profile?.studioProfile` (and never calls `buildStudioContext`), while `PUT /api/studio/profile` (`app/api/studio/profile/route.ts:116-125`) omits `businessStage` (`stage`) and `workInterests` when syncing `onboardingAnswers`.
  3. **Deterministic `ContentHumanizer.humanize` Produces Ungrammatical Replacements & False `panelScore: 100` (`lib/ai/engines/ContentHumanizer.ts:28-140`):** As proven by `eval_studio.test.ts`, running `ContentHumanizer.humanize` on `"In today’s fast-paced world, let’s dive in and delve into the tapestry of game-changing SaaS architecture — it is important to note that this seamless paradigm shift will supercharge your workflow! 🚀✨🔥💡🎯"` produces:
     - `"delve into"` -> **`"explore into"`** (`"explore into the mix"`, ungrammatical)
     - `"paradigm shift"` -> **`"approach shift"`** (`"this smooth approach shift"`, ungrammatical)
     - Fails to strip `"In today’s fast-paced world, let’s dive in"` when curly apostrophes (`’`, U+2019) are used instead of straight ASCII `'`
     - Leaves `"game-changing"`, `"it is important to note that"`, and `"🚀✨🔥💡🎯"` untouched while returning **`panelScore: 100`** (`All 5 panel checks passed`).
- How to reproduce:
  Static analysis of `app/api/composer/humanize/route.ts`, `lib/ai/engines/ContentHumanizer.ts:164-210`, `app/api/composer/arc/generate/route.ts:231`, and `app/api/studio/profile/route.ts:116-125`.
- Root cause:
  `buildStudioContext(studioProfile)` was wired into `PostAdapter` and `studioIdeas`, but omitted from `ContentHumanizer` and `WeekArcGenerator`.
- Recommended fix:
  1. Pass `studioContext = buildStudioContext(profile?.studioProfile)` into `ContentHumanizer.humanizeWithAI` and `WeekArcGenerator.generateArc`, and clamp `humanizeWithAI` output to `PLATFORM_LIMITS[platform].maxChars`.
  2. Include `stage: studioProfile.businessStage` and `workInterests: studioProfile.workInterests` in `syncedOnboardingAnswers` in `app/api/studio/profile/route.ts:116-125`.
- Effort: S
- Confidence: High (verified across all 5 files).

---

### STU-019 — Two divergent plan-enforcement systems coexist (`lib/limits/*` vs `lib/billing/plans.ts`), and plan feature gates (`content_humanizer`, `flightplan_ai`, `first_comment`) are never enforced
- Severity: MEDIUM
- Category: Billing
- Status: FACT
- Where:
  - `lib/limits/freeTier.ts:16-66, 148-159`
  - `lib/limits/enforcer.ts:11-57`
  - `lib/billing/plans.ts:61-190`
  - `lib/middleware/plan-enforcement-middleware.ts:255-275, 513-546`
  - `app/api/composer/humanize/route.ts:52`
  - `app/api/composer/arc/generate/route.ts:57`
- Evidence:
  - `lib/billing/plans.ts:94, 125`:
    ```ts
    // Spark (Free):
    flightplan_ai: false,
    first_comment: false,
    content_humanizer: false,
    // Creator:
    first_comment: false,
    content_humanizer: false,
    ```
  - `app/api/composer/humanize/route.ts:52`:
    ```ts
    export const POST = withPlanEnforcement(
      planEnforcement.useAI,
    ```
  - `app/api/composer/arc/generate/route.ts:57`:
    ```ts
    export const POST = withPlanEnforcement(
      planEnforcement.useAI,
    ```
- What happens:
  1. `lib/billing/plans.ts` explicitly sets `content_humanizer: false`, `first_comment: false`, and `flightplan_ai: false` on the Spark (Free) plan (and `first_comment: false`, `content_humanizer: false` on the Creator plan). However, `/api/composer/humanize` and `/api/composer/arc/generate` only check `planEnforcement.useAI` (whether the user has >0 AI credits) and never check `planEnforcement.useContentHumanizer` (`plan-enforcement-middleware.ts:535`) or `planEnforcement.useFlightPlan` (`line 529`). Similarly, `ScheduleService` and `PublishService` never check `planEnforcement.useFirstComment` (`line 532`).
  2. `lib/limits/freeTier.ts` defines a completely separate, conflicting quota table (`postsPerMonth: 15`, `aiTokensPerMonth: 50000`, counting only `status = 'published'` posts) that disagrees with `lib/billing/plans.ts` (`ai_credits_per_month: 25`, counting `status IN ('published', 'scheduled')` posts).
- How to reproduce:
  Static analysis of `lib/billing/plans.ts:61-190`, `lib/middleware/plan-enforcement-middleware.ts:529-536`, `app/api/composer/humanize/route.ts:52`, and `app/api/composer/arc/generate/route.ts:57`.
- Root cause:
  Helper middlewares `planEnforcement.useFlightPlan`, `planEnforcement.useFirstComment`, and `planEnforcement.useContentHumanizer` were defined in `plan-enforcement-middleware.ts:529-536` but never attached to the corresponding routes.
- Recommended fix:
  Enforce `useContentHumanizer` on `/api/composer/humanize`, `useFlightPlan` on `/api/composer/arc/generate`, and `useFirstComment` when `autoFirstComment` is submitted in `/api/composer/schedule` or `/api/composer/broadcast`, and deprecate `lib/limits/freeTier.ts` in favor of `lib/billing/plans.ts`.
- Effort: S
- Confidence: High (verified in both billing modules and route handlers).

---

### STU-020 — `StudioOnboardingModal` is never mounted on `/dashboard/studio`, so new users never see Studio onboarding and receive silent default persona values (`"Founder & Creator"`)
- Severity: MEDIUM
- Category: UX
- Status: FACT
- Where:
  - `app/dashboard/studio/page.tsx:1-26`
  - `app/dashboard/composer/ComposerClient.tsx:114, 420-436`
  - `components/dashboard/settings/tabs/StudioTab.tsx:11, 558`
- Evidence:
  - Grep across the entire repository for `StudioOnboardingModal`:
    - Only imported in `components/dashboard/settings/tabs/StudioTab.tsx:11` (`import { StudioOnboardingModal } from '@/components/dashboard/StudioOnboardingModal';`).
    - Never imported or rendered in `app/dashboard/studio/page.tsx` or `app/dashboard/composer/ComposerClient.tsx`.
  - `app/dashboard/composer/ComposerClient.tsx:420-436`:
    ```ts
    const effectiveStudioProfile = useMemo(() => {
      if (studioProfile && (studioProfile.role || studioProfile.doing)) {
        return studioProfile;
      }
      const answers = (profile as any)?.onboardingAnswers || (profile as any)?.onboarding_answers || {};
      const fallbackRole = answers.role || profile?.role || profile?.headline || 'Founder & Creator';
      const fallbackDoing = answers.doing || answers.domain || profile?.bio || 'Growing & Scaling';
      const fallbackAudience = answers.audience || 'Founders, creators, and professionals';
      const fallbackTone = answers.tone || 'Direct & authentic';
      const fallbackStyle = answers.style || 'Actionable insights';
      const fallbackInterests = answers.interests || ['Technology', 'Growth'];
      return {
        role: String(fallbackRole),
        doing: String(fallbackDoing),
        audience: String(fallbackAudience),
        tone: String(fallbackTone),
        style: String(fallbackStyle),
        interests: Array.isArray(fallbackInterests) && fallbackInterests.length > 0 ? fallbackInterests : ['Technology', 'Growth'],
        completedAt: new Date().toISOString(),
      };
    }, [studioProfile, profile]);
    ```
- What happens:
  1. Despite `StudioOnboardingModal.tsx` (1,121 lines) implementing a 7-step persona calibration wizard with a `"Personalizing your Studio..."` completion screen, it is **never mounted** on `/dashboard/studio` (`ComposerClient.tsx`). The only place a user can ever trigger `StudioOnboardingModal` is by manually navigating to `Settings -> Studio Tab` (`components/dashboard/settings/tabs/StudioTab.tsx:558`).
  2. When a brand-new user visits `/dashboard/studio` without completing onboarding, `effectiveStudioProfile` (`ComposerClient.tsx:420-436`) silently fabricates a profile with `role: 'Founder & Creator'`, `doing: 'Growing & Scaling'`, `audience: 'Founders, creators, and professionals'`, `tone: 'Direct & authentic'`, `interests: ['Technology', 'Growth']`, and a fake `completedAt: new Date().toISOString()`. Both `/api/studio/ideas` and `/api/composer/adapt` then personalise all AI outputs to a `"Founder & Creator"` persona the user never selected.
- How to reproduce:
  Log in as a new user with `studio_profile = null` and navigate to `/dashboard/studio`. No onboarding modal or setup banner appears, and clicking `"Inspire me"` or `"Adapt with AI"` sends `effectiveStudioProfile` (`role: "Founder & Creator"`) to the backend.
- Root cause:
  `StudioOnboardingModal` was removed or omitted from `ComposerClient.tsx` and replaced with `effectiveStudioProfile` hardcoded defaults.
- Recommended fix:
  Mount `<StudioOnboardingModal />` (or a clear non-blocking `"Calibrate your Studio voice (60s)"` banner that opens `StudioOnboardingModal`) inside `ComposerClient.tsx` when `!studioProfile?.completedAt`, and stop injecting fabricated `'Founder & Creator'` defaults when the user has not calibrated a profile.
- Effort: S
- Confidence: High (confirmed via repository-wide search and `ComposerClient.tsx:420-436`).

---

### STU-021 — `ComposerClient.tsx` renders hardcoded `"usha"` / `"V"` fallback identity, leaks module-cached profile across users, breaks multi-account single-draft retry, and lacks draft auto-save
- Severity: MEDIUM
- Category: UX
- Status: FACT
- Where:
  - `app/dashboard/composer/ComposerClient.tsx:137-144, 183, 823, 1013-1068, 1659, 1697-1716, 2511`
- Evidence:
  - `app/dashboard/composer/ComposerClient.tsx:137-144`:
    ```ts
    // Module-level memory cache so re-entering Studio renders identity card & platforms instantaneously (0ms)
    let memoryComposerProfile: ComposerProfile | null = null;
    let memoryStudioProfile: StudioProfileData | null = null;
    ```
  - `app/dashboard/composer/ComposerClient.tsx:1659, 1697-1716`:
    ```ts
    <span>{(profile?.name || profile?.subdomain || 'V')[0]?.toUpperCase()}</span>
    ...
    ) : (
      <>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-bold text-[#231C16] truncate">
            usha
          </p>
        </div>
        <p className="text-xs text-[#735A42] mt-0.5 font-normal">
          Professional
        </p>
      </>
    )}
    ```
  - `app/dashboard/composer/ComposerClient.tsx:1024-1052`:
    ```ts
    const response = await fetch('/api/composer/adapt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea: content.trim(),
        platforms: [platform],
        targetAccounts: targetConn ? [targetConn] : undefined,
        tone,
         attachedBrandUrl: attachedBrandUrl || undefined,
      }),
    });
    const data = await response.json();
    if (response.ok && data.variants?.[platform]) {
    ```
  - `app/dashboard/composer/ComposerClient.tsx:2511`:
    ```ts
    onClick={() => generateDrafts()}
    ```
- What happens:
  1. **Hardcoded `"usha"` Identity (`lines 1659, 1697-1716`):** When `profile` is `null` and `profileLoading` finishes (e.g. a user whose profile row hasn't been created yet or failed to load), the Studio header card displays the hardcoded name **`"usha"`**, subtitle **`"Professional"`**, and avatar initial **`"V"`**.
  2. **Unkeyed Module Cache (`lines 137-144, 183, 823`):** `memoryComposerProfile`, `memoryStudioProfile`, `memoryConnectedPlatforms`, and `memoryConnectedAccounts` are module-level globals not keyed by `userId` or `workspaceId` (and ESLint flags `line 823: React Hook useEffect has a missing dependency: 'workspaceId'`). Switching accounts or workspaces in the same SPA session flashes the previous user's identity and Studio profile.
  3. **Broken Multi-Account Single Retry (`lines 1013-1068`):** `retrySingleDraft` omits `studioProfile` and `disablePersonalization` from the `/api/composer/adapt` request body, and reads `data.variants[platform]` instead of `data.targetVariants`. When a user has 2 accounts on the same platform, `retrySingleDraft` loses account-specific adaptation and Studio persona context.
  4. **`"Regenerate all drafts"` Ignores Selected Accounts (`line 2511`):** Calls `generateDrafts()` (`useSelectedOnly = false`), regenerating drafts for all connected accounts even if the user selected a subset.
  5. **No Local Auto-Save or `beforeunload` Guard:** Refreshing or accidentally closing the tab while writing in Studio loses the unsaved source draft and adapted variants.
- How to reproduce:
  Inspect `app/dashboard/composer/ComposerClient.tsx` at lines `137-144`, `1013-1068`, `1659`, `1697-1716`, and `2511`.
- Root cause:
  Leftover developer placeholder (`"usha"`), unkeyed module globals for SPA caching, and incomplete update of `retrySingleDraft` when `targetAccounts` / `studioProfile` were added to `generateDrafts`.
- Recommended fix:
  1. Replace hardcoded `"usha"` / `"V"` with `userCtxUser?.fullName || 'Your Profile'` and initial `(profile?.name || userCtxUser?.fullName || 'U')[0]`.
  2. Key `memoryComposerProfile` and related module caches by `${userId}:${workspaceId}` and add `workspaceId` to the `useEffect` dependency array at line 823.
  3. Pass `studioProfile: effectiveStudioProfile` and `disablePersonalization: !usePersonalContext` in `retrySingleDraft` and read `data.targetVariants?.[0] || data.variants?.[platform]`.
  4. Persist in-progress `content` to `localStorage` keyed by `workspaceId`.
- Effort: S
- Confidence: High (exact lines quoted from `ComposerClient.tsx`).

---

### STU-022 — `GET /api/posts/pending-count` miscalculates scheduled posts and returns `count: drafts` instead of `totalPending`
- Severity: MEDIUM
- Category: Correctness
- Status: FACT
- Where:
  - `app/api/posts/pending-count/route.ts:36-67`
  - `app/dashboard/layout.tsx:148-153, 226`
- Evidence:
  - `app/api/posts/pending-count/route.ts:36-66`:
    ```ts
    const [draftResult, scheduledResult] = await Promise.all([
      supabaseAdmin
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', auth.workspaceId)
        .eq('status', 'draft')
        .gte('created_at', since24h),
      supabaseAdmin
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', auth.workspaceId)
        .eq('status', 'scheduled')
        .gte('created_at', since24h),
    ]);
    ...
    const totalPending = drafts + scheduled;

    return NextResponse.json({
      count: drafts,
      drafts,
      scheduled,
      total: totalPending,
    });
    ```
- What happens:
  1. `scheduledResult` filters scheduled posts by `.gte('created_at', since24h)` instead of `scheduled_at >= now`, so any post scheduled more than 24 hours ago (e.g. via the 7-Day Flight Plan) is excluded from `scheduled`.
  2. Even after computing `const totalPending = drafts + scheduled`, the JSON response returns `count: drafts` instead of `count: totalPending`, which `app/dashboard/layout.tsx:151` reads (`if (typeof data.count === 'number') setDynamicPendingCount(data.count)`).
- How to reproduce:
  Schedule a post with 0 drafts in the workspace, then call `GET /api/posts/pending-count` — `data.count` returns `0` even though `scheduled` is `1`.
- Root cause:
  Filtering `scheduled` by `created_at >= since24h` and returning `count: drafts` instead of `count: totalPending`.
- Recommended fix:
  Filter `scheduled` posts without the `created_at >= since24h` restriction (or `scheduled_at >= new Date().toISOString()`) and return `count: totalPending`.
- Effort: S
- Confidence: High (exact code quoted).

---

### STU-023 — Studio unit test `ComposerClient.test.tsx` fails in Vitest (`1 failed | 54 passed`) and route tests mock out real provider/schema behavior
- Severity: MEDIUM
- Category: Test-Gap
- Status: FACT
- Where:
  - `app/dashboard/composer/__tests__/ComposerClient.test.tsx:57-90`
  - `app/api/studio/ideas/__tests__/route.test.ts:22-37, 108-133`
- Evidence:
  - Exact command and output from running Vitest (`task-210`):
    ```text
    Command: Set-Location "d:\UNOOLNEW"; npx vitest run app/api/studio/ideas/__tests__/route.test.ts app/api/studio/profile/__tests__/route.test.ts lib/ai/__tests__/studioContext.test.ts lib/ai/__tests__/studioIdeas.test.ts lib/config/__tests__/studioOnboarding.test.ts app/dashboard/composer/__tests__/ComposerClient.test.tsx app/dashboard/composer/__tests__/IPhonePreview.test.tsx

    Result:
     ✓ lib/config/__tests__/studioOnboarding.test.ts (10 tests) 14ms
     ✓ lib/ai/__tests__/studioContext.test.ts (16 tests) 11ms
     ✓ lib/ai/__tests__/studioIdeas.test.ts (13 tests) 2652ms
     ✓ app/api/studio/profile/__tests__/route.test.ts (8 tests) 27ms
     ✓ app/api/studio/ideas/__tests__/route.test.ts (4 tests) 131ms
     ✓ app/dashboard/composer/__tests__/IPhonePreview.test.tsx (2 tests) 379ms
     ❯ app/dashboard/composer/__tests__/ComposerClient.test.tsx (2 tests | 1 failed) 1492ms
       × ComposerClient platform connection filtering > renders "No connected platforms yet" when user has 0 connected platforms
         → Unable to find an element with the text: /No connected platforms yet/i.
     Test Files  1 failed | 6 passed (7)
          Tests  1 failed | 54 passed (55)
    ```
- What happens:
  1. `ComposerClient.test.tsx` fails on `renders "No connected platforms yet" when user has 0 connected platforms` because `ComposerClient.tsx` defaults to `mode === 'ai'` where the platform selector drawer is collapsed by default (`showPlatformSelector === false`) and the empty state button says `"Connect platforms to generate drafts"` (`ComposerClient.tsx:1882`), while `"No connected platforms yet."` (`line 1945`) is only rendered after clicking to expand the platform selector or switching to `Quick Broadcast` mode.
  2. `app/api/studio/ideas/__tests__/route.test.ts` mocks `GroqProvider.generateText` to return a JSON array string (`JSON.stringify([...])`), masking both `STU-005` (invalid model `'qwen/qwen3.8-27b'`) and `STU-006` (`response_format: { type: 'json_object' }` rejecting root JSON arrays).
  3. Zero unit or integration tests exist for: `app/api/composer/adapt`, `app/api/composer/broadcast`, `app/api/composer/save-draft`, `app/api/composer/schedule/*`, `app/api/composer/upload`, `app/api/composer/humanize`, `app/api/composer/arc/generate`, `app/api/publish/*`, `PublishService`, `ScheduleService`, or `ImageOptimizer`.
- How to reproduce:
  Run `npx vitest run app/dashboard/composer/__tests__/ComposerClient.test.tsx` in `d:\UNOOLNEW`.
- Root cause:
  UI layout change in `ComposerClient.tsx` without updating `ComposerClient.test.tsx`, over-mocking in `ideas/__tests__/route.test.ts`, and missing test suites for the composer/publish/schedule routes.
- Recommended fix:
  Update `ComposerClient.test.tsx` to test both collapsed (`"Connect platforms to generate drafts"`) and expanded (`"No connected platforms yet."`) states, and add route-level tests for `/api/composer/adapt`, `/api/composer/broadcast`, `/api/composer/schedule`, `/api/composer/upload`, and `/api/publish/[postId]`.
- Effort: M
- Confidence: High (proven by running the test suite).

---

### STU-024 — `filterDuplicates` in `lib/ai/studioIdeas.ts` ignores all words of 3 or fewer characters (`w.length > 3`), failing to deduplicate short-word titles
- Severity: LOW
- Category: AI-Quality
- Status: FACT
- Where:
  - `lib/ai/studioIdeas.ts:249-273`
- Evidence:
  - `lib/ai/studioIdeas.ts:251-265`:
    ```ts
    const normalizedExisting = alreadyShown.map((title) => {
      const clean = normalizeText(title);
      const words = new Set(clean.split(' ').filter((w) => w.length > 3));
      return { clean, words };
    });

    return ideas.filter((idea) => {
      const candidateClean = normalizeText(idea.title);
      const candidateWords = candidateClean.split(' ').filter((w) => w.length > 3);
      for (const existing of normalizedExisting) {
        if (candidateClean === existing.clean) return false;
        if (candidateWords.length === 0 || existing.words.size === 0) continue;
        let overlap = 0;
        for (const w of candidateWords) {
          if (existing.words.has(w)) overlap++;
        }
        const similarity = overlap / Math.max(existing.words.size, 1);
    ```
  - Execution output from `eval_studio.test.ts`:
    ```text
    filterDuplicates([{ title: 'AI in UI for Go UX now', ... }], ['AI in UI for Go UX today']) -> returns length 1 (not filtered!)
    ```
- What happens:
  Because `filter((w) => w.length > 3)` drops every 2- and 3-letter word (`ai`, `ui`, `ux`, `go`, `api`, `sql`, `aws`, `llm`, `b2b`, `seo`, `ios`, `web`, `dev`, `now`, `why`, `how`), two titles composed primarily of short domain terms (e.g., `"AI in UI for Go UX now"` vs `"AI in UI for Go UX today"`) have `overlap = 0` and are not recognized as duplicates. Additionally, `overlap / Math.max(existing.words.size, 1)` is asymmetric: if an existing title has 10 words and a candidate title is a 5-word subset of it, `similarity` is `5/10 = 0.50` (`<= 0.55`), bypassing deduplication.
- How to reproduce:
  Call `filterDuplicates([{ title: 'AI in UI for Go UX now', hook: 'H', format: 'story', why_it_works: 'W' }], ['AI in UI for Go UX today'])` — returns the duplicate idea unfiltered.
- Root cause:
  Overly aggressive `w.length > 3` filter and asymmetric denominator (`existing.words.size` instead of `Math.min(candidateWords.length, existing.words.size)`).
- Recommended fix:
  Change the word filter to `w.length >= 2` (excluding a small stopword set like `in`, `on`, `to`, `of`, `for`, `the`, `and`) and divide `overlap` by `Math.min(candidateWords.length, existing.words.size)`.
- Effort: S
- Confidence: High (proven by code and `eval_studio.test.ts`).

---

### STU-025 — Broken `/terms` and `/dashboard/settings?tab=persona` links, swapped sidebar navigation descriptions between `Studio` and `Signal`, dead `/api/profile/studio` route, and UTF-8 mojibake in `Studio` page title
- Severity: LOW
- Category: UX
- Status: FACT
- Where:
  - `app/dashboard/studio/page.tsx:6`
  - `app/dashboard/layout.tsx:206-227`
  - `app/dashboard/composer/ComposerClient.tsx:877, 1005, 1065, 1287, 2437`
  - `components/dashboard/StudioToast.tsx:300, 315`
  - `lib/ai/WeekArcGenerator.ts:52`
  - `app/api/profile/studio/route.ts:1`
- Evidence:
  - `app/dashboard/studio/page.tsx:6`:
    ```ts
    title: 'Studio â€” Unool',
    ```
  - `app/dashboard/layout.tsx:206-226`:
    ```ts
    {
      id: 'studio',
      name: 'Studio',
      href: '/dashboard/studio',
      icon: PenTool,
      description: 'Bio-link profile & persona templates',
    },
    ...
    {
      id: 'signal',
      name: 'Signal',
      href: '/dashboard/signal',
      icon: Radio,
      description: 'Cross-platform post composer',
    ```
  - `app/dashboard/composer/ComposerClient.tsx:877` (and `1005, 1065, 1287, 2437`, `StudioToast.tsx:300, 315`):
    ```ts
    studioToast.Refused(data.violation?.reason, '/terms');
    ```
  - `lib/ai/WeekArcGenerator.ts:52`:
    ```ts
    return 'No creator persona context was saved yet. Set up your persona in Settings (/dashboard/settings?tab=persona) so Flight Plan can tailor hooks and examples to your background.';
    ```
  - `app/api/profile/studio/route.ts:1`:
    ```ts
    export { GET, PUT, POST } from '@/app/api/studio/profile/route';
    ```
- What happens:
  1. `app/dashboard/studio/page.tsx:6` renders mojibake `'Studio â€” Unool'` in the browser tab title.
  2. `app/dashboard/layout.tsx:206-226` swaps the descriptions of `Studio` (`'Bio-link profile & persona templates'`) and `Signal` (`'Cross-platform post composer'`).
  3. Clicking `"Review Content Policy"` on any safety refusal banner or toast navigates to `/terms`, which returns a 404 page because the actual route is `app/terms-of-service/page.tsx`.
  4. `WeekArcGenerator.ts:52` instructs users to visit `/dashboard/settings?tab=persona`, whereas the Settings page tab key is `tab=studio`.
  5. `app/api/profile/studio/route.ts` is an unused duplicate re-export (and `app/api/studio/profile/route.ts` does not even export `POST`, so `POST` in `export { GET, PUT, POST }` is `undefined`).
- How to reproduce:
  Inspect the cited lines in `app/dashboard/studio/page.tsx`, `app/dashboard/layout.tsx`, `ComposerClient.tsx`, `WeekArcGenerator.ts`, and `app/api/profile/studio/route.ts`.
- Root cause:
  UTF-8 em-dash encoding corruption, incomplete route/tab renaming, and uncleaned duplicate route file.
- Recommended fix:
  Fix `'Studio — Unool'` in `app/dashboard/studio/page.tsx:6`, swap the `Studio` and `Signal` descriptions in `app/dashboard/layout.tsx:206-226`, update `/terms` links to `/terms-of-service` (or add a redirect in `next.config`), change `?tab=persona` to `?tab=studio` in `WeekArcGenerator.ts:52`, and delete `app/api/profile/studio/route.ts`.
- Effort: S
- Confidence: High (exact files and lines verified).

---

### STU-026 — Studio has no closed-loop learning from user edits, published post performance, or rejected ideas
- Severity: INFO
- Category: Missing-Feature
- Status: FACT
- Where:
  - `lib/ai/studioIdeas.ts:69-118`
  - `lib/ai/PostAdapter.ts:440-716`
  - `app/api/composer/broadcast/route.ts:1-260`
- Evidence:
  - Static analysis of `lib/ai/studioIdeas.ts`, `lib/ai/PostAdapter.ts`, `lib/ai/studioContext.ts`, and `app/api/composer/broadcast/route.ts`: neither `buildIdeasPrompt` nor `PostAdapter` queries historical `posts`, `post_variants`, or `analytics_events` to see how the user edited AI drafts before publishing or which published posts achieved higher engagement. Only client-session `alreadyShown` titles (up to 15 in `localStorage`) are passed to `/api/studio/ideas`.
- What happens:
  Every Studio session starts from zero with only the static 7-question `studioProfile`. If a user consistently deletes hashtags, shortens sentences, or rewrites hooks in a particular way before publishing, Studio never learns from those edits.
- How to reproduce:
  Static analysis of `lib/ai/studioIdeas.ts` and `lib/ai/PostAdapter.ts`.
- Root cause:
  Personalisation is currently implemented strictly as static prompt-context injection (`buildStudioContext`) from `profiles.studio_profile`.
- Recommended fix:
  Inject the user's last 3–5 published `post_variants.adapted_content` examples as few-shot voice samples inside `buildStudioContext` or `PostAdapter` so the LLM matches the user's actual edited writing style.
- Effort: M
- Confidence: High (verified across the entire `lib/ai/` layer).

---

## Unverified Hypotheses (Rule 3 & Section 13.15)

1. **`UNVERIFIED HYPOTHESIS` — Live LLM Output Quality Under Production API Keys (`GROQ_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`):**
   - Because live provider calls are prohibited in a read-only no-production audit (Rule 6) and default model `'qwen/qwen3.8-27b'` is invalid (`STU-005`), live LLM completions from Groq/Anthropic/OpenAI were not executed. Deterministic engines (`synthesizeFallbackIdeas`, `buildStudioContext`, `ContentHumanizer.humanize`, `FoldLinter.lint`, `HookScorer.score`, `BeatSheetGenerator.generate`, `ContentGuard.validateBeforeGenerate`) were executed directly and verified.
2. **`UNVERIFIED HYPOTHESIS` — Production Cloudflare R2 Bucket Dashboard CORS Configuration:**
   - While `ensureR2Cors()` in `app/api/composer/upload/route.ts` fails via the S3 API (`STU-008`), whether CORS is manually configured in the live Cloudflare R2 dashboard for `unool.co` cannot be verified without production Cloudflare credentials.
3. **`UNVERIFIED HYPOTHESIS` — Production Supabase Database Live RLS State vs Migrations:**
   - All 60 SQL migration files in `supabase/migrations/` were audited statically; whether any out-of-band SQL changes were applied directly in the production Supabase SQL editor cannot be verified without querying the live database.

---

## Appendix A: Studio AI Prompt Templates (Section 8.1)

### A.1 Personal Context Block (`lib/ai/studioContext.ts:171-229`)
```text
CREATOR PROFILE (use this to personalize the post):
- Role: <role>
- <stageLabel>: <businessStage>
- <domainLabel>: <businessDomain>
- What they do: <doing>
- <workInterestsLabel>: <workInterests>
- Target audience: <audience>
- Voice/tone: <tone>
- Preferred post style: <style>
- Interests: <interests joined by ', '>

HOW TO USE IT:
- Write in the creator's tone and preferred style, in first person ('I').
- Speak to the target audience — use examples and language they care about.
- Ground examples, lessons, and hooks in their actual stage, domain, and the work topics they love talking about.
- Use interests only when they naturally strengthen the post (a metaphor, example, or angle). Do not force all interests into one post.
- Never mention or quote this profile or say 'as a [role]'.
- Never invent facts, numbers, achievements, or news.
```

### A.2 Studio Idea Generator System & User Prompt (`lib/ai/studioIdeas.ts:75-116`)
- **System Prompt (`line 75`):**
  ```text
  You are a friendly content coach helping a creator figure out what to post.
  ```
- **User Prompt (`lines 91-116`):**
  ```text
  Generate 3 fresh, specific post ideas for this creator right now.

  Today's date: ${dateStr}
  Upcoming relevant moments: ${hooksStr}

  ${contextBlock}

  Ideas already shown in this session (DO NOT repeat or closely paraphrase):
  ${avoidList}

  MUST-FOLLOW RULES:
  1. Every idea must fit this specific creator — their role, what they do, their audience, and their tone.
  2. Mix the 3 ideas across different angles:
     - Idea 1: about their work/craft and audience pain or lesson.
     - Idea 2: blends their work with one of their personal interests (natural metaphor, story, or angle — never forced).
     - Idea 3: timely — tied to the current season, week, or one of the upcoming moments above, from their point of view.
  3. Keep language simple and everyday. No buzzwords, no 'unlock', 'game-changer', 'delve', 'in today's fast-paced world'.
  4. Hooks must sound like a real person talking, in first person ('I'), matching their tone.
  5. Do NOT invent fake metrics, fake clients, fake employers, or fake news events.
  6. Do NOT repeat any topic from the 'already shown' list.
  7. Each idea needs:
     - title: short topic headline (max 10 words)
     - hook: the exact opening 1-2 lines they could paste into the composer (max 35 words)
     - format: one of 'story' | 'opinion' | 'how-to' | 'list' | 'question' | 'behind-the-scenes' | 'hot take'
     - why_it_works: 1 short sentence in plain English explaining why their audience will care (max 20 words)

  Return ONLY a JSON array, no markdown and no extra text:
  [{"title":"","hook":"","format":"","why_it_works":""}]
  ```

### A.3 Safety System Prefix (`lib/ai/ContentGuard.ts:212-229`)
```text
## MANDATORY CONTENT SAFETY & COMPLIANCE RULES (NON-NEGOTIABLE):
You MUST strictly adhere to Unool's Terms of Service and the community guidelines of LinkedIn, X, Instagram, Facebook, YouTube, Threads, Reddit, Bluesky, Mastodon, Pinterest, and all supported platforms:
1. NEVER generate hate speech, slurs, harassment, bullying, doxxing, or discrimination against any protected group.
2. NEVER generate threats of violence, incitement to harm, terrorism, or encouragement of self-harm/suicide.
3. NEVER generate sexually explicit content, non-consensual sexual content, or child exploitation material.
4. NEVER generate financial scams, pump-and-dump promotions, Ponzi schemes, phishing lures, fake giveaways, or deceptive return guarantees.
5. NEVER generate medical misinformation or dangerous unverified health cures.
6. NEVER generate spam, artificial engagement manipulation ("DM me 'FREE' for guaranteed $$$"), or platform ban-evasion instructions.
7. NEVER fabricate defamatory claims, fake news, or impersonate real individuals or organizations.

If the user's input violates any of the above rules, DO NOT generate the post. Instead, respond ONLY with:
{"refused": true, "reason": "Brief explanation of why this content cannot be generated", "content": "", "hashtags": [], "characterCount": 0}
```

### A.4 PostAdapter System & User Prompts (`lib/ai/PostAdapter.ts:346-411, 440-463`)
- **Base System Prompt + Priority Governance Rules (`lines 346-411`):**
  ```text
  You are a world-class social media strategist, ghostwriter, and platform algorithm specialist who has written viral, high-converting content for top founders, creators, and category-defining brands across all 26+ social platforms.
  ...
  ## Priority & Governance Rules:
  - Priority 1 (Highest): The author's current instructions and source idea in the prompt below.
  - Priority 2: Platform-specific constraints (character limits, formatting rules, and algorithm mechanics).
  - Priority 3: The Creator Profile calibrations below (voice, audience, role, style, and interests).
  - Never invent facts, numbers, metrics, employers, clients, achievements, or news events that are not in the source idea.
  - Never explicitly mention the Creator Profile or write 'As a [role]...'.
  ```
- **Single-Platform User Prompt (`lines 440-463`):**
  ```text
  ${systemPrompt}

  ## Task:
  Adapt the following idea/post for **${platform.toUpperCase()}**.

  ## Original Idea:
  "${idea}"

  ## Platform Constraints & Rules (${platform.toUpperCase()}):
  - **Strict Maximum Length**: ${rules.maxChars} characters (stay under ${Math.floor(rules.maxChars * 0.92)} chars to be safe)
  - **Style & Format**: ${rules.style}
  - **Tone**: ${toneInstruction}
  - **Hashtags**: ${rules.hashtagCount === 0 ? 'Do NOT include any hashtags (#) anywhere in the post or in the hashtags array. Return an empty hashtags array [].' : `Provide ${rules.hashtagCount} highly relevant, niche-specific hashtags in the hashtags array (without the # symbol).`}
  ${brandUrlInstruction}
  ```

### A.5 ContentHumanizer AI Pass Prompt (`lib/ai/engines/ContentHumanizer.ts:171-191`)
```text
You are a sharp, opinionated, deeply experienced human writer and practitioner.
Your job is to rewrite the user's draft so it reads like a top 1% human practitioner on ${platform.toUpperCase()} — NOT an AI.

STRICT RULES:
1. Preserve 100% of the user's core facts, numbers, links, and message. Never invent fake stats.
2. Delete all AI throat-clearing ("In today's fast-paced world", "Here's the thing:", "Let's dive in", "It's worth noting"). Start directly with the sharpest concrete claim, tension, or observation.
3. Replace abstract buzzwords ("leverage", "synergy", "paradigm", "delve", "tapestry", "game-changer", "testament") with plain, concrete everyday words.
4. Vary sentence rhythm: mix short punchy 4–7 word sentences with one longer, detailed sentence. Avoid symmetrical 3-bullet triplets where every line starts with an emoji.
5. Write like a real founder/operator talking to a smart peer over coffee: direct, grounded, slightly informal, zero fluff.
6. Keep formatting native to ${platform.toUpperCase()}.
7. Return ONLY the rewritten post text. No preambles, no quotes, no explanations.
```

### A.6 7-Day Flight Plan Arc Generator Prompt (`lib/ai/WeekArcGenerator.ts:363-411`)
```text
You are Unool's Narrative Strategist. A creator is sharing one real update from their week.
Your job is to turn that single update into a cohesive 7-day narrative arc across their connected platforms (${platforms.join(', ')}).

## NON-NEGOTIABLE FACTUAL GROUNDING RULES:
1. NEVER invent metrics, revenue numbers, user counts, percentages, customer quotes, team sizes, timeframes, or technical incidents that are NOT explicitly stated in the creator's input or persona context.
2. If the creator's input does not mention a specific number or detail, frame the post around the qualitative process, trade-offs, perspective, or open questions — NEVER fabricate a statistic to make a hook sound punchier.
3. Keep the voice natural, grounded, and human. Avoid generic AI clichés ("In today's fast-paced world", "Game-changer", "Unlock", "Delve", "Buckle up", "10x").
4. Each day's post must take a genuinely distinct angle so followers never feel they are reading the same post twice.
```
