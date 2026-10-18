# The Club Template — Avant-Garde Luxury Fashion House / VIP Club Design Specification

**Version:** 2.0 | **Status:** Source of Truth for ClubTemplate Overhaul | **Last Updated:** 2026-10-18

---

## 1. NORTH STAR — MEMORABLE THING

> **"The Club is where culture gets shaped. Not a profile — a venue."**

A profile that feels like stepping into an exclusive fashion house atelier crossed with a members-only VIP club. Every interaction whispers exclusivity. The 3D centerpiece isn't decoration — it's the beating heart that reacts to presence. This is not a template. This is a venue.

**Stakes:** If it feels like a "profile page," we failed. If it feels like a digital flagship store for culture, we won.

---

## 2. PRODUCT CONTEXT

| Attribute | Value |
|-----------|-------|
| **Template ID** | `the-club` |
| **Category** | Agency (Premium) |
| **Intensity** | `max` |
| **Preset** | `creative` |
| **Performance Budget** | `heavy` (lazy-loaded 3D, WebGL optional) |
| **Persona** | Trend-focused agency for culture and creators. Cool, social, trendy. Fashion-magazine aesthetic with collage layouts. |
| **Tagline** | "We shape culture." |
| **Icon** | 🪩 |

### 2.1 Mandatory Sections (All 8 Must Exist, Elevated)

| # | Section | Key Requirement |
|---|---------|-----------------|
| 01 | **Hero / Masthead** | Full-bleed 3D WebGL centerpiece (hero), animated logotype, animated tagline, scroll indicator |
| 02 | **Manifesto / Bio** | Editorial serif typesetting, staggered reveal, "manifesto" tone not "bio" |
| 03 | **Proof Ledger** | KPI cards with magnetic hover, live counters, animated number transitions |
| 04 | **Curated Works** | Masonry/grid with 3D tilt on hover, project drawer (Framer Motion), keyboard accessible |
| 05 | **Brand Socials Matrix** | Horizontal scroll-snap rail, brand SVGs from centralized registry, platform icons |
| 06 | **OpenTo Badges** | Animated intent chips, pulse on hover, variant="club" |
| 07 | **Recent Activity Feed** | Timeline with variant="club", glassmorphism cards, live clock |
| 08 | **Contact / Booking Drawer** | Slide-over drawer, vCard export, Calendly embed ready, toast confirmations |

---

## 3. COLOR SYSTEM — AVANT-GARDE LUXURY PALETTE

### 3.1 Core Tokens (OKLCH)

```css
/* ========================================
   THE CLUB — AVANT-GARDE LUXURY PALETTE
   ======================================== */

/* --- VOID / NOIR (Base) --- */
--club-void:         240 15% 3%;       /* Obsidian Noir — true black with blue undertone */
--club-void-elevated: 240 10% 6%;      /* Elevated surfaces */
--club-void-card:    240 8% 9%;        /* Card backgrounds */
--club-void-glass:   240 10% 5% / 0.6; /* Glassmorphism base */

/* --- LIQUID CHROME (Primary Accent) --- */
--club-chrome:        200 100% 65%;    /* Liquid Chrome — mercurial cyan */
--club-chrome-dim:    200 80% 45%;     /* Dimmed state */
--club-chrome-bright: 200 100% 75%;    /* Hover/active */
--club-chrome-glow:   0 0 30px oklch(0.65 0.22 200 / 0.4);
--club-chrome-glow-lg: 0 0 60px oklch(0.65 0.22 200 / 0.5);

/* --- ACID LIME (Electric Accent) --- */
--club-lime:          100 100% 55%;    /* Acid Lime — electric, alive */
--club-lime-dim:      100 80% 40%;
--club-lime-bright:   100 100% 65%;
--club-lime-glow:     0 0 20px oklch(0.55 0.28 100 / 0.5);

/* --- ELECTRIC VIOLET (Premium Accent) --- */
--club-violet:        280 100% 65%;    /* Electric Violet — premium, AI, magic */
--club-violet-dim:    280 80% 45%;
--club-violet-bright: 280 100% 75%;
--club-violet-glow:   0 0 30px oklch(0.65 0.25 280 / 0.4);

/* --- CHAMPAGNE GOLD (Luxury Highlight) --- */
--club-gold:          45 85% 58%;      /* Champagne Gold — warmth, luxury */
--club-gold-dim:      45 70% 42%;
--club-gold-glow:     0 0 20px oklch(0.58 0.18 45 / 0.3);

/* --- SEMANTIC MAPPINGS --- */
--club-bg:           var(--club-void);
--club-bg-elevated:  var(--club-void-elevated);
--club-bg-card:      var(--club-void-card);
--club-bg-glass:     var(--club-void-glass);
--club-fg:           0 0% 98%;          /* Near-white */
--club-fg-muted:     240 5% 65%;
--club-fg-subtle:    240 5% 45%;
--club-border:       240 10% 15%;       /* Hairline borders */
--club-border-bright: 240 10% 25%;
--club-ring:         var(--club-chrome);
--club-ring-violet:  var(--club-violet);
--club-ring-lime:    var(--club-lime);
```

### 3.2 Gradient Tokens (For 3D Shaders & Text)

```css
/* --- LIQUID CHROME GRADIENTS --- */
--club-gradient-chrome: linear-gradient(135deg, 
  oklch(0.65 0.22 200) 0%, 
  oklch(0.55 0.28 100) 50%, 
  oklch(0.65 0.25 280) 100%);
--club-gradient-chrome-radial: radial-gradient(ellipse at center, 
  oklch(0.65 0.22 200 / 0.3) 0%, 
  transparent 70%);

/* --- NOIR GRADIENTS --- */
--club-gradient-void: linear-gradient(180deg, 
  oklch(0.03 0.02 240) 0%, 
  oklch(0.06 0.01 240) 100%);
--club-gradient-card: linear-gradient(145deg, 
  oklch(0.09 0.02 240) 0%, 
  oklch(0.06 0.01 240) 100%);

/* --- GLASSMORPHISM --- */
--club-glass: linear-gradient(135deg, 
  oklch(0.12 0.02 240 / 0.4) 0%, 
  oklch(0.06 0.01 240 / 0.2) 100%);
--club-glass-border: oklch(0.25 0.02 240 / 0.3);
--club-glass-border-bright: oklch(0.35 0.02 240 / 0.5);
```

### 3.3 Section-Specific Accent Overrides

| Section | Primary Accent | Usage |
|---------|----------------|-------|
| Hero/Masthead | Liquid Chrome + Violet | 3D centerpiece Fresnel, logotype glow |
| Manifesto | Acid Lime | Pull quotes, drop caps, accent lines |
| Proof Ledger | Chrome + Gold | Counter numbers, card borders on hover |
| Curated Works | Violet + Chrome | Tilt glow, drawer accent |
| Socials Matrix | Chrome | Icon strokes, active states |
| OpenTo Badges | Lime + Violet | Badge gradients, pulse |
| Activity Feed | Chrome | Timestamps, avatar rings |
| Contact Drawer | Gold + Chrome | CTA buttons, input focus |

---

## 4. TYPOGRAPHY — EDITORIAL SERIF + GROTESQUE RHYTHM

### 4.1 Font Stack (Variable Fonts via `next/font`)

| Role | Font | Weights | Variable Axes | Usage |
|------|------|---------|---------------|-------|
| **Display / Editorial** | **Cormorant Garamond VF** | 300-700 | wght, wdth | Hero logotype, section numbers, pull quotes, manifesto |
| **Headlines / UI** | **Syne VF** | 400-800 | wght, wdth | Section titles, KPI numbers, project titles, badges |
| **Body / UI** | **Plus Jakarta Sans VF** | 400-700 | wght | Body copy, buttons, labels, metadata |
| **Technical / Mono** | **JetBrains Mono VF** | 400-600 | wght | Code snippets, IDs, timestamps, vCard data |

### 4.2 Fluid Type Scale (Club-Specific)

```css
/* Section numbering: 01, 02, etc. */
--club-text-section-num: clamp(0.7rem, 0.65rem + 0.25vw, 0.875rem);

/* Section titles (Syne, wide) */
--club-text-section-title: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);

/* Hero logotype (Cormorant, ultra-wide) */
--club-text-hero-logo: clamp(3rem, 2rem + 5vw, 6rem);

/* Hero tagline (Cormorant italic) */
--club-text-hero-tagline: clamp(1.25rem, 1rem + 1.25vw, 2rem);

/* Manifesto body (Cormorant, editorial) */
--club-text-manifesto: clamp(1.125rem, 1rem + 0.6vw, 1.375rem);
--club-text-manifesto-leading: 1.8;

/* KPI Numbers (Syne, massive) */
--club-text-kpi: clamp(3rem, 2.5rem + 3vw, 5rem);

/* Body (Plus Jakarta Sans) */
--club-text-body: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
--club-text-body-leading: 1.7;

/* Small / Meta (JetBrains Mono) */
--club-text-mono: clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem);
```

### 4.3 Typographic Treatments

```css
/* --- SECTION NUMBERS --- */
.club-section-number {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: var(--club-text-section-num);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--club-fg-subtle);
  opacity: 0.6;
}

/* --- SECTION TITLES --- */
.club-section-title {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: var(--club-text-section-title);
  font-stretch: 125%; /* Semi-expanded */
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--club-fg);
  background: var(--club-gradient-chrome);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* --- MANIFESTO BODY --- */
.club-manifesto {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 400;
  font-size: var(--club-text-manifesto);
  line-height: var(--club-text-manifesto-leading);
  color: var(--club-fg);
  text-rendering: optimizeLegibility;
}
.club-manifesto::first-letter {
  font-size: 3.5em;
  font-weight: 600;
  float: left;
  line-height: 0.85;
  margin-right: 0.1em;
  color: var(--club-lime);
}

/* --- KPI NUMBERS --- */
.club-kpi-number {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: var(--club-text-kpi);
  font-stretch: 150%; /* Ultra-expanded */
  letter-spacing: -0.03em;
  line-height: 1;
  background: var(--club-gradient-chrome);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* --- CHROME GRADIENT TEXT (Utility) --- */
.club-gradient-text {
  background: var(--club-gradient-chrome);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.club-gradient-text-lime {
  background: linear-gradient(135deg, oklch(0.55 0.28 100), oklch(0.65 0.25 280));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.club-gradient-text-gold {
  background: linear-gradient(135deg, oklch(0.58 0.18 45), oklch(0.75 0.15 55));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 5. 3D WEBGL CENTERPIECE — REACTIVE LIQUID-CHROME DISCO POLYHEDRON

### 5.1 Concept

A **reactive liquid-chrome disco polyhedron / iridescent sphere** that lives at the center of the Hero/Masthead. It responds to:
- Mouse position (magnetic attraction/repulsion)
- Scroll progress (morphing, rotation)
- Audio/reactive mode (optional, via Web Audio API)
- Time of day (subtle hue shift)

### 5.2 Technical Stack

```typescript
// Lazy-loaded with next/dynamic, SSR: false
import dynamic from 'next/dynamic';

const ClubHero3D = dynamic(() => import('./ClubHero3D').then(m => m.ClubHero3D), {
  ssr: false,
  loading: () => <ClubHero3DFallback />,
});
```

**Dependencies:**
- `@react-three/fiber` (R3F)
- `@react-three/drei` (helpers: `OrbitControls`, `Html`, `Text`, `Effects`, `ShaderMaterials`)
- `three` (core)
- `glsl-noise` (for liquid displacement shaders)

### 5.3 Shader Specification — Liquid Chrome Fresnel

```glsl
// club-chrome-fresnel.glsl
// Vertex: Displace vertices with time-based noise (liquid morphing)
// Fragment: Fresnel + iridescent thin-film interference + chromatic aberration

uniform float uTime;
uniform vec2 uMouse;
uniform float uScrollProgress;
uniform float uIntensity; // 0-1, respects prefers-reduced-motion

// Liquid displacement (vertex)
vec3 displace(vec3 pos, float time) {
  float noise = cnoise(pos * 0.5 + time * 0.1);
  float noise2 = cnoise(pos * 1.2 - time * 0.07);
  float displacement = mix(noise, noise2, 0.5) * 0.15 * uIntensity;
  return pos + normal * displacement;
}

// Iridescent thin-film (fragment)
vec3 iridescence(float thickness, vec3 viewDir, vec3 normal) {
  float cosTheta = dot(normalize(viewDir), normal);
  float phase = thickness * 2.0 * 3.14159 / 550.0; // ~green wavelength
  vec3 color = vec3(
    sin(phase + 0.0),
    sin(phase + 2.094),
    sin(phase + 4.188)
  );
  return color * (1.0 - cosTheta) * 0.5; // Fresnel
}

// Chromatic aberration on edges
vec3 chromaticAberration(vec2 uv, float intensity) {
  vec2 center = vec2(0.5);
  float dist = length(uv - center);
  float aberration = smoothstep(0.7, 1.0, dist) * intensity;
  float r = texture2D(map, uv + vec2(aberration, 0.0)).r;
  float g = texture2D(map, uv).g;
  float b = texture2D(map, uv - vec2(aberration, 0.0)).b;
  return vec3(r, g, b);
}
```

### 5.4 Geometry Options

| Geometry | Description | Vertex Count | Performance |
|----------|-------------|--------------|-------------|
| **Icosahedron (subdivided ×3)** | 20 faces → 640 faces, organic sphere | ~640 | ✅ Light |
| **Dodecahedron (subdivided ×2)** | 12 pentagonal faces → 480 faces | ~480 | ✅ Light |
| **Custom Polyhedron (Disco Ball)** | 60+ facets, each a mirror plane | ~1200 | ⚠️ Medium |
| **Torus Knot (Animated)** | Self-intersecting, flowing | ~2000 | ⚠️ Medium |

**Recommendation:** Start with **subdivided Icosahedron** (organic sphere feel, liquid displacement looks best). Can swap geometry via prop.

### 5.5 Interaction Behaviors

| Trigger | Behavior | Spring Config |
|---------|----------|---------------|
| **Mouse Move** | Sphere rotates toward cursor (magnetic), vertices displace toward cursor | `{stiffness: 300, damping: 25, mass: 1.5}` |
| **Scroll** | Morph factor 0→1, rotation Y 0→360°, scale 1→0.9 | `{stiffness: 200, damping: 20, mass: 2}` |
| **Hover (Enter)** | Intensity bloom, Fresnel glow pulses | `{stiffness: 450, damping: 20, mass: 1}` |
| **Click/Tap** | "Ripple" shockwave through vertices | `{stiffness: 600, damping: 15, mass: 0.8}` |
| **Reduced Motion** | `uIntensity = 0`, static geometry, only slow auto-rotation | N/A |

### 5.6 Graceful Fallback (No WebGL / Reduced Motion)

```tsx
// ClubHero3DFallback.tsx
export function ClubHero3DFallback() {
  return (
    <div className="club-hero-fallback" aria-hidden="true">
      {/* CSS-only animated gradient orb using @keyframes */}
      <div className="club-fallback-orb">
        <div className="club-fallback-ring" />
        <div className="club-fallback-ring" style={{ animationDelay: '-2s' }} />
        <div className="club-fallback-ring" style={{ animationDelay: '-4s' }} />
      </div>
      {/* Static SVG logo with CSS gradient text */}
      <svg className="club-fallback-logo" viewBox="0 0 200 200">...</svg>
    </div>
  );
}
```

```css
/* Fallback CSS Animations */
.club-fallback-orb {
  width: 100%; height: 100%;
  background: var(--club-gradient-chrome-radial);
  border-radius: 50%;
  animation: club-pulse 8s ease-in-out infinite;
}
.club-fallback-ring {
  position: absolute; inset: 10%;
  border: 1px solid var(--club-chrome);
  border-radius: 50%;
  opacity: 0.3;
  animation: club-ring-expand 6s ease-out infinite;
}
@keyframes club-pulse { 0%,100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.05); opacity: 0.5; } }
@keyframes club-ring-expand { 0% { transform: scale(0.5); opacity: 0.4; } 100% { transform: scale(1.2); opacity: 0; } }
```

### 5.7 Performance Budget

| Metric | Target |
|--------|--------|
| **Initial JS (gzipped)** | < 80 KB (R3F + drei + shaders) |
| **First Frame** | < 800ms on 3G |
| **Runtime FPS** | 60fps desktop, 30fps mobile |
| **Memory** | < 50 MB GPU |
| **Reduced Motion** | Zero WebGL init, CSS-only fallback |

---

## 6. MOTION LANGUAGE — CLUB-SPECIFIC SPRINGS

### 6.1 Spring Presets (Extend DESIGN.md)

| Preset | Config | Use Case |
|--------|--------|----------|
| `club-snappy` | `{stiffness: 550, damping: 32, mass: 0.7}` | Buttons, toggles, badge pulses |
| `club-standard` | `{stiffness: 420, damping: 28, mass: 1}` | Cards, panels, drawer |
| `club-gentle` | `{stiffness: 280, damping: 24, mass: 1.3}` | Page sections, large reveals |
| `club-bouncy` | `{stiffness: 480, damping: 18, mass: 1}` | Success, celebrations, KPI count-up |
| `club-smooth` | `{stiffness: 350, damping: 30, mass: 1}` | Drag, hover, 3D tilt, magnetic |
| `club-magnetic` | `{stiffness: 650, damping: 38, mass: 0.5}` | Template selector, social icons, 3D centerpiece mouse follow |
| `club-orbital` | `{stiffness: 180, damping: 12, mass: 2.5}` | Floating background elements, 3D centerpiece idle |
| `club-liquid` | `{stiffness: 250, damping: 15, mass: 2}` | **NEW** — Liquid morphing, shader uniforms, scroll morph |

### 6.2 Stagger & Timing

```typescript
export const clubMotion = {
  stagger: {
    fast: 0.02,
    normal: 0.05,
    slow: 0.08,
    cascade: 0.06,
    section: 0.12,  // Between major sections
  },
  delay: {
    hero: 0,
    manifesto: 0.15,
    proof: 0.25,
    works: 0.35,
    socials: 0.45,
    openTo: 0.55,
    activity: 0.65,
    contact: 0.75,
  },
};
```

### 6.3 Reduced Motion Strategy

```typescript
// Respect prefers-reduced-motion globally
const prefersReducedMotion = useReducedMotion();

// All Framer Motion variants:
const variants = prefersReducedMotion 
  ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
  : { 
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: clubMotion.standard }
    };

// 3D Centerpiece: uIntensity = 0, disable OrbitControls, static fallback
// Scroll reveals: IntersectionObserver with immediate show
// Magnetic hover: Disable entirely
// Badge pulses: Disable
// KPI count-up: Show final value instantly
```

---

## 7. LAYOUT SYSTEM — ZERO-SCROLL DESKTOP COCKPIT

### 7.1 Desktop (≥1024px): Zero-Scroll Cockpit

```css
.club-layout-desktop {
  display: grid;
  grid-template-rows: 
    auto      /* Top Nav */
    1fr       /* Hero + 3D Centerpiece (flexible) */
    auto      /* Action Dock (fixed bottom) */
  ;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

/* Hero takes remaining space, 3D canvas fills it */
.club-hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 0; /* Critical for flex child overflow */
  position: relative;
}

/* Content columns (Manifesto | Proof | Works | Socials | Activity) 
   are in a scrollable panel OVERLAY on the right, 
   or in a horizontal scroll-snap carousel */
.club-content-panel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 480px;
  max-width: 100vw;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
}

/* Each section = scroll-snap-area */
.club-section {
  scroll-snap-align: start;
  min-height: 100vh;
  padding: var(--space-8) var(--space-6);
}
```

### 7.2 Mobile (<1024px): Vertical Scroll Flow

```css
.club-layout-mobile {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-y: auto;
}

/* Hero: 100vh min, 3D canvas aspect-ratio 1:1 */
.club-hero-mobile {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Sections stack naturally with scroll reveals */
.club-section-mobile {
  padding: var(--space-8) var(--space-4);
}
```

### 7.3 Breakpoints

```css
--club-bp-mobile: 640px;
--club-bp-tablet: 768px;
--club-bp-desktop: 1024px;
--club-bp-wide: 1440px;
--club-bp-ultrawide: 1920px;
```

---

## 8. COMPONENT SPECIFICATIONS

### 8.1 Top Nav (Fixed, Glassmorphism)

```tsx
// ClubTopNav.tsx
<nav className="club-top-nav" role="navigation" aria-label="Main navigation">
  <div className="club-nav-left">
    <LogoMark className="club-logo" />
    <span className="club-nav-divider" aria-hidden="true" />
    <nav className="club-nav-links" aria-label="Sections">
      <a href="#manifesto">Manifesto</a>
      <a href="#proof">Proof</a>
      <a href="#works">Works</a>
      <a href="#socials">Socials</a>
      <a href="#activity">Activity</a>
    </nav>
  </div>
  <div className="club-nav-right">
    <FXToggle /> {/* Respects prefers-reduced-motion */}
    <ThemeToggle />
    <AvailabilityPill /> {/* Live status indicator */}
  </div>
</nav>
```

**Styles:**
- `backdrop-blur-xl`, `bg-[var(--club-bg-glass)]`
- `border-b: 1px solid var(--club-glass-border)`
- Links: `text-[var(--club-fg-muted)]` → `text-[var(--club-chrome)]` on hover
- Logo: Cormorant Garamond, `font-stretch: 150%`, gradient text

### 8.2 Hero / Masthead (Section 01)

```tsx
// ClubHero.tsx
<section id="hero" className="club-hero" aria-labelledby="hero-title">
  {/* 3D Centerpiece — LAZY LOADED */}
  <div className="club-hero-canvas" aria-hidden="true">
    <ClubHero3D 
      intensity={fxEnabled ? 1 : 0}
      geometry="icosphere"
      onLoad={() => set3DLoaded(true)}
    />
  </div>
  
  {/* Fallback if WebGL fails or reduced motion */}
  <ClubHero3DFallback className={!is3DLoaded ? 'visible' : ''} />
  
  {/* Content Layer */}
  <div className="club-hero-content">
    <div className="club-hero-badge">
      <span className="club-section-number">01</span>
      <span className="club-section-title">MASTHEAD</span>
    </div>
    
    <h1 id="hero-title" className="club-hero-logo club-gradient-text">
      THE CLUB
    </h1>
    
    <p className="club-hero-tagline club-gradient-text-lime">
      "We shape culture."
    </p>
    
    <ScrollIndicator className="club-scroll-indicator" />
  </div>
  
  {/* Ambient glow behind 3D */}
  <div className="club-hero-glow" aria-hidden="true" />
</section>
```

### 8.3 Manifesto / Bio (Section 02)

```tsx
// ClubManifesto.tsx
<section id="manifesto" className="club-section club-manifesto-section" aria-labelledby="manifesto-title">
  <header className="club-section-header">
    <span className="club-section-number">02</span>
    <h2 id="manifesto-title" className="club-section-title">MANIFESTO</h2>
  </header>
  
  <div className="club-manifesto-content" ref={manifestoRef}>
    <p className="club-manifesto">
      {profile.bio || "Culture isn't borrowed. It's built. Every campaign, every collaboration, every pixel — intentional. We don't follow trends. We originate them."}
    </p>
    
    {/* Pull quote */}
    <blockquote className="club-pull-quote club-gradient-text-lime">
      "The future belongs to those who create it."
    </blockquote>
    
    {/* Secondary paragraph */}
    <p className="club-manifesto club-manifesto-secondary">
      {profile.manifesto || "A collective of strategists, designers, and cultural architects..."}
    </p>
  </div>
  
  {/* Decorative accent line */}
  <div className="club-manifesto-accent" aria-hidden="true">
    <div className="club-accent-line" style={{ background: 'var(--club-gradient-chrome)' }} />
    <div className="club-accent-dot" style={{ background: 'var(--club-lime)' }} />
  </div>
</section>
```

### 8.4 Proof Ledger (Section 03)

```tsx
// ClubProofLedger.tsx
<section id="proof" className="club-section club-proof-section" aria-labelledby="proof-title">
  <header className="club-section-header">
    <span className="club-section-number">03</span>
    <h2 id="proof-title" className="club-section-title">PROOF LEDGER</h2>
  </header>
  
  <div className="club-proof-grid" role="list">
    {proofPoints.map((proof, i) => (
      <article 
        key={proof.id} 
        className="club-proof-card magnetic-card"
        role="listitem"
        style={{ transitionDelay: `${i * 0.05}s` }}
      >
        <div className="club-proof-icon" aria-hidden="true">
          <Icon as={proof.icon} size={28} strokeWidth={1.5} />
        </div>
        
        <div className="club-proof-value">
          <AnimatedCounter 
            end={proof.value} 
            duration={2000}
            className="club-kpi-number"
            suffix={proof.suffix}
          />
        </div>
        
        <div className="club-proof-label">
          <span className="club-proof-title">{proof.label}</span>
          {proof.subtext && <span className="club-proof-subtext">{proof.subtext}</span>}
        </div>
        
        {/* Magnetic hover glow */}
        <div className="club-proof-glow" aria-hidden="true" />
      </article>
    ))}
  </div>
</section>
```

### 8.5 Curated Works (Section 04)

```tsx
// ClubCuratedWorks.tsx
<section id="works" className="club-section club-works-section" aria-labelledby="works-title">
  <header className="club-section-header">
    <span className="club-section-number">04</span>
    <h2 id="works-title" className="club-section-title">CURATED WORKS</h2>
  </header>
  
  <div className="club-works-grid" role="list">
    {projects.map((project, i) => (
      <ClubProjectCard 
        key={project.id}
        project={project}
        index={i}
        onOpen={() => openDrawer(project)}
      />
    ))}
  </div>
  
  {/* Project Drawer — Framer Motion */}
  <ClubProjectDrawer
    project={selectedProject}
    isOpen={!!selectedProject}
    onClose={closeDrawer}
  />
</section>
```

**ClubProjectCard:**
- Aspect ratio 4:5 (portrait) or 16:9 (landscape)
- Image: `next/image` with blur placeholder, `priority` for first 3
- 3D Tilt on hover (max 8°), magnetic pull
- Gradient overlay on hover with project category tag
- Click → opens `ClubProjectDrawer` (slide from right, 480px wide)

**ClubProjectDrawer:**
- Framer Motion: `x: 0 → 100%`, `club-standard` spring
- Focus trap, ESC to close, click overlay to close
- Content: Hero image, title, category, description, metrics, links, CTA
- Keyboard accessible: Tab traps, focus restoration

### 8.6 Brand Socials Matrix (Section 05)

```tsx
// ClubSocialsMatrix.tsx
<section id="socials" className="club-section club-socials-section" aria-labelledby="socials-title">
  <header className="club-section-header">
    <span className="club-section-number">05</span>
    <h2 id="socials-title" className="club-section-title">BRAND SOCIALS</h2>
  </header>
  
  <div className="club-socials-rail" role="list" aria-label="Social platforms">
    {socialLinks.map((link, i) => (
      <ClubSocialCard
        key={link.id}
        link={link}
        index={i}
        icon={CLUB_BRAND_ICONS[normalizeSocialPlatformKey(link.platform)]}
      />
    ))}
  </div>
</section>
```

**ClubSocialCard:**
- Horizontal scroll-snap rail (`scroll-snap-type: x mandatory`)
- Each card: `scroll-snap-align: start`, `min-width: 120px`, `max-width: 160px`
- Brand SVG from centralized `CLUB_BRAND_ICONS` registry (40+ platforms)
- Glassmorphism card: `backdrop-blur-xl`, `border: 1px solid var(--club-glass-border)`
- Hover: `border-color: var(--club-chrome)`, magnetic pull, icon stroke animates
- Active/visited: subtle `var(--club-lime)` ring
- Touch: native scroll, snap works on iOS/Android

### 8.7 OpenTo Badges (Section 06)

```tsx
// ClubOpenToBadges.tsx
<section id="open-to" className="club-section club-open-to-section" aria-labelledby="open-to-title">
  <header className="club-section-header">
    <span className="club-section-number">06</span>
    <h2 id="open-to-title" className="club-section-title">OPEN TO</h2>
  </header>
  
  <div className="club-badges-wrap" role="list" aria-label="Open to opportunities">
    {openToItems.map((item, i) => (
      <ClubOpenToBadge
        key={item.id}
        item={item}
        index={i}
        variant="club"
      />
    ))}
  </div>
</section>
```

**ClubOpenToBadge (variant="club"):**
- Pill shape, `padding: 0.5rem 1.25rem`
- Background: `var(--club-gradient-chrome)` or `var(--club-gradient-void)`
- Border: `1px solid var(--club-glass-border-bright)`
- Text: Syne 500, `font-size: var(--club-text-mono)`
- Icon: 16px, stroke `var(--club-fg)`
- Hover: `transform: scale(1.05)`, `box-shadow: var(--club-chrome-glow)`, pulse animation
- Pulse: `@keyframes club-pulse { 0%,100% { box-shadow: 0 0 0 0 var(--club-chrome); } 50% { box-shadow: 0 0 0 8px transparent; } }`
- Reduced motion: no pulse, instant scale

### 8.8 Recent Activity Feed (Section 07)

```tsx
// ClubRecentActivity.tsx (uses RecentActivitySection with variant="club")
<section id="activity" className="club-section club-activity-section" aria-labelledby="activity-title">
  <header className="club-section-header">
    <span className="club-section-number">07</span>
    <h2 id="activity-title" className="club-section-title">RECENT ACTIVITY</h2>
  </header>
  
  <RecentActivitySection
    variant="club"
    activities={activities}
    profile={profile}
    className="club-activity-feed"
  />
  
  {/* Live Clock in section header */}
  <LiveClock className="club-live-clock" format="HH:mm:ss" timezone="local" />
</section>
```

**variant="club" styling for RecentActivitySection:**
- Timeline: vertical line `var(--club-border)`, dots `var(--club-chrome)`
- Cards: glassmorphism, `backdrop-blur-xl`, `border: 1px solid var(--club-glass-border)`
- Timestamp: JetBrains Mono, `var(--club-fg-subtle)`
- Content: Plus Jakarta Sans, `var(--club-fg)`
- Hover: border `var(--club-chrome)`, translateX(4px)
- Avatars: `variant="ring-pulse"` with `var(--club-lime)` pulse

### 8.9 Contact / Booking Drawer (Section 08)

```tsx
// ClubContactDrawer.tsx (triggered from Action Dock or CTA)
<ClubContactDrawer
  isOpen={isContactOpen}
  onClose={closeContact}
  profile={profile}
  onSubmit={handleBooking}
/>
```

**Drawer Content:**
- Slide from right (480px desktop, 100% mobile), `club-standard` spring
- Focus trap, ESC close, overlay click close
- Form: Name, Email, Company, Project Type (select), Budget (select), Message
- Validation: client-side + serverless API
- Submit: Toast "Booking request sent", vCard download auto-triggers
- vCard: RFC 6350 compliant, includes all profile links, socials, contact
- Calendly embed option: `<iframe>` in drawer footer

### 8.10 Action Dock (Fixed Bottom Desktop)

```tsx
// ClubActionDock.tsx
<footer className="club-action-dock" role="contentinfo">
  <div className="club-dock-left">
    <LiveClock format="HH:mm" className="club-dock-clock" />
    <AvailabilityPill status={profile.availability} />
  </div>
  
  <div className="club-dock-center">
    <button className="club-dock-btn club-dock-btn-primary" onClick={openContact}>
      <MailIcon size={18} /> Book a Session
    </button>
    <button className="club-dock-btn club-dock-btn-secondary" onClick={downloadVCard}>
      <DownloadIcon size={18} /> Download vCard
    </button>
    <button className="club-dock-btn club-dock-btn-ghost" onClick={copyEmail}>
      <CopyIcon size={18} /> Copy Email
    </button>
  </div>
  
  <div className="club-dock-right">
    <FXToggle />
    <ShareButton profile={profile} />
  </div>
</footer>
```

**Button Variants:**
- Primary: `bg-[var(--club-gradient-chrome)]`, `text-[var(--club-void)]`, `font-weight: 600`
- Secondary: `bg-transparent`, `border: 1px solid var(--club-chrome)`, `text-[var(--club-chrome)]`
- Ghost: `bg-transparent`, `text-[var(--club-fg-muted)]`, hover `text-[var(--club-fg)]`

---

## 9. CENTRALIZED BRAND ICON REGISTRY

### 9.1 CLUB_BRAND_ICONS (Extends SocialBrandIcons.tsx)

```typescript
// components/profile/templates/persona/ClubBrandIcons.ts
export const CLUB_BRAND_ICONS: Record<string, React.ReactNode> = {
  // Primary Platforms
  instagram: <InstagramIcon />,
  tiktok: <TikTokIcon />,
  youtube: <YouTubeIcon />,
  twitter: <TwitterIcon />, // X
  linkedin: <LinkedInIcon />,
  facebook: <FacebookIcon />,
  snapchat: <SnapchatIcon />,
  pinterest: <PinterestIcon />,
  
  // Creative Platforms
  behance: <BehanceIcon />,
  dribbble: <DribbbleIcon />,
  figma: <FigmaIcon />,
  adobe: <AdobeIcon />,
  notion: <NotionIcon />,
  framer: <FramerIcon />,
  webflow: <WebflowIcon />,
  
  // Developer Platforms
  github: <GitHubIcon />,
  gitlab: <GitLabIcon />,
  stackoverflow: <StackOverflowIcon />,
  devto: <DevToIcon />,
  codepen: <CodePenIcon />,
  vercel: <VercelIcon />,
  netlify: <NetlifyIcon />,
  
  // Communication
  discord: <DiscordIcon />,
  telegram: <TelegramIcon />,
  whatsapp: <WhatsAppIcon />,
  slack: <SlackIcon />,
  email: <EmailIcon />,
  calendar: <CalendarIcon />,
  
  // Audio/Video
  spotify: <SpotifyIcon />,
  soundcloud: <SoundCloudIcon />,
  apple: <AppleMusicIcon />,
  twitch: <TwitchIcon />,
  vimeo: <VimeoIcon />,
  
  // Writing
  medium: <MediumIcon />,
  substack: <SubstackIcon />,
  ghost: <GhostIcon />,
  hashnode: <HashnodeIcon />,
  
  // Commerce
  shopify: <ShopifyIcon />,
  stripe: <StripeIcon />,
  patreon: <PatreonIcon />,
  gumroad: <GumroadIcon />,
  
  // Fallback
  default: <GlobeIcon />,
} as const;

export type ClubBrandIconKey = keyof typeof CLUB_BRAND_ICONS;
```

### 9.2 Platform Normalization

```typescript
// Reuses normalizeSocialPlatformKey from existing ClubTemplate
export function normalizeSocialPlatformKey(platform: string): ClubBrandIconKey {
  const normalized = platform.toLowerCase().trim()
    .replace(/\s+/g, '')
    .replace(/[.@]/g, '');
  
  const aliasMap: Record<string, ClubBrandIconKey> = {
    'x': 'twitter',
    'twitter.com': 'twitter',
    'instagram.com': 'instagram',
    'tiktok.com': 'tiktok',
    'youtube.com': 'youtube',
    'youtu.be': 'youtube',
    'linkedin.com': 'linkedin',
    'github.com': 'github',
    'discord.gg': 'discord',
    'discord.com': 'discord',
    // ... more aliases
  };
  
  return aliasMap[normalized] || (normalized in CLUB_BRAND_ICONS ? normalized : 'default');
}
```

---

## 10. DATA ADAPTER — PUBLICPROFILE → CLUB TEMPLATE

```typescript
// components/profile/templates/persona/adaptClub.ts
export function adaptPublicProfileToClub(profile: PublicProfile): ClubTemplateData {
  return {
    // Identity
    name: profile.name,
    handle: profile.handle,
    tagline: profile.tagline || "We shape culture.",
    bio: profile.bio,
    manifesto: profile.manifesto,
    avatar: profile.avatar,
    availability: profile.availability,
    
    // Proof Points (from profile.proofPoints)
    proofPoints: (profile.proofPoints || []).map(p => ({
      id: p.id,
      label: p.label,
      value: p.value,
      suffix: p.suffix || '',
      icon: p.icon || 'TrendingUp',
      subtext: p.description,
    })),
    
    // Projects (from profile.projects)
    projects: (profile.projects || []).map(p => ({
      id: p.id,
      title: p.title,
      category: p.category || 'Project',
      description: p.description,
      image: p.coverImage || p.images?.[0],
      images: p.images || [],
      metrics: p.metrics || {},
      links: p.links || [],
      tags: p.tags || [],
    })),
    
    // Socials (from profile.links)
    socialLinks: (profile.links || [])
      .filter(l => l.platform && !l.isPrimaryAction)
      .map(l => ({
        id: l.id,
        platform: l.platform,
        url: l.url,
        label: l.label,
        icon: CLUB_BRAND_ICONS[normalizeSocialPlatformKey(l.platform)],
      })),
    
    // Primary CTA
    primaryCTA: profile.links?.find(l => l.isPrimaryAction),
    
    // OpenTo
    openTo: (profile.openTo || []).map(o => ({
      id: o.id,
      label: o.label,
      icon: o.icon || 'Sparkles',
      variant: o.variant || 'default',
    })),
    
    // Activity (from profile.activity)
    activities: (profile.activity || []).map(a => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      timestamp: a.timestamp,
      link: a.link,
      metadata: a.metadata,
    })),
    
    // Contact
    email: profile.email,
    location: profile.location,
    calendlyUrl: profile.calendlyUrl,
  };
}
```

---

## 11. ACCESSIBILITY & INCLUSIVE DESIGN

### 11.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | All text ≥ 4.5:1 (UI), ≥ 3:1 (large text). Chrome on void = 7.2:1. Lime on void = 5.8:1. |
| **Focus Visible** | `outline: 2px solid var(--club-chrome)`, `outline-offset: 2px` on all interactive |
| **Keyboard Navigation** | Full tab order, skip links, focus trap in drawers, ESC to close |
| **Screen Readers** | Semantic HTML, `aria-labels`, `aria-live` for toasts/counters, `role="list"` |
| **Reduced Motion** | `prefers-reduced-motion` disables all 3D, parallax, magnetic, pulse animations |
| **Touch Targets** | Minimum 44×44px, 8px gap between targets |
| **Zoom** | Works at 200% zoom, no horizontal scroll |

### 11.2 Reduced Motion Implementation

```typescript
// hooks/useReducedMotion.ts
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReduced;
}

// Global provider for context
export function ClubReducedMotionProvider({ children }) {
  const prefersReduced = useReducedMotion();
  return (
    <ReducedMotionContext.Provider value={prefersReduced}>
      {children}
    </ReducedMotionContext.Provider>
  );
}
```

---

## 12. TOAST NOTIFICATION SYSTEM

```typescript
// ClubToast.tsx
interface ClubToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number; // default 4000ms
}

// Variants
const toastStyles = {
  success: 'border-l-4 border-[var(--club-lime)] bg-[var(--club-bg-card)]',
  error: 'border-l-4 border-[var(--club-chrome)] bg-[var(--club-bg-card)]',
  info: 'border-l-4 border-[var(--club-violet)] bg-[var(--club-bg-card)]',
  warning: 'border-l-4 border-[var(--club-gold)] bg-[var(--club-bg-card)]',
};

// Auto-dismiss with progress bar
// Pause on hover, swipe to dismiss (mobile)
```

---

## 13. VCARD GENERATION (RFC 6350)

```typescript
// utils/vcard.ts
export function generateVCard(profile: ClubTemplateData): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name}`,
    profile.handle ? `NICKNAME:${profile.handle}` : '',
    profile.email ? `EMAIL;TYPE=WORK:${profile.email}` : '',
    profile.location ? `ADR;TYPE=WORK:;;${profile.location};;;;` : '',
    profile.tagline ? `NOTE:${profile.tagline}` : '',
    `URL:${window.location.origin}/u/${profile.handle}`,
    ...profile.socialLinks.map(s => `URL;TYPE=${s.platform.toUpperCase()}:${s.url}`),
    'END:VCARD',
  ].filter(Boolean).join('\r\n');
  
  return lines;
}

export function downloadVCard(profile: ClubTemplateData) {
  const vcard = generateVCard(profile);
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.handle || profile.name}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 14. PERFORMANCE & LOADING STRATEGY

### 14.1 Code Splitting & Lazy Loading

```typescript
// ClubTemplate.tsx - All heavy components lazy loaded
const ClubHero3D = dynamic(() => import('./ClubHero3D'), { ssr: false, loading: ClubHero3DFallback });
const ClubProjectDrawer = dynamic(() => import('./ClubProjectDrawer'), { ssr: false });
const ClubContactDrawer = dynamic(() => import('./ClubContactDrawer'), { ssr: false });
const ClubSocialsMatrix = dynamic(() => import('./ClubSocialsMatrix'), { ssr: false });

// 3D only loads on desktop or explicit user opt-in
const shouldLoad3D = !prefersReducedMotion && !isMobile;
```

### 14.2 Resource Hints

```html
<!-- In layout.tsx head for the-club template -->
<link rel="preload" as="script" href="/_next/static/chunks/three-[hash].js" />
<link rel="preload" as="script" href="/_next/static/chunks/react-three-fiber-[hash].js" />
<link rel="prefetch" href="/templates/previews/the-club.jpg" />
```

### 14.3 Image Optimization

```typescript
// All project images: next/image with blur placeholder
<Image
  src={project.image}
  alt={project.title}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="club-work-image"
  placeholder="blur"
  blurDataURL={project.blurDataURL}
/>
```

---

## 15. RESPONSIVE BREAKPOINT BEHAVIOR

| Feature | Mobile (<640) | Tablet (640-1023) | Desktop (≥1024) | Wide (≥1440) |
|---------|---------------|-------------------|-----------------|--------------|
| **Layout** | Vertical scroll | Vertical scroll | Zero-scroll cockpit | Zero-scroll cockpit |
| **3D Centerpiece** | 100vh hero, fallback | 100vh hero, WebGL | Full viewport, WebGL | Full viewport, WebGL |
| **Content Panel** | Stacked sections | Stacked sections | Fixed right panel (480px) | Fixed right panel (520px) |
| **Socials Rail** | Horizontal scroll | Horizontal scroll | Horizontal scroll | Horizontal scroll |
| **Project Drawer** | Full screen modal | Slide panel (60%) | Slide panel (480px) | Slide panel (520px) |
| **Contact Drawer** | Full screen modal | Slide panel (80%) | Slide panel (480px) | Slide panel (520px) |
| **Action Dock** | Hidden (in header) | Hidden (in header) | Fixed bottom | Fixed bottom |
| **Typography Scale** | Base | Base | Base | +10% |

---

## 16. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Day 1)
- [ ] Create `DESIGN_CLUB.md` (this document) ✅
- [ ] Add Club color tokens to `app/globals.css` (or CSS-in-JS)
- [ ] Install/configure `next/font` for Cormorant Garamond, Syne, Plus Jakarta Sans, JetBrains Mono
- [ ] Create `ClubBrandIcons.ts` registry (extend from SocialBrandIcons)
- [ ] Create `adaptPublicProfileToClub` adapter

### Phase 2: 3D Centerpiece (Day 2-3)
- [ ] Install `@react-three/fiber`, `@react-three/drei`, `three`, `glsl-noise`
- [ ] Create `ClubHero3D` component with liquid chrome shaders
- [ ] Create `ClubHero3DFallback` CSS-only fallback
- [ ] Implement `useReducedMotion` hook and context
- [ ] Test WebGL fallback on no-GPU environments

### Phase 3: Layout & Sections (Day 3-5)
- [ ] Build zero-scroll desktop layout (CSS Grid)
- [ ] Build mobile vertical layout
- [ ] Implement all 8 sections as modular components
- [ ] Wire data adapter to template props

### Phase 4: Interactive Components (Day 5-6)
- [ ] `ClubProjectDrawer` with Framer Motion + focus trap
- [ ] `ClubContactDrawer` with form + vCard + Calendly
- [ ] `ClubSocialsMatrix` horizontal scroll-snap
- [ ] `ClubOpenToBadges` with pulse animation
- [ ] `ClubActionDock` fixed bottom
- [ ] `FXToggle` respecting reduced motion
- [ ] `ToastStack` system

### Phase 5: Polish & QA (Day 6-7)
- [ ] Run `/browse` to test local preview
- [ ] Verify 3D canvas compiles (no SSR errors)
- [ ] Test responsive breakpoints (375, 768, 1024, 1440, 1920)
- [ ] Ensure 60fps desktop, 30fps mobile
- [ ] Run `/design-review` for typography, contrast, micro-interactions
- [ ] Run `/qa` for all interactive triggers
- [ ] Run `/review` for code quality
- [ ] `npm run build` — 0 errors

---

## 17. ACCEPTANCE CRITERIA — "WORLD-CLASS"

| Check | Pass Condition |
|-------|----------------|
| **3D Centerpiece** | Loads on desktop, 60fps, reactive to mouse/scroll, graceful fallback |
| **Zero-Scroll Desktop** | No vertical scroll on ≥1024px, content panel scrolls independently |
| **All 8 Sections** | Present, styled, data-connected, accessible |
| **Typography** | Cormorant (editorial), Syne (headlines), Plus Jakarta (UI), JetBrains (mono) |
| **Color Tokens** | Void, Chrome, Lime, Violet, Gold — all semantic mappings work |
| **Glassmorphism** | `backdrop-blur-xl`, hairline borders, layered depth |
| **Brand Icons** | 40+ platforms from centralized registry, normalized |
| **Reduced Motion** | Zero WebGL, instant reveals, no pulse/parallax/magnetic |
| **vCard Export** | RFC 6350 compliant, downloads on contact submit |
| **Toast System** | Auto-dismiss, progress bar, swipe dismiss, accessible |
| **Build** | `npm run build` — 0 TypeScript errors, < 50 warnings |
| **Lighthouse** | Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90 |

---

## 18. FILE STRUCTURE (NEW)

```
components/profile/templates/persona/
├── ClubTemplate.tsx              # Main entry (lazy loads sections)
├── ClubBrandIcons.ts             # Centralized brand SVG registry
├── adaptClub.ts                  # PublicProfile → ClubTemplateData
├── sections/
│   ├── ClubTopNav.tsx
│   ├── ClubHero.tsx              # Includes ClubHero3D + Fallback
│   ├── ClubHero3D.tsx            # R3F centerpiece (ssr: false)
│   ├── ClubHero3DFallback.tsx    # CSS-only fallback
│   ├── ClubManifesto.tsx
│   ├── ClubProofLedger.tsx
│   ├── ClubCuratedWorks.tsx
│   ├── ClubProjectCard.tsx
│   ├── ClubProjectDrawer.tsx
│   ├── ClubSocialsMatrix.tsx
│   ├── ClubSocialCard.tsx
│   ├── ClubOpenToBadges.tsx
│   ├── ClubRecentActivity.tsx    # Wraps RecentActivitySection variant="club"
│   ├── ClubContactDrawer.tsx
│   ├── ClubActionDock.tsx
│   ├── ClubFXToggle.tsx
│   ├── ClubLiveClock.tsx
│   ├── ClubAvailabilityPill.tsx
│   └── ClubToastStack.tsx
├── shaders/
│   ├── club-chrome-fresnel.glsl
│   └── club-liquid-displacement.glsl
└── hooks/
    ├── useReducedMotion.ts
    └── useClubMotion.ts
```

---

*This DESIGN_CLUB.md is the single source of truth for The Club template overhaul. All implementation decisions reference this document. Update here first, then code.*