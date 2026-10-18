'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useClubMotion } from '../hooks/useClubMotion';
import { useReducedMotionContext } from '../hooks/useReducedMotion';
import { ClubFXToggle } from './ClubFXToggle';
import { LiveClock } from './ClubLiveClock';
import { ClubAvailabilityPill } from './ClubAvailabilityPill';
import { Mail, Download, Copy, Share2, Check } from 'lucide-react';

interface ClubActionDockProps {
  profile: {
    name: string;
    handle: string;
    email?: string;
    availability?: 'open' | 'busy' | 'selective' | 'closed';
  };
  onBookSession: () => void;
  onDownloadVCard: () => void;
  onCopyEmail: () => void;
  onShare: () => void;
}

/* ============================================================
   CLUB ACTION DOCK — Fixed bottom bar (desktop only)
   ============================================================ */

export function ClubActionDock({ profile, onBookSession, onDownloadVCard, onCopyEmail, onShare }: ClubActionDockProps) {
  const { fadeInUp } = useClubMotion();
  const prefersReduced = useReducedMotionContext();
  const [copied, setCopied] = React.useState(false);

  const handleCopyEmail = () => {
    onCopyEmail();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dockVariants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 28, delay: 0.5 } } };

  return (
    <>
      <style jsx>{`
        .club-action-dock {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1100;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-6);
          background: linear-gradient(180deg, oklch(0.03 0.02 240 / 0.8) 0%, oklch(0.03 0.02 240 / 0.95) 100%);
          backdrop-filter: blur(24px);
          border-top: 1px solid oklch(0.25 0.02 240 / 0.3);
        }
        @media (max-width: 1023px) { .club-action-dock { display: none; } }
        .club-dock-left { display: flex; align-items: center; gap: var(--space-4); }
        .club-dock-center { display: flex; align-items: center; gap: var(--space-3); }
        .club-dock-right { display: flex; align-items: center; gap: var(--space-3); }
        .club-dock-clock {
          font-family: 'JetBrains Mono', monospace;
          font-size: var(--club-text-mono);
          color: oklch(0.65 0.22 200);
        }
        .club-dock-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          height: 44px;
          padding: 0 var(--space-5);
          border-radius: var(--radius-lg);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: var(--club-text-body);
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
          border: none;
        }
        .club-dock-btn-primary {
          background: linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100));
          color: oklch(0.03 0.02 240);
          box-shadow: 0 4px 16px -4px oklch(0.65 0.22 200 / 0.4);
        }
        .club-dock-btn-primary:hover {
          box-shadow: 0 8px 24px -4px oklch(0.65 0.22 200 / 0.5);
          transform: translateY(-2px);
        }
        .club-dock-btn-secondary {
          background: transparent;
          border: 1px solid oklch(0.65 0.22 200 / 0.3);
          color: oklch(0.65 0.22 200);
        }
        .club-dock-btn-secondary:hover {
          background: oklch(0.65 0.22 200 / 0.1);
          border-color: oklch(0.65 0.22 200);
        }
        .club-dock-btn-ghost {
          background: transparent;
          color: oklch(0.65 0.02 240);
        }
        .club-dock-btn-ghost:hover { color: oklch(0.98 0 0); }
        .club-dock-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .club-toast {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: var(--space-2);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          background: oklch(0.55 0.28 100);
          color: oklch(0.03 0.02 240);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: var(--club-text-mono);
          font-weight: 500;
          white-space: nowrap;
          animation: club-toast-in 200ms ease-out;
        }
        @keyframes club-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <footer className="club-action-dock" role="contentinfo" initial="hidden" animate="visible" variants={dockVariants}>
        <div className="club-dock-left">
          <LiveClock format="HH:mm" className="club-dock-clock" />
          <ClubAvailabilityPill status={profile.availability || 'selective'} />
        </div>

        <div className="club-dock-center">
          <button
            className="club-dock-btn club-dock-btn-primary"
            onClick={onBookSession}
            aria-label="Book a session"
          >
            <Mail size={18} strokeWidth={2} />
            Book a Session
          </button>
          <button
            className="club-dock-btn club-dock-btn-secondary"
            onClick={onDownloadVCard}
            aria-label="Download vCard"
          >
            <Download size={18} strokeWidth={2} />
            Download vCard
          </button>
          <button
            className="club-dock-btn club-dock-btn-ghost"
            onClick={handleCopyEmail}
            aria-label={copied ? 'Email copied' : 'Copy email'}
            disabled={!profile.email}
          >
            <Copy size={18} strokeWidth={2} />
            {copied ? <Check size={18} strokeWidth={2} /> : 'Copy Email'}
          </button>
        </div>

        <div className="club-dock-right">
          <ClubFXToggle />
          <button
            className="club-dock-btn club-dock-btn-ghost"
            onClick={onShare}
            aria-label="Share profile"
          >
            <Share2 size={18} strokeWidth={2} />
          </button>
        </div>

        {copied && (
          <motion.div className="club-toast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            Email copied!
          </motion.div>
        )}
      </footer>
    </>
  );
}