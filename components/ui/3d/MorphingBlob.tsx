'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spring } from '@/components/ui/motion';

interface MorphingBlobProps {
  className?: string;
  colors?: string[];
  /** @deprecated Use `colors` array instead */
  color?: string;
  /** Opacity of the blob */
  opacity?: number;
  /** Number of complexity iterations for morphing (default: 3) */
  complexity?: number;
  speed?: number;
  size?: number;
}

export function MorphingBlob({
  className,
  colors = ['var(--color-purple)', 'var(--color-primary)'],
  color,
  opacity,
  complexity,
  speed = 0.3,
  size = 200,
}: MorphingBlobProps) {
  // Support deprecated `color` prop alias
  const finalColors = color ? [color] : colors;
  const finalOpacity = opacity ?? 0.15;

  // Use CSS-based blobs instead of SVG filters to avoid the black rendering bug
  return (
    <div
      className={cn('relative pointer-events-none', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {finalColors.map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size * (0.5 + (i * 0.15)),
            height: size * (0.5 + (i * 0.15)),
            background: c,
            opacity: finalOpacity,
            filter: `blur(${size * 0.15}px)`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, size * 0.1, -size * 0.05, 0],
            y: [0, -size * 0.05, size * 0.1, 0],
            scale: [1, 1.15, 0.9, 1],
            borderRadius: ['50%', '40% 60% 60% 40%', '60% 40% 40% 60%', '50%'],
          }}
          transition={{
            duration: (speed > 0 ? 1 / speed : 10) * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}

MorphingBlob.displayName = 'MorphingBlob';
