'use client';

import { Bell, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SectionHeading, SettingRow, PCard, PCardHead, PCardBody } from './shared';

interface NotificationsTabProps {
  // Placeholder for future props
}

export function NotificationsTab({}: NotificationsTabProps) {
  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Bell}
        title="Notifications"
        subtitle="Control when and how Unool reaches you via email and in-app alerts."
      />

      <PCard>
        <PCardHead>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Email Notifications
          </p>
        </PCardHead>
        <PCardBody>
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Fine-grained notification controls are coming in v1.1. Currently, emails are sent
              for all critical events.
            </p>
          </div>

          {[
            {
              label: 'Post Published',
              description: 'When your content goes live on any connected platform.',
              enabled: true,
            },
            {
              label: 'Publish Failed',
              description: 'When a scheduled or manual publish encounters an error.',
              enabled: true,
            },
            {
              label: 'Weekly Performance Digest',
              description: 'A curated summary of your content performance every Monday.',
              enabled: false,
            },
            {
              label: 'AI Suggestions Ready',
              description: 'When Studio AI has new content ideas based on your strategy.',
              enabled: false,
            },
          ].map(({ label, description, enabled }, idx, arr) => (
            <SettingRow
              key={label}
              label={label}
              description={description}
              last={idx === arr.length - 1}
            >
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  enabled
                    ? 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20'
                    : 'border-zinc-200 text-zinc-500 bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:bg-zinc-800'
                }`}
              >
                {enabled ? 'On' : 'Coming soon'}
              </Badge>
            </SettingRow>
          ))}
        </PCardBody>
      </PCard>
    </div>
  );
}