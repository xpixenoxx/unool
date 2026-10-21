'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Sliders, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SectionHeading, SettingRow, PCard, PCardHead, PCardBody, SectionCard } from './shared';
import { StudioOnboardingModal } from '@/components/dashboard/StudioOnboardingModal';
import { StudioProfile, getRoleConfig, ROLE_BRANCH_CONFIGS } from '@/lib/config/studioOnboarding';

interface StudioTabProps {
  userId: string;
  onProfileUpdate: (profile: StudioProfile) => Promise<void>;
}

export function StudioTab({ userId, onProfileUpdate }: StudioTabProps) {
  const [studioProfile, setStudioProfile] = useState<StudioProfile>({
    role: '',
    businessStage: '',
    businessDomain: '',
    workInterests: '',
    doing: '',
    audience: '',
    tone: '',
    style: '',
    interests: [],
  });
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const roleConfig = getRoleConfig(studioProfile.role);

  const loadOnboardingProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/studio/profile', { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOnboardingCompleted(Boolean(data.isCompleted));
        if (data.profile) {
          setStudioProfile({
            role: data.profile.role || '',
            businessStage: data.profile.businessStage || '',
            businessDomain: data.profile.businessDomain || data.profile.doing || '',
            workInterests: data.profile.workInterests || '',
            doing: data.profile.doing || data.profile.businessDomain || '',
            audience: data.profile.audience || '',
            tone: data.profile.tone || '',
            style: data.profile.style || '',
            interests: Array.isArray(data.profile.interests) ? data.profile.interests : [],
            completedAt: data.profile.completedAt,
          });
          setLoading(false);
          return;
        }
      }
      const legacyRes = await fetch('/api/profile/onboarding', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (legacyRes.ok) {
        const legacyData = await legacyRes.json();
        if (legacyData.studio_profile || legacyData.studioProfile) {
          const sp = legacyData.studio_profile || legacyData.studioProfile;
          setStudioProfile({
            role: sp.role || '',
            businessStage: sp.businessStage || '',
            businessDomain: sp.businessDomain || sp.doing || '',
            workInterests: sp.workInterests || '',
            doing: sp.doing || sp.businessDomain || '',
            audience: sp.audience || '',
            tone: sp.tone || '',
            style: sp.style || '',
            interests: Array.isArray(sp.interests) ? sp.interests : [],
            completedAt: sp.completedAt,
          });
          setOnboardingCompleted(
            Boolean(legacyData.onboarding_completed || legacyData.onboardingCompleted),
          );
        } else if (legacyData.answers || legacyData.onboarding_answers) {
          const a = legacyData.answers || legacyData.onboarding_answers;
          setStudioProfile({
            role: a.persona || '',
            businessStage: '',
            businessDomain: a.focus || '',
            workInterests: '',
            doing: a.focus || '',
            audience: Array.isArray(a.audience) ? a.audience.join(', ') : a.audience || '',
            tone: Array.isArray(a.tone) ? a.tone.join(', ') : a.tone || '',
            style: a.custom?.style || 'Short & punchy',
            interests: Array.isArray(a.extras) ? a.extras : [],
          });
          setOnboardingCompleted(
            Boolean(legacyData.onboarding_completed || legacyData.onboardingCompleted),
          );
        }
      }
    } catch (e) {
      console.warn('Failed to load studio profile in settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOnboarding = async () => {
    setSavingOnboarding(true);
    try {
      const domain = (studioProfile.businessDomain || studioProfile.doing || '').trim();
      const payload: StudioProfile = {
        role: (studioProfile.role.trim() || 'Creator').slice(0, 80),
        businessStage: (studioProfile.businessStage?.trim() || 'Growing').slice(0, 80),
        businessDomain: (domain || 'Software/AI').slice(0, 80),
        workInterests: studioProfile.workInterests?.trim()
          ? studioProfile.workInterests.trim().slice(0, 120)
          : undefined,
        doing: (domain || 'Software/AI').slice(0, 80),
        audience: (studioProfile.audience.trim() || 'Followers in my niche').slice(0, 80),
        tone: (studioProfile.tone.trim() || 'Conversational & candid').slice(0, 80),
        style: (studioProfile.style.trim() || 'Short punchy lines').slice(0, 80),
        interests:
          studioProfile.interests.length > 0
            ? studioProfile.interests.map((i) => i.trim().slice(0, 80)).filter(Boolean)
            : ['General topics'],
        completedAt: new Date().toISOString(),
      };

      await onProfileUpdate(payload);
      setStudioProfile(payload);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('studio-profile-updated', { detail: payload }));
      }
      toast.success('Studio AI calibrations saved!');
      setOnboardingCompleted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update Studio AI');
    } finally {
      setSavingOnboarding(false);
    }
  };

  useEffect(() => {
    loadOnboardingProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-5">
        <SectionHeading
          icon={Sparkles}
          title="Studio AI"
          subtitle="Your voice signature powers all AI-generated content across every platform."
        />
        <div className="space-y-4">
          <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-96 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Sparkles}
        title="Studio AI"
        subtitle="Your voice signature powers all AI-generated content across every platform."
      />

      {/* Status card */}
      <SectionCard
        icon={Sparkles}
        title={onboardingCompleted ? 'Voice Calibrated' : 'Calibration Pending'}
        description={
          onboardingCompleted
            ? 'Your Studio AI is fully tuned to your voice.'
            : 'Complete calibration for the best AI output quality.'
        }
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowRetakeModal(false);
              setTimeout(() => setShowRetakeModal(true), 0);
            }}
            className="gap-1.5 text-xs font-semibold hover:bg-[#F5EFE2] dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Sliders className="h-3 w-3 text-[#C4A265]" />
            Launch Calibrator
          </Button>
        }
      />

      {/* Voice Signature Summary */}
      <PCard>
        <PCardHead>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Current Voice Signature
          </p>
        </PCardHead>
        <PCardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { label: 'Role', value: studioProfile.role || '—' },
              {
                label: roleConfig.stageTitle.replace(/\?$/, ''),
                value: studioProfile.businessStage || '—',
              },
              {
                label: roleConfig.domainLabel,
                value: studioProfile.businessDomain || studioProfile.doing || '—',
              },
              {
                label: roleConfig.audienceTitle.replace(/\?$/, ''),
                value: studioProfile.audience || '—',
              },
              { label: 'Voice Tone', value: studioProfile.tone || '—' },
              { label: 'Content Style', value: studioProfile.style || '—' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  {label}
                </p>
                <p className="text-xs font-semibold text-[#3D2B1F] dark:text-zinc-100 truncate">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {studioProfile.interests && studioProfile.interests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground self-center mr-1">
                Interests:
              </span>
              {studioProfile.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5EFE2] dark:bg-zinc-800 text-[#8B6914] dark:text-[#C4A265] border border-[#C4A265]/20"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </PCardBody>
      </PCard>

      {/* Direct Edit Form */}
      <PCard>
        <PCardHead>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Edit Calibrations
          </p>
        </PCardHead>
        <PCardBody>
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Role */}
            <div>
              <Label htmlFor="studio-role-input" className="text-xs font-semibold">
                Primary Hat / Role
              </Label>
              <Input
                id="studio-role-input"
                value={studioProfile.role}
                onChange={(e) => setStudioProfile((p) => ({ ...p, role: e.target.value }))}
                placeholder="e.g. Founder, Creator, Engineer..."
                className="mt-1.5 h-9 text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'Student',
                  'Founder',
                  'Creator',
                  'Influencer',
                  'Software engineer',
                  'Company / Brand',
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      const targetConfig = ROLE_BRANCH_CONFIGS[r] || ROLE_BRANCH_CONFIGS['Founder'];
                      setStudioProfile((prev) => {
                        const isStageValid = targetConfig.stageOptions.includes(
                          prev.businessStage || '',
                        );
                        const nextStage = isStageValid
                          ? prev.businessStage
                          : targetConfig.stageOptions[2] || targetConfig.stageOptions[0];
                        const isAudienceValid = targetConfig.audienceOptions.includes(
                          prev.audience || '',
                        );
                        const nextAudience = isAudienceValid
                          ? prev.audience
                          : targetConfig.audienceOptions[0] || 'Followers in my niche';
                        let nextWorkInterests = prev.workInterests || '';
                        if (
                          prev.role?.toLowerCase().includes('student') &&
                          !r.toLowerCase().includes('student')
                        ) {
                          if (
                            /\b(exam|exams|finals|midterms|homework|study|campus|college|undergrad)\b/i.test(
                              nextWorkInterests,
                            )
                          ) {
                            nextWorkInterests = '';
                          }
                        }
                        const domain = (prev.businessDomain || prev.doing || '').trim();
                        const nextDomain =
                          domain || targetConfig.domainChips[0] || 'Software/AI';
                        return {
                          ...prev,
                          role: r,
                          businessStage: nextStage,
                          audience: nextAudience,
                          businessDomain: nextDomain,
                          doing: nextDomain,
                          workInterests: nextWorkInterests,
                        };
                      });
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                      studioProfile.role.toLowerCase() === r.toLowerCase()
                        ? 'bg-[#C4A265] text-white border-[#C4A265] font-semibold'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Stage */}
            <div>
              <Label htmlFor="studio-stage-input" className="text-xs font-semibold">
                {roleConfig.stageTitle}
              </Label>
              <Input
                id="studio-stage-input"
                value={studioProfile.businessStage || ''}
                onChange={(e) =>
                  setStudioProfile((p) => ({ ...p, businessStage: e.target.value }))
                }
                placeholder={`e.g. ${roleConfig.stageOptions.slice(0, 3).join(', ')}...`}
                className="mt-1.5 h-9 text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roleConfig.stageOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setStudioProfile((p) => ({ ...p, businessStage: opt }))
                    }
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                      studioProfile.businessStage === opt
                        ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] font-semibold'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Domain */}
            <div>
              <Label htmlFor="studio-domain-input" className="text-xs font-semibold">
                {roleConfig.domainTitle}
              </Label>
              <Input
                id="studio-domain-input"
                value={studioProfile.businessDomain || studioProfile.doing}
                onChange={(e) =>
                  setStudioProfile((p) => ({
                    ...p,
                    businessDomain: e.target.value,
                    doing: e.target.value,
                  }))
                }
                placeholder={roleConfig.domainPlaceholder}
                className="mt-1.5 h-9 text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roleConfig.domainChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setStudioProfile((p) => ({
                        ...p,
                        businessDomain: chip,
                        doing: chip,
                      }))
                    }
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                      (studioProfile.businessDomain || studioProfile.doing) === chip
                        ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] font-semibold'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Themes */}
            <div>
              <Label htmlFor="studio-work-interests" className="text-xs font-semibold">
                {roleConfig.workInterestsLabel}
              </Label>
              <Input
                id="studio-work-interests"
                value={studioProfile.workInterests || ''}
                onChange={(e) =>
                  setStudioProfile((p) => ({ ...p, workInterests: e.target.value }))
                }
                placeholder={roleConfig.workInterestsPlaceholder}
                className="mt-1.5 h-9 text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Optional — work topics and themes you enjoy discussing.
              </p>
            </div>

            {/* Audience */}
            <div>
              <Label htmlFor="studio-audience-input" className="text-xs font-semibold">
                {roleConfig.audienceTitle}
              </Label>
              <Input
                id="studio-audience-input"
                value={studioProfile.audience}
                onChange={(e) =>
                  setStudioProfile((p) => ({ ...p, audience: e.target.value }))
                }
                placeholder={`e.g. ${roleConfig.audienceOptions.slice(0, 3).join(', ')}...`}
                className="mt-1.5 h-9 text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roleConfig.audienceOptions.map((aud) => (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => setStudioProfile((p) => ({ ...p, audience: aud }))}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                      studioProfile.audience === aud
                        ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] font-semibold'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {aud}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Tone */}
            <div>
              <Label htmlFor="studio-tone-input" className="text-xs font-semibold">
                Voice Tone Cadence
              </Label>
              <Input
                id="studio-tone-input"
                value={studioProfile.tone}
                onChange={(e) => setStudioProfile((p) => ({ ...p, tone: e.target.value }))}
                placeholder="e.g. Calm expert, Rebel, Storyteller, Witty..."
                className="mt-1.5 h-9 text-sm"
              />
            </div>

            {/* Style */}
            <div>
              <Label htmlFor="studio-style-input" className="text-xs font-semibold">
                Reading & Content Style
              </Label>
              <Input
                id="studio-style-input"
                value={studioProfile.style}
                onChange={(e) => setStudioProfile((p) => ({ ...p, style: e.target.value }))}
                placeholder="e.g. Short & punchy, Storytelling, Educational..."
                className="mt-1.5 h-9 text-sm"
              />
            </div>

            {/* Interests */}
            <div>
              <Label htmlFor="studio-interests-input" className="text-xs font-semibold">
                Interests Outside Work{' '}
                <span className="font-normal text-muted-foreground">(comma-separated)</span>
              </Label>
              <Input
                id="studio-interests-input"
                value={studioProfile.interests.join(', ')}
                onChange={(e) => {
                  const items = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setStudioProfile((p) => ({ ...p, interests: items }));
                }}
                placeholder="e.g. Books, Gaming, Fitness, Travel..."
                className="mt-1.5 h-9 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Changes apply globally across all Studio AI tools.
            </p>
            <Button
              onClick={handleSaveOnboarding}
              disabled={savingOnboarding}
              className="bg-[#C4A265] hover:bg-[#b09055] text-white font-semibold cursor-pointer gap-2"
            >
              {savingOnboarding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Save Calibrations
                </>
              )}
            </Button>
          </div>
        </PCardBody>
      </PCard>

      {showRetakeModal && (
        <StudioOnboardingModal
          isOpen={showRetakeModal}
          onClose={() => {
            setShowRetakeModal(false);
            loadOnboardingProfile();
          }}
          onComplete={(newProfile: StudioProfile) => {
            if (newProfile) {
              setStudioProfile(newProfile);
              setOnboardingCompleted(true);
            }
            setShowRetakeModal(false);
            loadOnboardingProfile();
          }}
          forceOpen
          isRetake
          initialAnswers={studioProfile}
          userId={userId}
        />
      )}
    </div>
  );
}