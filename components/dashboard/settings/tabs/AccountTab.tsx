'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Globe,
  Download,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { clearAllClientCaches } from '@/lib/utils/clientCache';
import {
  SectionHeading,
  SettingRow,
  PCard,
  PCardHead,
  PCardBody,
  DangerCard,
  SaveActionFooter,
} from './shared';
import type { SettingsSectionId, UserAccountDto, UserPreferencesDto } from '../types';

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

function applyDocumentTheme(theme: UserPreferencesDto['theme']) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const resolved = prefersDark ? 'dark' : 'light';
    root.setAttribute('data-theme', resolved);
    root.classList.toggle('dark', prefersDark);
    return;
  }
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
}

export interface AccountTabProps {
  account: UserAccountDto;
  preferences: UserPreferencesDto;
  isImpersonated: boolean;
  dangerNotice?: boolean;
  onAccountUpdated: (next: UserAccountDto) => void;
  onPreferencesUpdated: (next: UserPreferencesDto) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onNavigateTab: (tab: SettingsSectionId) => void;
}

export function AccountTab({
  account,
  preferences,
  isImpersonated,
  dangerNotice = false,
  onAccountUpdated,
  onPreferencesUpdated,
  onDirtyChange,
  onNavigateTab,
}: AccountTabProps) {
  const router = useRouter();

  // Identity state
  const [fullName, setFullName] = useState(account.fullName);
  const [avatarUrl, setAvatarUrl] = useState(account.avatarUrl || '');
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

  // Regional & display state
  const [timezone, setTimezone] = useState(preferences.timezone);
  const [timeFormat, setTimeFormat] = useState<UserPreferencesDto['timeFormat']>(preferences.timeFormat);
  const [dateFormat, setDateFormat] = useState<UserPreferencesDto['dateFormat']>(preferences.dateFormat);
  const [currencyDisplay, setCurrencyDisplay] = useState<UserPreferencesDto['currencyDisplay']>(
    preferences.currencyDisplay
  );
  const [theme, setTheme] = useState<UserPreferencesDto['theme']>(preferences.theme);
  const [savingRegional, setSavingRegional] = useState(false);
  const [regionalError, setRegionalError] = useState<string | null>(null);

  // Portability & Delete state
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [needsOwnershipTransfer, setNeedsOwnershipTransfer] = useState(false);

  useEffect(() => {
    setFullName(account.fullName);
    setAvatarUrl(account.avatarUrl || '');
  }, [account.fullName, account.avatarUrl]);

  useEffect(() => {
    setTimezone(preferences.timezone);
    setTimeFormat(preferences.timeFormat);
    setDateFormat(preferences.dateFormat);
    setCurrencyDisplay(preferences.currencyDisplay);
    setTheme(preferences.theme);
  }, [preferences]);

  const identityDirty =
    fullName.trim() !== account.fullName.trim() ||
    avatarUrl.trim() !== (account.avatarUrl || '').trim();

  const regionalDirty =
    timezone !== preferences.timezone ||
    timeFormat !== preferences.timeFormat ||
    dateFormat !== preferences.dateFormat ||
    currencyDisplay !== preferences.currencyDisplay ||
    theme !== preferences.theme;

  useEffect(() => {
    onDirtyChange?.(identityDirty || regionalDirty);
  }, [identityDirty, regionalDirty, onDirtyChange]);

  const timezoneOptions = useMemo(() => {
    const list = [...COMMON_TIMEZONES];
    if (timezone && !list.includes(timezone)) {
      list.unshift(timezone);
    }
    return list;
  }, [timezone]);

  const handleSaveIdentity = async () => {
    setIdentityError(null);
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setIdentityError('Full name cannot be empty.');
      return;
    }

    setSavingIdentity(true);
    try {
      const res = await fetch('/api/user/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: trimmedName,
          avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update identity.');
      }
      const updatedUser: UserAccountDto = {
        ...account,
        fullName: data?.user?.fullName || trimmedName,
        avatarUrl: data?.user?.avatarUrl ?? (avatarUrl.trim() || null),
      };
      onAccountUpdated(updatedUser);
      toast.success('Account identity saved');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update identity.';
      setIdentityError(message);
      toast.error(message);
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleSaveRegional = async () => {
    setRegionalError(null);
    setSavingRegional(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          timezone,
          timeFormat,
          dateFormat,
          currencyDisplay,
          theme,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save regional preferences.');
      }
      const nextPrefs: UserPreferencesDto = data?.preferences || {
        ...preferences,
        timezone,
        timeFormat,
        dateFormat,
        currencyDisplay,
        theme,
      };
      onPreferencesUpdated(nextPrefs);
      applyDocumentTheme(nextPrefs.theme);
      toast.success('Timezone and display preferences saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save preferences.';
      setRegionalError(message);
      toast.error(message);
    } finally {
      setSavingRegional(false);
    }
  };

  const handleDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
        toast.info(`Detected timezone: ${detected}. Click Save to persist.`);
      }
    } catch {
      toast.error('Unable to detect browser timezone.');
    }
  };

  const handleDownloadExport = async () => {
    if (isImpersonated) return;
    setExporting(true);
    try {
      const res = await fetch('/api/user/export', { credentials: 'include' });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to prepare personal data export.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `unool-personal-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Personal data export downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim() !== 'DELETE') {
      setDeleteError('Type DELETE in uppercase to confirm permanent erasure.');
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    setNeedsOwnershipTransfer(false);

    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          setNeedsOwnershipTransfer(true);
        }
        throw new Error(data?.error || 'Failed to delete account.');
      }

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('unool_saved_accounts_v1');
        } catch {
          // Ignore storage error
        }
      }
      clearAllClientCaches();
      toast.success('Your account and associated data have been permanently deleted.');
      window.location.replace('/signin');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={User}
        title="Account & Preferences"
        subtitle="Manage your personal identity, timezone, regional formats, and GDPR/DPDP data controls."
      />

      {dangerNotice && (
        <div
          role="status"
          className="rounded-xl border border-[#C4A265] bg-[#F5EFE2] dark:bg-[#2D2419] px-4 py-3 text-[13px] text-[#5C4315] dark:text-[#EAD7B0]"
        >
          Account deletion and data export now live here under{' '}
          <strong>Data Portability &amp; Closure</strong>. Workspace transfer and removal remain under{' '}
          <button
            type="button"
            onClick={() => onNavigateTab('workspace')}
            className="underline font-semibold cursor-pointer text-[#A43D1E] dark:text-[#E07A5F]"
          >
            Workspace &amp; Team
          </button>
          .
        </div>
      )}

      {/* Identity Card */}
      <PCard>
        <PCardHead>Personal Identity</PCardHead>
        <PCardBody>
          <SettingRow
            label="Full Name"
            description="Shown across your dashboard, audit logs, and collaborator lists."
            htmlFor="account-full-name"
          >
            <Input
              id="account-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isImpersonated || savingIdentity}
              placeholder="Your name"
              className="w-full sm:w-64 h-11 sm:h-10 text-base sm:text-sm"
              maxLength={100}
            />
          </SettingRow>

          <SettingRow
            label="Login Email"
            description="Primary email address used for sign-in and critical alerts."
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-mono text-[#3D2B1F] dark:text-[#F5EFE6]">
                {account.email}
              </span>
              {account.emailConfirmedAt ? (
                <Badge className="bg-[#F5EFE2] text-[#5C4315] border-[#C4A265]/40 dark:bg-[#2D2419] dark:text-[#EAD7B0] gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[#236B42] dark:text-[#6EE7B7]" aria-hidden="true" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline">Pending Verification</Badge>
              )}
            </div>
          </SettingRow>

          <SettingRow
            label="Avatar Image URL"
            description="Optional HTTPS URL for your account avatar."
            htmlFor="account-avatar-url"
            last
          >
            <Input
              id="account-avatar-url"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              disabled={isImpersonated || savingIdentity}
              placeholder="https://example.com/avatar.png"
              className="w-full sm:w-64 h-11 sm:h-10 text-base sm:text-sm"
            />
          </SettingRow>

          <SaveActionFooter
            dirty={identityDirty}
            saving={savingIdentity}
            error={identityError}
            disabled={isImpersonated}
            saveLabel="Save identity"
            helperText={
              isImpersonated
                ? 'Identity edits are disabled during admin impersonation.'
                : 'Synced across Supabase Auth and your user profile.'
            }
            onSave={handleSaveIdentity}
            onReset={() => {
              setFullName(account.fullName);
              setAvatarUrl(account.avatarUrl || '');
              setIdentityError(null);
            }}
          />
        </PCardBody>
      </PCard>

      {/* Regional & Appearance Card */}
      <PCard>
        <PCardHead
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDetectTimezone}
              className="min-h-[44px] sm:min-h-[34px] text-xs gap-1.5 border-[#E4D9C8] dark:border-[#382F27] cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
              Use browser timezone
            </Button>
          }
        >
          <span className="inline-flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
            Timezone &amp; Display Formats
          </span>
        </PCardHead>
        <PCardBody>
          <SettingRow
            label="Timezone"
            description="Used when displaying scheduled publish times and reports."
            htmlFor="account-timezone"
          >
            <select
              id="account-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full sm:w-64 h-11 sm:h-10 rounded-md border border-[#E4D9C8] dark:border-[#382F27] bg-white dark:bg-[#1F1A16] px-3 text-base sm:text-sm text-[#3D2B1F] dark:text-[#F5EFE6]"
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </SettingRow>

          <SettingRow
            label="Time Format"
            description="Choose 12-hour AM/PM or 24-hour clock display."
          >
            <div className="flex gap-2" role="radiogroup" aria-label="Time format">
              {(['12h', '24h'] as const).map((fmt) => {
                const active = timeFormat === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTimeFormat(fmt)}
                    className={`min-h-[44px] sm:min-h-[36px] px-4 rounded-lg border text-[13px] font-medium cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#F5EFE6] dark:text-[#16120F]'
                        : 'bg-white dark:bg-[#1F1A16] text-[#3D2B1F] dark:text-[#F5EFE6] border-[#E4D9C8] dark:border-[#382F27] hover:bg-[#FAF7F2] dark:hover:bg-[#28211C]'
                    }`}
                  >
                    {fmt === '12h' ? '12-hour' : '24-hour'}
                  </button>
                );
              })}
            </div>
          </SettingRow>

          <SettingRow
            label="Date Format"
            description="Preferred date ordering across schedules and invoices."
            htmlFor="account-date-format"
          >
            <select
              id="account-date-format"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as UserPreferencesDto['dateFormat'])}
              className="w-full sm:w-64 h-11 sm:h-10 rounded-md border border-[#E4D9C8] dark:border-[#382F27] bg-white dark:bg-[#1F1A16] px-3 text-base sm:text-sm text-[#3D2B1F] dark:text-[#F5EFE6]"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </SettingRow>

          <SettingRow
            label="Pricing & Currency Display"
            description="Preferred currency display across plan cards."
          >
            <div className="flex gap-2" role="radiogroup" aria-label="Currency display">
              {(['INR', 'USD'] as const).map((curr) => {
                const active = currencyDisplay === curr;
                return (
                  <button
                    key={curr}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCurrencyDisplay(curr)}
                    className={`min-h-[44px] sm:min-h-[36px] px-4 rounded-lg border text-[13px] font-medium cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#F5EFE6] dark:text-[#16120F]'
                        : 'bg-white dark:bg-[#1F1A16] text-[#3D2B1F] dark:text-[#F5EFE6] border-[#E4D9C8] dark:border-[#382F27] hover:bg-[#FAF7F2] dark:hover:bg-[#28211C]'
                    }`}
                  >
                    {curr === 'INR' ? 'INR (₹)' : 'USD ($)'}
                  </button>
                );
              })}
            </div>
          </SettingRow>

          <SettingRow
            label="Dashboard Appearance"
            description="Select Warm Biscuit Light, Warm Espresso Dark, or match your OS."
            last
          >
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Dashboard theme">
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const active = theme === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(mode)}
                    className={`min-h-[44px] sm:min-h-[36px] px-3.5 rounded-lg border text-[13px] font-medium capitalize cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#F5EFE6] dark:text-[#16120F]'
                        : 'bg-white dark:bg-[#1F1A16] text-[#3D2B1F] dark:text-[#F5EFE6] border-[#E4D9C8] dark:border-[#382F27] hover:bg-[#FAF7F2] dark:hover:bg-[#28211C]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </SettingRow>

          <SaveActionFooter
            dirty={regionalDirty}
            saving={savingRegional}
            error={regionalError}
            saveLabel="Save preferences"
            helperText="Stored to your user preferences across sessions."
            onSave={handleSaveRegional}
            onReset={() => {
              setTimezone(preferences.timezone);
              setTimeFormat(preferences.timeFormat);
              setDateFormat(preferences.dateFormat);
              setCurrencyDisplay(preferences.currencyDisplay);
              setTheme(preferences.theme);
              setRegionalError(null);
            }}
          />
        </PCardBody>
      </PCard>

      {/* Data Portability & Account Closure */}
      <PCard>
        <PCardHead>Data Portability &amp; Personal Closure</PCardHead>
        <PCardBody className="space-y-4">
          <SettingRow
            label="Download Personal Data (.json)"
            description="Exports your account profile, workspaces owned, content records, and connected channel metadata (excluding OAuth secrets and password hashes)."
            last
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadExport}
              disabled={exporting || isImpersonated}
              className="min-h-[44px] sm:min-h-[38px] border-[#E4D9C8] dark:border-[#382F27] text-[#3D2B1F] dark:text-[#F5EFE6] gap-2 cursor-pointer"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Preparing export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download Personal Data
                </>
              )}
            </Button>
          </SettingRow>

          <DangerCard
            icon={AlertTriangle}
            title="Permanently Delete My Unool Account"
            badge={
              <Badge className="bg-[#9E2A2B] text-white border-0 text-[11px]">
                Irreversible
              </Badge>
            }
            description="Erases your personal account, solo workspaces, posts, uploaded media, and active sessions. Workspaces shared with other teammates must first be transferred or emptied."
            action={
              <Button
                type="button"
                variant="destructive"
                disabled={isImpersonated}
                onClick={() => {
                  setConfirmText('');
                  setDeleteError(null);
                  setNeedsOwnershipTransfer(false);
                  setDeleteDialogOpen(true);
                }}
                className="min-h-[44px] sm:min-h-[38px] bg-[#9E2A2B] hover:bg-[#7F1D1E] text-white font-semibold cursor-pointer"
              >
                Delete My Account
              </Button>
            }
          />
        </PCardBody>
      </PCard>

      {/* Radix Accessible Permanent Deletion Modal */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1F1A16] border-[#9E2A2B]/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#9E2A2B] dark:text-[#EF9A9A]">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Confirm Permanent Account Deletion
            </DialogTitle>
            <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
              This immediately deletes your user account, solo workspaces, posts, channel tokens,
              and media assets. There is no undo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            <div>
              <label
                htmlFor="confirm-account-delete-input"
                className="block text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6] mb-1.5"
              >
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </label>
              <Input
                id="confirm-account-delete-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                autoComplete="off"
                className="h-11 sm:h-10 text-base sm:text-sm font-mono border-[#E4D9C8] dark:border-[#382F27]"
              />
            </div>

            {deleteError && (
              <div
                role="alert"
                className="rounded-xl border border-[#9E2A2B]/40 bg-[#FFF8F6] dark:bg-[#2C1A19] px-3.5 py-3 text-[13px] text-[#9E2A2B] dark:text-[#EF9A9A] space-y-2"
              >
                <p>{deleteError}</p>
                {needsOwnershipTransfer && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      onNavigateTab('workspace');
                    }}
                    className="min-h-[38px] border-[#9E2A2B]/40 text-[#9E2A2B] dark:text-[#EF9A9A] cursor-pointer"
                  >
                    Go to Workspace &amp; Team -&gt;
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setDeleteDialogOpen(false)}
                className="min-h-[44px] sm:min-h-[38px] border-[#E4D9C8] dark:border-[#382F27]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting || confirmText.trim() !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="min-h-[44px] sm:min-h-[38px] bg-[#9E2A2B] hover:bg-[#7F1D1E] text-white font-semibold gap-2 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Deleting Account...
                  </>
                ) : (
                  'Permanently Delete Account'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

