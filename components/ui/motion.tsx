'use client';

import * as React from 'react';
import { motion, HTMLMotionProps, Variants, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design/tokens';

export { motion, AnimatePresence } from 'framer-motion';

const { motion: motionTokens } = designTokens;

// ============================================================
// SPRING PRESETS (from design tokens)
// ============================================================

const spring = {
  snappy: motionTokens.springs.snappy,
  standard: motionTokens.springs.standard,
  gentle: motionTokens.springs.gentle,
  bouncy: motionTokens.springs.bouncy,
  smooth: motionTokens.springs.smooth,
} as const;

const duration = {
  instant: motionTokens.durations.instant,
  fast: motionTokens.durations.fast,
  normal: motionTokens.durations.normal,
  slow: motionTokens.durations.slow,
  slower: motionTokens.durations.slower,
} as const;

const easing = {
  easeOut: motionTokens.easings.easeOut,
  easeIn: motionTokens.easings.easeIn,
  easeInOut: motionTokens.easings.easeInOut,
  brand: motionTokens.easings.brand,
} as const;

const stagger = {
  fast: motionTokens.stagger.fast,
  normal: motionTokens.stagger.normal,
  slow: motionTokens.stagger.slow,
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