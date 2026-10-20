'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClubMotion } from '../hooks/useClubMotion';
import { useReducedMotionContext } from '../hooks/useReducedMotion';
import { ClubFXToggle } from './ClubFXToggle';
import { LiveClock } from './ClubLiveClock';
import { ClubAvailabilityPill } from './ClubAvailabilityPill';

interface ClubTopNavProps {
  profile: {
    name: string;
    handle: string;
  };
}

/* ============================================================
   CLUB TOP NAV — Glassmorphism, Fixed, Responsive
   ============================================================ */

export function ClubTopNav({ profile }: ClubTopNavProps) {
  const { fadeIn, slideInRight } = useClubMotion();
  const prefersReduced = useReducedMotionContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navVariants: any = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } } };

  return (
    <>
      <style jsx>{`
        .club-top-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1200;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-6);
          background: linear-gradient(180deg, oklch(0.03 0.02 240 / 0.8) 0%, oklch(0.03 0.02 240 / 0.4) 100%);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid oklch(0.25 0.02 240 / 0.3);
          transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .club-top-nav.scrolled {
          background: linear-gradient(180deg, oklch(0.03 0.02 240 / 0.95) 0%, oklch(0.03 0.02 240 / 0.6) 100%);
          border-bottom-color: oklch(0.35 0.02 240 / 0.5);
          box-shadow: 0 4px 24px -4px oklch(0 0 0 / 0.4);
        }
        .club-nav-left { display: flex; align-items: center; gap: var(--space-6); }
        .club-nav-right { display: flex; align-items: center; gap: var(--space-4); }
        .club-logo {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(1.25rem, 1rem + 1vw, 1.5rem);
          font-stretch: 150%;
          letter-spacing: 0.05em;
          text-decoration: none;
          background: linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100), oklch(0.65 0.25 280));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          transition: filter 300ms ease;
        }
        .club-logo:hover { filter: brightness(1.2); }
        .club-nav-divider {
          width: 1px;
          height: 24px;
          background: linear-gradient(180deg, transparent, oklch(0.25 0.02 240 / 0.5), transparent);
        }
        .club-nav-links { display: flex; align-items: center; gap: var(--space-2); }
        .club-nav-link {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: var(--club-text-mono);
          color: oklch(0.65 0.02 240);
          text-decoration: none;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-md);
          transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .club-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100));
          transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translateX(-50%);
        }
        .club-nav-link:hover {
          color: oklch(0.98 0 0);
        }
        .club-nav-link:hover::after { width: 80%; }
        .club-mobile-menu-btn { display: none; }
        @media (max-width: 768px) {
          .club-nav-links { display: none; }
          .club-nav-links.mobile-open {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 72px;
            left: 0;
            right: 0;
            padding: var(--space-4);
            background: oklch(0.03 0.02 240 / 0.98);
            backdrop-filter: blur(24px);
            border-bottom: 1px solid oklch(0.25 0.02 240 / 0.3);
            gap: var(--space-2);
          }
          .club-mobile-menu-btn { display: flex; }
        }
      `}</style>

      <motion.nav
        className={`club-top-nav ${scrolled ? 'scrolled' : ''}`}
        role="navigation"
        aria-label="Main navigation"
        initial="hidden"
        animate="visible"
        variants={navVariants}
      >
        <div className="club-nav-left">
          <a href="#hero" className="club-logo" aria-label={`${profile.name} - Home`}>
            {profile.name || 'THE CLUB'}
          </a>
          <div className="club-nav-divider" aria-hidden="true" />
          <div className={`club-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#manifesto" className="club-nav-link">Manifesto</a>
            <a href="#proof" className="club-nav-link">Proof</a>
            <a href="#works" className="club-nav-link">Works</a>
            <a href="#socials" className="club-nav-link">Socials</a>
            <a href="#activity" className="club-nav-link">Activity</a>
          </div>
          <button
            className="club-mobile-menu-btn btn btn-ghost btn-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className="club-nav-right">
          <AnimatePresence mode="popLayout">
            <motion.div
              key="fx-toggle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <ClubFXToggle />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            <motion.div
              key="live-clock"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.1 }}
            >
              <LiveClock format="HH:mm" className="club-dock-clock" />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            <motion.div
              key="availability"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.15 }}
            >
              <ClubAvailabilityPill />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Spacer for fixed nav */}
      <div style={{ height: '72px' }} aria-hidden="true" />
    </>
  );
}