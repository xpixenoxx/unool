'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
 * Tooltip – lightweight, zero-dependency implementation.
 * Compatible with the Radix-style API used in BillingClient:
 *   <Tooltip>
 *     <TooltipTrigger asChild>…</TooltipTrigger>
 *     <TooltipContent side="top" align="center">…</TooltipContent>
 *   </Tooltip>
 * --------------------------------------------------------------------------- */

interface TooltipContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
});

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  const { setOpen } = React.useContext(TooltipContext);

  const handlers = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, handlers);
  }

  return (
    <span {...handlers} className="inline-flex">
      {children}
    </span>
  );
}

interface TooltipContentProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
  sideOffset?: number;
}

function TooltipContent({
  children,
  side = 'top',
  align = 'center',
  className,
}: TooltipContentProps) {
  const { open } = React.useContext(TooltipContext);

  if (!open) return null;

  const positionClasses: Record<string, string> = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const alignClasses: Record<string, string> = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  const isVertical = side === 'top' || side === 'bottom';

  return (
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-50 whitespace-nowrap rounded-md',
        'bg-popover text-popover-foreground shadow-md',
        'border border-border px-3 py-1.5 text-sm',
        'animate-in fade-in-0 zoom-in-95',
        positionClasses[side],
        isVertical && alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}

/** Optional provider wrapper (no-op here, kept for API compatibility) */
function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
