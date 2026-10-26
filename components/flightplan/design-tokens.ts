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
  // Base surfaces (Parchment Palette)
  bg:          '#F5EFE8',        // Warm parchment cream
  bgElevated:  '#F0E7DD',        // Raised panels / ticket stub
  card:        '#FFFBF6',        // Primary card — pure warm ivory white
  cardHover:   '#F1DEDA',        // Hover tint
  cardBorder:  '#E3D6C9',        // Hairline border
  dash:        '#CDB9A8',        // Dashed perforation line
  cardShadow:  '0 2px 8px rgba(42,26,29,0.04), 0 1px 2px rgba(42,26,29,0.06)',
  cardShadowHover: '0 4px 16px rgba(42,26,29,0.08), 0 2px 4px rgba(42,26,29,0.04)',

  // Typography — Fraunces & DM Sans
  text:          '#2A1A1D',      // Deep warm maroon-espresso
  textSecondary: '#5C4448',      // Secondary warm brown-maroon
  textMuted:     '#8A7074',      // Helper / placeholder
  textLight:     '#A38C89',      // Lightest metadata / timestamps

  // Rich Maroon / Burgundy accent system (Parchment Palette)
  accent:       '#7A2E40',       // Rich rose-maroon accent
  accentHover:  '#6B1F33',       // Darker burgundy on hover
  accentDark:   '#4A1624',       // Deep wine active
  accentBg:     '#F1DEDA',       // Soft rose-cream background
  accentBgHover:'#EBD3D3',       // Accent bg hover
  accentBorder: '#E3D6C9',       // Accent hairline border
  accentGlow:   'rgba(122,46,64,0.22)',
  btn:          '#6B1F33',       // Burgundy primary button

  // Starfield Flight Stage (Deep wine luxury starfield)
  st1:          '#4A1624',       // Stage top
  st2:          '#2A0B14',       // Stage bottom
  heroBg:       'linear-gradient(160deg, #4A1624 0%, #2A0B14 100%)',
  heroText:     '#F6EDE6',
  glow:         '#E8B4A8',       // Trajectory glow stroke

  // Status: success / published
  success:       '#3F7D52',
  successBg:     '#E4F0E7',
  successBorder: '#C5E0CE',
  successGlow:   'rgba(63,125,82,0.18)',

  // Status: info
  info:          '#5B8FC9',
  infoBg:        '#EBF0F7',
  infoBorder:    '#C9D9ED',
  infoGlow:      'rgba(91,143,201,0.18)',

  // Status: warning / held
  warning:       '#C98A3A',
  warningBg:     '#F6E3D4',
  warningBorder: '#E3D6C9',
  warningGlow:   'rgba(201,138,58,0.22)',

  // Status: danger / validation error
  danger:        '#B0432E',
  dangerBg:      '#FBEDED',
  dangerBorder:  '#EFC7C6',
  dangerGlow:    'rgba(176,67,46,0.18)',

  // Utility
  border:      '#E3D6C9',
  borderLight: '#F0E7DD',
  inputBg:     '#FFFBF6',
  glass:       'rgba(255,251,246,0.92)',
  glassBorder: '#E3D6C9',
  overlay:     'rgba(42,26,29,0.35)',
  now:         '#C0502F',
} as const;

export const COL = [
  '#C0607A', // Monday: Dusty Rose
  '#CC6B43', // Tuesday: Terracotta
  '#C05A4C', // Wednesday: Brick Red
  '#5E9E70', // Thursday: Forest Sage
  '#9A6B8E', // Friday: Mauve Violet (Peak / CTA)
  '#5B8FC9', // Saturday: Cerulean
  '#C98A3A', // Sunday: Amber
];

export const BEAT_COLORS: Record<string, string> = {
  Hook: '#C0607A',
  Context: '#CC6B43',
  Challenge: '#C05A4C',
  Proof: '#5E9E70',
  CTA: '#9A6B8E',
  Community: '#5B8FC9',
  Horizon: '#C98A3A',
  'Departure Hook': '#C0607A',
  'Cruising Altitude': '#CC6B43',
  'Turbulence & Pivot': '#C05A4C',
  'Flight Telemetry': '#5E9E70',
  'Final Approach': '#9A6B8E',
  'Open Frequency': '#5B8FC9',
  'Next Horizon': '#C98A3A',
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