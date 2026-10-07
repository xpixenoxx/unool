'use client';

import React from 'react';

/* ─────────────────────────────────────────────────────────────
   Open To — Intent Definitions
   ───────────────────────────────────────────────────────────── */

export type OpenToIntentId =
  | 'coffee-chats'
  | 'open-to-work'
  | 'freelance'
  | 'collaborations'
  | 'cofounding'
  | 'speaking'
  | 'mentoring'
  | 'hiring';

export interface OpenToIntent {
  id: OpenToIntentId;
  label: string;
  /** Foreground / icon color */
  color: string;
  /** Soft background tint */
  bg: string;
  /** Custom SVG icon rendered inline */
  icon: React.FC<{ size?: number; className?: string }>;
}

/* ─── Custom SVG Icons ─────────────────────────────────────── */

const CoffeeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M3 7h10v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M13 9h1.5a2.5 2.5 0 0 1 0 5H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6 3v2M8 2v3M10 3v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const BriefcaseIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <rect x="2" y="6" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h3A1.5 1.5 0 0 1 13 4.5V6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M2 11h16" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="10" cy="11" r="1.2" fill="currentColor" />
  </svg>
);

const CodeBracketIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M6 6 2.5 10 6 14M14 6l3.5 4L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 3 9 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const HandshakeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M2 10.5 6.5 6l2.5 1 3-2L16 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 8.5l-4 4.5-2.5-1L6 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 10.5 6 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const RocketIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M10 2c3 2 5 5.5 5 10H5C5 7.5 7 4 10 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="10" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 12c-2 .5-3 2-3 3.5h3M15 12c2 .5 3 2 3 3.5h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M8 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const MicrophoneIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 10a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10 16v2M8 18h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CompassIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <polygon points="8,12 6.5,6.5 12,8 13.5,13.5" fill="currentColor" opacity="0.25" />
    <polygon points="8,12 6.5,6.5 12,8" fill="currentColor" />
  </svg>
);

const TargetIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="10" cy="10" r="1.2" fill="currentColor" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/* ─── Intent Registry ──────────────────────────────────────── */

export const OPEN_TO_INTENTS: OpenToIntent[] = [
  { id: 'coffee-chats',    label: 'Coffee Chats',       color: '#946B2D', bg: '#FBF5EB', icon: CoffeeIcon },
  { id: 'open-to-work',    label: 'Open to Work',       color: '#0C6B6E', bg: '#E4F5F5', icon: BriefcaseIcon },
  { id: 'freelance',       label: 'Freelance Projects',  color: '#4338CA', bg: '#EDEAFF', icon: CodeBracketIcon },
  { id: 'collaborations',  label: 'Collaborations',      color: '#B84215', bg: '#FEF0E7', icon: HandshakeIcon },
  { id: 'cofounding',      label: 'Co-founding',         color: '#6D28D9', bg: '#F1EAFE', icon: RocketIcon },
  { id: 'speaking',        label: 'Speaking',            color: '#3E5064', bg: '#ECF1F7', icon: MicrophoneIcon },
  { id: 'mentoring',       label: 'Mentoring',           color: '#1A6B3C', bg: '#E8F7EE', icon: CompassIcon },
  { id: 'hiring',          label: 'Hiring',              color: '#8B5E1A', bg: '#FDF7EA', icon: TargetIcon },
];

export function getIntentById(id: string): OpenToIntent | undefined {
  return OPEN_TO_INTENTS.find(i => i.id === id);
}

/* ─────────────────────────────────────────────────────────────
   OpenToBadges — Renders a row of intent badges
   Used on public profile templates
   ───────────────────────────────────────────────────────────── */

interface OpenToBadgesProps {
  intents: string[];
  /** Compact mode for tight spaces (smaller text, tighter padding) */
  compact?: boolean;
  /** Override text color for dark-themed templates */
  darkMode?: boolean;
  className?: string;
}

export function OpenToBadges({ intents, compact = false, darkMode = false, className = '' }: OpenToBadgesProps) {
  if (!intents || intents.length === 0) return null;

  const resolvedIntents = intents
    .map(id => getIntentById(id))
    .filter((i): i is OpenToIntent => i !== undefined);

  if (resolvedIntents.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {resolvedIntents.map(intent => {
        const Icon = intent.icon;
        return (
          <span
            key={intent.id}
            className={`inline-flex items-center gap-1 rounded-full font-medium transition-transform hover:scale-[1.03] ${
              compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
            }`}
            style={{
              backgroundColor: darkMode ? `${intent.color}22` : intent.bg,
              color: darkMode ? `${intent.color}dd` : intent.color,
              border: `1px solid ${darkMode ? `${intent.color}33` : `${intent.color}18`}`,
              letterSpacing: '0.01em',
            }}
          >
            <Icon size={compact ? 11 : 13} />
            {intent.label}
          </span>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   OpenToSelector — Editor component for picking intents
   Used in PresenceClient
   ───────────────────────────────────────────────────────────── */

interface OpenToSelectorProps {
  selected: string[];
  onChange: (intents: string[]) => void;
  /** Design system colors from the editor */
  colors: {
    bg: string;
    card: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    accentBg: string;
  };
}

export function OpenToSelector({ selected, onChange, colors }: OpenToSelectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg" style={{ backgroundColor: colors.accentBg }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ color: colors.accent }}>
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: colors.text }}>Open to</h3>
          <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
            Tell visitors what you're available for right now.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {OPEN_TO_INTENTS.map(intent => {
          const isSelected = selected.includes(intent.id);
          const Icon = intent.icon;

          return (
            <button
              key={intent.id}
              onClick={() => toggle(intent.id)}
              className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium transition-all duration-150"
              style={{
                padding: '6px 12px',
                backgroundColor: isSelected ? intent.bg : colors.bg,
                color: isSelected ? intent.color : colors.textMuted,
                border: `1.5px solid ${isSelected ? `${intent.color}40` : colors.border}`,
                boxShadow: isSelected ? `0 1px 4px ${intent.color}15` : 'none',
                transform: isSelected ? 'scale(1)' : 'scale(1)',
              }}
            >
              <Icon size={14} />
              {intent.label}
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 2 }}>
                  <path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="pt-1">
          <p className="text-[11px]" style={{ color: colors.textMuted }}>
            {selected.length} active · Visitors will see these on your profile
          </p>
        </div>
      )}
    </div>
  );
}
