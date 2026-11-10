'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeading, SettingRow, PCard, PCardHead, PCardBody } from './shared';

interface NotificationsTabProps {
  // Placeholder for future props
}

const STORAGE_KEY = 'unool_notification_prefs';

interface NotificationPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_PREFS: NotificationPref[] = [
  {
    id: 'post_published',
    label: 'Post Published',
    description: 'When your content goes live on any connected platform.',
    enabled: true,
  },
  {
    id: 'publish_failed',
    label: 'Publish Failed',
    description: 'When a scheduled or manual publish encounters an error.',
    enabled: true,
  },
  {
    id: 'weekly_digest',
    label: 'Weekly Performance Digest',
    description: 'A curated summary of your content performance every Monday.',
    enabled: false,
  },
  {
    id: 'ai_suggestions',
    label: 'AI Suggestions Ready',
    description: 'When Studio AI has new content ideas based on your strategy.',
    enabled: false,
  },
];

export function NotificationsTab({}: NotificationsTabProps) {
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        setPrefs(
          DEFAULT_PREFS.map((p) => ({
            ...p,
            enabled: typeof parsed[p.id] === 'boolean' ? parsed[p.id] : p.enabled,
          }))
        );
      }
    } catch {
      // ignore storage read errors
    }
  }, []);

  const handleToggle = (id: string) => {
    setPrefs((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      );
      try {
        const map: Record<string, boolean> = {};
        for (const item of next) map[item.id] = item.enabled;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      } catch {
        // ignore
      }
      const changed = next.find((item) => item.id === id);
      if (changed) {
        toast.success(`${changed.label} notifications ${changed.enabled ? 'enabled' : 'disabled'}`);
      }
      return next;
    });
  };

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
            Email & In-App Notifications
          </p>
        </PCardHead>
        <PCardBody>
          {prefs.map(({ id, label, description, enabled }, idx, arr) => (
            <SettingRow
              key={id}
              label={label}
              description={description}
              last={idx === arr.length - 1}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`Toggle ${label}`}
                  onClick={() => handleToggle(id)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none ${
                    enabled ? 'bg-[#C4A265]' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <span className="text-xs font-medium text-muted-foreground w-14">
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </SettingRow>
          ))}
        </PCardBody>
      </PCard>
    </div>
  );
}