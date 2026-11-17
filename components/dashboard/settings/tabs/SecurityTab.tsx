'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Shield,
  KeyRound,
  Smartphone,
  Monitor,
  History,
  LogOut,
  Loader2,
  Copy,
  Check,
  Trash2,
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
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { SectionHeading, SettingRow, PCard, PCardHead, PCardBody, SignOutCard } from './shared';

interface AuthSessionItem {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
  userAgent: string | null;
  ip: string | null;
  aal: string | null;
  current: boolean;
}

interface SecurityEventItem {
  id: string;
  eventType: string;
  actorUserId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface MfaFactorSummary {
  id: string;
  friendlyName?: string;
  factorType: string;
  status: string;
}

const SAVED_ACCOUNTS_STORAGE_KEY = 'unool_saved_accounts_v1';

function summarizeUserAgent(ua: string | null): string {
  if (!ua) return 'Current browser session';
  const browser = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('Chrome/')
      ? 'Chrome'
      : ua.includes('Firefox/')
        ? 'Firefox'
        : ua.includes('Safari/')
          ? 'Safari'
          : 'Browser';
  const os = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac OS')
      ? 'macOS'
      : ua.includes('iPhone') || ua.includes('iPad')
        ? 'iOS'
        : ua.includes('Android')
          ? 'Android'
          : ua.includes('Linux')
            ? 'Linux'
            : 'Device';
  return `${browser} on ${os}`;
}

function formatEventLabel(eventType: string): string {
  switch (eventType) {
    case 'password_changed':
      return 'Password changed';
    case 'sessions_revoked_others':
      return 'Signed out other active devices';
    case 'channel_disconnected':
      return 'Connected channel disconnected';
    case 'workspace_ownership_transferred':
      return 'Workspace ownership transferred';
    case 'account_deleted':
      return 'Account deletion executed';
    case 'data_exported':
      return 'Personal data JSON exported';
    default:
      return eventType.replace(/_/g, ' ');
  }
}

export interface SecurityTabProps {
  userEmail: string;
  initialMfaEnabled: boolean;
  isImpersonated: boolean;
  onMfaChanged: (enabled: boolean) => void;
  onSignOut: () => Promise<void>;
}

export function SecurityTab({
  userEmail,
  initialMfaEnabled,
  isImpersonated,
  onMfaChanged,
  onSignOut,
}: SecurityTabProps) {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotSet, setPasswordNotSet] = useState(false);

  // Supabase TOTP MFA state
  const [mfaEnabled, setMfaEnabled] = useState(initialMfaEnabled);
  const [factors, setFactors] = useState<MfaFactorSummary[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifyingTotp, setVerifyingTotp] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [disableTargetFactorId, setDisableTargetFactorId] = useState<string | null>(null);
  const [disablingMfa, setDisablingMfa] = useState(false);
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);

  // Sessions & Activity state
  const [sessions, setSessions] = useState<AuthSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [savedAccountCount, setSavedAccountCount] = useState(0);

  const onMfaChangedRef = useRef(onMfaChanged);
  onMfaChangedRef.current = onMfaChanged;
  const lastReportedMfaRef = useRef<boolean>(initialMfaEnabled);
  const hasLoadedFactorsRef = useRef(false);
  const hasLoadedSessionsRef = useRef(false);

  const loadMfaFactors = useCallback(async () => {
    if (!hasLoadedFactorsRef.current) {
      setLoadingFactors(true);
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        const verified = [...(data.totp || []), ...(data.phone || [])].filter(
          (f) => f.status === 'verified'
        );
        setFactors(
          verified.map((f) => ({
            id: f.id,
            friendlyName: f.friendly_name,
            factorType: f.factor_type,
            status: f.status,
          }))
        );
        const active = verified.length > 0;
        setMfaEnabled(active);
        if (active !== lastReportedMfaRef.current) {
          lastReportedMfaRef.current = active;
          onMfaChangedRef.current(active);
        }
      }
    } catch {
      // Fallback to SSR initial boolean
    } finally {
      hasLoadedFactorsRef.current = true;
      setLoadingFactors(false);
    }
  }, []);

  const loadSessionsAndEvents = useCallback(async () => {
    if (!hasLoadedSessionsRef.current) {
      setLoadingSessions(true);
      setLoadingEvents(true);
    }
    try {
      const [sessRes, evRes] = await Promise.all([
        fetch('/api/auth/sessions', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/auth/security-events', { credentials: 'include', cache: 'no-store' }),
      ]);
      if (sessRes.ok) {
        const sData = await sessRes.json().catch(() => null);
        if (Array.isArray(sData?.sessions)) {
          setSessions(sData.sessions);
        }
      }
      if (evRes.ok) {
        const eData = await evRes.json().catch(() => null);
        if (Array.isArray(eData?.events)) {
          setEvents(eData.events);
        }
      }
    } catch {
      // Non-fatal
    } finally {
      hasLoadedSessionsRef.current = true;
      setLoadingSessions(false);
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadMfaFactors();
    loadSessionsAndEvents();
    try {
      const raw = window.localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedAccountCount(parsed.length);
      }
    } catch {
      // Ignore storage error
    }
  }, [loadMfaFactors, loadSessionsAndEvents]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordNotSet(false);

    if (!currentPassword || !newPassword) {
      setPasswordError('Please enter your current and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.code === 'PASSWORD_NOT_SET') {
          setPasswordNotSet(true);
        }
        throw new Error(data?.error || 'Failed to update password.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated and other sessions revoked');
      loadSessionsAndEvents();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleStartMfaEnroll = async () => {
    if (isImpersonated) return;
    setMfaMessage(null);
    setEnrolling(true);
    setTotpCode('');
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Unool (${userEmail})`,
      });
      if (error || !data) {
        throw new Error(
          error?.message || 'Authenticator setup is unavailable on this auth configuration.'
        );
      }
      setEnrollFactorId(data.id);
      setQrCode(data.totp?.qr_code || null);
      setTotpSecret(data.totp?.secret || null);
      setEnrollDialogOpen(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to start two-factor authenticator setup.';
      setMfaMessage(msg);
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyMfaEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollFactorId || !totpCode.trim()) return;
    setVerifyingTotp(true);
    setMfaMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollFactorId,
        code: totpCode.replace(/\s+/g, ''),
      });
      if (error) {
        throw new Error(error.message || 'Verification code did not match.');
      }
      setEnrollDialogOpen(false);
      setEnrollFactorId(null);
      setQrCode(null);
      setTotpSecret(null);
      setTotpCode('');
      await loadMfaFactors();
      toast.success('Two-factor authentication is now active');
    } catch (err) {
      setMfaMessage(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setVerifyingTotp(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!disableTargetFactorId || isImpersonated) return;
    setDisablingMfa(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: disableTargetFactorId,
      });
      if (error) {
        throw new Error(error.message || 'Failed to remove authenticator factor.');
      }
      setDisableTargetFactorId(null);
      await loadMfaFactors();
      toast.success('Two-factor authenticator removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove 2FA.');
    } finally {
      setDisablingMfa(false);
    }
  };

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      const res = await fetch('/api/auth/sessions/revoke-others', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to sign out other devices.');
      }
      toast.success('Signed out of all other active devices');
      loadSessionsAndEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke other sessions.');
    } finally {
      setRevokingOthers(false);
    }
  };

  const handleClearSavedAccounts = () => {
    try {
      window.localStorage.removeItem(SAVED_ACCOUNTS_STORAGE_KEY);
      setSavedAccountCount(0);
      toast.success('Cleared saved quick-switch accounts on this browser');
    } catch {
      toast.error('Could not clear local browser storage.');
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Shield}
        title="Security & Access"
        subtitle="Manage your password cadence, authenticator app 2FA, active sessions, and security log."
      />

      {/* Change Password Card */}
      <PCard>
        <PCardHead>
          <span className="inline-flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
            Password &amp; Credential Hygiene
          </span>
        </PCardHead>
        <PCardBody>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="sec-current-password"
                  className="block text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6] mb-1.5"
                >
                  Current password
                </label>
                <Input
                  id="sec-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isImpersonated || savingPassword}
                  autoComplete="current-password"
                  className="h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="sec-new-password"
                  className="block text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6] mb-1.5"
                >
                  New password
                </label>
                <Input
                  id="sec-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isImpersonated || savingPassword}
                  autoComplete="new-password"
                  placeholder="Min 8 chars, mixed case + symbol"
                  className="h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="sec-confirm-password"
                  className="block text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6] mb-1.5"
                >
                  Confirm new password
                </label>
                <Input
                  id="sec-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isImpersonated || savingPassword}
                  autoComplete="new-password"
                  className="h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
            </div>

            {passwordError && (
              <div
                role="alert"
                className="rounded-xl border border-[#9E2A2B]/40 bg-[#FFF8F6] dark:bg-[#2C1A19] px-3.5 py-2.5 text-[13px] text-[#9E2A2B] dark:text-[#EF9A9A]"
              >
                <p>{passwordError}</p>
                {passwordNotSet && (
                  <Link
                    href="/forgot-password"
                    className="inline-block mt-1 font-semibold underline text-[#A43D1E] dark:text-[#E07A5F]"
                  >
                    Set a password via Reset Password -&gt;
                  </Link>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <p className="text-[13px] text-[#6E5A48] dark:text-[#B8A896]">
                Updating your password immediately revokes other browser sessions and saved quick-switch tokens.
              </p>
              <Button
                type="submit"
                disabled={isImpersonated || savingPassword || !currentPassword || !newPassword}
                className="min-h-[44px] sm:min-h-[38px] bg-[#3D2B1F] hover:bg-[#261B13] text-white dark:bg-[#F5EFE6] dark:text-[#16120F] font-semibold cursor-pointer gap-2 shrink-0"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        </PCardBody>
      </PCard>

      {/* Two-Factor Authentication Card */}
      <PCard>
        <PCardHead>
          <span className="inline-flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
            Two-Factor Authentication (Authenticator App)
          </span>
        </PCardHead>
        <PCardBody>
          <SettingRow
            label="Authenticator App (TOTP)"
            description={
              mfaEnabled
                ? 'A verified authenticator factor is protecting sign-ins and account switching.'
                : 'Require a time-based 6-digit code from 1Password, Google Authenticator, or Authy.'
            }
            last={factors.length === 0}
          >
            <div className="flex items-center gap-2">
              {loadingFactors ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#6E5A48]" aria-hidden="true" />
              ) : mfaEnabled ? (
                <Badge className="bg-[#F5EFE2] text-[#5C4315] border-[#C4A265]/40 dark:bg-[#2D2419] dark:text-[#EAD7B0]">
                  2FA Active
                </Badge>
              ) : (
                <Button
                  type="button"
                  disabled={isImpersonated || enrolling}
                  onClick={handleStartMfaEnroll}
                  className="min-h-[44px] sm:min-h-[38px] bg-[#3D2B1F] hover:bg-[#261B13] text-white dark:bg-[#F5EFE6] dark:text-[#16120F] font-semibold cursor-pointer gap-2"
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Preparing QR...
                    </>
                  ) : (
                    'Enable 2FA'
                  )}
                </Button>
              )}
            </div>
          </SettingRow>

          {factors.map((factor, idx) => (
            <SettingRow
              key={factor.id}
              label={factor.friendlyName || 'Authenticator App'}
              description={`Factor type: ${factor.factorType.toUpperCase()} · Status: ${factor.status}`}
              last={idx === factors.length - 1}
            >
              <Button
                type="button"
                variant="outline"
                disabled={isImpersonated}
                onClick={() => setDisableTargetFactorId(factor.id)}
                className="min-h-[44px] sm:min-h-[36px] border-[#9E2A2B]/40 text-[#9E2A2B] hover:bg-[#FFF8F6] dark:text-[#EF9A9A] cursor-pointer"
              >
                Remove Factor
              </Button>
            </SettingRow>
          ))}

          {mfaMessage && !enrollDialogOpen && (
            <p className="mt-3 text-[13px] text-[#9E2A2B] dark:text-[#EF9A9A]">{mfaMessage}</p>
          )}
        </PCardBody>
      </PCard>

      {/* Active Sessions & Devices Card */}
      <PCard>
        <PCardHead
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={revokingOthers || isImpersonated}
              onClick={handleRevokeOthers}
              className="min-h-[44px] sm:min-h-[36px] border-[#E4D9C8] dark:border-[#382F27] text-[#3D2B1F] dark:text-[#F5EFE6] cursor-pointer gap-1.5"
            >
              {revokingOthers ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Sign out other devices
            </Button>
          }
        >
          <span className="inline-flex items-center gap-2">
            <Monitor className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
            Active Sessions &amp; Browser Vault
          </span>
        </PCardHead>
        <PCardBody className="space-y-4">
          {loadingSessions ? (
            <div className="h-16 bg-[#F4EFE6] dark:bg-[#28211C] rounded-xl animate-pulse" />
          ) : sessions.length === 0 ? (
            <p className="text-[13px] text-[#6E5A48] dark:text-[#B8A896]">
              Only your current authenticated browser session is active.
            </p>
          ) : (
            <div className="divide-y divide-[#E4D9C8]/70 dark:divide-[#382F27]">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                        {summarizeUserAgent(sess.userAgent)}
                      </span>
                      {sess.current && (
                        <Badge className="bg-[#F5EFE2] text-[#5C4315] border-[#C4A265]/40 dark:bg-[#2D2419] dark:text-[#EAD7B0]">
                          Current device
                        </Badge>
                      )}
                    </div>
                    <p className="text-[12px] text-[#6E5A48] dark:text-[#B8A896] mt-0.5 tabular-nums">
                      {sess.ip ? `IP ${sess.ip} · ` : ''}
                      Active {sess.updatedAt || sess.createdAt ? new Date(sess.updatedAt || sess.createdAt!).toLocaleString() : 'recently'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[#E4D9C8]/70 dark:border-[#382F27] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                Quick-Switch List on This Browser ({savedAccountCount} saved)
              </p>
              <p className="text-[12px] text-[#6E5A48] dark:text-[#B8A896]">
                Stored locally on this browser only and wiped automatically when you click Sign Out.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savedAccountCount === 0}
              onClick={handleClearSavedAccounts}
              className="min-h-[44px] sm:min-h-[36px] border-[#E4D9C8] dark:border-[#382F27] gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear Saved Accounts
            </Button>
          </div>
        </PCardBody>
      </PCard>

      {/* Security Event Log */}
      <PCard>
        <PCardHead>
          <span className="inline-flex items-center gap-2">
            <History className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
            Recent Security Activity
          </span>
        </PCardHead>
        <PCardBody>
          {loadingEvents ? (
            <div className="h-14 bg-[#F4EFE6] dark:bg-[#28211C] rounded-xl animate-pulse" />
          ) : events.length === 0 ? (
            <p className="text-[13px] text-[#6E5A48] dark:text-[#B8A896]">
              No recent security events recorded yet for this workspace.
            </p>
          ) : (
            <ul className="divide-y divide-[#E4D9C8]/70 dark:divide-[#382F27]">
              {events.map((ev) => (
                <li key={ev.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                    {formatEventLabel(ev.eventType)}
                  </span>
                  <span className="text-[12px] text-[#6E5A48] dark:text-[#B8A896] tabular-nums">
                    {new Date(ev.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PCardBody>
      </PCard>

      <SignOutCard
        title="Sign Out of Current Device"
        description="Ends this browser session, revokes cookies, and clears locally cached quick-switch accounts."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={onSignOut}
            className="min-h-[44px] sm:min-h-[38px] border-[#9E2A2B]/40 text-[#9E2A2B] hover:bg-[#FFF8F6] dark:text-[#EF9A9A] gap-2 cursor-pointer"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </Button>
        }
      />

      {/* TOTP Enrollment Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={(o) => !verifyingTotp && setEnrollDialogOpen(o)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1F1A16] border-[#E4D9C8] dark:border-[#382F27]">
          <DialogHeader>
            <DialogTitle className="text-[#3D2B1F] dark:text-[#F5EFE6]">
              Set Up Authenticator App
            </DialogTitle>
            <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
              Scan this QR code in your authenticator app or enter the secret key manually, then confirm with a 6-digit code.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyMfaEnroll} className="space-y-4">
            {qrCode && (
              <div className="flex justify-center p-4 rounded-xl bg-[#FAF7F2] border border-[#E4D9C8]">
                <img src={qrCode} alt="Scan QR code for 2FA setup" className="w-40 h-40" />
              </div>
            )}
            {totpSecret && (
              <div className="rounded-xl bg-[#F4EFE6] dark:bg-[#28211C] px-3 py-2.5 flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-[#3D2B1F] dark:text-[#F5EFE6] break-all">
                  {totpSecret}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(totpSecret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  aria-label="Copy 2FA secret key"
                  className="shrink-0"
                >
                  {copiedSecret ? <Check className="h-4 w-4 text-[#236B42]" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
            <div>
              <label
                htmlFor="totp-verify-code"
                className="block text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6] mb-1.5"
              >
                6-digit verification code
              </label>
              <Input
                id="totp-verify-code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="000000"
                inputMode="numeric"
                maxLength={8}
                className="h-11 sm:h-10 font-mono text-base sm:text-sm tracking-widest"
                required
              />
            </div>
            {mfaMessage && (
              <p role="alert" className="text-[13px] text-[#9E2A2B] dark:text-[#EF9A9A]">
                {mfaMessage}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEnrollDialogOpen(false)}
                disabled={verifyingTotp}
                className="min-h-[44px] sm:min-h-[38px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifyingTotp || totpCode.trim().length < 6}
                className="min-h-[44px] sm:min-h-[38px] bg-[#3D2B1F] hover:bg-[#261B13] text-white"
              >
                {verifyingTotp ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Disable Factor Confirmation */}
      <Dialog
        open={Boolean(disableTargetFactorId)}
        onOpenChange={(o) => !o && !disablingMfa && setDisableTargetFactorId(null)}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1F1A16] border-[#E4D9C8] dark:border-[#382F27]">
          <DialogHeader>
            <DialogTitle className="text-[#3D2B1F] dark:text-[#F5EFE6]">
              Remove Authenticator Factor?
            </DialogTitle>
            <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
              Disabling two-factor authentication weakens protection for account switching and passwordless sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisableTargetFactorId(null)}
              disabled={disablingMfa}
              className="min-h-[44px] sm:min-h-[38px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={disablingMfa}
              className="min-h-[44px] sm:min-h-[38px] bg-[#9E2A2B] hover:bg-[#7F1D1E] text-white"
            >
              {disablingMfa ? 'Removing...' : 'Remove 2FA'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
