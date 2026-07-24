'use client';

import { useEffect, useState, Suspense } from 'react';
import { ProfilePreview } from '@/components/profile/ProfilePreview';

interface Profile {
  id: string;
  workspaceId: string;
  userId: string;
  subdomain: string;
  name: string | null;
  headline: string | null;
  bio: string | null;
  role: string | null;
  company: string | null;
  links: any[];
  proofPoints: any[];
  theme: any;
  sourceUrl: string | null;
  extractionPromptVersion: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function ProfileLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-3xl" style={{ background: 'linear-gradient(135deg, var(--primary), var(--purple))' }} />
        <p className="text-muted-foreground font-medium">Loading profile...</p>
      </div>
    </div>
  );
}

function ProfileNotFound({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center p-10">
        <h1 className="text-3xl font-bold text-foreground mb-3">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">
          {error === 'Profile not found'
            ? 'This profile doesn\'t exist yet. Check the URL or create your own.'
            : 'Unable to load profile. Please try again later.'}
        </p>
        <a href="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Create Your Profile
        </a>
      </div>
    </div>
  );
}

export default function PublicProfilePage({ params }: { params: Promise<{ subdomain: string }> }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      const { subdomain } = await params;
      console.log('[PublicProfile] Fetching profile for:', subdomain);
      try {
        const response = await fetch(`/api/profile/${subdomain}`, {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('[PublicProfile] Response status:', response.status);
        if (!response.ok) {
          if (response.status === 404) {
            if (!cancelled) setError('Profile not found');
          } else {
            const text = await response.text();
            console.error('[PublicProfile] Error response:', text);
            if (!cancelled) setError('Failed to load profile');
          }
          return;
        }
        const data = await response.json();
        console.log('[PublicProfile] Profile data received:', { subdomain: data.subdomain, name: data.name });
        if (!cancelled) setProfile(data);
      } catch (err) {
        console.error('[PublicProfile] Fetch error:', err);
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return <ProfileLoading />;
  }

  if (error || !profile) {
    return <ProfileNotFound error={error || 'Profile not found'} />;
  }

  // Get template from profile theme
  const templateId = profile.theme?.template || 'essential-standard';

  return (
    <ProfilePreview
      templateId={templateId}
      profile={profile}
      isPreview={false}
    />
  );
}