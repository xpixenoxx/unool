'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { BarcodeTicket } from './ui/BarcodeTicket';
import { useFlightPlanDraft } from '@/hooks/flightplan';
import { studioToast } from '@/components/dashboard/StudioToast';
import type { StoryIntakeData, PlatformType } from '@/types/flightplan';
import { B, PLATFORM_META } from './design-tokens';

interface StoryIntakeProps {
  onGenerate: (data: StoryIntakeData) => void;
  isGenerating: boolean;
  connectedPlatforms: PlatformType[];
  onCancel?: () => void;
}

const SAMPLES = [
  {
    name: 'Enterprise to self-serve',
    story: 'We dropped our enterprise plan and launched a $29 self-serve tier.',
    changed: 'Sales cycles dragged on for 90 days. Now people sign up in minutes.',
    wrong: 'We lost our two biggest accounts in the first week.',
    num: '$47k MRR in 60 days',
  },
  {
    name: 'Launch story',
    story: 'After two years of building quietly, we’re finally launching to the public.',
    changed: 'We cut half the features to ship something people could use.',
    wrong: 'Our first beta almost shipped without onboarding.',
    num: '312 people on the waitlist',
  },
];

const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'UTC',
];

export function StoryIntake({
  onGenerate,
  isGenerating,
  connectedPlatforms = [],
  onCancel,
}: StoryIntakeProps) {
  const { draft, saveDraft, clearDraft } = useFlightPlanDraft();

  const nextMonday = useMemo(() => {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const diff = (monday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 0 ? addDays(monday, 7) : monday;
  }, []);

  const [story, setStory] = useState(draft?.coreStory || '');
  const [changed, setChanged] = useState(draft?.whatChanged || '');
  const [wrong, setWrong] = useState(draft?.whatWentWrong || '');
  const [num, setNum] = useState(draft?.oneRealNumber || '');
  const [startDate, setStartDate] = useState(draft?.weekStartDate || format(nextMonday, 'yyyy-MM-dd'));
  const [timezone, setTimezone] = useState(
    draft?.audienceTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  );

  // Default to connected platforms, or fallback platforms if none connected
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(() => {
    if (draft?.selectedPlatforms && draft.selectedPlatforms.length > 0) {
      return draft.selectedPlatforms;
    }
    if (connectedPlatforms && connectedPlatforms.length > 0) {
      return connectedPlatforms;
    }
    return ['instagram', 'facebook', 'linkedin', 'x', 'threads'] as PlatformType[];
  });

  // Sync draft to storage on change
  useEffect(() => {
    saveDraft({
      coreStory: story,
      whatChanged: changed,
      whatWentWrong: wrong,
      oneRealNumber: num,
      weekStartDate: startDate,
      selectedPlatforms,
      audienceTimezone: timezone,
    });
  }, [story, changed, wrong, num, startDate, selectedPlatforms, timezone, saveDraft]);

  const handleApplySample = (sampleIdx: number) => {
    const s = SAMPLES[sampleIdx];
    if (!s) return;
    setStory(s.story);
    setChanged(s.changed);
    setWrong(s.wrong);
    setNum(s.num);
  };

  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(p)) {
        if (prev.length === 1) {
          studioToast.error('Please keep at least one platform selected.');
          return prev;
        }
        return prev.filter(x => x !== p);
      } else {
        return [...prev, p];
      }
    });
  };

  const handleGenerateClick = () => {
    if (!story.trim()) {
      studioToast.error('Tell us the story first.');
      return;
    }

    onGenerate({
      coreStory: story.trim(),
      whatChanged: changed.trim(),
      whatWentWrong: wrong.trim(),
      oneRealNumber: num.trim(),
      weekStartDate: startDate,
      selectedPlatforms,
      audienceTimezone: timezone,
    });
  };

  const newTicketId = useMemo(() => {
    return `FP-${startDate.slice(5).replace('-', '')}-NEW`;
  }, [startDate]);

  const allAvailablePlatforms: PlatformType[] = [
    'instagram',
    'linkedin',
    'x',
    'threads',
    'facebook',
    'bluesky',
    'youtube',
  ];

  return (
    <div className="fp-tkt" style={{ ['--c' as any]: 'var(--ac)', ['--sw' as any]: '340px' }}>
      {/* ─── Left Main Ticket Section ─── */}
      <div className="main">
        <div className="fp-air">
          <span>
            <i>✈</i> Boarding pass, new flight plan
          </span>
          <span>Step 1 of 3: your story</span>
        </div>

        <h2 className="fp-big" style={{ marginTop: 12 }}>
          What’s the story this week?
        </h2>
        <p className="fp-sub">
          One honest turning point is enough. We turn it into seven days of posts, pick the times, and let you review
          everything before it’s scheduled.
        </p>

        {/* Core Story Field */}
        <div className="fp-lb">
          <span>Your story, in a sentence or two</span>
          <span>Required</span>
        </div>
        <textarea
          rows={3}
          className="fp-bigt"
          value={story}
          onChange={e => setStory(e.target.value)}
          placeholder="e.g. We dropped our enterprise plan and launched a $29 self-serve tier."
        />

        {/* Sample story pills */}
        <div className="fp-chs">
          <span className="fp-hint">No idea yet? Try an example:</span>
          {SAMPLES.map((s, idx) => (
            <button
              key={s.name}
              type="button"
              className="fp-ch"
              onClick={() => handleApplySample(idx)}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* 3 Detail inputs */}
        <div className="fp-lb" style={{ marginTop: 18 }}>
          <span>Three optional details make the posts sharper</span>
        </div>

        <div className="fp-g3">
          <div>
            <label>What changed recently?</label>
            <textarea
              rows={3}
              value={changed}
              onChange={e => setChanged(e.target.value)}
              placeholder="A new plan, a pivot, a launch"
            />
          </div>
          <div>
            <label>What was the challenge?</label>
            <textarea
              rows={3}
              value={wrong}
              onChange={e => setWrong(e.target.value)}
              placeholder="A lost deal, a bug, a hard lesson"
            />
          </div>
          <div>
            <label>One real number</label>
            <textarea
              rows={3}
              value={num}
              onChange={e => setNum(e.target.value)}
              placeholder="$47k MRR, or 35% less churn"
            />
          </div>
        </div>
      </div>

      {/* ─── Right Ticket Stub Section ─── */}
      <div className="stub">
        <div className="fp-fld">
          <span>Route</span>
          <b>Your story ✈ 7 posts</b>
          <em>One post for each day of the week.</em>
        </div>

        <div className="fp-fld">
          <span>Week starts on</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div className="fp-fld">
          <span>Audience timezone</span>
          <select value={timezone} onChange={e => setTimezone(e.target.value)}>
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <em>We pick post times for this timezone.</em>
        </div>

        <div className="fp-fld">
          <span>Posting to</span>
          <div className="fp-chs" style={{ marginTop: 6 }}>
            {allAvailablePlatforms.map(p => {
              const meta = PLATFORM_META[p];
              const isSelected = selectedPlatforms.includes(p);
              const isConnected = connectedPlatforms.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`fp-ch ${isSelected ? 'on' : ''}`}
                  title={isConnected ? `${meta?.name || p} (Connected)` : `${meta?.name || p}`}
                >
                  {meta?.name || p}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button
            type="button"
            className="fp-btn gold"
            disabled={isGenerating || !story.trim()}
            onClick={handleGenerateClick}
          >
            {isGenerating ? 'Generating…' : 'Generate flight plan ✦'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="fp-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>

        <BarcodeTicket code={newTicketId} note="New week" />
      </div>
    </div>
  );
}

export default StoryIntake;