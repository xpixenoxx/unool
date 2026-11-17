'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { SafeJsonLd, buildPersonJsonLd } from '@/components/profile/SafeJsonLd';
import { ProfileContactModal } from '@/components/profile/ProfileContactModal';
import { normalizeTemplateProfile, type NormalizedTemplateProfile } from '@/lib/profile/normalizeTemplateData';
import { pickReadableText, solveAccessibleAccent } from '@/lib/profile/contrast';
import type { ProfileFontPairing, PublicProfile } from '@/components/profile/templates/types';

interface ProfileShellContextValue {
  normalized: NormalizedTemplateProfile;
  openContact: () => void;
}

const ProfileShellContext = createContext<ProfileShellContextValue | null>(null);

export function useProfileShell(): ProfileShellContextValue {
  const ctx = useContext(ProfileShellContext);
  if (!ctx) {
    throw new Error('useProfileShell must be used inside <ProfileTemplateShell>');
  }
  return ctx;
}

const FONT_STACK_MAP: Record<ProfileFontPairing, { body: string; heading: string }> = {
  grotesk: {
    body: 'var(--font-geist), Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    heading: 'var(--font-geist), Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  editorial: {
    body: 'var(--font-plus-jakarta), var(--font-geist), sans-serif',
    heading: 'var(--font-cormorant), Georgia, serif',
  },
  classic: {
    body: 'Georgia, "Times New Roman", serif',
    heading: 'var(--font-cormorant), Georgia, serif',
  },
  mono: {
    body: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
    heading: 'var(--font-syne), var(--font-geist-mono), monospace',
  },
};

export interface ProfileTemplateShellProps {
  profile: PublicProfile;
  surfaceHex: string;
  isDark?: boolean;
  accentColor?: string;
  defaultAccent?: string;
  isPreview?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode | ((ctx: ProfileShellContextValue) => React.ReactNode);
}

export function ProfileTemplateShell({
  profile,
  surfaceHex,
  isDark = false,
  accentColor,
  defaultAccent = '#2563EB',
  isPreview = false,
  className = '',
  style,
  children,
}: ProfileTemplateShellProps) {
  const [contactOpen, setContactOpen] = useState(false);

  const normalized = useMemo(
    () => normalizeTemplateProfile(profile, accentColor, defaultAccent),
    [profile, accentColor, defaultAccent]
  );

  const accessibleAccent = useMemo(
    () => solveAccessibleAccent(normalized.accentColor, surfaceHex, 5.1, defaultAccent),
    [normalized.accentColor, surfaceHex, defaultAccent]
  );
  const accentFg = useMemo(() => pickReadableText(accessibleAccent), [accessibleAccent]);
  const fontStacks = FONT_STACK_MAP[normalized.fontPairing] ?? FONT_STACK_MAP.grotesk;

  const ctxValue = useMemo<ProfileShellContextValue>(
    () => ({
      normalized,
      openContact: () => setContactOpen(true),
    }),
    [normalized]
  );

  const jsonLdData = useMemo(
    () => (isPreview ? null : buildPersonJsonLd(profile)),
    [isPreview, profile]
  );

  return (
    <ProfileShellContext.Provider value={ctxValue}>
      {jsonLdData && <SafeJsonLd data={jsonLdData} />}
      <div
        className={`profile-template-shell overflow-x-clip ${className}`}
        data-font-pairing={normalized.fontPairing}
        data-avatar-style={normalized.avatarStyle}
        data-color-mode={normalized.colorMode}
        style={{
          '--profile-accent': normalized.accentColor,
          '--profile-accent-readable': accessibleAccent,
          '--profile-accent-contrast': accentFg,
          '--profile-surface': surfaceHex,
          '--profile-font-body': fontStacks.body,
          '--profile-font-heading': fontStacks.heading,
          fontFamily: style?.fontFamily ?? fontStacks.body,
          ...style,
        } as React.CSSProperties}
      >
        {typeof children === 'function' ? children(ctxValue) : children}
      </div>
      <ProfileContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        profileName={normalized.name}
        subdomain={normalized.subdomain || undefined}
        accentColor={accessibleAccent}
        isDark={isDark}
        bookingUrl={normalized.bookingUrl}
        conversationUrl={normalized.conversationUrl}
        showEmail={normalized.showEmail}
        email={normalized.email}
        isPreview={isPreview}
      />
    </ProfileShellContext.Provider>
  );
}
