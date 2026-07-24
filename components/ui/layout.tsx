'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// BOX - Universal layout primitive
// ============================================================

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  display?: 'block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'contents' | 'none';
  flexDirection?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  gap?: number | string;
  rowGap?: number | string;
  colGap?: number | string;
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  justifySelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  flex?: string | number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string | number;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridAutoFlow?: 'row' | 'col' | 'dense' | 'row-dense' | 'col-dense';
  gridColumn?: string;
  gridRow?: string;
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  inset?: number | string;
  zIndex?: number | string;
  overflow?: 'auto' | 'hidden' | 'visible' | 'scroll' | 'clip';
  overflowX?: 'auto' | 'hidden' | 'visible' | 'scroll' | 'clip';
  overflowY?: 'auto' | 'hidden' | 'visible' | 'scroll' | 'clip';
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  aspectRatio?: number | string;
  padding?: number | string;
  paddingX?: number | string;
  paddingY?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  margin?: number | string;
  marginX?: number | string;
  marginY?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRadius?: number | string;
  borderColor?: string;
  background?: string;
  backgroundColor?: string;
  opacity?: number;
  transform?: string;
  cursor?: string;
  pointerEvents?: 'auto' | 'none';
  userSelect?: 'auto' | 'none' | 'text' | 'contain' | 'all';
}

const stylePropMap: Record<string, string> = {
  flexDirection: 'flex-direction',
  alignItems: 'align-items',
  justifyContent: 'justify-content',
  flexWrap: 'flex-wrap',
  alignSelf: 'align-self',
  justifySelf: 'justify-self',
  flexGrow: 'flex-grow',
  flexShrink: 'flex-shrink',
  flexBasis: 'flex-basis',
  gridTemplateColumns: 'grid-template-columns',
  gridTemplateRows: 'grid-template-rows',
  gridColumn: 'grid-column',
  gridRow: 'grid-row',
  overflowX: 'overflow-x',
  overflowY: 'overflow-y',
  minWidth: 'min-width',
  minHeight: 'min-height',
  maxWidth: 'max-width',
  maxHeight: 'max-height',
  aspectRatio: 'aspect-ratio',
  paddingX: 'padding-inline',
  paddingY: 'padding-block',
  paddingTop: 'padding-top',
  paddingRight: 'padding-right',
  paddingBottom: 'padding-bottom',
  paddingLeft: 'padding-left',
  marginX: 'margin-inline',
  marginY: 'margin-block',
  marginTop: 'margin-top',
  marginRight: 'margin-right',
  marginBottom: 'margin-bottom',
  marginLeft: 'margin-left',
  borderTop: 'border-top',
  borderRight: 'border-right',
  borderBottom: 'border-bottom',
  borderLeft: 'border-left',
  borderRadius: 'border-radius',
  borderColor: 'border-color',
  backgroundColor: 'background-color',
  pointerEvents: 'pointer-events',
  userSelect: 'user-select',
};

const cssVarProps = [
  'gap', 'rowGap', 'colGap', 'flex', 'flexBasis',
  'padding', 'paddingX', 'paddingY', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'margin', 'marginX', 'marginY', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'top', 'right', 'bottom', 'left', 'inset',
  'borderRadius',
] as const;

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  (
    {
      as: Component = 'div',
      className,
      children,
      display,
      flexDirection,
      alignItems,
      justifyContent,
      flexWrap,
      gap,
      rowGap,
      colGap,
      alignSelf,
      justifySelf,
      flex,
      flexGrow,
      flexShrink,
      flexBasis,
      gridTemplateColumns,
      gridTemplateRows,
      gridColumn,
      gridRow,
      position,
      top,
      right,
      bottom,
      left,
      inset,
      zIndex,
      overflow,
      overflowX,
      overflowY,
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      aspectRatio,
      padding,
      paddingX,
      paddingY,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      margin,
      marginX,
      marginY,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      border,
      borderTop,
      borderRight,
      borderBottom,
      borderLeft,
      borderRadius,
      borderColor,
      background,
      backgroundColor,
      opacity,
      transform,
      cursor,
      pointerEvents,
      userSelect,
      style,
      ...rest
    },
    ref
  ) => {
    const styleObj = style as React.CSSProperties | undefined;
    const computedStyle: React.CSSProperties = { ...styleObj };

    // Map props to CSS
    const propMap: Record<string, React.CSSProperties[keyof React.CSSProperties] | string | number | undefined> = {
      display,
      flexDirection,
      alignItems,
      justifyContent,
      flexWrap,
      alignSelf,
      justifySelf,
      flex,
      flexGrow,
      flexShrink,
      flexBasis,
      gridTemplateColumns,
      gridTemplateRows,
      gridColumn,
      gridRow,
      position,
      top,
      right,
      bottom,
      left,
      inset,
      zIndex,
      overflow,
      overflowX,
      overflowY,
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      aspectRatio,
      padding,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      margin,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      border,
      borderTop,
      borderRight,
      borderBottom,
      borderLeft,
      borderRadius,
      borderColor,
      background,
      backgroundColor,
      opacity,
      transform,
      cursor,
      pointerEvents,
      userSelect,
    };

    // Direct CSS property mapping
    Object.entries(propMap).forEach(([key, value]) => {
      if (value !== undefined) {
        const cssKey = stylePropMap[key] || key.replace(/([A-Z])/g, '-$1').toLowerCase();
        (computedStyle as Record<string, React.CSSProperties[keyof React.CSSProperties]>)[cssKey] = value as React.CSSProperties[keyof React.CSSProperties];
      }
    });

    // CSS variable props (use var(--space-*) for spacing)
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && cssVarProps.includes(key as typeof cssVarProps[number])) {
        const cssKey = stylePropMap[key] || key.replace(/([A-Z])/g, '-$1').toLowerCase();
        if (typeof value === 'number') {
          (computedStyle as Record<string, React.CSSProperties[keyof React.CSSProperties]>)[cssKey] = `${value}px` as React.CSSProperties[keyof React.CSSProperties];
        } else if (typeof value === 'string' && /^\d+$/.test(value)) {
          (computedStyle as Record<string, React.CSSProperties[keyof React.CSSProperties]>)[cssKey] = `var(--space-${value})` as React.CSSProperties[keyof React.CSSProperties];
        } else {
          (computedStyle as Record<string, React.CSSProperties[keyof React.CSSProperties]>)[cssKey] = value as React.CSSProperties[keyof React.CSSProperties];
        }
      }
    });

    // Handle gap/rowGap/colGap
    if (gap !== undefined) {
      computedStyle.gap = typeof gap === 'number' ? `${gap}px` : gap;
    }
    if (rowGap !== undefined) {
      computedStyle.rowGap = typeof rowGap === 'number' ? `${rowGap}px` : rowGap;
    }
    if (colGap !== undefined) {
      computedStyle.columnGap = typeof colGap === 'number' ? `${colGap}px` : colGap;
    }

    // Handle paddingX/Y, marginX/Y
    if (paddingX !== undefined) {
      computedStyle.paddingInline = typeof paddingX === 'number' ? `${paddingX}px` : paddingX;
    }
    if (paddingY !== undefined) {
      computedStyle.paddingBlock = typeof paddingY === 'number' ? `${paddingY}px` : paddingY;
    }
    if (marginX !== undefined) {
      computedStyle.marginInline = typeof marginX === 'number' ? `${marginX}px` : marginX;
    }
    if (marginY !== undefined) {
      computedStyle.marginBlock = typeof marginY === 'number' ? `${marginY}px` : marginY;
    }

    return (
      <Component
        ref={ref}
        className={cn(className)}
        style={computedStyle}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);
Box.displayName = 'Box';

// ============================================================
// FLEX - Flex container with sensible defaults
// ============================================================

export interface FlexProps extends Omit<BoxProps, 'display'> {
  inline?: boolean;
  column?: boolean;
  wrap?: boolean;
  center?: boolean;
  centerX?: boolean;
  centerY?: boolean;
  between?: boolean;
  around?: boolean;
  stretch?: boolean;
  baseline?: boolean;
  start?: boolean;
  end?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      inline = false,
      column = false,
      wrap = false,
      center = false,
      centerX = false,
      centerY = false,
      between = false,
      around = false,
      stretch = false,
      baseline = false,
      start = false,
      end = false,
      align,
      gap,
      className,
      ...props
    },
    ref
  ) => {
    let alignItems: FlexProps['alignItems'] = 'stretch';
    let justifyContent: FlexProps['justifyContent'] = 'start';

    if (center) {
      alignItems = 'center';
      justifyContent = 'center';
    } else if (centerX) {
      justifyContent = 'center';
    } else if (centerY) {
      alignItems = 'center';
    } else if (between) {
      justifyContent = 'between';
    } else if (around) {
      justifyContent = 'around';
    } else if (start) {
      alignItems = 'start';
      justifyContent = 'start';
    } else if (end) {
      alignItems = 'end';
      justifyContent = 'end';
    } else if (stretch) {
      alignItems = 'stretch';
    } else if (baseline) {
      alignItems = 'baseline';
    } else if (align) {
      alignItems = align;
    }

    return (
      <Box
        ref={ref}
        display={inline ? 'inline-flex' : 'flex'}
        flexDirection={column ? 'col' : 'row'}
        flexWrap={wrap ? 'wrap' : 'nowrap'}
        alignItems={alignItems}
        justifyContent={justifyContent}
        gap={gap}
        className={className}
        {...props}
      />
    );
  }
);
Flex.displayName = 'Flex';

// ============================================================
// STACK - Vertical flex column with gap
// ============================================================

export interface StackProps extends Omit<FlexProps, 'flexDirection' | 'inline'> {
  space?: number | string;
  divider?: React.ReactNode;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ space = 4, divider, className, children, ...props }, ref) => {
    const childArray = React.Children.toArray(children);
    const childrenWithDividers = childArray.flatMap((child, index) => [
      child,
      index < childArray.length - 1 && divider
        ? React.cloneElement(divider as React.ReactElement, { key: `divider-${index}` })
        : null,
    ]).filter(Boolean);

    return (
      <Flex
        ref={ref}
        column
        gap={space}
        className={className}
        {...props}
      >
        {childrenWithDividers}
      </Flex>
    );
  }
);
Stack.displayName = 'Stack';

// ============================================================
// INLINE - Horizontal flex row with gap
// ============================================================

export interface InlineProps extends Omit<FlexProps, 'flexDirection' | 'column'> {
  space?: number | string;
}

export const Inline = React.forwardRef<HTMLDivElement, InlineProps>(
  ({ space = 3, className, ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        gap={space}
        className={className}
        {...props}
      />
    );
  }
);
Inline.displayName = 'Inline';

// ============================================================
// GRID - CSS Grid with responsive columns
// ============================================================

export interface GridProps extends Omit<BoxProps, 'display' | 'gridTemplateColumns'> {
  cols?: number | { base?: number; sm?: number; md?: number; lg?: number; xl?: number };
  rows?: number | string;
  gap?: number | string;
  flow?: 'row' | 'col' | 'dense' | 'row-dense' | 'col-dense';
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      cols = 1,
      rows,
      gap = 4,
      flow,
      className,
      ...props
    },
    ref
  ) => {
    let gridTemplateColumns: string;

    if (typeof cols === 'number') {
      gridTemplateColumns = `repeat(${cols}, 1fr)`;
    } else {
      const parts: string[] = [];
      if (cols.base) parts.push(`repeat(${cols.base}, 1fr)`);
      if (cols.sm) parts.push(`sm:repeat(${cols.sm}, 1fr)`);
      if (cols.md) parts.push(`md:repeat(${cols.md}, 1fr)`);
      if (cols.lg) parts.push(`lg:repeat(${cols.lg}, 1fr)`);
      if (cols.xl) parts.push(`xl:repeat(${cols.xl}, 1fr)`);
      gridTemplateColumns = parts.join(' ');
    }

    // Convert rows number to string for grid-template-rows
    const gridTemplateRows = typeof rows === 'number' ? `repeat(${rows}, 1fr)` : rows;

    return (
      <Box
        ref={ref}
        display="grid"
        gridTemplateColumns={gridTemplateColumns}
        gridTemplateRows={gridTemplateRows}
        gridAutoFlow={flow}
        gap={gap}
        className={className}
        {...props}
      />
    );
  }
);
Grid.displayName = 'Grid';

// ============================================================
// CONTAINER - Max-width centered container
// ============================================================

export interface ContainerProps extends BoxProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: number | string;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'lg', padding = 4, className, ...props }, ref) => {
    const maxWidthMap = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      full: '100%',
    };

    return (
      <Box
        ref={ref}
        display="block"
        width="100%"
        maxWidth={maxWidthMap[size]}
        marginX="auto"
        paddingX={padding}
        className={className}
        {...props}
      />
    );
  }
);
Container.displayName = 'Container';

// ============================================================
// SECTION - Page section with responsive padding
// ============================================================

export interface SectionProps extends BoxProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  narrow?: boolean;
}

export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ size = 'md', narrow = false, className, children, ...props }, ref) => {
    const paddingYMap = {
      sm: 'py-8 sm:py-12',
      md: 'py-12 sm:py-16 lg:py-20',
      lg: 'py-16 sm:py-20 lg:py-28 xl:py-32',
      xl: 'py-20 sm:py-28 lg:py-36 xl:py-48',
    };

    return (
      <Box
        ref={ref}
        width="100%"
        className={cn(
          paddingYMap[size],
          narrow && 'max-w-3xl mx-auto',
          className
        )}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
Section.displayName = 'Section';

// ============================================================
// SPACER - Vertical/horizontal spacer
// ============================================================

export interface SpacerProps extends BoxProps {
  space?: number | string;
  axis?: 'y' | 'x' | 'both';
}

export const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ space = 4, axis = 'y', className, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={cn(className)}
        style={{
          ...(axis !== 'x' && { minHeight: typeof space === 'number' ? `${space}px` : space }),
          ...(axis !== 'y' && { minWidth: typeof space === 'number' ? `${space}px` : space }),
        }}
        {...props}
      />
    );
  }
);
Spacer.displayName = 'Spacer';

// ============================================================
// DIVIDER - Visual separator
// ============================================================

export interface DividerProps extends BoxProps {
  orientation?: 'horizontal' | 'vertical';
  dashed?: boolean;
  label?: React.ReactNode;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = 'horizontal', dashed = false, label, className, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <Box
          ref={ref}
          width="1px"
          height="100%"
          backgroundColor="var(--border)"
          className={className}
          {...props}
        />
      );
    }

    if (label) {
      return (
        <Flex centerX gap={4} className={className} {...props}>
          <Box flex="1" height="1px" backgroundColor={dashed ? 'transparent' : 'var(--border)'} borderTop={dashed ? '1px dashed var(--border)' : undefined} />
          <span className="text-xs font-medium text-muted-foreground px-2">{label}</span>
          <Box flex="1" height="1px" backgroundColor={dashed ? 'transparent' : 'var(--border)'} borderTop={dashed ? '1px dashed var(--border)' : undefined} />
        </Flex>
      );
    }

    return (
      <Box
        ref={ref}
        height="1px"
        width="100%"
        backgroundColor={dashed ? 'transparent' : 'var(--border)'}
        borderTop={dashed ? '1px dashed var(--border)' : undefined}
        className={className}
        {...props}
      />
    );
  }
);
Divider.displayName = 'Divider';

// ============================================================
// TEXT - Typography components
// ============================================================

export interface TextProps extends BoxProps {
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ as: Component = 'p', size = 'base', weight = 'normal', color, align, className, children, ...props }, ref) => {
    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
    };
    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };
    return (
      <Box
        ref={ref}
        as={Component}
        className={cn(sizeClasses[size], weightClasses[weight], color && `text-${color}`, align && `text-${align}`, className)}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
Text.displayName = 'Text';

export interface DisplayProps extends Omit<TextProps, 'size' | 'weight' | 'color' | 'align'> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'bold' | 'extrabold';
}

export const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  ({ as: Component, size = 'xl', weight = 'bold', className, children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-2xl',
      md: 'text-3xl',
      lg: 'text-4xl',
      xl: 'text-5xl',
      '2xl': 'text-6xl',
      '3xl': 'text-7xl',
    };
    return (
      <Box
        ref={ref}
        as={Component || (size === 'sm' ? 'h4' : size === 'md' ? 'h3' : size === 'lg' ? 'h2' : 'h1')}
        className={cn(sizeClasses[size], weight === 'extrabold' ? 'font-extrabold' : 'font-bold', 'tracking-tight', className)}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
Display.displayName = 'Display';

export interface LeadProps extends TextProps {
  as?: 'p' | 'div';
}

export const Lead = React.forwardRef<HTMLParagraphElement, LeadProps>(
  ({ as: Component = 'p', className, children, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        as={Component}
        className={cn('text-lg text-muted-foreground leading-relaxed', className)}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
Lead.displayName = 'Lead';

// ============================================================
// VISUALLY HIDDEN - For accessibility
// ============================================================

export interface VisuallyHiddenProps extends BoxProps {
  focusable?: boolean;
}

export const VisuallyHidden = React.forwardRef<HTMLDivElement, VisuallyHiddenProps>(
  ({ focusable = false, className, children, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={cn(
          'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
          'clip-[rect(0,0,0,0)]',
          focusable && 'focus:static focus:w-auto focus:h-auto focus:p-4 focus:m-0 focus:overflow-visible focus:whitespace-normal focus:clip-auto',
          className
        )}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
VisuallyHidden.displayName = 'VisuallyHidden';