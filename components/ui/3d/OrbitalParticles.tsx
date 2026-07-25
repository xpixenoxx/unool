'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface OrbitalParticlesProps {
  count?: number;
  particleCount?: number; // alias for count
  size?: number;
  sizeRange?: [number, number]; // min/max size
  color?: string;
  colors?: string[]; // array of colors to cycle through
  opacity?: number;
  opacityRange?: [number, number]; // min/max opacity
  speed?: number;
  className?: string;
}

export type { OrbitalParticlesProps };

export function OrbitalParticles({
  count = 60,
  particleCount,
  size = 2,
  sizeRange = [0.5, 3.5],
  color = 'var(--color-primary)',
  colors,
  opacity = 0.3,
  opacityRange = [0.1, 0.5],
  speed = 0.15,
  className = '',
}: OrbitalParticlesProps) {
  const reducedMotion = useReducedMotion();

  const effectiveCount = particleCount ?? count;

  const particles = React.useMemo(() => {
    return Array.from({ length: effectiveCount }, (_, i) => {
      const colorValue = colors ? colors[i % colors.length] : (Math.random() > 0.5 ? color : 'oklch(0.7 0.25 80)');
      const minSize = sizeRange[0] * size;
      const maxSize = sizeRange[1] * size;
      const minOpacity = opacityRange[0];
      const maxOpacity = opacityRange[1];

      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: minSize + Math.random() * (maxSize - minSize),
        opacity: minOpacity + Math.random() * (maxOpacity - minOpacity),
        speed: speed * (0.5 + Math.random() * 1),
        delay: Math.random() * 10,
        angle: Math.random() * 360,
        radius: 10 + Math.random() * 40,
        color: colorValue,
      };
    });
  }, [effectiveCount, size, sizeRange, color, colors, opacity, opacityRange, speed]);

  if (reducedMotion) {
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              opacity: p.opacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: p.opacity,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, Math.cos((p.angle * Math.PI) / 180) * p.radius * 2, 0],
            y: [0, Math.sin((p.angle * Math.PI) / 180) * p.radius * 2, 0],
            scale: [1, 1.5, 1],
            opacity: [p.opacity * 0.5, p.opacity, p.opacity * 0.5],
          }}
          transition={{
            duration: 8 + p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
