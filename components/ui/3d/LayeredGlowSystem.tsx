'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface LayeredGlowSystemProps {
  layers?: number;
  baseColor?: string;
  className?: string;
}

export type { LayeredGlowSystemProps };

export function LayeredGlowSystem({
  layers = 3,
  baseColor = 'var(--color-primary)',
  className = '',
}: LayeredGlowSystemProps) {
  const reducedMotion = useReducedMotion();

  const glows = React.useMemo(() => {
    return Array.from({ length: layers }, (_, i) => ({
      id: i,
      size: 300 + i * 150,
      opacity: 0.08 - i * 0.015,
      speed: 0.05 + i * 0.02,
      x: 20 + i * 20,
      y: 20 + i * 15,
    }));
  }, [layers]);

  if (reducedMotion) {
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
        {glows.map((g) => (
          <div
            key={g.id}
            className="absolute rounded-full"
            style={{
              left: `${g.x}%`,
              top: `${g.y}%`,
              width: g.size,
              height: g.size,
              background: `radial-gradient(circle at center, ${baseColor} 0%, transparent 70%)`,
              opacity: g.opacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {glows.map((g) => (
        <motion.div
          key={g.id}
          className="absolute rounded-full"
          style={{
            left: `${g.x}%`,
            top: `${g.y}%`,
            width: g.size,
            height: g.size,
            background: `radial-gradient(circle at center, ${baseColor} 0%, transparent 70%)`,
            opacity: g.opacity,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [g.opacity * 0.5, g.opacity, g.opacity * 0.5],
            x: ['0%', '5%', '0%'],
            y: ['0%', '-3%', '0%'],
          }}
          transition={{
            duration: 12 + g.id * 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: g.id * 1.5,
          }}
        />
      ))}
    </div>
  );
}
