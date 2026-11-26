import { describe, it, expect } from 'vitest';
import {
  extractEmailAndPhone,
  evaluateLeadCaptureTurn,
  type LeadCaptureState,
} from '@/lib/services/automation/leadCapture';

describe('leadCapture — Conversational Email/Phone Extraction & Multi-Step State Machine', () => {
  it('extracts emails and E.164 phone numbers from casual conversational replies', () => {
    expect(extractEmailAndPhone("sure it's Raj.Dev@Unool.co thanks!")).toEqual({
      email: 'raj.dev@unool.co',
      phone: null,
      declined: false,
    });

    expect(extractEmailAndPhone('my whatsapp is +91 98765-43210')).toEqual({
      email: null,
      phone: '+919876543210',
      declined: false,
    });

    expect(extractEmailAndPhone('no thanks')).toEqual({
      email: null,
      phone: null,
      declined: true,
    });
  });

  it('captures email, appends CTA link, handles polite decline, and falls through after 2 attempts', () => {
    const baseState: LeadCaptureState = {
      campaignId: 'camp-lead',
      awaiting: 'email',
      deliveryMessage: 'Here is your Notion system!',
      ctaUrl: 'https://unool.co/go/abc123',
      attempts: 0,
      startedAt: new Date().toISOString(),
    };

    const captured = evaluateLeadCaptureTurn('send it to founder@acme.io please', baseState);
    expect(captured.status).toBe('captured');
    if (captured.status === 'captured') {
      expect(captured.email).toBe('founder@acme.io');
      expect(captured.replyText).toContain('https://unool.co/go/abc123');
    }

    const declined = evaluateLeadCaptureTurn('skip', baseState);
    expect(declined.status).toBe('declined');
    if (declined.status === 'declined') {
      expect(declined.replyText).toContain('https://unool.co/go/abc123');
    }

    const reprompt = evaluateLeadCaptureTurn('Wait what is inside the template?', baseState);
    expect(reprompt.status).toBe('reprompt');
    if (reprompt.status === 'reprompt') {
      expect(reprompt.nextState.attempts).toBe(1);
    }

    const fallthrough = evaluateLeadCaptureTurn('still asking a question', { ...baseState, attempts: 2 });
    expect(fallthrough.status).toBe('fallthrough');
  });
});
