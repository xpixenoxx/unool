/**
 * Type definitions for the Automation dashboard feature.
 * Extracted from AutomationClient.tsx for maintainability.
 */

export interface AutomationConfig {
  enabled: boolean;
  autoReplyPositive: boolean;
  autoReplyQuestions: boolean;
  autoReplyLinkRequests: boolean;
  autoReplyPurchaseIntent: boolean;
  linkUrl: string | null;
  customInstructions: string | null;
  brandPersona: string | null;
  flagNegative: boolean;
  flagSpam: boolean;
  maxRepliesPerHour: number;
  jitterMinSeconds: number;
  jitterMaxSeconds: number;
  threadChainingEnabled: boolean;
  dmTemplate: string | null;
  autoHideSpam: boolean;
  dmAutoReplyEnabled: boolean;
  dmWelcomeMessage: string | null;
  dmKnowledgeBase: string | null;
  dmEscalationEnabled: boolean;
  dmMaxRepliesPerHour: number;
  requireFollowForDm?: boolean;
  followAskMessage?: string | null;
  followVerifiedMessage?: string | null;
}

export interface CommentLog {
  id: string;
  comment_id: string;
  comment_text: string;
  commenter_username: string;
  classification: string;
  confidence: number;
  suggested_reply: string;
  auto_replied: boolean;
  dm_sent: boolean;
  lead_score: number;
  thread_hook: string | null;
  reasoning: string;
  created_at: string;
  delivery_status?: string;
  flagged_for_review?: boolean;
}

export interface DmLog {
  id: string;
  sender_id: string;
  sender_username: string | null;
  message_text: string;
  classification: string;
  confidence: number;
  ai_reply: string;
  auto_replied: boolean;
  escalated: boolean;
  lead_score: number;
  created_at: string;
}

export interface FlaggedComment {
  id: string;
  item_type?: 'comment' | 'dm';
  comment_id: string;
  comment_text: string;
  commenter_username: string;
  classification: string;
  suggested_reply: string;
  reasoning: string;
  status: string;
  lead_score: number;
  priority: string;
  owner_reply?: string;
  created_at: string;
}

export interface SimulateResult {
  type: 'comment' | 'dm';
  classification: string;
  confidence: number;
  suggestedReply: string | null;
  suggestedDM?: string | null;
  threadHook?: string | null;
  leadScore: number;
  wouldAutoReply: boolean;
  wouldSendDM?: boolean;
  wouldEscalate?: boolean;
  wouldFlag?: boolean;
  reasoning: string;
  blocked?: boolean;
  reason?: string;
}

