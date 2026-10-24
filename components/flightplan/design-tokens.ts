/**
 * Flight Plan — Biscuit Design Tokens
 * Warm editorial design system: ivory canvas, espresso text, champagne-gold accents.
 * Seamlessly matches the Unool dashboard light theme.
 *
 * Motion: fluid springs (stiffness 500-600, damping 28-32) for premium feel
 * Spacing: 4px base unit with harmonious scale
 * Radius: hierarchical (sm: 8px, md: 12px, lg: 16px, xl: 24px)
 */

// Motion tokens - fluid spring configurations
export const MOTION = {
  // Premium fluid springs (stiffness 500-700, damping 28-35)
  spring: {
    snappy: { stiffness: 550, damping: 30, mass: 0.8 },      // Buttons, toggles, chips
    standard: { stiffness: 500, damping: 28, mass: 1 },       // Cards, panels, modals
    gentle: { stiffness: 450, damping: 30, mass: 1.2 },       // Page transitions, large elements
    bouncy: { stiffness: 600, damping: 25, mass: 1 },         // Success, celebrations, reveals
    smooth: { stiffness: 500, damping: 32, mass: 1 },         // Drag, hover, 3D tilt
    magnetic: { stiffness: 650, damping: 35, mass: 0.6 },     // Magnetic hover, template cards
  },
  // Duration tokens
  duration: {
    instant: 0.05,
    fast: 0.12,
    normal: 0.18,
    slow: 0.25,
    slower: 0.35,
    page: 0.5,
  },
  // Easing curves
  easing: {
    easeOut: [0.25, 0.46, 0.45, 0.94],
    easeIn: [0.55, 0.06, 0.68, 0.19],
    easeInOut: [0.42, 0, 0.58, 1],
    brand: [0.34, 1.56, 0.64, 1],
    expo: [0.16, 1, 0.3, 1],
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

export type MotionTokens = typeof MOTION;

// Spacing scale - 4px base unit
export const SPACING = {
  base: 4,
  scale: {
    '2xs': 2,   // 2px
    xs: 4,      // 4px
    sm: 8,      // 8px
    md: 16,     // 16px
    lg: 24,     // 24px
    xl: 32,     // 32px
    '2xl': 48,  // 48px
    '3xl': 64,  // 64px
  },
} as const;

// Border radius scale
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Shadow scale — warm editorial shadows
export const SHADOW = {
  xs:    '0 1px 2px rgba(61,43,31,0.06)',
  sm:    '0 2px 6px rgba(61,43,31,0.06), 0 1px 2px rgba(61,43,31,0.04)',
  md:    '0 4px 14px rgba(61,43,31,0.08), 0 2px 4px rgba(61,43,31,0.04)',
  lg:    '0 8px 24px rgba(61,43,31,0.10), 0 4px 8px rgba(61,43,31,0.06)',
  xl:    '0 16px 40px rgba(61,43,31,0.12), 0 8px 16px rgba(61,43,31,0.06)',
  inner: 'inset 0 2px 4px rgba(61,43,31,0.08)',
  glow: (color: string, intensity: number = 0.18) => `0 0 ${intensity * 40}px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
} as const;

export const B = {
  // Base surfaces
  bg:          '#F7F3ED',        // Lighter warm biscuit parchment (from reference design)
  bgElevated:  '#FAF7F2',        // Raised panels
  card:        '#FFFDF9',        // Primary card — warm ivory white
  cardHover:   '#F5EFE2',        // Hover tint
  cardBorder:  '#EDE7DD',        // Hairline border
  cardShadow:  '0 2px 8px rgba(61,43,31,0.04), 0 1px 2px rgba(61,43,31,0.06)',
  cardShadowHover: '0 4px 16px rgba(61,43,31,0.08), 0 2px 4px rgba(61,43,31,0.04)',

  // Typography — Inter / system sans-serif
  text:          '#3D2B1F',      // Deep warm espresso
  textSecondary: '#6B5744',      // Secondary warm brown
  textMuted:     '#8B7355',      // Helper / placeholder
  textLight:     '#A8917A',      // Lightest metadata / timestamps

  // Champagne Gold accent system
  accent:       '#C4A265',       // Signature champagne gold
  accentHover:  '#B8962E',       // Darker on hover
  accentDark:   '#A68B52',       // Active / pressed
  accentBg:     '#F5EFE2',       // Soft warm gold background
  accentBgHover:'#EDE5D3',       // Accent bg hover
  accentBorder: '#E5D9C3',       // Accent hairline border
  accentGlow:   'rgba(196,162,101,0.22)',

  // Hero Ribbon Surface (Espresso dark luxury banner)
  heroBg:       'linear-gradient(135deg, #3D2B1F 0%, #4E3828 100%)',
  heroText:     '#E8D9B5',

  // Status: success / published
  success:       '#4A8C5C',
  successBg:     '#EBF5EE',
  successBorder: '#C5E0CE',
  successGlow:   'rgba(74,140,92,0.18)',

  // Status: info
  info:          '#4A76A8',
  infoBg:        '#EBF0F7',
  infoBorder:    '#C9D9ED',
  infoGlow:      'rgba(74,118,168,0.18)',

  // Status: warning / held
  warning:       '#C49B3C',
  warningBg:     '#FBF5E6',
  warningBorder: '#F5E5BE',
  warningGlow:   'rgba(196,155,60,0.22)',

  // Status: danger / validation error
  danger:        '#B85450',
  dangerBg:      '#FBEDED',
  dangerBorder:  '#EFC7C6',
  dangerGlow:    'rgba(184,84,80,0.18)',

  // Utility
  border:      '#EDE7DD',
  borderLight: '#F3EDE6',
  inputBg:     '#FFFFFF',
  glass:       'rgba(255,253,249,0.92)',
  glassBorder: '#EDE7DD',
  overlay:     'rgba(45,31,20,0.35)',
} as const;

export const BEAT_COLORS: Record<string, string> = {
  Hook: '#C4A265',      // Beat 1: Hook (Gold)
  Context: '#B8794B',   // Beat 2: Context (Copper)
  Challenge: '#C0554F', // Beat 3: Challenge (Terracotta)
  Proof: '#4A9C62',     // Beat 4: Proof (Emerald / Sage)
  CTA: '#9A6B8E',       // Beat 5: CTA (Mauve / Violet)
  Community: '#3B82F6', // Beat 6: Community (Cobalt / Ocean)
  Horizon: '#D97706',   // Beat 7: Horizon (Amber Glow)
};

export type DesignTokens = typeof B;

// Platform brand colours — light-mode backgrounds
export const PLATFORM_META: Record<string, { name: string; color: string; bg: string }> = {
  linkedin:  { name: 'LinkedIn',  color: '#0A66C2', bg: '#E8F0FA' },
  x:         { name: 'X',         color: '#14171A', bg: '#F0F3F4' },
  twitter:   { name: 'X',         color: '#14171A', bg: '#F0F3F4' },
  threads:   { name: 'Threads',   color: '#1A1A1A', bg: '#F5F5F5' },
  bluesky:   { name: 'Bluesky',   color: '#0085FF', bg: '#E6F3FF' },
  instagram: { name: 'Instagram', color: '#E1306C', bg: '#FDE8F0' },
  facebook:  { name: 'Facebook',  color: '#1877F2', bg: '#E8F0FE' },
  pinterest: { name: 'Pinterest', color: '#E60023', bg: '#FDE8E8' },
  youtube:   { name: 'YouTube',   color: '#FF0000', bg: '#FDE8E8' },
  reddit:    { name: 'Reddit',    color: '#FF4500', bg: '#FFEBE5' },
  mastodon:  { name: 'Mastodon',  color: '#6364FF', bg: '#F0F0FF' },
  discord:   { name: 'Discord',   color: '#5865F2', bg: '#EEF0FD' },
  slack:     { name: 'Slack',     color: '#4A154B', bg: '#F5ECF5' },
  telegram:  { name: 'Telegram',  color: '#229ED9', bg: '#E9F5FA' },
  twitch:    { name: 'Twitch',    color: '#9146FF', bg: '#F3ECFF' },
  kick:      { name: 'Kick',      color: '#53FC18', bg: '#EBFDE7' },
  whop:      { name: 'Whop',      color: '#FF5A00', bg: '#FFF0E6' },
  dribbble:  { name: 'Dribbble',  color: '#EA4C89', bg: '#FDEDF3' },
  skool:     { name: 'Skool',     color: '#E2AD44', bg: '#FDF7EB' },
  warpcast:  { name: 'Farcaster', color: '#8A63D2', bg: '#F4EFFB' },
  farcaster: { name: 'Farcaster', color: '#8A63D2', bg: '#F4EFFB' },
  mewe:      { name: 'MeWe',      color: '#2F435E', bg: '#EDEFF2' },
  nostr:     { name: 'Nostr',     color: '#9B51E0', bg: '#F4EEFB' },
  medium:    { name: 'Medium',    color: '#000000', bg: '#F0F0F0' },
  devto:     { name: 'DEV.to',    color: '#0A0A0A', bg: '#F0F0F0' },
  hashnode:  { name: 'Hashnode',  color: '#2962FF', bg: '#ECF2FE' },
  lemmy:     { name: 'Lemmy',     color: '#00BC8C', bg: '#E6F7EF' },
  listmonk:  { name: 'Listmonk', color: '#0045ff', bg: '#E8EBFF' },
  manual:    { name: 'Manual',    color: '#71717A', bg: '#F4F4F5' },
};