import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { UnoolCheckoutModal } from '../UnoolCheckoutModal';
import type { PlanData } from '../UnoolCheckoutModal';

// Mock Cashfree JS SDK
vi.mock('@cashfreepayments/cashfree-js', () => ({
  load: vi.fn().mockResolvedValue({
    checkout: vi.fn().mockResolvedValue({}),
  }),
}));

const mockPlan: PlanData = {
  id: 'pro',
  name: 'Pro',
  tagline: 'Scale your influence with AI superpowers.',
  isFreeTier: false,
  sortOrder: 2,
  templateCount: 16,
  pricing: {
    currency: 'INR',
    monthly: 199900,
    annual: 1999000,
    annualMonthly: 166500,
    monthlyDisplay: '₹1,999',
    annualDisplay: '₹19,990',
    annualMonthlyDisplay: '₹1,665',
  },
  limits: {
    posts_per_month: -1,
    channels: 10,
    ai_credits_per_month: 500,
    ig_comments_per_month: 2500,
    linkedin_comments_per_month: 1000,
    team_seats: 3,
    brand_voices: 5,
    analytics_retention_days: 365,
    workspaces: 3,
  },
  features: {
    custom_domain: true,
    badge_removal: true,
    dm_concierge: true,
    dm_concierge_full: true,
    lead_scoring: true,
    follow_to_unlock: true,
    flightplan_ai: true,
    first_comment: true,
    content_humanizer: true,
    auto_hide_spam: true,
    csv_export: true,
    white_label: false,
    api_access: false,
    approval_workflows: false,
    priority_support: true,
  },
};

describe('UnoolCheckoutModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders plan details and value highlights correctly without throwing', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const handleFailed = vi.fn();

    render(
      <UnoolCheckoutModal
        isOpen={true}
        onClose={handleClose}
        plan={mockPlan}
        billingCycle="monthly"
        paymentSessionId="session_mock_12345"
        cfOrderId="order_mock_12345"
        onPaymentSuccess={handleSuccess}
        onPaymentFailed={handleFailed}
      />
    );

    // Plan name and pricing display
    expect(screen.getByText('Pro Tier')).toBeDefined();
    expect(screen.getByText('₹1,999')).toBeDefined();
    expect(screen.getByText('/month')).toBeDefined();
    expect(screen.getByText('Custom domain support (yourbrand.com)')).toBeDefined();

    // Verify isolated embed target exists
    const embedTarget = document.querySelector('.unool-cf-embed-target');
    expect(embedTarget).not.toBeNull();
    // Verify React has not inserted children into the pure DOM target
    expect(embedTarget?.children.length).toBe(0);
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();

    render(
      <UnoolCheckoutModal
        isOpen={true}
        onClose={handleClose}
        plan={mockPlan}
        billingCycle="monthly"
        paymentSessionId="session_mock_12345"
        cfOrderId="order_mock_12345"
        onPaymentSuccess={vi.fn()}
        onPaymentFailed={vi.fn()}
      />
    );

    const closeBtn = screen.getByLabelText('Close checkout');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('unmounts cleanly without throwing DOMException removeChild error', () => {
    const { unmount } = render(
      <UnoolCheckoutModal
        isOpen={true}
        onClose={vi.fn()}
        plan={mockPlan}
        billingCycle="monthly"
        paymentSessionId="session_mock_12345"
        cfOrderId="order_mock_12345"
        onPaymentSuccess={vi.fn()}
        onPaymentFailed={vi.fn()}
      />
    );

    // Unmounting should NOT throw any removeChild errors
    expect(() => unmount()).not.toThrow();
  });
});
