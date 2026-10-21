'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useClubMotion, useScrollReveal } from '../hooks/useClubMotion';

interface ClubManifestoProps {
  bio: string;
  manifesto: string;
}

/* ============================================================
   CLUB MANIFESTO — Section 02
   Editorial serif typesetting, staggered reveal
   ============================================================ */

export function ClubManifesto({ bio, manifesto }: ClubManifestoProps) {
  const { fadeInUp, sectionDelays } = useClubMotion();
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15, delay: 0 });

  const sectionVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } },
  };

  return (
    <>
      <style jsx>{`
        .club-manifesto-section {
          position: relative;
          padding: var(--space-12) var(--space-6);
          max-width: 800px;
          margin: 0 auto;
        }
        .club-section-header { margin-bottom: var(--space-8); }
        .club-section-number {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: var(--club-text-section-num);
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: oklch(0.45 0.02 240);
          opacity: 0.6;
          display: block;
          margin-bottom: var(--space-2);
        }
        .club-section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: var(--club-text-section-title);
          font-stretch: 125%;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin: 0;
          background: linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100), oklch(0.65 0.25 280));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .club-manifesto-content { position: relative; }
        .club-manifesto {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: var(--club-text-manifesto);
          line-height: var(--club-text-manifesto-leading);
          color: oklch(0.98 0 0);
          text-rendering: optimizeLegibility;
          margin: 0 0 var(--space-6);
        }
        .club-manifesto::first-letter {
          font-size: 3.5em;
          font-weight: 600;
          float: left;
          line-height: 0.85;
          margin-right: 0.1em;
          margin-top: 0.05em;
          color: oklch(0.55 0.28 100);
        }
        .club-pull-quote {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500;
          font-style: italic;
          font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
          line-height: 1.3;
          margin: var(--space-8) 0;
          padding-left: var(--space-6);
          border-left: 3px solid;
          border-image: linear-gradient(180deg, oklch(0.55 0.28 100), oklch(0.65 0.25 280)) 1;
          background: linear-gradient(135deg, oklch(0.55 0.28 100), oklch(0.65 0.25 280));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .club-manifesto-secondary {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: var(--club-text-manifesto);
          line-height: var(--club-text-manifesto-leading);
          color: oklch(0.85 0.02 240);
          margin: 0;
        }
        .club-manifesto-accent {
          position: absolute;
          bottom: -var(--space-8);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          max-width: 200px;
        }
        .club-accent-line {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, oklch(0.65 0.22 200), oklch(0.55 0.28 100), transparent);
        }
        .club-accent-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: oklch(0.55 0.28 100);
          box-shadow: 0 0 16px oklch(0.55 0.28 100 / 0.5);
        }
        @media (max-width: 640px) {
          .club-manifesto-section { padding: var(--space-8) var(--space-4); }
        }
      `}</style>

      <motion.section
        id="manifesto"
        ref={sectionRef}
        className="club-manifesto-section"
        aria-labelledby="manifesto-title"
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={sectionVariants}
      >
        <header className="club-section-header">
          <span className="club-section-number">02</span>
          <h2 id="manifesto-title" className="club-section-title">MANIFESTO</h2>
        </header>

        <motion.div className="club-manifesto-content" variants={itemVariants}>
          <motion.p className="club-manifesto" variants={itemVariants}>
            {bio}
          </motion.p>

          <motion.blockquote className="club-pull-quote" variants={itemVariants}>
            "The future belongs to those who create it."
          </motion.blockquote>

          <motion.p className="club-manifesto club-manifesto-secondary" variants={itemVariants}>
            {manifesto}
          </motion.p>
        </motion.div>

        <div className="club-manifesto-accent" aria-hidden="true">
          <div className="club-accent-line" aria-hidden="true" />
          <div className="club-accent-dot" aria-hidden="true" />
        </div>
      </motion.section>
    </>
  );
}