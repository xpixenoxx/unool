'use client';

import { useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeading, SettingRow, PCard, PCardHead, PCardBody, SwitchControl } from './shared';
import type { UserPreferencesDto } from '../types';

export interface NotificationsTabProps {
  preferences: UserPreferencesDto;
  onPreferencesUpdated: (next: UserPreferencesDto) => void;
}

export function NotificationsTab({ preferences, onPreferencesUpdated }: NotificationsTabProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const persistPreference = async (
    key: string,
    patch: Partial<UserPreferencesDto>,
    successMessage: string
  ) => {
    setSaveError(null);
    setSavingKey(key);
    const previous = preferences;
    const optimistic: UserPreferencesDto = { ...preferences, ...patch };
    onPreferencesUpdated(optimistic);

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save notification preference.');
      }
      if (data?.preferences) {
        onPreferencesUpdated(data.preferences);
      }
      toast.success(successMessage);
    } catch (err) {
      onPreferencesUpdated(previous);
      const message = err instanceof Error ? err.message : 'Failed to save preference.';
      setSaveError(message);
      toast.error(message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Bell}
        title="Notifications"
        subtitle="Control database-backed email notifications for token expiry, security events, and publishing."
      />

      {saveError && (
        <div
          role="alert"
          className="rounded-xl border border-[#9E2A2B]/40 bg-[#FFF8F6] dark:bg-[#2C1A19] px-4 py-3 text-[13px] text-[#9E2A2B] dark:text-[#EF9A9A]"
        >
          {saveError}
        </div>
      )}

      <PCard>
        <PCardHead>
          <span className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
            Transactional &amp; Operational Email Alerts
          </span>
        </PCardHead>
        <PCardBody>
          <SettingRow
            label="OAuth Token Expiry Alerts"
            description="Email you when a connected channel's authorization expires or fails background refresh."
          >
            <SwitchControl
              label="Toggle OAuth Token Expiry Alerts"
              checked={preferences.notifyTokenExpiry}
              loading={savingKey === 'notifyTokenExpiry'}
              onToggle={(next) =>
                persistPreference(
                  'notifyTokenExpiry',
                  { notifyTokenExpiry: next },
                  `Token expiry alerts ${next ? 'enabled' : 'disabled'}`
                )
              }
            />
          </SettingRow>

          <SettingRow
            label="Account Security Alerts"
            description="Notifications for password updates, device revocations, and ownership changes."
          >
            <SwitchControl
              label="Toggle Account Security Alerts"
              checked={preferences.notifySecurityAlerts}
              loading={savingKey === 'notifySecurityAlerts'}
              onToggle={(next) =>
                persistPreference(
                  'notifySecurityAlerts',
                  { notifySecurityAlerts: next },
                  `Security alerts ${next ? 'enabled' : 'disabled'}`
                )
              }
            />
          </SettingRow>

          <SettingRow
            label="Publishing Failures & Job Alerts"
            description="Alert when a scheduled publish encounters an upstream platform error."
          >
            <SwitchControl
              label="Toggle Publishing Failures & Job Alerts"
              checked={preferences.notifyPublishing}
              loading={savingKey === 'notifyPublishing'}
              onToggle={(next) =>
                persistPreference(
                  'notifyPublishing',
                  { notifyPublishing: next },
                  `Publishing alerts ${next ? 'enabled' : 'disabled'}`
                )
              }
            />
          </SettingRow>

          <SettingRow
            label="Summary Digest Cadence"
            description="How often you want workspace summary emails delivered."
            last
          >
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Digest frequency">
              {(['daily', 'weekly', 'never'] as const).map((freq) => {
                const active = preferences.digestFrequency === freq;
                return (
                  <button
                    key={freq}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={savingKey === 'digestFrequency'}
                    onClick={() =>
                      persistPreference(
                        'digestFrequency',
                        { digestFrequency: freq },
                        `Digest preference set to ${freq}`
                      )
                    }
                    className={`min-h-[44px] sm:min-h-[36px] px-3.5 rounded-lg border text-[13px] font-medium capitalize cursor-pointer transition-colors ${active
                        ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#F5EFE6] dark:text-[#16120F]'
                        : 'bg-white dark:bg-[#1F1A16] text-[#3D2B1F] dark:text-[#F5EFE6] border-[#E4D9C8] dark:border-[#382F27] hover:bg-[#FAF7F2] dark:hover:bg-[#28211C]'
                      }`}
                  >
                    {freq}
                  </button>
                );
              })}
            </div>
          </SettingRow>
        </PCardBody>
      </PCard>
    </div>
  );
}
