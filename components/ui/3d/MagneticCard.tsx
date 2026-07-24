'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface MagneticCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
}

// Only allow safe, non-event props to pass through to motion.div
type MagneticCardRestProps = Omit<MagneticCardProps,
  'children' | 'strength' | 'radius' |
  'onMouseMove' | 'onMouseEnter' | 'onMouseLeave' |
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' |
  'onDragStart' | 'onDragEnd' | 'onDrag' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop' |
  'onKeyDown' | 'onKeyUp' | 'onKeyPress' |
  'onFocus' | 'onBlur' | 'onFocusCapture' | 'onBlurCapture'
>;

export function MagneticCard({
  children,
  className,
  strength = 0.3,
  radius = 120,
  style,
  ...props
}: MagneticCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const isHovering = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  const springConfig = prefersReducedMotion ? { stiffness: 500, damping: 50 } : { type: 'spring', damping: 10, stiffness: 100 } as const;
  const returnSpring = prefersReducedMotion ? { stiffness: 500, damping: 50 } : { type: 'spring', damping: 15, stiffness: 120 } as const;

  const springX = useSpring(x, returnSpring);
  const springY = useSpring(y, returnSpring);
  const springHover = useSpring(isHovering, springConfig);

  const rotateX = useTransform(springY, [-40, 0, 40], [8 * strength, 0, -8 * strength]);
  const rotateY = useTransform(springX, [-40, 0, 40], [-8 * strength, 0, 8 * strength]);
  const scale = useTransform(springHover, [0, 1], [1, 1.02]);
  const glow = useTransform(springHover, [0, 1], [0, 1]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const normalizedRadius = radius / (rect.width / 2);
    if (distance <= normalizedRadius) {
      x.set(deltaX * 40 * strength);
      y.set(deltaY * 40 * strength);
    }
  };

  const handleMouseEnter = () => {
    if (!prefersReducedMotion) {
      isHovering.set(1);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    isHovering.set(0);
  };

  if (prefersReducedMotion) {
    return (
      <div
        className={cn('relative transition-colors duration-300', className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn('relative transition-colors duration-300', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
        ...style,
      }}
      {...(props as MagneticCardRestProps)}
    >
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, var(--purple)/0, var(--purple)/0.15)',
          opacity: glow,
          borderRadius: 'inherit',
        }}
      />
      <motion.div
        className="relative"
        style={{
          transformStyle: 'preserve-3d',
          transform: (() => {
            const rx = rotateX.get();
            const ry = rotateY.get();
            const s = scale.get();
            return `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`;
          })(),
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

MagneticCard.displayName = 'MagneticCard';