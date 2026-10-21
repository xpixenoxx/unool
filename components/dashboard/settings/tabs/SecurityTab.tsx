'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { SectionHeading, SettingRow, PCard, PCardHead, PCardBody, SectionCard } from './shared';

interface SecurityTabProps {
  // Placeholder for future props
}

export function SecurityTab({}: SecurityTabProps) {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [togglingMfa, setTogglingMfa] = useState(false);

  const loadUserSecurity = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      setMfaEnabled(data.user?.user_metadata?.mfa_enabled === true);
    } catch {
      // ignore
    }
  };

  const handleToggleMfa = async (checked: boolean) => {
    setTogglingMfa(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ data: { mfa_enabled: checked } });
      if (error) throw error;
      setMfaEnabled(checked);
      toast.success(`MFA ${checked ? 'enabled' : 'disabled'} successfully.`);
    } catch {
      toast.error('Failed to update MFA settings');
    } finally {
      setTogglingMfa(false);
    }
  };

  useEffect(() => {
    loadUserSecurity();
  }, []);

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Shield}
        title="Security"
        subtitle="Protect your account with multi-factor authentication and session controls."
      />

      <PCard>
        <PCardHead>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Authentication
          </p>
        </PCardHead>
        <PCardBody>
          <SettingRow
            label="Multi-Factor Authentication"
            description="Require an email verification code at every sign-in for added security."
            last
          >
            <div className="flex items-center gap-2.5">
              {togglingMfa && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              <button
                role="switch"
                aria-checked={mfaEnabled}
                onClick={() => handleToggleMfa(!mfaEnabled)}
                disabled={togglingMfa}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none disabled:opacity-50 ${
                  mfaEnabled ? 'bg-[#C4A265]' : 'bg-zinc-200 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    mfaEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-muted-foreground">
                {mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </SettingRow>
        </PCardBody>
      </PCard>

      <PCard>
        <PCardHead>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active Sessions
          </p>
        </PCardHead>
        <PCardBody>
          <SectionCard
            icon={Lock}
            title="Session Management"
            description="Sessions are currently managed by Supabase Auth. Full per-device session management is coming in v1.1."
            action={<span />}
          />
        </PCardBody>
      </PCard>
    </div>
  );
}