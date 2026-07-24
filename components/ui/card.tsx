'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { Box, Flex, Text, Divider, Inline } from './layout';
import { Badge } from './badge';
import { Button } from './button';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { ArrowUp, ArrowDown, Check, Star, ExternalLink, Edit, Trash2, ArrowRight } from 'lucide-react';

// ============================================================
// CARD VARIANTS (25+ distinct styles)
// ============================================================

export type CardVariant =
  | 'default'           // Standard elevated card
  | 'outlined'          // Border only, no shadow
  | 'filled'            // Filled background, no border
  | 'glass'             // Glassmorphism with backdrop blur
  | 'gradient-border'   // Animated gradient border
  | 'elevated'          // Strong shadow, hover lift
  | 'interactive'       // Hover/tap feedback, cursor pointer
  | 'metric'            // KPI display: large number + label
  | 'stat'              // Compact stat row
  | 'profile'           // User/profile card
  | 'link'              // External link card
  | 'feature'           // Feature showcase
  | 'pricing'           // Pricing tier
  | 'testimonial'       // Quote + avatar
  | 'post'              // Social post preview
  | 'draft'             // Draft/editor card
  | 'analytics'         // Chart container
  | 'activity'          // Activity feed item
  | 'notification'      // Notification item
  | 'empty'             // Empty state illustration
  | 'loading'           // Skeleton loader
  | 'error'             // Error state
  | 'success'           // Success confirmation
  | 'warning'           // Warning banner
  | 'onboarding'        // Onboarding step
  | 'tilt'              // 3D tilt card
  | 'magnetic'          // Magnetic 3D card
  | 'orbital';          // Orbital background card

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  asChild?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hover?: boolean;
  pressable?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5 lg:p-6',
  lg: 'p-6 sm:p-8',
  xl: 'p-8 sm:p-10',
  '2xl': 'p-10 sm:p-12 lg:p-14',
};

const variantStyles: Record<CardVariant, string> = {
  default: 'rounded-xl border bg-card text-card-foreground shadow-sm',
  outlined: 'rounded-xl border border-border bg-transparent shadow-none',
  filled: 'rounded-xl border-none bg-muted',
  glass: 'rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg',
  'gradient-border': 'relative rounded-xl border-transparent bg-clip-padding bg-card text-card-foreground shadow-md',
  elevated: 'rounded-xl border-none bg-card text-card-foreground shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300',
  interactive: 'rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-lg hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200',
  metric: 'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
  stat: 'rounded-lg border border-border bg-muted/50 shadow-none',
  profile: 'rounded-2xl border border-border bg-card text-card-foreground shadow-md p-8',
  link: 'rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4 md:p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors',
  feature: 'rounded-2xl border border-border bg-card text-card-foreground shadow-md p-6 md:p-8',
  pricing: 'rounded-2xl border border-border bg-card text-card-foreground shadow-lg p-6 md:p-8',
  testimonial: 'rounded-xl border border-border bg-muted/50 text-card-foreground shadow-sm',
  post: 'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
  draft: 'rounded-lg border-dashed border-border bg-muted',
  analytics: 'rounded-xl border border-border bg-card text-card-foreground shadow-md',
  activity: 'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
  notification: 'rounded-lg border border-border bg-card text-card-foreground shadow-lg',
  empty: 'border-none bg-transparent shadow-none p-12 rounded-2xl',
  loading: 'rounded-lg border-none bg-muted animate-pulse',
  error: 'rounded-lg border-destructive/30 bg-destructive/10',
  success: 'rounded-lg border-success/30 bg-success/10',
  warning: 'rounded-lg border-warning/30 bg-warning/10',
  onboarding: 'rounded-2xl border border-border bg-card text-card-foreground shadow-xl p-8 md:p-10',
  tilt: 'relative rounded-xl bg-card text-card-foreground shadow-xl',
  magnetic: 'relative rounded-xl bg-card text-card-foreground shadow-xl',
  orbital: 'relative rounded-2xl bg-card text-card-foreground shadow-2xl overflow-hidden',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', asChild = false, padding = 'md', hover, pressable, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    const isGradientBorder = variant === 'gradient-border';

    return (
      <Comp
        ref={ref}
        className={cn(
          variantStyles[variant],
          paddingMap[padding],
          hover && variant !== 'interactive' && variant !== 'elevated' && 'hover:shadow-lg transition-shadow duration-200',
          pressable && 'active:scale-[0.98] transition-transform duration-100',
          className
        )}
        {...props}
      >
        {isGradientBorder && (
          <div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 -z-10 [mask:linear-gradient(#fff,#fff)] [mask-composite:exclude] [mask-composite:exclude]_paint-order:stroke_fill"
            style={{ WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}
            aria-hidden="true"
          />
        )}
        {children}
      </Comp>
    );
  }
);
Card.displayName = 'Card';

// ============================================================
// CARD COMPOUND COMPONENTS
// ============================================================

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Box ref={ref} className={cn('flex flex-col space-y-1.5', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Box ref={ref} className={cn('pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Box ref={ref} className={cn('flex items-center mt-4', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

// ============================================================
// SPECIALIZED CARD COMPONENTS
// ============================================================

/**
 * MetricCard - For KPI displays
 */
export interface MetricCardProps extends Omit<CardProps, 'variant'> {
  value: string | number;
  label: string;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ value, label, change, changeType = 'neutral', icon, trend, className, padding = 'lg', ...props }, ref) => {
    return (
      <Card ref={ref} variant="metric" padding={padding} className={className} {...props}>
        <CardContent className="space-y-2">
          <Flex between className="pt-1">
            <Text size="sm" weight="medium" color="muted">{label}</Text>
            {icon && <Box className="text-muted-foreground">{icon}</Box>}
          </Flex>
          <Flex alignItems="baseline" gap={2}>
            <Text size="3xl" weight="bold" color="foreground">{value}</Text>
            {change && (
              <Badge
                variant={changeType === 'increase' ? 'success' : changeType === 'decrease' ? 'destructive' : 'secondary'}
                className="text-xs gap-1"
              >
                {changeType === 'increase' && <ArrowUp className="h-3 w-3" />}
                {changeType === 'decrease' && <ArrowDown className="h-3 w-3" />}
                {change}
              </Badge>
            )}
          </Flex>
          {trend && <Box className="pt-1">{trend}</Box>}
        </CardContent>
      </Card>
    );
  }
);
MetricCard.displayName = 'MetricCard';

/**
 * StatCard - Compact stat display
 */
export interface StatCardProps extends Omit<CardProps, 'variant'> {
  value: string | number;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ value, label, prefix, suffix, icon, className, padding = 'md', ...props }, ref) => {
    return (
      <Card ref={ref} variant="stat" padding={padding} className={className} {...props}>
        <CardContent className="flex items-center justify-between">
          <Flex column gap={1}>
            {icon && <Box className="text-primary">{icon}</Box>}
            <Flex alignItems="baseline" gap={1}>
              {prefix && <Text size="xl" weight="bold" color="muted">{prefix}</Text>}
              <Text size="2xl" weight="bold" color="foreground">{value}</Text>
              {suffix && <Text size="xl" weight="bold" color="muted">{suffix}</Text>}
            </Flex>
            <Text size="sm" color="muted">{label}</Text>
          </Flex>
        </CardContent>
      </Card>
    );
  }
);
StatCard.displayName = 'StatCard';

/**
 * FeatureCard - Feature showcase
 */
export interface FeatureCardProps extends Omit<CardProps, 'variant'> {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: { label: string; href: string };
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, title, description, link, className, padding = 'lg', ...props }, ref) => {
    return (
      <Card ref={ref} variant="feature" padding={padding} className={className} {...props}>
        <CardContent className="space-y-4">
          <Box className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </Box>
          <Flex column gap={2}>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </Flex>
          {link && (
            <Button variant="ghost" size="sm" asChild>
              <a href={link.href}>{link.label} <ArrowRight className="ml-1 h-4 w-4" /></a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);
FeatureCard.displayName = 'FeatureCard';

/**
 * PricingCard - Pricing tier
 */
export interface PricingCardProps extends Omit<CardProps, 'variant'> {
  name: string;
  price: { monthly: number; yearly?: number };
  description?: string;
  features: string[];
  cta: { label: string; href: string; variant?: 'primary' | 'secondary' };
  highlight?: boolean;
  badge?: string;
}

export const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
  ({
    name,
    price,
    description,
    features,
    cta,
    highlight = false,
    badge,
    className,
    padding = 'lg',
    ...props
  }, ref) => {
    return (
      <Card
        ref={ref}
        variant={highlight ? 'pricing' : 'pricing'}
        padding={padding}
        className={cn(
          highlight && 'border-primary/50 shadow-primary/10 relative',
          highlight && 'before:absolute before:inset-0 before:rounded-2xl before:border-primary/20',
          className
        )}
        {...props}
      >
        {badge && (
          <Box className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="default" className="text-xs">{badge}</Badge>
          </Box>
        )}
        <CardContent className="space-y-6">
          <Flex column gap={2} alignItems="start">
            <Text size="sm" weight="medium" color="primary">{name}</Text>
            <Flex alignItems="baseline" gap={1}>
              <Text size="4xl" weight="bold" color="foreground">${price.monthly}</Text>
              <Text size="lg" color="muted">/month</Text>
            </Flex>
            {description && <Text size="sm" color="muted">{description}</Text>}
          </Flex>
          <Flex column gap={3}>
            {features.map((feature, i) => (
              <Flex key={i} gap={3} align="start">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <Text size="sm" color="foreground">{feature}</Text>
              </Flex>
            ))}
          </Flex>
          <Button
            variant={cta.variant === 'primary' ? 'default' : 'outline'}
            className="w-full"
            asChild
          >
            <a href={cta.href}>{cta.label}</a>
          </Button>
        </CardContent>
      </Card>
    );
  }
);
PricingCard.displayName = 'PricingCard';

/**
 * ProfileCard - User profile
 */
export interface ProfileCardProps extends Omit<CardProps, 'variant'> {
  name: string;
  role?: string;
  avatar?: string;
  bio?: string;
  stats?: { label: string; value: string }[];
  actions?: React.ReactNode;
}

export const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ name, role, avatar, bio, stats, actions, className, padding = 'xl', ...props }, ref) => {
    return (
      <Card ref={ref} variant="profile" padding={padding} className={className} {...props}>
        <CardContent className="space-y-6">
          <Flex column center gap={4}>
            {avatar && (
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <Flex column center gap={1} className="text-center">
              <CardTitle className="text-2xl">{name}</CardTitle>
              {role && <CardDescription className="text-lg">{role}</CardDescription>}
            </Flex>
          </Flex>
          {bio && <CardDescription className="text-center text-base">{bio}</CardDescription>}
          {stats && stats.length > 0 && (
            <Flex center gap={6} className="border-t border-border pt-6">
              {stats.map((stat, i) => (
                <Flex key={i} column center gap={1}>
                  <Text size="2xl" weight="bold" color="foreground">{stat.value}</Text>
                  <Text size="sm" color="muted">{stat.label}</Text>
                </Flex>
              ))}
            </Flex>
          )}
          {actions && <Flex center className="pt-2">{actions}</Flex>}
        </CardContent>
      </Card>
    );
  }
);
ProfileCard.displayName = 'ProfileCard';

/**
 * LinkCard - External link preview
 */
export interface LinkCardProps extends Omit<CardProps, 'variant'> {
  title: string;
  description?: string;
  url: string;
  favicon?: string;
  image?: string;
  onClick?: () => void;
}

export const LinkCard = React.forwardRef<HTMLDivElement, LinkCardProps>(
  ({ title, description, url, favicon, image, onClick, className, padding = 'md', ...props }, ref) => {
    const handleClick = (e: React.MouseEvent) => {
      if (onClick) {
        e.preventDefault();
        onClick();
      }
    };

    return (
      <Card ref={ref} variant="link" padding={padding} className={cn('cursor-pointer', className)} onClick={handleClick} {...props}>
        <CardContent className="flex items-start gap-4">
          {image && (
            <Box className="relative h-20 w-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
            </Box>
          )}
          <Flex column flex="1" gap={2} minWidth={0}>
            <Flex gap={2} align="center">
              {favicon && <img src={favicon} alt="" className="h-4 w-4 rounded" />}
              <Text size="lg" weight="semibold" color="foreground" className="truncate">{title}</Text>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </Flex>
            {description && <Text size="sm" color="muted" className="line-clamp-2">{description}</Text>}
            <Text size="xs" color="muted" className="font-mono truncate">{url}</Text>
          </Flex>
        </CardContent>
      </Card>
    );
  }
);
LinkCard.displayName = 'LinkCard';

/**
 * PostCard - Social post preview
 */
export interface PostCardProps extends Omit<CardProps, 'variant'> {
  content: string;
  platform?: 'linkedin' | 'x' | 'threads';
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  date: string;
  media?: string[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export const PostCard = React.forwardRef<HTMLDivElement, PostCardProps>(
  ({ content, platform, status, date, media, onEdit, onDelete, className, padding = 'md', ...props }, ref) => {
    const platformColors = {
      linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      x: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      threads: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };

    const statusStyles = {
      draft: 'bg-muted text-muted-foreground',
      scheduled: 'bg-primary/10 text-primary border-primary/20',
      published: 'bg-success/10 text-success border-success/20',
      failed: 'bg-destructive/10 text-destructive border-destructive/20',
    };

    return (
      <Card ref={ref} variant="post" padding={padding} className={className} {...props}>
        <CardContent className="space-y-4">
          <Flex between className="pt-1">
            <Badge variant="outline" className={platformColors[platform || 'linkedin']} size="sm">
              {platform?.toUpperCase() || 'POST'}
            </Badge>
            <Badge variant="outline" className={statusStyles[status]} size="sm">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </Flex>
          <Text size="base" color="foreground" className="line-clamp-3 whitespace-pre-wrap">{content}</Text>
          {media && media.length > 0 && (
            <Flex gap={2} className="overflow-x-auto pb-2">
              {media.slice(0, 4).map((src, i) => (
                <Box key={i} className="relative h-24 w-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  <img src={src} alt={`Media ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </Box>
              ))}
              {media.length > 4 && (
                <Box className="relative h-24 w-32 flex-shrink-0 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Text size="lg" weight="bold" color="muted">+{media.length - 4}</Text>
                </Box>
              )}
            </Flex>
          )}
          <Divider />
          <Flex between className="text-xs text-muted-foreground">
            <Text>{date}</Text>
            <Inline gap={2}>
              {onEdit && <Button variant="ghost" size="icon" onClick={onEdit}><Edit className="h-4 w-4" /></Button>}
              {onDelete && <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
            </Inline>
          </Flex>
        </CardContent>
      </Card>
    );
  }
);
PostCard.displayName = 'PostCard';

/**
 * TestimonialCard - Customer quote
 */
export interface TestimonialCardProps extends Omit<CardProps, 'variant'> {
  quote: string;
  author: { name: string; role?: string; avatar?: string; company?: string };
  rating?: number;
}

export const TestimonialCard = React.forwardRef<HTMLDivElement, TestimonialCardProps>(
  ({ quote, author, rating = 5, className, padding = 'lg', ...props }, ref) => {
    return (
      <Card ref={ref} variant="testimonial" padding={padding} className={className} {...props}>
        <CardContent className="space-y-4">
          <Flex gap={1}>
            {Array.from({ length: rating }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </Flex>
          <Text size="lg" color="foreground" className="italic leading-relaxed">&ldquo;{quote}&rdquo;</Text>
          <Divider />
          <Flex gap={3} align="center">
            {author.avatar && (
              <Avatar className="h-10 w-10">
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback>{author.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <Flex column>
              <Text size="sm" weight="semibold" color="foreground">{author.name}</Text>
              {author.role && <Text size="xs" color="muted">{author.role}</Text>}
              {author.company && <Text size="xs" color="muted">{author.company}</Text>}
            </Flex>
          </Flex>
        </CardContent>
      </Card>
    );
  }
);
TestimonialCard.displayName = 'TestimonialCard';

/**
 * AnalyticsCard - Chart container
 */
export interface AnalyticsCardProps extends Omit<CardProps, 'variant'> {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const AnalyticsCard = React.forwardRef<HTMLDivElement, AnalyticsCardProps>(
  ({ title, description, children, action, className, padding = 'lg', ...props }, ref) => {
    return (
      <Card ref={ref} variant="analytics" padding={padding} className={className} {...props}>
        <CardHeader>
          <Flex between>
            <Flex column gap={1}>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </Flex>
            {action}
          </Flex>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  }
);
AnalyticsCard.displayName = 'AnalyticsCard';

/**
 * ActivityCard - Activity feed item
 */
export interface ActivityCardProps extends Omit<CardProps, 'variant'> {
  icon: React.ReactNode;
  title: string;
  description?: string;
  time: string;
  metadata?: { label: string; value: string }[];
}

export const ActivityCard = React.forwardRef<HTMLDivElement, ActivityCardProps>(
  ({ icon, title, description, time, metadata, className, padding = 'md', ...props }, ref) => {
    return (
      <Card ref={ref} variant="activity" padding={padding} className={className} {...props}>
        <CardContent className="flex gap-4">
          <Box className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            {icon}
          </Box>
          <Flex column gap={1} flex="1" minWidth={0}>
            <Flex between gap={2}>
              <Text weight="medium" color="foreground" className="truncate">{title}</Text>
              <Text size="xs" color="muted" className="shrink-0">{time}</Text>
            </Flex>
            {description && <Text size="sm" color="muted" className="truncate">{description}</Text>}
            {metadata && metadata.length > 0 && (
              <Flex gap={4} marginTop={1}>
                {metadata.map((m, i) => (
                  <Flex key={i} gap={1}>
                    <Text size="xs" color="muted">{m.label}:</Text>
                    <Text size="xs" weight="medium" color="foreground">{m.value}</Text>
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        </CardContent>
      </Card>
    );
  }
);
ActivityCard.displayName = 'ActivityCard';

/**
 * NotificationCard - Notification item
 */
export interface NotificationCardProps extends Omit<CardProps, 'variant'> {
  title: string;
  description?: string;
  time: string;
  read?: boolean;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export const NotificationCard = React.forwardRef<HTMLDivElement, NotificationCardProps>(
  ({ title, description, time, read = false, action, icon, className, padding = 'md', ...props }, ref) => {
    return (
      <Card
        ref={ref}
        variant="notification"
        padding={padding}
        className={cn(read ? 'opacity-60' : 'bg-card', className)}
        {...props}
      >
        <CardContent className="flex gap-3">
          {icon && <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">{icon}</Box>}
          <Flex column gap={1} flex="1" minWidth={0}>
            <Flex between gap={2}>
              <Text weight={read ? 'medium' : 'semibold'} color="foreground" className="truncate">{title}</Text>
              <Text size="xs" color="muted" className="shrink-0">{time}</Text>
            </Flex>
            {description && <Text size="sm" color="muted" className="truncate">{description}</Text>}
            {action && (
              <Button variant="ghost" size="sm" onClick={action.onClick} className="mt-1">
                {action.label}
              </Button>
            )}
          </Flex>
        </CardContent>
      </Card>
    );
  }
);
NotificationCard.displayName = 'NotificationCard';

/**
 * OnboardingCard - Onboarding step
 */
export interface OnboardingCardProps extends Omit<CardProps, 'variant'> {
  step: number;
  total: number;
  title: string;
  description: string;
  illustration?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  skipAction?: { label: string; onClick: () => void };
}

export const OnboardingCard = React.forwardRef<HTMLDivElement, OnboardingCardProps>(
  ({
    step,
    total,
    title,
    description,
    illustration,
    primaryAction,
    secondaryAction,
    skipAction,
    className,
    padding = '2xl',
    ...props
  }, ref) => {
    return (
      <Card ref={ref} variant="onboarding" padding={padding} className={className} {...props}>
        <CardContent className="space-y-6">
          <Flex between>
            <Text size="sm" color="muted">Step {step} of {total}</Text>
            {skipAction && (
              <Button variant="ghost" size="sm" onClick={skipAction.onClick}>
                {skipAction.label}
              </Button>
            )}
          </Flex>
          {illustration && (
            <Box className="mx-auto h-48 w-48 flex items-center justify-center">
              {illustration}
            </Box>
          )}
          <Flex column center gap={2} className="text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-lg max-w-md">{description}</CardDescription>
          </Flex>
          <Flex center gap={3}>
            {primaryAction && (
              <Button size="lg" onClick={primaryAction.onClick}>{primaryAction.label}</Button>
            )}
            {secondaryAction && (
              <Button variant="outline" size="lg" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
            )}
          </Flex>
        </CardContent>
      </Card>
    );
  }
);
OnboardingCard.displayName = 'OnboardingCard';