'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Wand2,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Info,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ROLE_OPTIONS,
  getRoleConfig,
  STUDIO_ONBOARDING_QUESTIONS,
  validateStudioProfile,
  type StudioProfile,
} from '@/lib/config/studioOnboarding';
import { StudioOnboardingModal } from '@/components/dashboard/StudioOnboardingModal';
import {
  SectionHeading,
  SettingRow,
  PCard,
  PCardHead,
  PCardBody,
  SwitchControl,
  SaveActionFooter,
} from './shared';
import type { UserPreferencesDto } from '../types';

const TONE_OPTIONS = [
  'Soft & smooth',
  'Rebel',
  'Witty',
  'Calm expert',
  'Storyteller',
  'Straight-talker',
];

const STYLE_OPTIONS = [
  'Short & punchy',
  'Storytelling',
  'Educational',
  'Bold opinions',
  'Behind-the-scenes',
  'Funny & light',
];

const DEFAULT_INTERESTS =
  (STUDIO_ONBOARDING_QUESTIONS.find((q) => q.key === 'interests')?.options as string[] | undefined) || [
    'Tech',
    'Movies & series',
    'Travel',
    'Books',
    'Music',
    'Comedy',
  ];

function buildDraft(profile: StudioProfile | null): StudioProfile {
  return {
    role: profile?.role || 'Creator',
    businessStage: profile?.businessStage || '',
    businessDomain: profile?.businessDomain || profile?.doing || '',
    doing: profile?.doing || profile?.businessDomain || '',
    workInterests: profile?.workInterests || '',
    audience: profile?.audience || '',
    tone: profile?.tone || 'Calm expert',
    style: profile?.style || 'Short & punchy',
    interests: Array.isArray(profile?.interests) && profile.interests.length > 0 ? profile.interests : ['Books'],
    completedAt: profile?.completedAt || new Date().toISOString(),
  };
}

export interface AiVoiceTabProps {
  userId: string;
  workspaceName: string;
  callerRole: 'owner' | 'admin' | 'editor' | 'viewer';
  preferences: UserPreferencesDto;
  initialProfile: StudioProfile | null;
  initialVersion: number;
  initialCompleted: boolean;
  presenceNotice?: 'templates' | 'analytics';
  onPreferencesUpdated: (next: UserPreferencesDto) => void;
  onProfileUpdated: (profile: StudioProfile, version: number, completed: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function AiVoiceTab({
  userId,
  workspaceName,
  callerRole,
  preferences,
  initialProfile,
  initialVersion,
  initialCompleted,
  presenceNotice,
  onPreferencesUpdated,
  onProfileUpdated,
  onDirtyChange,
}: AiVoiceTabProps) {
  const isViewer = callerRole === 'viewer';

  const [savedProfile, setSavedProfile] = useState<StudioProfile | null>(initialProfile);
  const [draft, setDraft] = useState<StudioProfile>(() => buildDraft(initialProfile));
  const [version, setVersion] = useState<number>(initialVersion || 0);
  const [completed, setCompleted] = useState<boolean>(initialCompleted);

  const [savingAiToggle, setSavingAiToggle] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [versionConflict, setVersionConflict] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [customInterest, setCustomInterest] = useState('');

  useEffect(() => {
    setSavedProfile(initialProfile);
    setDraft(buildDraft(initialProfile));
    setVersion(initialVersion || 0);
    setCompleted(initialCompleted);
  }, [initialProfile, initialVersion, initialCompleted]);

  const roleConfig = useMemo(() => getRoleConfig(draft.role), [draft.role]);

  const isDirty = useMemo(() => {
    const baseline = buildDraft(savedProfile);
    return (
      draft.role.trim() !== baseline.role.trim() ||
      (draft.businessStage || '').trim() !== (baseline.businessStage || '').trim() ||
      (draft.businessDomain || '').trim() !== (baseline.businessDomain || '').trim() ||
      (draft.workInterests || '').trim() !== (baseline.workInterests || '').trim() ||
      draft.audience.trim() !== baseline.audience.trim() ||
      draft.tone.trim() !== baseline.tone.trim() ||
      draft.style.trim() !== baseline.style.trim() ||
      JSON.stringify(draft.interests) !== JSON.stringify(baseline.interests)
    );
  }, [draft, savedProfile]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const handleToggleAiPersonalization = async (nextVal: boolean) => {
    setSavingAiToggle(true);
    const previous = preferences;
    onPreferencesUpdated({ ...preferences, aiPersonalizationEnabled: nextVal });

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ aiPersonalizationEnabled: nextVal }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update AI personalization setting.');
      }
      if (data?.preferences) {
        onPreferencesUpdated(data.preferences);
      }
      toast.success(nextVal ? 'AI personalization enabled' : 'AI personalization paused');
    } catch (err) {
      onPreferencesUpdated(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to update AI preference');
    } finally {
      setSavingAiToggle(false);
    }
  };

  const handleReloadLatest = async () => {
    setVersionConflict(false);
    setSaveError(null);
    try {
      const res = await fetch('/api/studio/profile', { credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to reload latest profile.');
      const nextProfile = data?.profile || null;
      const nextVersion = typeof data?.version === 'number' ? data.version : 0;
      const nextCompleted = Boolean(data?.isCompleted);
      setSavedProfile(nextProfile);
      setDraft(buildDraft(nextProfile));
      setVersion(nextVersion);
      setCompleted(nextCompleted);
      if (nextProfile) {
        onProfileUpdated(nextProfile, nextVersion, nextCompleted);
      }
      toast.success('Loaded the newest Brand Voice saved for this workspace.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reload failed');
    }
  };

  const handleSaveProfile = async () => {
    if (isViewer) return;
    setSaveError(null);
    setVersionConflict(false);

    const payload: StudioProfile = {
      ...draft,
      role: draft.role.trim(),
      businessStage: (draft.businessStage || '').trim(),
      businessDomain: (draft.businessDomain || '').trim(),
      doing: (draft.businessDomain || draft.doing || '').trim(),
      workInterests: (draft.workInterests || '').trim(),
      audience: draft.audience.trim(),
      tone: draft.tone.trim(),
      style: draft.style.trim(),
      interests: draft.interests.map((i) => i.trim()).filter(Boolean),
      completedAt: savedProfile?.completedAt || new Date().toISOString(),
    };

    const validation = validateStudioProfile(payload);
    if (!validation.valid) {
      setSaveError(validation.error || 'Please fill in all required Brand Voice fields.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch('/api/studio/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...payload, version }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409 || data?.code === 'VERSION_CONFLICT') {
        setVersionConflict(true);
        setSaveError('Another teammate updated this Brand Voice while you were editing. Reload before saving.');
        return;
      }
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save Brand Voice.');
      }
      const nextProfile: StudioProfile = data?.profile || payload;
      const nextVersion: number = typeof data?.version === 'number' ? data.version : version + 1;
      setSavedProfile(nextProfile);
      setDraft(buildDraft(nextProfile));
      setVersion(nextVersion);
      setCompleted(true);
      onProfileUpdated(nextProfile, nextVersion, true);
      toast.success('Brand Voice saved for workspace AI prompts.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save Brand Voice');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleInterest = (topic: string) => {
    if (isViewer) return;
    setDraft((prev) => {
      const exists = prev.interests.includes(topic);
      if (exists && prev.interests.length <= 1) {
        toast.info('Keep at least one interest selected.');
        return prev;
      }
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((t) => t !== topic)
          : [...prev.interests, topic],
      };
    });
  };

  const addCustomInterest = () => {
    const clean = customInterest.trim().slice(0, 80);
    if (!clean) return;
    if (!draft.interests.includes(clean)) {
      setDraft((prev) => ({ ...prev, interests: [...prev.interests, clean] }));
    }
    setCustomInterest('');
  };

  const interestChips = useMemo(() => {
    const set = new Set([...DEFAULT_INTERESTS, ...draft.interests]);
    return Array.from(set);
  }, [draft.interests]);

  return (
    <div className="space-y-6">
      <SectionHeading
        icon={Sparkles}
        title="AI & Brand Voice"
        subtitle={`Calibrate creator persona, writing cadence, audience focus, and AI context controls for ${workspaceName}.`}
        badge={
          completed ? (
            <Badge className="bg-[#EEF7F1] text-[#236B42] border-[#B8DEC6] dark:bg-[#16291E] dark:text-[#6EE7B7]">
              Calibrated
            </Badge>
          ) : (
            <Badge className="bg-[#F5EFE2] text-[#5C4315] border-[#C4A265]/40">
              Setup recommended
            </Badge>
          )
        }
      />

      {presenceNotice && (
        <div
          role="status"
          className="rounded-2xl border border-[#C4A265] bg-[#F5EFE2] dark:bg-[#2D2419] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <p className="text-[13px] text-[#5C4315] dark:text-[#EAD7B0]">
            {presenceNotice === 'templates'
              ? 'Public profile design templates are managed directly inside Presence.'
              : 'Public link clicks and profile analytics are located in Presence.'}
          </p>
          <Button asChild size="sm" variant="outline" className="min-h-[38px] border-[#C4A265] shrink-0">
            <Link href="/dashboard/presence" className="inline-flex items-center gap-1.5">
              Open Presence <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      )}

      {isViewer && (
        <div
          role="status"
          className="rounded-2xl border border-[#C4A265] bg-[#F5EFE2] dark:bg-[#2D2419] px-4 py-3 text-[13px] text-[#5C4315] dark:text-[#EAD7B0] flex items-start gap-2.5"
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#A43D1E] dark:text-[#E07A5F]" aria-hidden="true" />
          <p>
            Viewer accounts can inspect the workspace Brand Voice but cannot overwrite it. Personal AI toggle above
            still applies to your own account prompts.
          </p>
        </div>
      )}

      {/* Personal AI toggle */}
      <PCard>
        <PCardHead>
          <span>AI Prompt Personalization</span>
        </PCardHead>
        <PCardBody>
          <SettingRow
            label="Inject Brand Voice into AI generation"
            description="When disabled, Composer AI, Studio Idea Generator, and FlightPlan generate neutral drafts without pulling your persona or workspace voice fields."
            last
          >
            <SwitchControl
              checked={preferences.aiPersonalizationEnabled}
              loading={savingAiToggle}
              onToggle={handleToggleAiPersonalization}
              label="Toggle AI prompt personalization"
            />
          </SettingRow>
        </PCardBody>
      </PCard>

      {/* Version conflict banner */}
      {versionConflict && (
        <div
          role="alert"
          className="rounded-2xl border border-[#9E2A2B]/40 bg-[#FFF8F6] dark:bg-[#2C1A19] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#9E2A2B] dark:text-[#EF9A9A] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[13px] text-[#9E2A2B] dark:text-[#EF9A9A]">
              This Brand Voice profile changed on the server (optimistic lock conflict). Reload the latest version before re-applying edits.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleReloadLatest}
            className="min-h-[38px] border-[#9E2A2B]/40 text-[#9E2A2B] cursor-pointer shrink-0 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reload latest
          </Button>
        </div>
      )}

      {/* Brand Voice editor */}
      <PCard>
        <PCardHead
          action={
            !isViewer && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setWizardOpen(true)}
                className="min-h-[36px] border-[#C4A265]/50 text-[#5C4315] dark:text-[#C4A265] cursor-pointer gap-1.5"
              >
                <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                Guided wizard
              </Button>
            )
          }
        >
          <span>Creator Persona & Voice Calibration</span>
        </PCardHead>
        <PCardBody className="space-y-5">
          {/* Role */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="voice-role" className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                Primary role
              </label>
              <span className="text-[11px] font-mono text-[#6E5A48] dark:text-[#B8A896] tabular-nums">
                {draft.role.length}/80
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {ROLE_OPTIONS.map((option) => {
                const selected = draft.role === option;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={isViewer}
                    onClick={() => setDraft((p) => ({ ...p, role: option }))}
                    className={`min-h-[34px] px-3 py-1 rounded-full text-[12px] font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                      selected
                        ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#C4A265] dark:text-[#16120F] dark:border-[#C4A265]'
                        : 'bg-[#FAF7F2] dark:bg-[#28211C] text-[#3D2B1F] dark:text-[#F5EFE6] border-[#E4D9C8] dark:border-[#382F27]'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <Input
              id="voice-role"
              value={draft.role}
              disabled={isViewer}
              maxLength={80}
              onChange={(e) => setDraft((p) => ({ ...p, role: e.target.value }))}
              placeholder="e.g. Founder, Product designer, Fitness coach"
            />
          </div>

          {/* Stage */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="voice-stage" className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                {roleConfig.stageTitle}
              </label>
              <span className="text-[11px] font-mono text-[#6E5A48] dark:text-[#B8A896] tabular-nums">
                {(draft.businessStage || '').length}/80
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {roleConfig.stageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={isViewer}
                  onClick={() => setDraft((p) => ({ ...p, businessStage: option }))}
                  className={`min-h-[32px] px-2.5 py-1 rounded-full text-[12px] border transition-colors cursor-pointer disabled:opacity-50 ${
                    draft.businessStage === option
                      ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#C4A265] dark:text-[#16120F]'
                      : 'bg-[#FAF7F2] dark:bg-[#28211C] text-[#3D2B1F] dark:text-[#F5EFE6] border-[#E4D9C8] dark:border-[#382F27]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <Input
              id="voice-stage"
              value={draft.businessStage || ''}
              disabled={isViewer}
              maxLength={80}
              onChange={(e) => setDraft((p) => ({ ...p, businessStage: e.target.value }))}
              placeholder="Current stage or milestone"
            />
          </div>

          {/* Domain / Niche */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="voice-domain" className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                {roleConfig.domainLabel}
              </label>
              <span className="text-[11px] font-mono text-[#6E5A48] dark:text-[#B8A896] tabular-nums">
                {(draft.businessDomain || '').length}/80
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {roleConfig.domainChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={isViewer}
                  onClick={() => setDraft((p) => ({ ...p, businessDomain: chip, doing: chip }))}
                  className={`min-h-[30px] px-2.5 py-0.5 rounded-lg text-[12px] border transition-colors cursor-pointer disabled:opacity-50 ${
                    draft.businessDomain === chip
                      ? 'bg-[#F5EFE2] dark:bg-[#2D2419] text-[#5C4315] dark:text-[#EAD7B0] border-[#C4A265]'
                      : 'bg-white dark:bg-[#1F1A16] text-[#6E5A48] dark:text-[#B8A896] border-[#E4D9C8] dark:border-[#382F27]'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <Input
              id="voice-domain"
              value={draft.businessDomain || ''}
              disabled={isViewer}
              maxLength={80}
              onChange={(e) => setDraft((p) => ({ ...p, businessDomain: e.target.value, doing: e.target.value }))}
              placeholder={roleConfig.domainPlaceholder}
            />
          </div>

          {/* Audience */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="voice-audience" className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                Target audience
              </label>
              <span className="text-[11px] font-mono text-[#6E5A48] dark:text-[#B8A896] tabular-nums">
                {draft.audience.length}/80
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {roleConfig.audienceOptions.map((aud) => (
                <button
                  key={aud}
                  type="button"
                  disabled={isViewer}
                  onClick={() => setDraft((p) => ({ ...p, audience: aud }))}
                  className={`min-h-[30px] px-2.5 py-0.5 rounded-lg text-[12px] border transition-colors cursor-pointer disabled:opacity-50 ${
                    draft.audience === aud
                      ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#C4A265] dark:text-[#16120F]'
                      : 'bg-[#FAF7F2] dark:bg-[#28211C] text-[#3D2B1F] dark:text-[#F5EFE6] border-[#E4D9C8] dark:border-[#382F27]'
                  }`}
                >
                  {aud}
                </button>
              ))}
            </div>
            <Input
              id="voice-audience"
              value={draft.audience}
              disabled={isViewer}
              maxLength={80}
              onChange={(e) => setDraft((p) => ({ ...p, audience: e.target.value }))}
              placeholder="Who should resonate with your posts?"
            />
          </div>

          {/* Tone & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label htmlFor="voice-tone" className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                  Voice tone
                </label>
                <span className="text-[11px] font-mono text-[#6E5A48] tabular-nums">
                  {draft.tone.length}/80
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={isViewer}
                    onClick={() => setDraft((p) => ({ ...p, tone: t }))}
                    className={`min-h-[30px] px-2.5 py-0.5 rounded-full text-[12px] border cursor-pointer disabled:opacity-50 ${
                      draft.tone === t
                        ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#C4A265] dark:text-[#16120F]'
                        : 'bg-[#FAF7F2] dark:bg-[#28211C] text-[#3D2B1F] dark:text-[#F5EFE6] border-[#E4D9C8] dark:border-[#382F27]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Input
                id="voice-tone"
                value={draft.tone}
                disabled={isViewer}
                maxLength={80}
                onChange={(e) => setDraft((p) => ({ ...p, tone: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label htmlFor="voice-style" className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                  Writing style
                </label>
                <span className="text-[11px] font-mono text-[#6E5A48] tabular-nums">
                  {draft.style.length}/80
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isViewer}
                    onClick={() => setDraft((p) => ({ ...p, style: s }))}
                    className={`min-h-[30px] px-2.5 py-0.5 rounded-full text-[12px] border cursor-pointer disabled:opacity-50 ${
                      draft.style === s
                        ? 'bg-[#3D2B1F] text-white border-[#3D2B1F] dark:bg-[#C4A265] dark:text-[#16120F]'
                        : 'bg-[#FAF7F2] dark:bg-[#28211C] text-[#3D2B1F] dark:text-[#F5EFE6] border-[#E4D9C8] dark:border-[#382F27]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Input
                id="voice-style"
                value={draft.style}
                disabled={isViewer}
                maxLength={80}
                onChange={(e) => setDraft((p) => ({ ...p, style: e.target.value }))}
              />
            </div>
          </div>

          {/* Work topics */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="voice-work-topics" className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]">
                {roleConfig.workInterestsLabel}
              </label>
              <span className="text-[11px] font-mono text-[#6E5A48] dark:text-[#B8A896] tabular-nums">
                {(draft.workInterests || '').length}/120
              </span>
            </div>
            <Input
              id="voice-work-topics"
              value={draft.workInterests || ''}
              disabled={isViewer}
              maxLength={120}
              onChange={(e) => setDraft((p) => ({ ...p, workInterests: e.target.value }))}
              placeholder={roleConfig.workInterestsPlaceholder}
            />
          </div>

          {/* Outside interests */}
          <div>
            <p className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6] mb-2">
              Personal hooks & interests (used subtly for human voice analogies)
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {interestChips.map((item) => {
                const active = draft.interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={isViewer}
                    onClick={() => toggleInterest(item)}
                    className={`min-h-[32px] px-3 py-1 rounded-full text-[12px] border transition-colors cursor-pointer disabled:opacity-50 ${
                      active
                        ? 'bg-[#F5EFE2] dark:bg-[#2D2419] text-[#5C4315] dark:text-[#EAD7B0] border-[#C4A265] font-medium'
                        : 'bg-white dark:bg-[#1F1A16] text-[#6E5A48] dark:text-[#B8A896] border-[#E4D9C8] dark:border-[#382F27]'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {!isViewer && (
              <div className="flex items-center gap-2 max-w-sm">
                <Input
                  value={customInterest}
                  maxLength={80}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomInterest();
                    }
                  }}
                  placeholder="Add custom interest..."
                  aria-label="Add custom interest"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addCustomInterest}
                  className="min-h-[38px] border-[#E4D9C8] cursor-pointer shrink-0 gap-1"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
                </Button>
              </div>
            )}
          </div>

          {!isViewer && (
            <SaveActionFooter
              dirty={isDirty}
              saving={savingProfile}
              error={saveError}
              saveLabel="Save Brand Voice"
              onSave={handleSaveProfile}
              onReset={() => {
                setDraft(buildDraft(savedProfile));
                setSaveError(null);
              }}
              helperText={`Synced as revision v${version || 1}.`}
            />
          )}
        </PCardBody>
      </PCard>

      {/* Transparency & Sanitization note */}
      <PCard>
        <PCardHead>
          <span>Where Brand Voice Applies</span>
        </PCardHead>
        <PCardBody>
          <p className="text-[13px] leading-[20px] text-[#6E5A48] dark:text-[#B8A896]">
            Your calibrated fields are used by <strong className="text-[#3D2B1F] dark:text-[#F5EFE6]">Composer AI</strong>,{' '}
            <strong className="text-[#3D2B1F] dark:text-[#F5EFE6]">Studio Idea Generator</strong>, and{' '}
            <strong className="text-[#3D2B1F] dark:text-[#F5EFE6]">FlightPlan</strong>.
            All fields are length-bounded (80–120 characters) and sanitized server-side before entering AI system prompts.
          </p>
        </PCardBody>
      </PCard>

      <StudioOnboardingModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={(newProfile) => {
          setWizardOpen(false);
          setSavedProfile(newProfile);
          setDraft(buildDraft(newProfile));
          setCompleted(true);
          onProfileUpdated(newProfile, version + 1, true);
        }}
        forceOpen
        isRetake
        initialAnswers={draft}
        userId={userId}
      />
    </div>
  );
}