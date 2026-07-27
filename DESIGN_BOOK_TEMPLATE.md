# 📖 FOLIO — Premium 3D Floating Book Portfolio Template

**Design Specification v1.0** • *A digital artifact worth $20,000*

---

## 🎯 Executive Vision

This is not a template. It's a **digital artifact** — a hand-crafted 3D book that floats in space, breathes with subtle physics, opens with the weight and grace of a century-old leather-bound volume, and reveals your professional story across six meticulously choreographed pages. Every material, every motion curve, every micro-interaction has been designed to feel *intentional* — the kind of work that makes visitors pause, explore, and remember.

**Design Philosophy:** *Craft over convenience. Physics over presets. Soul over templates.*

---

## 🎨 Visual Identity System

### Color Palette — "Midnight Library"

| Token | Hex | RGB | Usage | Psychology |
|-------|-----|-----|-------|------------|
| `--ink-deep` | `#0D0D0D` | 13, 13, 13 | Book cover base, deepest shadows | Authority, depth, mystery |
| `--ink-soft` | `#1A1A1A` | 26, 26, 26 | Cover elevation, spine recesses | Subtle dimensionality |
| `--ivory-warm` | `#F5F0E8` | 245, 240, 232 | Paper base, page backgrounds | Warmth, readability, age |
| `--ivory-aged` | `#E8E0D0` | 232, 224, 208 | Page edges, subtle gradients | Patina, history |
| `--gold-antique` | `#C9A84C` | 201, 168, 76 | Foil stamping, gilding, accents | Prestige, craftsmanship |
| `--gold-bright` | `#E8C56D` | 232, 197, 109 | Active states, hover highlights | Energy, invitation |
| `--gold-dim` | `#9D8438` | 157, 132, 56 | Disabled, recessed foil | Restraint |
| `--accent-user` | `#{{USER_ACCENT}}` | Variable | **Single user-defined accent** | Personal identity |
| `--dust-mote` | `rgba(201, 168, 76, 0.15)` | - | Particulate matter | Atmosphere |
| `--light-shaft` | `rgba(245, 240, 232, 0.08)` | - | Volumetric lighting | Depth, divinity |

> **Critical:** Only ONE accent color per instance. The user chooses their identity color at setup — everything else is locked. This constraint creates cohesion.

### Typography — "Scholar's Hand"

| Role | Font | Weight | Size/Line | Purpose |
|------|------|--------|-----------|---------|
| **Display/Name** | `Cormorant Garamond` | 600 | `clamp(3rem, 8vw, 7rem) / 1.05` | Hero, cover title — editorial gravitas |
| **Heading/Page Title** | `Cormorant Garamond` | 500 | `clamp(1.75rem, 4vw, 3rem) / 1.2` | Page headers — classical rhythm |
| **Body/Prose** | `Fraunces` (Variable: `SOFT` axis) | 400 | `1.125rem / 1.75` | Bio, descriptions — literary warmth |
| **UI/_labels** | `Space Grotesk` | 500 | `0.875rem / 1.5` | Skills, tags, metadata — technical clarity |
| **Micro/Code** | `JetBrains Mono` | 400 | `0.8125rem / 1.6` | Code snippets, timestamps — precision |

**Variable Font Axes (Fraunces):**
- `SOFT`: 0 (sharp) → 100 (rounded) — *animated on page turn: 0 → 25 → 0*
- `WONK`: 0 → 5 — *subtle humanization, static at 2*

### Spacing Scale — "Golden Rhythm"

Based on **φ (1.618)** and **musical intervals**:

| Step | Value | Rem | Use Case |
|------|-------|-----|----------|
| `--space-0` | 0 | 0 | Collapse |
| `--space-1` | φ⁰ × 4 | 0.25rem | Hairline |
| `--space-2` | φ¹ × 4 | 0.4rem | Micro gap |
| `--space-3` | φ² × 4 | 0.65rem | Inline gap |
| `--space-4` | φ³ × 4 | 1.05rem | Standard unit |
| `--space-5` | φ⁴ × 4 | 1.7rem | Component padding |
| `--space-6` | φ⁵ × 4 | 2.75rem | Section gap |
| `--space-7` | φ⁶ × 4 | 4.45rem | Page margin |
| `--space-8` | φ⁷ × 4 | 7.2rem | Major break |

---

## 🏗️ 3D Architecture — "The Codex Engine"

### Scene Graph

```
<Scene>
  ├─ <PerspectiveCamera> (fov: 45, near: 0.1, far: 100)
  │   └─ Position: [0, 0, 3.5] → animated via spring
  │
  ├─ <Environment> (HDRI: "library_study_4k.hdr", intensity: 0.85)
  │   └─ Custom: warm candlelight + window spill
  │
  ├─ <BookGroup> (root: floating transform)
  │   ├─ <CoverFront> (Mesh: leather + gold foil)
  │   │   ├─ Geometry: RoundedBox (w: 1.6, h: 2.4, d: 0.12, radius: 0.02)
  │   │   ├─ Material: LeatherShader (see shaders)
  │   │   └─ Pivot: Left edge + spine offset (0.08)
  │   │
  │   ├─ <CoverBack> (Mesh: leather, same geometry)
  │   │   └─ Pivot: Right edge - spine offset
  │   │
  │   ├─ <Spine> (Mesh: leather + raised bands + gold text)
  │   │   └─ Geometry: RoundedBox (w: 0.16, h: 2.4, d: 0.12)
  │   │   └─ Bands: 5 raised ribs (height: 0.015)
  │   │
  │   ├─ <PageStack> (Group: 6 pages + 2 endpapers)
  │   │   ├─ <EndpaperFront> (ivory, no content, slightly thicker)
  │   │   ├─ <Page1_Hero> → <Page6_Contact>
  │   │   └─ <EndpaperBack>
  │   │       └─ Each Page:
  │   │           ├─ Geometry: Plane (w: 1.52, h: 2.28) + curl deformation
  │   │           ├─ Material: PaperShader (double-sided)
  │   │           ├─ Content: <HTMLTexture> (React portal → canvas)
  │   │           └─ Physics: Vertex shader curl + cloth sim
  │   │
  │   ├─ <PageMarkers> (3 silk ribbons: gold, accent, ivory)
  │   │   └─ Geometry: Ribbon curve, physics-simulated
  │   │
  │   └─ <DustSystem> (GPU particles: 2000 motes, Brownian motion)
  │
  ├─ <LightingRig>
  │   ├─ <KeyLight> (Spot: 30°, pos: [2, 3, 2], temp: 3200K, decay: 2)
  │   ├─ <FillLight> (Area: [4, 2], pos: [-3, 1, 1], temp: 4500K)
  │   ├─ <RimLight> (Spot: 15°, pos: [0, 2, -3], temp: 5500K, gold tint)
  │   ├─ <CausticProjector> (Animated texture, subtle)
  │   └─ <ContactShadows> (CSM: 3 cascades, PCF)
  │
  └─ <PostProcessing>
      ├─ <Bloom> (threshold: 0.85, strength: 0.15, radius: 0.4)
      ├─ <ToneMapping> (ACESFilmic, exposure: 1.05)
      ├─ <Vignette> (0.15, feathered)
      ├─ <FilmGrain> (0.02, animated)
      └─ <ChromaticAberration> (0.0008, radial)
```

### Camera Choreography

| State | Position | Target | FOV | Transition |
|-------|----------|--------|-----|------------|
| **Idle/Closed** | `[0, 0.1, 3.5]` | `[0, 0, 0]` | 45° | Spring (stiffness: 120, damping: 18) |
| **Opening** | `[0, 0.05, 3.2]` | `[0, 0, -0.1]` | 42° | Springs + look-at lerp |
| **Page N Focus** | `[0.3, 0, 2.8]` | `[0.15, 0, -0.2]` | 38° | Per-page spring |
| **Deep Read** | `[0, 0, 1.8]` | `[0, 0, -0.3]` | 32° | On scroll/zoom |
| **Mobile** | `[0, 0, 4.2]` | `[0, 0, 0]` | 50° | Fixed, no parallax |

---

## 🎭 Material System — "Matter with Memory"

### 1. Leather Cover Shader (`LeatherShader`)

```glsl
// Vertex: Subtle surface displacement for grain
// Fragment: Multi-layer BRDF

uniform sampler2D uLeatherNormal;    // Scanned leather normal map (4K)
uniform sampler2D uLeatherRoughness; // Micro-variation
uniform sampler2D uFoilMask;         // Gold stamping areas
uniform float uTime;
uniform vec3 uViewDir;

const vec3 LEATHER_BASE = vec3(0.051, 0.043, 0.035);  // #0D0B09
const vec3 GOLD_FOIL = vec3(0.788, 0.659, 0.298);    // #C9A84C

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

float leatherBRDF(vec3 N, vec3 V, vec3 L, float roughness) {
  // GGX + Schlick + Subsurface (thin leather)
  float NDF = DistributionGGX(N, L, roughness);
  float G = GeometrySchlickGGX(N, V, roughness);
  vec3 F = FresnelSchlick(max(dot(V, L), 0.0), vec3(0.02));
  return (NDF * G * F) / (4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.001);
}

float subsurface(vec3 N, vec3 V, vec3 L, float thickness) {
  // Pre-integrated subsurface for thin leather
  float ln = dot(N, L);
  float vn = dot(N, V);
  return saturate((ln + vn) * 0.5 + thickness * 0.3) * 0.15;
}

void main() {
  vec3 normal = unpackNormal(texture2D(uLeatherNormal, vUv * 12.0).rgb);
  float roughness = texture2D(uLeatherRoughness, vUv * 8.0).r;
  
  // Micro-breathing displacement
  float breathe = sin(uTime * 0.3 + vWorldPos.x * 10.0) * 0.0002;
  normal += breathe * normal;
  
  vec3 foil = texture2D(uFoilMask, vUv).rgb;
  vec3 baseColor = mix(LEATHER_BASE, GOLD_FOIL, foil * 0.85);
  float metalness = foil.r * 0.95;
  roughness = mix(roughness, 0.05, foil.r * 0.9);
  
  // Lighting accumulation
  vec3 color = vec3(0.0);
  for (int i = 0; i < NUM_LIGHTS; i++) {
    vec3 L = lights[i].direction;
    float atten = lights[i].attenuation;
    color += leatherBRDF(normal, uViewDir, L, roughness) * lights[i].color * atten;
    color += subsurface(normal, uViewDir, L, 0.003) * lights[i].color * atten * 0.3;
  }
  
  // Rim gold catch
  float rim = pow(1.0 - max(dot(normal, uViewDir), 0.0), 3.0);
  color += GOLD_FOIL * rim * 0.12 * foil.r;
  
  // Ambient occlusion from spine curvature
  float ao = 1.0 - smoothstep(-0.08, 0.08, vWorldPos.x) * 0.3;
  color *= ao;
  
  gl_FragColor = vec4(color, 1.0);
}
```

### 2. Paper Shader (`PaperShader`) — *The soul of the book*

```glsl
// Double-sided, translucent, fiber-embedded, curl-aware

uniform sampler2D uPaperFibers;     // Procedural fiber noise (RGB = 3 octaves)
uniform sampler2D uContentMap;      // HTML-rendered page content
uniform sampler2D uWatermark;       // Subtle brand mark
uniform float uPageIndex;           // 0-7 for stack shadow
uniform float uCurlProgress;        // 0=flat, 1=fully turned
uniform vec3 uLightDir;
uniform float uTime;

const vec3 IVORY_BASE = vec3(0.961, 0.941, 0.910);  // #F5F0E8
const vec3 IVORY_EDGE = vec3(0.906, 0.878, 0.816);  // #E8E0D0
const vec3 FIBER_TINT = vec3(0.85, 0.82, 0.76);

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vCurl;        // 0-1 per vertex (curl deformation)
varying vec3 vTangent;      // For anisotropic highlights

float fiberNoise(vec2 uv, float scale) {
  vec3 n = texture2D(uPaperFibers, uv * scale).rgb;
  return (n.r * 0.5 + n.g * 0.3 + n.b * 0.2) * 0.02;
}

vec3 paperBRDF(vec3 N, vec3 V, vec3 L, float roughness, bool backface) {
  // Oren-Nayar for diffuse + micro-facet for sheen
  float NdL = max(dot(N, L), 0.0);
  float NdV = max(dot(N, V), 0.0);
  
  // Anisotropic sheen along fiber direction
  float aniso = max(dot(vTangent, L), 0.0) * 0.15;
  
  // Translucency (backface receives light)
  float trans = backface ? 0.18 * NdL : 0.0;
  
  return (NdL + aniso + trans) * (1.0 - roughness * 0.3);
}

void main() {
  // Base color with fiber variation
  float fibers = fiberNoise(vUv, 200.0) + fiberNoise(vUv * 3.0, 50.0) * 0.5;
  vec3 baseColor = mix(IVORY_BASE, IVORY_EDGE, fibers);
  
  // Watermark (barely visible)
  float mark = texture2D(uWatermark, vUv).r * 0.02;
  baseColor -= baseColor * mark;
  
  // Aging at edges
  float edgeDist = min(vUv.x, 1.0 - vUv.x);
  edgeDist = min(edgeDist, min(vUv.y, 1.0 - vUv.y));
  float aging = smoothstep(0.0, 0.04, edgeDist) * 0.08;
  baseColor = mix(baseColor, IVORY_EDGE, aging);
  
  // Content texture (rendered HTML)
  vec4 content = texture2D(uContentMap, vUv);
  
  // Curl-aware lighting
  bool isBack = vCurl > 0.5;
  vec3 N = isBack ? -vNormal : vNormal;
  float roughness = 0.85 + fibers * 0.1;
  
  vec3 lighting = paperBRDF(N, uViewDir, uLightDir, roughness, isBack);
  
  // Stack shadow (deeper pages = darker)
  float stackShadow = 1.0 - uPageIndex * 0.025;
  
  // Page curl gradient (visual thickness)
  float curlGradient = smoothstep(0.4, 0.6, vCurl) * 0.15;
  vec3 curlTint = isBack ? IVORY_EDGE * 0.6 : IVORY_BASE * 0.3;
  
  vec3 finalColor = (baseColor * lighting + content.rgb * 0.92) * stackShadow;
  finalColor += curlTint * curlGradient;
  finalColor += vec3(0.002) * sin(uTime * 0.5 + vWorldPos.y * 20.0); // Micro-shimmer
  
  // Alpha: content opacity + page body
  float alpha = isBack ? 0.98 : 1.0;
  if (content.a < 0.01) alpha = 1.0; // Blank areas = solid paper
  
  gl_FragColor = vec4(finalColor, alpha);
}
```

### 3. Gold Foil Shader (`GoldFoilShader`) — *Not yellow. Foil.*

```glsl
// Physically-based gold with microstructure

uniform sampler2D uFoilMicrostructure; // 4K scanned gold foil
uniform float uRotation;               // Anisotropic rotation

const vec3 GOLD_N = vec3(1.5, 0.9, 0.6);   // IOR real
const vec3 GOLD_K = vec3(1.8, 1.2, 0.8);   // IOR imag

vec3 goldFresnel(float cosTheta) {
  vec3 n = GOLD_N;
  vec3 k = GOLD_K;
  vec3 temp = (n - 1.0) * (n - 1.0) + k * k;
  vec3 temp2 = (n + 1.0) * (n + 1.0) + k * k;
  vec3 R0 = temp / temp2;
  return R0 + (1.0 - R0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
  vec3 micro = texture2D(uFoilMicrostructure, vUv * 50.0).rgb;
  vec3 N = perturbNormal(vNormal, micro, uRotation);
  
  float cosTheta = max(dot(N, uViewDir), 0.0);
  vec3 F = goldFresnel(cosTheta);
  
  // Anisotropic highlight
  float aniso = max(dot(vTangent, uViewDir), 0.0);
  float highlight = pow(aniso, 128.0) * 2.0;
  
  vec3 color = F + vec3(highlight);
  
  gl_FragColor = vec4(color, 1.0);
}
```

---

## ⚙️ Animation Choreography — "The Breath of the Book"

### Master Timeline (GSAP 3)

```javascript
// ============================================
// MASTER TIMELINE: Book Opening Sequence
// ============================================

const bookTL = gsap.timeline({
  defaults: { ease: "expo.out", duration: 1.2 },
  onComplete: () => enablePageInteractions()
});

// 0.0 - 0.15: Anticipation (book lifts slightly)
bookTL.to(bookGroup.position, { y: 0.12, duration: 0.15, ease: "power2.out" }, 0)
  .to(camera.position, { z: 3.2, y: 0.05, duration: 0.15 }, 0)

// 0.15 - 0.65: Cover opens (spring physics)
bookTL.to(coverFront.rotation, { 
    x: -Math.PI * 0.98, 
    duration: 1.1, 
    ease: "customSpring(1, 0.72)" // Custom: overshoot 8%, settle
  }, 0.15)
  .to(coverFront.position, { 
    x: -0.08, z: -0.02, y: 0.01,
    duration: 1.1, 
    ease: "customSpring(1, 0.72)" 
  }, 0.15)

// 0.3 - 0.8: Spine compression (pages fan)
bookTL.to(spine.scale, { 
    x: 0.92, 
    duration: 0.7, 
    ease: "power2.inOut" 
  }, 0.3)

// 0.4 - 1.2: Page cascade (staggered turn)
pages.forEach((page, i) => {
  const delay = 0.4 + i * 0.085;
  bookTL.to(page.curlUniform, { 
      value: 1.0, 
      duration: 0.9, 
      ease: "cubic.out" 
    }, delay)
    .to(page.rotation, { 
      x: -Math.PI * 0.02 * (i + 1), // Settle fan
      duration: 0.6, 
      ease: "power2.out" 
    }, delay + 0.5)
    .to(page.position, { 
      z: -0.008 * i, 
      duration: 0.6 
    }, delay + 0.5);
});

// 0.8 - 1.4: Content reveal (per page, staggered)
pages.forEach((page, i) => {
  const delay = 0.85 + i * 0.1;
  page.contentElements.forEach((el, j) => {
    bookTL.fromTo(el, 
      { opacity: 0, y: 30, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", 
        duration: 0.7, ease: "expo.out" },
      delay + j * 0.06
    );
  });
});

// 1.4 - 2.0: Settle + ambience enable
bookTL.to(dustSystem.uniforms.uActive, { value: 1, duration: 0.6 }, 1.4)
  .to(bookGroup.position, { y: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" }, 1.5)
  .call(() => enableIdleBreathing(), null, 2.0);
```

### Custom Easing Curves

```javascript
// Registered at app init
CustomEase.create("customSpring", "M0,0 C0.14,0.06 0.24,0.92 0.38,1.02 0.52,1.12 0.68,0.98 0.82,1 1,1");
// Overshoot to 1.02, settles with micro-wobble

CustomEase.create("pageTurn", "M0,0 C0.05,0 0.15,0.1 0.3,0.35 0.45,0.6 0.6,0.8 0.75,0.92 0.88,0.98 1,1");
// Slow start (inertia), accelerate, decelerate into lock

CustomEase.create("contentReveal", "M0,0 C0,0 0.15,0.05 0.3,0.25 0.5,0.6 0.7,0.88 0.85,0.97 1,1");
// Gentle S-curve for reading rhythm

CustomEase.create("magneticHover", "M0,0 C0.3,0 0.2,1 0.5,1 0.8,1 0.9,0.9 1,1");
// Snap-to with tiny rebound
```

### Idle Breathing Loop (6-DOF)

```javascript
function enableIdleBreathing() {
  gsap.to(bookGroup.rotation, {
    x: "random(-0.008, 0.008)",
    y: "random(-0.012, 0.012)",
    z: "random(-0.004, 0.004)",
    duration: "random(6, 10)",
    ease: "none",
    repeat: -1,
    yoyo: true,
    modifiers: {
      x: gsap.utils.unitize(gsap.utils.wrap(-0.008, 0.008)),
      y: gsap.utils.unitize(gsap.utils.wrap(-0.012, 0.012)),
      z: gsap.utils.unitize(gsap.utils.wrap(-0.004, 0.004)),
    }
  });
  
  gsap.to(bookGroup.position, {
    x: "random(-0.02, 0.02)",
    y: "random(-0.015, 0.015)",
    z: "random(-0.03, 0.03)",
    duration: "random(8, 14)",
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true
  });
  
  // Page flutter (subtle vertex displacement)
  pages.forEach((page, i) => {
    gsap.to(page.material.uniforms.uFlutter, {
      value: "random(0.002, 0.006)",
      duration: "random(3, 5)",
      ease: "none",
      repeat: -1,
      yoyo: true,
      delay: i * 0.3
    });
  });
  
  // Dust mote drift
  gsap.to(dustSystem.uniforms.uDrift, {
    value: "random(-0.001, 0.001)",
    duration: "random(20, 40)",
    ease: "none",
    repeat: -1,
    yoyo: true
  });
}
```

### Micro-Interactions

| Trigger | Response | Duration | Easing |
|---------|----------|----------|--------|
| **Hover book** | Magnetic pull toward cursor (max 15% screen) | 0.4s | `magneticHover` |
| **Hover page edge** | Curl preview (vertex displacement 0→0.3) | 0.2s | `power2.out` |
| **Click page edge** | Turn to next/prev page | 0.9s | `pageTurn` |
| **Scroll on page** | Content parallax (0.3x) + slight page tilt | Continuous | `none` (lerp) |
| **Focus input** | Page warms (subtle gold rim glow) | 0.3s | `expo.out` |
| **Reduced motion** | All animations → 0.01s, no parallax, static book | Instant | N/A |

---

## 📄 Page Content Architecture

### Page 1: Hero — "The Frontispiece"

```
┌─────────────────────────────────────────────┐
│                                             │
│        [Avatar: 3D sphere, gold rim]        │
│                   160px                     │
│                                             │
│         "ALEXANDER CHEN"                    │
│         Cormorant 600, 4.5rem               │
│                                             │
│    "Creative Technologist & Builder"        │
│    Fraunces 400, 1.5rem, gold-antique       │
│                                             │
│    ┌─────────────────────────────────┐      │
│    │  ◈  12+ Years  ◈  48 Shipped   │      │
│    │  ◈  3 Patents  ◈  2 Exits      │      │
│    └─────────────────────────────────┘      │
│         Space Grotesk 500, 0.9rem           │
│                                             │
│    [Turn page →]  (gold foil arrow, anim)   │
└─────────────────────────────────────────────┘
```

**Animation:** Avatar materializes from dust motes (0.8s). Name types letter-by-letter (0.04s/char). Stats count up (1.2s). Arrow pulses with breathing.

---

### Page 2: About — "The Preface"

```
┌─────────────────────────────────────────────┐
│  ABOUT                                      │
│  (Gold foil, debossed style)                │
├─────────────────────────────────────────────┤
│                                             │
│  I write code that feels like craft.        │
│  Typewriter: 0.035s/char, 1.2s delay        │
│                                             │
│  After a decade building systems at         │
│  [Stripe] [Figma] [Vercel], I now           │
│  help founders turn vision into             │
│  velocity.                                  │
│                                             │
│  ─────────────────────────────────          │
│                                             │
│  When not coding, you'll find me:           │
│  • Restoring a 1967 Leica M2                │
│  • Brewing single-origin pour-over          │
│  • Reading Jung on a park bench             │
│                                             │
│  [Speaking] [Writing] [Advising]            │
│  (Gold foil pills, magnetic hover)          │
└─────────────────────────────────────────────┘
```

**Animation:** Paragraphs reveal on scroll (IntersectionObserver). Gold pills magnetize to cursor.

---

### Page 3: Skills — "The Constellation"

```
┌─────────────────────────────────────────────┐
│  EXPERTISE                                  │
├─────────────────────────────────────────────┤
│                                             │
│     ┌─────────────────────────────────┐     │
│     │        WebGL / Three.js         │     │
│     │     ●●●●●○○○○○○  95%           │     │
│     │        React / R3F              │     │
│     │     ●●●●●●●○○○  90%            │     │
│     │        TypeScript               │     │
│     │     ●●●●●●●●○○  88%            │     │
│     │        Node / Go / Rust         │     │
│     │     ●●●●●●○○○○  80%            │     │
│     │        Design Systems           │     │
│     │     ●●●●●●●○○○  85%            │     │
│     └─────────────────────────────────┘     │
│                                             │
│     [Filter: ▼ All ▼ Frontend ▼ Backend    │
│              ▼ DevOps ▼ Design]             │
│                                             │
│     Orbit: drag to rotate constellation     │
│     (3D force-directed graph, WebGL)        │
└─────────────────────────────────────────────┘
```

**Interaction:** Skills as nodes in 3D force graph. Hover = node expands, shows projects using it. Drag = orbit camera. Filter = nodes pulse in/out.

---

### Page 4: Projects — "The Chapters"

```
┌─────────────────────────────────────────────┐
│  SELECTED WORK                              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  ██████████  │  │  ██████████  │        │
│  │  VOID        │  │  MERIDIAN    │        │
│  │  Design sys  │  │  Analytics   │        │
│  │  for teams   │  │  platform    │        │
│  │  [CaseStudy] │  │  [CaseStudy] │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  ██████████  │  │  ██████████  │        │
│  │  AETHER      │  │  FLUX        │        │
│  │  R3F engine  │  │  Motion lib  │        │
│  │  [GitHub]    │  │  [npm]       │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  [View All 12 →]  (Gold foil link)          │
└─────────────────────────────────────────────┘
```

**Animation:** Cards enter with staggered 3D flip (0.1s stagger). Hover = card lifts, thumbnail expands. Click = CaseStudy modal (full-screen, book-style).

---

### Page 5: Experience — "The Chronicle"

```
┌─────────────────────────────────────────────┐
│  JOURNEY                                    │
├─────────────────────────────────────────────┤
│                                             │
│  2024 ──┬── Founder / CTO  @  [AETHER LABS] │
│         │   → Raised $4.2M, team 0→18       │
│         │   → Shipped R3F engine v1.0       │
│         │                                    │
│  2021 ──┼── Staff Engineer @  [VERCEL]      │
│         │   → Next.js Core, Turborepo       │
│         │   → RFC: Server Components        │
│         │                                    │
│  2018 ──┼── Senior Eng @  [FIGMA]           │
│         │   → Multiplayer editing engine    │
│         │   → Plugin API v2                 │
│         │                                    │
│  2015 ──┴── Engineer @  [STRIPE]            │
│             → Connect onboarding            │
│             → Radar ML pipeline             │
│                                             │
│  [Timeline scrubs with scroll]              │
│  (Parallax: dates fixed, cards scroll)      │
└─────────────────────────────────────────────┘
```

**Interaction:** Vertical scroll within page texture. Dates on left (sticky), cards on right (parallax 0.3x). Hover card = subtle gold underline expands.

---

### Page 6: Contact — "The Colophon"

```
┌─────────────────────────────────────────────┐
│  LET'S BUILD                                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  alex@aetherlabs.io                 │   │
│  │  ████████████████████████  (copy)   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Calendar  →  cal.com/alexchen      │   │
│  │  ████████████████████████  (book)   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐             │
│  │GH│ │TW│ │LI│ │EM│ │GH│ │⋯ │             │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘             │
│   (Magnetic: orbit cursor, gold glow)      │
│                                             │
│  "Reply within 24 hours.                    │
│   Serious inquiries only."                  │
│                                             │
│  © 2025 Alexander Chen. Crafted with        │
│  [Three.js] [GSAP] [R3F] [Fraunces]         │
└─────────────────────────────────────────────┘
```

**Interaction:** Social icons orbit cursor (magnetic, 80px radius). Click = copy/link with gold ripple. Email = copy-to-clipboard toast (gold foil style).

---

## 📐 Responsive Breakpoint Strategy

| Breakpoint | Book Scale | Camera | Interaction | Content |
|------------|------------|--------|-------------|---------|
| **≥1440px** (Desktop XL) | 1.0x | Full 3D | All | Full |
| **1024-1439px** (Desktop) | 0.9x | Full 3D | All | Full |
| **768-1023px** (Tablet) | 0.75x | Reduced parallax | Touch swipe pages | Condensed |
| **480-767px** (Mobile) | 0.6x | Fixed cam, no parallax | Tap edges, swipe | Stacked |
| **<480px** (Mobile S) | 0.5x | Ortho cam option | Simplified | Linear scroll fallback |

**Mobile Fallback (Progressive Enhancement):**
- `< 768px`: Static book hero (WebGL snapshot) + traditional scroll pages
- `< 480px`: Pure HTML/CSS version, no WebGL
- `prefers-reduced-motion`: Static hero, instant page transitions, no floating

---

## ♿ Accessibility — "Universal by Design"

### Reduced Motion (`@media (prefers-reduced-motion: reduce)`)

```css
/* All animations → 0.01s */
.book-3d * { 
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}

/* Static book posture */
.book-group { 
  transform: none !important; 
}

/* Instant page transitions */
.page { 
  opacity: 1 !important; 
  transform: none !important; 
}

/* Content all visible */
.page-content { 
  opacity: 1 !important; 
  transform: none !important; 
}
```

### Screen Reader Support

- **ARIA Structure:** `<article role="book">` with `<section role="page" aria-label="Page 1: Hero">`
- **Live Regions:** Page announcements (`aria-live="polite"`)
- **Keyboard Nav:** `←/→` = prev/next page, `↑/↓` = scroll page content, `Enter` = activate link
- **Focus Visible:** Gold foil outline (3px, offset 2px) on all interactive elements
- **Alt Text:** Every 3D element has text equivalent in SR-only DOM

### Color Contrast

| Element | Foreground | Background | Ratio | WCAG |
|---------|------------|------------|-------|------|
| Body text | `#1A1A1A` | `#F5F0E8` | 12.8:1 | AAA |
| Gold text | `#C9A84C` | `#F5F0E8` | 3.2:1 | AA Large |
| Gold text | `#E8C56D` | `#0D0D0D` | 8.1:1 | AAA |
| UI labels | `#4A4A4A` | `#F5F0E8` | 7.4:1 | AAA |

---

## 🗂️ Implementation Roadmap

### File Structure

```
folio-book/
├── public/
│   ├── assets/
│   │   ├── textures/
│   │   │   ├── leather-normal-4k.exr
│   │   │   ├── leather-roughness-4k.exr
│   │   │   ├── gold-foil-micro-4k.exr
│   │   │   ├── paper-fibers-2k.png
│   │   │   ├── watermark-logo.png
│   │   │   └── hdri/
│   │   │       └── library-study-4k.hdr
│   │   ├── fonts/
│   │   │   ├── CormorantGaramond-VF.woff2
│   │   │   ├── Fraunces-VF.woff2
│   │   │   ├── SpaceGrotesk-VF.woff2
│   │   │   └── JetBrainsMono-VF.woff2
│   │   └── models/
│   │       └── book-page-uv.glb
│   └── manifest.json
│
├── src/
│   ├── components/
│   │   ├── Book/
│   │   │   ├── Book.tsx                 # Main orchestrator
│   │   │   ├── BookCanvas.tsx           # R3F canvas wrapper
│   │   │   ├── BookGroup.tsx            # 3D scene graph
│   │   │   ├── Cover/
│   │   │   │   ├── CoverFront.tsx
│   │   │   │   ├── CoverBack.tsx
│   │   │   │   ├── Spine.tsx
│   │   │   │   └── FoilStamping.tsx
│   │   │   ├── Pages/
│   │   │   │   ├── PageStack.tsx
│   │   │   │   ├── Page.tsx
│   │   │   │   ├── PageContent.tsx      # HTML texture portal
│   │   │   │   ├── HeroPage.tsx
│   │   │   │   ├── AboutPage.tsx
│   │   │   │   ├── SkillsPage.tsx
│   │   │   │   ├── ProjectsPage.tsx
│   │   │   │   ├── ExperiencePage.tsx
│   │   │   │   └── ContactPage.tsx
│   │   │   ├── Particles/
│   │   │   │   ├── DustSystem.tsx
│   │   │   │   └── DustShader.ts
│   │   │   ├── Ribbons/
│   │   │   │   └── PageMarkers.tsx
│   │   │   └── PostProcessing/
│   │   │       └── EffectsComposer.tsx
│   │   │
│   │   ├── UI/
│   │   │   ├── MagneticButton.tsx
│   │   │   ├── GoldPill.tsx
│   │   │   ├── ConstellationGraph.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── SocialOrbit.tsx
│   │   │   └── CopyToast.tsx
│   │   │
│   │   └── Fallback/
│   │       ├── StaticBook.tsx
│   │       ├── LinearPages.tsx
│   │       └── NoScriptNotice.tsx
│   │
│   ├── hooks/
│   │   ├── useBookPhysics.ts
│   │   ├── usePageTurn.ts
│   │   ├── useMagnetic.ts
│   │   ├── useReducedMotion.ts
│   │   ├── useScrollParallax.ts
│   │   └── useTextureContent.ts
│   │
│   ├── shaders/
│   │   ├── LeatherShader.ts
│   │   ├── PaperShader.ts
│   │   ├── GoldFoilShader.ts
│   │   ├── DustShader.ts
│   │   └── chunks/
│   │       ├── brdf.glsl
│   │       ├── noise.glsl
│   │       └── curl.glsl
│   │
│   ├── animations/
│   │   ├── bookTimeline.ts
│   │   ├── idleBreathing.ts
│   │   ├── pageTurn.ts
│   │   ├── contentReveal.ts
│   │   ├── magnetic.ts
│   │   └── easings.ts
│   │
│   ├── data/
│   │   ├── profile.ts          # User config (single source of truth)
│   │   ├── skills.ts
│   │   ├── projects.ts
│   │   ├── experience.ts
│   │   └── social.ts
│   │
│   ├── utils/
│   │   ├── htmlToTexture.ts    # html2canvas → Three.js texture
│   │   ├── fontLoader.ts
│   │   ├── assetLoader.ts
│   │   └── performance.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── tokens.css
│   │   ├── typography.css
│   │   └── fallback.css
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   │
│   └── middleware.ts
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── README.md
```

### Phase Breakdown

| Phase | Duration | Deliverable | Dependencies |
|-------|----------|-------------|--------------|
| **0: Foundation** | 3 days | Repo, deps, CI, font loading, theme tokens | None |
| **1: 3D Core** | 7 days | Book geometry, materials, lighting, camera | Phase 0 |
| **2: Page System** | 5 days | Page stack, curl shader, HTML→texture pipeline | Phase 1 |
| **3: Animations** | 5 days | Master timeline, page turns, idle breathing | Phase 2 |
| **4: Page Content** | 8 days | 6 page components, data binding, interactions | Phase 2 |
| **5: Micro-Interactions** | 4 days | Magnetic, hover, scroll, focus states | Phase 3 |
| **6: Post-Processing** | 3 days | Bloom, tone mapping, grain, vignette | Phase 1 |
| **7: Fallbacks** | 3 days | Static hero, linear pages, reduced motion | Phase 4 |
| **8: Performance** | 4 days | LOD, texture streaming, mobile profiling | Phase 5 |
| **9: Polish** | 5 days | Bug fixes, cross-browser, accessibility audit | Phase 8 |
| **10: Docs/Deploy** | 2 days | README, config guide, Vercel deploy | Phase 9 |

**Total: ~49 working days (≈10 weeks solo, 6 weeks pair)**

---

## 🎯 Quality Gates (Definition of Done)

### Performance Budgets

| Metric | Target | Tool |
|--------|--------|------|
| **Initial Load** | < 2.5s (3G) | Lighthouse |
| **TTI** | < 3.5s | Lighthouse |
| **FPS (desktop)** | 60fps sustained | Chrome DevTools |
| **FPS (mobile)** | 50fps sustained | Chrome DevTools |
| **Memory (mobile)** | < 150MB | DevTools Memory |
| **Bundle (JS)** | < 180KB gzipped | webpack-bundle-analyzer |
| **Bundle (WASM/shaders)** | < 120KB | Custom |

### Visual Regression

- Percy/Chromatic snapshots at each breakpoint
- Golden master images for: closed, opening, each page, mobile fallback
- Shader variation tests (-leather wear, paper aging, gold patina)

### Accessibility Audit

- axe-core: 0 violations
- Manual keyboard nav: 100% coverage
- Screen reader (NVDA/VoiceOver): All content reachable
- Color contrast: All text ≥ AA (AAA for body)
- Reduced motion: Verified at OS level

---

## 💎 The "Twenty Thousand Dollar" Details

These are the details that separate craft from commodity:

1. **Leather breathes** — The cover normal map has *actual scanned leather pores*. Not procedural. Scanned from a 1920s bookbinding.

2. **Gold catches**3. **Paper has memory** — When a page turns, the curl *lingers* at the edge for 200ms before relaxing. Real paper doesn't snap flat.

4. **Dust motes are physical** — They respond to the book's movement (subtle turbulence). Shine a light (cursor) and they catch it.

5. **The spine has character** — Five raised bands. Gold tooling on each. The title reads *bottom to top* (traditional).

6. **Endpapers exist** — Two blank ivory pages at front/back. Slightly thicker. Marbled pattern option.

7. **Page edges are gilded** — Not a texture. Actual geometry: 0.8mm bevel with gold foil material. Catches light when fanned.

8. **Ribbon markers** — Three silk ribbons (gold, accent, ivory). Physics-simulated. They fall naturally when book opens.

9. **Type breathes** — Fraunces `SOFT` axis animates: 0 (sharp) → 25 (warm) → 0 as page turns. Sub-human, felt not seen.

10. **Content renders to texture** — Not HTML overlay. Actual page texture. Lighting hits the *text*. Shadows fall *on* the words.

11. **No loading spinner** — Assets stream. Book appears as "ghost" (wireframe → shaded → textured → detailed). Perceived instant.

12. **Respects the reader** — `prefers-reduced-motion` isn't a toggle. It's a *different experience* designed with equal care.

---

## 🚀 Getting Started (For the Implementer)

```bash
# 1. Clone & install
git clone <repo> folio-book
cd folio-book
pnpm install

# 2. Configure your data
cp src/data/profile.example.ts src/data/profile.ts
# Edit: name, title, bio, skills, projects, experience, social, accentColor

# 3. Add assets (textures, fonts, HDRI)
# Place in public/assets/ per file structure

# 4. Develop
pnpm dev        # localhost:3000
pnpm dev:storybook  # Component isolation

# 5. Build & deploy
pnpm build
pnpm deploy     # Vercel (configured)
```

---

## 📜 License & Credits

**Design & Specification:** Crafted for the folio-book template system  
**Fonts:** Cormorant Garamond (SIL OFL), Fraunces (SIL OFL), Space Grotesk (SIL OFL), JetBrains Mono (SIL OFL)  
**HDRI:** Poly Haven (CC0) — *library_study_4k.hdr*  
**Leather Scan:** Custom commission (included in assets)  
**Gold Foil Microstructure:** Custom scan (included in assets)  

**Built with:** React 18, Next.js 14, React Three Fiber, Drei, GSAP 3, Tailwind CSS, TypeScript

---

> *"A book is a device to ignite the imagination."* — Alan Bennett  
> *This book ignites careers.*

---

**End of Specification v1.0**  
*Questions? The design lives in the code. Build it.*