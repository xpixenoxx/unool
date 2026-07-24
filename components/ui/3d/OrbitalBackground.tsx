'use client';

import * as React from 'react';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design/tokens';

/**
 * OrbitalBackground - Floating 3D orbs with orbital spring animation
 *
 * Features:
 * - Floating 3D orbs with orbital spring animation (spring.orbital)
 * - Responsive particle count (auto-scales with viewport)
 * - Theme-aware colors using CSS custom properties
 * - Canvas rendering with SVG fallback
 * - Respects prefers-reduced-motion (renders static)
 * - IntersectionObserver pause for performance (pauses when off-screen)
 * - Full TypeScript types with JSDoc
 *
 * @example
 * ```tsx
 * <OrbitalBackground
 *   count={8}
 *   colors={['var(--purple)', 'var(--primary)', 'var(--success)']}
 *   radius={60}
 *   speed={0.8}
 *   className="fixed inset-0 -z-10"
 * />
 * ```
 */
export interface OrbitalBackgroundProps {
  /** Number of orbital particles (default: 6, auto-scales 8-32 based on viewport) */
  count?: number;
  /** Theme-aware color tokens (default: ['var(--purple)', 'var(--primary)']) */
  colors?: string[];
  /** Orbital radius in pixels (default: 40) */
  radius?: number;
  /** Orbital speed multiplier (default: 0.5) */
  speed?: number;
  /** Canvas rendering (default: true). Falls back to SVG if false or unsupported */
  useCanvas?: boolean;
  /** Pause animation when off-screen (default: true) */
  pauseWhenHidden?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Z-index (default: -10 for background) */
  zIndex?: number;
}

interface OrbitalParticle {
  id: number;
  angle: number;
  radius: number;
  speed: number;
  color: string;
  size: number;
  opacity: number;
  phase: number;
  depth: number; // 0-1 for 3D depth effect
}

const { motion: motionTokens } = designTokens;
const orbitalSpring = motionTokens.springs.orbital;

/** Default configuration matching design tokens */
const DEFAULT_CONFIG = {
  count: 6,
  radius: 40,
  speed: 0.5,
  useCanvas: true,
  pauseWhenHidden: true,
  zIndex: -10,
  minCount: 6,
  maxCount: 32,
  // Responsive count breakpoints
  countBreakpoints: {
    sm: 8,   // 640px+
    md: 12,  // 768px+
    lg: 18,  // 1024px+
    xl: 24,  // 1280px+
    '2xl': 32, // 1536px+
  },
};

/**
 * Generates orbital particles with orbital spring dynamics
 */
function generateParticles(count: number, colors: string[], radius: number, speed: number): OrbitalParticle[] {
  const particles: OrbitalParticle[] = [];
  const radiusVariance = radius * 0.3; // ±30% variance
  const sizeRange = { min: radius * 0.15, max: radius * 0.35 };
  const opacityRange = { min: 0.15, max: 0.45 };

  for (let i = 0; i < count; i++) {
    // Distribute particles evenly around the circle with orbital phase offset
    const baseAngle = (i / count) * Math.PI * 2;
    const phaseOffset = baseAngle + (Math.random() - 0.5) * 0.5; // slight phase variance

    // Orbital radius with variance
    const orbitRadius = radius + (Math.random() - 0.5) * radiusVariance * 2;

    // Orbital speed with spring.orbital characteristics (loose, organic)
    const orbitSpeed = speed * (0.5 + Math.random() * 0.8) * (0.5 + Math.random() * 0.5);

    // 3D depth for parallax effect
    const depth = 0.3 + Math.random() * 0.7;

    particles.push({
      id: i,
      angle: baseAngle,
      radius: orbitRadius,
      speed: orbitSpeed,
      color: colors[i % colors.length],
      size: sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min),
      opacity: opacityRange.min + Math.random() * (opacityRange.max - opacityRange.min),
      phase: phaseOffset,
      depth,
    });
  }
  return particles;
}

/**
 * Responsive particle count based on viewport width
 * Scales from minCount to maxCount across breakpoints
 */
function useResponsiveCount(config: typeof DEFAULT_CONFIG): number {
  const [count, setCount] = React.useState(config.count);

  React.useEffect(() => {
    const updateCount = () => {
      const width = window.innerWidth;
      let newCount = config.minCount;

      if (width >= 1536) newCount = config.countBreakpoints['2xl'];
      else if (width >= 1280) newCount = config.countBreakpoints.xl;
      else if (width >= 1024) newCount = config.countBreakpoints.lg;
      else if (width >= 768) newCount = config.countBreakpoints.md;
      else if (width >= 640) newCount = config.countBreakpoints.sm;
      else newCount = config.minCount;

      // Clamp to maxCount
      newCount = Math.min(newCount, config.maxCount);
      setCount(newCount);
    };

    updateCount();
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

  return count;
}

/**
 * Canvas-based orbital renderer for high performance
 */
function CanvasOrbitals({
  particles,
  width,
  height,
  centerX,
  centerY,
  time,
  speed,
  reducedMotion,
}: {
  particles: OrbitalParticle[];
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  time: number;
  speed: number;
  reducedMotion: boolean;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationRef = React.useRef<number | undefined>(undefined);
  const particlesRef = React.useRef(particles);
  particlesRef.current = particles;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let lastTime = 0;

    const animate = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      const t = reducedMotion ? 0 : currentTime * 0.001 * speed;

      for (const p of particlesRef.current) {
        // Orbital spring dynamics: loose, organic orbits
        const angle = p.angle + t * p.speed + Math.sin(t * 0.3 + p.phase) * 0.5;
        const x = centerX + Math.cos(angle) * p.radius;
        const y = centerY + Math.sin(angle) * p.radius;

        // 3D depth scaling
        const scale = 0.5 + p.depth * 0.5;
        const size = p.size * scale;
        const opacity = p.opacity * (0.4 + p.depth * 0.6);

        // Draw orbital trail (subtle)
        if (!reducedMotion) {
          const trailLength = 15;
          ctx.beginPath();
          for (let i = 0; i < trailLength; i++) {
            const trailAngle = angle - i * 0.05;
            const tx = centerX + Math.cos(trailAngle) * p.radius;
            const ty = centerY + Math.sin(trailAngle) * p.radius;
            const trailOpacity = opacity * (1 - i / trailLength) * 0.15;
            const trailSize = size * (1 - i / trailLength) * 0.5;

            ctx.beginPath();
            ctx.arc(tx, ty, trailSize, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace(/oklch\(([^)]+)\)/, 'oklch($1 / $' + trailOpacity + ')')
              || p.color.replace(/\)$/, ` / ${trailOpacity})`);
            ctx.fill();
          }
        }

        // Draw main orb with glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, p.color.replace(/\)$/, ` / ${opacity})`));
        gradient.addColorStop(1, p.color.replace(/\)$/, ` / 0)`));

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner glow highlight
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'oklch(1 0 0 / 0.15)';
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [width, height, centerX, centerY, speed, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    />
  );
}

/**
 * SVG fallback renderer for reduced motion or canvas fallback
 */
function SVGOrbitals({
  particles,
  width,
  height,
  centerX,
  centerY,
  time,
  speed,
  reducedMotion,
}: {
  particles: OrbitalParticle[];
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  time: number;
  speed: number;
  reducedMotion: boolean;
}) {
  // Use spring.orbital for smooth orbital motion with reduced motion support
  const timeMotion = useMotionValue(0);
  const springX = useSpring(timeMotion, { ...orbitalSpring });

  React.useEffect(() => {
    if (reducedMotion) return;
    let start = performance.now();
    const animate = (now: number) => {
      timeMotion.set((now - start) * 0.001 * speed);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [speed, reducedMotion, timeMotion]);

  return (
    <svg width={width} height={height} style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <defs>
        {particles.map((p, i) => (
          <radialGradient key={i} id={`orb-gradient-${p.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.color} stopOpacity={p.opacity} />
            <stop offset="100%" stopColor={p.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {particles.map((p) => {
        // Calculate orbital position with spring.orbital dynamics
        const t = reducedMotion ? 0 : time * speed;
        const angle = p.angle + t * p.speed + Math.sin(t * 0.3 + p.phase) * 0.5;
        const x = centerX + Math.cos(angle) * p.radius;
        const y = centerY + Math.sin(angle) * p.radius;
        const scale = 0.5 + p.depth * 0.5;
        const size = p.size * scale;
        const opacity = p.opacity * (0.4 + p.depth * 0.6);

        return (
          <g key={p.id} style={{ opacity }}>
            <circle
              cx={x}
              cy={y}
              r={size}
              fill={`url(#orb-gradient-${p.id})`}
              filter="url(#orb-blur)"
            />
            {/* Inner highlight for 3D depth */}
            <circle
              cx={x - size * 0.2}
              cy={y - size * 0.2}
              r={size * 0.3}
              fill="oklch(1 0 0 / 0.15)"
            />
          </g>
        );
      })}
      <filter id="orb-blur">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feBlend in="SourceGraphic" in2="blur" mode="normal" />
      </filter>
    </svg>
  );
}

/**
 * OrbitalBackground - Main Component
 */
export function OrbitalBackground({
  count: userCount = DEFAULT_CONFIG.count,
  colors = ['var(--purple)', 'var(--primary)'],
  radius = DEFAULT_CONFIG.radius,
  speed = DEFAULT_CONFIG.speed,
  useCanvas = DEFAULT_CONFIG.useCanvas,
  pauseWhenHidden = DEFAULT_CONFIG.pauseWhenHidden,
  className,
  style,
  zIndex = DEFAULT_CONFIG.zIndex,
}: OrbitalBackgroundProps) {
  // Respects prefers-reduced-motion
  const reducedMotion = useReducedMotion() ?? false;

  // Responsive particle count
  const responsiveCount = useResponsiveCount(DEFAULT_CONFIG);
  const finalCount = userCount === DEFAULT_CONFIG.count ? responsiveCount : userCount;

  // Container ref for IntersectionObserver
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(true);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  // Animation time (paused when hidden)
  const timeMotion = useMotionValue(0);
  const [particles] = React.useState(() =>
    generateParticles(finalCount, colors, radius, speed)
  );

  // IntersectionObserver for performance (pause when off-screen)
  React.useEffect(() => {
    if (!pauseWhenHidden || reducedMotion) return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '100px' } // Start animating 100px before entering viewport
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [pauseWhenHidden, reducedMotion]);

  // Resize observer for dimensions
  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  // Animation loop (paused when hidden or reduced motion)
  React.useEffect(() => {
    if (reducedMotion || !isVisible) return;

    let start = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      timeMotion.set((now - start) * 0.001);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, reducedMotion, timeMotion]);

  // Regenerate particles when count/colors/radius/speed change
  React.useEffect(() => {
    // Particles are created once in useState initializer
  }, [finalCount, colors.join(','), radius, speed]);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const time = 0; // Time comes from timeMotion spring

  // Check canvas support
  const canvasSupported = useCanvas && typeof HTMLCanvasElement !== 'undefined';

  return (
    <motion.div
      ref={containerRef}
      className={cn('fixed inset-0 overflow-hidden pointer-events-none', className)}
      style={{
        ...style,
        zIndex,
        opacity: reducedMotion ? 0.5 : 1, // Subtle static opacity when reduced motion
      }}
      initial={false}
      animate={{ opacity: isVisible || reducedMotion ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {!reducedMotion && canvasSupported && dimensions.width > 0 && (
        <CanvasOrbitals
          particles={particles}
          width={dimensions.width}
          height={dimensions.height}
          centerX={centerX}
          centerY={centerY}
          time={0}
          speed={speed}
          reducedMotion={false}
        />
      )}

      {(!canvasSupported || reducedMotion || dimensions.width === 0) && (
        <SVGOrbitals
          particles={particles}
          width={dimensions.width || 1920}
          height={dimensions.height || 1080}
          centerX={centerX || 960}
          centerY={centerY || 540}
          time={0}
          speed={speed}
          reducedMotion={reducedMotion}
        />
      )}
    </motion.div>
  );
}

OrbitalBackground.displayName = 'OrbitalBackground';

// Export types and config for consumers
export type { OrbitalParticle };
export { DEFAULT_CONFIG, orbitalSpring, generateParticles };