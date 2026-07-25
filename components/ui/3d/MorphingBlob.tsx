'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spring } from '@/components/ui/motion';

const BLOB_PATHS = [
  'M40,20 C60,20 60,40 40,60 C20,60 20,40 40,20',
  'M60,30 C80,30 80,70 60,70 C40,70 40,30 60,30',
  'M30,50 C50,50 50,80 30,80 C10,80 10,50 30,50',
  'M50,10 C70,10 70,50 50,50 C30,50 30,10 50,10',
];

interface MorphingBlobProps {
  className?: string;
  colors?: string[];
  /** @deprecated Use `colors` array instead */
  color?: string;
  /** Opacity of the blob (default: 0.6 / colors.length) */
  opacity?: number;
  /** Number of complexity iterations for morphing (default: 3) */
  complexity?: number;
  speed?: number;
  size?: number;
}

export function MorphingBlob({
  className,
  colors = ['var(--purple)', 'var(--primary)'],
  color,
  opacity,
  complexity,
  speed = 0.3,
  size = 200,
}: MorphingBlobProps) {
  // Support deprecated `color` prop alias
  const finalColors = color ? [color] : colors;
  const blobCount = Math.max(finalColors.length, complexity ?? 3);

  const baseMorphTransition = { ...spring.gentle, duration: speed, repeat: Infinity, repeatType: 'reverse' as const };
  const baseColorTransition = { ...spring.bouncy, duration: speed * 2, repeat: Infinity, repeatType: 'reverse' as const };
  const finalOpacity = opacity ?? 0.6 / finalColors.length;

  return (
    <motion.svg
      className={cn('relative pointer-events-none', className)}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <defs>
        <filter id="gooey" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>

      <g filter="url(#gooey)">
        {finalColors.map((color, i) => (
          <motion.path
            key={i}
            d={BLOB_PATHS[i % BLOB_PATHS.length]}
            fill={color}
            fillOpacity={finalOpacity}
            style={{ transformOrigin: 'center center' }}
            animate={{
              d: BLOB_PATHS.map((_, j) => BLOB_PATHS[(i + j) % BLOB_PATHS.length]),
              fill: finalColors.map((_, j) => finalColors[(i + j) % finalColors.length]),
            }}
            transition={{
              d: { ...baseMorphTransition, delay: i * 0.1 },
              fill: { ...baseColorTransition, delay: i * 0.2 },
            }}
          />
        ))}
      </g>
    </motion.svg>
  );
}

MorphingBlob.displayName = 'MorphingBlob';