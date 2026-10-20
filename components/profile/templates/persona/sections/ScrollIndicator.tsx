'use client';

import { motion } from 'framer-motion';
import { useReducedMotionContext } from '../hooks/useReducedMotion';

/* ============================================================
   SCROLL INDICATOR — Animated mouse/arrow
   ============================================================ */

export function ScrollIndicator() {
  const prefersReduced = useReducedMotionContext();

  const variants: any = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 1,
          },
        },
      };

  const bounceVariants: any = prefersReduced
    ? { animate: { y: 0 } }
    : {
        animate: {
          y: [0, 10, 0],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      };

  return (
    <>
      <style jsx>{`
        .club-scroll-indicator {
          position: absolute;
          bottom: var(--space-8);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          pointer-events: none;
        }
        .club-scroll-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: var(--club-text-mono);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: oklch(0.45 0.02 240);
        }
        .club-scroll-mouse {
          position: relative;
          width: 26px;
          height: 42px;
          border: 2px solid oklch(0.65 0.22 200 / 0.5);
          border-radius: 13px;
          display: flex;
          justify-content: center;
          padding-top: 8px;
        }
        .club-scroll-wheel {
          width: 4px;
          height: 8px;
          border-radius: 2px;
          background: linear-gradient(180deg, oklch(0.65 0.22 200), oklch(0.55 0.28 100));
        }
      `}</style>

      <motion.div className="club-scroll-indicator" variants={variants} initial="hidden" animate="visible">
        <span className="club-scroll-text">Scroll</span>
        <motion.div className="club-scroll-mouse" variants={bounceVariants}>
          <motion.div className="club-scroll-wheel" />
        </motion.div>
      </motion.div>
    </>
  );
}