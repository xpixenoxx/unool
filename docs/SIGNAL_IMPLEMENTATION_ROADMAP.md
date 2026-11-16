# Unool Signal — Phased Implementation Roadmap

**Version:** 1.0  

---

## Execution Order Overview

| Phase | Scope | Key Deliverables | Exit Gate |
|---|---|---|---|
| **Phase 1** | Current-State Verification | Code, DB schema, 27 adapters, auth/billing/isolation verification | Complete bug/drift register verified |
| **Phase 2** | Competitive Study & PMF | 10+ competitors across 23 dimensions, real API constraints, PMF wedge | `SIGNAL_COMPETITIVE_RESEARCH.md` & `SIGNAL_PRODUCT_STRATEGY.md` |
| **Phase 3** | Product & Data Architecture | 4-view IA, Metric Dictionary, Schema Design, Integration Map, Edge Matrix | Core design docs 1–10 authored |
| **Phase 4** | **Foundation & Data Integrity** | SQL migration (`20261116000003`), telemetry extractor (`postTelemetry.ts`), extended `normalize.ts`, `platformCapabilities.ts`, `signalEngine.ts`, hardened `syncEngagement.ts`, unified `/api/signal/analytics`, `/api/signal/posts`, `/api/signal/resonance`, `/api/signal/export`, writer integration (`adapt`/`save-draft`/`broadcast`/`flightplan`), `/api/profile/analytics` IDOR/mock fix | Unit/formula/normalization/API/security tests + `tsc --noEmit` |
| **Phase 5 & 6** | **Core UX & Advanced Interactive Analytics** | Redesigned `/dashboard/signal` with persistent global filter bar, `?view=overview\|content\|timing\|channels` URL sync, SVG accessible charts + data tables, Content & Hooks view, Timing Heatmap (`published_at` + user TZ), Per-Account Channel Leaderboard & Funnel, Post Detail Inspector Drawer, CSV & Print report support | Component tests + accessibility/keyboard/mobile responsiveness verified |
| **Phase 7** | **Cross-Module Integration** | Studio repurpose/hook param intake, Flight Plan slot param intake + `arc_id` fix, Overview Dashboard link/parity, `/analytics/linkedin` bidirectional link, `layout.tsx` nav copy, `/u/[subdomain]?activity=<postId>` Share Story fix, `/onboarding/connect` account CTA fix | Integration tests & verified handoffs |
| **Phase 8 & 9** | **Verification, Docs Sync & Release Review** | Run full `tsc`, `eslint`, `vitest`, Next build check (where runtime env permits); finalize `SIGNAL_TEST_AND_ACCEPTANCE_REPORT.md` & `SIGNAL_FINAL_VERIFICATION_REPORT.md`; update `FEATURE_INVENTORY.md` | Product Owner GO / CONDITIONAL GO / NO-GO Sign-Off |

---

## Non-Negotiable Architecture Dependencies
1. `lib/analytics/platformCapabilities.ts` MUST ship before `signalEngine.ts` and `syncEngagement.ts` so every calculation knows which platforms expose views vs interactions vs publish-only.
2. `lib/analytics/postTelemetry.ts` + DB migration MUST land cleanly alongside read fallbacks so historical posts work immediately even before every workspace row is re-saved.
3. Single canonical `signalEngine.ts` MUST power `/api/signal/analytics`, `/api/signal/resonance`, `/api/signal/export`, and Signal UI components — zero duplicated client math (eliminating `AnalyticsDNA` vs `resonance` divergence forever).
