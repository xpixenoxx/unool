'use client';

import { useState, useEffect } from 'react';

/* ============================================================
   REDUCED MOTION HOOK
   Respects user's prefers-reduced-motion setting
   ============================================================ */

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // Check initial value
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/* ============================================================
   REDUCED MOTION CONTEXT
   ============================================================ */

import { createContext, useContext, ReactNode } from 'react';

interface ReducedMotionContextType {
  prefersReducedMotion: boolean;
}

const ReducedMotionContext = createContext<ReducedMotionContextType>({
  prefersReducedMotion: false,
});

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <ReducedMotionContext.Provider value={{ prefersReducedMotion }}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotionContext(): boolean {
  const context = useContext(ReducedMotionContext);
  if (!context) {
    // Fallback to hook if not wrapped in provider
    return useReducedMotion();
  }
  return context.prefersReducedMotion;
}