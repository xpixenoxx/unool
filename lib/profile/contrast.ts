/**
 * Shared WCAG 2.1 color contrast solver and palette utilities
 * for all 24 Unool public profile templates.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function normalizeHex(color: string | null | undefined, fallback = '#2563EB'): string {
  const trimmed = String(color ?? '').trim();
  const six = trimmed.match(/^#([0-9a-fA-F]{6})$/);
  if (six) return `#${six[1].toUpperCase()}`;

  const three = trimmed.match(/^#([0-9a-fA-F]{3})$/);
  if (three) {
    const [a, b, c] = three[1].split('');
    return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
  }

  return normalizeHexInternal(fallback);
}

function normalizeHexInternal(fallback: string): string {
  const m = fallback.trim().match(/^#([0-9a-fA-F]{6})$/);
  return m ? `#${m[1].toUpperCase()}` : '#2563EB';
}

export function hexToRgb(hex: string): RgbColor {
  const norm = normalizeHex(hex);
  const n = parseInt(norm.slice(1), 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

export function rgbaFromHex(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAA(fgHex: string, bgHex: string, largeText = false): boolean {
  const min = largeText ? 3.0 : 4.5;
  return contrastRatio(fgHex, bgHex) >= min;
}

export function pickReadableText(
  bgHex: string,
  lightText = '#FFFFFF',
  darkText = '#0F172A'
): string {
  const normBg = normalizeHex(bgHex, '#FFFFFF');
  const lightRatio = contrastRatio(lightText, normBg);
  const darkRatio = contrastRatio(darkText, normBg);
  if (Math.max(lightRatio, darkRatio) < 4.5 && darkText === '#0F172A') {
    return contrastRatio('#FFFFFF', normBg) >= contrastRatio('#050505', normBg)
      ? '#FFFFFF'
      : '#050505';
  }
  return lightRatio >= darkRatio ? lightText : darkText;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => Math.round(Math.max(0, Math.min(255, x * 255))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Ensures `accentColor` satisfies `minRatio` (default 4.5:1) against `surfaceHex`.
 * On dark surfaces, pushes lightness upward; on light surfaces, pushes lightness downward.
 */
export function solveAccessibleAccent(
  accentColor: string | null | undefined,
  surfaceHex: string,
  minRatio = 4.5,
  fallback = '#2563EB'
): string {
  const surface = normalizeHex(surfaceHex, '#FFFFFF');
  const candidate = normalizeHex(accentColor, fallback);

  if (contrastRatio(candidate, surface) >= minRatio) {
    return candidate;
  }

  const { r, g, b } = hexToRgb(candidate);
  const { h, s } = rgbToHsl(r, g, b);
  const surfaceLum = relativeLuminance(surface);
  const goLighter = surfaceLum < 0.35;

  let { l } = rgbToHsl(r, g, b);
  for (let step = 0; step < 30; step += 1) {
    l = goLighter ? Math.min(0.96, l + 0.03) : Math.max(0.12, l - 0.03);
    const adjusted = hslToHex(h, Math.min(0.9, Math.max(0.15, s)), l);
    if (contrastRatio(adjusted, surface) >= minRatio) {
      return adjusted;
    }
  }

  // Last-resort guaranteed contrast pole while preserving hue at high contrast
  const extreme = hslToHex(h, Math.min(0.35, s), goLighter ? 0.92 : 0.18);
  if (contrastRatio(extreme, surface) >= minRatio) {
    return extreme;
  }

  const pole = pickReadableText(surface, '#F8FAFC', '#0F172A');
  if (contrastRatio(pole, surface) >= minRatio) {
    return pole;
  }
  return pickReadableText(surface, '#FFFFFF', '#050505');
}

