import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import {
  getCachedPublicProfileForSsr,
  resolveAuthorizedPublicProfile,
} from '@/lib/profile/publicProfilePayload';
import { PublicProfileClient } from '@/components/profile/PublicProfileClient';

export const revalidate = 60;

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const cleanSubdomain = decodeURIComponent(subdomain || '').trim().toLowerCase();

  if (!cleanSubdomain) {
    notFound();
  }

  // Fast cached SSR/ISR path for public and unlisted profiles (never touches cookies or returns private profiles)
  let profilePayload = await getCachedPublicProfileForSsr(cleanSubdomain);

  // If missing from public cache, check if this is a private profile authorized for the current session
  if (!profilePayload) {
    let viewerUserId: string | undefined;
    try {
      const user = await getUser();
      viewerUserId = user?.id;
    } catch {
      viewerUserId = undefined;
    }

    if (viewerUserId) {
      const authorized = await resolveAuthorizedPublicProfile(cleanSubdomain, {
        userId: viewerUserId,
      });
      if (authorized.status === 'found') {
        profilePayload = authorized.payload;
      }
    }
  }

  if (!profilePayload) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
        </div>
      }
    >
      <PublicProfileClient profile={profilePayload} />
    </Suspense>
  );
}
