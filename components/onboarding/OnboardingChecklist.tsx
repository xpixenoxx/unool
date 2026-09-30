'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Check, Star, Target, Sparkles, Zap, BookOpen, Rocket,
  ArrowRight, Lock, ChevronDown, ChevronUp, Trophy, Circle
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingStep } from '@/lib/onboarding/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/* ─── Category icons ───────────────────────────────────────── */

const categoryConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}> = {
  profile: { icon: Target, label: 'Profile Setup', color: 'text-blue-500' },
  social: { icon: Sparkles, label: 'Social Accounts', color: 'text-purple-500' },
  content: { icon: BookOpen, label: 'Content Creation', color: 'text-amber-500' },
  publish: { icon: Rocket, label: 'Publishing', color: 'text-emerald-500' },
  sync: { icon: Zap, label: 'Sync & Automate', color: 'text-cyan-500' },
};

/* ─── Step → action URL mapping ────────────────────────────── */

const stepActionUrls: Record<string, string> = {
  'claim-subdomain': '/dashboard/presence',
  'complete-profile': '/dashboard/presence',
  'connect-linkedin': '/dashboard',
  'connect-x': '/dashboard',
  'connect-threads': '/dashboard',
  'write-first-post': '/dashboard/composer',
  'publish-first-post': '/dashboard/composer',
  'view-sync': '/dashboard',
};

/* ─── Props ────────────────────────────────────────────────── */

interface OnboardingChecklistProps {
  workspaceId: string;
  userId: string;
}

/* ─── Main component ───────────────────────────────────────── */

export function OnboardingChecklist({ workspaceId, userId }: OnboardingChecklistProps) {
  const { checklist, loading, progress, nextStep, isComplete } = useOnboarding({
    workspaceId,
    userId,
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['profile'])
  );

  /* Loading */
  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-10 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading your setup progress…</p>
        </CardContent>
      </Card>
    );
  }

  /* Complete state */
  if (isComplete) {
    return (
      <Card className="border-emerald-200/80 dark:border-emerald-800/40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <CardContent className="relative p-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <Trophy className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            All Set! 🎉
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            You&apos;ve completed all setup steps. Your profile is live and you&apos;re ready to
            publish across platforms.
          </p>
          <Badge variant="secondary" className="mt-4 px-3 py-1.5 gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            {checklist?.earnedXp || 0} XP Earned
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (!checklist) return null;

  /* Group steps by category */
  const stepsByCategory = checklist.steps.reduce(
    (acc, step) => {
      if (!acc[step.category]) acc[step.category] = [];
      acc[step.category].push(step);
      return acc;
    },
    {} as Record<string, OnboardingStep[]>
  );

  const categories = Object.keys(stepsByCategory);
  const requiredDone = checklist.steps.filter((s) => s.required && s.completedAt).length;
  const requiredTotal = checklist.steps.filter((s) => s.required).length;

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* ─── Progress Header ─── */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Getting Started
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {requiredDone} of {requiredTotal} steps complete
              </p>
            </div>
            <Badge variant="secondary" className="px-2.5 py-1 gap-1.5 text-xs">
              <Star className="h-3 w-3 text-amber-500" />
              {checklist.earnedXp} XP
            </Badge>
          </div>

          <Progress value={progress} className="h-2 mb-3" />

          {nextStep && (
            <div className="flex items-center gap-2 text-sm">
              <ArrowRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Next:</span>
              <span className="font-medium text-foreground truncate">
                {nextStep.title}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Step Categories ─── */}
      <div className="space-y-2">
        {categories.map((category) => {
          const steps = stepsByCategory[category];
          const config = categoryConfig[category] || {
            icon: Target,
            label: category,
            color: 'text-muted-foreground',
          };
          const Icon = config.icon;
          const completed = steps.filter((s) => s.completedAt).length;
          const total = steps.length;
          const allDone = steps.every((s) => s.completedAt);
          const isExpanded = expandedCategories.has(category);

          return (
            <Card
              key={category}
              className={cn(
                'overflow-hidden border transition-colors',
                allDone
                  ? 'border-emerald-200/60 dark:border-emerald-800/30'
                  : 'border-border/60'
              )}
            >
              {/* Category header */}
              <button
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-accent/30 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-lg flex-shrink-0',
                    allDone
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-muted'
                  )}
                >
                  {allDone ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Icon className={cn('h-4 w-4', config.color)} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">
                    {config.label}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {completed}/{total} steps
                    {' · '}
                    {steps.reduce((sum, s) => sum + s.xp, 0)} XP
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant={allDone ? 'default' : 'outline'}
                    className={cn(
                      'text-xs',
                      allDone && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-0'
                    )}
                  >
                    {completed}/{total}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded steps */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-1.5" role="list">
                  {steps.map((step) => {
                    const actionUrl = stepActionUrls[step.id];
                    const isDone = !!step.completedAt;
                    const isNext = step.id === nextStep?.id;

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          isDone
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                            : isNext
                              ? 'bg-primary/5 border border-primary/15'
                              : 'bg-muted/30'
                        )}
                        role="listitem"
                      >
                        {/* Status circle */}
                        <div className="flex-shrink-0">
                          {isDone ? (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          ) : isNext ? (
                            <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/30" />
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isDone
                                ? 'text-emerald-700 dark:text-emerald-400 line-through'
                                : 'text-foreground'
                            )}
                          >
                            {step.title}
                            {step.required && !isDone && (
                              <span className="inline-flex ml-2 px-1.5 py-0 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                                Required
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {step.description}
                          </p>
                        </div>

                        {/* XP + action */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            +{step.xp} XP
                          </span>
                          {!isDone && actionUrl && (
                            <Button
                              size="sm"
                              variant={isNext ? 'default' : 'ghost'}
                              className="h-7 px-2.5 text-xs gap-1"
                              asChild
                            >
                              <Link href={actionUrl}>
                                Go
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                          {!isDone && !actionUrl && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── Next Step CTA ─── */}
      {nextStep && stepActionUrls[nextStep.id] && (
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-0.5">
                  Recommended Next
                </p>
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {nextStep.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {nextStep.description}
                </p>
              </div>
              <Button asChild size="sm" className="shrink-0 gap-1.5">
                <Link href={stepActionUrls[nextStep.id]}>
                  Do It Now
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
