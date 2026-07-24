# unool Design System — Complete Specification
**Version:** 1.0 | **Status:** Source of Truth | **Last Updated:** 2026-07-23

---

## 1. MEMORABLE THING (North Star)

> **"Your public profile IS your publishing engine."**
>
> Type your name → instant live profile at `u/name.unool.co`. Write once → watch it become LinkedIn + X + Threads posts in real time. One link lives everywhere.

**Stakes:** If the profile page looks like a generic Linktree, users won't understand the publishing power. If the composer looks like a dashboard, they won't feel the "write once" magic. Every pixel must reinforce: *this page publishes.*

---

## 2. TEMPLATE SYSTEM — 25+ PROFILE TEMPLATES

Organized on a **Minimal → Maximal** spectrum. User selects template on subdomain claim; preview updates live in 300ms.

### 2.1 Template Categories (5 x 5 = 25 base templates)

| Category | Vibe | Target User | Key Visual |
|----------|------|-------------|------------|
| **Essential** | Clean, whitespace-driven, content-first | Students, job seekers, minimalists | Single column, generous leading |
| **Professional** | Structured, trust signals, clear hierarchy | Founders, consultants, executives | Card-based, metrics visible |
| **Creative** | Asymmetric, expressive, personality-led | Designers, artists, writers | Overlapping layers, bold color |
| **Technical** | Monospace, terminal aesthetic, data-dense | Developers, engineers, data folk | Code blocks, green-on-dark, syntax |
| **Social** | Feed-like, visual, link-heavy | Creators, influencers, community builders | Avatar strips, engagement rings |

Each category has **5 intensity levels**: `minimal` → `light` → `standard` → `bold` → `max`

### 2.2 Template Definitions (25 Total)

#### ESSENTIAL LINE (Whitespace → Content)

| Template | Preset | Layout | Accent | Radius | Shadow | Font Pair | Best For |
|----------|--------|--------|--------|--------|--------|-----------|----------|
| `essential-minimal` | Minimal | Single column, centered, 640px max | Cyan | 6px | None | Geist / Geist | Students, resumés |
| `essential-light` | Minimal | + subtle divider lines | Cyan | 6px | xs | Geist / Geist | Clean portfolios |
| `essential-standard` | Minimal | + avatar ring, bio card | Cyan | 8px | sm | Geist / Geist | General use |
| `essential-bold` | Bold | + thick accent bar top | Purple | 12px | md | Geist / Geist Mono | Personal brands |
| `essential-max` | Bold | Full-bleed background glow | Purple | 16px | lg | Geist / Geist Mono | High-impact landing |

#### PROFESSIONAL LINE (Structure → Authority)

| Template | Preset | Layout | Accent | Radius | Shadow | Font Pair | Best For |
|----------|--------|--------|--------|--------|--------|-----------|----------|
| `professional-minimal` | Corporate | Two-column: info \| links | Blue | 8px | sm | Geist / Geist | Consultants |
| `professional-light` | Corporate | + company badge row | Blue | 8px | sm | Geist / Geist | Agencies |
| `professional-standard` | Corporate | + metrics strip (3 KPIs) | Cyan | 10px | md | Geist / Geist | Founders |
| `professional-bold` | Corporate | + testimonial carousel | Purple | 12px | lg | Geist / Geist Mono | Speakers |
| `professional-max` | Bold | Full dashboard layout | Purple | 16px | xl | Geist / Geist Mono | Enterprise |

#### CREATIVE LINE (Expression → Personality)

| Template | Preset | Layout | Accent | Radius | Shadow | Font Pair | Best For |
|----------|--------|--------|--------|--------|--------|-----------|----------|
| `creative-minimal` | Creative | Asymmetric grid, generous gaps | Pink | 16px | sm | Geist / Geist | Writers |
| `creative-light` | Creative | + floating blobs bg | Pink | 16px | md | Geist / Geist | Illustrators |
| `creative-standard` | Creative | + animated gradient text | Purple | 20px | md | Geist Display / Geist | Designers |
| `creative-bold` | Creative | + 3D tilt cards on hover | Purple | 24px | lg | Geist Display / Geist | Agencies |
| `creative-max` | Creative | Full immersive: parallax, video | Multi | 32px | xl | Custom / Geist | Portfolios |

#### TECHNICAL LINE (Code → Data)

| Template | Preset | Layout | Accent | Radius | Shadow | Font Pair | Best For |
|----------|--------|--------|--------|--------|--------|-----------|----------|
| `technical-minimal` | Technical | Terminal header, monospace | Green | 4px | None | Geist Mono / Geist Mono | Devs |
| `technical-light` | Technical | + syntax-highlighted bio | Green | 4px | xs | Geist Mono / Geist Mono | Engineers |
| `technical-standard` | Technical | + GitHub stats cards | Cyan | 6px | sm | Geist Mono / Geist Mono | OSS maintainers |
| `technical-bold` | Technical | + live commit ticker | Purple | 8px | md | Geist Mono / Geist Mono | Tech leads |
| `technical-max` | Technical | Full IDE layout: file tree, editor, terminal | Multi | 4px | lg | Geist Mono / Geist Mono | Developer advocates |

#### SOCIAL LINE (Feed → Engagement)

| Template | Preset | Layout | Accent | Radius | Shadow | Font Pair | Best For |
|----------|--------|--------|--------|--------|--------|-----------|----------|
| `social-minimal` | Minimal | Link pills, centered | Cyan | Full | sm | Geist / Geist | Link-in-bio only |
| `social-light` | Minimal | + avatar stack followers | Cyan | Full | sm | Geist / Geist | Micro-influencers |
| `social-standard` | Creative | Feed cards with thumbnails | Purple | 16px | md | Geist / Geist | Content creators |
| `social-bold` | Bold | + engagement rings (animated) | Purple | 20px | lg | Geist Display / Geist | Creators |
| `social-max` | Creative | Full mini-feed: posts, replies, media | Multi | 24px | xl | Geist Display / Geist | Power users |

### 2.3 Template Selection UX

```
User claims subdomain → Modal opens with 5 category tabs
→ Each tab shows 5 intensity cards (live preview via iframe)
→ Click = instant apply (no save needed)
→ URL updates: ?template=creative-bold
→ Persist to profile.theme.template
```

**Preview rendering:** Each template is a React component `<ProfileTemplate name="creative-bold" />` rendered in a sandboxed iframe with `postMessage` for live updates.

---

## 3. COLOR SYSTEM — OKLCH + PURPLE/CYAN DUALITY

Extends existing `lib/design/tokens.ts` and `app/globals.css`.

### 3.1 Brand Palette

```css
/* Primary: Electric Cyan (action, publish, links) */
--primary: 195 100% 60%;
--primary-foreground: 0 0% 98.5%;

/* Secondary: Electric Purple (premium, 3D, AI, magic moments) */
--purple: 295 70% 62%;
--purple-foreground: 0 0% 98.5%;
--purple-50: 295 80% 96%;
--purple-100: 295 80% 92%;
--purple-500: 295 70% 62%;
--purple-600: 295 70% 54%;
--purple-glow: 0 0 20px oklch(0.62 0.22 295 / 0.4);
--purple-glow-lg: 0 0 40px oklch(0.62 0.22 295 / 0.5);
```

### 3.2 Semantic Mappings (Light / Dark)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg-primary` | `oklch(0.985 0.002 247.8)` | `oklch(0.08 0.01 247.8)` | Page background |
| `--bg-card` | `oklch(1 0 0)` | `oklch(0.12 0.02 247.8)` | Card surfaces |
| `--fg-primary` | `oklch(0.12 0.02 247.8)` | `oklch(0.985 0.002 247.8)` | Headings |
| `--fg-muted` | `oklch(0.42 0.02 247.8)` | `oklch(0.65 0.02 247.8)` | Body text |
| `--accent-primary` | `oklch(0.60 0.20 195)` | `oklch(0.65 0.18 195)` | CTAs, primary actions |
| `--accent-purple` | `oklch(0.62 0.22 295)` | `oklch(0.70 0.20 295)` | AI features, 3D, premium |
| `--border-subtle` | `oklch(0.88 0.01 247.8)` | `oklch(0.22 0.02 247.8)` | Dividers |
| `--ring-primary` | `oklch(0.60 0.20 195)` | `oklch(0.65 0.18 195)` | Focus rings |
| `--ring-purple` | `oklch(0.62 0.22 295)` | `oklch(0.70 0.20 295)` | AI focus rings |

### 3.3 Template-Specific Accent Overrides

Each template can override `--accent-primary` via CSS variable on the profile container:

```css
.template-essential-minimal  { --accent: var(--primary); }
.template-professional-bold  { --accent: var(--purple); }
.template-creative-max       { --accent: linear-gradient(135deg, var(--purple), #ec4899); }
.template-technical-standard { --accent: oklch(0.65 0.18 150); }
.template-social-bold        { --accent: linear-gradient(135deg, var(--primary), var(--purple)); }
```

---

## 4. TYPOGRAPHY — FLUID SCALE + DISPLAY FONTS

### 4.1 Font Stack (Variable Fonts)

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **Display** | Geist Variable | 400-700 | Headlines, hero text |
| **UI** | Geist Variable | 400-600 | Body, buttons, labels |
| **Mono** | Geist Mono Variable | 400-600 | Code, technical templates, IDs |
| **Expressive** | **Syne Variable** (new) | 400-800 | Creative templates, large headlines |

**Syne** adds distinctive wide glyphs for creative/maximal templates — not generic Inter/Roboto.

### 4.2 Fluid Type Scale (clamp)

```css
--text-xs:    clamp(0.70rem, 0.68rem + 0.10vw, 0.75rem);
--text-sm:    clamp(0.81rem, 0.78rem + 0.15vw, 0.875rem);
--text-base:  clamp(0.94rem, 0.90rem + 0.20vw, 1rem);
--text-lg:    clamp(1.06rem, 1.00rem + 0.30vw, 1.125rem);
--text-xl:    clamp(1.25rem, 1.15rem + 0.50vw, 1.375rem);
--text-2xl:   clamp(1.50rem, 1.35rem + 0.75vw, 1.75rem);
--text-3xl:   clamp(1.88rem, 1.65rem + 1.15vw, 2.25rem);
--text-4xl:   clamp(2.25rem, 1.90rem + 1.75vw, 3rem);
--text-5xl:   clamp(3rem,   2.50rem + 2.50vw, 4rem);
--text-6xl:   clamp(4rem,   3.00rem + 4.00vw, 6rem);  /* Hero only */
```

### 4.3 Template Font Assignments

| Template Category | Display Font | UI Font | Mono Font |
|-------------------|--------------|---------|-----------|
| Essential | Geist | Geist | Geist Mono |
| Professional | Geist | Geist | Geist Mono |
| **Creative** | **Syne** | Geist | Geist Mono |
| Technical | Geist Mono | Geist Mono | Geist Mono |
| Social | Geist | Geist | Geist Mono |

---

## 5. MOTION LANGUAGE — FRAMER MOTION SPRINGS

Extends `lib/design/tokens.ts` motion tokens.

### 5.1 Spring Presets

| Preset | Config | Use Case |
|--------|--------|----------|
| `snappy` | `{stiffness: 500, damping: 30, mass: 0.8}` | Buttons, toggles, chips |
| `standard` | `{stiffness: 400, damping: 28, mass: 1}` | Cards, panels, modals |
| `gentle` | `{stiffness: 300, damping: 25, mass: 1.2}` | Page transitions, large elements |
| `bouncy` | `{stiffness: 450, damping: 20, mass: 1}` | Success, celebrations, AI reveals |
| `smooth` | `{stiffness: 350, damping: 30, mass: 1}` | Drag, hover, 3D tilt |
| `magnetic` | `{stiffness: 600, damping: 35, mass: 0.6}` | **NEW** - Template selector cards, magnetic hover |
| `orbital` | `{stiffness: 200, damping: 15, mass: 2}` | **NEW** - Floating 3D orbs, background elements |

### 5.2 Transition Tokens

```typescript
export const motion = {
  springs: { snappy, standard, gentle, bouncy, smooth, magnetic, orbital },
  durations: { instant: 0.05, fast: 0.12, normal: 0.18, slow: 0.25, slower: 0.35, page: 0.5 },
  easings: {
    easeOut: [0.25, 0.46, 0.45, 0.94],
    easeIn: [0.55, 0.06, 0.68, 0.19],
    easeInOut: [0.42, 0, 0.58, 1],
    brand: [0.34, 1.56, 0.64, 1],
    expo: [0.16, 1, 0.3, 1],          // For 3D transforms
    anticipation: [0.68, -0.55, 0.27, 1.55], // Overshoot
  },
  stagger: { fast: 0.03, normal: 0.06, slow: 0.1, cascade: 0.08 },
};
```

### 5.3 3D Interaction Primitives

```tsx
// Tilt on mouse move (for cards)
<TiltCard maxTilt={8} perspective={1000}>

// Magnetic pull (for template selector)
<Magnetic strength={0.3} radius={120}>

// Orbital float (background orbs)
<Orbital radius={40} speed={0.5}>

// Parallax layers (creative templates)
<Parallax layers={[{depth: 1, scale: 1}, {depth: 0.5, scale: 1.2}]}>

// Perspective flip (AI content reveal)
<PerspectiveFlip duration={0.6}>

// Morphing blob (loading, transitions)
<MorphingBlob colors={['var(--purple)', 'var(--primary)']} />
```

---

## 6. LAYOUT SYSTEM — GRID + CONTAINER

### 6.1 Profile Page Container

```css
.profile-container {
  --max-width: 720px;      /* Mobile-first */
  --max-width-lg: 960px;   /* Tablet+ */
  --max-width-xl: 1200px;  /* Desktop creative */
}

.template-creative-max,
.template-social-max {
  --max-width: 100%;
  --max-width-lg: 100%;
  --max-width-xl: 1400px;  /* Full-bleed immersive */
}
```

### 6.2 Template Grid Systems

| Template | Grid | Gap | Columns |
|----------|------|-----|---------|
| Essential | Single column | 1.5rem | 1 |
| Professional | 2-col (300px sidebar) | 2rem | 2 |
| Creative | Asymmetric (CSS Grid) | 1.5-3rem | 4-6 implicit |
| Technical | Terminal: 80ch main + 20ch side | 1rem | 2 |
| Social | Feed: auto-fit minmax(280px) | 1rem | Responsive |

---

## 7. COMPONENT LIBRARY — EXTENSIONS

Your existing 14 components (`components/ui/*`) are the foundation. **Add these 8 new components:**

### 7.1 New Components (Create)

| Component | Path | Purpose |
|-----------|------|---------|
| `TemplateSelector` | `components/profile/TemplateSelector.tsx` | 25-template picker with live preview |
| `ProfilePreview` | `components/profile/ProfilePreview.tsx` | Iframe sandbox for instant preview |
| `TiltCard` | `components/ui/3d/TiltCard.tsx` | 3D hover tilt (framer-motion) |
| `MagneticCard` | `components/ui/3d/MagneticCard.tsx` | Mouse-follow attraction |
| `OrbitalBackground` | `components/ui/3d/OrbitalBackground.tsx` | Floating 3D orbs/shapes |
| `MorphingBlob` | `components/ui/3d/MorphingBlob.tsx` | Organic shape animations |
| `PerspectiveFlip` | `components/ui/3d/PerspectiveFlip.tsx` | 3D card flip for AI reveals |
| `ParallaxLayers` | `components/ui/3d/ParallaxLayers.tsx` | Multi-layer scroll parallax |

### 7.2 Enhanced Existing Components

| Component | Enhancement |
|-----------|-------------|
| `Card` | Add `variant="tilt"`, `variant="magnetic"`, `variant="orbital"` |
| `Button` | Add `variant="ai"` (purple gradient), `variant="publish"` (cyan→purple flow) |
| `Input` | Add `ai-assist` prop (sparkle icon, cmd+enter handler) |
| `Badge` | Add `variant="template"` (shows template category color) |
| `Avatar` | Add `variant="ring-pulse"` (animated engagement ring) |

---

## 8. 25 TEMPLATE IMPLEMENTATIONS — COMPONENT MAP

### 8.1 File Structure

```
components/profile/templates/
├── index.ts                          # Export all, template registry
├── essential/
│   ├── EssentialMinimal.tsx
│   ├── EssentialLight.tsx
│   ├── EssentialStandard.tsx
│   ├── EssentialBold.tsx
│   └── EssentialMax.tsx
├── professional/
│   ├── ProfessionalMinimal.tsx
│   ├── ProfessionalLight.tsx
│   ├── ProfessionalStandard.tsx
│   ├── ProfessionalBold.tsx
│   └── ProfessionalMax.tsx
├── creative/
│   ├── CreativeMinimal.tsx
│   ├── CreativeLight.tsx
│   ├── CreativeStandard.tsx
│   ├── CreativeBold.tsx
│   └── CreativeMax.tsx
├── technical/
│   ├── TechnicalMinimal.tsx
│   ├── TechnicalLight.tsx
│   ├── TechnicalStandard.tsx
│   ├── TechnicalBold.tsx
│   └── TechnicalMax.tsx
└── social/
    ├── SocialMinimal.tsx
    ├── SocialLight.tsx
    ├── SocialStandard.tsx
    ├── SocialBold.tsx
    └── SocialMax.tsx
```

### 8.2 Template Base Interface

```typescript
// components/profile/templates/types.ts
export interface TemplateProps {
  profile: PublicProfile;
  accentColor: string;
  isPreview?: boolean;
  onLinkClick?: (link: ProfileLink) => void;
}

export interface TemplateMeta {
  id: string;
  name: string;
  category: 'essential' | 'professional' | 'creative' | 'technical' | 'social';
  intensity: 'minimal' | 'light' | 'standard' | 'bold' | 'max';
  preset: ProfilePreset;        // Links to existing profileThemes
  description: string;
  tags: string[];
  thumbnail: string;            // Data URI or import
  features: TemplateFeatures;
}

export interface TemplateFeatures {
  has3DBackground: boolean;
  hasParallax: boolean;
  hasTiltCards: boolean;
  hasMagneticHover: boolean;
  hasAnimatedOrbs: boolean;
  hasGradientText: boolean;
  supportsVideoBackground: boolean;
  maxLinks: number;
  maxProofPoints: number;
}
```

### 8.3 Template Registry (for Selector)

```typescript
// components/profile/templates/registry.ts
export const TEMPLATE_REGISTRY: TemplateMeta[] = [
  // ESSENTIAL
  { id: 'essential-minimal', name: 'Clean Slate', category: 'essential', intensity: 'minimal', preset: 'minimal', ... },
  { id: 'essential-light', name: 'Breathing Room', category: 'essential', intensity: 'light', preset: 'minimal', ... },
  { id: 'essential-standard', name: 'Balanced', category: 'essential', intensity: 'standard', preset: 'minimal', ... },
  { id: 'essential-bold', name: 'Statement', category: 'essential', intensity: 'bold', preset: 'bold', ... },
  { id: 'essential-max', name: 'Bold Canvas', category: 'essential', intensity: 'max', preset: 'bold', ... },

  // PROFESSIONAL
  { id: 'professional-minimal', name: 'Executive', category: 'professional', intensity: 'minimal', preset: 'corporate', ... },
  { id: 'professional-light', name: 'Structured', category: 'professional', intensity: 'light', preset: 'corporate', ... },
  { id: 'professional-standard', name: 'Founder', category: 'professional', intensity: 'standard', preset: 'corporate', ... },
  { id: 'professional-bold', name: 'Authority', category: 'professional', intensity: 'bold', preset: 'corporate', ... },
  { id: 'professional-max', name: 'Command', category: 'professional', intensity: 'max', preset: 'corporate', ... },

  // CREATIVE
  { id: 'creative-minimal', name: 'Whitespace', category: 'creative', intensity: 'minimal', preset: 'creative', ... },
  { id: 'creative-light', name: 'Flow', category: 'creative', intensity: 'light', preset: 'creative', ... },
  { id: 'creative-standard', name: 'Expressive', category: 'creative', intensity: 'standard', preset: 'creative', ... },
  { id: 'creative-bold', name: 'Dramatic', category: 'creative', intensity: 'bold', preset: 'creative', ... },
  { id: 'creative-max', name: 'Immersive', category: 'creative', intensity: 'max', preset: 'creative', ... },

  // TECHNICAL
  { id: 'technical-minimal', name: 'Terminal', category: 'technical', intensity: 'minimal', preset: 'technical', ... },
  { id: 'technical-light', name: 'REPL', category: 'technical', intensity: 'light', preset: 'technical', ... },
  { id: 'technical-standard', name: 'IDE', category: 'technical', intensity: 'standard', preset: 'technical', ... },
  { id: 'technical-bold', name: 'Dashboard', category: 'technical', intensity: 'bold', preset: 'technical', ... },
  { id: 'technical-max', name: 'Mission Control', category: 'technical', intensity: 'max', preset: 'technical', ... },

  // SOCIAL
  { id: 'social-minimal', name: 'Links Only', category: 'social', intensity: 'minimal', preset: 'minimal', ... },
  { id: 'social-light', name: 'Connect', category: 'social', intensity: 'light', preset: 'minimal', ... },
  { id: 'social-standard', name: 'Feed', category: 'social', intensity: 'standard', preset: 'creative', ... },
  { id: 'social-bold', name: 'Engage', category: 'social', intensity: 'bold', preset: 'creative', ... },
  { id: 'social-max', name: 'Universe', category: 'social', intensity: 'max', preset: 'creative', ... },
];
```

---

## 9. PAGES TO REDESIGN — COMPLETE INVENTORY

| Page | Route | Status | Template-Aware? |
|------|-------|--------|-----------------|
| **Public Profile** | `/u/[subdomain]` | **REWRITE** | Yes — 25 templates |
| **Template Selector** | `/u/[subdomain]?template=*` | **NEW** | Modal/inline picker |
| **Composer** | `/dashboard/composer` | **REWRITE** | No (but uses AI purple) |
| **Publish Review** | `/dashboard/publish` | **REWRITE** | No |
| **Presence (Settings)** | `/dashboard/presence` | **REWRITE** | Template preview panel |
| **Settings** | `/dashboard/settings` | **REWRITE** | No |
| **Dashboard Home** | `/dashboard` | **REWRITE** | Quick template switcher |
| **Landing** | `/` | **REWRITE** | Hero shows live templates |
| **Auth Callback** | `/auth/callback` | **NEW** | Branded loading |
| **Privacy** | `/privacy` | **MINIMAL** | Template-aware footer |
| **Terms** | `/terms` | **MINIMAL** | Template-aware footer |
| **Signup** | `/signup` | **REWRITE** | Template preview carousel |

---

## 10. IMPLEMENTATION SEQUENCE (Parallelizable)

### Phase A: Foundation (Days 1-2) ✅ **PARTIAL DONE**
- [x] Purple tokens added to `tokens.ts` + `globals.css`
- [x] Public profile rewritten with 3D orbs, tilt cards, magnetic links
- [ ] Install `syne` font via `next/font`
- [ ] Create 3D primitive components (`TiltCard`, `MagneticCard`, `OrbitalBackground`, `MorphingBlob`, `PerspectiveFlip`, `ParallaxLayers`)

### Phase B: Template System (Days 2-4)
- [ ] Build `TemplateSelector` with live iframe preview
- [ ] Implement 5 **Essential** templates (minimal → max)
- [ ] Implement 5 **Professional** templates
- [ ] Implement 5 **Creative** templates (Syne font)
- [ ] Implement 5 **Technical** templates (monospace, terminal UI)
- [ ] Implement 5 **Social** templates (feed layout)
- [ ] Wire template persistence to `profile.theme.template`

### Phase C: Composer + Publish (Days 3-5)
- [ ] Composer: Split view — Editor (left) + 3 Platform Previews (right)
- [ ] Real-time AI adaptation indicators (purple pulse on platform tabs)
- [ ] Publish: Kanban-style review → one-click multi-platform
- [ ] Loading states with `MorphingBlob` (purple/cyan)

### Phase D: Dashboard + Landing (Days 4-6)
- [ ] Dashboard: Stats cards with `MetricCard` (existing) + template quick-switch
- [ ] Presence: Template preview panel in Design tab
- [ ] Landing: Hero with interactive template carousel (3D cards)
- [ ] Settings: BYOK section with `Input` ai-assist variant

### Phase E: Polish (Days 5-7)
- [ ] Auth callback: Branded `OrbitalBackground` + `MorphingBlob`
- [ ] Legal pages: Minimal, template-aware footer
- [ ] Signup: Template carousel before onboarding
- [ ] Performance: Lazy-load heavy templates, prefetch on hover
- [ ] Accessibility: Reduced-motion disables 3D, high-contrast mode

---

## 11. ADMIN PANEL — STATUS

**Separate worktree/branch:** `admin-dashboard` (per earlier conversation)
- Schema: `lib/repositories/interfaces/IAdminRepository.ts` ✅
- API routes: `app/api/admin/*` (removed from main build) ✅
- UI: `app/admin/{users,workspaces,plans,analytics,audit}` (in worktree)
- **Action:** Merge to `main` behind feature flag `ENABLE_ADMIN=true` after Phase D

---

## 12. ACCEPTANCE CRITERIA — "NOT GENERIC"

| Check | Pass Condition |
|-------|----------------|
| **Template variety** | 25 distinct templates render without layout breaking |
| **3D feel** | Orbital background + tilt cards + magnetic hover all 60fps |
| **Purple moments** | AI actions (adapt, generate, publish) use purple glow/spring |
| **Font personality** | Creative templates use Syne; Technical use Mono; others Geist |
| **Instant preview** | Template switch < 300ms, no layout shift |
| **Mobile-first** | All templates usable at 375px width |
| **Dark mode** | Every template works in dark (CSS variables) |
| **Reduced motion** | `prefers-reduced-motion` disables orbital/tilt/magnetic |
| **Build passes** | `npm run build` — 0 errors, < 50 warnings |

---

## 13. NEXT IMMEDIATE ACTIONS

1. **Install Syne font** → `app/layout.tsx` add `next/font/google`
2. **Create 3D primitives** → `components/ui/3d/`
3. **Build TemplateSelector** → `components/profile/TemplateSelector.tsx`
4. **Implement first 5 templates** (Essential line) → verify on `/u/test`

---

*This DESIGN.md is the single source of truth. All implementation decisions reference this document. Update here first, then code.*