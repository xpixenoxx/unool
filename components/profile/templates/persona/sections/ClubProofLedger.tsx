'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useClubMotion, useScrollReveal } from '../hooks/useClubMotion';
import { TrendingUp, Users, Award, UserCircle } from 'lucide-react';

interface ClubProofLedgerProps {
  proofPoints: Array<{
    id: string;
    label: string;
    value: number;
    suffix?: string;
    icon?: string;
    subtext?: string;
  }>;
}

/* ============================================================
   CLUB PROOF LEDGER — Section 03
   KPI cards with magnetic hover, live counters
   ============================================================ */

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  TrendingUp,
  Users,
  Award,
  UserCircle,
};

export function ClubProofLedger({ proofPoints }: ClubProofLedgerProps) {
  const { fadeInUp, sectionDelays, staggerContainer } = useClubMotion();
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15 });
  const prefersReduced = useClubMotion().prefersReduced;

  const cardVariants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 28 } } };

  return (
    <>
      <style jsx>{`
        .club-proof-section {
          position: relative;
          padding: var(--space-12) var(--space-6);
          max-width: 1000px;
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
        .club-proof-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: var(--space-4);
        }
        @media (min-width: 640px) { .club-proof-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1024px) { .club-proof-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .club-proof-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--space-6);
          border-radius: var(--radius-xl);
          background: linear-gradient(145deg, oklch(0.09 0.02 240) 0%, oklch(0.06 0.01 240) 100%);
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          backdrop-filter: blur(12px);
          transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }
        .club-proof-card:hover {
          border-color: oklch(0.65 0.22 200 / 0.5);
          box-shadow: 0 20px 40px -12px oklch(0.65 0.22 200 / 0.2), 0 0 0 1px oklch(0.65 0.22 200 / 0.3);
          transform: translateY(-4px);
        }
        .club-proof-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, oklch(0.65 0.22 200 / 0.15), oklch(0.55 0.28 100 / 0.1));
          border: 1px solid oklch(0.65 0.22 200 / 0.2);
          margin-bottom: var(--space-4);
          color: oklch(0.65 0.22 200);
        }
        .club-proof-value { margin-bottom: var(--space-2); }
        .club-kpi-number {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: var(--club-text-kpi);
          font-stretch: 150%;
          letter-spacing: -0.03em;
          line-height: 1;
          margin: 0;
          background: linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100), oklch(0.65 0.25 280));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .club-kpi-suffix {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);
          font-stretch: 125%;
          background: linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .club-proof-label { display: flex; flex-direction: column; gap: var(--space-1); }
        .club-proof-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: var(--club-text-body);
          color: oklch(0.98 0 0);
        }
        .club-proof-subtext {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-mono);
          color: oklch(0.55 0.02 240);
        }
        .club-proof-glow {
          position: absolute;
          inset: 0;
          border-radius: var(--radius-xl);
          background: radial-gradient(ellipse at center, oklch(0.65 0.22 200 / 0.15) 0%, transparent 70%);
          opacity: 0;
          pointer-events: none;
          transition: opacity 300ms ease;
        }
        .club-proof-card:hover .club-proof-glow { opacity: 1; }
      `}</style>

      <section
        id="proof"
        ref={sectionRef}
        className="club-proof-section"
        aria-labelledby="proof-title"
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={staggerContainer('normal', sectionDelays.proof)}
      >
        <header className="club-section-header">
          <span className="club-section-number">03</span>
          <h2 id="proof-title" className="club-section-title">PROOF LEDGER</h2>
        </header>

        <motion.div className="club-proof-grid" variants={staggerContainer('normal')}>
          {proofPoints.map((proof, i) => {
            const Icon = ICON_MAP[proof.icon || 'TrendingUp'] || TrendingUp;
            return (
              <motion.article
                key={proof.id}
                className="club-proof-card magnetic-card"
                role="listitem"
                variants={cardVariants}
                style={{ transitionDelay: `${i * 0.05}s` }}
              >
                <div className="club-proof-icon" aria-hidden="true">
                  <Icon size={28} strokeWidth={1.5} />
                </div>

                <div className="club-proof-value">
                  <AnimatedCounter
                    end={proof.value}
                    duration={2000}
                    className="club-kpi-number"
                    suffix={proof.suffix}
                  />
                </div>

                <div className="club-proof-label">
                  <span className="club-proof-title">{proof.label}</span>
                  {proof.subtext && <span className="club-proof-subtext">{proof.subtext}</span>}
                </div>

                <div className="club-proof-glow" aria-hidden="true" />
              </motion.article>
            );
          })}
        </motion.div>
      </section>
    </>
  );
}

/* ============================================================
   ANIMATED COUNTER
   ============================================================ */

function AnimatedCounter({ end, duration = 2000, className, suffix = '' }: {
  end: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const [count, setCount] = React.useState(0);
  const prefersReduced = useClubMotion().prefersReduced;

  useEffect(() => {
    if (prefersReduced) {
      setCount(end);
      return;
    }

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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