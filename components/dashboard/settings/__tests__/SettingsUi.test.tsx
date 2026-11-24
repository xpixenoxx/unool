import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SettingsClient from '@/app/dashboard/settings/SettingsClient';
import { AccountTab } from '../tabs/AccountTab';
import { WorkspaceTab } from '../tabs/WorkspaceTab';
import type { SettingsInitialData } from '../types';

(globalThis as unknown as { React: typeof React }).React = React;

const { mockReplace, mockPush, mockRefresh, mockSearchParamsGet, mockListFactors } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSearchParamsGet: vi.fn(),
  mockListFactors: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/dashboard/settings',
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

vi.mock('@/lib/supabase/browser', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      mfa: {
        listFactors: mockListFactors,
      },
    },
  }),
}));

vi.mock('@/components/dashboard/PlatformConnections', () => ({
  PlatformConnections: () => <div data-testid="platform-connections-mock">Platform Connections</div>,
}));

vi.mock('@/components/dashboard/StudioOnboardingModal', () => ({
  StudioOnboardingModal: () => null,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

function makeInitialData(overrides: Partial<SettingsInitialData> = {}): SettingsInitialData {
  return {
    userId: 'user-1',
    workspaceId: 'ws-1',
    isImpersonated: false,
    account: {
      id: 'user-1',
      email: 'creator@example.com',
      fullName: 'Asha Rao',
      avatarUrl: null,
      createdAt: '2026-01-01T00:00:00Z',
      emailConfirmedAt: '2026-01-01T00:00:00Z',
      mfaEnabled: false,
    },
    preferences: {
      theme: 'system',
      timezone: 'UTC',
      timeFormat: '12h',
      dateFormat: 'DD/MM/YYYY',
      currencyDisplay: 'INR',
      digestFrequency: 'weekly',
      notifyTokenExpiry: true,
      notifySecurityAlerts: true,
      notifyPublishing: true,
      aiPersonalizationEnabled: true,
    },
    workspace: {
      id: 'ws-1',
      name: 'Asha Studio',
      plan: 'pro',
      ownerId: 'user-1',
    },
    callerRole: 'owner',
    members: [
      {
        id: 'mem-owner',
        userId: 'user-1',
        email: 'creator@example.com',
        fullName: 'Asha Rao',
        role: 'owner',
        status: 'active',
        invitedAt: '2026-01-01T00:00:00Z',
        joinedAt: '2026-01-01T00:00:00Z',
        isOwner: true,
      },
      {
        id: 'mem-editor',
        userId: 'user-2',
        email: 'editor@example.com',
        fullName: 'Ravi Kumar',
        role: 'editor',
        status: 'active',
        invitedAt: '2026-01-02T00:00:00Z',
        joinedAt: '2026-01-02T00:00:00Z',
        isOwner: false,
      },
    ],
    workspaces: [
      {
        workspaceId: 'ws-1',
        name: 'Asha Studio',
        plan: 'pro',
        role: 'owner',
        isOwner: true,
      },
      {
        workspaceId: 'ws-2',
        name: 'Second Brand',
        plan: 'spark',
        role: 'editor',
        isOwner: false,
      },
    ],
    billing: {
      planId: 'pro',
      planName: 'Pro',
      status: 'active',
      billingCycle: 'monthly',
      currentPeriodEnd: '2026-12-01T00:00:00Z',
      cancelAtPeriodEnd: false,
      isFreeTier: false,
    },
    studioProfile: {
      role: 'Creator',
      doing: 'Building Unool Studio',
      audience: 'Design founders',
      tone: 'Calm expert',
      style: 'Short & punchy',
      interests: ['Books'],
      completedAt: '2026-01-01T00:00:00Z',
    },
    studioVersion: 1,
    studioCompleted: true,
    connectionsSummary: {},
    publicApiEnabled: false,
    ...overrides,
  };
}

describe('Settings UI workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
    mockListFactors.mockResolvedValue({ data: { totp: [], phone: [] }, error: null });
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sessions: [], events: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as any;
  });

  it('renders 2-group / 6-section Settings navigation and mobile section select', () => {
    render(<SettingsClient initialData={makeInitialData()} />);

    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    expect(within(nav).getByText('Personal')).toBeDefined();
    expect(within(nav).getByText('Workspace')).toBeDefined();

    const buttons = within(nav).getAllByRole('button');
    expect(buttons).toHaveLength(6);

    const mobileSelect = screen.getByLabelText(/Settings Section \(/i) as HTMLSelectElement;
    const optionValues = Array.from(mobileSelect.options).map((o) => o.value);
    expect(optionValues).toEqual([
      'account',
      'security',
      'notifications',
      'channels',
      'ai-voice',
      'workspace',
    ]);
  });

  it('normalizes legacy ?tab=persona query to ?tab=ai-voice cleanly', async () => {
    mockSearchParamsGet.mockImplementation((k: string) => (k === 'tab' ? 'persona' : null));
    render(<SettingsClient initialData={makeInitialData()} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/settings?tab=ai-voice', {
        scroll: false,
      });
    });
  });

  it('guards unsaved changes with UnsavedChangesDialog when switching sections', async () => {
    render(<SettingsClient initialData={makeInitialData()} />);

    const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Asha Edited' } });

    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    const navButtons = within(nav).getAllByRole('button');
    fireEvent.click(navButtons[1]); // Switch to Security

    expect(await screen.findByText('Unsaved changes')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/settings?tab=security', {
        scroll: false,
      });
    });
  });

  it('requires typing DELETE to confirm permanent account deletion and surfaces 409 ownership guidance', async () => {
    const onNavigateTab = vi.fn();
    const initial = makeInitialData();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'Transfer workspace ownership to another member before deleting your account.',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    ) as any;

    render(
      <AccountTab
        account={initial.account}
        preferences={initial.preferences}
        isImpersonated={false}
        onAccountUpdated={vi.fn()}
        onPreferencesUpdated={vi.fn()}
        onNavigateTab={onNavigateTab}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete My Account' }));
    const confirmInput = await screen.findByLabelText(/Type DELETE to confirm/i);
    const deleteConfirmBtn = screen.getByRole('button', { name: 'Permanently Delete Account' }) as HTMLButtonElement;

    expect(deleteConfirmBtn.disabled).toBe(true);

    fireEvent.change(confirmInput, { target: { value: 'DELETE' } });
    expect(deleteConfirmBtn.disabled).toBe(false);

    fireEvent.click(deleteConfirmBtn);

    const workspaceJump = await screen.findByRole('button', { name: /Go to Workspace & Team/i });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user/delete',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })
    );

    fireEvent.click(workspaceJump);
    expect(onNavigateTab).toHaveBeenCalledWith('workspace');
  });

  it('supports workspace switching, owner subscription cancel dialog, and ownership transfer confirmation', async () => {
    const initial = makeInitialData();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/workspace') {
        return Promise.resolve(
          new Response(JSON.stringify({ workspace: initial.workspace, members: initial.members }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }) as any;

    render(
      <WorkspaceTab
        currentUserId={initial.userId}
        workspace={initial.workspace}
        callerRole="owner"
        members={initial.members}
        workspaces={initial.workspaces}
        billing={initial.billing}
        isImpersonated={false}
        onWorkspaceUpdated={vi.fn()}
      />
    );

    // Switch workspace
    fireEvent.click(screen.getByRole('button', { name: 'Switch' }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/workspace/switch',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ workspaceId: 'ws-2' }),
        })
      );
    });

    // Cancel plan renewal
    fireEvent.click(screen.getByRole('button', { name: 'Cancel plan renewal' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm cancellation' }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/billing/cancel',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Transfer ownership confirmation requires typing TRANSFER
    fireEvent.click(screen.getByRole('button', { name: 'Transfer ownership' }));
    const transferInput = await screen.findByLabelText(/Type TRANSFER to confirm/i);
    const submitBtns = screen.getAllByRole('button', { name: 'Transfer ownership' });
    const modalSubmitBtn = submitBtns[submitBtns.length - 1] as HTMLButtonElement;
    expect(modalSubmitBtn.disabled).toBe(true);

    fireEvent.change(transferInput, { target: { value: 'TRANSFER' } });
    expect(modalSubmitBtn.disabled).toBe(false);
    fireEvent.click(modalSubmitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/workspace/transfer-ownership',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ targetUserId: 'user-2' }),
        })
      );
    });
  });

  it('loads SecurityTab once without an infinite MFA-callback blink or pulse loop', async () => {
    mockSearchParamsGet.mockImplementation((k: string) => (k === 'tab' ? 'security' : null));
    mockListFactors.mockResolvedValue({
      data: {
        totp: [
          {
            id: 'factor-1',
            friendly_name: '1Password',
            factor_type: 'totp',
            status: 'verified',
          },
        ],
        phone: [],
      },
      error: null,
    });

    const { container } = render(<SettingsClient initialData={makeInitialData()} />);

    await screen.findByText('1Password');
    expect((await screen.findAllByText('2FA Active')).length).toBeGreaterThanOrEqual(2);
    await screen.findByText(/Only your current authenticated browser session is active/i);

    await new Promise((r) => setTimeout(r, 80));

    expect(mockListFactors).toHaveBeenCalledTimes(1);
    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(fetchCalls.filter((u) => u === '/api/auth/sessions')).toHaveLength(1);
    expect(fetchCalls.filter((u) => u === '/api/auth/security-events')).toHaveLength(1);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(0);
  });
});