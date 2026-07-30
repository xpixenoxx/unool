/**
 * Unool Design System Tokens
 * Three-layer architecture: Primitive → Semantic → Component
 *
 * Source of truth: app/globals.css (CSS custom properties)
 * This file provides TypeScript access to the same token values.
 * All templates and components MUST consume these tokens - zero hardcoded values.
 */

// ============================================================
// LAYER 1: PRIMITIVE TOKENS
// Raw design values without semantic meaning
// ============================================================

export const primitives = {
  // Color primitives (OKLCH for perceptual uniformity)
  color: {
    // Neutral scale (near-white to near-black, blue-tinted)
    neutral: {
      50:  'oklch(0.985 0.002 247.8)',
      100: 'oklch(0.97  0.003 247.8)',
      200: 'oklch(0.93  0.006 247.8)',
      300: 'oklch(0.88  0.01  247.8)',
      400: 'oklch(0.72  0.02  247.8)',
      500: 'oklch(0.55  0.02  247.8)',
      600: 'oklch(0.42  0.02  247.8)',
      700: 'oklch(0.32  0.02  247.8)',
      800: 'oklch(0.22  0.02  247.8)',
      900: 'oklch(0.12  0.02  247.8)',
      950: 'oklch(0.08  0.01  247.8)',
    },

    // Electric Cyan - Primary brand
    cyan: {
      50:  'oklch(0.96  0.04  195)',
      100: 'oklch(0.92  0.08  195)',
      200: 'oklch(0.85  0.12  195)',
      300: 'oklch(0.75  0.15  195)',
      400: 'oklch(0.65  0.18  195)',
      500: 'oklch(0.60  0.20  195)',  // Main accent
      600: 'oklch(0.52  0.18  195)',
      700: 'oklch(0.42  0.15  195)',
      800: 'oklch(0.32  0.12  195)',
      900: 'oklch(0.25  0.10  195)',
    },

    // Electric Purple - Secondary/premium brand
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
    },

    // Semantic color primitives (light mode)
    success: {
      500: 'oklch(0.68 0.16 85)',
      600: 'oklch(0.58 0.14 85)',
    },
    warning: {
      500: 'oklch(0.75 0.18 75)',
      600: 'oklch(0.65 0.16 75)',
    },
    destructive: {
      500: 'oklch(0.58 0.22 25)',
      600: 'oklch(0.48 0.20 25)',
    },
  },

  // Spacing primitives (4px base)
  space: {
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
  },

  // Fluid section spacing
  sectionSpace: {
    sm: 'clamp(2rem, 1.5rem + 2.5vw, 3.5rem)',
    md: 'clamp(3rem, 2rem + 5vw, 5rem)',
    lg: 'clamp(4rem, 3rem + 5vw, 7rem)',
    xl: 'clamp(6rem, 4rem + 10vw, 10rem)',
  },

  // Border radius primitives
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadow primitives (OKLCH colors for consistency)
  shadow: {
    xs: '0 1px 2px 0 oklch(0.12 0.02 247.8 / 0.05)',
    sm: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08), 0 1px 2px -1px oklch(0.12 0.02 247.8 / 0.08)',
    md: '0 4px 6px -1px oklch(0.12 0.02 247.8 / 0.08), 0 2px 4px -2px oklch(0.12 0.02 247.8 / 0.08)',
    lg: '0 10px 15px -3px oklch(0.12 0.02 247.8 / 0.08), 0 4px 6px -4px oklch(0.12 0.02 247.8 / 0.08)',
    xl: '0 20px 25px -5px oklch(0.12 0.02 247.8 / 0.08), 0 8px 10px -6px oklch(0.12 0.02 247.8 / 0.08)',
    '2xl': '0 25px 50px -12px oklch(0.12 0.02 247.8 / 0.12)',
    inner: 'inset 0 2px 4px 0 oklch(0.12 0.02 247.8 / 0.05)',
    glow: '0 0 20px oklch(0.60 0.20 195 / 0.3)',
    'glow-lg': '0 0 40px oklch(0.60 0.20 195 / 0.4)',
    purple: '0 4px 20px 0 oklch(0.62 0.22 295 / 0.25)',
    'purple-lg': '0 8px 32px 0 oklch(0.62 0.22 295 / 0.35)',
    primary: '0 4px 14px 0 oklch(0.60 0.20 195 / 0.25)',
    success: '0 4px 14px 0 oklch(0.68 0.16 85 / 0.25)',
    destructive: '0 4px 14px 0 oklch(0.58 0.22 25 / 0.25)',
  },

  // Dark mode shadows
  shadowDark: {
    xs: '0 1px 2px 0 oklch(0 0 0 / 0.2)',
    sm: '0 1px 3px 0 oklch(0 0 0 / 0.3), 0 1px 2px -1px oklch(0 0 0 / 0.3)',
    md: '0 4px 6px -1px oklch(0 0 0 / 0.3), 0 2px 4px -2px oklch(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px oklch(0 0 0 / 0.3), 0 4px 6px -4px oklch(0 0 0 / 0.3)',
    xl: '0 20px 25px -5px oklch(0 0 0 / 0.3), 0 8px 10px -6px oklch(0 0 0 / 0.3)',
    '2xl': '0 25px 50px -12px oklch(0 0 0 / 0.4)',
    inner: 'inset 0 2px 4px 0 oklch(0 0 0 / 0.2)',
    glow: '0 0 20px oklch(0.65 0.18 195 / 0.4)',
    'glow-lg': '0 0 40px oklch(0.65 0.18 195 / 0.5)',
    purple: '0 4px 24px 0 oklch(0.70 0.20 295 / 0.35)',
    'purple-lg': '0 8px 40px 0 oklch(0.70 0.20 295 / 0.45)',
    primary: '0 4px 14px 0 oklch(0.65 0.18 195 / 0.35)',
    success: '0 4px 14px 0 oklch(0.68 0.16 85 / 0.35)',
    destructive: '0 4px 14px 0 oklch(0.58 0.22 25 / 0.35)',
  },

  // Typography primitives
  fontFamily: {
    sans: 'var(--font-sans)',      // Geist Variable
    mono: 'var(--font-mono)',      // Geist Mono Variable
    display: 'var(--font-display)', // Geist Variable (display weights)
    syne: 'var(--font-syne)',       // Syne for creative themes
  },

  fontSize: {
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

  // Motion primitives
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '180ms',
    smooth: '250ms',
    slow: '350ms',
    slower: '500ms',
  },

  easing: {
    snappy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    standard: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    gentle: 'cubic-bezier(0.42, 0, 0.58, 1)',
    bouncy: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
  },

  // Z-index primitives
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
    toast: 1700,
    max: 2147483647,
  },

  // Breakpoint primitives
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;


// ============================================================
// LAYER 2: SEMANTIC TOKENS
// Purpose-based aliases referencing primitives
// These enable theme switching (light/dark)
// ============================================================

export const semantic = {
  // Light mode semantic tokens
  light: {
    // Background & Surface
    background: primitives.color.neutral[50],
    foreground: primitives.color.neutral[900],
    card: primitives.color.neutral[100],
    cardForeground: primitives.color.neutral[900],
    popover: primitives.color.neutral[100],
    popoverForeground: primitives.color.neutral[900],

    // Primary (Electric Cyan)
    primary: primitives.color.cyan[500],
    primaryForeground: primitives.color.neutral[50],
    primaryHover: primitives.color.cyan[600],
    primaryActive: primitives.color.cyan[700],

    // Secondary (Purple)
    secondary: primitives.color.neutral[200],
    secondaryForeground: primitives.color.neutral[800],
    secondaryHover: primitives.color.neutral[300],

    // Purple brand
    purple: primitives.color.purple[500],
    purpleForeground: primitives.color.neutral[50],
    purpleHover: primitives.color.purple[600],

    // Muted
    muted: primitives.color.neutral[200],
    mutedForeground: primitives.color.neutral[600],

    // Accent
    accent: primitives.color.neutral[200],
    accentForeground: primitives.color.neutral[800],

    // Destructive
    destructive: primitives.color.destructive[500],
    destructiveForeground: primitives.color.neutral[50],
    destructiveHover: primitives.color.destructive[600],

    // Success
    success: primitives.color.success[500],
    successForeground: primitives.color.neutral[50],
    successHover: primitives.color.success[600],

    // Warning
    warning: primitives.color.warning[500],
    warningForeground: primitives.color.neutral[900],
    warningHover: primitives.color.warning[600],

    // Borders & Inputs
    border: primitives.color.neutral[300],
    input: primitives.color.neutral[300],
    ring: primitives.color.cyan[500],

    // Shadows
    shadow: primitives.shadow,
  },

  // Dark mode semantic tokens
  dark: {
    // Background & Surface
    background: primitives.color.neutral[950],
    foreground: primitives.color.neutral[50],
    card: primitives.color.neutral[900],
    cardForeground: primitives.color.neutral[50],
    popover: primitives.color.neutral[900],
    popoverForeground: primitives.color.neutral[50],

    // Primary (Electric Cyan - brighter in dark)
    primary: primitives.color.cyan[500],
    primaryForeground: primitives.color.neutral[950],
    primaryHover: primitives.color.cyan[400],
    primaryActive: primitives.color.cyan[300],

    // Secondary
    secondary: primitives.color.neutral[800],
    secondaryForeground: primitives.color.neutral[200],
    secondaryHover: primitives.color.neutral[700],

    // Purple brand (brighter in dark)
    purple: primitives.color.purple[500],
    purpleForeground: primitives.color.neutral[950],
    purpleHover: primitives.color.purple[400],

    // Muted
    muted: primitives.color.neutral[800],
    mutedForeground: primitives.color.neutral[400],

    // Accent
    accent: primitives.color.neutral[800],
    accentForeground: primitives.color.neutral[200],

    // Destructive
    destructive: primitives.color.destructive[500],
    destructiveForeground: primitives.color.neutral[50],
    destructiveHover: primitives.color.destructive[400],

    // Success
    success: primitives.color.success[500],
    successForeground: primitives.color.neutral[950],
    successHover: primitives.color.success[400],

    // Warning
    warning: primitives.color.warning[500],
    warningForeground: primitives.color.neutral[950],
    warningHover: primitives.color.warning[400],

    // Borders & Inputs
    border: primitives.color.neutral[800],
    input: primitives.color.neutral[800],
    ring: primitives.color.cyan[500],

    // Shadows (dark mode variants)
    shadow: primitives.shadowDark,
  },
} as const;


// ============================================================
// LAYER 3: COMPONENT TOKENS
// Component-specific tokens referencing semantic layer
// ============================================================

export const components = {
  // Button component tokens
  button: {
    // Default (Primary)
    default: {
      bg: 'var(--color-primary)',
      fg: 'var(--color-primary-foreground)',
      hoverBg: 'var(--color-primary-hover)',
      activeBg: 'var(--color-primary-active)',
      border: 'none',
    },
    // Secondary
    secondary: {
      bg: 'var(--color-secondary)',
      fg: 'var(--color-secondary-foreground)',
      hoverBg: 'var(--color-secondary-hover)',
      activeBg: 'var(--color-secondary-hover)',
      border: 'none',
    },
    // Outline
    outline: {
      bg: 'transparent',
      fg: 'var(--color-foreground)',
      hoverBg: 'var(--color-accent)',
      activeBg: 'var(--color-accent)',
      border: 'var(--color-border)',
    },
    // Ghost
    ghost: {
      bg: 'transparent',
      fg: 'var(--color-foreground)',
      hoverBg: 'var(--color-accent)',
      activeBg: 'var(--color-accent)',
      border: 'none',
    },
    // Destructive
    destructive: {
      bg: 'var(--color-destructive)',
      fg: 'var(--color-destructive-foreground)',
      hoverBg: 'var(--color-destructive-hover)',
      activeBg: 'var(--color-destructive-hover)',
      border: 'none',
    },
    // Success
    success: {
      bg: 'var(--color-success)',
      fg: 'var(--color-success-foreground)',
      hoverBg: 'var(--color-success-hover)',
      activeBg: 'var(--color-success-hover)',
      border: 'none',
    },
    // Link
    link: {
      bg: 'transparent',
      fg: 'var(--color-primary)',
      hoverBg: 'transparent',
      activeBg: 'transparent',
      border: 'none',
    },
    // Sizing
    size: {
      sm: {
        height: '2rem',      // 32px
        paddingX: '0.75rem', // 12px
        paddingY: '0.25rem', // 4px
        fontSize: 'var(--font-size-xs)',
        iconSize: '1rem',    // 16px
      },
      default: {
        height: '2.5rem',    // 40px
        paddingX: '1rem',    // 16px
        paddingY: '0.5rem',  // 8px
        fontSize: 'var(--font-size-sm)',
        iconSize: '1.125rem', // 18px
      },
      lg: {
        height: '3rem',      // 48px
        paddingX: '1.5rem',  // 24px
        paddingY: '0.75rem', // 12px
        fontSize: 'var(--font-size-base)',
        iconSize: '1.25rem',  // 20px
      },
      icon: {
        size: '2.5rem',      // 40px square
      },
    },
    // Shape
    radius: 'var(--radius-md)',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'background-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-snappy)',
  },

  // Input component tokens
  input: {
    bg: 'var(--color-background)',
    border: 'var(--color-input)',
    fg: 'var(--color-foreground)',
    placeholder: 'var(--color-muted-foreground)',
    focusBorder: 'var(--color-ring)',
    focusRing: 'var(--color-ring)',
    errorBorder: 'var(--color-destructive)',
    errorRing: 'var(--color-destructive)',
    disabledBg: 'var(--color-muted)',
    disabledFg: 'var(--color-muted-foreground)',
    paddingX: 'var(--space-3)',
    paddingY: 'var(--space-2)',
    radius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    height: '2.5rem', // 40px
  },

  // Card component tokens
  card: {
    bg: 'var(--color-card)',
    fg: 'var(--color-card-foreground)',
    border: 'var(--color-border)',
    shadow: 'var(--shadow-sm)',
    shadowHover: 'var(--shadow-md)',
    padding: 'var(--space-6)',
    paddingSm: 'var(--space-4)',
    gap: 'var(--space-4)',
    radius: 'var(--radius-lg)',
  },

  // Badge component tokens
  badge: {
    default: {
      bg: 'var(--color-primary)',
      fg: 'var(--color-primary-foreground)',
    },
    secondary: {
      bg: 'var(--color-secondary)',
      fg: 'var(--color-secondary-foreground)',
    },
    outline: {
      bg: 'transparent',
      fg: 'var(--color-foreground)',
      border: 'var(--color-border)',
    },
    destructive: {
      bg: 'var(--color-destructive)',
      fg: 'var(--color-destructive-foreground)',
    },
    success: {
      bg: 'var(--color-success)',
      fg: 'var(--color-success-foreground)',
    },
    warning: {
      bg: 'var(--color-warning)',
      fg: 'var(--color-warning-foreground)',
    },
    paddingX: 'var(--space-2-5)',
    paddingY: 'var(--space-0-5)',
    radius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-semibold)',
  },

  // Alert component tokens
  alert: {
    default: {
      bg: 'var(--color-background)',
      fg: 'var(--color-foreground)',
      border: 'var(--color-border)',
    },
    destructive: {
      bg: 'var(--color-destructive)',
      fg: 'var(--color-destructive-foreground)',
      border: 'var(--color-destructive)',
    },
    success: {
      bg: 'var(--color-success)',
      fg: 'var(--color-success-foreground)',
      border: 'var(--color-success)',
    },
    warning: {
      bg: 'var(--color-warning)',
      fg: 'var(--color-warning-foreground)',
      border: 'var(--color-warning)',
    },
    padding: 'var(--space-4)',
    radius: 'var(--radius-lg)',
  },

  // Table component tokens
  table: {
    headerBg: 'var(--color-muted)',
    headerFg: 'var(--color-muted-foreground)',
    rowBg: 'var(--color-background)',
    rowHoverBg: 'var(--color-muted)',
    rowFg: 'var(--color-foreground)',
    border: 'var(--color-border)',
    cellPaddingX: 'var(--space-4)',
    cellPaddingY: 'var(--space-3)',
  },

  // Dialog/Modal tokens
  dialog: {
    overlayBg: 'rgb(0 0 0 / 0.5)',
    contentBg: 'var(--color-background)',
    contentFg: 'var(--color-foreground)',
    border: 'var(--color-border)',
    shadow: 'var(--shadow-lg)',
    padding: 'var(--space-6)',
    radius: 'var(--radius-lg)',
    maxWidth: '32rem',
  },
} as const;


// ============================================================
// PROFILE THEMES (Semantic profile-level tokens)
// ============================================================

export const profileThemes = {
  minimal: {
    name: 'Minimal',
    background: 'oklch(0.985 0.002 247.8)',
    text: 'oklch(0.12 0.02 247.8)',
    accent: 'oklch(0.60 0.20 195)',
    border: 'oklch(0.88 0.01 247.8)',
    cardBg: 'oklch(1 0 0)',
    cardBorder: 'oklch(0.88 0.01 247.8)',
    radius: '0.375rem',
    shadow: '0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08)',
    fontDisplay: 'var(--font-sans)',
    fontUI: 'var(--font-sans)',
    linkStyle: 'underline',
    spacing: 'generous',
  },
  bold: {
    name: 'Bold',
    background: 'oklch(0.08 0.01 247.8)',
    text: 'oklch(0.985 0.002 247.8)',
    accent: 'oklch(0.65 0.18 195)',
    border: 'oklch(0.22 0.02 247.8)',
    cardBg: 'oklch(0.12 0.02 247.8)',
    cardBorder: 'oklch(0.18 0.02 247.8)',
    radius: '0.5rem',
    shadow: '0 10px 25px -5px oklch(0 0 0 / 0.3)',
    fontDisplay: 'var(--font-sans)',
    fontUI: 'var(--font-mono)',
    linkStyle: 'pill',
    spacing: 'normal',
  },
  corporate: {
    name: 'Corporate',
    background: 'oklch(0.97 0.005 240)',
    text: 'oklch(0.25 0.02 240)',
    accent: 'oklch(0.45 0.15 240)',
    border: 'oklch(0.85 0.01 240)',
    cardBg: 'oklch(1 0 0)',
    cardBorder: 'oklch(0.85 0.01 240)',
    radius: '0.5rem',
    shadow: '0 4px 6px -1px oklch(0.25 0.02 240 / 0.1)',
    fontDisplay: 'var(--font-sans)',
    fontUI: 'var(--font-sans)',
    linkStyle: 'card',
    spacing: 'normal',
  },
  creative: {
    name: 'Creative',
    background: 'oklch(0.98 0.01 330)',
    text: 'oklch(0.15 0.02 330)',
    accent: 'oklch(0.55 0.22 330)',
    border: 'oklch(0.90 0.03 330)',
    cardBg: 'oklch(1 0 0)',
    cardBorder: 'oklch(0.90 0.03 330)',
    radius: '1rem',
    shadow: '0 8px 20px -5px oklch(0.55 0.22 330 / 0.15)',
    fontDisplay: 'var(--font-syne)',
    fontUI: 'var(--font-sans)',
    linkStyle: 'icon-only',
    spacing: 'generous',
  },
  technical: {
    name: 'Technical',
    background: 'oklch(0.09 0.01 150)',
    text: 'oklch(0.92 0.02 150)',
    accent: 'oklch(0.65 0.18 150)',
    border: 'oklch(0.18 0.02 150)',
    cardBg: 'oklch(0.12 0.01 150)',
    cardBorder: 'oklch(0.18 0.02 150)',
    radius: '0.25rem',
    shadow: '0 0 0 1px oklch(0.65 0.18 150 / 0.2), 0 4px 12px oklch(0 0 0 / 0.3)',
    fontDisplay: 'var(--font-mono)',
    fontUI: 'var(--font-mono)',
    linkStyle: 'badge',
    spacing: 'compact',
  },
} as const;


// ============================================================
// 3D PRIMITIVES (Animation/Interaction tokens)
// ============================================================

export const threeDPrimitives = {
  TiltCard: {
    maxTilt: 8,
    perspective: 1000,
    scale: 1.02,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    glare: true,
    maxGlare: 0.15,
  },
  MagneticCard: {
    strength: 0.3,
    radius: 120,
    transition: { type: 'spring', stiffness: 600, damping: 35, mass: 0.6 },
    scale: 1.03,
  },
  OrbitalBackground: {
    particleCount: 20,
    orbits: 3,
    speed: { min: 0.0005, max: 0.002 },
    size: { min: 2, max: 8 },
    colors: [
      'oklch(0.60 0.20 195 / 0.4)',
      'oklch(0.62 0.22 295 / 0.4)',
      'oklch(0.68 0.16 85 / 0.3)',
    ],
    connectLines: true,
    maxDistance: 150,
  },
  MorphingBlob: {
    points: 8,
    complexity: 0.4,
    speed: 0.3,
    colors: [
      'oklch(0.60 0.20 195)',
      'oklch(0.62 0.22 295)',
    ],
    blur: 60,
    opacity: 0.5,
  },
  PerspectiveFlip: {
    perspective: 1000,
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1],
    backfaceVisible: false,
  },
  ParallaxLayers: {
    layers: 3,
    strength: { base: 20, mid: 40, far: 60 },
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    mouseFollow: true,
    scrollFollow: true,
  },
} as const;


// ============================================================
// COMPOSITE EXPORTS (For easy importing)
// ============================================================

export const designTokens = {
  primitives,
  semantic,
  components,
  profileThemes,
  threeDPrimitives,
} as const;

export type DesignTokens = typeof designTokens;
export type Primitives = typeof primitives;
export type SemanticTokens = typeof semantic;
export type ComponentTokens = typeof components;
export type ProfileTheme = typeof profileThemes[keyof typeof profileThemes];
export type ThemeName = keyof typeof profileThemes;


// ============================================================
// CSS VARIABLE GENERATOR (for server-side rendering / static export)
// ============================================================

/**
 * Generates CSS custom properties from the token system.
 * Use this for SSR or when you need to inject tokens as CSS variables.
 */
export function generateCSSVariables(mode: 'light' | 'dark' = 'light'): Record<string, string> {
  const tokens = semantic[mode];
  const vars: Record<string, string> = {};

  // Color semantic tokens
  Object.entries(tokens).forEach(([key, value]) => {
    if (typeof value === 'string' && !key.includes('shadow')) {
      vars[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
    }
  });

  // Spacing
  Object.entries(primitives.space).forEach(([key, value]) => {
    vars[`--space-${key}`] = value;
  });

  // Section spacing
  Object.entries(primitives.sectionSpace).forEach(([key, value]) => {
    vars[`--section-space-${key}`] = value;
  });

  // Radius
  Object.entries(primitives.radius).forEach(([key, value]) => {
    vars[`--radius-${key}`] = value;
  });

  // Font sizes (fluid)
  Object.entries(primitives.fontSize).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      vars[`--font-size-${key}`] = value[0];
      if (value[1].lineHeight) vars[`--line-height-${key}`] = value[1].lineHeight;
      if (value[1].letterSpacing) vars[`--letter-spacing-${key}`] = value[1].letterSpacing;
    }
  });

  // Font weights
  Object.entries(primitives.fontWeight).forEach(([key, value]) => {
    vars[`--font-weight-${key}`] = value;
  });

  // Durations
  Object.entries(primitives.duration).forEach(([key, value]) => {
    vars[`--duration-${key}`] = value;
  });

  // Easings
  Object.entries(primitives.easing).forEach(([key, value]) => {
    vars[`--ease-${key}`] = value;
  });

  // Z-index
  Object.entries(primitives.zIndex).forEach(([key, value]) => {
    vars[`--z-${key}`] = String(value);
  });

  return vars;
}


/**
 * Get CSS variable string for inline styles
 */
export function cssVar(name: string): string {
  return `var(--${name})`;
}


/**
 * Token path resolver - resolves semantic token paths to CSS variable references
 * Usage: token('color.primary') → 'var(--color-primary)'
 */
export function token(path: string): string {
  return `var(--${path.replace(/\./g, '-')})`;
}


/**
 * Resolve a component token to CSS variable references
 */
export function resolveComponentTokens<T extends Record<string, unknown>>(componentTokens: T): Record<string, string> {
  const resolved: Record<string, string> = {};

  function resolve(value: unknown, prefix = ''): void {
    if (typeof value === 'string') {
      // If it's already a CSS var reference, keep it
      if (value.startsWith('var(--')) {
        resolved[prefix] = value;
      } else if (value.startsWith('oklch(') || value.startsWith('rgb') || value.startsWith('#')) {
        // Raw color value - shouldn't happen in component tokens
        resolved[prefix] = value;
      } else {
        // Assume it's a semantic token reference
        resolved[prefix] = `var(--${value.replace(/\./g, '-')})`;
      }
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        const newPrefix = prefix ? `${prefix}-${key}` : key;
        resolve(val, newPrefix);
      });
    }
  }

  resolve(componentTokens);
  return resolved;
}