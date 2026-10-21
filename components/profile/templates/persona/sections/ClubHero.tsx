'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useClubMotion, useScrollReveal } from '../hooks/useClubMotion';
import { useReducedMotionContext } from '../hooks/useReducedMotion';
import { ClubHero3DFallback } from './ClubHero3D';
import { ScrollIndicator } from './ScrollIndicator';

const ClubHero3D = dynamic(
  () => import('./ClubHero3D').then(m => m.ClubHero3D),
  { ssr: false, loading: () => <ClubHero3DFallback /> }
);

interface ClubHeroProps {
  profile: {
    name: string;
    tagline: string;
  };
}

/* ============================================================
   CLUB HERO / MASTHEAD — Section 01
   Full-bleed 3D centerpiece with animated logotype
   ============================================================ */

export function ClubHero({ profile }: ClubHeroProps) {
  const { fadeInUp, fadeIn, sectionDelays } = useClubMotion();
  const prefersReduced = useReducedMotionContext();
  const [is3DLoaded, set3DLoaded] = useState(false);
  const [heroRef, isHeroVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1, delay: 0 });

  // Hide fallback when 3D loads
  useEffect(() => {
    if (is3DLoaded) {
      const timer = setTimeout(() => {}, 500);
      return () => clearTimeout(timer);
    }
  }, [is3DLoaded]);

  const heroVariants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : fadeInUp('gentle', sectionDelays.hero);

  const logoVariants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : fadeInUp('gentle', sectionDelays.hero + 0.1);

  const taglineVariants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : fadeInUp('gentle', sectionDelays.hero + 0.2);



  const scrollIndicatorVariants: any = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01, delay: 1 } } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20, delay: 1.5 } } };

  return (
    <>
      <style jsx>{`
        .club-hero {
          position: relative;
          width: 100%;
          min-height: 100vh;
          max-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          background: var(--club-gradient-void);
        }
        @media (max-width: 1023px) {
          .club-hero { min-height: 100vh; max-height: none; }
        }
        .club-hero-canvas { position: absolute; inset: 0; z-index: 0; }
        .club-hero-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--space-8) var(--space-6);
          max-width: 900px;
        }

        .club-hero-logo {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: var(--club-text-hero-logo);
          font-stretch: 150%;
          letter-spacing: 0.08em;
          line-height: 1.05;
          margin: 0;
          background: linear-gradient(135deg, oklch(0.65 0.22 200) 0%, oklch(0.55 0.28 100) 50%, oklch(0.65 0.25 280) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-wrap: balance;
        }
        .club-hero-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-style: italic;
          font-size: var(--club-text-hero-tagline);
          line-height: 1.4;
          margin: var(--space-4) 0 0;
          max-width: 700px;
          background: linear-gradient(135deg, oklch(0.55 0.28 100), oklch(0.65 0.25 280));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .club-hero-glow {
          position: absolute;
          inset: 0;
          z-index: -1;
          background: radial-gradient(ellipse at center, oklch(0.65 0.22 200 / 0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        .club-hero-fallback { z-index: 0; }
      `}</style>

      <motion.section
        id="hero"
        ref={heroRef}
        className="club-hero"
        aria-labelledby="hero-title"
        initial="hidden"
        animate={isHeroVisible ? 'visible' : 'hidden'}
        variants={heroVariants}
      >
        {/* 3D Canvas Layer */}
        <div className="club-hero-canvas" aria-hidden="true">
          <ClubHero3D
            intensity={1}
            geometry="icosphere"
            subdivisions={3}
            onLoad={() => set3DLoaded(true)}
          />
        </div>

        {/* Fallback */}
        <AnimatePresence mode="popLayout">
          {!is3DLoaded && <ClubHero3DFallback key="fallback" />}
        </AnimatePresence>

        {/* Ambient Glow */}
        <div className="club-hero-glow" aria-hidden="true" />

        {/* Content Layer */}
        <motion.div className="club-hero-content" variants={logoVariants}>

          <motion.h1
            id="hero-title"
            className="club-hero-logo"
            variants={logoVariants}
          >
            {profile.name || 'THE CLUB'}
          </motion.h1>

          <motion.p
            className="club-hero-tagline"
            variants={taglineVariants}
          >
            {profile.tagline || '"We shape culture."'}
          </motion.p>
        </motion.div>

        <motion.div
          className="club-scroll-indicator"
          variants={scrollIndicatorVariants}
        >
          <ScrollIndicator />
        </motion.div>
      </motion.section>
    </>
  );
}