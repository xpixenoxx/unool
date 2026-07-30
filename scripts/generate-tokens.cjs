/**
 * Token to CSS Generator
 * Generates CSS custom properties from TypeScript design tokens
 * Run with: node scripts/generate-tokens.cjs
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// PRIMITIVE TOKENS
// ============================================================

const primitives = {
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
      800: 'oklch(0.22  0.02 247.8)',
      900: 'oklch(0.12  0.02 247.8)',
      950: 'oklch(0.08  0.01 247.8)',
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

    // Semantic color primitives
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
    md: '0 4px 6px -1px oklch(0.12 0.02 247.8 / 0.08), 0 2px 4px -2px oklch(0.12 0.02 247.8 / 0.05)',
    lg: '0 10px 15px -3px oklch(0.12 0.02 247.8 / 0.08), 0 4px 6px -4px oklch(0.12 0.02 247.8 / 0.05)',
    xl: '0 20px 25px -5px oklch(0.12 0.02 247.8 / 0.08), 0 8px 10px -6px oklch(0.12 0.02 247.8 / 0.05)',
    '2xl': '0 25px 50px -12px oklch(0.12 0.02 247.8 / 0.12)',
    inner: 'inset 0 2px 4px 0 oklch(0.12 0.02 247.8 / 0.05)',
  },

  // Font size primitives (fluid with clamp)
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

  // Font weight primitives
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Duration primitives
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '180ms',
    slow: '250ms',
    slower: '350ms',
    page: '500ms',
  },

  // Easing primitives
  easing: {
    'ease-out': '[0.25,0.46,0.45,0.94]',
    'ease-in': '[0.55,0.06,0.68,0.19]',
    'ease-in-out': '[0.42,0,0.58,1]',
    brand: '[0.34,1.56,0.64,1]',
    expo: '[0.16,1,0.3,1]',
    anticipation: '[0.68,-0.55,0.27,1.55]',
  },

  // Z-index primitives
  zIndex: {
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
  },
};

// ============================================================
// SEMANTIC TOKENS (Light & Dark mode)
// ============================================================

const semantic = {
  light: {
    // Background & Foreground
    background: 'oklch(0.985 0.002 247.8)',
    foreground: 'oklch(0.12 0.02 247.8)',

    // Card
    card: 'oklch(1 0 0)',
    'card-foreground': 'oklch(0.12 0.02 247.8)',

    // Popover
    popover: 'oklch(1 0 0)',
    'popover-foreground': 'oklch(0.12 0.02 247.8)',

    // Primary (Electric Cyan)
    primary: 'oklch(0.60 0.20 195)',
    'primary-foreground': 'oklch(0.985 0.002 247.8)',
    'primary-50': 'oklch(0.96 0.04 195)',
    'primary-100': 'oklch(0.92 0.08 195)',
    'primary-200': 'oklch(0.85 0.12 195)',
    'primary-300': 'oklch(0.75 0.15 195)',
    'primary-400': 'oklch(0.65 0.18 195)',
    'primary-500': 'oklch(0.60 0.20 195)',
    'primary-600': 'oklch(0.52 0.18 195)',
    'primary-700': 'oklch(0.42 0.15 195)',
    'primary-800': 'oklch(0.32 0.12 195)',
    'primary-900': 'oklch(0.25 0.10 195)',

    // Purple (Secondary)
    purple: 'oklch(0.62 0.22 295)',
    'purple-foreground': 'oklch(0.985 0.002 247.8)',
    'purple-50': 'oklch(0.96 0.04 295)',
    'purple-100': 'oklch(0.92 0.08 295)',
    'purple-200': 'oklch(0.85 0.12 295)',
    'purple-300': 'oklch(0.75 0.15 295)',
    'purple-400': 'oklch(0.65 0.18 295)',
    'purple-500': 'oklch(0.62 0.22 295)',
    'purple-600': 'oklch(0.54 0.20 295)',
    'purple-700': 'oklch(0.44 0.17 295)',
    'purple-800': 'oklch(0.34 0.14 295)',
    'purple-900': 'oklch(0.26 0.11 295)',

    // Secondary
    secondary: 'oklch(0.93 0.006 247.8)',
    'secondary-foreground': 'oklch(0.22 0.02 247.8)',

    // Muted
    muted: 'oklch(0.93 0.006 247.8)',
    'muted-foreground': 'oklch(0.42 0.02 247.8)',

    // Accent
    accent: 'oklch(0.93 0.006 247.8)',
    'accent-foreground': 'oklch(0.22 0.02 247.8)',

    // Destructive
    destructive: 'oklch(0.58 0.22 25)',
    'destructive-foreground': 'oklch(0.985 0.002 247.8)',

    // Success
    success: 'oklch(0.58 0.14 85)',
    'success-foreground': 'oklch(0.985 0.002 247.8)',

    // Warning
    warning: 'oklch(0.75 0.18 75)',
    'warning-foreground': 'oklch(0.12 0.02 247.8)',

    // Borders & Inputs
    border: 'oklch(0.88 0.01 247.8)',
    input: 'oklch(0.88 0.01 247.8)',
    ring: 'oklch(0.60 0.20 195)',
  },

  dark: {
    // Background & Foreground
    background: 'oklch(0.08 0.01 247.8)',
    foreground: 'oklch(0.985 0.002 247.8)',

    // Card
    card: 'oklch(0.12 0.02 247.8)',
    'card-foreground': 'oklch(0.985 0.002 247.8)',

    // Popover
    popover: 'oklch(0.12 0.02 247.8)',
    'popover-foreground': 'oklch(0.985 0.002 247.8)',

    // Primary (Electric Cyan - slightly lighter for dark)
    primary: 'oklch(0.65 0.18 195)',
    'primary-foreground': 'oklch(0.08 0.01 247.8)',
    'primary-50': 'oklch(0.12 0.04 195)',
    'primary-100': 'oklch(0.15 0.06 195)',
    'primary-200': 'oklch(0.20 0.08 195)',
    'primary-300': 'oklch(0.30 0.12 195)',
    'primary-400': 'oklch(0.45 0.15 195)',
    'primary-500': 'oklch(0.55 0.18 195)',
    'primary-600': 'oklch(0.65 0.18 195)',
    'primary-700': 'oklch(0.72 0.17 195)',
    'primary-800': 'oklch(0.80 0.12 195)',
    'primary-900': 'oklch(0.88 0.08 195)',

    // Purple (Secondary - brighter for dark)
    purple: 'oklch(0.70 0.20 295)',
    'purple-foreground': 'oklch(0.08 0.01 247.8)',
    'purple-50': 'oklch(0.10 0.03 295)',
    'purple-100': 'oklch(0.15 0.04 295)',
    'purple-200': 'oklch(0.22 0.05 295)',
    'purple-300': 'oklch(0.30 0.08 295)',
    'purple-400': 'oklch(0.45 0.12 295)',
    'purple-500': 'oklch(0.55 0.15 295)',
    'purple-600': 'oklch(0.70 0.20 295)',
    'purple-700': 'oklch(0.78 0.18 295)',
    'purple-800': 'oklch(0.85 0.12 295)',
    'purple-900': 'oklch(0.92 0.08 295)',

    // Secondary
    secondary: 'oklch(0.18 0.02 247.8)',
    'secondary-foreground': 'oklch(0.93 0.006 247.8)',

    // Muted
    muted: 'oklch(0.18 0.02 247.8)',
    'muted-foreground': 'oklch(0.65 0.02 247.8)',

    // Accent
    accent: 'oklch(0.18 0.02 247.8)',
    'accent-foreground': 'oklch(0.93 0.006 247.8)',

    // Destructive
    destructive: 'oklch(0.52 0.20 25)',
    'destructive-foreground': 'oklch(0.985 0.002 247.8)',

    // Success
    success: 'oklch(0.68 0.16 85)',
    'success-foreground': 'oklch(0.08 0.01 247.8)',

    // Warning
    warning: 'oklch(0.75 0.18 75)',
    'warning-foreground': 'oklch(0.08 0.01 247.8)',

    // Borders & Inputs
    border: 'oklch(0.22 0.02 247.8)',
    input: 'oklch(0.22 0.02 247.8)',
    ring: 'oklch(0.65 0.18 195)',
  },
};

// ============================================================
// COMPONENT TOKENS
// ============================================================

const components = {
  button: {
    // Default (Primary)
    bg: 'var(--color-primary)',
    fg: 'var(--color-primary-foreground)',
    'hover-bg': 'var(--color-primary-hover)', // We'll resolve this
    'active-bg': 'var(--color-primary-active)',

    // Secondary
    'secondary-bg': 'var(--color-secondary)',
    'secondary-fg': 'var(--color-secondary-foreground)',
    'secondary-hover-bg': 'var(--color-secondary-hover)',

    // Outline
    'outline-border': 'var(--color-border)',
    'outline-fg': 'var(--color-foreground)',
    'outline-hover-bg': 'var(--color-accent)',

    // Ghost
    'ghost-fg': 'var(--color-foreground)',
    'ghost-hover-bg': 'var(--color-accent)',

    // Destructive
    'destructive-bg': 'var(--color-destructive)',
    'destructive-fg': 'var(--color-destructive-foreground)',
    'destructive-hover-bg': 'var(--color-destructive-hover)',

    // Sizing
    'padding-x': 'var(--space-4)',
    'padding-y': 'var(--space-2)',
    'padding-x-sm': 'var(--space-3)',
    'padding-y-sm': 'var(--space-1-5)',
    'padding-x-lg': 'var(--space-6)',
    'padding-y-lg': 'var(--space-3)',

    // Shape
    radius: 'var(--radius-md)',
    'font-size': 'var(--font-size-sm)',
    'font-weight': 'var(--font-weight-medium)',
  },

  input: {
    bg: 'var(--color-background)',
    border: 'var(--color-input)',
    fg: 'var(--color-foreground)',
    placeholder: 'var(--color-muted-foreground)',
    'focus-border': 'var(--color-ring)',
    'focus-ring': 'var(--color-ring)',
    'error-border': 'var(--color-destructive)',
    'error-fg': 'var(--color-destructive)',
    'disabled-bg': 'var(--color-muted)',
    'disabled-fg': 'var(--color-muted-foreground)',
    'padding-x': 'var(--space-3)',
    'padding-y': 'var(--space-2)',
    radius: 'var(--radius-md)',
    'font-size': 'var(--font-size-sm)',
  },

  card: {
    bg: 'var(--color-card)',
    fg: 'var(--color-card-foreground)',
    border: 'var(--color-border)',
    shadow: 'var(--shadow-sm)',
    'shadow-hover': 'var(--shadow-md)',
    padding: 'var(--space-6)',
    'padding-sm': 'var(--space-4)',
    gap: 'var(--space-4)',
    radius: 'var(--radius-lg)',
  },

  badge: {
    // Default
    bg: 'var(--color-primary)',
    fg: 'var(--color-primary-foreground)',

    // Secondary
    'secondary-bg': 'var(--color-secondary)',
    'secondary-fg': 'var(--color-secondary-foreground)',

    // Outline
    'outline-border': 'var(--color-border)',
    'outline-fg': 'var(--color-foreground)',

    // Destructive
    'destructive-bg': 'var(--color-destructive)',
    'destructive-fg': 'var(--color-destructive-foreground)',

    // Success
    'success-bg': 'var(--color-success)',
    'success-fg': 'var(--color-success-foreground)',

    // Warning
    'warning-bg': 'var(--color-warning)',
    'warning-fg': 'var(--color-warning-foreground)',

    // Sizing
    'padding-x': 'var(--space-2-5)',
    'padding-y': 'var(--space-0-5)',
    radius: 'var(--radius-full)',
    'font-size': 'var(--font-size-xs)',
    'font-weight': 'var(--font-weight-semibold)',
  },

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

  dialog: {
    'overlay-bg': 'rgb(0 0 0 / 0.5)',
    'content-bg': 'var(--color-background)',
    'content-fg': 'var(--color-foreground)',
    border: 'var(--color-border)',
    shadow: 'var(--shadow-lg)',
    padding: 'var(--space-6)',
    radius: 'var(--radius-lg)',
    'max-width': '32rem',
  },

  table: {
    'header-bg': 'var(--color-muted)',
    'header-fg': 'var(--color-muted-foreground)',
    'row-bg': 'var(--color-background)',
    'row-hover-bg': 'var(--color-muted)',
    'row-fg': 'var(--color-foreground)',
    border: 'var(--color-border)',
    'cell-padding-x': 'var(--space-4)',
    'cell-padding-y': 'var(--space-3)',
  },
};

// ============================================================
// GENERATION FUNCTIONS
// ============================================================

function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

function generateCSSVariables(tokens, selector = ':root') {
  const flat = flatten(tokens);
  let css = `${selector} {\n`;
  for (const [key, value] of Object.entries(flat)) {
    css += `  --${key}: ${value};\n`;
  }
  css += '}\n';
  return css;
}

function generateFullCSS() {
  let css = `/* ============================================================
   DESIGN TOKENS — CSS Custom Properties
   Auto-generated from lib/design/tokens.ts
   ============================================================ */

/* === PRIMITIVE TOKENS === */\n`;

  // Primitive colors
  css += generateCSSVariables(primitives.color, ':root');

  // Primitive spacing
  css += generateCSSVariables({ space: primitives.space }, ':root');

  // Primitive section spacing
  css += generateCSSVariables({ 'section-space': primitives.sectionSpace }, ':root');

  // Primitive radius
  css += generateCSSVariables({ radius: primitives.radius }, ':root');

  // Primitive shadows
  css += generateCSSVariables({ shadow: primitives.shadow }, ':root');

  // Primitive font sizes
  const fontSizeFlat = {};
  for (const [key, value] of Object.entries(primitives.fontSize)) {
    if (Array.isArray(value)) {
      fontSizeFlat[`font-size-${key}`] = value[0];
      if (value[1].lineHeight) fontSizeFlat[`line-height-${key}`] = value[1].lineHeight;
      if (value[1].letterSpacing) fontSizeFlat[`letter-spacing-${key}`] = value[1].letterSpacing;
    }
  }
  css += generateCSSVariables(fontSizeFlat, ':root');

  // Primitive font weights
  css += generateCSSVariables({ 'font-weight': primitives.fontWeight }, ':root');

  // Primitive durations
  css += generateCSSVariables({ duration: primitives.duration }, ':root');

  // Primitive easings
  css += generateCSSVariables({ ease: primitives.easing }, ':root');

  // Primitive z-index
  css += generateCSSVariables({ z: primitives.zIndex }, ':root');

  // Semantic tokens - Light mode
  css += '\n/* === SEMANTIC TOKENS (Light) === */\n';
  css += generateCSSVariables({ color: semantic.light }, ':root');

  // Semantic tokens - Dark mode
  css += '\n/* === SEMANTIC TOKENS (Dark) === */\n';
  css += generateCSSVariables({ color: semantic.dark }, '[data-theme="dark"]');

  // Component tokens (referencing semantic)
  css += '\n/* === COMPONENT TOKENS === */\n';
  css += generateCSSVariables(components, ':root');

  // Profile theme CSS variables (for public profiles)
  css += '\n/* === PROFILE THEMES (Public Profiles) === */\n';
  css += `.theme-minimal {\n  --profile-bg: oklch(0.985 0.002 247.8);\n  --profile-text: oklch(0.12 0.02 247.8);\n  --profile-accent: oklch(0.60 0.20 195);\n  --profile-border: oklch(0.88 0.01 247.8);\n  --profile-card-bg: oklch(1 0 0);\n  --profile-card-border: oklch(0.88 0.01 247.8);\n  --profile-radius: 0.375rem;\n  --profile-shadow: 0 1px 3px 0 oklch(0.12 0.02 247.8 / 0.08);\n  --profile-font-display: var(--font-sans);\n  --profile-font-ui: var(--font-sans);\n}\n`;
  css += `.theme-bold {\n  --profile-bg: oklch(0.08 0.01 247.8);\n  --profile-text: oklch(0.985 0.002 247.8);\n  --profile-accent: oklch(0.65 0.18 195);\n  --profile-border: oklch(0.22 0.02 247.8);\n  --profile-card-bg: oklch(0.12 0.02 247.8);\n  --profile-card-border: oklch(0.18 0.02 247.8);\n  --profile-radius: 0.5rem;\n  --profile-shadow: 0 10px 25px -5px oklch(0 0 0 / 0.3);\n  --profile-font-display: var(--font-sans);\n  --profile-font-ui: var(--font-mono);\n}\n`;
  css += `.theme-corporate {\n  --profile-bg: oklch(0.97 0.005 240);\n  --profile-text: oklch(0.25 0.02 240);\n  --profile-accent: oklch(0.45 0.15 240);\n  --profile-border: oklch(0.85 0.01 240);\n  --profile-card-bg: oklch(1 0 0);\n  --profile-card-border: oklch(0.85 0.01 240);\n  --profile-radius: 0.5rem;\n  --profile-shadow: 0 4px 6px -1px oklch(0.25 0.02 240 / 0.1);\n  --profile-font-display: var(--font-sans);\n  --profile-font-ui: var(--font-sans);\n}\n`;
  css += `.theme-creative {\n  --profile-bg: oklch(0.98 0.01 330);\n  --profile-text: oklch(0.15 0.02 330);\n  --profile-accent: oklch(0.55 0.22 330);\n  --profile-border: oklch(0.90 0.03 330);\n  --profile-card-bg: oklch(1 0 0);\n  --profile-card-border: oklch(0.90 0.03 330);\n  --profile-radius: 1rem;\n  --profile-shadow: 0 8px 20px -5px oklch(0.55 0.22 330 / 0.15);\n  --profile-font-display: var(--font-syne);\n  --profile-font-ui: var(--font-sans);\n}\n`;
  css += `.theme-technical {\n  --profile-bg: oklch(0.09 0.01 150);\n  --profile-text: oklch(0.92 0.02 150);\n  --profile-accent: oklch(0.65 0.18 150);\n  --profile-border: oklch(0.18 0.02 150);\n  --profile-card-bg: oklch(0.12 0.01 150);\n  --profile-card-border: oklch(0.18 0.02 150);\n  --profile-radius: 0.25rem;\n  --profile-shadow: 0 0 0 1px oklch(0.65 0.18 150 / 0.2), 0 4px 12px oklch(0 0 0 / 0.3);\n  --profile-font-display: var(--font-mono);\n  --profile-font-ui: var(--font-mono);\n}\n`;

  return css;
}

// ============================================================
// MAIN EXECUTION
// ============================================================

function main() {
  const css = generateFullCSS();

  // Write to app/globals.css (we'll prepend to the existing file, or you can import this)
  const outputPath = path.join(__dirname, '..', 'app', 'design-tokens.css');
  fs.writeFileSync(outputPath, css);
  console.log(`✅ Generated ${outputPath}`);

  // Also generate JSON for programmatic use
  const jsonOutput = {
    primitives,
    semantic,
    components,
    profileThemes: {
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
    },
  };

  const jsonPath = path.join(__dirname, '..', 'lib', 'design', 'tokens.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
  console.log(`✅ Generated ${jsonPath}`);
}

main();