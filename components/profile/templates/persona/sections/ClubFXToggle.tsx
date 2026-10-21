'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionContext } from '../hooks/useReducedMotion';

/* ============================================================
   CLUB FX TOGGLE — Respects prefers-reduced-motion
   ============================================================ */

export function ClubFXToggle() {
  const prefersReduced = useReducedMotionContext();
  const [fxEnabled, setFxEnabled] = useState(!prefersReduced);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read from localStorage
    const saved = localStorage.getItem('club-fx-enabled');
    if (saved !== null) {
      setFxEnabled(JSON.parse(saved));
    } else {
      setFxEnabled(!prefersReduced);
    }
  }, [prefersReduced]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('club-fx-enabled', JSON.stringify(fxEnabled));
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('club-fx-change', { detail: { enabled: fxEnabled } }));
  }, [fxEnabled, mounted]);

  // Auto-disable if prefers-reduced-motion changes
  useEffect(() => {
    if (prefersReduced && fxEnabled) {
      setFxEnabled(false);
    }
  }, [prefersReduced, fxEnabled]);

  if (!mounted) return null;

  return (
    <>
      <style jsx>{`
        .club-fx-toggle {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .club-fx-toggle-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .club-fx-toggle-track {
          position: relative;
          width: 56px;
          height: 28px;
          border-radius: var(--radius-full);
          background: oklch(0.09 0.02 240);
          border: 1px solid oklch(0.25 0.02 240 / 0.3);
          cursor: pointer;
          transition: all 200ms ease;
        }
        .club-fx-toggle-track.enabled {
          background: linear-gradient(135deg, oklch(0.65 0.22 200 / 0.2), oklch(0.55 0.28 100 / 0.2));
          border-color: oklch(0.65 0.22 200 / 0.5);
        }
        .club-fx-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 22px;
          height: 22px;
          border-radius: var(--radius-full);
          background: oklch(0.98 0 0);
          box-shadow: 0 2px 8px oklch(0 0 0 / 0.3);
          transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .club-fx-toggle-input:checked + .club-fx-toggle-track .club-fx-toggle-thumb {
          transform: translateX(28px);
        }
        .club-fx-toggle-icon {
          width: 14px;
          height: 14px;
          color: oklch(0.45 0.02 240);
          transition: all 200ms ease;
        }
        .club-fx-toggle-input:checked + .club-fx-toggle-track .club-fx-toggle-icon {
          color: oklch(0.65 0.22 200);
        }
        .club-fx-toggle-label {
          display: none;
        }
        @media (min-width: 768px) {
          .club-fx-toggle-label {
            display: inline-flex;
            align-items: center;
            gap: var(--space-2);
            margin-left: var(--space-2);
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: var(--club-text-mono);
            color: oklch(0.65 0.02 240);
          }
        }
        .club-fx-toggle-disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      <label className="club-fx-toggle" htmlFor="club-fx-toggle">
        <input
          id="club-fx-toggle"
          type="checkbox"
          className="club-fx-toggle-input"
          checked={fxEnabled}
          onChange={(e) => setFxEnabled(e.target.checked)}
          disabled={prefersReduced}
          aria-label={prefersReduced ? 'Effects disabled (system preference)' : fxEnabled ? 'Disable effects' : 'Enable effects'}
        />
        <div
          className={`club-fx-toggle-track ${fxEnabled ? 'enabled' : ''} ${prefersReduced ? 'club-fx-toggle-disabled' : ''}`}
          role="switch"
          aria-checked={fxEnabled}
          aria-disabled={prefersReduced}
        >
          <motion.div
            className="club-fx-toggle-thumb"
            animate={{ rotate: fxEnabled ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <svg className="club-fx-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </motion.div>
        </div>
        <span className="club-fx-toggle-label">
          {prefersReduced ? 'Reduced Motion' : fxEnabled ? 'FX On' : 'FX Off'}
        </span>
      </label>
    </>
  );
}