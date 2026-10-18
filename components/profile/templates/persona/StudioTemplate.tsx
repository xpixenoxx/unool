'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Instagram,
  Twitter,
  Dribbble,
  Youtube,
  MessageSquare,
  Globe as GlobeIcon,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Clock,
  Zap,
  Star,
  Award,
  Users,
  Briefcase,
  Heart,
  Download,
  Copy,
  Loader2,
  Quote,
} from 'lucide-react';
import { SocialIcon, normalizeSocialPlatform, BRAND_SVGS } from '@/components/profile/SocialBrandIcons';

/* ────────────────────────── Type Definitions ────────────────────────── */

interface PublicProfile {
  name?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  availability?: string;
  email?: string;
  phone?: string;
  website?: string;
  subdomain?: string;
  timezone?: string;
  proofs?: Array<{ title: string; value: string; label?: string }>;
  proofPoints?: Array<{ title: string; value: string; label?: string }>;
  proof_points?: Array<{ title: string; value: string; label?: string }>;
  links?: Array<{ label: string; url: string; icon?: string }>;
  socialHandles?: Record<string, string>;
  projects?: Array<{
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    url?: string;
    category?: string;
    year?: string;
    tags?: string[];
    metrics?: Array<{ label: string; value: string }>;
  }>;
  expertise?: string[];
  experience?: Array<{ year: string; company: string; role?: string }>;
  focus?: string;
  interests?: string[];
  recentActivity?: any;
  autoScroll?: boolean;
  metadata?: {
    statement?: string;
    statementSub?: string;
  };
  theme?: {
    accentColor?: string;
  };
  openTo?: string[];
}

interface TemplateProps {
  profile: PublicProfile;
  onLinkClick?: (url: string) => void;
}

interface ProjectDrawerProps {
  project: NonNullable<TemplateProps['profile']['projects']>[0];
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

interface SocialLink {
  label: string;
  url: string;
  icon?: string;
  platform: string;
  brandSvg?: React.ReactNode;
}

interface ProofPoint {
  title: string;
  value: string;
  label?: string;
}

/* ────────────────────────── Design Tokens (CSS-in-JS) ────────────────────────── */

const STUDIO_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    /* Premium Warm Neutral Palette — NO pure white, NO dark */
    --studio-cream: #FEFDF9;
    --studio-warm-white: #FAF8F3;
    --studio-stone-50: #F5F2EB;
    --studio-stone-100: #EDE8DF;
    --studio-stone-200: #DCD5C7;
    --studio-stone-300: #C4B8A4;
    --studio-stone-400: #A89982;
    --studio-stone-500: #8B7D68;
    --studio-stone-600: #6E6352;
    --studio-stone-700: #544C3F;
    --studio-stone-800: #3D372E;
    --studio-stone-900: #2A261F;
    --studio-stone-950: #161410;

    /* Accent: Burnt Sienna — sophisticated, warm, premium */
    --studio-accent: #C45D3E;
    --studio-accent-light: #E87D5A;
    --studio-accent-dark: #9B472F;
    --studio-accent-glow: rgba(196, 93, 62, 0.35);
    --studio-accent-subtle: rgba(196, 93, 62, 0.08);

    /* Secondary: Sage Green */
    --studio-sage: #7A8A6E;
    --studio-sage-light: #9AB08F;
    --studio-sage-subtle: rgba(122, 138, 110, 0.1);

    /* Gold highlight */
    --studio-gold: #C8A86E;
    --studio-gold-light: #E0C490;
    --studio-gold-subtle: rgba(200, 168, 110, 0.15);

    /* Soft Rose for variety */
    --studio-rose: #D48B7A;
    --studio-rose-subtle: rgba(212, 139, 122, 0.1);

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
    --text-xs: 0.7rem;
    --text-sm: 0.8125rem;
    --text-base: 0.9375rem;
    --text-lg: 1.125rem;
    --text-xl: 1.375rem;
    --text-2xl: 1.75rem;
    --text-3xl: 2.25rem;
    --text-4xl: 3rem;
    --text-5xl: 4rem;
    --text-6xl: 5.5rem;
    --text-7xl: 7rem;

    /* Radius */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-2xl: 32px;
    --radius-full: 9999px;

    /* Shadows — layered, premium */
    --shadow-xs: 0 1px 2px rgba(22, 20, 16, 0.03);
    --shadow-sm: 0 2px 8px rgba(22, 20, 16, 0.05);
    --shadow-md: 0 8px 24px rgba(22, 20, 16, 0.07);
    --shadow-lg: 0 16px 48px rgba(22, 20, 16, 0.09);
    --shadow-xl: 0 24px 64px rgba(22, 20, 16, 0.12);
    --shadow-2xl: 0 32px 80px rgba(22, 20, 16, 0.15);
    --shadow-glow: 0 0 60px var(--studio-accent-glow);
    --shadow-gold: 0 0 40px var(--studio-gold-subtle);
    --shadow-inner: inset 0 2px 4px rgba(22, 20, 16, 0.03);

    /* Glassmorphism — refined */
    --glass-bg: rgba(250, 248, 243, 0.85);
    --glass-border: rgba(196, 93, 62, 0.1);
    --glass-shadow: 0 8px 32px rgba(22, 20, 16, 0.06);
    --glass-blur: saturate(180%) blur(24px);

    /* Transitions */
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --duration-fast: 150ms;
    --duration-base: 250ms;
    --duration-slow: 400ms;
    --duration-slower: 600ms;
  }

  /* Force light mode — no dark variant */
  .studio-template {
    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--studio-cream);
    color: var(--studio-stone-900);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  /* Layered atmospheric background */
  .studio-template::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -3;
    background:
      radial-gradient(ellipse 100% 60% at 10% 0%, var(--studio-accent-subtle) 0%, transparent 55%),
      radial-gradient(ellipse 80% 50% at 90% 100%, var(--studio-sage-subtle) 0%, transparent 50%),
      radial-gradient(ellipse 60% 40% at 50% 50%, var(--studio-gold-subtle) 0%, transparent 65%),
      radial-gradient(ellipse 40% 30% at 80% 20%, var(--studio-rose-subtle) 0%, transparent 60%),
      linear-gradient(180deg, var(--studio-cream) 0%, var(--studio-stone-50) 100%);
    pointer-events: none;
  }

  /* Subtle grain texture */
  .studio-template::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -2;
    background-image:
      radial-gradient(circle at 1px 1px, var(--studio-stone-200) 0.5px, transparent 0.5px),
      radial-gradient(circle at 2px 2px, var(--studio-stone-300) 0.3px, transparent 0.3px);
    background-size: 80px 80px, 160px 160px;
    opacity: 0.08;
    pointer-events: none;
  }

  .font-editorial { font-family: 'Playfair Display', Georgia, serif; }
  .font-ui { font-family: 'Space Grotesk', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }

  /* Glass Cards — multiple elevations */
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--glass-shadow), var(--shadow-inner);
    transition: all var(--duration-base) var(--ease-out);
  }

  .glass-card:hover {
    border-color: rgba(196, 93, 62, 0.3);
    box-shadow: var(--shadow-md), 0 0 0 1px rgba(196, 93, 62, 0.15), var(--shadow-inner);
    transform: translateY(-2px);
  }

  .glass-card-elevated {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg), var(--shadow-inner);
  }

  .glass-card-subtle {
    background: rgba(250, 248, 243, 0.6);
    backdrop-filter: saturate(150%) blur(16px);
    -webkit-backdrop-filter: saturate(150%) blur(16px);
    border: 1px solid rgba(196, 93, 62, 0.06);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  /* Buttons — premium */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    background: linear-gradient(135deg, var(--studio-accent) 0%, var(--studio-accent-dark) 100%);
    color: var(--studio-cream);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--text-sm);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-radius: var(--radius-full);
    border: none;
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-out);
    box-shadow: var(--shadow-sm), 0 0 0 1px rgba(196, 93, 62, 0.2);
    position: relative;
    overflow: hidden;
  }

  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--studio-accent-light) 0%, var(--studio-accent) 100%);
    opacity: 0;
    transition: opacity var(--duration-base) var(--ease-out);
  }

  .btn-primary:hover::before { opacity: 1; }
  .btn-primary > * { position: relative; z-index: 1; }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md), var(--shadow-glow);
  }

  .btn-primary:active { transform: translateY(0); }

  .btn-primary:focus-visible {
    outline: 2px solid var(--studio-accent);
    outline-offset: 3px;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    background: transparent;
    color: var(--studio-stone-700);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 500;
    font-size: var(--text-sm);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-radius: var(--radius-full);
    border: 1px solid var(--studio-stone-300);
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-out);
  }

  .btn-secondary:hover {
    background: var(--studio-stone-100);
    border-color: var(--studio-accent);
    color: var(--studio-accent);
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: transparent;
    color: var(--studio-stone-600);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 500;
    font-size: var(--text-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
  }

  .btn-ghost:hover {
    background: var(--studio-accent-subtle);
    color: var(--studio-accent);
  }

  /* Focus visible */
  :focus-visible {
    outline: 2px solid var(--studio-accent);
    outline-offset: 2px;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--studio-stone-300); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--studio-accent); }

  /* Selection */
  ::selection { background: var(--studio-accent); color: var(--studio-cream); }

  /* Utilities */
  .text-balance { text-wrap: balance; }
  .text-pretty { text-wrap: pretty; }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
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
  if (profile.email) vcard += `EMAIL;TYPE=WORK:${profile.email}\n`;
  if (profile.phone) vcard += `TEL;TYPE=WORK,VOICE:${profile.phone}\n`;
  if (profile.location) vcard += `ADR;TYPE=WORK:;;${profile.location};;;;\n`;
  if (profile.website) vcard += `URL:${profile.website}\n`;
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

  // Explicit links
  if (profile.links?.length) {
    profile.links.forEach((link) => {
      const platform = normalizeSocialPlatform(link.label, link.url, link.icon);
      const label = link.label || platform.charAt(0).toUpperCase() + platform.slice(1);
      links.push({
        label,
        url: link.url,
        icon: link.icon,
        platform,
        brandSvg: BRAND_SVGS[platform as keyof typeof BRAND_SVGS],
      });
    });
  }

  // Social handles
  if (profile.socialHandles) {
    Object.entries(profile.socialHandles).forEach(([key, val]) => {
      if (!val) return;
      const platform = normalizeSocialPlatform(key, val);
      if (!links.some(l => l.platform === platform)) {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        links.push({
          label,
          url: val,
          icon: key,
          platform,
          brandSvg: BRAND_SVGS[platform as keyof typeof BRAND_SVGS],
        });
      }
    });
  }

  // Email
  if (profile.email && !links.some(l => l.platform === 'email')) {
    links.push({
      label: 'Email',
      url: `mailto:${profile.email}`,
      platform: 'email',
      brandSvg: BRAND_SVGS.email,
    });
  }

  // Phone
  if (profile.phone && !links.some(l => l.platform === 'phone')) {
    links.push({
      label: 'Phone',
      url: `tel:${profile.phone}`,
      platform: 'phone',
      brandSvg: BRAND_SVGS.phone,
    });
  }

  // Website
  if (profile.website && !links.some(l => l.platform === 'website')) {
    links.push({
      label: 'Website',
      url: profile.website,
      platform: 'website',
      brandSvg: BRAND_SVGS.website,
    });
  }

  return links;
};

const getProofPoints = (profile: PublicProfile): ProofPoint[] => {
  const proofs = profile.proofs || profile.proofPoints || profile.proof_points || [];
  return proofs
    .filter((p): p is ProofPoint => !!p && !!(p.value || p.title || p.label))
    .map((p) => ({
      title: p.title || p.label || 'Metric',
      value: p.value || '',
    }));
};

/* ────────────────────────── Toast System ────────────────────────── */

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
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
          className="pointer-events-auto glass-card px-5 py-3.5 flex items-center gap-3 min-w-[240px] max-w-[90vw]"
          style={{
            borderLeftWidth: '4px',
            borderLeftColor: toast.type === 'success' ? 'var(--studio-sage)' :
              toast.type === 'error' ? 'var(--studio-accent)' : 'var(--studio-gold)',
          }}
        >
          {toast.type === 'success' && <Check className="w-5 h-5 text-[var(--studio-sage)]" />}
          {toast.type === 'error' && <X className="w-5 h-5 text-[var(--studio-accent)]" />}
          {toast.type === 'info' && <Zap className="w-5 h-5 text-[var(--studio-gold)]" />}
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
    <div className="flex items-center gap-2 font-mono text-xs tabular-nums" style={{ color: 'var(--studio-stone-600)' }}>
      <Clock className="w-3.5 h-3.5" style={{ color: 'var(--studio-accent)' }} aria-hidden="true" />
      <span aria-live="off">{time}</span>
      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
        style={{ background: 'var(--studio-accent-subtle)', color: 'var(--studio-accent)' }}>
        {abbr}
      </span>
    </div>
  );
}

/* ────────────────────────── Availability Pill ────────────────────────── */

function AvailabilityPill({ availability }: { availability?: string }) {
  if (!availability) return null;

  const statuses: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; pulse: boolean }> = {
    'open for work': { label: 'Open for work', icon: Zap, color: 'var(--studio-sage)', bg: 'var(--studio-sage-subtle)', pulse: true },
    'booked': { label: 'Booked', icon: Clock, color: 'var(--studio-accent)', bg: 'var(--studio-accent-subtle)', pulse: false },
    'on retainer': { label: 'On retainer', icon: Star, color: 'var(--studio-gold)', bg: 'var(--studio-gold-subtle)', pulse: false },
    'available': { label: 'Available', icon: Zap, color: 'var(--studio-sage)', bg: 'var(--studio-sage-subtle)', pulse: true },
    'busy': { label: 'Busy', icon: Clock, color: 'var(--studio-accent)', bg: 'var(--studio-accent-subtle)', pulse: false },
  };

  const normalized = availability.toLowerCase().trim();
  const config = statuses[normalized] || {
    label: availability,
    icon: Clock,
    color: 'var(--studio-stone-500)',
    bg: 'var(--studio-stone-100)',
    pulse: false,
  };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
      style={{ background: config.bg }}
    >
      {config.pulse && (
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-2 h-2 rounded-full"
          style={{ background: config.color }}
          aria-hidden="true"
        />
      )}
      {!config.pulse && (
        <span className="w-2 h-2 rounded-full" style={{ background: config.color }} aria-hidden="true" />
      )}
      <span className="font-ui text-xs font-semibold uppercase tracking-wider" style={{ color: config.color }}>
        {config.label}
      </span>
    </motion.div>
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

  const scrollLeft = () => containerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => containerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  return (
    <div className="relative">
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 glass-card p-2 rounded-full shadow-lg"
          style={{ borderColor: 'var(--studio-accent)' }}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: 'var(--studio-accent)' }} />
        </button>
      )}

      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto scroll-snap-x pb-4 snap-mandatory -ml-4 pr-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onScroll={handleScroll}
      >
        <div style={{ width: '4px', flexShrink: 0 }} aria-hidden="true" />

        {links.map((link, index) => (
          <a
            key={`${link.platform}-${index}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 glass-card shrink-0 snap-start transition-all duration-300 group"
            style={{
              minWidth: '120px',
              borderColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--studio-accent)';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
            }}
            aria-label={link.label}
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'var(--studio-accent-subtle)', color: 'var(--studio-accent)' }}>
              {link.brandSvg ? (
                <span className="w-5 h-5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {link.brandSvg}
                </span>
              ) : (
                <SocialIcon label={link.label} url={link.url} icon={link.icon} className="w-5 h-5 fill-current" />
              )}
            </span>
            <span className="font-ui text-sm font-medium truncate" style={{ color: 'var(--studio-stone-700)' }}>
              {link.label}
            </span>
          </a>
        ))}

        <div style={{ width: '4px', flexShrink: 0 }} aria-hidden="true" />
      </div>

      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 glass-card p-2 rounded-full shadow-lg"
          style={{ borderColor: 'var(--studio-accent)' }}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--studio-accent)' }} />
        </button>
      )}
    </div>
  );
}

/* ────────────────────────── Project Drawer ────────────────────────── */

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
          style={{ background: 'rgba(22, 20, 16, 0.5)', backdropFilter: 'blur(4px)' }}
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
          <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: 'var(--studio-stone-200)' }}>
            <div className="pr-4">
              <span className="font-ui text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                Project Detail
              </span>
              <h2 id="drawer-title" className="font-editorial text-2xl md:text-3xl font-semibold mt-1 text-balance" style={{ color: 'var(--studio-stone-900)' }}>
                {project.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="glass-card p-2 rounded-full shrink-0 transition-all hover:bg-[var(--studio-accent-subtle)]"
              style={{ color: 'var(--studio-stone-500)' }}
              aria-label="Close project detail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {project.imageUrl && (
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              </div>
            )}

            {project.description && (
              <div>
                <h3 className="font-ui text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--studio-stone-500)' }}>
                  Overview
                </h3>
                <p className="font-ui leading-relaxed text-base" style={{ color: 'var(--studio-stone-700)' }}>
                  {project.description}
                </p>
              </div>
            )}

            {project.metrics?.length && (
              <div className="grid grid-cols-2 gap-4" style={{ borderTop: '1px solid var(--studio-stone-200)', paddingTop: 'var(--space-6)' }}>
                {project.metrics.map((metric, i) => (
                  <div key={i} className="text-center p-4 glass-card">
                    <div className="font-editorial text-3xl font-bold mb-1" style={{ color: accentColor }}>
                      {metric.value}
                    </div>
                    <div className="font-ui text-xs uppercase tracking-wider" style={{ color: 'var(--studio-stone-500)' }}>
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {project.tags?.length && (
              <div>
                <h3 className="font-ui text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--studio-stone-500)' }}>
                  Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: 'var(--studio-accent-subtle)',
                        color: 'var(--studio-accent)',
                        border: '1px solid var(--studio-accent)',
                        opacity: 0.9,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(project.category || project.year) && (
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--studio-stone-600)' }}>
                {project.category && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">{project.category}</span>
                  </div>
                )}
                {project.year && (
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span className="font-medium">{project.year}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4" style={{ borderTop: '1px solid var(--studio-stone-200)' }}>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1"
                >
                  <ExternalLink className="w-4 h-4" />
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

/* ────────────────────────── Decorative Elements ────────────────────────── */

function DecorativeOrb({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        ...style,
        borderRadius: '50%',
        filter: 'blur(80px)',
        opacity: 0.4,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}

function GeometricAccent({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ opacity: 0.03, ...style }}
    >
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#grid)" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

/* ────────────────────────── Floating Nav (Optional - minimal) ────────────────────────── */

function FloatingNav({ profile, socialLinks, onCopyEmail, onDownloadVCard }: {
  profile: PublicProfile;
  socialLinks: SocialLink[];
  onCopyEmail: () => void;
  onDownloadVCard: () => void;
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!profile.name && socialLinks.length === 0) return null;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 glass-card-elevated"
      style={{
        borderColor: isScrolled ? 'rgba(196, 93, 62, 0.2)' : 'transparent',
        boxShadow: isScrolled ? 'var(--shadow-lg)' : 'var(--glass-shadow)',
        maxWidth: 'calc(100vw - 2rem)',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--studio-accent) 0%, var(--studio-accent-dark) 100%)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--studio-cream)]" aria-hidden="true">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            <line x1="12" y1="22" x2="12" y2="15.5" />
            <line x1="22" y1="8.5" x2="12" y2="15.5" />
            <line x1="2" y1="8.5" x2="12" y2="15.5" />
          </svg>
        </div>
        <span className="font-editorial text-lg font-semibold hidden sm:block" style={{ color: 'var(--studio-stone-900)' }}>
          {profile.name}
        </span>
      </div>

      <div className="hidden md:flex items-center gap-1 ml-4">
        {socialLinks.slice(0, 4).map((link, i) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card-subtle p-2 rounded-xl transition-all hover:bg-[var(--studio-accent-subtle)] group"
            aria-label={link.label}
          >
            {link.brandSvg ? (
              <span className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: 'var(--studio-stone-500)' }}>
                {link.brandSvg}
              </span>
            ) : (
              <SocialIcon label={link.label} url={link.url} icon={link.icon} className="w-4 h-4 fill-current" style={{ color: 'var(--studio-stone-500)' }} />
            )}
          </a>
        ))}
        {socialLinks.length > 4 && (
          <span className="glass-card-subtle px-3 py-2 rounded-xl font-mono text-xs" style={{ color: 'var(--studio-stone-500)' }}>
            +{socialLinks.length - 4}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <AvailabilityPill availability={profile.availability} />
        <LiveClock timezone={profile.timezone} />
        {profile.email && (
          <button
            onClick={onCopyEmail}
            className="glass-card-subtle p-2 rounded-xl hover:bg-[var(--studio-accent-subtle)] transition-colors"
            style={{ color: 'var(--studio-stone-500)' }}
            aria-label="Copy email"
          >
            <Mail className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onDownloadVCard}
          className="glass-card-subtle p-2 rounded-xl hover:bg-[var(--studio-gold-subtle)] transition-colors"
          style={{ color: 'var(--studio-stone-500)' }}
          aria-label="Download vCard"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </motion.nav>
  );
}

/* ────────────────────────── Main Studio Template ────────────────────────── */

export function StudioTemplate({ profile, onLinkClick }: TemplateProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [openProject, setOpenProject] = useState<NonNullable<PublicProfile['projects']>[0] | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCopyEmail = async () => {
    if (!profile.email) return;
    const result = await copyToClipboard(profile.email, 'email');
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const handleDownloadVCard = () => {
    downloadVCard(profile);
    showToast('Contact saved as vCard', 'success');
  };

  const socialLinks = useMemo(() => normalizeSocialLinks(profile), [profile.links, profile.socialHandles, profile.email, profile.phone, profile.website]);
  const proofPoints = useMemo(() => getProofPoints(profile), [profile.proofs, profile.proofPoints, profile.proof_points]);
  const hasProjects = profile.projects && profile.projects.length > 0;

  const accentColor = profile.theme?.accentColor || 'var(--studio-accent)';

  const nameParts = profile.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STUDIO_STYLES }} />
      <ToastStack />

      <div className="studio-template font-ui antialiased">
        {/* Atmospheric Background Orbs */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
          <DecorativeOrb
            className="absolute -top-40 -right-40 w-[500px] h-[500px]"
            style={{ background: 'radial-gradient(circle, var(--studio-accent) 0%, transparent 70%)' }}
          />
          <DecorativeOrb
            className="absolute -bottom-40 -left-40 w-[400px] h-[400px]"
            style={{ background: 'radial-gradient(circle, var(--studio-sage) 0%, transparent 70%)' }}
          />
          <DecorativeOrb
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
            style={{ background: 'radial-gradient(circle, var(--studio-gold) 0%, transparent 80%)', opacity: 0.15 }}
          />
          <DecorativeOrb
            className="absolute top-20 right-20 w-[200px] h-[200px]"
            style={{ background: 'radial-gradient(circle, var(--studio-rose) 0%, transparent 70%)', opacity: 0.2 }}
          />
        </div>

        {/* Floating Nav — minimal, elegant */}
        <FloatingNav
          profile={profile}
          socialLinks={socialLinks}
          onCopyEmail={handleCopyEmail}
          onDownloadVCard={handleDownloadVCard}
        />

        {/* Main Content */}
        <main className="pt-28 pb-20 px-6 md:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">

            {/* HERO SECTION */}
            <section id="profile" className="relative mb-[var(--space-10)]">
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Left Column - Photo & Social Rail */}
                <div className="lg:col-span-5 relative" style={{ zIndex: 10 }}>
                  <ScrollReveal delay={0.1}>
                    {profile.avatarUrl && (
                      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden"
                        style={{
                          boxShadow: 'var(--shadow-xl), var(--shadow-gold)',
                          border: '1px solid var(--studio-stone-200)',
                        }}>
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name || 'Profile photograph'}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4" style={{ borderColor: 'var(--studio-accent)' }} />
                        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4" style={{ borderColor: 'var(--studio-gold)' }} />
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4" style={{ borderColor: 'var(--studio-sage)', opacity: 0.5 }} />
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4" style={{ borderColor: 'var(--studio-rose)', opacity: 0.5 }} />
                        {/* Location badge */}
                        {profile.location && (
                          <div className="absolute bottom-4 left-4 right-4 glass-card px-4 py-2 text-center">
                            <MapPin className="w-4 h-4 inline mr-1.5" style={{ color: 'var(--studio-accent)' }} />
                            <span className="font-ui text-sm font-medium" style={{ color: 'var(--studio-stone-700)' }}>{profile.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Availability & Clock Stack */}
                    <div className="mt-6 flex flex-col gap-3">
                      <AvailabilityPill availability={profile.availability} />
                      <LiveClock timezone={profile.timezone} />
                    </div>

                    {/* Social Rail - Sticky on scroll */}
                    {socialLinks.length > 0 && (
                      <ScrollReveal delay={0.3} className="mt-8 sticky top-28">
                        <div className="glass-card p-5">
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-ui text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--studio-stone-500)' }}>
                              Connect
                            </span>
                            <span className="font-mono text-xs" style={{ color: 'var(--studio-stone-400)' }}>
                              {socialLinks.length}
                            </span>
                          </div>
                          <SocialRail links={socialLinks} />
                        </div>
                      </ScrollReveal>
                    )}
                  </ScrollReveal>
                </div>

                {/* Right Column - Identity & Info */}
                <div className="lg:col-span-7 lg:pl-8 relative">
                  <ScrollReveal delay={0.2} className="pt-4 md:pt-12">
                    {/* Eyebrow */}
                    {profile.headline && (
                      <div className="inline-flex items-center gap-2 mb-5 glass-card px-4 py-2 inline-block"
                        style={{ borderColor: 'var(--studio-accent)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--studio-accent)' }} aria-hidden="true" />
                        <span className="font-ui text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--studio-stone-600)' }}>
                          {profile.headline}
                        </span>
                      </div>
                    )}

                    {/* Name — editorial, expressive */}
                    {profile.name && (
                      <h1 className="font-editorial font-semibold leading-[1.05] tracking-tight mb-6 text-balance"
                        style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', color: 'var(--studio-stone-950)' }}>
                        <span className="font-normal">{firstName}</span>{' '}
                        <span className="italic" style={{ color: 'var(--studio-accent)' }}>{lastName}</span>
                      </h1>
                    )}

                    {/* Subdomain / Handle */}
                    {profile.subdomain && (
                      <p className="font-mono text-sm mb-8" style={{ color: 'var(--studio-stone-500)' }}>
                        @{profile.subdomain} <span style={{ color: 'var(--studio-stone-300)' }}>·</span> <span className="font-ui font-medium" style={{ color: 'var(--studio-accent)' }}>unool.com</span>
                      </p>
                    )}

                    {/* Bio */}
                    {profile.bio && (
                      <ScrollReveal delay={0.3}>
                        <p className="font-ui text-lg leading-relaxed max-w-2xl mb-8 text-pretty" style={{ color: 'var(--studio-stone-600)' }}>
                          "{profile.bio}"
                        </p>
                      </ScrollReveal>
                    )}

                    {/* CTA Row — prominent, premium */}
                    <ScrollReveal delay={0.4}>
                      <div className="flex flex-wrap items-center gap-4">
                        {profile.email && (
                          <button
                            onClick={handleCopyEmail}
                            className="btn-primary group"
                            aria-label="Copy email address"
                          >
                            <Mail className="w-4 h-4" />
                            Copy Email
                            <span className="font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity">⌘C</span>
                          </button>
                        )}
                        <button
                          onClick={handleDownloadVCard}
                          className="btn-secondary"
                          aria-label="Download vCard"
                        >
                          <Download className="w-4 h-4" />
                          Save Contact
                        </button>
                        {profile.website && (
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost"
                            aria-label="Visit website"
                          >
                            <GlobeIcon className="w-4 h-4" />
                            Website
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </ScrollReveal>

                    {/* Quick Stats — proof points, skills, networks */}
                    {(proofPoints.length > 0 || profile.expertise?.length) && (
                      <ScrollReveal delay={0.5} className="mt-10 pt-8" style={{ borderTop: '1px solid var(--studio-stone-200)' }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {proofPoints.slice(0, 3).map((proof, i) => (
                            <div key={i} className="text-center p-4 glass-card group relative overflow-hidden">
                              <div className="font-editorial text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--studio-accent)' }}>
                                {proof.value}
                              </div>
                              <div className="font-ui text-xs uppercase tracking-wider" style={{ color: 'var(--studio-stone-500)' }}>
                                {proof.title}
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--studio-accent)' }} />
                            </div>
                          ))}
                          {profile.expertise?.length && proofPoints.length < 3 && (
                            <div className="text-center p-4 glass-card group relative overflow-hidden">
                              <div className="font-editorial text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--studio-sage)' }}>
                                {profile.expertise.length}+
                              </div>
                              <div className="font-ui text-xs uppercase tracking-wider" style={{ color: 'var(--studio-stone-500)' }}>
                                Skills
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--studio-sage)' }} />
                            </div>
                          )}
                          {socialLinks.length && proofPoints.length < 2 && profile.expertise?.length === undefined && (
                            <div className="text-center p-4 glass-card group relative overflow-hidden">
                              <div className="font-editorial text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--studio-gold)' }}>
                                {socialLinks.length}
                              </div>
                              <div className="font-ui text-xs uppercase tracking-wider" style={{ color: 'var(--studio-stone-500)' }}>
                                Networks
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--studio-gold)' }} />
                            </div>
                          )}
                        </div>
                      </ScrollReveal>
                    )}
                  </ScrollReveal>
                </div>
              </div>

              {/* Decorative Divider */}
              <div className="mt-10 relative" aria-hidden="true">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px" style={{
                    background: 'linear-gradient(90deg, transparent, var(--studio-stone-200), transparent)'
                  }} />
                </div>
                <div className="relative flex justify-center">
                  <div className="w-3 h-3 rounded-full" style={{
                    background: 'var(--studio-accent)',
                    boxShadow: '0 0 20px var(--studio-accent-glow)'
                  }} />
                </div>
              </div>
            </section>

            {/* ABOUT SECTION */}
            {(profile.headline || profile.bio || profile.focus || profile.interests || profile.expertise?.length || profile.experience?.length) && (
              <section id="about" className="mb-[var(--space-10)]">
                <ScrollReveal delay={0.1}>
                  <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left: Editorial Content */}
                    <div className="lg:col-span-7">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-px" style={{ background: 'var(--studio-accent)' }} />
                        <span className="font-ui text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--studio-stone-500)' }}>
                          About
                        </span>
                      </div>

                      <h2 className="font-editorial font-semibold leading-[1.1] tracking-tight mb-6 text-balance"
                        style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: 'var(--studio-stone-900)' }}>
                        Designing with <br />
                        <span className="italic" style={{ color: 'var(--studio-accent)' }}>a little more</span> attention.
                      </h2>

                      {profile.bio && (
                        <p className="font-ui text-lg leading-relaxed max-w-2xl mb-10 text-pretty" style={{ color: 'var(--studio-stone-600)' }}>
                          {profile.bio}
                        </p>
                      )}

                      {/* Details Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {profile.location && (
                          <div className="glass-card p-5 group relative overflow-hidden">
                            <MapPin className="w-5 h-5 mb-2" style={{ color: 'var(--studio-accent)' }} />
                            <span className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--studio-stone-500)' }}>Based in</span>
                            <p className="font-editorial text-lg font-medium" style={{ color: 'var(--studio-stone-900)' }}>{profile.location}</p>
                            <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--studio-accent)' }} />
                          </div>
                        )}
                        {profile.focus && (
                          <div className="glass-card p-5 group relative overflow-hidden">
                            <Star className="w-5 h-5 mb-2" style={{ color: 'var(--studio-gold)' }} />
                            <span className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--studio-stone-500)' }}>Focus</span>
                            <p className="font-editorial text-lg font-medium" style={{ color: 'var(--studio-stone-900)' }}>{profile.focus}</p>
                            <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--studio-gold)' }} />
                          </div>
                        )}
                        {profile.interests && (
                          <div className="glass-card p-5 md:col-span-2 group relative overflow-hidden">
                            <Heart className="w-5 h-5 mb-2" style={{ color: 'var(--studio-accent)' }} />
                            <span className="font-ui text-xs uppercase tracking-widest block mb-2" style={{ color: 'var(--studio-stone-500)' }}>Interests</span>
                            <p className="font-ui text-base leading-relaxed" style={{ color: 'var(--studio-stone-600)' }}>{profile.interests}</p>
                            <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--studio-rose)' }} />
                          </div>
                        )}
                      </div>

                      {/* Expertise */}
                      {profile.expertise?.length && (
                        <div className="mt-10">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-px" style={{ background: 'var(--studio-sage)' }} />
                              <span className="font-ui text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--studio-stone-500)' }}>Expertise</span>
                            </div>
                            <span className="font-mono text-xs" style={{ color: 'var(--studio-stone-400)' }}>{profile.expertise.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profile.expertise.map((skill, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.05 * i, duration: 0.3 }}
                                className="px-4 py-2 glass-card font-ui text-sm font-medium transition-all"
                                style={{ color: 'var(--studio-stone-700)' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'var(--studio-accent)';
                                  e.currentTarget.style.color = 'var(--studio-cream)';
                                  e.currentTarget.style.borderColor = 'var(--studio-accent)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'var(--glass-bg)';
                                  e.currentTarget.style.color = 'var(--studio-stone-700)';
                                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                                }}
                              >
                                {skill}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {profile.experience?.length && (
                        <div className="mt-10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-px" style={{ background: 'var(--studio-gold)' }} />
                              <span className="font-ui text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--studio-stone-500)' }}>Experience</span>
                            </div>
                            <span className="font-mono text-xs" style={{ color: 'var(--studio-stone-400)' }}>{profile.experience.length}</span>
                          </div>
                          {profile.experience.map((exp, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * i, duration: 0.4 }}
                              className="glass-card p-5 flex items-center justify-between gap-4 group relative overflow-hidden"
                            >
                              <div>
                                <p className="font-editorial text-base font-medium" style={{ color: 'var(--studio-stone-900)' }}>
                                  {exp.company || exp.role}
                                </p>
                                {exp.role && exp.company && (
                                  <p className="font-ui text-sm mt-0.5" style={{ color: 'var(--studio-stone-500)' }}>{exp.role}</p>
                                )}
                              </div>
                              <span className="font-mono text-sm font-medium shrink-0" style={{ color: 'var(--studio-accent)' }}>
                                {exp.year}
                              </span>
                              <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--studio-gold)' }} />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Visual Accent / Quote Card */}
                    <div className="lg:col-span-5 relative">
                      <div className="sticky top-28 h-full min-h-[400px]">
                        <div className="relative h-full glass-card-elevated p-8 md:p-10 flex flex-col justify-between group">
                          <div>
                            <GeometricAccent className="absolute -top-20 -right-20 w-64 h-64" style={{ color: 'var(--studio-accent)' }} />
                            <div className="relative z-10">
                              <Quote className="w-10 h-10 mb-4" style={{ color: 'var(--studio-accent)', opacity: 0.3 }} />
                              <blockquote className="font-editorial italic text-xl md:text-2xl leading-relaxed" style={{ color: 'var(--studio-stone-700)' }}>
                                "Great design isn't what it looks like. It's how it works, how it feels, and how it transforms the everyday into something memorable."
                              </blockquote>
                            </div>
                          </div>
                          <div className="relative z-10 pt-8" style={{ borderTop: '1px solid var(--studio-stone-200)' }}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'linear-gradient(135deg, var(--studio-accent) 0%, var(--studio-accent-dark) 100%)' }}>
                                <Users className="w-6 h-6 text-[var(--studio-cream)]" />
                              </div>
                              <div>
                                <p className="font-editorial text-lg font-semibold" style={{ color: 'var(--studio-stone-900)' }}>Collaborative by nature</p>
                                <p className="font-ui text-sm" style={{ color: 'var(--studio-stone-500)' }}>We believe the best work happens together</p>
                              </div>
                            </div>
                          </div>
                          {/* Subtle accent line on hover */}
                          <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(90deg, var(--studio-accent), var(--studio-gold))' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </section>
            )}

            {/* PROOF POINTS */}
            {proofPoints.length > 0 && (
              <section id="proof" className="mb-[var(--space-10)]">
                <ScrollReveal delay={0.1}>
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-px" style={{ background: 'var(--studio-sage)' }} />
                      <span className="font-ui text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--studio-stone-500)' }}>Proof Points</span>
                    </div>
                    <span className="font-mono text-xs" style={{ color: 'var(--studio-stone-400)' }}>{proofPoints.length}</span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {proofPoints.map((proof, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * i, duration: 0.5 }}
                        className="glass-card-elevated p-6 md:p-8 group relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <span className="font-mono text-xs font-bold shrink-0" style={{ color: 'var(--studio-stone-400)' }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'var(--studio-accent-subtle)', color: 'var(--studio-accent)' }}>
                            <Award className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="font-editorial text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--studio-stone-950)' }}>
                          {proof.value}
                        </div>
                        <div className="font-ui text-sm uppercase tracking-wider" style={{ color: 'var(--studio-stone-500)' }}>
                          {proof.title}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'var(--studio-accent)' }} />
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at top right, var(--studio-accent-subtle), transparent)' }} />
                      </motion.div>
                    ))}
                  </div>
                </ScrollReveal>
              </section>
            )}

            {/* SELECTED WORK */}
            {hasProjects && (
              <section id="work" className="mb-[var(--space-10)]">
                <ScrollReveal delay={0.1}>
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-px" style={{ background: 'var(--studio-gold)' }} />
                      <span className="font-ui text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--studio-stone-500)' }}>Selected Work</span>
                    </div>
                    <span className="font-mono text-xs" style={{ color: 'var(--studio-stone-400)' }}>{profile.projects!.length}</span>
                  </div>

                  <h2 className="font-editorial font-semibold leading-[1.1] tracking-tight mb-10 text-balance"
                    style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: 'var(--studio-stone-900)' }}>
                    A few things <br />
                    <span className="italic" style={{ color: 'var(--studio-gold)' }}>made with care.</span>
                  </h2>

                  <div className="space-y-4">
                    {profile.projects!.map((project, i) => (
                      <motion.article
                        key={project.id || i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * i, duration: 0.5 }}
                        className="group relative glass-card overflow-hidden"
                        onClick={() => setOpenProject(project)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Thumbnail */}
                          <div className="relative w-full md:w-48 md:flex-shrink-0 aspect-square md:aspect-auto overflow-hidden">
                            {project.imageUrl ? (
                              <img
                                src={project.imageUrl}
                                alt={project.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--studio-stone-100)' }}>
                                <div className="w-12 h-12 rounded-full" style={{ border: '2px solid var(--studio-stone-300)' }} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--studio-accent)] opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-3">
                                <span className="font-mono text-xs font-bold shrink-0" style={{ color: 'var(--studio-stone-400)' }}>
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                {project.category && (
                                  <span className="px-2.5 py-1 rounded-full font-ui text-xs font-medium"
                                    style={{ background: 'var(--studio-sage-subtle)', color: 'var(--studio-sage)' }}>
                                    {project.category}
                                  </span>
                                )}
                                {project.year && (
                                  <span className="font-mono text-xs" style={{ color: 'var(--studio-stone-400)' }}>
                                    {project.year}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-editorial text-xl md:text-2xl font-semibold mb-2 group-hover:text-[var(--studio-accent)] transition-colors" style={{ color: 'var(--studio-stone-950)' }}>
                                {project.title}
                              </h3>
                              {project.description && (
                                <p className="font-ui text-base leading-relaxed line-clamp-2" style={{ color: 'var(--studio-stone-600)' }}>
                                  {project.description}
                                </p>
                              )}
                            </div>

                            {/* Tags */}
                            {project.tags?.length && (
                              <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--studio-stone-200)' }}>
                                {project.tags.slice(0, 4).map((tag, ti) => (
                                  <span
                                    key={ti}
                                    className="px-3 py-1 rounded-full font-ui text-xs font-medium"
                                    style={{ background: 'var(--studio-stone-100)', color: 'var(--studio-stone-600)' }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {project.tags.length > 4 && (
                                  <span className="px-3 py-1 rounded-full font-ui text-xs font-medium"
                                    style={{ background: 'var(--studio-accent-subtle)', color: 'var(--studio-accent)' }}>
                                    +{project.tags.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Metrics */}
                            {project.metrics?.length && (
                              <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid var(--studio-stone-200)' }}>
                                {project.metrics.map((metric, mi) => (
                                  <div key={mi} className="text-center">
                                    <div className="font-editorial text-xl font-bold" style={{ color: accentColor }}>
                                      {metric.value}
                                    </div>
                                    <div className="font-ui text-[10px] uppercase tracking-wider" style={{ color: 'var(--studio-stone-500)' }}>
                                      {metric.label}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Arrow Indicator */}
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 md:right-6 md:top-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ background: 'var(--studio-accent)', color: 'var(--studio-cream)' }}>
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </ScrollReveal>
              </section>
            )}

            {/* CONTACT FOOTER — LIGHT, not dark */}
            <footer id="contact" className="relative">
              <ScrollReveal delay={0.1}>
                <div className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, var(--studio-stone-100) 0%, var(--studio-stone-50) 50%, var(--studio-cream) 100%)',
                    border: '1px solid var(--studio-stone-200)',
                  }}>
                  {/* Decorative background — light */}
                  <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                    <GeometricAccent className="absolute top-0 left-0 w-full h-full" style={{ color: 'var(--studio-accent)' }} />
                    <DecorativeOrb
                      className="absolute -top-20 -right-20 w-[300px] h-[300px]"
                      style={{ background: 'radial-gradient(circle, var(--studio-accent) 0%, transparent 70%)', opacity: 0.1 }}
                    />
                    <DecorativeOrb
                      className="absolute bottom-20 left-20 w-[200px] h-[200px]"
                      style={{ background: 'radial-gradient(circle, var(--studio-gold) 0%, transparent 70%)', opacity: 0.08 }}
                    />
                    <DecorativeOrb
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]"
                      style={{ background: 'radial-gradient(circle, var(--studio-rose) 0%, transparent 80%)', opacity: 0.06 }}
                    />
                  </div>

                  <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 lg:px-12 lg:py-24">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-px" style={{ background: 'var(--studio-gold)' }} />
                        <span className="font-ui text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--studio-stone-500)' }}>Get In Touch</span>
                      </div>
                      <span className="font-mono text-xs" style={{ color: 'var(--studio-stone-400)' }}>04</span>
                    </div>

                    <h2 className="font-editorial font-semibold leading-[1.05] tracking-tight mb-8 text-center md:text-left text-balance"
                      style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', color: 'var(--studio-stone-900)' }}>
                      Let's make something<br />
                      <span className="italic" style={{ color: 'var(--studio-gold)' }}>useful.</span>
                    </h2>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-md mx-auto md:mx-0">
                      {profile.email && (
                        <a
                          href={`mailto:${profile.email}`}
                          className="btn-primary flex-1 text-lg px-8 py-4 group"
                        >
                          <Mail className="w-5 h-5" />
                          WRITE TO {profile.name?.toUpperCase() || 'ME'}
                          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </a>
                      )}
                      <button
                        onClick={handleDownloadVCard}
                        className="btn-secondary flex-1 text-lg px-8 py-4"
                        style={{ borderColor: 'var(--studio-stone-300)', color: 'var(--studio-stone-700)' }}
                      >
                        <Download className="w-5 h-5" />
                        SAVE CONTACT
                      </button>
                    </div>

                    <div className="mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
                      style={{ borderTop: '1px solid var(--studio-stone-200)' }}>
                      <p className="font-ui text-xs uppercase tracking-widest" style={{ color: 'var(--studio-stone-500)' }}>
                        © {new Date().getFullYear()}{profile.name ? ` / ${profile.name}` : ''}
                      </p>
                      <a href="#profile" className="btn-ghost" style={{ color: 'var(--studio-stone-500)' }}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Back to top
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </footer>

          </div>
        </main>

        {/* Project Drawer */}
        <ProjectDrawer
          project={openProject!}
          isOpen={!!openProject}
          onClose={() => setOpenProject(null)}
          accentColor={accentColor}
        />
      </div>
    </>
  );
}

export default StudioTemplate;