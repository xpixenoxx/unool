import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileCompletionQuest } from '../ProfileCompletionQuest';

describe('ProfileCompletionQuest', () => {
  const incompleteProfile = {
    name: 'Twinkle',
    subdomain: 'twinkle',
    headline: 'Creative Strategist',
    status: 'draft' as const,
    updatedAt: new Date().toISOString(),
    links: [],
    proofPoints: [],
  };

  it('renders 50% completion when 3 of 6 steps are completed', () => {
    render(
      <ProfileCompletionQuest
        profile={incompleteProfile}
        recentPosts={[]}
      />
    );

    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('3 of 6 steps done')).toBeDefined();
    expect(screen.getByText('3 left')).toBeDefined();
  });

  it('renders the next pending step action chip when incomplete', () => {
    render(
      <ProfileCompletionQuest
        profile={incompleteProfile}
        recentPosts={[]}
      />
    );

    // The first missing step for incompleteProfile is links (Social & Portfolio Links)
    expect(screen.getByText(/Next: Social & Portfolio Links/i)).toBeDefined();
    const actionBtn = screen.getByRole('link', { name: /Add Links/i });
    expect(actionBtn.getAttribute('href')).toBe('/dashboard/profile?tab=links&focus=links');
  });

  it('opens quest dialog showing incomplete steps with direct redirection URLs', () => {
    render(
      <ProfileCompletionQuest
        profile={incompleteProfile}
        recentPosts={[]}
      />
    );

    const viewStepsBtn = screen.getByRole('button', { name: /View steps/i });
    fireEvent.click(viewStepsBtn);

    // Dialog title
    expect(screen.getByText('Your Profile Readiness')).toBeDefined();
    expect(screen.getByText('Social & Portfolio Links')).toBeDefined();
    expect(screen.getByText('Proof Points & Credibility')).toBeDefined();
    expect(screen.getByText('First Broadcast Publication')).toBeDefined();

    // Redirection links
    const addProofsLink = screen.getByRole('link', { name: /Add Proofs/i });
    expect(addProofsLink.getAttribute('href')).toBe('/dashboard/profile?tab=links&focus=proofPoints');

    const draftBroadcastLink = screen.getByRole('link', { name: /Draft Broadcast/i });
    expect(draftBroadcastLink.getAttribute('href')).toBe('/dashboard/studio');
  });

  it('renders 100% Ready when all steps are completed', () => {
    const fullProfile = {
      name: 'Usha',
      subdomain: 'usha',
      headline: 'Founder & Builder',
      status: 'published' as const,
      updatedAt: new Date().toISOString(),
      links: [{ label: 'GitHub', url: 'https://github.com', type: 'social' }],
      proofPoints: [{ type: 'Projects', value: '10+' }],
    };

    const posts = [
      {
        id: 'p1',
        content: 'Hello world broadcast',
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(
      <ProfileCompletionQuest
        profile={fullProfile}
        recentPosts={posts}
      />
    );

    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.getByText('100% Ready')).toBeDefined();
    expect(screen.getByText('Your profile is fully set up!')).toBeDefined();
  });
});
