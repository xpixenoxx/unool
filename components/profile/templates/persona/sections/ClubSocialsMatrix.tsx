'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useClubMotion, useScrollReveal } from '../hooks/useClubMotion';
import { CLUB_BRAND_ICONS, type ClubBrandIconKey } from '../ClubBrandIcons';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface ClubSocialLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  icon: React.ReactNode;
  iconKey: ClubBrandIconKey;
}

interface ClubSocialsMatrixProps {
  socialLinks: ClubSocialLink[];
}

/* ============================================================
   CLUB SOCIALS MATRIX — Section 05
   Horizontal scroll-snap rail with brand SVGs
   ============================================================ */

export function ClubSocialsMatrix({ socialLinks }: ClubSocialsMatrixProps) {
  const { fadeInUp, sectionDelays, staggerContainer } = useClubMotion();
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15 });
  const prefersReduced = useClubMotion().prefersReduced;
  const railRef = useRef<HTMLDivElement>(null);

  const cardVariants: any = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 28 } } };

  const scrollLeft = () => railRef.current?.scrollBy({ left: -200, behavior: prefersReduced ? 'auto' : 'smooth' });
  const scrollRight = () => railRef.current?.scrollBy({ left: 200, behavior: prefersReduced ? 'auto' : 'smooth' });

  return (
    <>
      <style jsx>{`
        .club-socials-section {
          position: relative;
          padding: var(--space-12) var(--space-6);
          max-width: 1200px;
          margin: 0 auto;
        }
        .club-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-8);
        }
        @media (max-width: 640px) {
          .club-section-header { flex-direction: column; align-items: flex-start; gap: var(--space-4); }
        }
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
        .club-socials-rail-wrapper {
          position: relative;
        }
        .club-socials-rail {
          display: flex;
          gap: var(--space-4);
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: var(--space-2) var(--space-2) var(--space-4);
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .club-socials-rail::-webkit-scrollbar { display: none; }
        .club-social-card {
          flex: 0 0 auto;
          width: 140px;
          min-width: 120px;
          max-width: 160px;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-5) var(--space-4);
          border-radius: var(--radius-xl);
          background: linear-gradient(145deg, oklch(0.09 0.02 240 / 0.6) 0%, oklch(0.06 0.01 240 / 0.4) 100%);
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          backdrop-filter: blur(16px);
          text-decoration: none;
          transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .club-social-card:hover {
          border-color: oklch(0.65 0.22 200 / 0.5);
          box-shadow: 0 16px 32px -8px oklch(0.65 0.22 200 / 0.2), 0 0 0 1px oklch(0.65 0.22 200 / 0.3);
          transform: translateY(-4px);
        }
        .club-social-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, oklch(0.65 0.22 200 / 0.15), oklch(0.55 0.28 100 / 0.1));
          border: 1px solid oklch(0.65 0.22 200 / 0.2);
          margin-bottom: var(--space-3);
          color: oklch(0.65 0.22 200);
          transition: all 300ms ease;
        }
        .club-social-card:hover .club-social-icon {
          border-color: oklch(0.65 0.22 200);
          box-shadow: 0 0 24px oklch(0.65 0.22 200 / 0.3);
        }
        .club-social-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: var(--club-text-mono);
          color: oklch(0.98 0 0);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .club-scroll-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          background: linear-gradient(145deg, oklch(0.09 0.02 240) 0%, oklch(0.06 0.01 240) 100%);
          border: 1px solid oklch(0.25 0.02 240 / 0.5);
          color: oklch(0.75 0.02 240);
          cursor: pointer;
          transition: all 200ms ease;
        }
        .club-scroll-btn:hover {
          border-color: oklch(0.65 0.22 200);
          color: oklch(0.65 0.22 200);
          background: oklch(0.65 0.22 200 / 0.1);
        }
        .club-scroll-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .club-scroll-left { position: absolute; left: -50px; top: 50%; transform: translateY(-50%); }
        .club-scroll-right { position: absolute; right: -50px; top: 50%; transform: translateY(-50%); }
        @media (max-width: 1024px) {
          .club-scroll-btn { display: none; }
        }
      `}</style>

      <motion.section
        id="socials"
        ref={sectionRef}
        className="club-socials-section"
        aria-labelledby="socials-title"
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={staggerContainer('normal', sectionDelays.socials)}
      >
        <header className="club-section-header">
          <div>
            <span className="club-section-number">05</span>
            <h2 id="socials-title" className="club-section-title">BRAND SOCIALS</h2>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              className="club-scroll-btn club-scroll-left"
              onClick={scrollLeft}
              aria-label="Scroll left"
              disabled={!railRef.current || railRef.current.scrollLeft === 0}
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              className="club-scroll-btn club-scroll-right"
              onClick={scrollRight}
              aria-label="Scroll right"
              disabled={!railRef.current || railRef.current.scrollLeft + railRef.current.clientWidth >= railRef.current.scrollWidth - 1}
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="club-socials-rail-wrapper">
          <div ref={railRef} className="club-socials-rail" role="list" aria-label="Social platforms">
            {socialLinks.map((link, i) => (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="club-social-card"
                role="listitem"
                variants={cardVariants}
                style={{ transitionDelay: `${i * 0.03}s` }}
                aria-label={link.label}
              >
                <div className="club-social-icon" aria-hidden="true">
                  {link.icon}
                </div>
                <span className="club-social-label">{link.label}</span>
                <ExternalLink size={14} strokeWidth={1.5} style={{ marginTop: 'var(--space-2)', opacity: 0.5 }} />
              </motion.a>
            ))}
          </div>
        </div>
      </motion.section>
    </>
  );
}