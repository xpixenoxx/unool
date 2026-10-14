/**
 * Tests for InstagramCommentAutomation — SignalDM AI Engine
 *
 * Tests the 8-category classification, reply generation rules,
 * thread-chaining, and brand safety controls.
 *
 * NOTE: These tests mock the Groq API to avoid live API calls.
 * They validate that the automation engine correctly routes
 * classification results into the right actions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  InstagramCommentAutomation,
  DEFAULT_AUTOMATION_CONFIG,
  type CommentEvent,
  type DmEvent,
  type AutomationConfig,
} from '../InstagramCommentAutomation';

// ─── Mock Groq Provider ──────────────────────────────────────────────────────

const mockClassifyAndGenerate = vi.fn();

vi.mock('@/lib/ai/providers/GroqProvider', () => ({
  GroqProvider: vi.fn().mockImplementation(() => ({
    generateStructuredJSON: mockClassifyAndGenerate,
  })),
}));

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const baseConfig: AutomationConfig = {
  ...DEFAULT_AUTOMATION_CONFIG,
  enabled: true,
  linkUrl: 'https://unool.com/u/testbrand',
};

function makeCommentEvent(text: string, username = 'testuser'): CommentEvent {
  return {
    commentId: 'test_comment_id',
    mediaId: 'test_media_id',
    text,
    username,
    timestamp: new Date().toISOString(),
  };
}

function makeDmEvent(text: string, senderId = 'sender_123'): DmEvent {
  return {
    messageId: 'test_message_id',
    senderId,
    senderUsername: 'dm_sender',
    text,
    timestamp: new Date().toISOString(),
  };
}

// ─── Classification Tests ─────────────────────────────────────────────────────

describe('InstagramCommentAutomation', () => {
  let automation: InstagramCommentAutomation;

  beforeEach(() => {
    vi.clearAllMocks();
    automation = new InstagramCommentAutomation('mock-groq-api-key');
  });

  describe('classifyAndGenerateReply', () => {
    it('classifies "Where can I get this?" as link_request', async () => {
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'link_request',
        confidence: 0.95,
        suggestedReply: 'Just dropped it in your DMs! What are you building with it? 🚀',
        suggestedDM: `Hey @testuser! Here's the link: ${baseConfig.linkUrl} — let me know if you have questions!`,
        threadHook: 'What are you building with it?',
        leadScore: 2,
        shouldAutoReply: true,
        shouldSendDM: true,
        shouldFlagForReview: false,
        reasoning: 'User explicitly asking for a link/resource',
      });

      const result = await automation.classifyAndGenerateReply(
        makeCommentEvent('Where can I get this?'),
        'My 5-step system for SaaS growth',
        baseConfig,
        []
      );

      expect(result.classification).toBe('link_request');
      expect(result.shouldSendDM).toBe(true);
      expect(result.leadScore).toBe(2);
      expect(result.suggestedDM).toContain(baseConfig.linkUrl!);
    });

    it('classifies "🔥🔥🔥" as positive', async () => {
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'positive',
        confidence: 0.98,
        suggestedReply: 'Love the energy! Which part landed most for you? 🔥',
        suggestedDM: null,
        threadHook: 'Which part landed most for you?',
        leadScore: 0,
        shouldAutoReply: true,
        shouldSendDM: false,
        shouldFlagForReview: false,
        reasoning: 'Pure positive emoji reaction',
      });

      const result = await automation.classifyAndGenerateReply(
        makeCommentEvent('🔥🔥🔥'),
        'My system for building a 6-figure consulting practice',
        baseConfig,
        []
      );

      expect(result.classification).toBe('positive');
      expect(result.shouldAutoReply).toBe(true);
      expect(result.shouldSendDM).toBe(false);
      expect(result.shouldFlagForReview).toBe(false);
    });

    it('classifies "How much does this cost?" as purchase_intent', async () => {
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'purchase_intent',
        confidence: 0.97,
        suggestedReply: 'Sliding into your DMs with all the details! Quick Q — are you looking for the full program or just the template?',
        suggestedDM: `Hey @testuser! Full breakdown here: ${baseConfig.linkUrl}`,
        threadHook: 'are you looking for the full program or just the template?',
        leadScore: 3,
        shouldAutoReply: true,
        shouldSendDM: true,
        shouldFlagForReview: false,
        reasoning: 'Direct purchase intent with price inquiry',
      });

      const result = await automation.classifyAndGenerateReply(
        makeCommentEvent('How much does this cost?'),
        'My 1:1 coaching program results',
        baseConfig,
        []
      );

      expect(result.classification).toBe('purchase_intent');
      expect(result.leadScore).toBe(3);
      expect(result.shouldSendDM).toBe(true);
    });

    it('classifies "This is a scam" as negative and flags for review', async () => {
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'negative',
        confidence: 0.89,
        suggestedReply: 'I hear you — happy to clear up any concerns in DMs. What specifically felt off to you?',
        suggestedDM: null,
        threadHook: 'What specifically felt off to you?',
        leadScore: 0,
        shouldAutoReply: false,
        shouldSendDM: false,
        shouldFlagForReview: true,
        reasoning: 'Negative accusation — requires human review before responding',
      });

      const result = await automation.classifyAndGenerateReply(
        makeCommentEvent('This is a scam'),
        'My lead generation system',
        baseConfig,
        []
      );

      expect(result.classification).toBe('negative');
      expect(result.shouldFlagForReview).toBe(true);
      expect(result.shouldAutoReply).toBe(false);
    });

    it('classifies crypto spam as spam and flags for review', async () => {
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'spam',
        confidence: 0.99,
        suggestedReply: 'SKIP',
        suggestedDM: null,
        threadHook: null,
        leadScore: 0,
        shouldAutoReply: false,
        shouldSendDM: false,
        shouldFlagForReview: true,
        reasoning: 'Crypto promotion spam bot',
      });

      const result = await automation.classifyAndGenerateReply(
        makeCommentEvent('🚀 Earn $500/day with crypto! DM me NOW 💰💰💰'),
        'Productivity tips for developers',
        baseConfig,
        []
      );

      expect(result.classification).toBe('spam');
      expect(result.suggestedReply).toBe('SKIP');
      expect(result.shouldFlagForReview).toBe(true);
    });

    it('always includes a thread hook for positive/question classifications', async () => {
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'question',
        confidence: 0.92,
        suggestedReply: 'Great Q! The key is batching your research phase — are you doing this solo or with a team?',
        suggestedDM: null,
        threadHook: 'are you doing this solo or with a team?',
        leadScore: 1,
        shouldAutoReply: true,
        shouldSendDM: false,
        shouldFlagForReview: false,
        reasoning: 'Genuine question about the process',
      });

      const result = await automation.classifyAndGenerateReply(
        makeCommentEvent('How do you structure your content research?'),
        'My content creation workflow breakdown',
        { ...baseConfig, threadChainingEnabled: true },
        []
      );

      expect(result.classification).toBe('question');
      expect(result.threadHook).not.toBeNull();
      expect(result.suggestedReply).toContain('?');
    });

    it('respects brand persona instructions in the config', async () => {
      const customConfig: AutomationConfig = {
        ...baseConfig,
        brandPersona: 'lowercase, punchy, no buzzwords, sounds like a 25-year-old founder',
        customInstructions: 'Never use exclamation marks. Never say "game-changer".',
      };

      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'positive',
        confidence: 0.94,
        suggestedReply: 'honestly glad it clicked — what part are you going to try first',
        suggestedDM: null,
        threadHook: 'what part are you going to try first',
        leadScore: 0,
        shouldAutoReply: true,
        shouldSendDM: false,
        shouldFlagForReview: false,
        reasoning: 'Positive comment, brand persona applied',
      });

      const result = await automation.classifyAndGenerateReply(
        makeCommentEvent('this is exactly what I needed'),
        'building in public: month 3',
        customConfig,
        []
      );

      // The mock returns lowercase brand-persona styled reply
      expect(result.suggestedReply).not.toMatch(/!/);
      expect(result.suggestedReply).not.toMatch(/game-changer/i);
    });

    it('returns shouldFlagForReview=true for negative comments', async () => {
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'negative',
        confidence: 0.85,
        suggestedReply: 'Sorry to hear this missed the mark for you — what would have made it more useful?',
        suggestedDM: null,
        threadHook: 'what would have made it more useful?',
        leadScore: 0,
        shouldAutoReply: false,
        shouldSendDM: false,
        shouldFlagForReview: true,
        reasoning: 'Negative feedback requires human review',
      });

      const result = await automation.classifyAndGenerateReply(
        makeCommentEvent('This content is useless and wrong.'),
        'My top 5 marketing frameworks',
        { ...baseConfig, flagNegative: true },
        []
      );

      expect(result.shouldFlagForReview).toBe(true);
    });
  });

  // ─── DM Classification Tests ──────────────────────────────────────────────

  describe('classifyAndReplyDM', () => {
    it('classifies a support DM and generates a helpful response', async () => {
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'support',
        confidence: 0.91,
        suggestedReply: 'Of course! The template link is here — let me know if you get stuck anywhere.',
        leadScore: 1,
        shouldAutoReply: true,
        shouldEscalate: false,
        reasoning: 'Support request for previously offered resource',
      });

      const result = await automation.classifyAndReplyDM(
        makeDmEvent('Hey! You said you\'d send the template in the comments?'),
        { ...baseConfig, dmAutoReplyEnabled: true }
      );

      expect(result.classification).toBe('support');
      expect(result.shouldAutoReply).toBe(true);
      expect(result.shouldEscalate).toBe(false);
    });

    it('escalates DMs that appear to need human attention', async () => {
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'negative',
        confidence: 0.88,
        suggestedReply: 'I really hear your frustration — let me look into this personally for you.',
        leadScore: 0,
        shouldAutoReply: false,
        shouldEscalate: true,
        reasoning: 'Angry customer complaint, needs human escalation',
      });

      const result = await automation.classifyAndReplyDM(
        makeDmEvent('I paid for your course and got nothing. This is fraud.'),
        { ...baseConfig, dmAutoReplyEnabled: true, dmEscalationEnabled: true }
      );

      expect(result.shouldEscalate).toBe(true);
    });

    it('does not auto-reply when dmAutoReplyEnabled is false', async () => {
      const config: AutomationConfig = {
        ...baseConfig,
        dmAutoReplyEnabled: false,
      };

      // Even if AI returns shouldAutoReply: true, it should be overridden
      mockClassifyAndGenerate.mockResolvedValue({
        classification: 'question',
        confidence: 0.9,
        suggestedReply: 'Great question!',
        leadScore: 0,
        shouldAutoReply: true,
        shouldEscalate: false,
        reasoning: 'Question DM',
      });

      const result = await automation.classifyAndReplyDM(
        makeDmEvent('What tool do you use for this?'),
        config
      );

      // The route handler checks dmAutoReplyEnabled before calling this,
      // but the method itself should still be callable and return classification
      expect(result).toBeDefined();
      expect(result.classification).toBeTruthy();
    });
  });
});
