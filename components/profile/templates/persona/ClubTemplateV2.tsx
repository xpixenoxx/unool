'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Download, Copy, Share2, Check,
  ChevronRight, ChevronLeft, ExternalLink,
  UserCircle, Globe, Briefcase, Zap, Star,
  MessageSquare, Calendar, Link2, ArrowUpRight,
  Music, Film, Image, Code, BookOpen
} from 'lucide-react';
import { CLUB_BRAND_ICONS, normalizeSocialPlatformKey, type ClubBrandIconKey } from './ClubBrandIcons';
import { adaptPublicProfileToClub, type ClubTemplateData } from './adaptClub';
import { generateVCard } from './utils/vcard';
import type { TemplateProps } from './types';
import './ClubDesignTokens.css';
import './ClubTemplateV2.css';

/* ============================================================
   CLUB TEMPLATE V2 — Compact, Linktree-density, Angular/Sharp
   Each section has distinct visual language — no two alike
   ============================================================ */

// Lazy load heavy 3D canvas
const ClubHero3D = dynamic(
  () => import('./sections/ClubHero3D').then(m => m.ClubHero3D),
  { ssr: false, loading: () => <HeroCanvasFallback /> }
);

function HeroCanvasFallback() {
  return (
    <div className="club-hero-canvas-fallback" aria-hidden="true">
      <div className="club-hero-gradient-mesh" />
    </div>
  );
}

// Toast system (inline, minimal)
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

function ClubToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { ...toast, id }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`club-toast club-toast--${t.type}`}
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            role="alert"
            aria-live="polite"
          >
            <div className="club-toast-icon">
              {t.type === 'success' && <Check size={16} strokeWidth={2.5} />}
              {t.type === 'error' && <XCircle size={16} strokeWidth={2.5} />}
              {t.type === 'info' && <Info size={16} strokeWidth={2.5} />}
            </div>
            <div className="club-toast-content">
              <div className="club-toast-title">{t.title}</div>
              {t.description && <div className="club-toast-desc">{t.description}</div>}
            </div>
            <motion.div
              className="club-toast-progress"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3.5, ease: 'linear' }}
              style={{ transformOrigin: 'left' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

const ToastContext = React.createContext<{ addToast: (t: Omit<Toast, 'id'>) => void } | null>(null);
function useClubToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useClubToast must be used within ClubToastProvider');
  return ctx;
}

// Simple icon components for toast
function XCircle({ size = 16, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function Info({ size = 16, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/* ============================================================
   SECTION 01: HERO — Full-bleed 3D canvas + bold logotype
   Sharp angular container, not rounded
   ============================================================ */

interface HeroProps {
  name: string;
  tagline: string;
  handle: string;
}

function ClubHeroV2({ name, tagline, handle }: HeroProps) {
  const [is3DLoaded, set3DLoaded] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <section id="hero" className="club-hero" aria-labelledby="hero-title">
      {/* 3D Canvas Layer — full bleed */}
      <div className="club-hero-canvas" aria-hidden="true">
        <ClubHero3D
          intensity={0.8}
          geometry="icosphere"
          subdivisions={3}
          onLoad={() => set3DLoaded(true)}
        />
      </div>

      {/* Fallback gradient mesh */}
      <AnimatePresence mode="popLayout">
        {!is3DLoaded && <HeroCanvasFallback key="fallback" />}
      </AnimatePresence>

      {/* Subtle vignette */}
      <div className="club-hero-vignette" aria-hidden="true" />

      {/* Content — centered, bold, compact */}
      <div className="club-hero-content">
        <div className="club-hero-badge" style={{ '--accent': 'var(--club-electric-cyan)' }}>
          <span className="club-section-num">01</span>
          <span className="club-section-label">MASTHEAD</span>
        </div>

        <h1 id="hero-title" className="club-hero-name">
          {name || 'THE CLUB'}
        </h1>

        <p className="club-hero-tagline">
          {tagline || '"We shape culture."'}
        </p>

        <div className="club-hero-handle">@{handle}</div>
      </div>

      {/* Scroll hint — subtle, not a bounce arrow */}
      <div className="club-scroll-hint" aria-hidden="true">
        <svg width="20" height="32" viewBox="0 0 20 32" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="9" y="2" width="2" height="20" rx="1" fill="currentColor" opacity="0.3" />
          <circle cx="10" cy="28" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
            <animate attributeName="cy" values="18;26;18" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.5;0" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 02: MANIFESTO — Editorial serif, blade shape (asymmetric)
   Left sharp, right rounded — distinct from all others
   ============================================================ */

interface ManifestoProps {
  bio: string;
  manifesto: string;
}

function ClubManifestoV2({ bio, manifesto }: ManifestoProps) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      className="club-manifesto"
      aria-labelledby="manifesto-title"
      style={{ opacity: isVisible || prefersReduced ? 1 : 0, transform: isVisible || prefersReduced ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s var(--club-ease-smooth), transform 0.6s var(--club-ease-smooth)' }}
    >
      <header className="club-section-header">
        <span className="club-section-num">02</span>
        <h2 id="manifesto-title" className="club-section-title">MANIFESTO</h2>
      </header>

      <div className="club-manifesto-content">
        <p className="club-manifesto-text club-manifesto-primary">
          {bio}
        </p>

        <blockquote className="club-manifesto-quote">
          "The future belongs to those who create it."
        </blockquote>

        <p className="club-manifesto-text club-manifesto-secondary">
          {manifesto}
        </p>
      </div>

      {/* Blade accent — asymmetric line */}
      <div className="club-manifesto-blade" aria-hidden="true">
        <div className="club-blade-line" />
        <div className="club-blade-dot" />
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 03: PROOF LEDGER — KPI cards, sharp rectangular grid
   No rounded corners, hairline borders, electric accents
   ============================================================ */

interface ProofPoint {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  icon?: string;
  subtext?: string;
}

interface ProofLedgerProps {
  proofPoints: ProofPoint[];
}

function ClubProofLedgerV2({ proofPoints }: ProofLedgerProps) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const ICON_MAP = {
    TrendingUp: <TrendingUpIcon size={24} strokeWidth={1.5} />,
    Users: <UsersIcon size={24} strokeWidth={1.5} />,
    Award: <AwardIcon size={24} strokeWidth={1.5} />,
    UserCircle: <UserCircleIcon size={24} strokeWidth={1.5} />,
  };

  return (
    <section
      ref={sectionRef}
      id="proof"
      className="club-proof"
      aria-labelledby="proof-title"
      style={{ opacity: isVisible || prefersReduced ? 1 : 0, transform: isVisible || prefersReduced ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s var(--club-ease-smooth), transform 0.6s var(--club-ease-smooth)' }}
    >
      <header className="club-section-header">
        <span className="club-section-num">03</span>
        <h2 id="proof-title" className="club-section-title">PROOF LEDGER</h2>
      </header>

      <div className="club-proof-grid" role="list">
        {proofPoints.map((proof, i) => {
          const Icon = ICON_MAP[proof.icon as keyof typeof ICON_MAP] || ICON_MAP.TrendingUp;
          return (
            <article
              key={proof.id}
              className="club-proof-card"
              role="listitem"
              style={{
                opacity: isVisible || prefersReduced ? 1 : 0,
                transform: isVisible || prefersReduced ? 'none' : 'translateY(16px)',
                transition: `opacity 0.5s var(--club-ease-smooth) ${i * 60}ms, transform 0.5s var(--club-ease-smooth) ${i * 60}ms`,
              }}
            >
              <div className="club-proof-icon" style={{ '--accent': 'var(--club-electric-cyan)' }}>
                {Icon}
              </div>

              <div className="club-proof-value">
                <AnimatedCounter end={proof.value} duration={1800} className="club-kpi-number" suffix={proof.suffix} />
              </div>

              <div className="club-proof-label">
                <span className="club-proof-title">{proof.label}</span>
                {proof.subtext && <span className="club-proof-subtext">{proof.subtext}</span>}
              </div>

              {/* Sharp corner accent */}
              <div className="club-proof-corner" style={{ '--accent': 'var(--club-electric-cyan)' }} aria-hidden="true" />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AnimatedCounter({ end, duration = 1800, className, suffix = '' }: {
  end: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) { setCount(end); return; }
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, prefersReduced]);

  return (
    <span className={className}>
      {count.toLocaleString()}
      {suffix && <span className="club-kpi-suffix">{suffix}</span>}
    </span>
  );
}

/* ============================================================
   ICON COMPONENTS (inline, no imports)
   ============================================================ */

function TrendingUpIcon({ size = 24, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function UsersIcon({ size = 24, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AwardIcon({ size = 24, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

function UserCircleIcon({ size = 24, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/* ============================================================
   SECTION 04: CURATED WORKS — Project cards, beveled corners
   Alternating layout, not a uniform grid
   ============================================================ */

interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  link?: string;
  tags?: string[];
  type?: 'work' | 'art' | 'code' | 'writing' | 'music' | 'video';
}

interface CuratedWorksProps {
  projects: Project[];
}

function ClubCuratedWorksV2({ projects }: CuratedWorksProps) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const TYPE_ICONS = {
    work: <BriefcaseIcon size={14} strokeWidth={1.5} />,
    art: <ImageIcon size={14} strokeWidth={1.5} />,
    code: <CodeIcon size={14} strokeWidth={1.5} />,
    writing: <BookOpenIcon size={14} strokeWidth={1.5} />,
    music: <MusicIcon size={14} strokeWidth={1.5} />,
    video: <FilmIcon size={14} strokeWidth={1.5} />,
  };

  const TYPE_ACCENTS = {
    work: 'var(--club-electric-cyan)',
    art: 'var(--club-electric-magenta)',
    code: 'var(--club-electric-gold)',
    writing: 'var(--club-electric-lime)',
    music: 'var(--club-electric-magenta)',
    video: 'var(--club-electric-cyan)',
  };

  if (!projects.length) return null;

  return (
    <section
      ref={sectionRef}
      id="works"
      className="club-works"
      aria-labelledby="works-title"
      style={{ opacity: isVisible || prefersReduced ? 1 : 0, transform: isVisible || prefersReduced ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s var(--club-ease-smooth), transform 0.6s var(--club-ease-smooth)' }}
    >
      <header className="club-section-header">
        <span className="club-section-num">04</span>
        <h2 id="works-title" className="club-section-title">CURATED WORKS</h2>
      </header>

      <div className="club-works-grid" role="list">
        {projects.slice(0, 6).map((project, i) => {
          const accent = TYPE_ACCENTS[project.type || 'work'];
          const Icon = TYPE_ICONS[project.type || 'work'];
          const isEven = i % 2 === 0;

          return (
            <article
              key={project.id}
              className="club-work-card"
              role="listitem"
              style={{
                '--accent': accent,
                opacity: isVisible || prefersReduced ? 1 : 0,
                transform: isVisible || prefersReduced ? 'none' : 'translateY(16px)',
                transition: `opacity 0.5s var(--club-ease-smooth) ${i * 80}ms, transform 0.5s var(--club-ease-smooth) ${i * 80}ms`,
              }}
            >
              <div className="club-work-media" style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}05)` }}>
                {project.image ? (
                  <img src={project.image} alt="" loading="lazy" className="club-work-image" />
                ) : (
                  <div className="club-work-placeholder" aria-hidden="true">
                    <Icon />
                  </div>
                )}
                <div className="club-work-type-badge">{project.type?.toUpperCase() || 'WORK'}</div>
              </div>

              <div className="club-work-content">
                <h3 className="club-work-title">{project.title}</h3>
                <p className="club-work-desc">{project.description}</p>

                {project.tags && project.tags.length > 0 && (
                  <div className="club-work-tags">
                    {project.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="club-tag">{tag}</span>
                    ))}
                  </div>
                )}

                {project.link && (
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className="club-work-link">
                    <span>View Project</span>
                    <ArrowUpRightIcon size={14} strokeWidth={2} />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BriefcaseIcon({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}

function CodeIcon({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
}

function BookOpenIcon({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}

function MusicIcon({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
}

function FilmIcon({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>;
}

function ImageIcon({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
}

function ArrowUpRightIcon({ size = 14, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>;
}

/* ============================================================
   SECTION 05: SOCIALS MATRIX — Horizontal rail, pill cards
   Distinct from other sections — horizontal scroll, pill shape
   ============================================================ */

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  icon: React.ReactNode;
  iconKey: ClubBrandIconKey;
}

interface SocialsMatrixProps {
  socialLinks: SocialLink[];
}

function ClubSocialsMatrixV2({ socialLinks }: SocialsMatrixProps) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const scroll = (dir: -1 | 1) => {
    if (railRef.current) {
      railRef.current.scrollBy({ left: dir * 200, behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  };

  if (!socialLinks.length) return null;

  return (
    <section
      ref={sectionRef}
      id="socials"
      className="club-socials"
      aria-labelledby="socials-title"
      style={{ opacity: isVisible || prefersReduced ? 1 : 0, transform: isVisible || prefersReduced ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s var(--club-ease-smooth), transform 0.6s var(--club-ease-smooth)' }}
    >
      <header className="club-section-header">
        <div>
          <span className="club-section-num">05</span>
          <h2 id="socials-title" className="club-section-title">BRAND SOCIALS</h2>
        </div>
        <div className="club-socials-controls" aria-hidden="true">
          <button className="club-socials-btn" onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
          <button className="club-socials-btn" onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="club-socials-rail-wrapper">
        <div ref={railRef} className="club-socials-rail" role="list" aria-label="Social platforms">
          {socialLinks.map((link, i) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="club-social-card"
              role="listitem"
              aria-label={link.label}
              style={{
                opacity: isVisible || prefersReduced ? 1 : 0,
                transform: isVisible || prefersReduced ? 'none' : 'translateY(12px)',
                transition: `opacity 0.4s var(--club-ease-smooth) ${i * 40}ms, transform 0.4s var(--club-ease-smooth) ${i * 40}ms`,
              }}
            >
              <div className="club-social-icon" aria-hidden="true">
                {link.icon}
              </div>
              <span className="club-social-label">{link.label}</span>
              <ExternalLinkIcon size={12} strokeWidth={1.5} />
            </a>
          ))}
        </div>

        {/* Scroll gradient fades */}
        <div className="club-socials-fade club-socials-fade--left" aria-hidden="true" />
        <div className="club-socials-fade club-socials-fade--right" aria-hidden="true" />
      </div>
    </section>
  );
}

function ExternalLinkIcon({ size = 12, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
}

/* ============================================================
   SECTION 06: OPEN TO BADGES — Chip/pill badges, notch shape
   Top-notched container, distinct from others
   ============================================================ */

interface OpenToBadge {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
}

interface OpenToBadgesProps {
  openTo: OpenToBadge[];
}

function ClubOpenToBadgesV2({ openTo }: OpenToBadgesProps) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  if (!openTo.length) return null;

  return (
    <section
      ref={sectionRef}
      id="opento"
      className="club-opento"
      aria-labelledby="opento-title"
      style={{ opacity: isVisible || prefersReduced ? 1 : 0, transform: isVisible || prefersReduced ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s var(--club-ease-smooth), transform 0.6s var(--club-ease-smooth)' }}
    >
      <header className="club-section-header">
        <span className="club-section-num">06</span>
        <h2 id="opento-title" className="club-section-title">OPEN TO</h2>
      </header>

      <div className="club-opento-container" role="list">
        {openTo.map((item, i) => (
          <div
            key={item.id}
            className="club-opento-badge"
            role="listitem"
            style={{
              opacity: isVisible || prefersReduced ? 1 : 0,
              transform: isVisible || prefersReduced ? 'none' : 'translateY(12px) scale(0.95)',
              transition: `opacity 0.4s var(--club-ease-snap) ${i * 50}ms, transform 0.4s var(--club-ease-snap) ${i * 50}ms`,
            }}
          >
            {item.icon && <span className="club-opento-icon" aria-hidden="true">{item.icon}</span>}
            <span className="club-opento-label">{item.label}</span>
            {item.href && <ExternalLinkIcon size={12} strokeWidth={1.5} />}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 07: RECENT ACTIVITY — Timeline, sharp left border
   Vertical timeline with sharp connecting line
   ============================================================ */

interface Activity {
  id: string;
  type: 'post' | 'release' | 'event' | 'collab' | 'media';
  title: string;
  description?: string;
  timestamp: string;
  link?: string;
  platform?: string;
}

interface RecentActivityProps {
  activities: Activity[];
  profile: { name: string; avatar?: string };
}

function ClubRecentActivityV2({ activities, profile }: RecentActivityProps) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const TYPE_CONFIG = {
    post: { icon: <MessageSquareIcon size={14} strokeWidth={1.5} />, accent: 'var(--club-electric-cyan)', label: 'POST' },
    release: { icon: <ZapIcon size={14} strokeWidth={1.5} />, accent: 'var(--club-electric-gold)', label: 'RELEASE' },
    event: { icon: <CalendarIcon size={14} strokeWidth={1.5} />, accent: 'var(--club-electric-magenta)', label: 'EVENT' },
    collab: { icon: <UserCircleIcon size={14} strokeWidth={1.5} />, accent: 'var(--club-electric-lime)', label: 'COLLAB' },
    media: { icon: <FilmIcon size={14} strokeWidth={1.5} />, accent: 'var(--club-electric-cyan)', label: 'MEDIA' },
  };

  if (!activities.length) return null;

  return (
    <section
      ref={sectionRef}
      id="activity"
      className="club-activity"
      aria-labelledby="activity-title"
      style={{ opacity: isVisible || prefersReduced ? 1 : 0, transform: isVisible || prefersReduced ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s var(--club-ease-smooth), transform 0.6s var(--club-ease-smooth)' }}
    >
      <header className="club-section-header">
        <span className="club-section-num">07</span>
        <h2 id="activity-title" className="club-section-title">RECENT ACTIVITY</h2>
      </header>

      <div className="club-activity-timeline" role="list">
        {activities.slice(0, 8).map((activity, i) => {
          const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.post;
          const isLast = i === Math.min(activities.length, 8) - 1;

          return (
            <article
              key={activity.id}
              className="club-activity-item"
              role="listitem"
              style={{
                '--accent': config.accent,
                opacity: isVisible || prefersReduced ? 1 : 0,
                transform: isVisible || prefersReduced ? 'none' : 'translateX(-16px)',
                transition: `opacity 0.5s var(--club-ease-smooth) ${i * 60}ms, transform 0.5s var(--club-ease-smooth) ${i * 60}ms`,
              }}
            >
              <div className="club-activity-marker" aria-hidden="true">
                <div className="club-activity-dot" />
                {!isLast && <div className="club-activity-line" />}
              </div>

              <div className="club-activity-content">
                <div className="club-activity-header">
                  <span className="club-activity-type">{config.label}</span>
                  <time className="club-activity-time" dateTime={activity.timestamp}>
                    {formatRelativeTime(activity.timestamp)}
                  </time>
                </div>

                <div className="club-activity-body">
                  <h3 className="club-activity-title">{activity.title}</h3>
                  {activity.description && <p className="club-activity-desc">{activity.description}</p>}
                  {activity.platform && <span className="club-activity-platform">{activity.platform}</span>}
                </div>

                {activity.link && (
                  <a href={activity.link} target="_blank" rel="noopener noreferrer" className="club-activity-link">
                    <ArrowUpRightIcon size={12} strokeWidth={1.5} />
                    <span>View</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MessageSquareIcon({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}

function ZapIcon({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}

function CalendarIcon({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ============================================================
   SECTION 08: CONTACT DRAWER — Slide-up panel, notched top
   ============================================================ */

interface ContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
    handle: string;
    email?: string;
    location?: string;
    calendlyUrl?: string;
  };
  onSubmit: (data: ClubTemplateData) => Promise<void>;
}

function ClubContactDrawerV2({ isOpen, onClose, profile, onSubmit }: ContactDrawerProps) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const prefersReduced = useReducedMotion();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await onSubmit(formData as ClubTemplateData);
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => { onClose(); setStatus('idle'); }, 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="club-drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        transition={{ duration: prefersReduced ? 0.01 : 200 }}
      />
      <motion.aside
        className="club-drawer"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, duration: prefersReduced ? 0.01 : 0.4 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="club-drawer-handle" aria-hidden="true" />

        <header className="club-drawer-header">
          <h2 id="drawer-title" className="club-drawer-title">GET IN TOUCH</h2>
          <button className="club-drawer-close" onClick={onClose} aria-label="Close">
            <XIcon size={20} strokeWidth={2} />
          </button>
        </header>

        {status === 'success' ? (
          <div className="club-drawer-success">
            <CheckIcon size={48} strokeWidth={2} />
            <h3>Message Sent</h3>
            <p>We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="club-drawer-form">
            <div className="club-drawer-field">
              <label htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                required
                disabled={status === 'submitting'}
              />
            </div>
            <div className="club-drawer-field">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                required
                disabled={status === 'submitting'}
              />
            </div>
            <div className="club-drawer-field">
              <label htmlFor="contact-subject">Subject</label>
              <select
                id="contact-subject"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                disabled={status === 'submitting'}
              >
                <option value="">Select a topic</option>
                <option value="collab">Collaboration</option>
                <option value="booking">Booking Inquiry</option>
                <option value="press">Press / Media</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="club-drawer-field">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us what's on your mind..."
                rows={4}
                required
                disabled={status === 'submitting'}
              />
            </div>

            {status === 'error' && (
              <div className="club-drawer-error">Failed to send. Please try again.</div>
            )}

            <button type="submit" className="club-drawer-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}

        <div className="club-drawer-alt">
          <span>Or book directly via</span>
          {profile.calendlyUrl && (
            <a href={profile.calendlyUrl} target="_blank" rel="noopener noreferrer" className="club-drawer-calendly">
              <CalendarIcon size={16} strokeWidth={2} />
              <span>Calendly</span>
              <ArrowUpRightIcon size={14} strokeWidth={2} />
            </a>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

function XIcon({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

function CheckIcon({ size = 48, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

/* ============================================================
   TOP NAV — Glassmorphism, sharp, compact
   ============================================================ */

interface TopNavProps {
  profile: { name: string; handle: string };
}

function ClubTopNavV2({ profile }: TopNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`club-topnav ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation" style={{ opacity: prefersReduced ? 1 : 0, transform: prefersReduced ? 'none' : 'translateY(-100%)', transition: 'opacity 0.4s var(--club-ease-smooth), transform 0.4s var(--club-ease-smooth)' }}>
      <div className="club-topnav-left">
        <a href="#hero" className="club-topnav-logo" aria-label={`${profile.name} - Home`}>
          {profile.name || 'THE CLUB'}
        </a>
        <div className="club-topnav-divider" aria-hidden="true" />
        <div className={`club-topnav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#manifesto" className="club-topnav-link">Manifesto</a>
          <a href="#proof" className="club-topnav-link">Proof</a>
          <a href="#works" className="club-topnav-link">Works</a>
          <a href="#socials" className="club-topnav-link">Socials</a>
          <a href="#activity" className="club-topnav-link">Activity</a>
        </div>
        <button className="club-topnav-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
          {mobileMenuOpen ? <XIcon size={20} strokeWidth={2} /> : <MenuIcon size={20} strokeWidth={2} />}
        </button>
      </div>
      <div className="club-topnav-right">
        <LiveClock format="HH:mm" className="club-topnav-clock" />
      </div>
    </nav>
  );
}

function MenuIcon({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}

/* ============================================================
   LIVE CLOCK — Compact, monospace
   ============================================================ */

interface LiveClockProps {
  format: 'HH:mm' | 'HH:mm:ss';
  className?: string;
}

function LiveClock({ format, className = '' }: LiveClockProps) {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: format === 'HH:mm:ss' ? '2-digit' : undefined }));
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const id = setInterval(() => setTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: format === 'HH:mm:ss' ? '2-digit' : undefined })), 1000);
    return () => clearInterval(id);
  }, [format, prefersReduced]);

  return <time className={`club-clock ${className}`} dateTime={new Date().toISOString()}>{time}</time>;
}

/* ============================================================
   ACTION DOCK — Mobile only, fixed bottom, compact
   ============================================================ */

interface ActionDockProps {
  profile: { name: string; handle: string; email?: string; availability?: string };
  onBookSession: () => void;
  onDownloadVCard: () => void;
  onCopyEmail: () => void;
  onShare: () => void;
}

function ClubActionDockV2({ profile, onBookSession, onDownloadVCard, onCopyEmail, onShare }: ActionDockProps) {
  const [copied, setCopied] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleCopyEmail = () => {
    onCopyEmail();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="club-action-dock" role="contentinfo" style={{ opacity: prefersReduced ? 1 : 0, transform: prefersReduced ? 'none' : 'translateY(100%)', transition: 'opacity 0.4s var(--club-ease-smooth), transform 0.4s var(--club-ease-smooth)' }}>
      <div className="club-dock-left">
        <LiveClock format="HH:mm" className="club-dock-clock" />
        <AvailabilityPill status={profile.availability || 'selective'} />
      </div>

      <div className="club-dock-center">
        <button className="club-dock-btn club-dock-btn--primary" onClick={onBookSession} aria-label="Book a session">
          <MailIcon size={16} strokeWidth={2} />
          <span>Book</span>
        </button>
        <button className="club-dock-btn club-dock-btn--secondary" onClick={onDownloadVCard} aria-label="Download vCard">
          <DownloadIcon size={16} strokeWidth={2} />
          <span>vCard</span>
        </button>
        <button className="club-dock-btn club-dock-btn--ghost" onClick={handleCopyEmail} aria-label={copied ? 'Email copied' : 'Copy email'} disabled={!profile.email}>
          {copied ? <CheckIcon size={16} strokeWidth={2} /> : <CopyIcon size={16} strokeWidth={2} />}
          <span>{copied ? 'Copied' : 'Email'}</span>
        </button>
      </div>

      <div className="club-dock-right">
        <button className="club-dock-btn club-dock-btn--ghost" onClick={onShare} aria-label="Share profile">
          <ShareIcon size={16} strokeWidth={2} />
        </button>
      </div>

      {copied && (
        <motion.div className="club-dock-toast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: prefersReduced ? 0.01 : 0.2 }}>
          Email copied
        </motion.div>
      )}
    </footer>
  );
}

function MailIcon({ size = 16, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}

function DownloadIcon({ size = 16, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}

function CopyIcon({ size = 16, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}

function ShareIcon({ size = 16, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.58" y2="10.49"/></svg>;
}

/* ============================================================
   AVAILABILITY PILL — Sharp pill, status dot
   ============================================================ */

interface AvailabilityPillProps {
  status: 'open' | 'busy' | 'selective' | 'closed';
}

function AvailabilityPill({ status }: AvailabilityPillProps) {
  const config = {
    open: { label: 'Open', color: 'var(--club-electric-lime)' },
    busy: { label: 'Busy', color: 'var(--club-electric-magenta)' },
    selective: { label: 'Selective', color: 'var(--club-electric-gold)' },
    closed: { label: 'Closed', color: 'var(--club-fg-subtle)' },
  }[status];

  return (
    <div className="club-availability" style={{ '--status-color': config.color }}>
      <span className="club-availability-dot" aria-hidden="true" />
      <span className="club-availability-label">{config.label}</span>
    </div>
  );
}

/* ============================================================
   REDUCED MOTION HOOK
   ============================================================ */

function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/* ============================================================
   MAIN TEMPLATE ORCHESTRATOR
   ============================================================ */

function ClubTemplateV2Inner({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const [clubData, setClubData] = useState<ClubTemplateData | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const { addToast } = useClubToast();

  // Adapt profile data
  useEffect(() => {
    setClubData(adaptPublicProfileToClub(profile));
  }, [profile]);

  const handleBookSession = useCallback(() => {
    setContactOpen(true);
  }, []);

  const handleDownloadVCard = useCallback(() => {
    if (clubData) {
      const vcard = generateVCard(clubData);
      const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clubData.handle || clubData.name}.vcf`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'vCard downloaded', description: 'Contact saved to your device' });
    }
  }, [clubData, addToast]);

  const handleCopyEmail = useCallback(() => {
    if (clubData?.email) {
      navigator.clipboard.writeText(clubData.email);
      addToast({ type: 'success', title: 'Email copied', description: `${clubData.email} copied to clipboard` });
    }
  }, [clubData, addToast]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: clubData?.name, text: clubData?.tagline, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast({ type: 'success', title: 'Link copied', description: 'Profile URL copied to clipboard' });
    }
  }, [clubData, addToast]);

  const handleContactSubmit = useCallback(async (data: ClubTemplateData) => {
    const response = await fetch('/api/profile/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, profileHandle: clubData?.handle }),
    });
    if (!response.ok) throw new Error('Failed to submit');
  }, [clubData]);

  if (!clubData) return null;

  // Convert social links to use brand icons
  const socialLinks = clubData.socialLinks.map(link => ({
    ...link,
    icon: CLUB_BRAND_ICONS[normalizeSocialPlatformKey(link.iconKey)] || link.icon,
  }));

  // Convert openTo badges
  const openToBadges = clubData.openTo.map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon ? CLUB_BRAND_ICONS[normalizeSocialPlatformKey(item.icon as ClubBrandIconKey)] : undefined,
    href: item.href,
  }));

  return (
    <div className="club-template-v2">
      {/* Top Nav — always present */}
      <ClubTopNavV2 profile={{ name: clubData.name, handle: clubData.handle }} />

      {/* Main Content — single vertical flow, no fixed panels */}
      <main className="club-main" style={{ paddingTop: '72px', paddingBottom: '96px' }}>
        {/* Hero — full viewport height on desktop, auto on mobile */}
        <ClubHeroV2 name={clubData.name} tagline={clubData.tagline} handle={clubData.handle} />

        {/* Content Sections — tight vertical rhythm */}
        <ClubManifestoV2 bio={clubData.bio} manifesto={clubData.manifesto} />
        <ClubProofLedgerV2 proofPoints={clubData.proofPoints} />
        <ClubCuratedWorksV2 projects={clubData.projects} />
        <ClubSocialsMatrixV2 socialLinks={socialLinks} />
        <ClubOpenToBadgesV2 openTo={openToBadges} />
        <ClubRecentActivityV2 activities={clubData.activities} profile={{ name: clubData.name, avatar: clubData.avatar }} />
      </main>

      {/* Mobile Action Dock — only on mobile */}
      <ClubActionDockV2
        profile={{ name: clubData.name, handle: clubData.handle, email: clubData.email, availability: clubData.availability }}
        onBookSession={handleBookSession}
        onDownloadVCard={handleDownloadVCard}
        onCopyEmail={handleCopyEmail}
        onShare={handleShare}
      />

      {/* Contact Drawer */}
      <ClubContactDrawerV2
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        profile={{ name: clubData.name, handle: clubData.handle, email: clubData.email, location: clubData.location, calendlyUrl: clubData.calendlyUrl }}
        onSubmit={handleContactSubmit}
      />
    </div>
  );
}

/* ============================================================
   EXPORT WRAPPER
   ============================================================ */

export function ClubTemplateV2(props: TemplateProps) {
  return (
    <ClubToastProvider>
      <ClubTemplateV2Inner {...props} />
    </ClubToastProvider>
  );
}