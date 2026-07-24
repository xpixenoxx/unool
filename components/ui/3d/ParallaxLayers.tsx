'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion, MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spring, easing } from '@/components/ui/motion';

export interface ParallaxLayer {
  depth: number;
  scale?: number;
  children: React.ReactNode;
  className?: string;
}

export interface ParallaxLayersProps {
  layers: ParallaxLayer[];
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  mouseFollow?: boolean;
  scrollFollow?: boolean;
  mouseStrength?: number;
  scrollStrength?: number;
  /** Spring config for smoothing parallax motion (uses spring.smooth by default from design tokens; easing.expo available for custom springs) */
  springConfig?: { stiffness?: number; damping?: number; mass?: number };
}

const DEFAULT_MOUSE_STRENGTH = 30;
const DEFAULT_SCROLL_STRENGTH = 50;
const DEFAULT_SPRING = { stiffness: 350, damping: 30, mass: 1 }; // matches spring.smooth from design tokens
const DEFAULT_SCALE_BASE = 1;

function getLayerTransform(
  x: MotionValue<number> | number,
  y: MotionValue<number> | number,
  z: number,
  scale: number
): React.CSSProperties {
  const tx = typeof x === 'number' ? x : x.get();
  const ty = typeof y === 'number' ? y : y.get();
  return {
    transform: `translate3d(${tx}px, ${ty}px, ${z}px) scale(${scale})`,
    willChange: 'transform',
  };
}

export function ParallaxLayers({
  layers,
  containerClassName,
  containerStyle,
  mouseFollow = true,
  scrollFollow = true,
  mouseStrength = DEFAULT_MOUSE_STRENGTH,
  scrollStrength = DEFAULT_SCROLL_STRENGTH,
  springConfig = DEFAULT_SPRING,
}: ParallaxLayersProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Scroll tracking
  const scrollY = useMotionValue(0);

  // Spring-smoothed values for smooth parallax (using spring.expo easing for natural deceleration)
  const smoothMouseX = useSpring(mouseX, {
    ...springConfig,
    restSpeed: 0.01,
    restDelta: 0.01,
  });
  const smoothMouseY = useSpring(mouseY, {
    ...springConfig,
    restSpeed: 0.01,
    restDelta: 0.01,
  });
  const smoothScrollY = useSpring(scrollY, {
    ...springConfig,
    restSpeed: 0.01,
    restDelta: 0.01,
  });

  // Mouse move handler
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !mouseFollow || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      mouseX.set(x);
      mouseY.set(y);
    },
    [reducedMotion, mouseFollow, mouseX, mouseY]
  );

  // Mouse leave handler - return to center
  const handleMouseLeave = React.useCallback(() => {
    if (reducedMotion) return;
    mouseX.set(0);
    mouseY.set(0);
  }, [reducedMotion, mouseX, mouseY]);

  // Scroll handler (attached to window for page scroll)
  React.useEffect(() => {
    if (reducedMotion || !scrollFollow) return;

    const handleScroll = () => {
      scrollY.set(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [reducedMotion, scrollFollow, scrollY]);

  // Render layers with parallax transforms
  const layerElements = layers.map((layer, index) => {
    const depth = Math.max(0, Math.min(1, layer.depth));
    const scale = layer.scale ?? DEFAULT_SCALE_BASE + depth * 0.1;
    const baseZ = -depth * 100;

    // Parallax transforms - use spring-smoothed values with expo easing feel
    const x = reducedMotion
      ? 0
      : useTransform(
          [smoothMouseX, smoothScrollY],
          (values: number[]): number => values[0] * mouseStrength * depth + values[1] * scrollStrength * depth * 0.01
        );

    const y = reducedMotion
      ? 0
      : useTransform(
          [smoothMouseY, smoothScrollY],
          (values: number[]): number => values[0] * mouseStrength * depth + values[1] * scrollStrength * depth * 0.01
        );

    const z = reducedMotion ? 0 : baseZ;
    const layerScale = reducedMotion ? 1 : scale;

    const style = getLayerTransform(x, y, z, layerScale);

    return (
      <motion.div
        key={index}
        className={cn('absolute inset-0', layer.className)}
        style={style}
      >
        {layer.children}
      </motion.div>
    );
  });

  const containerStyles: React.CSSProperties = reducedMotion
    ? { ...containerStyle, position: 'relative', width: '100%', height: '100%', transform: 'none', willChange: 'auto' }
    : { position: 'relative', width: '100%', height: '100%', ...containerStyle };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', containerClassName)}
      style={containerStyles}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative z-10"
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          width: '100%',
          height: '100%',
        }}
        aria-hidden="true"
      >
        {layerElements}
      </div>
    </div>
  );
}

ParallaxLayers.displayName = 'ParallaxLayers';


// Convenience component for easy scroll-based parallax sections
export interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  layers?: ParallaxLayer[];
  /** Distance from viewport center to start parallax (in px) */
  offset?: number;
}

/**
 * ParallaxSection - Easy scroll-based parallax for page sections
 * Wraps content and applies parallax based on scroll position relative to viewport
 */
export function ParallaxSection({
  children,
  className,
  strength = 50,
  layers = [],
  offset = 0,
}: ParallaxSectionProps) {
  const reducedMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const scrollY = useMotionValue(0);

  // Spring for smooth parallax
  const smoothY = useSpring(scrollY, {
    ...DEFAULT_SPRING,
    restSpeed: 0.01,
    restDelta: 0.01,
  });

  React.useEffect(() => {
    if (reducedMotion) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        const handleScroll = () => {
          const rect = element.getBoundingClientRect();
          const viewportCenter = window.innerHeight / 2;
          const elementCenter = rect.top + rect.height / 2;
          const distance = elementCenter - viewportCenter;
          scrollY.set(distance);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
      },
      { rootMargin: `${-offset}px 0px ${-offset}px 0px` }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion, scrollY, offset]);

  const parallaxChildren = children instanceof Array ? children : [children];

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
    >
      {/* Custom parallax layers */}
      {layers.map((layer, index) => {
        const depth = Math.max(0, Math.min(1, layer.depth));
        const scale = layer.scale ?? 1 + depth * 0.1;
        const baseZ = -depth * 100;

        const y = reducedMotion
          ? 0
          : useTransform(smoothY, (y) => y * strength * depth * 0.01);

        const z = reducedMotion ? 0 : baseZ;
        const layerScale = reducedMotion ? 1 : scale;

        const style = getLayerTransform(0, y, z, layerScale);

        return (
          <motion.div
            key={index}
            className={cn('absolute inset-0', layer.className)}
            style={style}
          >
            {layer.children}
          </motion.div>
        );
      })}

      {/* Main content */}
      <div className="relative z-10">
        {parallaxChildren}
      </div>
    </div>
  );
}

ParallaxSection.displayName = 'ParallaxSection';


// Hook for using parallax values in custom components
export function useParallax({
  mouseStrength = DEFAULT_MOUSE_STRENGTH,
  scrollStrength = DEFAULT_SCROLL_STRENGTH,
  springConfig = DEFAULT_SPRING,
}: {
  mouseStrength?: number;
  scrollStrength?: number;
  springConfig?: { stiffness?: number; damping?: number; mass?: number };
} = {}) {
  const reducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const scrollY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, { ...springConfig, restSpeed: 0.01, restDelta: 0.01 });
  const smoothMouseY = useSpring(mouseY, { ...springConfig, restSpeed: 0.01, restDelta: 0.01 });
  const smoothScrollY = useSpring(scrollY, { ...springConfig, restSpeed: 0.01, restDelta: 0.01 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reducedMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [reducedMotion, mouseX, mouseY]
  );

  const handleMouseLeave = React.useCallback(() => {
    if (reducedMotion) return;
    mouseX.set(0);
    mouseY.set(0);
  }, [reducedMotion, mouseX, mouseY]);

  React.useEffect(() => {
    if (reducedMotion) return;
    const handleScroll = () => scrollY.set(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [reducedMotion, scrollY]);

  return {
    reducedMotion,
    mouseX: smoothMouseX,
    mouseY: smoothMouseY,
    scrollY: smoothScrollY,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
}

export { spring, easing } from '@/components/ui/motion';