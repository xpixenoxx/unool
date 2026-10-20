'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useClubMotion, useScrollReveal } from '../hooks/useClubMotion';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface ClubProject {
  id: string;
  title: string;
  category: string;
  description: string;
  image?: string;
  images?: string[];
  blurDataURL?: string;
  metrics?: Record<string, string | number>;
  links?: Array<{ label: string; url: string; icon?: string }>;
  tags?: string[];
}

interface ClubCuratedWorksProps {
  projects: ClubProject[];
  onProjectOpen?: (project: ClubProject) => void;
}

/* ============================================================
   CLUB CURATED WORKS — Section 04
   Masonry grid with 3D tilt, project drawer
   ============================================================ */

export function ClubCuratedWorks({ projects, onProjectOpen }: ClubCuratedWorksProps) {
  const { fadeInUp, sectionDelays, staggerContainer } = useClubMotion();
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15 });
  const prefersReduced = useClubMotion().prefersReduced;
  const [selectedProject, setSelectedProject] = useState<ClubProject | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement>(null);

  // Focus trap for drawer
  useEffect(() => {
    if (!selectedProject) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
        onProjectOpen?.(null as any);
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    focusRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject]);

  const cardVariants: any = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 28 } } };

  const handleImageClick = (project: ClubProject) => {
    setSelectedProject(project);
    onProjectOpen?.(project);
  };

  return (
    <>
      <style jsx>{`
        .club-works-section {
          position: relative;
          padding: var(--space-12) var(--space-6);
          max-width: 1200px;
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
        .club-works-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: var(--space-4);
        }
        @media (min-width: 640px) { .club-works-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1024px) { .club-works-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .club-project-card {
          position: relative;
          border-radius: var(--radius-xl);
          overflow: hidden;
          background: linear-gradient(145deg, oklch(0.09 0.02 240) 0%, oklch(0.06 0.01 240) 100%);
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          cursor: pointer;
          transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .club-project-card:hover {
          border-color: oklch(0.65 0.22 200 / 0.5);
          box-shadow: 0 20px 40px -12px oklch(0.65 0.22 200 / 0.2), 0 0 0 1px oklch(0.65 0.22 200 / 0.3);
          transform: translateY(-4px) scale(1.01);
        }
        .club-project-image {
          aspect-ratio: 4/5;
          width: 100%;
          object-fit: cover;
          transition: transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .club-project-card:hover .club-project-image { transform: scale(1.05); }
        .club-project-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 50%, oklch(0.03 0.02 240 / 0.9) 100%);
          opacity: 0;
          transition: opacity 300ms ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: var(--space-6);
        }
        .club-project-card:hover .club-project-overlay { opacity: 1; }
        .club-project-category {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: var(--club-text-mono);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: oklch(0.65 0.22 200);
          margin-bottom: var(--space-2);
        }
        .club-project-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(1.25rem, 1rem + 1vw, 1.5rem);
          line-height: 1.2;
          color: oklch(0.98 0 0);
          margin: 0 0 var(--space-4);
        }
        .club-project-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }
        .club-project-tag {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-mono);
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-full);
          background: oklch(0.09 0.02 240 / 0.6);
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          color: oklch(0.75 0.02 240);
          backdrop-filter: blur(8px);
        }
        /* Project Drawer */
        .club-drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 1300;
          background: oklch(0 0 0 / 0.6);
          backdrop-filter: blur(8px);
        }
        .club-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 480px;
          max-width: 100vw;
          z-index: 1400;
          background: linear-gradient(145deg, oklch(0.09 0.02 240) 0%, oklch(0.06 0.01 240) 100%);
          border-left: 1px solid oklch(0.25 0.02 240 / 0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        @media (max-width: 640px) { .club-drawer { width: 100%; } }
        .club-drawer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: var(--space-6);
          border-bottom: 1px solid oklch(0.25 0.02 240 / 0.3);
          flex-shrink: 0;
        }
        .club-drawer-close {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          background: transparent;
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          color: oklch(0.75 0.02 240);
          cursor: pointer;
          transition: all 200ms ease;
        }
        .club-drawer-close:hover {
          background: oklch(0.65 0.22 200 / 0.1);
          border-color: oklch(0.65 0.22 200);
          color: oklch(0.65 0.22 200);
        }
        .club-drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-6);
        }
        .club-drawer-image {
          width: 100%;
          aspect-ratio: 16/10;
          object-fit: cover;
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-6);
        }
        .club-drawer-meta {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
        }
        .club-drawer-category {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: var(--club-text-mono);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: oklch(0.65 0.22 200);
        }
        .club-drawer-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
          line-height: 1.2;
          color: oklch(0.98 0 0);
          margin: 0 0 var(--space-4);
        }
        .club-drawer-description {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-body);
          line-height: var(--club-text-body-leading);
          color: oklch(0.85 0.02 240);
          margin: 0 0 var(--space-6);
        }
        .club-drawer-metrics {
          display: flex;
          gap: var(--space-6);
          padding: var(--space-4);
          background: oklch(0.06 0.01 240 / 0.5);
          border-radius: var(--radius-lg);
          border: 1px solid oklch(0.25 0.02 240 / 0.2);
          margin-bottom: var(--space-6);
        }
        .club-drawer-metric {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        .club-drawer-metric-value {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: clamp(1.25rem, 1rem + 1vw, 1.5rem);
          background: linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .club-drawer-metric-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-mono);
          color: oklch(0.55 0.02 240);
        }
        .club-drawer-links {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-3);
        }
        .club-drawer-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid oklch(0.65 0.22 200 / 0.3);
          color: oklch(0.65 0.22 200);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: var(--club-text-mono);
          text-decoration: none;
          transition: all 200ms ease;
        }
        .club-drawer-link:hover {
          background: oklch(0.65 0.22 200 / 0.1);
          border-color: oklch(0.65 0.22 200);
        }
      `}</style>

      <motion.section
        id="works"
        ref={sectionRef}
        className="club-works-section"
        aria-labelledby="works-title"
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={staggerContainer('normal', sectionDelays.works)}
      >
        <header className="club-section-header">
          <span className="club-section-number">04</span>
          <h2 id="works-title" className="club-section-title">CURATED WORKS</h2>
        </header>

        <motion.div className="club-works-grid" variants={staggerContainer('normal')}>
          {projects.map((project, i) => (
            <motion.article
              key={project.id}
              className="club-project-card"
              variants={cardVariants}
              onClick={() => handleImageClick(project)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleImageClick(project)}
              role="button"
              aria-label={`View project: ${project.title}`}
            >
              {project.image && (
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="club-project-image"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  placeholder="blur"
                  blurDataURL={project.blurDataURL || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='}
                />
              )}

              <div className="club-project-overlay">
                <span className="club-project-category">{project.category}</span>
                <h3 className="club-project-title">{project.title}</h3>
                <div className="club-project-tags">
                  {project.tags?.slice(0, 4).map((tag) => (
                    <span key={tag} className="club-project-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* Project Drawer */}
        <AnimatePresence>
          {selectedProject && (
            <>
              <motion.div
                className="club-drawer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProject(null)}
              />
              <motion.div
                ref={drawerRef}
                className="club-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <div className="club-drawer-header">
                  <div />
                  <button
                    ref={focusRef}
                    className="club-drawer-close"
                    onClick={() => setSelectedProject(null)}
                    aria-label="Close project details"
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                </div>

                <div className="club-drawer-content">
                  {selectedProject.image && (
                    <Image
                      src={selectedProject.image}
                      alt={selectedProject.title}
                      className="club-drawer-image"
                      sizes="100vw"
                      placeholder="blur"
                    />
                  )}

                  <div className="club-drawer-meta">
                    <span className="club-drawer-category">{selectedProject.category}</span>
                  </div>

                  <h3 className="club-drawer-title">{selectedProject.title}</h3>

                  <p className="club-drawer-description">{selectedProject.description}</p>

                  {selectedProject.metrics && Object.keys(selectedProject.metrics).length > 0 && (
                    <div className="club-drawer-metrics">
                      {Object.entries(selectedProject.metrics).map(([key, value]) => (
                        <div key={key} className="club-drawer-metric">
                          <span className="club-drawer-metric-value">{value}</span>
                          <span className="club-drawer-metric-label">{key}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedProject.links && selectedProject.links.length > 0 && (
                    <div className="club-drawer-links">
                      {selectedProject.links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="club-drawer-link"
                        >
                          {link.label}
                          <ExternalLink size={14} strokeWidth={2} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.section>
    </>
  );
}