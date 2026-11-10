import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IPhonePreview } from '../IPhonePreview';

describe('IPhonePreview connected platforms isolation', () => {
  it('renders "No connected platforms" empty state when connectedPlatforms is empty', () => {
    const setPreviewPlatform = vi.fn();
    render(
      <IPhonePreview
        content="Test content"
        media={[]}
        previewPlatform="linkedin"
        setPreviewPlatform={setPreviewPlatform}
        profileName="Chetna"
        profileHeadline="Professional"
        connectedPlatforms={[]}
        selectedPlatforms={[]}
        drafts={[]}
      />
    );

    // Should NOT show fixed default platforms
    expect(screen.queryByTitle(/Threads/i)).toBeNull();
    expect(screen.queryByTitle(/YouTube/i)).toBeNull();
    expect(screen.queryByTitle(/Bluesky/i)).toBeNull();

    // Should show clear empty state
    expect(screen.getByText(/No connected platforms to preview/i)).toBeDefined();
    expect(screen.getByText(/Connect an account to enable live preview/i)).toBeDefined();
  });

  it('renders ONLY connected platforms when user has connected platforms', () => {
    const setPreviewPlatform = vi.fn();
    render(
      <IPhonePreview
        content="Test content"
        media={[]}
        previewPlatform="linkedin"
        setPreviewPlatform={setPreviewPlatform}
        profileName="Chetna"
        profileHeadline="Professional"
        connectedPlatforms={['linkedin', 'instagram']}
        selectedPlatforms={['linkedin']}
        drafts={[]}
      />
    );

    // Connected platforms should be rendered
    expect(screen.getByTitle(/LinkedIn/i)).toBeDefined();
    expect(screen.getByTitle(/Instagram/i)).toBeDefined();

    // Non-connected platforms must NOT be present
    expect(screen.queryByTitle(/Threads/i)).toBeNull();
    expect(screen.queryByTitle(/YouTube/i)).toBeNull();
    expect(screen.queryByTitle(/Bluesky/i)).toBeNull();
    expect(screen.queryByTitle(/Telegram/i)).toBeNull();
    expect(screen.queryByTitle(/Kick/i)).toBeNull();
    expect(screen.queryByTitle(/Dribbble/i)).toBeNull();
  });
});

