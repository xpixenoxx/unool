'use client';

import { useReducedMotionContext } from './useReducedMotion';

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
}

/* ============================================================
   CLUB MOTION SPRINGS — Framer Motion Configurations
   ============================================================ */

export const clubSprings = {
  snappy: { stiffness: 550, damping: 32, mass: 0.7 },
  standard: { stiffness: 420, damping: 28, mass: 1 },
  gentle: { stiffness: 280, damping: 24, mass: 1.3 },
  bouncy: { stiffness: 480, damping: 18, mass: 1 },
  smooth: { stiffness: 350, damping: 30, mass: 1 },
  magnetic: { stiffness: 650, damping: 38, mass: 0.5 },
  orbital: { stiffness: 180, damping: 12, mass: 2.5 },
  liquid: { stiffness: 250, damping: 15, mass: 2 },
} as const satisfies Record<string, SpringConfig>;

export const clubDurations = {
  instant: 0.05,
  fast: 0.12,
  normal: 0.18,
  slow: 0.25,
  slower: 0.35,
  page: 0.5,
};

export const clubEasings = {
  easeOut: [0.25, 0.46, 0.45, 0.94] as const,
  easeIn: [0.55, 0.06, 0.68, 0.19] as const,
  easeInOut: [0.42, 0, 0.58, 1] as const,
  brand: [0.34, 1.56, 0.64, 1] as const,
  expo: [0.16, 1, 0.3, 1] as const,
  anticipation: [0.68, -0.55, 0.27, 1.55] as const,
};

export const clubStagger = {
  fast: 0.02,
  normal: 0.05,
  slow: 0.08,
  cascade: 0.06,
  section: 0.12,
};

export const clubSectionDelays = {
  hero: 0,
  manifesto: 0.15,
  proof: 0.25,
  works: 0.35,
  socials: 0.45,
  openTo: 0.55,
  activity: 0.65,
  contact: 0.75,
};

/* ============================================================
   MOTION HOOK
   Returns reduced-motion-aware variants
   ============================================================ */

export type MotionVariants = any;

export function useClubMotion() {
  const prefersReduced = useReducedMotionContext();

  const createVariants = (
    hidden: Record<string, unknown>,
    visible: Record<string, unknown>,
    springKey: keyof typeof clubSprings = 'standard'
  ): MotionVariants => {
    if (prefersReduced) {
      return {
        hidden: { opacity: 0, ...hidden },
        visible: { opacity: 1, transition: { duration: 0.01 }, ...visible },
      };
    }
    return {
      hidden,
      visible: {
        ...visible,
        transition: { type: 'spring', ...clubSprings[springKey] },
      },
    };
  };

  const fadeInUp = (springKey: keyof typeof clubSprings = 'gentle', delay = 0): MotionVariants =>
    createVariants(
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, transition: { delay } },
      springKey
    );

  const fadeIn = (springKey: keyof typeof clubSprings = 'standard', delay = 0): MotionVariants =>
    createVariants(
      { opacity: 0 },
      { opacity: 1, transition: { delay } },
      springKey
    );

  const scaleIn = (springKey: keyof typeof clubSprings = 'bouncy', delay = 0): MotionVariants =>
    createVariants(
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, transition: { delay } },
      springKey
    );

  const slideInRight = (springKey: keyof typeof clubSprings = 'standard', delay = 0): MotionVariants =>
    createVariants(
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, transition: { delay } },
      springKey
    );

  const slideInLeft = (springKey: keyof typeof clubSprings = 'standard', delay = 0): MotionVariants =>
    createVariants(
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, transition: { delay } },
      springKey
    );

  const staggerContainer = (staggerKey: keyof typeof clubStagger = 'normal', delayChildren = 0) => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: clubStagger[staggerKey],
        delayChildren,
      },
    },
  });

  return {
    prefersReduced,
    createVariants,
    fadeInUp,
    fadeIn,
    scaleIn,
    slideInRight,
    slideInLeft,
    staggerContainer,
    springs: clubSprings,
    durations: clubDurations,
    easings: clubEasings,
    stagger: clubStagger,
    sectionDelays: clubSectionDelays,
  };
}

/* ============================================================
   SCROLL REVEAL HOOK
   IntersectionObserver-based scroll reveals
   ============================================================ */

import { useEffect, useRef, useState, RefObject } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export function useScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {}
): [RefObject<any>, boolean] {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true, delay = 0 } = options;
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<T>(null);
  const prefersReduced = useReducedMotionContext();

  useEffect(() => {
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay * 1000);
          } else {
            setIsVisible(true);
          }
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, delay, prefersReduced]);

  return [elementRef, isVisible];
}

/* ============================================================
   PARALLAX HOOK
   For scroll-based parallax effects
   ============================================================ */

export function useParallax(speed: number = 0.5): number {
  const [offset, setOffset] = useState(0);
  const prefersReduced = useReducedMotionContext();

  useEffect(() => {
    if (prefersReduced) return;

    const handleScroll = () => {
      setOffset(window.scrollY * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, prefersReduced]);

  return offset;
}