'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Typography - Semantic text components
 * Maps to design tokens for consistent type scale
 */

export type TextProps<T extends React.ElementType = 'p'> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'foreground' | 'primary' | 'success' | 'destructive' | 'warning';
  align?: 'left' | 'center' | 'right' | 'justify';
  italic?: boolean;
  underline?: boolean;
  truncate?: boolean;
};

const Text = React.forwardRef<HTMLElement, TextProps<React.ElementType>>(
  ({ className, children, as: Component = 'p', size = 'base', weight = 'normal', color = 'default', align = 'left', italic = false, underline = false, truncate = false, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'text-balance',
          size === 'xs' && 'text-xs leading-[1.5]',
          size === 'sm' && 'text-sm leading-[1.5]',
          size === 'base' && 'text-base leading-[1.6]',
          size === 'lg' && 'text-lg leading-[1.6]',
          size === 'xl' && 'text-xl leading-[1.4]',
          size === '2xl' && 'text-2xl leading-[1.3]',
          size === '3xl' && 'text-3xl leading-[1.2]',
          size === '4xl' && 'text-4xl leading-[1.15]',
          size === '5xl' && 'text-5xl leading-[1.1]',
          weight === 'normal' && 'font-normal',
          weight === 'medium' && 'font-medium',
          weight === 'semibold' && 'font-semibold',
          weight === 'bold' && 'font-bold',
          color === 'default' && 'text-foreground',
          color === 'muted' && 'text-muted-foreground',
          color === 'foreground' && 'text-foreground',
          color === 'primary' && 'text-primary',
          color === 'success' && 'text-success',
          color === 'destructive' && 'text-destructive',
          color === 'warning' && 'text-warning',
          align === 'left' && 'text-left',
          align === 'center' && 'text-center',
          align === 'right' && 'text-right',
          align === 'justify' && 'text-justify',
          italic && 'italic',
          underline && 'underline underline-offset-4',
          truncate && 'truncate',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Text.displayName = 'Text';

/**
 * Heading - Semantic heading components
 */
export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: 'default' | 'muted' | 'foreground' | 'primary';
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, children, as, level = 1, color = 'default', ...props }, ref) => {
    const Component = as || (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
    return (
      <Component
        ref={ref}
        className={cn(
          'font-bold tracking-tight text-foreground text-balance',
          level === 1 && 'text-4xl sm:text-5xl lg:text-[var(--text-5xl)]',
          level === 2 && 'text-3xl sm:text-4xl lg:text-[var(--text-4xl)]',
          level === 3 && 'text-2xl sm:text-3xl lg:text-[var(--text-3xl)]',
          level === 4 && 'text-xl sm:text-2xl lg:text-[var(--text-2xl)]',
          level === 5 && 'text-lg sm:text-xl lg:text-[var(--text-xl)]',
          level === 6 && 'text-base sm:text-lg lg:text-[var(--text-lg)]',
          color === 'default' && 'text-foreground',
          color === 'muted' && 'text-muted-foreground',
          color === 'foreground' && 'text-foreground',
          color === 'primary' && 'text-primary',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Heading.displayName = 'Heading';

/**
 * Display - Large display text for hero sections
 */
export interface DisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'lg' | 'xl' | '2xl';
  weight?: 'bold' | 'medium' | 'normal';
  color?: 'default' | 'primary' | 'foreground';
  gradient?: boolean;
}

const Display = React.forwardRef<HTMLDivElement, DisplayProps>(
  ({ className, children, size = 'xl', weight = 'bold', color = 'default', gradient = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'font-display tracking-tight text-balance',
          size === 'lg' && 'text-4xl sm:text-5xl lg:text-[var(--text-4xl)]',
          size === 'xl' && 'text-5xl sm:text-[var(--text-5xl)] lg:text-[var(--text-5xl)]',
          size === '2xl' && 'text-[var(--text-5xl)] sm:text-[calc(var(--text-5xl)*1.2)]',
          weight === 'bold' && 'font-bold',
          weight === 'medium' && 'font-medium',
          weight === 'normal' && 'font-normal',
          gradient && 'bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary',
          color === 'default' && !gradient && 'text-foreground',
          color === 'primary' && !gradient && 'text-primary',
          color === 'foreground' && !gradient && 'text-foreground',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Display.displayName = 'Display';

/**
 * Lead - Introductory text, larger than body
 */
export interface LeadProps extends React.HTMLAttributes<HTMLParagraphElement> {
  color?: 'default' | 'muted' | 'primary';
}

const Lead = React.forwardRef<HTMLParagraphElement, LeadProps>(
  ({ className, children, color = 'muted', ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'text-lg sm:text-xl leading-relaxed font-normal text-balance',
          color === 'default' && 'text-foreground',
          color === 'muted' && 'text-muted-foreground',
          color === 'primary' && 'text-primary',
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);
Lead.displayName = 'Lead';

/**
 * Caption - Small supporting text
 */
export interface CaptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  color?: 'default' | 'muted' | 'primary' | 'destructive' | 'success' | 'warning';
  uppercase?: boolean;
}

const Caption = React.forwardRef<HTMLParagraphElement, CaptionProps>(
  ({ className, children, color = 'muted', uppercase = false, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'text-xs leading-normal',
          color === 'default' && 'text-foreground',
          color === 'muted' && 'text-muted-foreground/70',
          color === 'primary' && 'text-primary',
          color === 'destructive' && 'text-destructive',
          color === 'success' && 'text-success',
          color === 'warning' && 'text-warning',
          uppercase && 'uppercase tracking-wider font-medium',
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);
Caption.displayName = 'Caption';

/**
 * Overline - Category/section labels
 */
export interface OverlineProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: 'default' | 'muted' | 'primary';
}

const Overline = React.forwardRef<HTMLSpanElement, OverlineProps>(
  ({ className, children, color = 'muted', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'text-xs font-medium uppercase tracking-widest',
          color === 'default' && 'text-foreground',
          color === 'muted' && 'text-muted-foreground',
          color === 'primary' && 'text-primary',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Overline.displayName = 'Overline';

/**
 * Code - Inline code
 */
export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, children, inline = true, ...props }, ref) => {
    if (!inline) {
      return (
        <pre
          ref={ref as React.Ref<HTMLPreElement>}
          className={cn(
            'font-mono',
            'p-4 rounded-lg overflow-x-auto text-sm bg-muted',
            className
          )}
          {...props}
        >
          {children}
        </pre>
      );
    }
    return (
      <code
        ref={ref}
        className={cn(
          'font-mono',
          'bg-muted px-1.5 py-0.5 rounded text-sm',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }
);
Code.displayName = 'Code';

/**
 * Link - Styled link with consistent behavior
 */
export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'muted' | 'primary' | 'ghost';
  underline?: 'always' | 'hover' | 'none';
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({
    className,
    children,
    variant = 'default',
    underline = 'hover',
    icon,
    iconPosition = 'end',
    ...props
  }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 transition-colors duration-150',
          variant === 'default' && 'text-primary hover:text-primary/80',
          variant === 'muted' && 'text-muted-foreground hover:text-foreground',
          variant === 'primary' && 'text-primary font-medium hover:text-primary/80',
          variant === 'ghost' && 'text-muted-foreground hover:text-foreground',
          underline === 'always' && 'underline underline-offset-4',
          underline === 'hover' && 'underline-offset-4 hover:underline',
          underline === 'none' && 'no-underline',
          className
        )}
        {...props}
      >
        {iconPosition === 'start' && icon}
        {children}
        {iconPosition === 'end' && icon}
      </a>
    );
  }
);
Link.displayName = 'Link';

/**
 * List - Styled lists
 */
export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  ordered?: boolean;
  spaced?: boolean;
  icon?: React.ReactNode;
}

const List = React.forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(
  ({ className, children, ordered = false, spaced = true, icon, ...props }, ref) => {
    const clonedChildren = React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child as React.ReactElement<{ className?: string }>, {
            className: cn('flex items-start gap-2', spaced && 'py-1'),
          })
        : child
    );

    if (ordered) {
      return (
        <ol
          ref={ref as React.Ref<HTMLOListElement>}
          className={cn('space-y-1', 'list-decimal pl-6', className)}
          {...props}
        >
          {clonedChildren}
        </ol>
      );
    }
    return (
      <ul
        ref={ref as React.Ref<HTMLUListElement>}
        className={cn('space-y-1', 'list-disc pl-6', className)}
        {...props}
      >
        {clonedChildren}
      </ul>
    );
  }
);
List.displayName = 'List';

/**
 * ListItem - List item with optional icon
 */
export interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  icon?: React.ReactNode;
}

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, children, icon, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn('flex items-start gap-2', className)}
        {...props}
      >
        {icon && <span className="flex-shrink-0 mt-0.5 text-muted-foreground">{icon}</span>}
        {children}
      </li>
    );
  }
);
ListItem.displayName = 'ListItem';

/**
 * Blockquote - Styled blockquote
 */
export interface BlockquoteProps extends React.HTMLAttributes<HTMLQuoteElement> {
  cite?: string;
}

const Blockquote = React.forwardRef<HTMLQuoteElement, BlockquoteProps>(
  ({ className, children, cite, ...props }, ref) => {
    return (
      <blockquote
        ref={ref}
        className={cn(
          'relative pl-6 border-l-2 border-primary/50 italic text-muted-foreground my-4',
          className
        )}
        {...props}
      >
        <p className="text-base leading-relaxed">{children}</p>
        {cite && (
          <footer className="mt-2 text-sm text-muted-foreground/70 not-italic">
            <cite>— {cite}</cite>
          </footer>
        )}
      </blockquote>
    );
  }
);
Blockquote.displayName = 'Blockquote';

/**
 * Typography - Composite component for grouping text elements
 * Provides semantic grouping with consistent spacing
 */
export interface TypographyProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'article' | 'hero' | 'compact';
}

const Typography = React.forwardRef<HTMLDivElement, TypographyProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    const spacing = {
      default: 'space-y-3 sm:space-y-4',
      article: 'space-y-4 sm:space-y-6 prose prose-primary max-w-none',
      hero: 'space-y-4 sm:space-y-6 text-center max-w-3xl mx-auto',
      compact: 'space-y-1.5 sm:space-y-2',
    };

    return (
      <div
        ref={ref}
        className={cn(spacing[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Typography.displayName = 'Typography';

export {
  Text,
  Heading,
  Display,
  Lead,
  Caption,
  Overline,
  Code,
  Link,
  List,
  ListItem,
  Blockquote,
  Typography,
};