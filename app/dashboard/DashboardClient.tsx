'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Transition } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, PenTool, CheckCircle, Link as LinkIcon, Plus, ExternalLink, TrendingUp, Users, Clock, Activity, BarChart2, Zap, Shield, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PlatformConnections } from '@/components/dashboard/PlatformConnections';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { Flex, Box, Stack, Text, Display, Divider } from '@/components/ui/layout';
import { MotionBox, spring, stagger } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Profile {
  subdomain: string | null;
  name: string | null;
  headline: string | null;
  status: 'published' | 'draft';
  updatedAt: string | null;
  links: Array<{ label: string; url: string; type: string }>;
  proofPoints: Array<{ type: string; value: string }>;
}

interface Post {
  id: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface UsageStats {
  postsThisMonth: number;
  postsLimit: number;
  profileViews: number;
  linkClicks: number;
}

interface DashboardData {
  profile: Profile | null;
  recentPosts: Post[];
  usageStats: UsageStats;
  planTier: 'free' | 'pro' | 'enterprise';
  userId: string;
  workspaceId: string;
}

const statusStyles: Record<Post['status'], { bg: string; text: string; border: string; icon: React.ElementType }> = {
  published: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  draft: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Clock },
  failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: Activity },
};

const darkStatusStyles: Record<Post['status'], { bg: string; text: string; border: string }> = {
  published: { bg: 'dark:bg-green-900/20', text: 'dark:text-green-400', border: 'dark:border-green-900' },
  draft: { bg: 'dark:bg-yellow-900/20', text: 'dark:text-yellow-400', border: 'dark:border-yellow-900' },
  scheduled: { bg: 'dark:bg-blue-900/20', text: 'dark:text-blue-400', border: 'dark:border-blue-900' },
  failed: { bg: 'dark:bg-red-900/20', text: 'dark:text-red-400', border: 'dark:border-red-900' },
};

export default function DashboardClient({ data }: { data: DashboardData }) {
  const reducedMotion = useReducedMotion();
  const springConfig: Transition = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.snappy;
  const { profile, recentPosts, usageStats, planTier } = data;

  return (
    <MotionBox className="space-y-8" variant="fade">
      {/* Header */}
      <Flex between wrap gap={4}>
        <Box>
          <Display size="xl" weight="bold">Dashboard</Display>
          <Text size="lg" color="muted">Manage your One Link and One Click workflows</Text>
        </Box>
        <Flex wrap gap={2}>
          <Button asChild variant="outline">
            <Link href="/dashboard/presence">
              <PenTool className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/publish">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </Flex>
      </Flex>

      {/* Stats Overview */}
      <ResponsiveMotionGrid cols={{ base: 1, sm: 2, lg: 4 }} gap={4} stagger={stagger.fast}>
        <StatCard
          title="One Link Status"
          icon={Globe}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        >
          <Flex between wrap gap={2} className="mb-2">
            <Badge
              variant={profile?.status === 'published' ? 'default' : 'secondary'}
              className="gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              {profile?.status === 'published' ? 'Live' : 'Draft'}
            </Badge>
            <Text size="sm" color="muted">
              {profile?.subdomain ? `${profile.subdomain}.unool.co` : 'Not claimed'}
            </Text>
          </Flex>
          <Text size="2xl" weight="bold">{profile?.name || 'Your Name'}</Text>
          <Text size="sm" color="muted">{profile?.headline || 'Add a headline'}</Text>
        </StatCard>

        <StatCard
          title="Posts This Month"
          icon={PenTool}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        >
          <Flex center gap={2} className="items-baseline">
            <Text size="3xl" weight="bold">{usageStats.postsThisMonth}</Text>
            <Text size="sm" color="muted">/ {usageStats.postsLimit} limit ({planTier})</Text>
          </Flex>
          <Box className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <Box
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${Math.min(100, (usageStats.postsThisMonth / usageStats.postsLimit) * 100)}%`,
              }}
            />
          </Box>
        </StatCard>

        <StatCard
          title="Profile Views"
          icon={TrendingUp}
          iconColor="text-green-500"
          iconBg="bg-green-500/10"
        >
          <Flex center gap={2} className="items-baseline">
            <Text size="3xl" weight="bold">{usageStats.profileViews.toLocaleString()}</Text>
            <Text size="sm" color="muted">This month</Text>
          </Flex>
        </StatCard>

        <StatCard
          title="Link Clicks"
          icon={ExternalLink}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
        >
          <Flex center gap={2} className="items-baseline">
            <Text size="3xl" weight="bold">{usageStats.linkClicks.toLocaleString()}</Text>
            <Text size="sm" color="muted">Total clicks</Text>
          </Flex>
        </StatCard>
      </ResponsiveMotionGrid>

      {/* Quick Actions */}
      <ResponsiveMotionGrid cols={{ base: 1, md: 2 }} gap={4} stagger={stagger.normal}>
        <ActionCard
          icon={Globe}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          title="Your Public Profile"
          description="Manage your one-link profile page with links, proof points, and design themes."
          primaryAction={{ label: 'View Profile', href: `/u/${profile?.subdomain || 'yourname'}`, external: true }}
          secondaryAction={{ label: 'Edit Profile', href: '/dashboard/presence' }}
          gradient="from-primary/5 to-primary/10 border-primary/20"
        />

        <ActionCard
          icon={PenTool}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          title="Write & Publish"
          description="Write once. AI adapts for LinkedIn, X, Threads. You review. One click publishes."
          primaryAction={{ label: 'Create New Post', href: '/dashboard/publish' }}
          secondaryAction={{ label: 'Edit Profile', href: '/dashboard/presence' }}
          gradient="from-blue-500/5 to-blue-500/10 border-blue-500/20"
        />
      </ResponsiveMotionGrid>

      {/* Onboarding Checklist */}
      {data.profile && (
        <MotionBox variant="slide-up" delay={0.15}>
          <OnboardingChecklist workspaceId={data.workspaceId} userId={data.userId} />
        </MotionBox>
      )}

      {/* Recent Posts */}
      <MotionBox variant="slide-up" delay={0.2}>
        <Card variant="elevated">
          <CardHeader>
            <Flex between wrap gap={4}>
              <CardTitle>
                <Flex center gap={2}>
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Posts
                </Flex>
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/publish">
                  <Plus className="mr-1 h-3 w-3" />
                  New Post
                </Link>
              </Button>
            </Flex>
          </CardHeader>
          <CardContent>
            <Stack space={2}>
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => {
                  const styles = statusStyles[post.status];
                  const darkStyles = darkStatusStyles[post.status];
                  const Icon = styles.icon;
                  return (
                    <motion.div
                      key={post.id}
                      className={cn('flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors', styles.bg, styles.text, styles.border, darkStyles.bg, darkStyles.text, darkStyles.border)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={springConfig}
                    >
                      <Flex center gap={3}>
                        <Icon className={cn('h-4 w-4', styles.text)} />
                        <Box className="flex-1 min-w-0">
                          <Text weight="medium" className="truncate">{post.content || 'Untitled post'}</Text>
                          <Text size="sm" color="muted">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </Text>
                        </Box>
                      </Flex>
                      <Badge variant={post.status === 'published' ? 'default' : post.status === 'failed' ? 'destructive' : 'secondary'}>
                        {post.status}
                      </Badge>
                    </motion.div>
                  );
                })
              ) : (
                <Box className="flex flex-col items-center gap-4 text-center py-8 text-muted-foreground">
                  <PenTool className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <Text>No posts yet. Create your first post to get started!</Text>
                  <Button asChild size="sm">
                    <Link href="/dashboard/publish">Create Post</Link>
                  </Button>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Platform Connections */}
      <MotionBox variant="slide-up" delay={0.25}>
        <PlatformConnections workspaceId={data.workspaceId} />
      </MotionBox>
    </MotionBox>
  );
}

// Helper components
function StatCard({ title, icon: Icon, iconColor, iconBg, children }: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="elevated" className={cn('relative', iconBg === 'bg-primary/10' && 'border-primary/20 bg-primary/5')}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Box className={cn('p-2 rounded-lg', iconBg, iconColor)}>
          <Icon className="h-4 w-4" />
        </Box>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ActionCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  primaryAction,
  secondaryAction,
  gradient,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  primaryAction: { label: string; href: string; external?: boolean };
  secondaryAction: { label: string; href: string };
  gradient: string;
}) {
  return (
    <Card className={cn(gradient)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className={cn('p-2 rounded-lg', iconBg, iconColor)}>
            <Icon className="h-5 w-5" />
          </Box>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Text size="sm" color="muted">{description}</Text>
        <Flex gap={2}>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={primaryAction.href} target={primaryAction.external ? '_blank' : undefined} rel={primaryAction.external ? 'noopener noreferrer' : undefined}>
              <ExternalLink className={cn('mr-2 h-4 w-4', primaryAction.external && 'block')} />
              {primaryAction.label}
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="w-full sm:w-auto">
            <Link href={secondaryAction.href}>
              <PenTool className="mr-2 h-4 w-4" />
              {secondaryAction.label}
            </Link>
          </Button>
        </Flex>
      </CardContent>
    </Card>
  );
}

// ResponsiveMotionGrid helper
function ResponsiveMotionGrid({ children, cols = { base: 1, sm: 2, lg: 3, xl: 4 }, gap = 4, stagger: staggerDelay = 0.06, ...props }: any) {
  const childArray = Array.isArray(children) ? children : [children];
  const reducedMotion = useReducedMotion();
  const springConfig = reducedMotion ? { type: 'tween', duration: 0.01 } : spring.snappy;

  return (
    <motion.div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols.lg || 3}, 1fr)`,
        gap: typeof gap === 'number' ? `${gap}px` : gap,
      }}
      variants={{}}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {childArray.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              key: index,
              variants: { initial: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: springConfig } },
            })
          : child
      )}
    </motion.div>
  );
}