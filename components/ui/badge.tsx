'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80 border-transparent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent',
        outline: 'border-border bg-transparent text-foreground hover:bg-accent',
        success: 'bg-success text-success-foreground hover:bg-success/80 border-transparent',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/80 border-transparent',
        muted: 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent',
        ghost: 'bg-transparent border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        template: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-transparent shadow-sm hover:shadow-purple-500/30',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface BadgeProps
  extends HTMLMotionProps<'div'>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

function Badge({ className, variant, size, children, ...props }: BadgeProps) {
  return (
    <motion.div
      className={cn(badgeVariants({ variant, size }), className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

Badge.displayName = 'Badge';

export { Badge, badgeVariants };