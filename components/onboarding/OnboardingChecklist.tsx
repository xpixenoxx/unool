'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, Star, Target, Sparkles, Zap, BookOpen, Rocket } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingStep } from '@/lib/onboarding/types';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  profile: Target,
  social: Sparkles,
  content: BookOpen,
  publish: Rocket,
  sync: Zap,
};

const categoryColors: Record<string, string> = {
  profile: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  social: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  content: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  publish: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  sync: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

interface OnboardingChecklistProps {
  workspaceId: string;
  userId: string;
}

export function OnboardingChecklist({ workspaceId, userId }: OnboardingChecklistProps) {
  const { checklist, loading, progress, nextStep, isComplete, completeStep } = useOnboarding({
    workspaceId,
    userId,
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['profile']));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-muted-foreground">Loading onboarding...</p>
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
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Onboarding Complete! 🎉</h3>
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
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
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
          <Progress value={progress} className="h-3" />
          {nextStep && (
            <p className="text-sm text-muted-foreground mt-2">
              Next up: <span className="font-medium">{nextStep.title}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map(category => {
          const steps = stepsByCategory[category];
          const Icon = categoryIcons[category] || Target;
          const completed = steps.filter(s => s.completedAt).length;
          const total = steps.length;
          const allRequiredComplete = steps.filter(s => s.required).every(s => s.completedAt);

          return (
            <Card key={category} className={`overflow-hidden ${allRequiredComplete ? 'border-green-200 dark:border-green-800' : ''}`}>
              <CardHeader
                className="p-4 cursor-pointer"
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
                  <Icon className={`h-5 w-5 ${categoryColors[category]}`} />
                  <div className="flex-1">
                    <CardTitle className="capitalize text-base">{category}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {completed}/{total} steps • {steps.reduce((sum, s) => sum + s.xp, 0)} XP
                    </p>
                  </div>
                  <Badge
                    variant={allRequiredComplete ? 'default' : 'outline'}
                    className={categoryColors[category].replace('bg-', '').replace('text-', '').replace('dark:bg-', '').replace('dark:text-', '')}
                  >
                    {completed}/{total}
                  </Badge>
                </div>
              </CardHeader>

              {expandedCategories.has(category) && (
                <CardContent className="p-0 pb-4">
                  <div className="px-4 space-y-3" role="list">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          step.completedAt ? 'bg-green-50 dark:bg-green-950/30' : 'hover:bg-accent'
                        }`}
                        role="listitem"
                      >
                        <div className="flex-shrink-0">
                          {step.completedAt ? (
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : step.required ? (
                            <div className="h-5 w-5 rounded border-2 border-primary/50 flex items-center justify-center">
                              {step.id === nextStep?.id && <span className="h-2 w-2 rounded-full bg-primary" />}
                            </div>
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${step.completedAt ? 'text-green-700 dark:text-green-400' : ''}`}>
                            {step.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{step.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            +{step.xp} XP
                          </Badge>
                          {step.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                          {!step.completedAt && (
                            <Button
                              size="sm"
                              variant={step.required ? 'default' : 'outline'}
                              onClick={() => completeStep(step.id)}
                              disabled={!!step.completedAt}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Next Action CTA */}
      {nextStep && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-primary">Recommended next step</p>
                <h4 className="font-semibold">{nextStep.title}</h4>
                <p className="text-sm text-muted-foreground">{nextStep.description}</p>
              </div>
              <Button onClick={() => completeStep(nextStep.id)} size="lg">
                Complete This Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}