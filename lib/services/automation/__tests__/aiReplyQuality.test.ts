import { describe, it, expect } from 'vitest';
import {
  evaluateAiReplyQuality,
  detectConversationStopSignal,
  isOptInResumeSignal,
  detectMessageLanguageHint,
  splitIntoNaturalBubbles,
} from '@/lib/services/automation/aiReplyQuality';

describe('aiReplyQuality — Intelligent Adaptive AI & Quality-Stop Gate', () => {
  it('passes natural, creator-specific replies grounded in Brand Materials', () => {
    const res = evaluateAiReplyQuality({
      replyText: 'Starter plan is $29/mo and includes unlimited IG keyword flows — want me to send the breakdown link?',
      inboundText: 'How much does the starter plan cost?',
      channel: 'dm',
      modelConfidence: 0.92,
      allowedFactsText: 'Pricing: Starter plan $29/mo, Pro plan $79/mo.',
      enforceStopOnLowQuality: true,
      minConfidencePct: 70,
    });

    expect(res.shouldStop).toBe(false);
    expect(res.passed).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(85);
    expect(res.hallucinatedFacts).toHaveLength(0);
  });

  it('hard-stops hallucinated prices and promo codes not present in Brand Materials', () => {
    const priceRes = evaluateAiReplyQuality({
      replyText: 'You can grab the coaching program today for $499 using code SECRET50!',
      inboundText: 'Do you offer coaching?',
      channel: 'dm',
      modelConfidence: 0.91,
      allowedFactsText: 'We offer a free newsletter and a $49 template pack.',
      enforceStopOnLowQuality: true,
    });

    expect(priceRes.shouldStop).toBe(true);
    expect(priceRes.hallucinatedFacts.length).toBeGreaterThanOrEqual(2);
    expect(priceRes.stopReason).toContain('$499');
  });

  it('penalizes and stops generic corporate AI slop when auto-stop is active', () => {
    const res = evaluateAiReplyQuality({
      replyText: "Thank you for reaching out! That's a great question! I'd be more than happy to help you seamlessly supercharge your workflow. Hope this helps!",
      inboundText: 'Does this integrate with Stripe?',
      channel: 'dm',
      modelConfidence: 0.88,
      enforceStopOnLowQuality: true,
    });

    expect(res.score).toBeLessThan(40);
    expect(res.shouldStop).toBe(true);
    expect(res.issues.length).toBeGreaterThanOrEqual(3);
  });

  it('always blocks AI identity leaks even when enforceStopOnLowQuality is false', () => {
    const res = evaluateAiReplyQuality({
      replyText: 'As an AI language model, I cannot verify your order right now.',
      inboundText: 'Where is my order?',
      channel: 'dm',
      modelConfidence: 0.95,
      enforceStopOnLowQuality: false,
    });

    expect(res.shouldStop).toBe(true);
    expect(res.stopReason).toContain('AI identity leak');
  });

  it('stops replies below minConfidencePct threshold', () => {
    const res = evaluateAiReplyQuality({
      replyText: 'We usually ship within two business days depending on your region.',
      inboundText: 'When does delivery arrive in Berlin?',
      channel: 'dm',
      modelConfidence: 0.58,
      minConfidencePct: 75,
      enforceStopOnLowQuality: false,
    });

    expect(res.shouldStop).toBe(true);
    expect(res.stopReason).toContain('58%');
    expect(res.stopReason).toContain('75%');
  });

  it('detects exact repetition against recent creator replies', () => {
    const res = evaluateAiReplyQuality({
      replyText: 'Love seeing you build with this — check your DMs for the Notion pack!',
      inboundText: 'Send link please!',
      channel: 'comment',
      modelConfidence: 0.9,
      recentReplies: ['Love seeing you build with this — check your DMs for the Notion pack!'],
      enforceStopOnLowQuality: true,
    });

    expect(res.score).toBeLessThan(62);
    expect(res.shouldStop).toBe(true);
  });

  it('strips robotic markdown bold/headings cleanly', () => {
    const res = evaluateAiReplyQuality({
      replyText: '**Quick answer:** Yes, you can connect up to 3 accounts on the Pro plan.',
      inboundText: 'How many accounts?',
      channel: 'dm',
      modelConfidence: 0.9,
    });
    expect(res.cleanedReply).toBe('Quick answer: Yes, you can connect up to 3 accounts on the Pro plan.');
  });

  describe('detectConversationStopSignal & isOptInResumeSignal', () => {
    it('honors STOP / unsubscribe opt-out immediately', () => {
      const stop = detectConversationStopSignal('STOP', { channel: 'dm' });
      expect(stop.shouldStop).toBe(true);
      expect(stop.reason).toBe('opt_out_stop');
      expect(stop.optOut).toBe(true);
      expect(isOptInResumeSignal('START')).toBe(true);
      expect(isOptInResumeSignal('hello')).toBe(false);
    });

    it('detects natural conversation end ONLY after prior assistant turns', () => {
      const turn1 = detectConversationStopSignal('thanks! 🙏', { channel: 'dm', priorAssistantTurns: 0 });
      expect(turn1.shouldStop).toBe(false);

      const turn2 = detectConversationStopSignal('thanks! 🙏', { channel: 'dm', priorAssistantTurns: 1 });
      expect(turn2.shouldStop).toBe(true);
      expect(turn2.reason).toBe('natural_conversation_end');
      expect(turn2.escalate).toBe(false);
    });

    it('escalates human requests, bot frustration, and billing/legal disputes', () => {
      expect(detectConversationStopSignal('Can I talk to a real person please?').reason).toBe('human_requested');
      expect(detectConversationStopSignal("You didn't answer my question at all").reason).toBe('bot_frustration');
      const billing = detectConversationStopSignal('I was charged twice on my card and want a chargeback');
      expect(billing.shouldStop).toBe(true);
      expect(billing.reason).toBe('high_risk_escalation');
      expect(billing.escalate).toBe(true);
    });
  });

  describe('detectMessageLanguageHint & splitIntoNaturalBubbles', () => {
    it('detects Hinglish, Hindi Devanagari, and Spanish naturally', () => {
      expect(detectMessageLanguageHint('Bhai price kitna hai iska?')).toContain('Hinglish');
      expect(detectMessageLanguageHint('नमस्ते इसका लिंक भेजो')).toContain('Hindi');
      expect(detectMessageLanguageHint('Hola, cuál es el precio?')).toContain('Spanish');
      expect(detectMessageLanguageHint('How does this work?')).toBeNull();
    });

    it('splits long multi-paragraph DM replies into max 3 natural bubbles without splitting short text', () => {
      expect(splitIntoNaturalBubbles('Short reply here!')).toEqual(['Short reply here!']);
      const multi = splitIntoNaturalBubbles(
        'First bubble explaining the core offer in clear friendly detail so it reads great on mobile.\n\nSecond bubble with the direct step-by-step instructions and link https://unool.co/go/abc123.\n\nThird quick follow-up question for them!'
      );
      expect(multi).toHaveLength(3);
      expect(multi[1]).toContain('https://unool.co/go/abc123');
    });
  });
});
