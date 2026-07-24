'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { spring, hoverTap, hoverTapStrong, hoverLift } from './motion';
import { Flex } from './layout';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-primary',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-destructive',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-success text-success-foreground hover:bg-success/90 shadow-sm hover:shadow-success',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm',
        ai: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-sm hover:shadow-purple-500/50',
        publish: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm hover:shadow-emerald-500/50',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-lg px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  animate?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, animate = true, children, disabled, ...props }, ref) => {
    const isInteractive = variant !== 'link' && variant !== 'ghost';

    const motionProps = animate && isInteractive ? {
      whileHover: hoverTap.whileHover,
      whileTap: hoverTap.whileTap,
      transition: { duration: spring.snappy.damping ? undefined : 0.15 },
    } : {};

    // Omit framer-motion specific event handlers that conflict with React's
    const { onAnimationStart, onAnimationEnd, onAnimationIteration, ...nativeProps } = props;

    // Use type assertion to avoid framer-motion/React event handler type conflicts
    const motionButton = (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...motionProps as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...nativeProps as any}
      >
        {loading && (
          <motion.span
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />
        )}
        {children}
      </motion.button>
    );

    if (asChild) {
      return <Slot>{motionButton}</Slot>;
    }
    return motionButton;
  }
);
Button.displayName = 'Button';

/**
 * IconButton - Square icon button with motion
 */
export interface IconButtonProps extends Omit<ButtonProps, 'size' | 'children'> {
  'aria-label': string;
  size?: 'sm' | 'default' | 'lg';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, 'aria-label': ariaLabel, size = 'default', animate = true, ...props }, ref) => {
    const sizeMap = { sm: 'icon-sm', default: 'icon', lg: 'icon-lg' } as const;
    const motionProps = animate ? {
      whileHover: hoverTap.whileHover,
      whileTap: hoverTap.whileTap,
    } : {};

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant: 'ghost', size: sizeMap[size] }), className)}
        aria-label={ariaLabel}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...motionProps as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...props as any}
      />
    );
  }
);
IconButton.displayName = 'IconButton';

/**
 * ButtonGroup - Connected button group
 */
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  vertical?: boolean;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, vertical = false, children, ...props }, ref) => {
    const childArray = React.Children.toArray(children).filter(React.isValidElement);
    const childrenWithSeparation = childArray.map((child, index) => {
      const isFirst = index === 0;
      const isLast = index === childArray.length - 1;
      const childElement = child as React.ReactElement<React.HTMLAttributes<HTMLButtonElement> & { className?: string }>;
      return React.cloneElement(childElement, {
        className: cn(
          childElement.props.className,
          !vertical && !isFirst && '-ml-px rounded-l-none',
          vertical && !isFirst && '-mt-px rounded-t-none',
          !vertical && !isLast && 'rounded-r-none',
          vertical && !isLast && 'rounded-b-none',
        ),
      });
    });

    return (
      <div
        ref={ref}
        className={cn('inline-flex', vertical && 'flex-col', className)}
        role="group"
        {...props}
      >
        {childrenWithSeparation}
      </div>
    );
  }
);
ButtonGroup.displayName = 'ButtonGroup';

/**
 * LoadingButton - Button with built-in loading state
 */
export interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
  loadingText?: string;
  loadingIcon?: React.ReactNode;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, loading, loadingText = 'Loading...', loadingIcon, children, ...props }, ref) => {
    return (
      <Button ref={ref} loading={loading} className={className} {...props}>
        {loading ? (
          <Flex gap={2} alignItems="center">
            {loadingIcon || (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            <span>{loadingText}</span>
          </Flex>
        ) : (
          children
        )}
      </Button>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

export { Button, buttonVariants };