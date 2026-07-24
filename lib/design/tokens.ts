/**
 * Unool Design System Tokens
 * Technical Minimal + Warm Accent — for dev-founders
 *
 * Palette: Near-black / Near-white base + Electric Cyan accent
 * Typography: Geist (display) + Geist Mono (UI) — variable fonts
 * Motion: Spring-based, fast (150-250ms), reduced-motion aware
 */

// ============================================================
// COLOR TOKENS (OKLCH for perceptual uniformity)
// ============================================================

export const colors = {
  // Base neutrals (near-black / near-white, not pure)
  neutral: {
    50:  'oklch(0.985 0.002 247.8)',   // Near-white
    100: 'oklch(0.97  0.003 247.8)',
    200: 'oklch(0.93  0.006 247.8)',
    300: 'oklch(0.88  0.01  247.8)',
    400: 'oklch(0.72  0.02  247.8)',
    500: 'oklch(0.55  0.02  247.8)',   // Muted text
    600: 'oklch(0.42  0.02  247.8)',
    700: 'oklch(0.32  0.02  247.8)',
    800: 'oklch(0.22  0.02  247.8)',
    900: 'oklch(0.12  0.02  247.8)',   // Near-black
    950: 'oklch(0.08  0.01  247.8)',   // Deepest
  },

  // Electric Cyan - primary brand accent
  primary: {
    50:  'oklch(0.96  0.04  195)',
    100: 'oklch(0.92  0.08  195)',
    200: 'oklch(0.85  0.12  195)',
    300: 'oklch(0.75  0.15  195)',
    400: 'oklch(0.65  0.18  195)',
    500: 'oklch(0.60  0.20  195)',   // Main accent
    600: 'oklch(0.52  0.18  195)',
    700: 'oklch(0.42  0.15  195)',
    800: 'oklch(0.32  0.12  195)',
    900: 'oklch(0.25  0.10  195)',
    DEFAULT: 'oklch(0.60 0.20 195)',
    foreground: 'oklch(0.985 0.002 247.8)',
  },
  // Electric Purple - secondary brand accent (3D/premium feel)
  purple: {
    50:  'oklch(0.96  0.04  295)',
    100: 'oklch(0.92  0.08  295)',
    200: 'oklch(0.85  0.12  295)',
    300: 'oklch(0.75  0.15  295)',
    400: 'oklch(0.65  0.18  295)',
    500: 'oklch(0.62  0.22  295)',
    600: 'oklch(0.54  0.20  295)',
    700: 'oklch(0.44  0.17  295)',
    800: 'oklch(0.34  0.14  295)',
    900: 'oklch(0.26  0.11  295)',
    DEFAULT: 'oklch(0.62 0.22 295)',
    foreground: 'oklch(0.985 0.002 247.8)',
  },

  // Warm amber - success/positive
  success: {
    500: 'oklch(0.68 0.16 85)',
    600: 'oklch(0.58 0.14 85)',
    DEFAULT: 'oklch(0.68 0.16 85)',
    foreground: 'oklch(0.985 0.002 247.8)',
  },

  // Warm red - destructive/error
  destructive: {
    500: 'oklch(0.58 0.22 25)',
    600: 'oklch(0.48 0.20 25)',
    DEFAULT: 'oklch(0.58 0.22 25)',
    foreground: 'oklch(0.985 0.002 247.8)',
  },

  // Warning amber
  warning: {
    500: 'oklch(0.75 0.18 75)',
    600: 'oklch(0.65 0.16 75)',
    DEFAULT: 'oklch(0.75 0.18 75)',
    foreground: 'oklch(0.12 0.02 247.8)',
  },

  // Semantic mappings for light mode
  light: {
    background: 'oklch(0.985 0.002 247.8)',
    foreground: 'oklch(0.12 0.02 247.8)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.12 0.02 247.8)',
    popover: 'oklch(1 0 0)',
    popoverForeground: 'oklch(0.12 0.02 247.8)',
    primary: 'oklch(0.60 0.20 195)',
    primaryForeground: 'oklch(0.985 0.002 247.8)',
    purple: 'oklch(0.62 0.22 295)',
    purpleForeground: 'oklch(0.985 0.002 247.8)',
    secondary: 'oklch(0.93 0.006 247.8)',
    secondaryForeground: 'oklch(0.22 0.02 247.8)',
    muted: 'oklch(0.93 0.006 247.8)',
    mutedForeground: 'oklch(0.42 0.02 247.8)',
    accent: 'oklch(0.93 0.006 247.8)',
    accentForeground: 'oklch(0.22 0.02 247.8)',
    destructive: 'oklch(0.58 0.22 25)',
    destructiveForeground: 'oklch(0.985 0.002 247.8)',
    border: 'oklch(0.88 0.01 247.8)',
    input: 'oklch(0.88 0.01 247.8)',
    ring: 'oklch(0.60 0.20 195)',
    success: 'oklch(0.58 0.14 85)',
    successForeground: 'oklch(0.985 0.002 247.8)',
    warning: 'oklch(0.75 0.18 75)',
    warningForeground: 'oklch(0.12 0.02 247.8)',
  },

  // Semantic mappings for dark mode
  dark: {
    background: 'oklch(0.08 0.01 247.8)',
    foreground: 'oklch(0.985 0.002 247.8)',
    card: 'oklch(0.12 0.02 247.8)',
    cardForeground: 'oklch(0.985 0.002 247.8)',
    popover: 'oklch(0.12 0.02 247.8)',
    popoverForeground: 'oklch(0.985 0.002 247.8)',
    primary: 'oklch(0.65 0.18 195)',
    primaryForeground: 'oklch(0.08 0.01 247.8)',
    purple: 'oklch(0.70 0.20 295)',
    purpleForeground: 'oklch(0.08 0.01 247.8)',
    secondary: 'oklch(0.18 0.02 247.8)',
    secondaryForeground: 'oklch(0.93 0.006 247.8)',
    muted: 'oklch(0.18 0.02 247.8)',
    mutedForeground: 'oklch(0.65 0.02 247.8)',
    accent: 'oklch(0.18 0.02 247.8)',
    accentForeground: 'oklch(0.93 0.006 247.8)',
    destructive: 'oklch(0.52 0.20 25)',
    destructiveForeground: 'oklch(0.985 0.002 247.8)',
    border: 'oklch(0.22 0.02 247.8)',
    input: 'oklch(0.22 0.02 247.8)',
    ring: 'oklch(0.65 0.18 195)',
    success: 'oklch(0.68 0.16 85)',
    successForeground: 'oklch(0.08 0.01 247.8)',
    warning: 'oklch(0.75 0.18 75)',
    warningForeground: 'oklch(0.08 0.01 247.8)',
  },
} as const;

// ============================================================
// TYPOGRAPHY TOKENS
// ============================================================

export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',     // Geist Variable
    mono: 'var(--font-mono)',     // Geist Mono Variable
    display: 'var(--font-display)', // Geist Variable (same, but different weight tracking)
  },

  fontSize: {
    // Fluid type scale using clamp()
    // Mobile first, scales up at 640px, 1024px, 1280px
    xs:    ['clamp(0.70rem, 0.68rem + 0.10vw, 0.75rem)', { lineHeight: '1.5', letterSpacing: '0.02em' }],
    sm:    ['clamp(0.81rem, 0.78rem + 0.15vw, 0.875rem)', { lineHeight: '1.5', letterSpacing: '0.01em' }],
    base:  ['clamp(0.94rem, 0.90rem + 0.20vw, 1rem)', { lineHeight: '1.6', letterSpacing: '0' }],
    lg:    ['clamp(1.06rem, 1.00rem + 0.30vw, 1.125rem)', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
    xl:    ['clamp(1.25rem, 1.15rem + 0.50vw, 1.375rem)', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
    '2xl': ['clamp(1.50rem, 1.35rem + 0.75vw, 1.75rem)', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
    '3xl': ['clamp(1.88rem, 1.65rem + 1.15vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
    '4xl': ['clamp(2.25rem, 1.90rem + 1.75vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.03em' }],
    '5xl': ['clamp(3rem, 2.5rem + 2.5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.1',
    snug: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  letterSpacing: {
    tighter: '-0.03em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
    widest: '0.04em',
  },
} as const;

// ============================================================
// SPACING TOKENS (4px base, fluid at larger sizes)
// ============================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  // Fluid section spacing
  section: {
    sm: 'clamp(2rem, 1.5rem + 2.5vw, 3.5rem)',
    md: 'clamp(3rem, 2rem + 5vw, 5rem)',
    lg: 'clamp(4rem, 3rem + 5vw, 7rem)',
    xl: 'clamp(6rem, 4rem + 10vw, 10rem)',
  },
} as const;

// ============================================================
// BORDER RADIUS TOKENS
// ============================================================

export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px - buttons, badges
  md: '0.375rem',   // 6px - inputs, cards
  lg: '0.5rem',     // 8px - cards, modals
  xl: '0.75rem',    // 12px - large cards
  '2xl': '1rem',    // 16px - hero sections
  '3xl': '1.5rem',  // 24px - feature cards
  full: '9999px',   // pills, avatars
} as const;

// ============================================================
// SHADOW / ELEVATION TOKENS
// ============================================================

export const shadows = {
  // Subtle, layered shadows for depth
  xs: '0 1px 2px 0 oklch(0.12 0.02 247.8 / 0.05)',
  sm: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08), 0 1px 2px -1px oklch(0.12 0.02 247.8 / 0.06)',
  md: '0 4px 6px -1px oklch(0.12 0.02 247.8 / 0.08), 0 2px 4px -2px oklch(0.12 0.02 247.8 / 0.05)',
  lg: '0 10px 15px -3px oklch(0.12 0.02 247.8 / 0.08), 0 4px 6px -4px oklch(0.12 0.02 247.8 / 0.05)',
  xl: '0 20px 25px -5px oklch(0.12 0.02 247.8 / 0.08), 0 8px 10px -6px oklch(0.12 0.02 247.8 / 0.05)',
  '2xl': '0 25px 50px -12px oklch(0.12 0.02 247.8 / 0.12)',
  inner: 'inset 0 2px 4px 0 oklch(0.12 0.02 247.8 / 0.05)',
  // Glow variants for primary accent
  glow: '0 0 0 1px oklch(0.60 0.20 195 / 0.3), 0 0 20px oklch(0.60 0.20 195 / 0.15)',
  glowLg: '0 0 0 1px oklch(0.60 0.20 195 / 0.3), 0 0 40px oklch(0.60 0.20 195 / 0.2)',
  // Colored shadows for interactive states
  primary: '0 4px 14px 0 oklch(0.60 0.20 195 / 0.25)',
  success: '0 4px 14px 0 oklch(0.68 0.16 85 / 0.25)',
  destructive: '0 4px 14px 0 oklch(0.58 0.22 25 / 0.25)',
} as const;

// ============================================================
// MOTION TOKENS (Framer Motion spring presets)
// ============================================================

export const motion = {
  // Spring configurations
  springs: {
    // Fast, snappy - for buttons, toggles, small UI
    snappy: { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 },
    // Standard - for cards, panels, modals
    standard: { type: 'spring', stiffness: 400, damping: 28, mass: 1 },
    // Gentle - for page transitions, large elements
    gentle: { type: 'spring', stiffness: 300, damping: 25, mass: 1.2 },
    // Bouncy - for celebrations, success states
    bouncy: { type: 'spring', stiffness: 450, damping: 20, mass: 1 },
    // Smooth - for drag, hover
    smooth: { type: 'spring', stiffness: 350, damping: 30, mass: 1 },
    // Magnetic - for cursor-follow, attraction effects (stiff, responsive)
    magnetic: { type: 'spring', stiffness: 600, damping: 35, mass: 0.6 },
    // Orbital - for ambient, floating, orbiting elements (loose, organic)
    orbital: { type: 'spring', stiffness: 200, damping: 15, mass: 2 },
  },

  // Duration-based (for simpler animations)
  durations: {
    instant: 0.05,
    fast: 0.12,
    normal: 0.18,
    slow: 0.25,
    slower: 0.35,
    page: 0.5,
  },

  // Easings
  easings: {
    easeOut: [0.25, 0.46, 0.45, 0.94],
    easeIn: [0.55, 0.06, 0.68, 0.19],
    easeInOut: [0.42, 0, 0.58, 1],
    // Custom cubic-bezier for brand feel
    brand: [0.34, 1.56, 0.64, 1],
    // Expo - smooth exponential deceleration
    expo: [0.16, 1, 0.3, 1],
    // Anticipation - overshoot with anticipation
    anticipation: [0.68, -0.55, 0.27, 1.55],
  },

  // Stagger delays
  stagger: {
    fast: 0.03,
    normal: 0.06,
    slow: 0.1,
    cascade: 0.08,
  },
} as const;

// ============================================================
// Z-INDEX SCALE
// ============================================================

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  header: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  toast: 1600,
  max: 2147483647,
} as const;

// ============================================================
// BREAKPOINTS (matching Tailwind)
// ============================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================
// CARD VARIANTS (25+ distinct styles)
// ============================================================

export type CardVariant =
  | 'default'          // Standard elevated card
  | 'outlined'         // Border only, no shadow
  | 'filled'           // Filled background, no border
  | 'glass'            // Glassmorphism (backdrop-blur)
  | 'gradient-border'  // Animated gradient border
  | 'elevated'         // Strong shadow, hover lift
  | 'interactive'      // Hover/tap feedback, cursor pointer
  | 'metric'           // KPI display: large number + label
  | 'stat'             // Compact stat row
  | 'profile'          // User/profile card
  | 'link'             // Link card (external)
  | 'feature'          // Feature showcase
  | 'pricing'          // Pricing tier
  | 'testimonial'      // Quote + avatar
  | 'post'             // Social post preview
  | 'draft'            // Draft/post editor
  | 'analytics'        // Chart container
  | 'activity'         // Activity feed item
  | 'notification'     // Notification item
  | 'empty'            // Empty state illustration
  | 'loading'          // Skeleton loader
  | 'error'            // Error state
  | 'success'          // Success confirmation
  | 'warning'          // Warning banner
  | 'onboarding';      // Onboarding step

export const cardVariants: Record<CardVariant, {
  background: string;
  border: string;
  shadow: string;
  hover?: string;
  padding: string;
  radius: string;
}> = {
  default:     { background: 'var(--card)', border: 'var(--border)', shadow: 'var(--shadow-sm)', padding: '1.5rem', radius: 'var(--radius-lg)' },
  outlined:    { background: 'transparent', border: '1px solid var(--border)', shadow: 'none', padding: '1.5rem', radius: 'var(--radius-lg)' },
  filled:      { background: 'var(--muted)', border: 'none', shadow: 'none', padding: '1.5rem', radius: 'var(--radius-lg)' },
  glass:       { background: 'var(--card/80)', border: '1px solid var(--border/50)', shadow: 'var(--shadow-lg)', padding: '1.5rem', radius: 'var(--radius-xl)', hover: 'backdrop-blur-sm' },
  'gradient-border': { background: 'var(--card)', border: '1px solid transparent', shadow: 'var(--shadow-md)', padding: '1.5rem', radius: 'var(--radius-xl)', hover: 'bg-gradient-to-r from-primary/20 to-primary/5' },
  elevated:    { background: 'var(--card)', border: 'none', shadow: 'var(--shadow-xl)', padding: '1.5rem', radius: 'var(--radius-xl)', hover: 'shadow-2xl -translate-y-1 transition-shadow duration-300' },
  interactive: { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-sm)', padding: '1.5rem', radius: 'var(--radius-lg)', hover: 'shadow-lg border-primary/50 transition-all duration-200 cursor-pointer' },
  metric:      { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-sm)', padding: '1.5rem', radius: 'var(--radius-xl)' },
  stat:        { background: 'var(--muted/50)', border: '1px solid var(--border)', shadow: 'none', padding: '1rem', radius: 'var(--radius-md)' },
  profile:     { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-md)', padding: '2rem', radius: 'var(--radius-2xl)' },
  link:        { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-sm)', padding: '1rem 1.5rem', radius: 'var(--radius-lg)', hover: 'border-primary/50 bg-primary/5 transition-colors' },
  feature:     { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-md)', padding: '2rem', radius: 'var(--radius-2xl)' },
  pricing:     { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-lg)', padding: '2rem', radius: 'var(--radius-2xl)' },
  testimonial: { background: 'var(--muted/50)', border: '1px solid var(--border)', shadow: 'var(--shadow-sm)', padding: '1.5rem', radius: 'var(--radius-xl)' },
  post:        { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-sm)', padding: '1.5rem', radius: 'var(--radius-xl)' },
  draft:       { background: 'var(--muted)', border: '1px dashed var(--border)', shadow: 'none', padding: '1.5rem', radius: 'var(--radius-lg)' },
  analytics:   { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-md)', padding: '1.5rem', radius: 'var(--radius-xl)' },
  activity:    { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-sm)', padding: '1rem 1.5rem', radius: 'var(--radius-lg)' },
  notification:{ background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-lg)', padding: '1rem 1.5rem', radius: 'var(--radius-lg)' },
  empty:       { background: 'transparent', border: 'none', shadow: 'none', padding: '3rem', radius: 'var(--radius-2xl)' },
  loading:     { background: 'var(--muted)', border: 'none', shadow: 'none', padding: '1.5rem', radius: 'var(--radius-lg)' },
  error:       { background: 'var(--destructive/10)', border: '1px solid var(--destructive/30)', shadow: 'none', padding: '1.5rem', radius: 'var(--radius-lg)' },
  success:     { background: 'var(--success/10)', border: '1px solid var(--success/30)', shadow: 'none', padding: '1.5rem', radius: 'var(--radius-lg)' },
  warning:     { background: 'var(--warning/10)', border: '1px solid var(--warning/30)', shadow: 'none', padding: '1.5rem', radius: 'var(--radius-lg)' },
  onboarding:  { background: 'var(--card)', border: '1px solid var(--border)', shadow: 'var(--shadow-xl)', padding: '2.5rem', radius: 'var(--radius-2xl)' },
};

// ============================================================
// PROFILE THEMES (5 distinct, not just color swaps)
// ============================================================

export type ProfileTheme = 'minimal' | 'bold' | 'corporate' | 'creative' | 'technical';

export const profileThemes: Record<ProfileTheme, {
  name: string;
  description: string;
  background: string;
  text: string;
  accent: string;
  border: string;
  cardBg: string;
  cardBorder: string;
  linkStyle: 'underline' | 'pill' | 'card' | 'icon-only' | 'badge';
  proofStyle: 'cards' | 'badges' | 'list' | 'metrics' | 'ticker';
  fontPairing: { display: string; ui: string };
  radius: string;
  shadow: string;
  spacing: 'compact' | 'normal' | 'generous';
}> = {
  minimal: {
    name: 'Minimal',
    description: 'Clean, whitespace-driven, content-first',
    background: 'oklch(0.985 0.002 247.8)',
    text: 'oklch(0.12 0.02 247.8)',
    accent: 'oklch(0.60 0.20 195)',
    border: 'oklch(0.88 0.01 247.8)',
    cardBg: 'oklch(1 0 0)',
    cardBorder: 'oklch(0.88 0.01 247.8)',
    linkStyle: 'underline',
    proofStyle: 'list',
    fontPairing: { display: 'Geist, sans-serif', ui: 'Geist, sans-serif' },
    radius: '0.375rem',
    shadow: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08)',
    spacing: 'generous',
  },
  bold: {
    name: 'Bold',
    description: 'High contrast, strong hierarchy, confident',
    background: 'oklch(0.08 0.01 247.8)',
    text: 'oklch(0.985 0.002 247.8)',
    accent: 'oklch(0.65 0.18 195)',
    border: 'oklch(0.22 0.02 247.8)',
    cardBg: 'oklch(0.12 0.02 247.8)',
    cardBorder: 'oklch(0.18 0.02 247.8)',
    linkStyle: 'pill',
    proofStyle: 'metrics',
    fontPairing: { display: 'Geist, sans-serif', ui: 'Geist Mono, monospace' },
    radius: '0.5rem',
    shadow: '0 10px 25px -5px oklch(0 0 0 / 0.3)',
    spacing: 'normal',
  },
  corporate: {
    name: 'Corporate',
    description: 'Professional, trustworthy, structured',
    background: 'oklch(0.97 0.005 240)',
    text: 'oklch(0.25 0.02 240)',
    accent: 'oklch(0.45 0.15 240)',
    border: 'oklch(0.85 0.01 240)',
    cardBg: 'oklch(1 0 0)',
    cardBorder: 'oklch(0.85 0.01 240)',
    linkStyle: 'card',
    proofStyle: 'cards',
    fontPairing: { display: 'Geist, sans-serif', ui: 'Geist, sans-serif' },
    radius: '0.5rem',
    shadow: '0 4px 6px -1px oklch(0.25 0.02 240 / 0.1)',
    spacing: 'normal',
  },
  creative: {
    name: 'Creative',
    description: 'Expressive, asymmetric, playful',
    background: 'oklch(0.98 0.01 330)',
    text: 'oklch(0.15 0.02 330)',
    accent: 'oklch(0.55 0.22 330)',
    border: 'oklch(0.90 0.03 330)',
    cardBg: 'oklch(1 0 0)',
    cardBorder: 'oklch(0.90 0.03 330)',
    linkStyle: 'icon-only',
    proofStyle: 'badges',
    fontPairing: { display: 'Geist, sans-serif', ui: 'Geist, sans-serif' },
    radius: '1rem',
    shadow: '0 8px 20px -5px oklch(0.55 0.22 330 / 0.15)',
    spacing: 'generous',
  },
  technical: {
    name: 'Technical',
    description: 'Monospace, terminal aesthetic, precise',
    background: 'oklch(0.09 0.01 150)',
    text: 'oklch(0.92 0.02 150)',
    accent: 'oklch(0.65 0.18 150)',
    border: 'oklch(0.18 0.02 150)',
    cardBg: 'oklch(0.12 0.01 150)',
    cardBorder: 'oklch(0.18 0.02 150)',
    linkStyle: 'badge',
    proofStyle: 'ticker',
    fontPairing: { display: 'Geist Mono, monospace', ui: 'Geist Mono, monospace' },
    radius: '0.25rem',
    shadow: '0 0 0 1px oklch(0.65 0.18 150 / 0.2), 0 4px 12px oklch(0 0 0 / 0.3)',
    spacing: 'compact',
  },
};

// ============================================================
// 3D PRIMITIVES CONFIGURATION
// ============================================================

export const threeDPrimitives = {
  // TiltCard - Subtle 3D tilt on hover/touch
  TiltCard: {
    maxTilt: 8,
    perspective: 1000,
    scale: 1.02,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    glare: true,
    maxGlare: 0.15,
  },

  // MagneticCard - Cursor attraction effect
  MagneticCard: {
    strength: 0.3,
    radius: 120,
    transition: { type: 'spring', stiffness: 600, damping: 35, mass: 0.6 },
    scale: 1.03,
  },

  // OrbitalBackground - Floating orbital elements
  OrbitalBackground: {
    particleCount: 20,
    orbits: 3,
    speed: { min: 0.0005, max: 0.002 },
    size: { min: 2, max: 8 },
    colors: ['oklch(0.60 0.20 195 / 0.4)', 'oklch(0.62 0.22 295 / 0.4)', 'oklch(0.68 0.16 85 / 0.3)'],
    connectLines: true,
    maxDistance: 150,
  },

  // MorphingBlob - Organic shape morphing
  MorphingBlob: {
    points: 8,
    complexity: 0.4,
    speed: 0.3,
    colors: ['oklch(0.60 0.20 195)', 'oklch(0.62 0.22 295)'],
    blur: 60,
    opacity: 0.5,
  },

  // PerspectiveFlip - 3D card flip
  PerspectiveFlip: {
    perspective: 1000,
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1],
    backfaceVisible: false,
  },

  // ParallaxLayers - Multi-layer parallax
  ParallaxLayers: {
    layers: 3,
    strength: { base: 20, mid: 40, far: 60 },
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    mouseFollow: true,
    scrollFollow: true,
  },
} as const;

// ============================================================
// EXPORT ALL TOKENS
// ============================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  motion,
  zIndex,
  breakpoints,
  cardVariants,
  profileThemes,
  threeDPrimitives,
} as const;

export type DesignTokens = typeof designTokens;