'use client';

import * as React from 'react';
import { motion, HTMLMotionProps, Variants, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { primitives } from '@/lib/design/tokens';

export { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// SPRING PRESETS (from design tokens - primitives.duration & primitives.easing)
// ============================================================

// Map duration tokens to Framer Motion spring configs
const spring = {
  snappy: { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 },  // cubic-bezier(0.34, 1.56, 0.64, 1)
  standard: { type: 'spring', stiffness: 400, damping: 35, mass: 1 },   // cubic-bezier(0.25, 0.46, 0.45, 0.94)
  gentle: { type: 'spring', stiffness: 300, damping: 40, mass: 1.2 },   // cubic-bezier(0.42, 0, 0.58, 1)
  bouncy: { type: 'spring', stiffness: 400, damping: 20, mass: 1 },     // cubic-bezier(0.68, -0.55, 0.27, 1.55)
  smooth: { type: 'spring', stiffness: 350, damping: 45, mass: 1.1 },
  magnetic: { type: 'spring', stiffness: 600, damping: 35, mass: 0.6 },
} as const;

const duration = {
  instant: 0,
  fast: 0.1,
  normal: 0.18,
  smooth: 0.25,
  slow: 0.35,
  slower: 0.5,
} as const;

const easing = {
  easeOut: [0.25, 0.46, 0.45, 0.94],
  easeIn: [0.42, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  brand: [0.25, 0.46, 0.45, 0.94],
} as const;

const stagger = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.15,
} as const;

// ============================================================
// COMMON VARIANTS
// ============================================================

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal, ease: easing.brand } },
};

const fadeOut: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0, transition: { duration: duration.fast, ease: easing.easeIn } },
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring.snappy },
};

const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: spring.snappy },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: spring.snappy },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: spring.snappy },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: spring.snappy },
};

const scaleOut: Variants = {
  visible: { opacity: 1, scale: 1 },
  hidden: { opacity: 0, scale: 0.95, transition: spring.standard },
};

// Stagger container
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.normal,
      delayChildren: 0.1,
    },
  },
};

const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.fast,
      delayChildren: 0.05,
    },
  },
};

const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.slow,
      delayChildren: 0.15,
    },
  },
};

// Item variants for stagger
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { ...spring.snappy } },
};

const staggerItemFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal, ease: easing.brand } },
};

const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { ...spring.bouncy } },
};

// ============================================================
// PAGE TRANSITION VARIANTS
// ============================================================

const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { ...spring.gentle } },
  exit: { opacity: 0, y: -20, transition: { ...spring.standard } },
};

const pageTransitionSlide: Variants = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: { ...spring.gentle } },
  exit: { opacity: 0, x: 40, transition: { ...spring.standard } },
};

// ============================================================
// MODAL/DIALOG VARIANTS
// ============================================================

const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.fast } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { ...spring.snappy } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { ...spring.standard } },
};

const drawerContent: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { ...spring.gentle } },
  exit: { x: '100%', transition: { ...spring.standard } },
};

const drawerContentLeft: Variants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: { ...spring.gentle } },
  exit: { x: '-100%', transition: { ...spring.standard } },
};

// ============================================================
// TOAST/NOTIFICATION VARIANTS
// ============================================================

const toastVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring.bouncy },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: spring.standard },
};

// ============================================================
// DROPDOWN/POPOVER VARIANTS
// ============================================================

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, y: -8, scale: 0.95, transition: spring.standard },
};

const popoverVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.95, y: 4, transition: spring.standard },
};

// ============================================================
// TAB VARIANTS
// ============================================================

const tabVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.fast, ease: easing.brand } },
  exit: { opacity: 0, y: -10, transition: { duration: duration.fast, ease: easing.easeIn } },
};

// ============================================================
// INTERACTION HOOKS
// ============================================================

/**
 * Hover/tap animations for interactive elements
 */
const hoverTap = {
  whileHover: { scale: 1.02, transition: { ...spring.snappy } },
  whileTap: { scale: 0.98, transition: { ...spring.snappy, duration: duration.instant } },
} as const;

const hoverTapStrong = {
  whileHover: { scale: 1.04, y: -2, transition: { ...spring.snappy } },
  whileTap: { scale: 0.96, transition: { ...spring.snappy, duration: duration.instant } },
} as const;

const hoverLift = {
  whileHover: { y: -4, boxShadow: 'var(--shadow-xl)', transition: { ...spring.snappy } },
  whileTap: { y: 0, boxShadow: 'var(--shadow-md)', transition: { ...spring.snappy, duration: duration.instant } },
} as const;

const hoverGlow = {
  whileHover: { boxShadow: 'var(--shadow-glow)', transition: { ...spring.snappy } },
  whileTap: { boxShadow: 'var(--shadow-md)', transition: { ...spring.snappy, duration: duration.instant } },
} as const;

// ============================================================
// MOTION COMPONENT WRAPPERS
// ============================================================

/**
 * MotionBox - Animated Box primitive
 */
export interface MotionBoxProps extends HTMLMotionProps<'div'> {
  variant?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
  animateOnMount?: boolean;
  delay?: number;
}

export const MotionBox = React.forwardRef<HTMLDivElement, MotionBoxProps>(
  ({ className, children, variant = 'fade', animateOnMount = true, delay = 0, ...props }, ref) => {
    const variants: Record<string, Variants> = {
      fade: fadeIn,
      'slide-up': slideUp,
      'slide-down': slideDown,
      'slide-left': slideLeft,
      'slide-right': slideRight,
      scale: scaleIn,
    };

    return (
      <motion.div
        ref={ref}
        className={cn(className)}
        variants={variants[variant]}
        initial={animateOnMount ? 'hidden' : 'visible'}
        animate="visible"
        exit="hidden"
        transition={{ delay }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionBox.displayName = 'MotionBox';

/**
 * MotionStack - Animated Stack with stagger
 */
export interface MotionStackProps extends HTMLMotionProps<'div'> {
  space?: number | string;
  stagger?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const MotionStack = React.forwardRef<HTMLDivElement, MotionStackProps>(
  ({ className, children, space = 4, stagger: staggerDelay = stagger.normal, direction = 'up', ...props }, ref) => {
    const childArray = Array.isArray(children) ? children : [children];
    const variants: Record<string, Variants> = {
      up: slideUp,
      down: slideDown,
      left: slideLeft,
      right: slideRight,
    };

    return (
      <motion.div
        ref={ref}
        className={cn('flex flex-col', className)}
        style={{ gap: typeof space === 'number' ? `${space}px` : space }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        {...props}
      >
        {childArray.map((child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<React.HTMLAttributes<HTMLElement> & { variants?: Variants; custom?: number }>, {
                key: index,
                variants: staggerItem,
                custom: index,
              })
            : child
        )}
      </motion.div>
    );
  }
);
MotionStack.displayName = 'MotionStack';

/**
 * MotionGrid - Animated Grid with stagger
 */
export interface MotionGridProps extends HTMLMotionProps<'div'> {
  cols?: number;
  gap?: number | string;
  stagger?: number;
}

export const MotionGrid = React.forwardRef<HTMLDivElement, MotionGridProps>(
  ({ className, children, cols = 3, gap = 6, stagger: staggerDelay = stagger.normal, ...props }, ref) => {
    const childArray = Array.isArray(children) ? children : [children];
    return (
      <motion.div
        ref={ref}
        className={cn('grid', className)}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: typeof gap === 'number' ? `${gap}px` : gap,
        }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        {...props}
      >
        {childArray.map((child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<React.HTMLAttributes<HTMLElement> & { variants?: Variants }>, {
                key: index,
                variants: staggerItem,
              })
            : child
        )}
      </motion.div>
    );
  }
);
MotionGrid.displayName = 'MotionGrid';

export {
  // Springs
  spring,
  duration,
  easing,
  stagger,
  // Variants
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  scaleOut,
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
  staggerItem,
  staggerItemFade,
  staggerItemScale,
  pageTransition,
  pageTransitionSlide,
  modalOverlay,
  modalContent,
  drawerContent,
  drawerContentLeft,
  toastVariants,
  dropdownVariants,
  popoverVariants,
  tabVariants,
  // Interactions
  hoverTap,
  hoverTapStrong,
  hoverLift,
  hoverGlow,
};
