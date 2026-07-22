'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Star, Target, Sparkles, Zap, BookOpen, Rocket, ArrowRight, Lock } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingStep } from '@/lib/onboarding/types';
import { useState } from 'react';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  profile: Target,
  social: Sparkles,
  content: BookOpen,
  publish: Rocket,
  sync: Zap,
};

// Map step IDs to their action URLs so users go DO the task instead of self-reporting
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

interface OnboardingChecklistProps {
  workspaceId: string;
  userId: string;
}

export function OnboardingChecklist({ workspaceId, userId }: OnboardingChecklistProps) {
  const { checklist, loading, progress, nextStep, isComplete } = useOnboarding({
    workspaceId,
    userId,
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['profile']));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-muted-foreground">Loading setup progress...</p>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Setup Complete! 🎉</h3>
          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
            You&apos;ve completed all required steps. Your profile is live and ready to publish.
          </p>
          <Badge variant="default" className="mt-4 px-3 py-1">
            <Star className="h-3 w-3 mr-1" /> {checklist?.earnedXp || 0} XP Earned
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (!checklist) return null;

  // Group steps by category
  const stepsByCategory = checklist.steps.reduce((acc, step) => {
    if (!acc[step.category]) acc[step.category] = [];
    acc[step.category].push(step);
    return acc;
  }, {} as Record<string, OnboardingStep[]>);

  const categories = Object.keys(stepsByCategory);

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Setup Progress</h3>
              <p className="text-sm text-muted-foreground">
                {checklist.steps.filter(s => s.required && s.completedAt).length} of{' '}
                {checklist.steps.filter(s => s.required).length} required steps complete
              </p>
            </div>
            <Badge variant="default" className="px-3 py-1 gap-1">
              <Star className="h-3 w-3" />
              {checklist.earnedXp} XP
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          {nextStep && (
            <p className="text-sm text-muted-foreground mt-2">
              Next up: <span className="font-medium text-foreground">{nextStep.title}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step Categories */}
      <div className="space-y-3">
        {categories.map(category => {
          const steps = stepsByCategory[category];
          const Icon = categoryIcons[category] || Target;
          const completed = steps.filter(s => s.completedAt).length;
          const total = steps.length;
          const allRequiredComplete = steps.filter(s => s.required).every(s => s.completedAt);

          return (
            <Card key={category} className={`overflow-hidden transition-colors ${allRequiredComplete ? 'border-green-200 dark:border-green-800' : ''}`}>
              <CardHeader
                className="p-4 cursor-pointer select-none"
                onClick={() => {
                  setExpandedCategories(prev => {
                    const next = new Set(prev);
                    if (next.has(category)) next.delete(category);
                    else next.add(category);
                    return next;
                  });
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${allRequiredComplete ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${allRequiredComplete ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="capitalize text-sm font-medium">{category}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {completed}/{total} steps • {steps.reduce((sum, s) => sum + s.xp, 0)} XP
                    </p>
                  </div>
                  <Badge variant={allRequiredComplete ? 'default' : 'outline'} className="text-xs">
                    {completed}/{total}
                  </Badge>
                </div>
              </CardHeader>

              {expandedCategories.has(category) && (
                <CardContent className="p-0 pb-4">
                  <div className="px-4 space-y-2" role="list">
                    {steps.map((step) => {
                      const actionUrl = stepActionUrls[step.id];
                      const isDone = !!step.completedAt;

                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isDone ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted/40'
                          }`}
                          role="listitem"
                        >
                          {/* Status icon */}
                          <div className="flex-shrink-0">
                            {isDone ? (
                              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                                {step.id === nextStep?.id && (
                                  <span className="h-2 w-2 rounded-full bg-primary" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${isDone ? 'text-green-700 dark:text-green-400 line-through' : ''}`}>
                              {step.title}
                              {step.required && !isDone && (
                                <Badge variant="secondary" className="ml-2 text-xs py-0">Required</Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                          </div>

                          {/* XP + Action */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              +{step.xp} XP
                            </Badge>
                            {!isDone && actionUrl && (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" asChild>
                                <Link href={actionUrl}>
                                  Go <ArrowRight className="h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                            {!isDone && !actionUrl && (
                              <div className="h-7 px-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <Lock className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Next Action CTA */}
      {nextStep && stepActionUrls[nextStep.id] && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs text-primary font-medium mb-0.5">Recommended next step</p>
                <h4 className="font-semibold text-sm">{nextStep.title}</h4>
                <p className="text-xs text-muted-foreground">{nextStep.description}</p>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link href={stepActionUrls[nextStep.id]}>
                  Do It Now <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}