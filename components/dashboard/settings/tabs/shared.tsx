'use client';

import { type ReactElement } from 'react';

/* ─── Shared UI components for Settings tabs ─── */

export interface SectionHeadingProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}

export function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="h-9 w-9 rounded-xl bg-[#F5EFE2] dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-[#C4A265]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-[#3D2B1F] dark:text-zinc-100 leading-tight">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}

export function SettingRow({ label, description, children, last = false }: SettingRowProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 ${
        !last ? 'border-b border-zinc-100 dark:border-zinc-800' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#3D2B1F] dark:text-zinc-100">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 text-balance">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export interface PCardProps {
  children: React.ReactNode;
  className?: string;
}

export function PCard({ children, className = '' }: PCardProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export interface PCardHeadProps {
  children: React.ReactNode;
}

export function PCardHead({ children }: PCardHeadProps) {
  return (
    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
      {children}
    </div>
  );
}

export interface PCardBodyProps {
  children: React.ReactNode;
}

export function PCardBody({ children }: PCardBodyProps) {
  return <div className="px-6 py-5">{children}</div>;
}

export interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  description: string | React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionCard({ icon: Icon, title, description, children, action }: SectionCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#3D2B1F] dark:text-zinc-100">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export interface DangerCardProps {
  icon: React.ElementType;
  title: string;
  badge?: React.ReactNode;
  description: string;
  action: React.ReactNode;
}

export function DangerCard({ icon: Icon, title, badge, description, action }: DangerCardProps) {
  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{title}</p>
              {badge}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
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
  action: React.ReactNode;
}

export function SignOutCard({ title, description, action }: SignOutCardProps) {
  return (
    <div className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/40 dark:bg-red-900/10 overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#3D2B1F] dark:text-zinc-100">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      </div>
    </div>
  );
}

export interface LoadingSkeletonProps {
  rows?: number;
}

export function LoadingSkeleton({ rows = 6 }: LoadingSkeletonProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
      <div className="flex gap-6">
        <div className="w-52 shrink-0 space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}