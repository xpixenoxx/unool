# PERFORMANCE AUDIT — UNOOL (`unool.co`) Performance & Stress Investigation

Evidence-backed investigation of frontend bundle architecture, client rendering bottlenecks, API/network waterfalls, rate-limiting behavior, and serverless execution constraints.

---

## 1. Frontend Bundle & Rendering Bottlenecks

| Component / Route | Line Count / Dependencies | Bottleneck & Root Cause | Severity | Recommendation |
|---|---|---|---|---|
| **Monolithic Client Components (`'use client'`)** | `ComposerClient.tsx` (3,063 lines), `BillingClient.tsx` (2,956 lines), `PresenceClient.tsx` (2,285 lines), `BrandMaterialsSection.tsx` (2,258 lines), `SignalClient.tsx` (2,085 lines), `app/page.tsx` (1,584 lines) | Single `'use client'` files eagerly import `framer-motion` (`^12.42.2`) and dozens of `lucide-react` icons without `next/dynamic` sub-component code splitting for modals and secondary tabs. | **P1** | Split heavy modals (`StudioOnboardingModal`, `UnoolCheckoutModal`, `BroadcastCelebrationModal`, `TemplateGallery`) via `next/dynamic({ ssr: false })`. |
| **Simultaneous Live DOM Previews in Template Gallery** | `app/templates/TemplatesGalleryClient.tsx:95-115`, `components/profile/TemplateGallery.tsx:64-114` | `TemplatesGalleryClient` renders a live `1280x800` `ProfilePreview` DOM tree scaled via CSS `transform: scale(...)` inside **every card in the gallery grid simultaneously**, triggering lazy imports and animations for 20+ templates at once. | **P1** | Render lightweight static SVG/WebP thumbnails in the grid and mount `ProfilePreview` only inside the active preview modal or on hover/intersection. |
| **Three.js CPU Particle Loop in `ClubHero3D.tsx`** | `components/profile/templates/persona/sections/ClubHero3D.tsx:237-283` (`three@^0.186.1`, `@react-three/fiber`) | Previously omitted `.dispose()` on `BufferGeometry` and `PointsMaterial` and left `requestAnimationFrame` uncancelled on unmount. | **P2 (FIXED — `FIX-25`)** | Added `geometry.dispose()`, `material.dispose()`, and `cancelAnimationFrame(rafId)` in `useEffect` cleanup. |
| **Unbounded `requestAnimationFrame` in `OrbitalBackground.tsx`** | `components/ui/3d/OrbitalBackground.tsx:325-333` | `SVGOrbitals` ran a recursive `requestAnimationFrame` loop without calling `cancelAnimationFrame` on unmount. | **P2 (FIXED — `FIX-25`)** | Stored `rafId` and added `cancelAnimationFrame(rafId)` on unmount. |
| **100MB Base64 Data URI Fallback on Failed Upload** | `hooks/flightplan/useImageUpload.ts:227-273`, `components/flightplan/ScheduleNewPostModal.tsx:193-236` | When presigned upload failed, it fell back to `reader.readAsDataURL(file)` for files up to 100MB, embedding multi-megabyte base64 strings into React state and JSON request payloads. | **P1 (FIXED — `FIX-25`)** | Removed Base64 Data URI fallback and surfaced explicit upload error toast. |

---

## 2. Network Waterfalls & Redundant API Polling

1. **Global Context Fetch on Public Routes (`app/layout.tsx:135-139` — FIXED in `FIX-25`)**:
   - `UserProvider` (`lib/hooks/use-user-context.tsx`) now skips automatic `/api/user/context` fetches on public unauthenticated routes (`/`, `/pricing`, `/templates`, `/contact`, `/privacy`, `/terms`, `/signin`, `/signup`, `/forgot-password`, `/u/*`).
   - `FeatureFlagsProvider` (`lib/hooks/use-feature-flags.tsx`) now caches flags for 60s and respects the cache TTL on window `focus` events (`fetchFlags(false)`).
2. **Public Profile Metadata (`app/u/[subdomain]/layout.tsx` — FIXED in `FIX-17`)**:
   - Added server-side `generateMetadata` in `app/u/[subdomain]/layout.tsx` so social crawlers and initial document responses include the profile's OpenGraph/Twitter title, description, and image without waiting for client hydration.
3. **Duplicate Polling + Unfiltered Realtime in `ReferralDashboard.tsx:55-101` (FIXED in `FIX-25`)**:
   - Scoped Supabase Realtime `postgres_changes` subscriptions with `filter: workspace_id=eq.${workspaceId}` / `referrer_workspace_id=eq.${workspaceId}` and relaxed the fallback polling interval from 8s to 30s.

---

## 3. Backend & Serverless Scalability Constraints

1. **Upstash Redis Rate-Limiter Bug on `/api/profile/[subdomain]` (`app/api/profile/[subdomain]/route.ts:28-49` — FIXED in `FIX-09`)**:
   - Fixed to parse `rawJson?.result` and set a 60-second TTL on key creation.
2. **Sequential Multi-Endpoint Probing in `POST /api/instagram/sync` (`app/api/instagram/sync/route.ts:246-510`)**:
   - Iterates over media items within a 60-second serverless function (`maxDuration = 60`), gated behind authentication (`FIX-07`).
3. **Unindexed In-Memory User Scan (`supabaseAdmin.auth.admin.listUsers()` — FIXED in `FIX-12`)**:
   - Replaced across all 9 auth/admin/workspace routes with `findUserByEmail()` (`lib/auth/findUserByEmail.ts`) + `find_auth_user_id_by_email` SQL RPC (`supabase/migrations/20261110000003_auth_user_lookup.sql`).

