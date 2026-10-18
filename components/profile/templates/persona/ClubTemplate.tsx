'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ReducedMotionProvider } from './hooks/useReducedMotion';
import { ClubToastProvider, useClubToast } from './sections/ClubToastStack';
import { generateVCard } from './utils/vcard';

// Lazy load heavy components with SSR disabled
const ClubHero = dynamic(() => import('./sections/ClubHero').then(m => m.ClubHero), { ssr: false, loading: () => null });
const ClubManifesto = dynamic(() => import('./sections/ClubManifesto').then(m => m.ClubManifesto), { ssr: false, loading: () => null });
const ClubProofLedger = dynamic(() => import('./sections/ClubProofLedger').then(m => m.ClubProofLedger), { ssr: false, loading: () => null });
const ClubCuratedWorks = dynamic(() => import('./sections/ClubCuratedWorks').then(m => m.ClubCuratedWorks), { ssr: false, loading: () => null });
const ClubSocialsMatrix = dynamic(() => import('./sections/ClubSocialsMatrix').then(m => m.ClubSocialsMatrix), { ssr: false, loading: () => null });
const ClubOpenToBadges = dynamic(() => import('./sections/ClubOpenToBadges').then(m => m.ClubOpenToBadges), { ssr: false, loading: () => null });
const ClubRecentActivity = dynamic(() => import('./sections/ClubRecentActivity').then(m => m.ClubRecentActivity), { ssr: false, loading: () => null });
const ClubContactDrawer = dynamic(() => import('./sections/ClubContactDrawer').then(m => m.ClubContactDrawer), { ssr: false, loading: () => null });
const ClubActionDock = dynamic(() => import('./sections/ClubActionDock').then(m => m.ClubActionDock), { ssr: false, loading: () => null });
const ClubTopNav = dynamic(() => import('./sections/ClubTopNav').then(m => m.ClubTopNav), { ssr: false, loading: () => null });

import { adaptPublicProfileToClub, type ClubTemplateData } from './adaptClub';
import type { TemplateProps } from './types';

/* ============================================================
   CLUB TEMPLATE — Main Entry Point
   Avant-garde luxury fashion house / VIP club aesthetic
   ============================================================ */

function ClubTemplateInner({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  const [clubData, setClubData] = useState<ClubTemplateData | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const { addToast } = useClubToast();

  // Adapt profile data
  useEffect(() => {
    setClubData(adaptPublicProfileToClub(profile));
  }, [profile]);

  const handleBookSession = useCallback(() => {
    setContactOpen(true);
  }, []);

  const handleDownloadVCard = useCallback(() => {
    if (clubData) {
      const vcard = generateVCard(clubData);
      const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clubData.handle || clubData.name}.vcf`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'vCard downloaded', description: 'Contact saved to your device' });
    }
  }, [clubData, addToast]);

  const handleCopyEmail = useCallback(() => {
    if (clubData?.email) {
      navigator.clipboard.writeText(clubData.email);
      addToast({ type: 'success', title: 'Email copied', description: `${clubData.email} copied to clipboard` });
    }
  }, [clubData, addToast]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: clubData?.name,
        text: clubData?.tagline,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast({ type: 'success', title: 'Link copied', description: 'Profile URL copied to clipboard' });
    }
  }, [clubData, addToast]);

  const handleContactSubmit = useCallback(async (data: ClubTemplateData) => {
    // Submit to API
    const response = await fetch('/api/profile/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, profileHandle: clubData?.handle }),
    });
    if (!response.ok) throw new Error('Failed to submit');
  }, [clubData]);

  if (!clubData) return null;

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <>
      <style jsx global>{`
        .club-template {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: oklch(0.03 0.02 240);
          color: oklch(0.98 0 0);
          min-height: 100vh;
        }
        .club-template-desktop {
          display: grid;
          grid-template-rows: auto 1fr auto;
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
        }
        .club-template-mobile {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .club-content-panel {
          position: fixed;
          top: 72px;
          right: 0;
          bottom: 80px;
          width: 480px;
          max-width: 100vw;
          overflow-y: auto;
          overscroll-behavior: contain;
          scroll-snap-type: y mandatory;
          padding-bottom: var(--space-8);
        }
        @media (max-width: 1440px) { .club-content-panel { width: 440px; } }
        @media (max-width: 1200px) { .club-content-panel { width: 400px; } }
        .club-section {
          scroll-snap-align: start;
          min-height: 100vh;
          padding: var(--space-8) var(--space-6);
        }
        @media (max-width: 1023px) {
          .club-content-panel { display: none; }
          .club-section { min-height: auto; }
        }
      `}</style>

      <div className="club-template">
        {isDesktop ? (
          <>
            {/* Desktop: Zero-scroll cockpit */}
            <ClubTopNav profile={{ name: clubData.name, handle: clubData.handle }} />

            <div className="club-template-desktop">
              {/* Hero with 3D centerpiece */}
              <div style={{ position: 'relative', minHeight: '100vh' }}>
                <ClubHero profile={{ name: clubData.name, tagline: clubData.tagline }} />
              </div>

              {/* Right Content Panel */}
              <div className="club-content-panel" role="main" aria-label="Content sections">
                <ClubManifesto bio={clubData.bio} manifesto={clubData.manifesto} />
                <ClubProofLedger proofPoints={clubData.proofPoints} />
                <ClubCuratedWorks projects={clubData.projects} />
                <ClubSocialsMatrix socialLinks={clubData.socialLinks} />
                <ClubOpenToBadges openTo={clubData.openTo} />
                <ClubRecentActivity activities={clubData.activities} profile={{ name: clubData.name, avatar: clubData.avatar }} />
              </div>

              {/* Action Dock */}
              <ClubActionDock
                profile={{ name: clubData.name, handle: clubData.handle, email: clubData.email, availability: clubData.availability }}
                onBookSession={handleBookSession}
                onDownloadVCard={handleDownloadVCard}
                onCopyEmail={handleCopyEmail}
                onShare={handleShare}
              />
            </div>
          </>
        ) : (
          <>
            {/* Mobile: Vertical scroll */}
            <ClubTopNav profile={{ name: clubData.name, handle: clubData.handle }} />

            <div className="club-template-mobile">
              <ClubHero profile={{ name: clubData.name, tagline: clubData.tagline }} />
              <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
                <ClubManifesto bio={clubData.bio} manifesto={clubData.manifesto} />
                <ClubProofLedger proofPoints={clubData.proofPoints} />
                <ClubCuratedWorks projects={clubData.projects} />
                <ClubSocialsMatrix socialLinks={clubData.socialLinks} />
                <ClubOpenToBadges openTo={clubData.openTo} />
                <ClubRecentActivity activities={clubData.activities} profile={{ name: clubData.name, avatar: clubData.avatar }} />
              </main>
            </div>
          </>
        )}

        {/* Contact Drawer */}
        <ClubContactDrawer
          isOpen={contactOpen}
          onClose={() => setContactOpen(false)}
          profile={{ name: clubData.name, handle: clubData.handle, email: clubData.email, location: clubData.location, calendlyUrl: clubData.calendlyUrl }}
          onSubmit={handleContactSubmit}
        />
      </div>
    </>
  );
}

/* ============================================================
   EXPORT WRAPPER
   ============================================================ */

export function ClubTemplate(props: TemplateProps) {
  return (
    <ReducedMotionProvider>
      <ClubToastProvider>
        <ClubTemplateInner {...props} />
      </ClubToastProvider>
    </ReducedMotionProvider>
  );
}