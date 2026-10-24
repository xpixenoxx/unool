'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Zap,
  Star,
  Award,
  Users,
  Briefcase,
  Download,
  Copy,
  Loader2,
  Menu,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { SocialIcon, normalizeSocialPlatform, BRAND_SVGS } from '@/components/profile/SocialBrandIcons';
import { OpenToBadges, type OpenToIntentId } from '@/components/profile/OpenToBadges';
import { RecentActivitySection, type RecentActivityData } from '@/components/profile/RecentActivitySection';
import type { TemplateProps, PublicProfile, ProfileLink, ProfileProof } from '@/components/profile/templates/types';

interface ProjectDrawerProps {
  project: NonNullable<PublicProfile['links']>[0];
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

interface SocialLink {
  label: string;
  url: string;
  icon?: string | null;
  platform: string;
  brandSvg?: React.ReactNode;
}

interface ProofPoint {
  id: string;
  title: string;
  value: string;
  description: string | null;
  icon: string | null;
  order: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Monolith {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  rotation: number;
  targetRotation: number;
  vertices: { x: number; y: number }[];
  color: string;
  opacity: number;
  driftSpeed: number;
  driftPhase: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
  life: number;
}

interface Caustic {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  phase: number;
  speed: number;
}

/* ────────────────────────── Design Tokens (CSS Variables) ────────────────────────── */

const STUDIO_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    /* Luxury Atelier Palette — Deep Petrol Jade & Basalt */
    --studio-void: #06100E;
    --studio-basalt: #0B1B18;
    --studio-deep: #102621;
    --studio-elevated: #143028;
    --studio-surface: #1A3A30;
    --studio-card: #1E4438;
    --studio-border: #2A5546;
    --studio-border-subtle: #22483A;
    --studio-mica: #3D705E;
    --studio-mica-subtle: #346052;

    /* Frosted Glass — Smoked Emerald & Obsidian */
    --glass-bg: rgba(13, 30, 26, 0.65);
    --glass-bg-strong: rgba(13, 30, 26, 0.85);
    --glass-border: rgba(180, 215, 200, 0.12);
    --glass-border-bright: rgba(180, 215, 200, 0.22);
    --glass-shadow: 0 8px 32px rgba(6, 16, 14, 0.4), 0 0 0 1px rgba(180, 215, 200, 0.05);
    --glass-blur: saturate(180%) blur(24px);
    --glass-inner-glow: inset 0 1px 0 rgba(180, 215, 200, 0.08);

    /* Accents — Liquid Champagne Gold, Acid Citrine, Polished Titanium */
    --accent-gold: #E6C875;
    --accent-gold-dim: #D4B860;
    --accent-gold-glow: rgba(230, 200, 117, 0.35);
    --accent-gold-subtle: rgba(230, 200, 117, 0.1);
    --accent-citrine: #D4FF70;
    --accent-citrine-dim: #B8E05A;
    --accent-citrine-glow: rgba(212, 255, 112, 0.3);
    --accent-citrine-subtle: rgba(212, 255, 112, 0.08);
    --accent-titanium: #F1F5F9;
    --accent-titanium-dim: #CBD5E1;
    --accent-titanium-muted: #94A3B8;

    /* Semantic */
    --text-primary: #F8FAF7;
    --text-secondary: #D4E4DD;
    --text-muted: #8BA89B;
    --text-dim: #5D7A6E;
    --text-inverse: #06100E;

    /* Status */
    --status-open: #D4FF70;
    --status-open-glow: rgba(212, 255, 112, 0.4);
    --status-busy: #FF6B4A;
    --status-busy-glow: rgba(255, 107, 74, 0.4);
    --status-retainer: #E6C875;
    --status-retainer-glow: rgba(230, 200, 117, 0.4);

    /* Spacing Scale */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 24px;
    --space-6: 32px;
    --space-7: 48px;
    --space-8: 64px;
    --space-9: 96px;
    --space-10: 128px;

    /* Typography Scale */
    --text-xs: 0.6875rem;    /* 11px */
    --text-sm: 0.8125rem;    /* 13px */
    --text-base: 0.9375rem;  /* 15px */
    --text-lg: 1.125rem;     /* 18px */
    --text-xl: 1.375rem;     /* 22px */
    --text-2xl: 1.75rem;     /* 28px */
    --text-3xl: 2.25rem;     /* 36px */
    --text-4xl: 3rem;        /* 48px */
    --text-5xl: 4rem;        /* 64px */
    --text-6xl: 5.5rem;      /* 88px */
    --text-7xl: 7rem;        /* 112px */

    /* Radius */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-2xl: 32px;
    --radius-full: 9999px;

    /* Shadows — Layered, Premium */
    --shadow-xs: 0 1px 2px rgba(6, 16, 14, 0.3);
    --shadow-sm: 0 2px 8px rgba(6, 16, 14, 0.35);
    --shadow-md: 0 8px 24px rgba(6, 16, 14, 0.4);
    --shadow-lg: 0 16px 48px rgba(6, 16, 14, 0.45);
    --shadow-xl: 0 24px 64px rgba(6, 16, 14, 0.5);
    --shadow-2xl: 0 32px 80px rgba(6, 16, 14, 0.55);
    --shadow-gold: 0 0 60px var(--accent-gold-glow);
    --shadow-citrine: 0 0 40px var(--accent-citrine-glow);
    --shadow-inner: inset 0 1px 0 rgba(180, 215, 200, 0.06);

    /* Transitions */
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-expo: cubic-bezier(0.87, 0, 0.13, 1);
    --duration-fast: 150ms;
    --duration-base: 250ms;
    --duration-slow: 400ms;
    --duration-slower: 600ms;
    --duration-slowest: 1000ms;
  }

  /* Force dark luxury mode — no light variant */
  .studio-template {
    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--studio-void);
    color: var(--text-primary);
    min-height: 100vh;
    width: 100%;
    position: relative;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  .font-editorial { font-family: 'Cinzel', 'Playfair Display', Georgia, serif; }
  .font-display { font-family: 'Playfair Display', Georgia, serif; }
  .font-ui { font-family: 'Space Grotesk', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }

  /* Glass Cards — Multiple Elevations */
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--glass-shadow), var(--glass-inner-glow);
    transition: all var(--duration-base) var(--ease-out);
  }

  .glass-card:hover {
    border-color: var(--glass-border-bright);
    box-shadow: var(--shadow-md), 0 0 0 1px var(--accent-gold-subtle), var(--glass-inner-glow);
    transform: translateY(-2px);
  }

  .glass-card-elevated {
    background: var(--glass-bg-strong);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border-bright);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg), var(--glass-inner-glow);
  }

  .glass-card-subtle {
    background: rgba(13, 30, 26, 0.45);
    backdrop-filter: saturate(150%) blur(16px);
    -webkit-backdrop-filter: saturate(150%) blur(16px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .glass-card-interactive {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--glass-shadow), var(--glass-inner-glow);
    transition: all var(--duration-base) var(--ease-out);
    cursor: pointer;
  }

  .glass-card-interactive:hover {
    border-color: var(--accent-gold);
    box-shadow: var(--shadow-lg), var(--shadow-gold), var(--glass-inner-glow);
    transform: translateY(-4px) scale(1.01);
  }

  .glass-card-interactive:active {
    transform: translateY(-1px) scale(0.995);
  }

  /* Buttons — Premium */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-dim) 100%);
    color: var(--text-inverse);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--text-sm);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: var(--radius-full);
    border: none;
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-out);
    box-shadow: var(--shadow-sm), 0 0 0 1px var(--accent-gold-subtle);
    position: relative;
    overflow: hidden;
  }

  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--accent-citrine) 0%, var(--accent-gold) 100%);
    opacity: 0;
    transition: opacity var(--duration-base) var(--ease-out);
  }

  .btn-primary:hover::before { opacity: 1; }
  .btn-primary > * { position: relative; z-index: 1; }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md), var(--shadow-gold), var(--shadow-citrine);
  }

  .btn-primary:active { transform: translateY(0); }

  .btn-primary:focus-visible {
    outline: 2px solid var(--accent-gold);
    outline-offset: 3px;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    background: transparent;
    color: var(--text-secondary);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 500;
    font-size: var(--text-sm);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: var(--radius-full);
    border: 1px solid var(--glass-border);
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-out);
  }

  .btn-secondary:hover {
    background: var(--glass-bg-strong);
    border-color: var(--accent-gold);
    color: var(--accent-gold);
    box-shadow: var(--shadow-sm), 0 0 0 1px var(--accent-gold-subtle);
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: transparent;
    color: var(--text-muted);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 500;
    font-size: var(--text-xs);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
  }

  .btn-ghost:hover {
    background: var(--accent-gold-subtle);
    color: var(--accent-gold);
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-full);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
  }

  .btn-icon:hover {
    background: var(--glass-bg-strong);
    border-color: var(--accent-gold);
    color: var(--accent-gold);
    transform: scale(1.05);
  }

  .btn-icon.active {
    background: var(--accent-gold-subtle);
    border-color: var(--accent-gold);
    color: var(--accent-gold);
  }

  /* Focus visible */
  :focus-visible {
    outline: 2px solid var(--accent-gold);
    outline-offset: 2px;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--studio-border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--accent-gold); }

  /* Selection */
  ::selection { background: var(--accent-gold); color: var(--text-inverse); }

  /* Utilities */
  .text-balance { text-wrap: balance; }
  .text-pretty { text-wrap: pretty; }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar { display: none; }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    .studio-atmosphere-canvas { display: none !important; }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    :root {
      --glass-border: rgba(180, 215, 200, 0.5);
      --glass-border-bright: rgba(180, 215, 200, 0.8);
      --text-muted: #B8D0C4;
    }
  }
`;

/* ────────────────────────── Utility Functions ────────────────────────── */

const formatTimezone = (tz?: string) => {
  if (!tz) return 'UTC';
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return 'UTC';
  }
};

const getTimezoneAbbr = (tz?: string) => {
  if (!tz) return 'UTC';
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).split(' ').pop() || 'UTC';
  } catch {
    return 'UTC';
  }
};

const generateVCard = (profile: PublicProfile) => {
  const nameParts = profile.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
  if (profile.name) vcard += `FN:${profile.name}\n`;
  if (firstName || lastName) vcard += `N:${lastName};${firstName};;;\n`;
  if (profile.headline) vcard += `TITLE:${profile.headline}\n`;
  if (profile.company) vcard += `ORG:${profile.company}\n`;
  if (profile.role) vcard += `ROLE:${profile.role}\n`;
  const emailLink = profile.links?.find(l => l.label.toLowerCase().includes('email') || l.url.startsWith('mailto:'));
  if (emailLink) vcard += `EMAIL;TYPE=WORK:${emailLink.url.replace('mailto:', '')}\n`;
  const phoneLink = profile.links?.find(l => l.url.startsWith('tel:'));
  if (phoneLink) vcard += `TEL;TYPE=WORK,VOICE:${phoneLink.url.replace('tel:', '')}\n`;
  if (profile.subdomain) vcard += `URL:https://${profile.subdomain}.unool.com\n`;
  vcard += 'END:VCARD';
  return vcard;
};

const downloadVCard = (profile: PublicProfile) => {
  const vcard = generateVCard(profile);
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${(profile.name || 'contact').replace(/\s+/g, '_')}.vcf`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true, message: `Copied ${label}` };
  } catch {
    return { success: false, message: 'Failed to copy' };
  }
};

const normalizeSocialLinks = (profile: PublicProfile): SocialLink[] => {
  const links: SocialLink[] = [];

  if (profile.links?.length) {
    profile.links.forEach((link) => {
      if (!link.isVisible) return;
      const platform = normalizeSocialPlatform(link.label, link.url, link.icon || undefined);
      links.push({
        label: link.label,
        url: link.url,
        icon: link.icon,
        platform,
        brandSvg: BRAND_SVGS[platform as keyof typeof BRAND_SVGS],
      });
    });
  }

  if (profile.socialHandles) {
    Object.entries(profile.socialHandles).forEach(([key, val]) => {
      if (!val) return;
      const platform = normalizeSocialPlatform(key, val);
      if (!links.some(l => l.platform === platform)) {
        links.push({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          url: val,
          icon: key,
          platform,
          brandSvg: BRAND_SVGS[platform as keyof typeof BRAND_SVGS],
        });
      }
    });
  }

  return links;
};

const getProofPoints = (profile: PublicProfile): ProofPoint[] => {
  return (profile.proofs || [])
    .filter((p): p is ProfileProof => !!p && !!(p.value || p.title))
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      id: p.id,
      title: p.title,
      value: p.value,
      description: p.description,
      icon: p.icon,
      order: p.order,
    }));
};

/* ────────────────────────── Studio Atmosphere Canvas ────────────────────────── */

function StudioAtmosphereCanvas({
  isActive,
  prefersReducedMotion,
  onMonolithsReady,
}: {
  isActive: boolean;
  prefersReducedMotion: boolean;
  onMonolithsReady?: (count: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const monolithsRef = useRef<Monolith[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const causticsRef = useRef<Caustic[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const timeRef = useRef(0);
  const dprRef = useRef(1);
  const sizeRef = useRef({ width: 0, height: 0 });

  // Initialize monoliths
  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    const resize = () => {
      dprRef.current = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = rect.width * dprRef.current;
      canvas.height = rect.height * dprRef.current;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dprRef.current, dprRef.current);

      // Initialize monoliths
      if (monolithsRef.current.length === 0) {
        const count = Math.min(5, Math.max(3, Math.floor(rect.width / 400)));
        monolithsRef.current = Array.from({ length: count }, (_, i) => createMonolith(i, rect.width, rect.height));
        onMonolithsReady?.(count);
      }

      // Initialize caustics
      if (causticsRef.current.length === 0) {
        causticsRef.current = Array.from({ length: 8 }, (_, i) => createCaustic(i, rect.width, rect.height));
      }
    };

    const createMonolith = (index: number, w: number, h: number): Monolith => {
      const sides = 4 + Math.floor(Math.random() * 4); // 4-7 sides
      const size = 40 + Math.random() * 80;
      const vertices = Array.from({ length: sides }, (_, i) => {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
        const variance = 0.7 + Math.random() * 0.3;
        return {
          x: Math.cos(angle) * size * variance,
          y: Math.sin(angle) * size * variance,
        };
      });

      return {
        id: index,
        x: Math.random() * w,
        y: Math.random() * h,
        baseX: Math.random() * w,
        baseY: Math.random() * h,
        size,
        rotation: Math.random() * Math.PI * 2,
        targetRotation: Math.random() * Math.PI * 2,
        vertices,
        color: Math.random() > 0.5 ? '#1A2E26' : '#244034',
        opacity: 0.15 + Math.random() * 0.15,
        driftSpeed: 0.0003 + Math.random() * 0.0005,
        driftPhase: Math.random() * Math.PI * 2,
      };
    };

    const createCaustic = (index: number, w: number, h: number): Caustic => ({
      x: Math.random() * w,
      y: Math.random() * h,
      width: 100 + Math.random() * 200,
      height: 30 + Math.random() * 60,
      opacity: 0.02 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0005 + Math.random() * 0.001,
    });

    const createRipple = (x: number, y: number): Ripple => ({
      x,
      y,
      radius: 0,
      maxRadius: 100 + Math.random() * 200,
      opacity: 0.15 + Math.random() * 0.1,
      speed: 0.5 + Math.random() * 0.5,
      life: 1,
    });

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = (e.clientX - rect.left) / rect.width;
      mouseRef.current.targetY = (e.clientY - rect.top) / rect.height;

      // Create ripple occasionally
      if (Math.random() < 0.02) {
        ripplesRef.current.push(createRipple(e.clientX - rect.left, e.clientY - rect.top));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);
    resize();

    // Animation loop
    const animate = (timestamp: number) => {
      if (!isActive || prefersReducedMotion) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = timestamp - timeRef.current;
      timeRef.current = timestamp;
      const t = timestamp * 0.001;

      const { width, height } = sizeRef.current;
      if (!width || !height) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse follow
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Draw base fluid plane
      drawFluidPlane(ctx, width, height, t);

      // Draw caustics
      drawCaustics(ctx, width, height, t);

      // Update and draw monoliths
      updateMonoliths(dt, width, height, t, mouseRef.current);
      drawMonoliths(ctx, width, height);

      // Update and draw ripples
      updateRipples(dt);
      drawRipples(ctx);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, prefersReducedMotion, onMonolithsReady]);

  const drawFluidPlane = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    // Subtle gradient base
    const gradient = ctx.createRadialGradient(
      w * mouseRef.current.x, h * mouseRef.current.y, 0,
      w * mouseRef.current.x, h * mouseRef.current.y, Math.max(w, h) * 0.8
    );
    gradient.addColorStop(0, 'rgba(20, 48, 40, 0.3)');
    gradient.addColorStop(0.5, 'rgba(16, 27, 24, 0.2)');
    gradient.addColorStop(1, 'rgba(6, 16, 14, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Subtle scanlines for texture
    ctx.strokeStyle = 'rgba(180, 215, 200, 0.015)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y + (t * 10) % 3);
      ctx.lineTo(w, y + (t * 10) % 3);
      ctx.stroke();
    }
  };

  const drawCaustics = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    causticsRef.current.forEach(caustic => {
      caustic.phase += caustic.speed * 60;
      const offsetX = Math.sin(caustic.phase) * 30;
      const offsetY = Math.cos(caustic.phase * 0.7) * 20;

      const gradient = ctx.createRadialGradient(
        caustic.x + offsetX, caustic.y + offsetY, 0,
        caustic.x + offsetX, caustic.y + offsetY, Math.max(caustic.width, caustic.height) * 0.5
      );
      gradient.addColorStop(0, `rgba(180, 215, 200, ${caustic.opacity})`);
      gradient.addColorStop(1, 'rgba(180, 215, 200, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(
        caustic.x + offsetX, caustic.y + offsetY,
        caustic.width * 0.5, caustic.height * 0.5,
        Math.sin(t * 0.5 + caustic.phase) * 0.3,
        0, Math.PI * 2
      );
      ctx.fill();
    });
  };

  const updateMonoliths = (dt: number, w: number, h: number, t: number, mouse: { x: number; y: number }) => {
    monolithsRef.current.forEach((m, i) => {
      // Gentle drift
      m.driftPhase += m.driftSpeed * dt;
      m.x = m.baseX + Math.sin(m.driftPhase) * 40 + Math.cos(m.driftPhase * 0.7) * 20;
      m.y = m.baseY + Math.cos(m.driftPhase * 0.9) * 30 + Math.sin(m.driftPhase * 1.3) * 15;

      // Mouse influence
      const dx = (mouse.x * w) - m.x;
      const dy = (mouse.y * h) - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / 400) * 0.02;
      m.x += dx * influence;
      m.y += dy * influence;

      // Rotation
      m.targetRotation = Math.atan2(dy, dx) * 0.1 + Math.sin(t * 0.1 + i) * 0.05;
      m.rotation += (m.targetRotation - m.rotation) * 0.02;

      // Boundary wrapping
      if (m.x < -100) { m.x = w + 100; m.baseX = w + 100; }
      if (m.x > w + 100) { m.x = -100; m.baseX = -100; }
      if (m.y < -100) { m.y = h + 100; m.baseY = h + 100; }
      if (m.y > h + 100) { m.y = -100; m.baseY = -100; }
    });
  };

  const drawMonoliths = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    monolithsRef.current.forEach(m => {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rotation);

      // Outer glow
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, m.size * 1.5);
      glow.addColorStop(0, `${m.color}33`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      m.vertices.forEach((v, i) => {
        if (i === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      });
      ctx.closePath();
      ctx.fill();

      // Main body
      ctx.fillStyle = m.color;
      ctx.globalAlpha = m.opacity;
      ctx.beginPath();
      m.vertices.forEach((v, i) => {
        if (i === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Facet lines
      ctx.strokeStyle = 'rgba(180, 215, 200, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      m.vertices.forEach((v, i) => {
        if (i === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      });
      ctx.closePath();
      ctx.stroke();

      // Highlight edge
      const highlightAngle = m.rotation + Math.PI * 0.25;
      const hx = Math.cos(highlightAngle) * m.size * 0.5;
      const hy = Math.sin(highlightAngle) * m.size * 0.5;
      ctx.strokeStyle = 'rgba(230, 200, 117, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx * 1.5, hy * 1.5);
      ctx.stroke();

      ctx.restore();
    });
  };

  const updateRipples = (dt: number) => {
    ripplesRef.current = ripplesRef.current.filter(r => {
      r.radius += r.speed * dt * 0.1;
      r.life = 1 - r.radius / r.maxRadius;
      return r.life > 0 && r.radius < r.maxRadius;
    });
  };

  const drawRipples = (ctx: CanvasRenderingContext2D) => {
    ripplesRef.current.forEach(r => {
      const alpha = r.opacity * r.life;
      ctx.strokeStyle = `rgba(180, 215, 200, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner caustic ring
      ctx.strokeStyle = `rgba(230, 200, 117, ${alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    });
  };

  if (!isActive || prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="studio-atmosphere-canvas fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

/* ────────────────────────── Toast Stack ────────────────────────── */

function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    (window as any).__studioToast = showToast;
    return () => { delete (window as any).__studioToast; };
  }, [showToast]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="pointer-events-auto glass-card-elevated px-5 py-3.5 flex items-center gap-3 min-w-[260px] max-w-[90vw]"
          style={{
            borderLeftWidth: '4px',
            borderLeftColor: toast.type === 'success' ? 'var(--accent-citrine)' :
              toast.type === 'error' ? 'var(--status-busy)' : 'var(--accent-gold)',
          }}
        >
          {toast.type === 'success' && <Check className="w-5 h-5" style={{ color: 'var(--accent-citrine)' }} aria-hidden="true" />}
          {toast.type === 'error' && <X className="w-5 h-5" style={{ color: 'var(--status-busy)' }} aria-hidden="true" />}
          {toast.type === 'info' && <Zap className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} aria-hidden="true" />}
          <span className="font-ui text-sm font-medium">{toast.message}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ────────────────────────── Live Clock ────────────────────────── */

function LiveClock({ timezone }: { timezone?: string }) {
  const [time, setTime] = useState(() => formatTimezone(timezone));
  const [abbr, setAbbr] = useState(() => getTimezoneAbbr(timezone));

  useEffect(() => {
    const update = () => {
      setTime(formatTimezone(timezone));
      setAbbr(getTimezoneAbbr(timezone));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="flex items-center gap-2 font-mono text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
      <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} aria-hidden="true" />
      <span aria-live="off">{time}</span>
      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
        style={{ background: 'var(--accent-gold-subtle)', color: 'var(--accent-gold)' }}>
        {abbr}
      </span>
    </div>
  );
}

/* ────────────────────────── Availability Pill ────────────────────────── */

function AvailabilityPill({ availability }: { availability?: string }) {
  if (!availability) return null;

  const statuses: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; glow: string; pulse: boolean }> = {
    'accepting select commissions': { label: 'ACCEPTING SELECT COMMISSIONS', icon: Zap, color: 'var(--accent-citrine)', bg: 'rgba(212, 255, 112, 0.1)', glow: 'var(--accent-citrine-glow)', pulse: true },
    'open for work': { label: 'OPEN FOR WORK', icon: Zap, color: 'var(--accent-citrine)', bg: 'rgba(212, 255, 112, 0.1)', glow: 'var(--accent-citrine-glow)', pulse: true },
    'available': { label: 'AVAILABLE', icon: Zap, color: 'var(--accent-citrine)', bg: 'rgba(212, 255, 112, 0.1)', glow: 'var(--accent-citrine-glow)', pulse: true },
    'booked': { label: 'FULLY BOOKED', icon: Clock, color: 'var(--status-busy)', bg: 'rgba(255, 107, 74, 0.1)', glow: 'var(--status-busy-glow)', pulse: false },
    'on retainer': { label: 'ON RETAINER', icon: Star, color: 'var(--accent-gold)', bg: 'rgba(230, 200, 117, 0.1)', glow: 'var(--accent-gold-glow)', pulse: false },
    'retainer': { label: 'ON RETAINER', icon: Star, color: 'var(--accent-gold)', bg: 'rgba(230, 200, 117, 0.1)', glow: 'var(--accent-gold-glow)', pulse: false },
    'busy': { label: 'BUSY', icon: Clock, color: 'var(--status-busy)', bg: 'rgba(255, 107, 74, 0.1)', glow: 'var(--status-busy-glow)', pulse: false },
    'selective': { label: 'SELECTIVE INQUIRIES', icon: Award, color: 'var(--accent-gold)', bg: 'rgba(230, 200, 117, 0.1)', glow: 'var(--accent-gold-glow)', pulse: false },
  };

  const normalized = availability.toLowerCase().trim();
  const config = statuses[normalized] || {
    label: availability.toUpperCase(),
    icon: Clock,
    color: 'var(--text-muted)',
    bg: 'var(--glass-bg)',
    glow: 'transparent',
    pulse: false,
  };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-ui text-xs font-semibold uppercase tracking-wider"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}33` }}
    >
      {config.pulse && (
        <motion.span
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5], boxShadow: [`0 0 0 ${config.glow}`, `0 0 12px ${config.glow}`, `0 0 0 ${config.glow}`] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-2 h-2 rounded-full"
          style={{ background: config.color }}
          aria-hidden="true"
        />
      )}
      {!config.pulse && (
        <span className="w-2 h-2 rounded-full" style={{ background: config.color }} aria-hidden="true" />
      )}
      <span>{config.label}</span>
    </motion.div>
  );
}

/* ────────────────────────── FX Toggle ────────────────────────── */

function FXToggle({ isActive, onToggle, prefersReducedMotion }: { isActive: boolean; onToggle: () => void; prefersReducedMotion: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={prefersReducedMotion}
      className={`btn-icon ${isActive ? 'active' : ''}`}
      aria-label={isActive ? 'Disable canvas effects' : 'Enable canvas effects'}
      aria-pressed={isActive}
      title={prefersReducedMotion ? 'Effects disabled (reduced motion)' : isActive ? 'FX ON — Click to disable' : 'FX OFF — Click to enable'}
    >
      <Monitor className="w-5 h-5" aria-hidden="true" />
      {prefersReducedMotion && <span className="absolute -top-1 -right-1 w-4 h-4">⚠</span>}
    </button>
  );
}

/* ────────────────────────── Top Navigation Bar ────────────────────────── */

function TopNav({
  profile,
  socialLinks,
  onCopyEmail,
  onDownloadVCard,
  onToggleFX,
  fxActive,
  prefersReducedMotion,
  timezone,
}: {
  profile: PublicProfile;
  socialLinks: SocialLink[];
  onCopyEmail: () => void;
  onDownloadVCard: () => void;
  onToggleFX: () => void;
  fxActive: boolean;
  prefersReducedMotion: boolean;
  timezone?: string;
}) {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="sticky top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-8 bg-[rgba(6,16,14,0.85)] backdrop-blur-xl border-b border-[var(--studio-border-subtle)]"
      style={{ height: '72px' }}
    >
      <div className="max-w-[1040px] mx-auto flex items-center justify-between h-[72px]">
        {/* Left: Studio Monogram + Location */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-dim) 100%)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-inverse)]" aria-hidden="true">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <line x1="12" y1="22" x2="12" y2="15.5" />
                <line x1="22" y1="8.5" x2="12" y2="15.5" />
                <line x1="2" y1="8.5" x2="12" y2="15.5" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />
            </div>
            <span className="font-editorial text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {profile.name}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 glass-card-subtle rounded-full"
            style={{ borderColor: 'var(--glass-border-bright)' }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} aria-hidden="true" />
            <span className="font-ui text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {profile.company || profile.role || 'Independent Studio'}
            </span>
          </div>
        </div>

        {/* Center: Live Clock */}
        <div className="hidden lg:flex items-center justify-center">
          <LiveClock timezone={timezone} />
        </div>

        {/* Right: Availability, FX Toggle, Actions */}
        <div className="flex items-center gap-3">
          <AvailabilityPill availability={profile.headline} />

          <FXToggle
            isActive={fxActive}
            onToggle={onToggleFX}
            prefersReducedMotion={prefersReducedMotion}
          />

          {profile.links?.some(l => l.url.startsWith('mailto:')) && (
            <button
              onClick={onCopyEmail}
              className="btn-icon"
              aria-label="Copy email address"
              title="Copy Email"
            >
              <Mail className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          <button
            onClick={onDownloadVCard}
            className="btn-icon"
            aria-label="Download vCard"
            title="Save Contact"
          >
            <Download className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ────────────────────────── Identity Core ────────────────────────── */

function IdentityCore({ profile, socialLinks, openToIntents }: { profile: PublicProfile; socialLinks: SocialLink[]; openToIntents: string[] }) {
  return (
    <section className="relative w-full pt-4 md:pt-6">
      <div className="w-full">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Identity */}
          <div className="lg:col-span-7 space-y-8">
            {/* Studio Name */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-editorial font-semibold leading-[1.02] tracking-tight text-balance"
                style={{
    fontSize: 'clamp(2.75rem, 6.5vw, 5.5rem)',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #E6C875 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.025em',
  }}>
                {profile.name}
              </h1>
            </motion.div>

            {/* Subdomain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="font-mono text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              @{profile.subdomain} <span style={{ color: 'var(--studio-border)' }}>·</span> <span className="font-ui font-medium" style={{ color: 'var(--accent-gold)' }}>unool.com</span>
            </motion.div>

            {/* Manifesto / Headline */}
            {profile.headline && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="font-display italic leading-relaxed text-balance max-w-2xl"
                style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', color: 'var(--text-secondary)', lineHeight: 1.5 }}
              >
                &ldquo;{profile.headline}&rdquo;
              </motion.div>
            )}

            {/* Bio */}
            {profile.bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="font-ui leading-relaxed max-w-2xl text-pretty"
                style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.7 }}
              >
                {profile.bio}
              </motion.div>
            )}

            {/* OpenToBadges rendered globally at bottom by IdentityTemplate router */}

            {/* Social Brand Ecosystem — Horizontal Scroll Rail */}
            {socialLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="pt-4 border-t"
                style={{ borderColor: 'var(--studio-border-subtle)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-ui text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                    ECOSYSTEM
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
                    {socialLinks.length}
                  </span>
                </div>
                <SocialRail links={socialLinks} />
              </motion.div>
            )}
          </div>

          {/* Right Column: Avatar + Quick Stats */}
          <div className="lg:col-span-5 relative" style={{ zIndex: 10 }}>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="sticky top-28"
            >
              {profile.avatarUrl ? (
                <div className="relative aspect-[4/5] max-w-[280px] sm:max-w-[320px] mx-auto lg:ml-auto rounded-2xl overflow-hidden mb-6 p-1.5 glass-card-elevated border border-[var(--glass-border-bright)] shadow-[0_20px_50px_rgba(0,0,0,0.6)] group">
                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-[var(--studio-basalt)]">
                    <img
                      src={profile.avatarUrl}
                      alt={`${profile.name} — Studio Portrait`}
                      className="w-full h-full object-cover contrast-[1.03] brightness-[0.98] transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {/* Atmospheric vignette overlays to blend portrait image seamlessly */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--studio-void)] via-transparent to-transparent opacity-60" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--studio-void)]/40 via-transparent to-transparent opacity-40" />

                    {/* Monogram Seal Badge */}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-[rgba(6,16,14,0.85)] backdrop-blur-md border border-[rgba(230,200,117,0.3)] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-citrine)' }} aria-hidden="true" />
                      <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-[var(--accent-gold)]">
                        ATELIER // {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'TC'}
                      </span>
                    </div>
                  </div>

                  {/* Metallic Corner Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-xl pointer-events-none" style={{ borderColor: 'var(--accent-gold)' }} aria-hidden="true" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-xl pointer-events-none" style={{ borderColor: 'var(--accent-citrine)' }} aria-hidden="true" />
                </div>
              ) : (
                <div className="relative aspect-[4/5] max-w-[280px] sm:max-w-[320px] mx-auto lg:ml-auto rounded-2xl overflow-hidden mb-6 p-1.5 glass-card-elevated border border-[var(--glass-border-bright)] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-[var(--studio-basalt)] flex flex-col items-center justify-center p-8 text-center border border-[var(--studio-border)]">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-[var(--accent-gold-subtle)] to-transparent border border-[var(--accent-gold)] shadow-[0_0_30px_var(--accent-gold-glow)]">
                      <span className="font-editorial text-3xl font-bold text-[var(--accent-gold)]">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)]">
                      CREATIVE ATELIER
                    </span>
                    <span className="font-editorial text-sm italic text-[var(--text-secondary)] mt-1">
                      {profile.role || 'Design & Direction'}
                    </span>
                  </div>
                </div>
              )}

              {/* Studio Practice Details */}
              <div className="glass-card-elevated p-6 space-y-4 border border-[var(--glass-border-bright)] rounded-2xl max-w-[280px] sm:max-w-[320px] mx-auto lg:ml-auto shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--studio-border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[var(--accent-citrine)]" aria-hidden="true" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
                      ATELIER DOSSIER
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-dim)]">
                    EST. {new Date().getFullYear()}
                  </span>
                </div>
                <div className="space-y-3 text-xs font-ui">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-mono text-[10px] uppercase text-[var(--text-dim)]">Discipline</span>
                    <span className="font-medium text-right text-[var(--text-secondary)] truncate">
                      {profile.role || "Brand & Digital Direction"}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-mono text-[10px] uppercase text-[var(--text-dim)]">Practice</span>
                    <span className="font-medium text-right text-[var(--text-secondary)] truncate">
                      {profile.company || "Independent Studio"}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2 pt-1 border-t border-[var(--studio-border-subtle)]">
                    <span className="font-mono text-[10px] uppercase text-[var(--text-dim)]">Commissions</span>
                    <span className="font-semibold text-right text-[var(--accent-citrine)] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-citrine)] animate-ping" />
                      Accepting Select Briefs
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Social Rail ────────────────────────── */

function SocialRail({ links }: { links: SocialLink[] }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setScrollPosition(scrollLeft);
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [handleScroll, links.length]);

  const scrollLeft = () => containerRef.current?.scrollBy({ left: -220, behavior: 'smooth' });
  const scrollRight = () => containerRef.current?.scrollBy({ left: 220, behavior: 'smooth' });

  return (
    <div className="relative">
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 btn-icon active"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>
      )}

      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto scroll-snap-x pb-4 snap-mandatory -ml-4 pr-4 scrollbar-hide"
        onScroll={handleScroll}
      >
        <div style={{ width: '4px', flexShrink: 0 }} aria-hidden="true" />

        {links.map((link, index) => (
          <a
            key={`${link.platform}-${index}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 px-3.5 py-2.5 glass-card-interactive shrink-0 snap-start rounded-xl border border-[var(--glass-border)] hover:border-[var(--accent-gold)] bg-[var(--glass-bg)] transition-all duration-300 shadow-sm"
            style={{
              minWidth: '130px',
              borderColor: 'transparent',
            }}
            aria-label={link.label}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-[rgba(230,200,117,0.12)] border border-[rgba(230,200,117,0.25)] text-[var(--accent-gold)] group-hover:bg-[rgba(230,200,117,0.22)] group-hover:border-[var(--accent-gold)] transition-all duration-300">
              <SocialIcon label={link.label} url={link.url} icon={link.icon ?? undefined} className="w-4 h-4 fill-current" />
            </span>
            <span className="font-ui text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {link.label}
            </span>
            <span className="text-[10px] text-[var(--text-dim)] group-hover:text-[var(--accent-gold)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">↗</span>
          </a>
        ))}

        <div style={{ width: '4px', flexShrink: 0 }} aria-hidden="true" />
      </div>

      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 btn-icon active"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ────────────────────────── Proof Points Grid ────────────────────────── */

function ProofPointsGrid({ profile }: { profile: PublicProfile }) {
  const proofs = useMemo(() => getProofPoints(profile), [profile.proofs]);

  if (proofs.length === 0) return null;

  return (
    <section className="w-full pt-4" style={{ borderTop: '1px solid var(--studio-border-subtle)' }}>
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-px" style={{ background: 'var(--accent-gold)' }} />
            <span className="font-ui text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              PROOF POINTS
            </span>
          </div>
          <span className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
            {proofs.length}
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {proofs.map((proof, i) => (
            <motion.article
              key={proof.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="group relative glass-card-elevated p-6 md:p-8 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <span className="font-mono text-xs font-bold shrink-0" style={{ color: 'var(--text-dim)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent-gold-subtle)', color: 'var(--accent-gold)' }}>
                  <Award className="w-6 h-6" aria-hidden="true" />
                </div>
              </div>
              <div className="font-editorial text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                {proof.value}
              </div>
              <div className="font-ui text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {proof.title}
              </div>
              {proof.description && (
                <p className="mt-3 font-ui text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-dim)' }}>
                  {proof.description}
                </p>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--accent-gold)' }} />
              <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at top right, var(--accent-gold-subtle), transparent)' }} />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Portfolio / Featured Works Drawer ────────────────────────── */

function ProjectDrawer({ project, isOpen, onClose, accentColor }: ProjectDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      drawerRef.current?.focus();
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Tab') trapFocus(e);
  };

  const trapFocus = (e: KeyboardEvent) => {
    if (!drawerRef.current) return;
    const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  if (!isOpen || !project) return null;

  // Extract project data from link or use fallback
  const projectData = {
    title: project.label,
    description: 'Featured project or client engagement. Click to visit.',
    category: 'Client Work',
    year: new Date().getFullYear().toString(),
    tags: ['Design', 'Direction', 'Strategy'],
    metrics: [
      { label: 'IMPACT', value: 'HIGH' },
      { label: 'SCOPE', value: 'FULL' },
    ],
    url: project.url,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[90] flex items-center justify-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={onClose}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgba(6, 16, 14, 0.7)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          ref={drawerRef}
          tabIndex={-1}
          className="relative w-full max-w-xl md:max-w-2xl h-full md:h-[90vh] glass-card-elevated overflow-hidden flex flex-col"
          style={{
            borderLeftColor: accentColor,
            borderLeftWidth: '4px',
          }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: 'var(--studio-border)' }}>
            <div className="pr-4">
              <span className="font-ui text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                Project Detail
              </span>
              <h2 id="drawer-title" className="font-editorial text-2xl md:text-3xl font-semibold mt-1 text-balance" style={{ color: 'var(--text-primary)' }}>
                {projectData.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="btn-icon shrink-0"
              aria-label="Close project detail"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="relative aspect-video rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--studio-deep) 0%, var(--studio-basalt) 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-dim)' }}>
                <Briefcase className="w-16 h-16 opacity-20" aria-hidden="true" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </div>

            <div>
              <h3 className="font-ui text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
                Overview
              </h3>
              <p className="font-ui leading-relaxed text-base" style={{ color: 'var(--text-secondary)' }}>
                {projectData.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ borderTop: '1px solid var(--studio-border)', paddingTop: 'var(--space-6)' }}>
              {projectData.metrics.map((metric, i) => (
                <div key={i} className="text-center p-4 glass-card">
                  <div className="font-editorial text-3xl font-bold mb-1" style={{ color: accentColor }}>
                    {metric.value}
                  </div>
                  <div className="font-ui text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-ui text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
                Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {projectData.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--accent-gold-subtle)',
                      color: 'var(--accent-gold)',
                      border: '1px solid var(--accent-gold)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" aria-hidden="true" />
                <span className="font-medium">{projectData.category}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4" aria-hidden="true" />
                <span className="font-medium">{projectData.year}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4" style={{ borderTop: '1px solid var(--studio-border)' }}>
              {projectData.url && (
                <a
                  href={projectData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  View Project
                </a>
              )}
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PortfolioSection({ profile, accentColor }: { profile: PublicProfile; accentColor: string }) {
  const [openProject, setOpenProject] = useState<NonNullable<PublicProfile['links']>[0] | null>(null);
  const workLinks = useMemo(() =>
    profile.links?.filter(l => l.isVisible && (l.label.toLowerCase().includes('work') || l.label.toLowerCase().includes('project') || l.label.toLowerCase().includes('case') || l.label.toLowerCase().includes('portfolio'))) ||
    profile.links?.filter(l => l.isVisible).slice(0, 6) || [],
  [profile.links]);

  if (workLinks.length === 0) return null;

  return (
    <section className="w-full pt-4" style={{ borderTop: '1px solid var(--studio-border-subtle)' }}>
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-px" style={{ background: 'var(--accent-citrine)' }} />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-citrine)]">
              03 // SELECTED ENGAGEMENTS
            </span>
          </div>
          <span className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
            {workLinks.length}
          </span>
        </div>

        <h2 className="font-editorial font-semibold leading-[1.05] tracking-tight mb-8 text-balance"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: 'var(--text-primary)' }}>
          Selected <br />
          <span className="italic" style={{ color: 'var(--accent-gold)' }}>Engagements</span>
        </h2>

        <div className="space-y-3">
          {workLinks.map((project, i) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.5 }}
              className="group relative glass-card-interactive overflow-hidden"
              onClick={() => setOpenProject(project)}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex flex-col md:flex-row">
                {/* Thumbnail Placeholder */}
                <div className="relative w-full md:w-48 md:flex-shrink-0 aspect-square md:aspect-auto overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--studio-deep) 0%, var(--studio-basalt) 100%)' }}>
                    <Briefcase className="w-12 h-12" style={{ color: 'var(--studio-border)' }} aria-hidden="true" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--accent-gold)] opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                </div>

                {/* Content */}
                <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-xs font-bold shrink-0" style={{ color: 'var(--text-dim)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="px-2.5 py-1 rounded-full font-ui text-xs font-medium"
                        style={{ background: 'var(--accent-citrine-subtle)', color: 'var(--accent-citrine)' }}>
                        Client Work
                      </span>
                    </div>
                    <h3 className="font-editorial text-xl md:text-2xl font-semibold mb-2 group-hover:text-[var(--accent-gold)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {project.label}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--studio-border-subtle)' }}>
                    <span className="font-ui text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      VIEW CASE STUDY
                    </span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--accent-gold)' }} aria-hidden="true" />
                  </div>
                </div>

                {/* Arrow Indicator */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 md:right-6 md:top-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--accent-gold)', color: 'var(--text-inverse)' }}>
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <ProjectDrawer
        project={openProject!}
        isOpen={!!openProject}
        onClose={() => setOpenProject(null)}
        accentColor={accentColor}
      />
    </section>
  );
}

/* ────────────────────────── Action & Conversion Dock ────────────────────────── */

function ActionDock({ profile, onCopyEmail, onDownloadVCard }: { profile: PublicProfile; onCopyEmail: () => void; onDownloadVCard: () => void }) {
  const emailLink = profile.links?.find(l => l.url.startsWith('mailto:'));
  const email = emailLink?.url.replace('mailto:', '') || '';

  return (
    <section className="w-full pt-4" style={{ borderTop: '1px solid var(--studio-border-subtle)' }}>
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-px" style={{ background: 'var(--accent-citrine)' }} />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-gold)]">
              05 // INITIATE COLLABORATION
            </span>
          </div>
        </div>

        <div className="glass-card-elevated p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-editorial font-semibold leading-[1.05] tracking-tight mb-4 text-balance"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: 'var(--text-primary)' }}>
              Let's Create <br />
              <span className="italic" style={{ color: 'var(--accent-gold)' }}>Something Exceptional</span>
            </h2>
            <p className="font-ui text-base leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Select commissions only. I work with ambitious brands and founders who value craft, clarity, and long-term partnership.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {email && (
                <button
                  onClick={onCopyEmail}
                  className="btn-primary group w-full sm:w-auto"
                >
                  <Mail className="w-5 h-5" aria-hidden="true" />
                  COPY DIRECT EMAIL
                  <span className="font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity">⌘C</span>
                </button>
              )}
              <button
                onClick={onDownloadVCard}
                className="btn-secondary w-full sm:w-auto"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                SAVE CONTACT (.vcf)
              </button>
              <a
                href={`mailto:${email}?subject=Project%20Inquiry&body=Hello%20${encodeURIComponent(profile.name)}%2C%0A%0AI%27m%20reaching%20out%20because...`}
                className="btn-ghost w-full sm:w-auto"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                INITIATE BRIEF
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Colophon Footer ────────────────────────── */

function ColophonFooter({ profile }: { profile: PublicProfile }) {
  return (
    <footer className="w-full pt-8 pb-4" style={{ borderTop: '1px solid var(--studio-border-subtle)' }}>
      <div className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px" style={{ background: 'var(--accent-gold)' }} />
            <span className="font-ui text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              COLOPHON
            </span>
          </div>

          <p className="font-ui text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
              Studio Edition
            </span>
            <a href="#top" className="btn-ghost text-[10px]">
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              TOP
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ────────────────────────── Scroll Reveal ────────────────────────── */

function ScrollReveal({ children, delay = 0, className = '', style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────── Main Studio Template ────────────────────────── */

export function StudioTemplate({ profile, accentColor: propAccentColor }: TemplateProps) {
  const [fxActive, setFxActive] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [openProject, setOpenProject] = useState<NonNullable<PublicProfile['links']>[0] | null>(null);
  const [monolithCount, setMonolithCount] = useState(0);

  const accentColor = propAccentColor || 'var(--accent-gold)';

  // Detect reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Persist FX preference
  useEffect(() => {
    const saved = localStorage.getItem('studio-fx');
    if (saved !== null) setFxActive(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('studio-fx', fxActive.toString());
  }, [fxActive]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleCopyEmail = async () => {
    const emailLink = profile.links?.find(l => l.url.startsWith('mailto:'));
    if (!emailLink) return;
    const email = emailLink.url.replace('mailto:', '');
    const result = await copyToClipboard(email, 'email');
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const handleDownloadVCard = () => {
    downloadVCard(profile);
    showToast('Contact saved as vCard', 'success');
  };

  const socialLinks = useMemo(() => normalizeSocialLinks(profile), [profile.links, profile.socialHandles]);
  const proofPoints = useMemo(() => getProofPoints(profile), [profile.proofs]);
  const openToIntents = (profile.openTo || []) as OpenToIntentId[];

  // Prepare recent activity data from profile
  const recentActivity = useMemo((): RecentActivityData | null => {
    const raw = (profile as any)?.recentActivity;
    if (!raw) return null;
    return Array.isArray(raw) ? (raw[0] || null) : raw;
  }, [profile]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STUDIO_STYLES }} />
      <ToastStack />

      <div className="studio-template font-ui antialiased">
        {/* Interactive Atmosphere Canvas */}
        <StudioAtmosphereCanvas
          isActive={fxActive}
          prefersReducedMotion={prefersReducedMotion}
          onMonolithsReady={setMonolithCount}
        />

        {/* Top Navigation */}
        <TopNav
          profile={profile}
          socialLinks={socialLinks}
          onCopyEmail={handleCopyEmail}
          onDownloadVCard={handleDownloadVCard}
          onToggleFX={() => setFxActive(!fxActive)}
          fxActive={fxActive}
          prefersReducedMotion={prefersReducedMotion}
          timezone={profile.theme?.customCss ? undefined : undefined} // Could add timezone to profile
        />

        {/* Main Content — Zero Scroll Cockpit on Desktop */}
        <main className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 flex flex-col gap-12 md:gap-16 relative z-10">
          {/* Identity Core */}
          <IdentityCore
            profile={profile}
            socialLinks={socialLinks}
            openToIntents={openToIntents}
          />

          {/* Proof Points Grid (Single prominent section) */}
          <ProofPointsGrid profile={profile} />

          {/* Portfolio / Featured Works */}
          <PortfolioSection profile={profile} accentColor={accentColor} />

          {/* Recent Transmissions / Activity Section */}
          {recentActivity && (
            <section
              id="recent-transmissions-section"
              className="w-full pt-4 scroll-mt-24"
              style={{ borderTop: '1px solid var(--studio-border-subtle)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-px" style={{ background: 'var(--accent-citrine)' }} />
                  <span className="font-ui text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                    RECENT TRANSMISSIONS
                  </span>
                </div>
                <span className="font-mono text-xs" style={{ color: 'var(--accent-citrine)' }}>LIVE FEED</span>
              </div>
              <RecentActivitySection
                activity={recentActivity}
                variant="studio"
                isDark={true}
                accentColor={accentColor}
                autoScroll={(profile as any)?.autoScroll}
              />
            </section>
          )}

          {/* Action & Conversion Dock (Single clean contact card) */}
          <ActionDock
            profile={profile}
            onCopyEmail={handleCopyEmail}
            onDownloadVCard={handleDownloadVCard}
          />

          {/* Colophon Footer */}
          <ColophonFooter profile={profile} />
        </main>
      </div>
    </>
  );
}

export default StudioTemplate;