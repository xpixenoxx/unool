# Unool Signal — Competitive Research & Market Study

**Version:** 1.0  
**Scope:** Real-world social analytics, creator intelligence, and cross-channel reporting competitors vs. Unool Signal  
**Primary Sources:** Official vendor product documentation, API changelog notices (Meta Graph API v22.0, LinkedIn Community Management API, X API v2), and live product positioning verified during Phase 2 research.

---

## 1. Competitors Studied

### Primary Cross-Platform & Enterprise Competitors (10)
1. **Metricool** — SMB, Creator, & Agency All-in-One Analytics, Planner, Best-Time Heatmap, Competitor Tracking, SmartLinks, PDF/PPT/Looker Studio Reports.
2. **Sprout Social** — Enterprise Analytics, Post Performance Reports, ViralPost® Optimal Send Times, Tag Reports, Competitor Performance, Report Demo Mode ("Sprout Coffee").
3. **Hootsuite** — Mid-Market/Enterprise Organic & Paid Reporting, Best Time to Publish by Goal, Hootsuite Impact / GA & Adobe ROI Integrations, Benchmarking.
4. **Socialinsider** — AI Content Pillars, Auto-Tagging, Cross-Channel Brands Rollups, Competitor Benchmarking & Format Analysis.
5. **Rival IQ** — Always-On Industry Benchmarks, Boosted Post ML Detection, Auto-Tagging Rules, Spike Alerts, Competitive Leaderboards.
6. **Iconosquare** — Analytics-First IG & LinkedIn Suite, Drag-and-Drop Custom Dashboards, Community/Hashtag Analytics, White-Label PDF/CSV Reports.
7. **Buffer (Analyze / Insights)** — Lean Creator & SMB Insights, Simplified Answers ("Best Time", "Best Post Type", "Best Frequency"), Per-Channel Pricing.
8. **Agorapulse** — Power Reports, Built-in UTM Builder + GA4 Revenue/Conversion Attribution, Team Inbox SLA & Response Time Analytics.
9. **Brandwatch** — Enterprise Consumer Intelligence, Measure, Benchmark global cohorts, Iris AI Content Insights, 100M+ source Boolean Social Listening.
10. **Emplifi** — Unified Suite bridging Social Analytics, Social Care Ticketing, UGC/Social Commerce, Fuel AI Natural-Language Querying & Anomaly Detection.

### Creator-First Specialists Benchmark (4)
11. **Shield App** — Deep historical LinkedIn personal-profile analytics, frequency maps, tag clouds, ghostwriter multi-profile support (lacks native creation).
12. **Taplio** — LinkedIn AI writing, viral library, scheduling, and outreach CRM.
13. **AuthoredUp** — Writer-first LinkedIn rich editor, mobile/desktop fold preview, post-level analytics (explicitly non-AI).
14. **Typefully** — Distraction-free X / LinkedIn / Threads / Bluesky thread composer with clean per-post analytics and auto-plug/auto-DM growth loops.

---

## 2. Comparison Matrix Across 23 Product Dimensions

| Dimension | Metricool | Sprout Social | Hootsuite | Socialinsider / Rival IQ | Buffer / Typefully | **Unoool Signal (Target State)** |
|---|---|---|---|---|---|---|
| **1. Core Positioning** | Affordable breadth + reports + links + ads | Enterprise listening, care & presentation | Command center + ROI impact + streams | Competitive benchmarking & content pillars | Simple creator publishing + "Answers" | **Closed-loop Content & Attribution Intelligence** (Hook/Format -> Multi-Channel Post -> Bio-Link -> SignalDM Lead) |
| **2. Onboarding UX** | Guided connect + planner checklist | **Report Demo Mode** with sample data during 24h backfill | Goal selector + industry vertical onboarding | Competitor list setup + backfill status | Minimal empty state + queue slots | Honest progressive states: no-accounts CTA, connected-but-unsynced prompt, sample preview opt-in clearly labeled never mixed with real metrics |
| **3. Connected Account Handling** | Per-brand workspaces; per-brand timezone override | Per-profile + profile groups | Profile picker + organization teams | "Brands" grouping across networks | Per-channel queues & pricing | Multi-account workspace isolation via `platform_connections` (v2 multi-account support) + per-account variant attribution |
| **4. Date Range & Retention** | 30d free; full history on paid (X 30d starter cap) | Rolling by network API limits (LinkedIn 12m); Lifetime vs Reporting Period | 13m–24m depending on network API | Historical backfill from connection | 30d free; longer on Essentials/Team | Respects workspace plan `analytics_retention_days` (Spark 30d, Creator 90d, Pro 365d, Studio unlimited) transparently in UI & API |
| **5. Timezone Controls** | Account default + per-brand override | Org/profile timezone setting (buckets align to 24h TZ) | Account TZ | Workspace TZ | Channel TZ | Explicit user/workspace IANA timezone selector in Timing & Overview (`published_at \|\| created_at`, never raw server UTC) |
| **6. KPI Selection** | Followers, reach, impressions/views, clicks, interactions, engagement rate | Impressions, reach, clicks, reactions, comments, shares, EMV, video views | Reach, eng rate, clicks, conversions, ROI | Eng rate per follower/impression, views, pillar mix | Reach, impressions, eng rate, follower delta | Views/Impressions (on view-capable channels), Total Engagements, Eng Rate (strictly view-capable numerator/denominator), Momentum, Profile Clicks, SignalDM Leads |
| **7. Cross-Platform Normalization** | Network tabs + summary overview; respects missing metrics | Cross-Network Report + Network-specific detail | Cross-channel overview tiles | Normalized Brands rollup with explicit formulas | Per-channel primary, aggregate summary | Unified `UniversalEngagement` schema (`normalize.ts`) + raw metric passthrough (`_raw`) + strict capability flags separating `0` vs `N/A` |
| **8. Engagement Formulas** | Interactions / Reach or Interactions / Followers (documented) | Multiple ER definitions selectable | Configurable ER | ER by Impressions vs ER by Followers | Standard Interactions / Impressions | Explicitly documented in `SIGNAL_METRIC_DICTIONARY.md`; Eng Rate computed **only** where denominator (`views > 0`) exists |
| **9. Content Performance** | Post table sortable by impressions/likes/comments/shares/clicks & format | Post Performance List + Post-Focused thumbnail view | Top posts + best performing content types | AI Content Pillars + Boosted detection + format split | Post ranking + Post Type Answers | Unified **Content & Hooks**: Sortable Table + Card Feed + Effort/Word-Count Scatter + **26-Formula Hook Attribution** + Media Lift |
| **10. Audience & Follower Metrics** | Growth curves, demographics (country/city/age/gender where API permits) | Net gain, demographics, active follower hours | Growth + industry comparison | Follower velocity + demographic snapshots | Follower growth + basic insights | **Honest constraint:** Current Unool OAuth scopes fetch post-level stats & profile bio-link traffic, NOT follower demographic endpoints — Signal documents this gap rather than faking demographics |
| **11. Timing Optimization** | Signature Day × Hour heatmap with percentage view | **ViralPost®** proprietary optimal send times inside Compose | Goal-based Best Time to Publish -> click to schedule | Optimal time charts per competitor/brand | Best Time schedule recommendations | Day-of-Week × Hour heatmap & Top Windows computed in user's selected TZ from `published_at` -> one-click **"Schedule in Flight Plan"** |
| **12. Tagging / Campaigns / Pillars** | Hashtag tracking + planner notes | **Tag Report** (Sent vs Received + co-occurring tags) | Campaign tags + UTM tracking | AI Content Pillars + Query Builder | Post tags / Campaigns (Typefully/Buffer tags) | Native taxonomy: **Hook Style / HookScorer Formula**, **Format** (`short/medium/long-form, media/text`), **Flight Plan Content Arc (`arc_id`)**, plus optional campaign tags |
| **13. AI & Diagnostic Insights** | **Metricool Studio** prompt-to-report + AI insights | AI assist summaries + anomaly detection | OwlyWriter AI + summary tiles | AI Key Insights summaries | Plain-language "Answers" | Deterministic, evidence-cited rules (`Rule-based from your last Nd`) with sample size (`n`) & confidence badges — never mislabeled as LLM magic unless an AI call actually ran |
| **14. Publishing Integration** | Bidirectional Heatmap -> Planner | ViralPost directly inside Compose | Click Best Time tile -> Compose | Strategy -> Separate scheduler | Compose/Queue <-> Insights tight loop | **Closed Loop:** Signal -> Studio (`?hook=...&platform=...&repurposePostId=...`), Signal -> Flight Plan (`?slotDay=...&slotHour=...`), Composer `SignalStrip` live monitor |
| **15. Link / Funnel / ROI Analytics** | **SmartLinks** visits, button CTR, evolution + GA4 | Google Analytics / Bitly UTM conversion | Impact ROI + GA/Adobe Web Analytics | Link clicks where API exposes | Buffer Start Page clicks | Native first-party **Presence (`/u/[subdomain]`) Bio-Link Telemetry** (`profile_view`, `link_click`, `profile_cta_click`, CTR, top referrers) + **SignalDM Leads/Follow-Gate** funnel |
| **16. Benchmarking & Competitors** | Track 5–100 public competitors (no admin token needed for public IG/FB/X/YT/Threads/Bluesky) | Competitor Reports + Share of Voice | Up to 20 competitors + Industry Sector Benchmarks | Core specialty: Always-on sector leaderboards | None / Minimal | **Current:** Self-benchmarking (period-over-period, format baseline, hook baseline) due to API scope limits. **Roadmap:** Optional public-API competitor watchlists (Bluesky/YouTube/Reddit/Dev.to first) |
| **17. Exports & Custom Reports** | Branded white-label PDF/PPT + scheduled emails + **Looker Studio** + API | Presentation PDF, CSV, scheduled delivery | PDF, PPT, XLSX, CSV + white-label | PDF, PPT, CSV + scheduled reports | CSV + custom report PNG/PDF | Plan-aware **CSV Export** (`/api/signal/export`, aligned with `csv_export` plan flag) + **Print / Save-as-PDF Executive Report View** (`@media print`) |
| **18. Sync & Freshness Transparency** | Clear connection status + auto-sync windows (30d starter for X) | Explains 24h backfill & Lifetime vs Reporting Period caveats | Sync timestamps on widgets | Sync progress + historical depth badge | Channel connection health badges | Global Freshness & Sync Health Indicator (`lastSyncedAt`, per-post sync status, throttled/expired token warnings, non-destructive metric retention) |
| **19. Empty, Partial & Error States** | Connect CTA + explicit X add-on prompt | Demo Mode + explicit error banners | Reconnect token banners | Missing permission notices | Minimalist "Syncing data" state | Explicit distinction across: Zero Posts, Zero Connected Accounts, Syncing/New Post (`Golden Hour`), API Partial Support (`N/A`), Expired Token (reconnect CTA), Request Failure (retry button, **never silent `0`**) |
| **20. Accessibility & Responsive UI** | Dense tables/heatmaps; desktop-centric | Strong high-contrast PDF & mobile app | Complex multi-pane streams | Charts heavy on desktop hover | Clean responsive cards & mobile UI | Zero hover-only critical data; accessible SVG/DOM charts with keyboard focus, ARIA labels, screen-reader data summaries/tables, mobile card layouts |
| **21. Pricing Model** | Free (1 brand, no LI/X); Starter ~$20–25/mo for 5 brands; X add-on | ~$79–399/seat/mo (no free tier) | ~$99+/seat/mo | Mid/agency tiers | Free (3 channels); ~$5–6/channel/mo | Matches Unool plans (`lib/billing/plans.ts`): **Spark Free** (30d retention), **Creator $9/INR 799** (90d), **Pro $24/INR 1,999** (365d + CSV export + FlightPlan AI), **Studio $59/INR 4,999** (unlimited retention + CSV + white-label) |
| **22. API & Platform Constraints** | Subject to Meta Graph v22 (`views`), LI Personal post restriction, X pricing | Subject to LI 12m rolling window & org admin role | Subject to native API scopes | Public-data scraping/API policies | Subject to native post-publish APIs | **Honest Native Reality:** Documents exact limits in `SIGNAL_PLATFORM_CAPABILITY_MATRIX.md` across all 27 adapters |
| **23. Known Customer Complaints** | Publishing queue hiccups; extra charge for X; Starter X 30d limit | Prohibitive per-seat price; Lifetime vs Period confusion | Bloated UI & steep cost | No built-in creation/DM engine | Shallow diagnostics ("why did it work?" missing) | **Unoool Advantage to Capture:** Affordable unified creator OS where **creation craft (Hooks/Folds/Humanizer) + scheduling + bio-links + DM automation** feed directly into one honest, bug-free Signal loop |

---

## 3. Verified External Platform API Realities (2025–2026)

Competitive analysis confirms that **no SaaS can invent metrics an underlying platform API restricts**:
1. **Instagram (Meta Graph API v22.0, April 2025 cutoff):** Legacy `impressions`, `plays`, and `video_views` were deprecated in favor of unified **`views`** alongside `reach`, `like_count`, `comments_count`, `saves`, and `shares`. Personal Instagram profiles have zero Insights API access — only Business/Creator accounts qualify.
2. **LinkedIn (`w_member_social` vs Community Management API):** Posting via `w_member_social` gives `socialActions` (`likes`, `comments`, `shares`) but **does NOT expose views/impressions** for personal profiles unless approved for `r_member_postAnalytics` (`memberCreatorPostAnalytics`), and Organization `organizationalEntityShareStatistics` requires `rw_organization_admin` and is capped at a **rolling 12-month window**.
3. **X (Twitter):** Strict API rate limits and tier pricing make X metrics expensive across the market (leading Metricool to charge an X add-on and cap starter retention to 30 days). Unool's `XAdapter` fetches `public_metrics` (`impression_count`, `like_count`, `retweet_count`, `reply_count`, `quote_count`) when credentials/tier permit, gracefully retaining prior metrics on rate limits (`429`).
4. **Community, Newsletter & Webhook Channels (`Discord`, `Telegram`, `Slack`, `Webhook`, `Manual`, `Nostr`, `Kick`, `Skool`, `Whop`, `Warpcast`, `Medium`):** Upstream APIs either lack readback post analytics or are publish-only pipes. Showing `0` engagement beside a Discord or Telegram broadcast misleads users — Signal must label these channels **Publish-Only / Limited Telemetry**.

---

## 4. What Unool Signal Should Adopt vs. Avoid

- **Must Adopt Immediately:**
  1. **Single-source Metric Dictionary** with explicit denominators and `N/A` vs `0` semantics (learned from Sprout/Socialinsider discipline).
  2. **Buffer-style Clarity + Metricool Heatmap Utility:** Turn Timing into a direct action inside Flight Plan, and Content into clear answers backed by real `n` sample counts.
  3. **User Timezone Control & Period-over-Period Comparison** (Metricool / Agorapulse best practice).
  4. **Linked Attribution:** Unify post performance with Presence bio-link clicks and SignalDM comment-to-DM leads (Unoool's answer to SmartLinks + Agorapulse inbox ROI).
  5. **Transparent Sync & API Capability Disclosures** (no silent failures, no fake demo numbers mixed with real data).
- **Must Avoid:**
  1. Do **not** build bloated enterprise multi-widget BI builders before core metrics, hook attribution, timezone math, and multi-account attribution are rock solid.
  2. Do **not** advertise Competitor Tracking or Ad Spend ROAS unless public competitor polling / ad OAuth APIs actually exist.
  3. Do **not** lock solo creators out with per-seat enterprise complexity — stay anchored to Unool's Creator / Pro / Studio tiers.
