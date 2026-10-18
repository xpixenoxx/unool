'use client';

import React from 'react';

/* ============================================================
   CLUB AVAILABILITY PILL — Status indicator
   ============================================================ */

type AvailabilityStatus = 'open' | 'busy' | 'selective' | 'closed';

const STATUS_CONFIG: Record<AvailabilityStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: {
    label: 'Open for work',
    color: 'oklch(0.55 0.28 100)',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>,
  },
  busy: {
    label: 'Currently busy',
    color: 'oklch(0.58 0.22 25)',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  },
  selective: {
    label: 'Selectively open',
    color: 'oklch(0.65 0.22 200)',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>,
  },
  closed: {
    label: 'Not accepting work',
    color: 'oklch(0.45 0.02 240)',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  },
};

interface ClubAvailabilityPillProps {
  status?: AvailabilityStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ClubAvailabilityPill({ status = 'selective', size = 'md', showLabel = true }: ClubAvailabilityPillProps) {
  const config = STATUS_CONFIG[status];

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '0.6875rem', gap: '4px', iconSize: 10 },
    md: { padding: '4px 10px', fontSize: '0.75rem', gap: '6px', iconSize: 12 },
    lg: { padding: '6px 14px', fontSize: '0.8125rem', gap: '8px', iconSize: 14 },
  };

  const styles = sizeStyles[size];

  return (
    <>
      <style jsx>{`
        .club-availability-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--gap);
          padding: var(--padding);
          border-radius: var(--radius-full);
          background: var(--bg);
          border: 1px solid var(--border);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: var(--font-size);
          color: var(--color);
          --gap: ${styles.gap}px;
          --padding: ${styles.padding};
          --font-size: ${styles.fontSize};
          --bg: ${config.color}15;
          --border: ${config.color}40;
          --color: ${config.color};
        }
        .club-availability-icon {
          width: ${styles.iconSize}px;
          height: ${styles.iconSize}px;
          flex-shrink: 0;
        }
        .club-availability-pulse {
          position: relative;
        }
        .club-availability-pulse::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: inherit;
          background: var(--color);
          opacity: 0.4;
          animation: club-pulse-ring 2s ease-out infinite;
        }
        @keyframes club-pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .club-availability-pulse::before { animation: none; }
        }
      `}</style>

      <span className="club-availability-pill" style={{ '--gap': `${styles.gap}px`, '--padding': styles.padding, '--font-size': styles.fontSize }} role="status" aria-label={config.label}>
        <span className={`club-availability-icon ${status === 'open' ? 'club-availability-pulse' : ''}`} aria-hidden="true">
          {config.icon}
        </span>
        {showLabel && <span>{config.label}</span>}
      </span>
    </>
  );
}