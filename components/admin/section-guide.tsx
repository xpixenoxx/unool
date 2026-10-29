'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionGuideProps {
  title: string;
  description: string;
  example?: string;
  className?: string;
}

/**
 * SectionGuide — renders a small ℹ️ icon that opens a tooltip/popover
 * explaining what a section does, with an optional example.
 */
export function SectionGuide({ title, description, example, className }: SectionGuideProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Guide: ${title}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 w-72 rounded-lg border bg-popover p-3 shadow-lg text-sm',
            'left-6 top-0',
            // flip left if too close to right edge
            'max-w-[calc(100vw-2rem)]'
          )}
        >
          <p className="font-semibold text-foreground mb-1">{title}</p>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
          {example && (
            <div className="mt-2 rounded-md bg-muted px-2.5 py-1.5">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Example</p>
              <p className="text-xs text-foreground font-mono whitespace-pre-wrap">{example}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 h-4 w-4 rounded text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label="Close guide"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
