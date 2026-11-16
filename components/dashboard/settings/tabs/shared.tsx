'use client';

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ReadinessItem, SettingsSectionId } from '../types';

/* ─── Shared Warm Biscuit WCAG 2.2 AA Primitives for Settings ─── */

export interface SectionHeadingProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: ReactNode;
}

export function SectionHeading({ icon: Icon, title, subtitle, badge }: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-3.5 mb-6">
      <div className="h-10 w-10 rounded-xl bg-[#F5EFE2] dark:bg-[#2D2419] border border-[#E4D9C8] dark:border-[#382F27] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4.5 w-4.5 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[18px] leading-[26px] font-semibold tracking-[-0.015em] text-[#3D2B1F] dark:text-[#F5EFE6]">
            {title}
          </h2>
          {badge}
        </div>
        <p className="text-[13px] leading-[19px] text-[#6E5A48] dark:text-[#B8A896] mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export interface SettingRowProps {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
  last?: boolean;
}

export function SettingRow({ label, description, htmlFor, children, last = false }: SettingRowProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 ${
        !last ? 'border-b border-[#E4D9C8]/70 dark:border-[#382F27]' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        {htmlFor ? (
          <label
            htmlFor={htmlFor}
            className="block text-[14px] leading-[21px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]"
          >
            {label}
          </label>
        ) : (
          <p className="text-[14px] leading-[21px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
            {label}
          </p>
        )}
        {description && (
          <p className="text-[13px] leading-[19px] text-[#6E5A48] dark:text-[#B8A896] mt-0.5 text-balance">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0 w-full sm:w-auto">{children}</div>
    </div>
  );
}

export interface PCardProps {
  children: ReactNode;
  className?: string;
}

export function PCard({ children, className = '' }: PCardProps) {
  return (
    <section
      className={`rounded-2xl border border-[#E4D9C8] dark:border-[#382F27] bg-white dark:bg-[#1F1A16] shadow-xs overflow-hidden ${className}`}
    >
      {children}
    </section>
  );
}

export interface PCardHeadProps {
  children: ReactNode;
  action?: ReactNode;
}

export function PCardHead({ children, action }: PCardHeadProps) {
  return (
    <div className="px-6 py-4 border-b border-[#E4D9C8]/80 dark:border-[#382F27] bg-[#F4EFE6]/70 dark:bg-[#28211C] flex flex-wrap items-center justify-between gap-3">
      <div className="text-[14px] leading-[20px] font-semibold tracking-[-0.01em] text-[#3D2B1F] dark:text-[#F5EFE6]">
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface PCardBodyProps {
  children: ReactNode;
  className?: string;
}

export function PCardBody({ children, className = '' }: PCardBodyProps) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}

export interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  description: string | ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}

export function SectionCard({ icon: Icon, title, description, children, action }: SectionCardProps) {
  return (
    <PCard>
      <div className="px-6 py-4 border-b border-[#E4D9C8]/80 dark:border-[#382F27] bg-[#F4EFE6]/70 dark:bg-[#28211C] flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-[#F5EFE2] dark:bg-[#2D2419] border border-[#E4D9C8] dark:border-[#382F27] flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] leading-[20px] font-semibold tracking-[-0.01em] text-[#3D2B1F] dark:text-[#F5EFE6]">
            {title}
          </h3>
          <div className="text-[13px] leading-[19px] text-[#6E5A48] dark:text-[#B8A896] mt-0.5">
            {description}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </PCard>
  );
}

export interface DangerCardProps {
  icon: React.ElementType;
  title: string;
  badge?: ReactNode;
  description: string;
  action: ReactNode;
}

export function DangerCard({ icon: Icon, title, badge, description, action }: DangerCardProps) {
  return (
    <div className="rounded-2xl border border-[#9E2A2B]/35 dark:border-[#E57373]/40 bg-[#FFF8F6] dark:bg-[#2C1A19] overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-[#9E2A2B] dark:text-[#EF9A9A] shrink-0" aria-hidden="true" />
              <h3 className="text-[14px] font-semibold text-[#9E2A2B] dark:text-[#EF9A9A]">
                {title}
              </h3>
              {badge}
            </div>
            <p className="text-[13px] leading-[19px] text-[#6E5A48] dark:text-[#B8A896]">
              {description}
            </p>
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      </div>
    </div>
  );
}

export interface SignOutCardProps {
  title: string;
  description: string;
  action: ReactNode;
}

export function SignOutCard({ title, description, action }: SignOutCardProps) {
  return (
    <div className="rounded-2xl border border-[#E4D9C8] dark:border-[#382F27] bg-[#F4EFE6]/60 dark:bg-[#28211C] overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-[#3D2B1F] dark:text-[#F5EFE6]">
              {title}
            </h3>
            <p className="text-[13px] leading-[19px] text-[#6E5A48] dark:text-[#B8A896] mt-0.5">
              {description}
            </p>
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      </div>
    </div>
  );
}

export interface SwitchControlProps {
  checked: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}

export function SwitchControl({
  checked,
  onToggle,
  disabled = false,
  loading = false,
  label,
}: SwitchControlProps) {
  return (
    <div className="flex items-center gap-3">
      {loading && <Loader2 className="h-4 w-4 animate-spin text-[#6E5A48]" aria-hidden="true" />}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onToggle(!checked)}
        disabled={disabled || loading}
        className="inline-flex min-h-[44px] sm:min-h-[32px] items-center gap-2.5 px-1 cursor-pointer disabled:opacity-50"
      >
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
            checked
              ? 'bg-[#3D2B1F] dark:bg-[#C4A265] border-[#3D2B1F] dark:border-[#C4A265]'
              : 'bg-[#E4D9C8] dark:bg-[#382F27] border-[#D1C0A7] dark:border-[#4A3E33]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-[#16120F] shadow-sm transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
            aria-hidden="true"
          />
        </span>
        <span className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6] w-16 text-left tabular-nums">
          {checked ? 'Enabled' : 'Disabled'}
        </span>
      </button>
    </div>
  );
}

export function ImpersonationNotice() {
  return (
    <div
      role="alert"
      className="mb-6 rounded-2xl border border-[#C4A265] bg-[#F5EFE2] dark:bg-[#2D2419] px-4 py-3.5 text-[#5C4315] dark:text-[#EAD7B0] flex items-start gap-3"
    >
      <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-[#A43D1E] dark:text-[#E07A5F]" aria-hidden="true" />
      <div className="text-[13px] leading-[19px]">
        <p className="font-semibold">Admin support session active (read-only security posture)</p>
        <p className="mt-0.5">
          Security-sensitive changes—including password updates, 2FA, data export, billing cancellation,
          workspace ownership transfer, and account deletion—are locked during impersonation.
        </p>
      </div>
    </div>
  );
}

export function ReadinessStrip({
  items,
  onSelectTab,
  onDismiss,
}: {
  items: ReadinessItem[];
  onSelectTab: (tab: SettingsSectionId) => void;
  onDismiss: () => void;
}) {
  return (
    <div
      aria-label="Workspace readiness checklist"
      className="mb-6 rounded-2xl border border-[#E4D9C8] dark:border-[#382F27] bg-white dark:bg-[#1F1A16] px-4 py-3.5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[13px] font-semibold text-[#3D2B1F] dark:text-[#F5EFE6]">
          Studio Readiness
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[12px] font-medium text-[#6E5A48] dark:text-[#B8A896] hover:text-[#3D2B1F] dark:hover:text-[#F5EFE6] px-2 py-1 rounded-md cursor-pointer"
        >
          Dismiss
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {items.map((item) => {
          const isDone = item.state === 'done';
          const isWarn = item.state === 'warning';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.targetTab)}
              className={`min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                isWarn
                  ? 'border-[#C4A265] bg-[#F5EFE2] dark:bg-[#2D2419] text-[#5C4315] dark:text-[#EAD7B0]'
                  : isDone
                    ? 'border-[#E4D9C8] dark:border-[#382F27] bg-[#FAF7F2] dark:bg-[#28211C] text-[#3D2B1F] dark:text-[#F5EFE6]'
                    : 'border-dashed border-[#C4A265] bg-white dark:bg-[#1F1A16] text-[#3D2B1F] dark:text-[#F5EFE6] hover:bg-[#FAF7F2] dark:hover:bg-[#28211C]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#236B42] dark:text-[#6EE7B7]" aria-hidden="true" />
                ) : isWarn ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[#A43D1E] dark:text-[#E07A5F]" aria-hidden="true" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[#C4A265]" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold truncate">{item.label}</div>
                  <div className="text-[11px] text-[#6E5A48] dark:text-[#B8A896] truncate">
                    {item.statusLabel}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function UnsavedChangesDialog({
  open,
  onStay,
  onDiscard,
}: {
  open: boolean;
  onStay: () => void;
  onDiscard: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onStay()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#1F1A16] border-[#E4D9C8] dark:border-[#382F27]">
        <DialogHeader>
          <DialogTitle className="text-[#3D2B1F] dark:text-[#F5EFE6]">
            Unsaved changes
          </DialogTitle>
          <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
            You have unsaved changes in this section. Leaving now will discard your edits.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDiscard}
            className="min-h-[44px] sm:min-h-0 border-[#E4D9C8] dark:border-[#382F27]"
          >
            Discard changes
          </Button>
          <Button
            type="button"
            onClick={onStay}
            className="min-h-[44px] sm:min-h-0 bg-[#3D2B1F] hover:bg-[#261B13] text-white dark:bg-[#F5EFE6] dark:text-[#16120F]"
          >
            Stay and save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SaveActionFooter({
  dirty,
  saving,
  error,
  saveLabel = 'Save changes',
  onSave,
  onReset,
  disabled = false,
  helperText,
}: {
  dirty: boolean;
  saving: boolean;
  error?: string | null;
  saveLabel?: string;
  onSave: () => void;
  onReset?: () => void;
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <div className="mt-5 pt-4 border-t border-[#E4D9C8]/80 dark:border-[#382F27] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        {error ? (
          <p role="alert" className="text-[13px] text-[#9E2A2B] dark:text-[#EF9A9A] font-medium">
            {error}
          </p>
        ) : (
          <p className="text-[13px] text-[#6E5A48] dark:text-[#B8A896]">
            {dirty
              ? 'You have unsaved edits.'
              : helperText || 'All changes saved.'}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {dirty && onReset && (
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={saving}
            className="min-h-[44px] sm:min-h-[38px] border-[#E4D9C8] dark:border-[#382F27] text-[#3D2B1F] dark:text-[#F5EFE6] cursor-pointer"
          >
            Discard
          </Button>
        )}
        <Button
          type="button"
          onClick={onSave}
          disabled={disabled || saving || (!dirty && !error)}
          className="min-h-[44px] sm:min-h-[38px] bg-[#3D2B1F] hover:bg-[#261B13] text-white dark:bg-[#F5EFE6] dark:hover:bg-[#E9D8B8] dark:text-[#16120F] font-semibold cursor-pointer gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : error ? (
            <>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry save
            </>
          ) : (
            saveLabel
          )}
        </Button>
      </div>
    </div>
  );
}

export interface LoadingSkeletonProps {
  rows?: number;
}

export function LoadingSkeleton({ rows = 6 }: LoadingSkeletonProps) {
  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-8 w-36 bg-[#F4EFE6] dark:bg-[#28211C] rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-72 bg-[#F4EFE6] dark:bg-[#28211C] rounded animate-pulse" />
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-[240px] shrink-0 space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-11 bg-[#F4EFE6] dark:bg-[#28211C] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="flex-1 max-w-[740px] space-y-4">
          <div className="h-44 bg-[#F4EFE6] dark:bg-[#28211C] rounded-2xl animate-pulse" />
          <div className="h-36 bg-[#F4EFE6] dark:bg-[#28211C] rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
