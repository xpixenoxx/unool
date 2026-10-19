/**
 * Dark/Stone Luxury Cockpit Design Tokens
 * Single source of truth for the Flight Plan color system.
 *
 * Motion: Fluid springs (stiffness 500-700, damping 28-35) for premium feel
 * Spacing: 4px base unit with harmonious scale
 * Radius: Hierarchical (sm: 8px, md: 12px, lg: 16px, xl: 24px, full: 9999px)
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

// Shadow scale
export const SHADOW = {
  xs: '0 1px 2px rgba(0,0,0,0.3)',
  sm: '0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
  lg: '0 8px 24px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4)',
  xl: '0 16px 48px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.4)',
  inner: 'inset 0 2px 4px rgba(0,0,0,0.3)',
  glow: (color: string, intensity: number = 0.25) => `0 0 ${intensity * 40}px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
} as const;

export const B = {
  // Base backgrounds
  bg: '#0D0C0A',           // Deep obsidian base
  bgElevated: '#141311',   // Elevated stone surface
  card: '#1A1815',         // Panel/card background
  cardHover: '#1F1D1A',    // Card hover state
  cardBorder: 'rgba(255,255,255,0.08)', // Hairline border
  cardShadow: '0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)',
  cardShadowHover: '0 4px 16px rgba(0,0,0,0.5), 0 16px 32px rgba(0,0,0,0.4)',

  // Text hierarchy
  text: '#F5F2EB',         // High-contrast primary
  textSecondary: '#A8A196', // Secondary
  textMuted: '#736C62',    // Muted/placeholder

  // Champagne/gold accent system
  accent: '#D4AF37',       // Primary champagne
  accentHover: '#C4A265',  // Deeper gold on hover
  accentBg: '#1F1A0F',     // Accent background
  accentBgHover: '#282314', // Accent background hover
  accentBorder: '#3D3318', // Accent border
  accentGlow: 'rgba(212,175,55,0.25)', // Subtle glow

  // Status colors
  success: '#10B981',      // Emerald - included/active
  successBg: '#062D1A',
  successBorder: '#1E4D2B',
  successGlow: 'rgba(16,185,129,0.25)',

  info: '#0EA5E9',
  infoBg: '#051A2A',
  infoBorder: '#153E5C',
  infoGlow: 'rgba(14,165,233,0.25)',

  warning: '#F59E0B',      // Amber - caution
  warningBg: '#2D1E00',
  warningBorder: '#5C3D00',
  warningGlow: 'rgba(245,158,11,0.25)',

  danger: '#F43F5E',       // Rose - error/policy (not red)
  dangerBg: '#2D0A0F',
  dangerBorder: '#5C1525',
  dangerGlow: 'rgba(244,63,94,0.25)',

  // Utility
  border: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(13,12,10,0.85)',
  glass: 'rgba(26,24,21,0.9)',
  glassBorder: 'rgba(255,255,255,0.06)',

  // Legacy aliases for gradual migration
  accentDark: '#C4A265',
  accentBgLight: 'rgba(212,175,55,0.12)',
  successBgLight: 'rgba(16,185,129,0.12)',
  infoBgLight: 'rgba(14,165,233,0.12)',
  infoBorder: '#153E5C',
} as const;

export type DesignTokens = typeof B;

// Platform-specific colors (kept separate as they're brand colors)
export const PLATFORM_META: Record<string, { name: string; color: string; bg: string }> = {
  linkedin: { name: 'LinkedIn', color: '#0A66C2', bg: '#0E1F3A' },
  x: { name: 'X', color: '#FFFFFF', bg: '#1A1A1A' },
  threads: { name: 'Threads', color: '#FFFFFF', bg: '#1A1A1A' },
  facebook: { name: 'Facebook', color: '#1877F2', bg: '#0E1F3A' },
  instagram: { name: 'Instagram', color: '#E1306C', bg: '#2D0A15' },
  youtube: { name: 'YouTube', color: '#FF0000', bg: '#2D0A0A' },
  pinterest: { name: 'Pinterest', color: '#E60023', bg: '#2D0A0A' },
  bluesky: { name: 'Bluesky', color: '#0085FF', bg: '#0A1F3A' },
  mastodon: { name: 'Mastodon', color: '#6364FF', bg: '#15152D' },
  slack: { name: 'Slack', color: '#4A154B', bg: '#2D0A2D' },
  twitch: { name: 'Twitch', color: '#9146FF', bg: '#1A0A2D' },
  telegram: { name: 'Telegram', color: '#229ED9', bg: '#0A1F2D' },
  discord: { name: 'Discord', color: '#5865F2', bg: '#15152D' },
  skool: { name: 'Skool', color: '#E2AD44', bg: '#2D1A0A' },
  whop: { name: 'Whop', color: '#FF5A00', bg: '#2D150A' },
  kick: { name: 'Kick', color: '#53FC18', bg: '#0A2D0A' },
  warpcast: { name: 'Farcaster', color: '#8A63D2', bg: '#1A102D' },
  mewe: { name: 'MeWe', color: '#2F435E', bg: '#0A152D' },
  nostr: { name: 'Nostr', color: '#9B51E0', bg: '#1A102D' },
  medium: { name: 'Medium', color: '#000000', bg: '#1A1A1A' },
  devto: { name: 'DEV.to', color: '#0A0A0A', bg: '#1A1A1A' },
  hashnode: { name: 'Hashnode', color: '#2962FF', bg: '#0A152D' },
  lemmy: { name: 'Lemmy', color: '#00BC8C', bg: '#0A2D1A' },
  listmonk: { name: 'Listmonk', color: '#0045ff', bg: '#0A152D' },
  dribbble: { name: 'Dribbble', color: '#EA4C89', bg: '#2D0A1A' },
  reddit: { name: 'Reddit', color: '#FF4500', bg: '#2D150A' },
};