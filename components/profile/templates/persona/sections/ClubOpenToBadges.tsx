'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useClubMotion, useScrollReveal } from '../hooks/useClubMotion';
import { Handshake, Mic, Compass, Sparkles, Briefcase, Megaphone, Lightbulb, Users } from 'lucide-react';

interface ClubOpenToItem {
  id: string;
  label: string;
  icon: string;
  variant?: 'default' | 'primary' | 'accent';
}

interface ClubOpenToBadgesProps {
  openTo: ClubOpenToItem[];
}

/* ============================================================
   CLUB OPEN TO BADGES — Section 06
   Animated intent chips with pulse on hover
   ============================================================ */

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Handshake,
  Mic,
  Compass,
  Sparkles,
  Briefcase,
  Megaphone,
  Lightbulb,
  Users,
};

const VARIANT_STYLES = {
  default: 'border-[oklch(0.25_0.02_240/0.3)] bg-[oklch(0.09_0.02_240/0.4)] hover:border-[oklch(0.65_0.22_200/0.5)]',
  primary: 'border-[oklch(0.65_0.22_200/0.3)] bg-[linear-gradient(135deg,oklch(0.65_0.22_200/0.15),oklch(0.55_0.28_100/0.1))] hover:border-[oklch(0.65_0.22_200)]',
  accent: 'border-[oklch(0.55_0.28_100/0.3)] bg-[linear-gradient(135deg,oklch(0.55_0.28_100/0.15),oklch(0.65_0.25_280/0.1))] hover:border-[oklch(0.55_0.28_100)]',
};

export function ClubOpenToBadges({ openTo }: ClubOpenToBadgesProps) {
  const { fadeInUp, sectionDelays, staggerContainer } = useClubMotion();
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15 });
  const prefersReduced = useClubMotion().prefersReduced;

  const badgeVariants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 480, damping: 18 } } };

  return (
    <>
      <style jsx>{`
        .club-open-to-section {
          position: relative;
          padding: var(--space-12) var(--space-6);
          max-width: 800px;
          margin: 0 auto;
        }
        .club-section-header { margin-bottom: var(--space-8); text-align: center; }
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
        .club-badges-wrap {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--space-3);
        }
        .club-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          border: 1px solid;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: var(--club-text-mono);
          color: oklch(0.98 0 0);
          cursor: default;
          transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .club-badge-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: oklch(0.65 0.22 200);
        }
        .club-badge-primary .club-badge-icon { color: oklch(0.65 0.22 200); }
        .club-badge-accent .club-badge-icon { color: oklch(0.55 0.28 100); }
        .club-badge:hover {
          transform: scale(1.05);
          box-shadow: 0 0 24px oklch(0.65 0.22 200 / 0.3);
        }
        .club-badge-primary:hover { box-shadow: 0 0 24px oklch(0.65 0.22 200 / 0.4); }
        .club-badge-accent:hover { box-shadow: 0 0 24px oklch(0.55 0.28 100 / 0.4); }
        @keyframes club-badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 oklch(0.65 0.22 200 / 0.4); }
          50% { box-shadow: 0 0 0 8px transparent; }
        }
        .club-badge-primary:not(:hover) { animation: club-badge-pulse 3s ease-in-out infinite; }
        .club-badge-accent:not(:hover) { animation: club-badge-pulse-accent 3s ease-in-out infinite; }
        @keyframes club-badge-pulse-accent {
          0%, 100% { box-shadow: 0 0 0 0 oklch(0.55 0.28 100 / 0.4); }
          50% { box-shadow: 0 0 0 8px transparent; }
        }
      `}</style>

      <section
        id="open-to"
        ref={sectionRef}
        className="club-open-to-section"
        aria-labelledby="open-to-title"
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={staggerContainer('normal', sectionDelays.openTo)}
      >
        <header className="club-section-header">
          <span className="club-section-number">06</span>
          <h2 id="open-to-title" className="club-section-title">OPEN TO</h2>
        </header>

        <motion.div className="club-badges-wrap" variants={staggerContainer('fast')}>
          {openTo.map((item, i) => {
            const Icon = ICON_MAP[item.icon] || Sparkles;
            const variantClass = `club-badge-${item.variant || 'default'}`;
            return (
              <motion.span
                key={item.id}
                className={`club-badge ${variantClass}`}
                variants={badgeVariants}
                style={{ transitionDelay: `${i * 0.05}s` }}
                role="listitem"
                aria-label={item.label}
              >
                <span className={`club-badge-icon ${item.variant ? `club-badge-${item.variant}` : ''}`} aria-hidden="true">
                  <Icon size={16} strokeWidth={2} />
                </span>
                {item.label}
              </motion.span>
            );
          })}
        </motion.div>
      </section>
    </>
  );
}