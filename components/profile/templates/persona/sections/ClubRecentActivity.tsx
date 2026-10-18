'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useClubMotion, useScrollReveal } from '../hooks/useClubMotion';
import { Clock, Calendar } from 'lucide-react';

interface ClubActivityItem {
  id: string;
  type: 'post' | 'project' | 'collab' | 'milestone' | 'media' | 'speaking' | 'award' | 'press' | 'hiring' | 'custom';
  title: string;
  description?: string;
  timestamp: string;
  link?: string;
  metadata?: Record<string, string | number>;
}

interface ClubRecentActivityProps {
  activities: ClubActivityItem[];
  profile: { name: string; avatar?: string };
}

/* ============================================================
   CLUB RECENT ACTIVITY — Section 07
   Timeline with glassmorphism cards, live clock
   ============================================================ */

const TYPE_ICONS: Record<string, React.ReactNode> = {
  post: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  project: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>,
  collab: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  milestone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  media: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M2 10h20"/><path d="M10 2v20"/></svg>,
  speaking: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M8 8c0-2.2 1.8-4 4-4s4 1.8 4 4"/><path d="M8 14c0 2.2-1.8 4-4 4s-4-1.8-4-4"/><path d="M12 2v20"/></svg>,
  award: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="8" r="7"/><path d="M19 21l-5-5-5 5"/></svg>,
  press: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  hiring: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  custom: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
};

const TYPE_COLORS: Record<string, string> = {
  post: 'oklch(0.65 0.22 200)',
  project: 'oklch(0.55 0.28 100)',
  collab: 'oklch(0.65 0.25 280)',
  milestone: 'oklch(0.58 0.18 45)',
  media: 'oklch(0.65 0.22 200)',
  speaking: 'oklch(0.55 0.28 100)',
  award: 'oklch(0.58 0.18 45)',
  press: 'oklch(0.65 0.25 280)',
  hiring: 'oklch(0.58 0.18 45)',
  custom: 'oklch(0.65 0.22 200)',
};

export function ClubRecentActivity({ activities, profile }: ClubRecentActivityProps) {
  const { fadeInUp, sectionDelays, staggerContainer } = useClubMotion();
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15 });
  const prefersReduced = useClubMotion().prefersReduced;

  const itemVariants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } } };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      <style jsx>{`
        .club-activity-section {
          position: relative;
          padding: var(--space-12) var(--space-6);
          max-width: 700px;
          margin: 0 auto;
        }
        .club-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-8);
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
        .club-live-clock {
          font-family: 'JetBrains Mono', monospace;
          font-size: var(--club-text-mono);
          color: oklch(0.65 0.22 200);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .club-activity-feed {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .club-activity-item {
          position: relative;
          display: flex;
          gap: var(--space-4);
          padding: var(--space-4);
          border-radius: var(--radius-xl);
          background: linear-gradient(145deg, oklch(0.09 0.02 240 / 0.6) 0%, oklch(0.06 0.01 240 / 0.4) 100%);
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          backdrop-filter: blur(16px);
          transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .club-activity-item::before {
          content: '';
          position: absolute;
          left: var(--space-4);
          top: var(--space-4);
          bottom: var(--space-4);
          width: 2px;
          background: linear-gradient(180deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100));
        }
        .club-activity-item:last-child::before { display: none; }
        .club-activity-item:hover {
          border-color: oklch(0.65 0.22 200 / 0.5);
          transform: translateX(4px);
        }
        .club-activity-dot {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid oklch(0.03 0.02 240);
        }
        .club-activity-content { flex: 1; min-width: 0; }
        .club-activity-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }
        .club-activity-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: var(--club-text-body);
          color: oklch(0.98 0 0);
          line-height: 1.4;
        }
        .club-activity-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: var(--club-text-mono);
          color: oklch(0.55 0.02 240);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .club-activity-description {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-mono);
          color: oklch(0.75 0.02 240);
          line-height: 1.5;
          margin: 0;
        }
        .club-activity-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          margin-top: var(--space-2);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: var(--club-text-mono);
          color: oklch(0.65 0.22 200);
          text-decoration: none;
          transition: color 200ms ease;
        }
        .club-activity-link:hover { color: oklch(0.55 0.28 100); }
      `}</style>

      <section
        id="activity"
        ref={sectionRef}
        className="club-activity-section"
        aria-labelledby="activity-title"
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={staggerContainer('normal', sectionDelays.activity)}
      >
        <header className="club-section-header">
          <div>
            <span className="club-section-number">07</span>
            <h2 id="activity-title" className="club-section-title">RECENT ACTIVITY</h2>
          </div>
          <div className="club-live-clock" aria-label="Live clock">
            <Clock size={14} strokeWidth={2} />
            <LiveClock format="HH:mm:ss" />
          </div>
        </header>

        <motion.div className="club-activity-feed" variants={staggerContainer('normal')}>
          {activities.map((activity, i) => (
            <motion.article
              key={activity.id}
              className="club-activity-item"
              variants={itemVariants}
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              <div
                className="club-activity-dot"
                style={{ backgroundColor: TYPE_COLORS[activity.type] }}
                aria-hidden="true"
              />
              <div className="club-activity-content">
                <div className="club-activity-header">
                  {activity.link && (
                    <a href={activity.link} target="_blank" rel="noopener noreferrer" className="club-activity-link">
                      View
                      <ExternalLink size={12} strokeWidth={2} />
                    </a>
                  )}
                  <time className="club-activity-time" dateTime={activity.timestamp}>
                    {formatDate(activity.timestamp)}
                  </time>
                </div>
                <h3 className="club-activity-title">{activity.title}</h3>
                {activity.description && <p className="club-activity-description">{activity.description}</p>}
              </div>
            </motion.article>
          ))}
        </motion.div>

        {activities.length === 0 && (
          <div className="club-activity-item" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <p className="club-activity-description" style={{ margin: 0 }}>No recent activity</p>
          </div>
        )}
      </section>
    </>
  );
}

/* ============================================================
   LIVE CLOCK COMPONENT
   ============================================================ */

function LiveClock({ format = 'HH:mm:ss' }: { format?: string }) {
  const [time, setTime] = React.useState(() => new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatted = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: format.includes('ss') ? '2-digit' : undefined,
  });

  return <span>{formatted}</span>;
}

/* ExternalLink icon */
const ExternalLink = ({ size = 14, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);