'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  AtSign,
  Sparkles,
  Link2,
  Award,
  PenTool,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Clock,
  ShieldCheck,
  Compass,
  Check,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

/* ─── Biscuit Design System Tokens ────────────────────────── */
const B = {
  bg: '#F7F3ED',
  card: '#FFFDF9',
  cardAlt: '#FAF7F2',
  cardBorder: '#EDE7DD',
  cardShadow: '0 1px 3px rgba(61,43,31,0.06), 0 4px 12px rgba(61,43,31,0.04)',
  cardShadowHover: '0 2px 8px rgba(61,43,31,0.08), 0 8px 24px rgba(61,43,31,0.06)',
  text: '#3D2B1F',
  textSecondary: '#6B5744',
  textMuted: '#8B7355',
  textLight: '#A69279',
  accent: '#C4A265',
  accentDark: '#A68B52',
  accentLight: '#D4B87A',
  accentBg: '#F5EFE2',
  accentBgHover: '#EDE5D3',
  gold: '#B8962E',
  goldLight: '#F5EFD8',
  success: '#4A8C5C',
  successBg: '#EBF5EE',
  border: '#E8E0D4',
  borderLight: '#F0EBE3',
};

export interface QuestStep {
  id: string;
  title: string;
  shortLabel: string;
  category: string;
  timeEst: string;
  benefit: string;
  description: string;
  completed: boolean;
  href: string;
  actionText: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface ProfileCompletionQuestProps {
  profile: {
    subdomain: string | null;
    name: string | null;
    headline: string | null;
    status: 'published' | 'draft';
    updatedAt: string | null;
    links: Array<{ label: string; url: string; type: string }>;
    proofPoints: Array<{ type: string; value: string }>;
  } | null;
  recentPosts: Array<{
    id: string;
    content: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export function ProfileCompletionQuest({ profile, recentPosts }: ProfileCompletionQuestProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const steps: QuestStep[] = [
    {
      id: 'name',
      title: 'Creator Display Name',
      shortLabel: 'Display Name',
      category: 'Identity',
      timeEst: '30s',
      benefit: 'Identity',
      description: 'Introduce yourself with your real name or publication pen name so your audience knows you.',
      completed: Boolean(profile?.name && profile.name.trim().length > 0),
      href: '/dashboard/profile?tab=profile&focus=name',
      actionText: 'Add Name',
      icon: User,
    },
    {
      id: 'subdomain',
      title: 'Claim Custom Subdomain',
      shortLabel: 'Custom Handle',
      category: 'Distribution',
      timeEst: '30s',
      benefit: '+20% Reach',
      description: 'Reserve your personalized publication handle (e.g. yourname.unool.co) for easy sharing.',
      completed: Boolean(profile?.subdomain && !profile.subdomain.startsWith('user-')),
      href: '/dashboard/profile?focus=subdomain',
      actionText: 'Claim Handle',
      icon: AtSign,
    },
    {
      id: 'headline',
      title: 'Editorial Bio Headline',
      shortLabel: 'Bio Headline',
      category: 'Positioning',
      timeEst: '1 min',
      benefit: 'Conversion',
      description: 'A punchy one-liner summarizing your craft, role, or unique value proposition to new visitors.',
      completed: Boolean(profile?.headline && profile.headline.trim().length > 0),
      href: '/dashboard/profile?tab=profile&focus=headline',
      actionText: 'Add Headline',
      icon: Sparkles,
    },
    {
      id: 'links',
      title: 'Social & Portfolio Links',
      shortLabel: 'Bio Links',
      category: 'Traffic',
      timeEst: '1 min',
      benefit: '+15% Clicks',
      description: 'Direct readers to your Twitter/X, Substack, GitHub, LinkedIn, or personal website.',
      completed: (profile?.links?.length || 0) > 0,
      href: '/dashboard/profile?tab=links&focus=links',
      actionText: 'Add Links',
      icon: Link2,
    },
    {
      id: 'proofPoints',
      title: 'Proof Points & Credibility',
      shortLabel: 'Proof Points',
      category: 'Authority',
      timeEst: '2 min',
      benefit: '+15% Trust',
      description: 'Showcase audience metrics, notable press quotes, or career milestones to establish trust.',
      completed: (profile?.proofPoints?.length || 0) > 0,
      href: '/dashboard/profile?tab=links&focus=proofPoints',
      actionText: 'Add Proofs',
      icon: Award,
    },
    {
      id: 'recentPosts',
      title: 'First Broadcast Publication',
      shortLabel: 'First Broadcast',
      category: 'Audience',
      timeEst: '3 min',
      benefit: 'Milestone',
      description: 'Draft and dispatch your inaugural newsletter or social broadcast to engage your audience.',
      completed: recentPosts.length > 0,
      href: '/dashboard/studio',
      actionText: 'Draft Broadcast',
      icon: PenTool,
    },
  ];

  const completedSteps = steps.filter((s) => s.completed);
  const incompleteSteps = steps.filter((s) => !s.completed);
  const completedCount = completedSteps.length;
  const totalSteps = steps.length;
  const completionPercent = Math.round((completedCount / totalSteps) * 100);
  const nextIncompleteStep = incompleteSteps[0] || null;

  // Filtered steps for the dialog view
  const displayedSteps =
    activeFilter === 'pending'
      ? incompleteSteps.length > 0
        ? incompleteSteps
        : steps
      : activeFilter === 'completed'
      ? completedSteps
      : steps;

  // Milestone tier label
  const getTierInfo = (pct: number) => {
    if (pct === 100) return { label: 'Verified Creator', desc: '100% primed for public syndication' };
    if (pct >= 67) return { label: 'Prime Publisher', desc: '1 milestone away from verified status' };
    if (pct >= 34) return { label: 'Emerging Authority', desc: 'Connecting social graph & credentials' };
    return { label: 'Founding Persona', desc: 'Establishing creator identity' };
  };

  const tierInfo = getTierInfo(completionPercent);

  return (
    <>
      {/* ─── IN-CARD INTERACTIVE WIDGET ─────────────────────── */}
      <div className="mt-5 pt-4 border-t" style={{ borderColor: B.borderLight }}>
        <div className="flex items-center justify-between">
          <div
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
            title="Click to view all profile completion milestones"
          >
            {/* Circular Progress Gauge */}
            <div className="relative h-14 w-14 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke={B.borderLight}
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke={completionPercent === 100 ? B.success : B.accent}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeDasharray={`${completionPercent} ${100 - completionPercent}`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono tracking-tight"
                style={{ color: B.text }}
              >
                {completionPercent}%
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p
                  className="text-sm font-semibold tracking-tight transition-colors group-hover:opacity-85"
                  style={{ color: B.text }}
                >
                  Profile Completion
                </p>
                {completionPercent === 100 ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                    style={{ backgroundColor: B.successBg, color: B.success }}
                  >
                    <Check className="w-2.5 h-2.5" /> 100% Ready
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                    style={{ backgroundColor: B.accentBg, color: B.accentDark }}
                  >
                    {incompleteSteps.length} left
                  </span>
                )}
              </div>

              <p className="text-xs mt-0.5" style={{ color: B.textMuted }}>
                {completionPercent === 100
                  ? 'Your profile is fully set up!'
                  : `${completedCount} of ${totalSteps} steps done`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all hover:bg-black/5"
            style={{ color: B.textSecondary }}
          >
            {completionPercent === 100 ? 'View details' : 'View steps'}
            <ChevronRight className="h-3.5 w-3.5 opacity-70" />
          </button>
        </div>

        {/* Dynamic Next-Action Chip (Only shown when profile is not 100% complete) */}
        {nextIncompleteStep && (
          <div
            className="mt-3.5 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition-all hover:shadow-sm"
            style={{
              backgroundColor: B.cardAlt,
              border: `1px dashed ${B.border}`,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="p-1 rounded-md flex-shrink-0"
                style={{ backgroundColor: B.accentBg, color: B.accentDark }}
              >
                <nextIncompleteStep.icon className="h-3.5 w-3.5" />
              </span>
              <div className="truncate">
                <span className="font-medium mr-1.5" style={{ color: B.text }}>
                  Next: {nextIncompleteStep.title}
                </span>
                <span
                  className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px]"
                  style={{ backgroundColor: B.bg, color: B.textMuted }}
                >
                  {nextIncompleteStep.timeEst}
                </span>
              </div>
            </div>

            <Link
              href={nextIncompleteStep.href}
              className="flex-shrink-0 inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg text-xs transition-all hover:opacity-90 active:scale-95 shadow-sm"
              style={{
                backgroundColor: B.text,
                color: B.card,
              }}
            >
              {nextIncompleteStep.actionText}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* ─── CREATOR IDENTITY QUEST MODAL / DRAWER ───────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[88vh] overflow-y-auto p-0 rounded-2xl border bg-card shadow-2xl"
          style={{
            backgroundColor: B.card,
            borderColor: B.cardBorder,
            color: B.text,
          }}
        >
          {/* Header Banner */}
          <div
            className="p-6 border-b relative"
            style={{
              backgroundColor: B.cardAlt,
              borderColor: B.borderLight,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase" style={{ backgroundColor: B.accentBg, color: B.accentDark }}>
                  <Compass className="w-3.5 h-3.5" />
                  Creator Identity Quest
                </div>
                <DialogTitle
                  className="text-xl font-bold tracking-tight pt-1"
                  style={{ color: B.text }}
                >
                  Your Profile Readiness
                </DialogTitle>
                <DialogDescription
                  className="text-xs max-w-lg mt-1"
                  style={{ color: B.textMuted }}
                >
                  Complete each milestone to optimize visitor conversions, unlock your personalized subdomain, and achieve verified publisher status.
                </DialogDescription>
              </div>

              {/* Tier Status Badge */}
              <div
                className="hidden sm:flex flex-col items-end text-right px-3 py-1.5 rounded-xl border flex-shrink-0"
                style={{
                  backgroundColor: B.card,
                  borderColor: B.border,
                }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: B.accentDark }}>
                  {tierInfo.label}
                </span>
                <span className="text-[10px]" style={{ color: B.textMuted }}>
                  {tierInfo.desc}
                </span>
              </div>
            </div>

            {/* Progress Gauge & Milestone Bar */}
            <div className="mt-5 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border" style={{ backgroundColor: B.card, borderColor: B.borderLight }}>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke={B.borderLight} strokeWidth="3.2" />
                    <circle
                      cx="18" cy="18" r="15.5"
                      fill="none"
                      stroke={completionPercent === 100 ? B.success : B.accent}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeDasharray={`${completionPercent} ${100 - completionPercent}`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono" style={{ color: B.text }}>
                    {completionPercent}%
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: B.text }}>
                    {completedCount} of {totalSteps} Milestones Done
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: B.textMuted }}>
                    {completionPercent === 100
                      ? 'All setup milestones are completed!'
                      : `${incompleteSteps.length} remaining step${incompleteSteps.length > 1 ? 's' : ''} to reach 100%`}
                  </div>
                </div>
              </div>

              {/* Milestone pips */}
              <div className="flex items-center gap-1.5 text-[11px]">
                {[
                  { label: '33%', done: completionPercent >= 33 },
                  { label: '66%', done: completionPercent >= 66 },
                  { label: '100%', done: completionPercent === 100 },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium"
                    style={{
                      backgroundColor: m.done ? B.successBg : B.bg,
                      color: m.done ? B.success : B.textLight,
                      border: `1px solid ${m.done ? B.success : B.borderLight}`,
                    }}
                  >
                    {m.done && <Check className="w-2.5 h-2.5" />}
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-4">
              <button
                onClick={() => setActiveFilter('pending')}
                className="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                style={{
                  backgroundColor: activeFilter === 'pending' ? B.text : 'transparent',
                  color: activeFilter === 'pending' ? B.card : B.textMuted,
                }}
              >
                Incomplete ({incompleteSteps.length})
              </button>
              <button
                onClick={() => setActiveFilter('all')}
                className="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                style={{
                  backgroundColor: activeFilter === 'all' ? B.text : 'transparent',
                  color: activeFilter === 'all' ? B.card : B.textMuted,
                }}
              >
                All Steps ({totalSteps})
              </button>
              <button
                onClick={() => setActiveFilter('completed')}
                className="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                style={{
                  backgroundColor: activeFilter === 'completed' ? B.text : 'transparent',
                  color: activeFilter === 'completed' ? B.card : B.textMuted,
                }}
              >
                Completed ({completedCount})
              </button>
            </div>
          </div>

          {/* Steps List */}
          <div className="p-6 space-y-3">
            {displayedSteps.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
                <h4 className="text-base font-semibold" style={{ color: B.text }}>
                  All selected steps complete!
                </h4>
                <p className="text-xs" style={{ color: B.textMuted }}>
                  You have successfully primed every item in this category.
                </p>
              </div>
            ) : (
              displayedSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className="p-4 rounded-xl border transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor: step.completed ? B.card : B.cardAlt,
                      borderColor: step.completed ? B.borderLight : B.border,
                      opacity: step.completed && activeFilter === 'all' ? 0.75 : 1,
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Icon & Info */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div
                          className="p-2.5 rounded-xl flex-shrink-0 mt-0.5"
                          style={{
                            backgroundColor: step.completed ? B.successBg : B.accentBg,
                            color: step.completed ? B.success : B.accentDark,
                          }}
                        >
                          {step.completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className={`text-sm font-semibold tracking-tight ${
                                step.completed ? 'line-through text-stone-600' : ''
                              }`}
                              style={{ color: B.text }}
                            >
                              {step.title}
                            </h4>

                            {/* Benefit Pill */}
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{
                                backgroundColor: step.completed ? B.bg : B.accentBg,
                                color: step.completed ? B.textMuted : B.accentDark,
                              }}
                            >
                              {step.benefit}
                            </span>

                            {/* Estimated Duration */}
                            <span
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: B.bg, color: B.textMuted }}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {step.timeEst}
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed" style={{ color: B.textSecondary }}>
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Direct Redirection Action */}
                      <div className="flex-shrink-0 self-end sm:self-center">
                        {step.completed ? (
                          <Link
                            href={step.href}
                            onClick={() => setModalOpen(false)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5"
                            style={{ color: B.textSecondary }}
                          >
                            Edit
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </Link>
                        ) : (
                          <Link
                            href={step.href}
                            onClick={() => setModalOpen(false)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md hover:translate-x-0.5 active:scale-95"
                            style={{
                              backgroundColor: B.text,
                              color: B.card,
                            }}
                          >
                            {step.actionText}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div
            className="p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            style={{
              backgroundColor: B.cardAlt,
              borderColor: B.borderLight,
              color: B.textMuted,
            }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Editorial Pro Tip:</strong> Complete profiles achieve 3.4x higher link clicks and newsletter conversions.
              </span>
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium self-end sm:self-auto hover:bg-black/5"
              style={{ color: B.textSecondary }}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
