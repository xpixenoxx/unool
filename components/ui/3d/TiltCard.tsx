"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, ReactNode } from "react";

export interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function TiltCard({
  children,
  maxTilt = 8,
  perspective = 1000,
  scale = 1.02,
  className = "",
  style,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const isHovered = useMotionValue(0);

  const rotateX = useTransform(y, [-maxTilt, maxTilt], [maxTilt, -maxTilt]);
  const rotateY = useTransform(x, [-maxTilt, maxTilt], [-maxTilt, maxTilt]);
  const scaleSpring = useSpring(isHovered, { stiffness: 300, damping: 30 });

  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mediaQuery.matches;

    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion.current) return;

    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      x.set(deltaX * maxTilt);
      y.set(deltaY * maxTilt);
    };

    const handleMouseEnter = () => {
      isHovered.set(1);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
      isHovered.set(0);
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [x, y, isHovered, maxTilt]);

  if (prefersReducedMotion.current) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        perspective,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      <motion.div
        style={{
          transformOrigin: "center center",
          transformStyle: "preserve-3d",
          rotateX,
          rotateY,
          scale: scaleSpring,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}