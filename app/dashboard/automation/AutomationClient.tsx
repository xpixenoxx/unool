'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserContext } from '@/lib/hooks/use-user-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutomationConfig {
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
}

interface CommentLog {
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
}

interface DmLog {
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

interface FlaggedComment {
  id: string;
  comment_id: string;
  comment_text: string;
  commenter_username: string;
  classification: string;
  suggested_reply: string;
  reasoning: string;
  status: string;
  lead_score: number;
  priority: string;
  created_at: string;
}

interface SimulateResult {
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

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  positive:        { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e', dot: '#22c55e' },
  question:        { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', dot: '#3b82f6' },
  link_request:    { bg: 'rgba(168,85,247,0.12)', text: '#a855f7', dot: '#a855f7' },
  purchase_intent: { bg: 'rgba(249,115,22,0.12)', text: '#f97316', dot: '#f97316' },
  negative:        { bg: 'rgba(239,68,68,0.12)',  text: '#ef4444', dot: '#ef4444' },
  spam:            { bg: 'rgba(156,163,175,0.12)', text: '#9ca3af', dot: '#9ca3af' },
  harmful:         { bg: 'rgba(239,68,68,0.18)',  text: '#dc2626', dot: '#dc2626' },
  unrelated:       { bg: 'rgba(156,163,175,0.08)', text: '#6b7280', dot: '#6b7280' },
  support:         { bg: 'rgba(234,179,8,0.12)',  text: '#eab308', dot: '#eab308' },
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  positive: 'Positive 🌟',
  question: 'Question ❓',
  link_request: 'Link Request 🔗',
  purchase_intent: 'Purchase Intent 🛒',
  negative: 'Negative ⚠️',
  spam: 'Spam 🚫',
  harmful: 'Harmful 🔴',
  unrelated: 'Unrelated',
  support: 'Support 💬',
};

const LEAD_SCORE_LABELS = ['Not a lead', 'Warm', 'Hot 🔥', 'Ready to buy 💰'];
const LEAD_SCORE_COLORS = ['#6b7280', '#3b82f6', '#f97316', '#22c55e'];

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  .sdm-root {
    min-height: calc(100vh - 100px);
    background: #0a0a0f;
    color: #e8e6f0;
    font-family: 'Inter', sans-serif;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  .sdm-header {
    padding: 28px 32px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: linear-gradient(180deg, rgba(139,92,246,0.05) 0%, transparent 100%);
  }

  .sdm-header-inner {
    max-width: 1280px;
    margin: 0 auto;
  }

  .sdm-title-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 6px;
  }

  .sdm-logo-mark {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 4px 20px rgba(139,92,246,0.35);
    flex-shrink: 0;
  }

  .sdm-title {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #fff 0%, #c4b5fd 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }

  .sdm-subtitle {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 0;
  }

  .sdm-tabs {
    display: flex;
    gap: 0;
    margin-top: 24px;
    max-width: 1280px;
    margin-left: auto;
    margin-right: auto;
  }

  .sdm-tab {
    padding: 10px 20px;
    font-size: 13.5px;
    font-weight: 500;
    color: #6b7280;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }

  .sdm-tab:hover { color: #a78bfa; }

  .sdm-tab.active {
    color: #a78bfa;
    border-bottom-color: #8b5cf6;
  }

  .sdm-tab-badge {
    background: rgba(139,92,246,0.2);
    color: #a78bfa;
    border-radius: 20px;
    padding: 1px 7px;
    font-size: 11px;
    font-weight: 600;
  }

  .sdm-body {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 32px;
  }

  /* Master Toggle */
  .sdm-master-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.05) 100%);
    border: 1px solid rgba(139,92,246,0.2);
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 24px;
  }

  .sdm-master-toggle.active {
    background: linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.08) 100%);
    border-color: rgba(139,92,246,0.4);
    box-shadow: 0 0 30px rgba(139,92,246,0.12);
  }

  .sdm-toggle-label {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sdm-toggle-info h3 {
    font-size: 15px;
    font-weight: 600;
    color: #f3f4f6;
    margin: 0 0 3px;
  }

  .sdm-toggle-info p {
    font-size: 12.5px;
    color: #6b7280;
    margin: 0;
  }

  /* Toggle Switch */
  .sdm-switch {
    position: relative;
    width: 52px;
    height: 28px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .sdm-switch input { display: none; }

  .sdm-switch-track {
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.08);
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.25s;
  }

  .sdm-switch input:checked + .sdm-switch-track {
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    border-color: transparent;
    box-shadow: 0 0 12px rgba(139,92,246,0.5);
  }

  .sdm-switch-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: all 0.25s cubic-bezier(.34,1.56,.64,1);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }

  .sdm-switch input:checked ~ .sdm-switch-thumb {
    transform: translateX(24px);
  }

  /* Cards */
  .sdm-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 16px;
  }

  .sdm-card-title {
    font-size: 13px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sdm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .sdm-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

  @media (max-width: 768px) {
    .sdm-grid-2, .sdm-grid-3 { grid-template-columns: 1fr; }
    .sdm-body { padding: 20px 16px; }
  }

  /* Form elements */
  .sdm-field { margin-bottom: 16px; }

  .sdm-label {
    display: block;
    font-size: 12.5px;
    font-weight: 500;
    color: #9ca3af;
    margin-bottom: 6px;
  }

  .sdm-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13.5px;
    color: #f3f4f6;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    outline: none;
  }

  .sdm-input::placeholder { color: #4b5563; }

  .sdm-input:focus {
    border-color: rgba(139,92,246,0.5);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
  }

  .sdm-textarea {
    min-height: 90px;
    resize: vertical;
    line-height: 1.6;
  }

  /* Toggle row */
  .sdm-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .sdm-toggle-row:last-child { border-bottom: none; }

  .sdm-toggle-row-label {
    font-size: 13.5px;
    color: #d1d5db;
    font-weight: 500;
  }

  .sdm-toggle-row-desc {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }

  /* Slider */
  .sdm-slider-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
  }

  .sdm-slider {
    flex: 1;
    -webkit-appearance: none;
    height: 4px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    outline: none;
  }

  .sdm-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(139,92,246,0.4);
  }

  .sdm-slider-value {
    font-size: 13px;
    font-weight: 600;
    color: #a78bfa;
    min-width: 48px;
    text-align: right;
  }

  /* Save button */
  .sdm-btn {
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'Inter', sans-serif;
  }

  .sdm-btn-primary {
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    color: #fff;
    box-shadow: 0 4px 16px rgba(139,92,246,0.3);
  }

  .sdm-btn-primary:hover {
    box-shadow: 0 4px 24px rgba(139,92,246,0.5);
    transform: translateY(-1px);
  }

  .sdm-btn-primary:active { transform: translateY(0); }

  .sdm-btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .sdm-btn-secondary {
    background: rgba(255,255,255,0.07);
    color: #d1d5db;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .sdm-btn-secondary:hover { background: rgba(255,255,255,0.1); }

  .sdm-btn-danger {
    background: rgba(239,68,68,0.12);
    color: #ef4444;
    border: 1px solid rgba(239,68,68,0.2);
  }

  .sdm-btn-danger:hover { background: rgba(239,68,68,0.2); }

  .sdm-btn-success {
    background: rgba(34,197,94,0.12);
    color: #22c55e;
    border: 1px solid rgba(34,197,94,0.2);
  }

  .sdm-btn-success:hover { background: rgba(34,197,94,0.2); }

  /* Simulator */
  .sdm-sim-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
  }

  @media (max-width: 900px) { .sdm-sim-layout { grid-template-columns: 1fr; } }

  .sdm-sim-result {
    background: rgba(139,92,246,0.05);
    border: 1px solid rgba(139,92,246,0.15);
    border-radius: 16px;
    padding: 20px;
  }

  .sdm-classification-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12.5px;
    font-weight: 600;
  }

  .sdm-confidence-bar-wrap {
    height: 4px;
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 8px;
  }

  .sdm-confidence-bar {
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #a855f7);
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .sdm-result-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .sdm-result-section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #6b7280;
    margin-bottom: 8px;
  }

  .sdm-result-reply {
    font-size: 13.5px;
    color: #f3f4f6;
    line-height: 1.6;
    background: rgba(255,255,255,0.04);
    border-radius: 10px;
    padding: 12px 14px;
  }

  .sdm-action-flags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .sdm-flag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
  }

  .sdm-flag-yes { background: rgba(34,197,94,0.12); color: #22c55e; }
  .sdm-flag-no  { background: rgba(156,163,175,0.1); color: #6b7280; }
  .sdm-flag-warn { background: rgba(249,115,22,0.12); color: #f97316; }

  /* Comment feed table */
  .sdm-table { width: 100%; border-collapse: collapse; }

  .sdm-table th {
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .sdm-table td {
    padding: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 13px;
    vertical-align: top;
  }

  .sdm-table tr:last-child td { border-bottom: none; }
  .sdm-table tr:hover td { background: rgba(255,255,255,0.02); }

  .sdm-username {
    font-weight: 600;
    color: #a78bfa;
    font-size: 12.5px;
  }

  /* Flagged inbox */
  .sdm-flagged-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 18px 20px;
    margin-bottom: 12px;
    transition: border-color 0.2s;
  }

  .sdm-flagged-card:hover { border-color: rgba(139,92,246,0.25); }

  .sdm-flagged-card.high-priority {
    border-color: rgba(249,115,22,0.25);
    background: rgba(249,115,22,0.03);
  }

  .sdm-flagged-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .sdm-flagged-comment {
    font-size: 14px;
    color: #f3f4f6;
    line-height: 1.5;
    flex: 1;
  }

  .sdm-reply-preview {
    background: rgba(139,92,246,0.06);
    border: 1px solid rgba(139,92,246,0.15);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    color: #d1d5db;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  .sdm-flagged-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  /* Stats row */
  .sdm-stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  @media (max-width: 768px) { .sdm-stats-row { grid-template-columns: 1fr 1fr; } }

  .sdm-stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }

  .sdm-stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #a78bfa;
    line-height: 1;
    margin-bottom: 4px;
  }

  .sdm-stat-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }

  /* Filter tabs */
  .sdm-filter-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .sdm-filter-tab {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent;
    color: #6b7280;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }

  .sdm-filter-tab.active {
    background: rgba(139,92,246,0.15);
    border-color: rgba(139,92,246,0.35);
    color: #a78bfa;
  }

  .sdm-filter-tab:hover { color: #d1d5db; }

  /* Toast */
  .sdm-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: rgba(17,17,27,0.95);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 14px 18px;
    font-size: 13.5px;
    color: #f3f4f6;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 9999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: sdm-toast-in 0.3s ease;
    max-width: 320px;
  }

  @keyframes sdm-toast-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .sdm-empty {
    text-align: center;
    padding: 48px 20px;
    color: #4b5563;
  }

  .sdm-empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .sdm-empty p {
    font-size: 14px;
    margin: 0;
  }

  .sdm-sim-type-tabs {
    display: flex;
    background: rgba(255,255,255,0.04);
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 16px;
    width: fit-content;
  }

  .sdm-sim-type-tab {
    padding: 7px 16px;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    background: transparent;
    color: #6b7280;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }

  .sdm-sim-type-tab.active {
    background: rgba(139,92,246,0.2);
    color: #a78bfa;
  }

  .sdm-no-workspace {
    text-align: center;
    padding: 80px 20px;
  }

  .sdm-spinner {
    width: 32px; height: 32px;
    border: 3px solid rgba(139,92,246,0.2);
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: sdm-spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes sdm-spin { to { transform: rotate(360deg); } }
`;

// ─── Test Presets ─────────────────────────────────────────────────────────────

const COMMENT_PRESETS = [
  { label: '🔗 Link Request', text: 'Where can I get this template? Can you send me the link?', caption: 'New workflow template just dropped for engineering teams.' },
  { label: '🛒 Purchase Intent', text: 'How much does this cost? Shut up and take my money!', caption: 'Pricing and packages for our enterprise automation suite.' },
  { label: '🌟 Positive Praise', text: 'This workflow completely changed how our team operates! 🔥👏', caption: 'How we scaled our async communication.' },
  { label: '❓ Feature Question', text: 'Does this integrate with Slack and Supabase out of the box?', caption: 'Deep dive into our modern stack architecture.' },
  { label: '⚠️ Customer Complaint', text: 'Your tool charged my card twice and customer support hasn\'t responded!', caption: 'Product update and billing overview.' },
  { label: '🚫 Spam Bot', text: 'Invest in Bitcoin now and make 500% ROI in 24 hours! DM me!', caption: 'Weekly newsletter edition.' },
];

const DM_PRESETS = [
  { label: '💰 Price Inquiry', text: 'Hey, how much is your course and is there a payment plan?' },
  { label: '📩 Resource Ask', text: 'Hi! Could you send over the spreadsheet you mentioned in your story?' },
  { label: '🤝 Partnership', text: 'We love your content! Would you be open to a brand collab next month?' },
  { label: '⚠️ Angry Issue', text: 'I bought the template 3 days ago and the download link is broken. Fix this now.' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutomationClient({
  workspaceId: initialWorkspaceId,
  userId: initialUserId,
}: {
  workspaceId: string | null;
  userId?: string;
}) {
  const userCtx = useUserContext();
  const workspaceId = initialWorkspaceId || userCtx?.workspace?.id || null;
  const userId = initialUserId || userCtx?.user?.id || '';
  const [activeTab, setActiveTab] = useState<'control' | 'simulator' | 'feed' | 'inbox' | 'dms'>('control');
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Instagram connection state
  const [igConnection, setIgConnection] = useState<{ status: 'connected' | 'not_connected' | 'expired'; username?: string } | null>(null);

  // Feed state
  const [comments, setComments] = useState<CommentLog[]>([]);
  const [commentStats, setCommentStats] = useState<any>(null);
  const [commentFilter, setCommentFilter] = useState('all');
  const [commentSearch, setCommentSearch] = useState('');
  const [commentPage, setCommentPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(false);

  // DM state
  const [dms, setDms] = useState<DmLog[]>([]);
  const [dmStats, setDmStats] = useState<any>(null);
  const [dmsLoading, setDmsLoading] = useState(false);

  // Inbox state
  const [flagged, setFlagged] = useState<FlaggedComment[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [inboxLoading, setInboxLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [editReplies, setEditReplies] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});

  // Simulator state
  const [simType, setSimType] = useState<'comment' | 'dm'>('comment');
  const [simComment, setSimComment] = useState('');
  const [simCaption, setSimCaption] = useState('');
  const [simDmText, setSimDmText] = useState('');
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const [syncingWebhook, setSyncingWebhook] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const syncWebhook = async () => {
    if (!workspaceId) return;
    setSyncingWebhook(true);
    try {
      const res = await fetch('/api/instagram/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Webhook synced with Meta Graph API ✓');
      } else {
        showToast(data.error || 'Failed to sync webhook with Meta', 'error');
      }
    } catch {
      showToast('Network error while syncing webhook', 'error');
    } finally {
      setSyncingWebhook(false);
    }
  };

  // Load Instagram connection status
  useEffect(() => {
    fetch('/api/platform/connections', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.instagram) {
          setIgConnection(data.instagram);
        }
      })
      .catch(() => {});
  }, []);

  // Load config
  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    fetch(`/api/instagram/automation?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(data => { setConfig(data); setLoading(false); })
      .catch(() => { setLoading(false); showToast('Failed to load config', 'error'); });
  }, [workspaceId]);

  // Load feed
  const loadComments = useCallback(async () => {
    if (!workspaceId) return;
    setFeedLoading(true);
    try {
      const res = await fetch(`/api/instagram/comments?workspaceId=${workspaceId}&page=${commentPage}&limit=25&classification=${commentFilter}`);
      const data = await res.json();
      setComments(data.comments || []);
      setCommentStats(data.stats || null);
    } finally { setFeedLoading(false); }
  }, [workspaceId, commentPage, commentFilter]);

  // Load flagged
  const loadFlagged = useCallback(async () => {
    if (!workspaceId) return;
    setInboxLoading(true);
    try {
      const res = await fetch(`/api/instagram/flagged?workspaceId=${workspaceId}&status=${statusFilter}`);
      const data = await res.json();
      setFlagged(data.flagged || []);
      setPendingCount(data.statusCounts?.pending || 0);
    } finally { setInboxLoading(false); }
  }, [workspaceId, statusFilter]);

  // Load DMs
  const loadDms = useCallback(async () => {
    if (!workspaceId) return;
    setDmsLoading(true);
    try {
      const res = await fetch(`/api/instagram/dms?workspaceId=${workspaceId}`);
      const data = await res.json();
      setDms(data.dms || []);
      setDmStats(data.stats || null);
    } finally { setDmsLoading(false); }
  }, [workspaceId]);

  useEffect(() => { if (activeTab === 'feed') loadComments(); }, [activeTab, loadComments]);
  useEffect(() => { if (activeTab === 'inbox') loadFlagged(); }, [activeTab, loadFlagged]);
  useEffect(() => { if (activeTab === 'dms') loadDms(); }, [activeTab, loadDms]);

  const saveConfig = async () => {
    if (!workspaceId || !config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/instagram/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, ...config }),
      });
      if (res.ok) showToast('Settings saved ✓');
      else showToast('Failed to save', 'error');
    } finally { setSaving(false); }
  };

  const runSimulator = async () => {
    if (!workspaceId) return;
    const inputText = simType === 'comment' ? simComment : simDmText;
    if (!inputText.trim()) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/instagram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          commentText: simType === 'comment' ? simComment : undefined,
          postCaption: simType === 'comment' ? simCaption : undefined,
          isDmSimulation: simType === 'dm',
          dmText: simType === 'dm' ? simDmText : undefined,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } finally { setSimLoading(false); }
  };

  const flaggedAction = async (id: string, action: 'approve' | 'reject' | 'reply', ownerReply?: string) => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/instagram/flagged/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, action, ownerReply }),
      });
      if (res.ok) {
        showToast(action === 'reject' ? 'Dismissed' : 'Reply posted ✓');
        loadFlagged();
      } else {
        const err = await res.json();
        showToast(err.error || 'Action failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const updateConfig = (patch: Partial<AutomationConfig>) => {
    setConfig(prev => prev ? { ...prev, ...patch } : prev);
  };

  if (!workspaceId && userCtx?.loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="sdm-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="sdm-spinner" />
            <p style={{ color: '#6b7280', fontSize: 14 }}>Connecting workspace...</p>
          </div>
        </div>
      </>
    );
  }

  if (!workspaceId) {
    return (
      <>
        <style>{styles}</style>
        <div className="sdm-root">
          <div className="sdm-no-workspace">
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
            <h2 style={{ color: '#a78bfa', marginBottom: 8 }}>No workspace found</h2>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>Please create or join a workspace first to access SignalDM.</p>
            <a
              href="/dashboard"
              style={{
                display: 'inline-block',
                padding: '8px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Go to Overview
            </a>
          </div>
        </div>
      </>
    );
  }

  if (loading || !config) {
    return (
      <>
        <style>{styles}</style>
        <div className="sdm-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="sdm-spinner" />
            <p style={{ color: '#6b7280', fontSize: 14 }}>Loading SignalDM...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="sdm-root">
        {/* Header */}
        <div className="sdm-header">
          <div className="sdm-header-inner">
            <div className="sdm-title-row" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="sdm-logo-mark">⚡</div>
                <div>
                  <div className="sdm-title">SignalDM</div>
                  <div className="sdm-subtitle">Instagram Comment & DM Automation Engine</div>
                </div>
              </div>

              {/* Instagram account connection indicator */}
              {igConnection && (
                <div>
                  {igConnection.status === 'connected' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        borderRadius: 20,
                        padding: '4px 12px',
                        fontSize: 12,
                        color: '#4ade80',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                        <span>@{igConnection.username || 'instagram'}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>connected</span>
                      </div>
                      <button
                        onClick={syncWebhook}
                        disabled={syncingWebhook}
                        title="Re-sync Webhook Subscriptions (comments & messages) with Meta Graph API"
                        style={{
                          background: 'rgba(139,92,246,0.12)',
                          border: '1px solid rgba(139,92,246,0.3)',
                          borderRadius: 20,
                          padding: '4px 12px',
                          fontSize: 12,
                          color: '#c4b5fd',
                          cursor: syncingWebhook ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          transition: 'all 0.2s',
                        }}
                      >
                        <span>{syncingWebhook ? '⏳' : '🔄'}</span>
                        <span>{syncingWebhook ? 'Syncing...' : 'Sync Webhook'}</span>
                      </button>
                    </div>
                  ) : (
                    <a
                      href={`/api/auth/platform/connect?platform=instagram&workspaceId=${workspaceId || ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 20,
                        padding: '4px 12px',
                        fontSize: 12,
                        color: '#f87171',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>⚠️ Not Connected</span>
                      <span style={{ fontWeight: 600, color: '#fff', textDecoration: 'underline' }}>Connect →</span>
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="sdm-tabs">
              {[
                { id: 'control', label: 'Control Panel', icon: '🎛️' },
                { id: 'simulator', label: 'Live Simulator', icon: '🧪' },
                { id: 'feed', label: 'Comment Feed', icon: '💬', badge: commentStats?.total },
                { id: 'inbox', label: 'Flagged Inbox', icon: '⚠️', badge: pendingCount || undefined },
                { id: 'dms', label: 'DM Feed', icon: '✉️', badge: dmStats?.total },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`sdm-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.icon} {tab.label}
                  {tab.badge ? <span className="sdm-tab-badge">{tab.badge}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sdm-body">

          {/* ── Tab: Control Panel ── */}
          {activeTab === 'control' && (
            <div>
              {/* Instagram Not Connected Warning Banner */}
              {igConnection && igConnection.status !== 'connected' && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(249,115,22,0.08) 100%)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 14,
                  padding: '16px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 26 }}>📸</span>
                    <div>
                      <div style={{ color: '#f87171', fontWeight: 600, fontSize: 13.5 }}>
                        {igConnection.status === 'expired' ? 'Instagram connection has expired' : 'Instagram account is not connected'}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                        Connect your Instagram Creator or Business account to enable automatic AI comment replies and lead conversion DMs.
                      </div>
                    </div>
                  </div>
                  <a
                    href={`/api/auth/platform/connect?platform=instagram&workspaceId=${workspaceId || ''}`}
                    style={{
                      background: 'linear-gradient(135deg, #e1306c, #c13584)',
                      color: '#fff',
                      padding: '8px 18px',
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: 600,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 14px rgba(225,48,108,0.3)',
                    }}
                  >
                    Connect Instagram →
                  </a>
                </div>
              )}

              {/* Master toggle */}
              <div className={`sdm-master-toggle ${config.enabled ? 'active' : ''}`}>
                <div className="sdm-toggle-label">
                  <div style={{ fontSize: 28 }}>{config.enabled ? '⚡' : '💤'}</div>
                  <div className="sdm-toggle-info">
                    <h3>SignalDM Automation {config.enabled ? 'ACTIVE' : 'PAUSED'}</h3>
                    <p>{config.enabled
                      ? 'Comments are being processed in real-time. Replies go live after jitter delay.'
                      : 'Enable to start auto-handling comments with AI. All settings below are saved.'
                    }</p>
                  </div>
                </div>
                <label className="sdm-switch">
                  <input type="checkbox" checked={config.enabled} onChange={e => updateConfig({ enabled: e.target.checked })} />
                  <div className="sdm-switch-track" />
                  <div className="sdm-switch-thumb" />
                </label>
              </div>

              <div className="sdm-grid-2">
                {/* Comment automation settings */}
                <div>
                  <div className="sdm-card">
                    <div className="sdm-card-title">💬 Comment Automation</div>

                    {[
                      { key: 'autoReplyPositive', label: 'Auto-reply positive comments', desc: 'Compliments, praise, emoji reactions' },
                      { key: 'autoReplyQuestions', label: 'Auto-reply questions', desc: 'Genuine questions about your content' },
                      { key: 'autoReplyLinkRequests', label: 'Auto-reply link requests', desc: 'Send DM + public reply for link asks' },
                      { key: 'autoReplyPurchaseIntent', label: 'Auto-reply purchase intent', desc: 'Price inquiries, buying signals' },
                      { key: 'flagNegative', label: 'Flag negative comments', desc: 'Send to inbox for human review' },
                      { key: 'flagSpam', label: 'Flag spam', desc: 'Auto-detect bots and spam' },
                      { key: 'threadChainingEnabled', label: 'Thread chaining', desc: 'Replies end with a conversation hook' },
                    ].map(({ key, label, desc }) => (
                      <div className="sdm-toggle-row" key={key}>
                        <div>
                          <div className="sdm-toggle-row-label">{label}</div>
                          <div className="sdm-toggle-row-desc">{desc}</div>
                        </div>
                        <label className="sdm-switch" style={{ width: 40, height: 22 }}>
                          <input type="checkbox" checked={!!(config as any)[key]} onChange={e => updateConfig({ [key]: e.target.checked } as any)} />
                          <div className="sdm-switch-track" />
                          <div className="sdm-switch-thumb" style={{ width: 15, height: 15, top: 2, left: 2 }} />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="sdm-card">
                    <div className="sdm-card-title">⏱️ Rate Limiting & Jitter</div>

                    <div style={{ marginBottom: 16 }}>
                      <div className="sdm-label">Max replies per hour</div>
                      <div className="sdm-slider-row">
                        <input type="range" className="sdm-slider" min={5} max={60} value={config.maxRepliesPerHour}
                          onChange={e => updateConfig({ maxRepliesPerHour: parseInt(e.target.value) })} />
                        <div className="sdm-slider-value">{config.maxRepliesPerHour}/hr</div>
                      </div>
                    </div>

                    <div>
                      <div className="sdm-label">Reply delay (jitter range)</div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input type="range" className="sdm-slider" min={5} max={60} value={config.jitterMinSeconds}
                          onChange={e => updateConfig({ jitterMinSeconds: parseInt(e.target.value) })} />
                        <span className="sdm-slider-value">{config.jitterMinSeconds}s</span>
                        <span style={{ color: '#4b5563', fontSize: 12 }}>–</span>
                        <input type="range" className="sdm-slider" min={60} max={300} value={config.jitterMaxSeconds}
                          onChange={e => updateConfig({ jitterMaxSeconds: parseInt(e.target.value) })} />
                        <span className="sdm-slider-value">{config.jitterMaxSeconds}s</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#4b5563', marginTop: 6 }}>
                        Poisson-distributed delay — mimics organic human response timing
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand voice and DM settings */}
                <div>
                  <div className="sdm-card">
                    <div className="sdm-card-title">🎙️ Brand Voice</div>

                    <div className="sdm-field">
                      <label className="sdm-label">Link URL (sent via DM for link requests)</label>
                      <input type="url" className="sdm-input" placeholder="https://your-link.com/resource"
                        value={config.linkUrl || ''} onChange={e => updateConfig({ linkUrl: e.target.value || null })} />
                    </div>

                    <div className="sdm-field">
                      <label className="sdm-label">Brand Persona</label>
                      <textarea className="sdm-input sdm-textarea"
                        placeholder={'Witty, direct, lowercase aesthetic. Never formal. Like a founder who\'s been building for years.'}
                        value={config.brandPersona || ''}
                        onChange={e => updateConfig({ brandPersona: e.target.value || null })} />
                    </div>

                    <div className="sdm-field">
                      <label className="sdm-label">Custom Instructions</label>
                      <textarea className="sdm-input sdm-textarea"
                        placeholder="Never mention competitor X. Always reference the course. Use first names when possible."
                        value={config.customInstructions || ''}
                        onChange={e => updateConfig({ customInstructions: e.target.value || null })} />
                    </div>
                  </div>

                  <div className="sdm-card">
                    <div className="sdm-card-title">✉️ Inbound DM Automation</div>

                    <div className="sdm-toggle-row">
                      <div>
                        <div className="sdm-toggle-row-label">Enable DM Auto-Reply</div>
                        <div className="sdm-toggle-row-desc">Auto-respond to incoming DMs using AI</div>
                      </div>
                      <label className="sdm-switch" style={{ width: 40, height: 22 }}>
                        <input type="checkbox" checked={config.dmAutoReplyEnabled} onChange={e => updateConfig({ dmAutoReplyEnabled: e.target.checked })} />
                        <div className="sdm-switch-track" />
                        <div className="sdm-switch-thumb" style={{ width: 15, height: 15, top: 2, left: 2 }} />
                      </label>
                    </div>

                    <div className="sdm-toggle-row">
                      <div>
                        <div className="sdm-toggle-row-label">Escalation Alerts</div>
                        <div className="sdm-toggle-row-desc">Flag complex DMs for human follow-up</div>
                      </div>
                      <label className="sdm-switch" style={{ width: 40, height: 22 }}>
                        <input type="checkbox" checked={config.dmEscalationEnabled} onChange={e => updateConfig({ dmEscalationEnabled: e.target.checked })} />
                        <div className="sdm-switch-track" />
                        <div className="sdm-switch-thumb" style={{ width: 15, height: 15, top: 2, left: 2 }} />
                      </label>
                    </div>

                    <div className="sdm-field" style={{ marginTop: 14 }}>
                      <label className="sdm-label">Max DM replies per hour</label>
                      <div className="sdm-slider-row">
                        <input type="range" className="sdm-slider" min={5} max={50} value={config.dmMaxRepliesPerHour}
                          onChange={e => updateConfig({ dmMaxRepliesPerHour: parseInt(e.target.value) })} />
                        <div className="sdm-slider-value">{config.dmMaxRepliesPerHour}/hr</div>
                      </div>
                    </div>

                    <div className="sdm-field">
                      <label className="sdm-label">Welcome Message (first DM from a user)</label>
                      <textarea className="sdm-input sdm-textarea"
                        placeholder="Hey! Thanks for reaching out. How can I help you today?"
                        value={config.dmWelcomeMessage || ''}
                        onChange={e => updateConfig({ dmWelcomeMessage: e.target.value || null })} />
                    </div>

                    <div className="sdm-field">
                      <label className="sdm-label">Knowledge Base (what the AI knows to answer DMs)</label>
                      <textarea className="sdm-input sdm-textarea" style={{ minHeight: 110 }}
                        placeholder={'FAQ and product info the AI should know:\n- Course costs $497\n- Includes lifetime access\n- Next cohort starts Nov 1st'}
                        value={config.dmKnowledgeBase || ''}
                        onChange={e => updateConfig({ dmKnowledgeBase: e.target.value || null })} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button className="sdm-btn sdm-btn-primary" onClick={saveConfig} disabled={saving}>
                  {saving ? '⏳ Saving...' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* ── Tab: Live Simulator ── */}
          {activeTab === 'simulator' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f3f4f6', margin: '0 0 6px' }}>🧪 Live Simulator</h2>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                  Test how SignalDM handles any comment or DM before going live. Nothing is posted.
                </p>
              </div>

              <div className="sdm-sim-layout">
                {/* Input side */}
                <div>
                  <div className="sdm-sim-type-tabs">
                    <button className={`sdm-sim-type-tab ${simType === 'comment' ? 'active' : ''}`} onClick={() => { setSimType('comment'); setSimResult(null); }}>
                      💬 Comment
                    </button>
                    <button className={`sdm-sim-type-tab ${simType === 'dm' ? 'active' : ''}`} onClick={() => { setSimType('dm'); setSimResult(null); }}>
                      ✉️ Inbound DM
                    </button>
                  </div>

                  {/* Quick Test Presets */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                      ⚡ Quick Test Scenarios:
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(simType === 'comment' ? COMMENT_PRESETS : DM_PRESETS).map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            if (simType === 'comment') {
                              setSimComment(preset.text);
                              if ('caption' in preset && preset.caption) setSimCaption(preset.caption);
                            } else {
                              setSimDmText(preset.text);
                            }
                          }}
                          style={{
                            background: 'rgba(139,92,246,0.1)',
                            border: '1px solid rgba(139,92,246,0.25)',
                            borderRadius: 14,
                            padding: '4px 10px',
                            fontSize: 11.5,
                            color: '#c4b5fd',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {simType === 'comment' ? (
                    <>
                      <div className="sdm-field">
                        <label className="sdm-label">Test Comment Text</label>
                        <textarea className="sdm-input sdm-textarea"
                          placeholder={'Try: "Where can I get this template?"\nOr: "This is exactly what I needed for my agency"\nOr: "Price gouging tbh"'}
                          value={simComment} onChange={e => setSimComment(e.target.value)} />
                      </div>
                      <div className="sdm-field">
                        <label className="sdm-label">Post Caption (optional context)</label>
                        <textarea className="sdm-input sdm-textarea"
                          placeholder="5 things I learned building a SaaS from $0 to $10k MRR..."
                          value={simCaption} onChange={e => setSimCaption(e.target.value)} />
                      </div>
                    </>
                  ) : (
                    <div className="sdm-field">
                      <label className="sdm-label">Inbound DM Text</label>
                      <textarea className="sdm-input sdm-textarea"
                        placeholder={'Try: "Hey, how much does the course cost?"\nOr: "Can you send me more info?"\nOr: "Is this still available?"'}
                        value={simDmText} onChange={e => setSimDmText(e.target.value)} />
                    </div>
                  )}

                  <button className="sdm-btn sdm-btn-primary" onClick={runSimulator}
                    disabled={simLoading || !(simType === 'comment' ? simComment : simDmText).trim()}
                    style={{ width: '100%', justifyContent: 'center' }}>
                    {simLoading ? '🧠 Analyzing...' : '▶ Run Simulation'}
                  </button>
                </div>

                {/* Result side */}
                <div>
                  {!simResult && !simLoading && (
                    <div className="sdm-sim-result" style={{ textAlign: 'center', padding: '48px 20px' }}>
                      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🧪</div>
                      <p style={{ color: '#4b5563', fontSize: 13 }}>Run a simulation to see how SignalDM would respond</p>
                    </div>
                  )}

                  {simLoading && (
                    <div className="sdm-sim-result" style={{ textAlign: 'center', padding: '48px 20px' }}>
                      <div className="sdm-spinner" />
                      <p style={{ color: '#6b7280', fontSize: 13 }}>Classifying intent...</p>
                    </div>
                  )}

                  {simResult && !simLoading && (
                    <div className="sdm-sim-result">
                      {simResult.blocked ? (
                        <div>
                          <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>🚫 Content Blocked</div>
                          <p style={{ color: '#9ca3af', fontSize: 13 }}>{simResult.reason}</p>
                        </div>
                      ) : (
                        <>
                          {/* Classification badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            {(() => {
                              const cls = simResult.classification;
                              const colors = CLASSIFICATION_COLORS[cls] || CLASSIFICATION_COLORS['unrelated'];
                              return (
                                <span className="sdm-classification-badge" style={{ background: colors.bg, color: colors.text }}>
                                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.dot, display: 'inline-block' }} />
                                  {CLASSIFICATION_LABELS[cls] || cls}
                                </span>
                              );
                            })()}
                            <span style={{ fontSize: 12, color: '#6b7280' }}>
                              {Math.round(simResult.confidence * 100)}% confidence
                            </span>
                          </div>

                          <div className="sdm-confidence-bar-wrap">
                            <div className="sdm-confidence-bar" style={{ width: `${simResult.confidence * 100}%` }} />
                          </div>

                          {/* Lead score */}
                          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>Lead score:</span>
                            <span style={{ fontWeight: 700, color: LEAD_SCORE_COLORS[simResult.leadScore] || '#6b7280', fontSize: 13 }}>
                              {LEAD_SCORE_LABELS[simResult.leadScore] || 'Unknown'}
                            </span>
                          </div>

                          {/* Action flags */}
                          <div className="sdm-action-flags">
                            <span className={`sdm-flag ${simResult.wouldAutoReply ? 'sdm-flag-yes' : 'sdm-flag-no'}`}>
                              {simResult.wouldAutoReply ? '✓' : '✗'} Auto-reply
                            </span>
                            {simResult.wouldSendDM !== undefined && (
                              <span className={`sdm-flag ${simResult.wouldSendDM ? 'sdm-flag-yes' : 'sdm-flag-no'}`}>
                                {simResult.wouldSendDM ? '✓' : '✗'} Send DM
                              </span>
                            )}
                            {simResult.wouldFlag && (
                              <span className="sdm-flag sdm-flag-warn">⚠️ Flag for review</span>
                            )}
                            {simResult.wouldEscalate && (
                              <span className="sdm-flag sdm-flag-warn">🔔 Escalate</span>
                            )}
                          </div>

                          {/* Reply preview */}
                          {simResult.suggestedReply && (
                            <div className="sdm-result-section">
                              <div className="sdm-result-section-label">Public Reply</div>
                              <div className="sdm-result-reply">{simResult.suggestedReply}</div>
                            </div>
                          )}

                          {simResult.suggestedDM && (
                            <div className="sdm-result-section">
                              <div className="sdm-result-section-label">DM Message</div>
                              <div className="sdm-result-reply">{simResult.suggestedDM}</div>
                            </div>
                          )}

                          {simResult.threadHook && (
                            <div className="sdm-result-section">
                              <div className="sdm-result-section-label">Thread Hook</div>
                              <div style={{ fontSize: 13, color: '#a78bfa', fontStyle: 'italic' }}>{simResult.threadHook}</div>
                            </div>
                          )}

                          {/* Reasoning */}
                          <div className="sdm-result-section">
                            <div className="sdm-result-section-label">Reasoning</div>
                            <div style={{ fontSize: 12.5, color: '#6b7280' }}>{simResult.reasoning}</div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Comment Feed ── */}
          {activeTab === 'feed' && (
            <div>
              {/* Stats */}
              {commentStats && (
                <div className="sdm-stats-row">
                  {[
                    { label: 'Total Processed', value: commentStats.total },
                    { label: 'Auto-Replied', value: commentStats.autoReplied },
                    { label: 'DMs Sent', value: commentStats.dmsSent },
                    { label: 'Flagged', value: commentStats.flagged },
                  ].map(stat => (
                    <div className="sdm-stat-card" key={stat.label}>
                      <div className="sdm-stat-value">{stat.value}</div>
                      <div className="sdm-stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Filter tabs & Search */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div className="sdm-filter-tabs" style={{ marginBottom: 0 }}>
                  {['all', 'positive', 'question', 'link_request', 'purchase_intent', 'negative', 'spam', 'harmful'].map(f => (
                    <button key={f} className={`sdm-filter-tab ${commentFilter === f ? 'active' : ''}`}
                      onClick={() => { setCommentFilter(f); setCommentPage(1); }}>
                      {f === 'all' ? 'All' : CLASSIFICATION_LABELS[f] || f}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="sdm-input"
                    placeholder="Search comments or @user..."
                    value={commentSearch}
                    onChange={e => setCommentSearch(e.target.value)}
                    style={{ width: 220, padding: '7px 12px', fontSize: 12.5 }}
                  />
                  <button className="sdm-btn sdm-btn-secondary" onClick={loadComments} style={{ padding: '7px 12px', fontSize: 12 }}>
                    ↻ Refresh
                  </button>
                </div>
              </div>

              {feedLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div className="sdm-spinner" />
                </div>
              ) : comments.length === 0 ? (
                <div className="sdm-empty">
                  <div className="sdm-empty-icon">💬</div>
                  <p>No comments yet. Enable automation and wait for comments to roll in.</p>
                </div>
              ) : (
                <>
                  <div className="sdm-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="sdm-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Comment</th>
                          <th>Classification</th>
                          <th>AI Reply</th>
                          <th>Lead</th>
                          <th>Status</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comments
                          .filter(c => {
                            if (!commentSearch.trim()) return true;
                            const q = commentSearch.toLowerCase();
                            return (
                              (c.commenter_username && c.commenter_username.toLowerCase().includes(q)) ||
                              (c.comment_text && c.comment_text.toLowerCase().includes(q)) ||
                              (c.suggested_reply && c.suggested_reply.toLowerCase().includes(q))
                            );
                          })
                          .map(c => {
                            const colors = CLASSIFICATION_COLORS[c.classification] || CLASSIFICATION_COLORS['unrelated'];
                            return (
                              <tr key={c.id}>
                                <td><span className="sdm-username">@{c.commenter_username || '—'}</span></td>
                                <td style={{ maxWidth: 200, color: '#d1d5db' }}>{c.comment_text}</td>
                                <td>
                                  <span className="sdm-classification-badge" style={{ background: colors.bg, color: colors.text, fontSize: 11 }}>
                                    {CLASSIFICATION_LABELS[c.classification] || c.classification}
                                  </span>
                                </td>
                                <td style={{ maxWidth: 200, color: '#9ca3af', fontSize: 12 }}>{c.suggested_reply || '—'}</td>
                                <td>
                                  <span style={{ color: LEAD_SCORE_COLORS[c.lead_score] || '#6b7280', fontWeight: 600, fontSize: 12 }}>
                                    {c.lead_score > 0 ? LEAD_SCORE_LABELS[c.lead_score] : '—'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {c.auto_replied && <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.12)', color: '#22c55e', borderRadius: 10, padding: '2px 6px' }}>replied</span>}
                                    {c.dm_sent && <span style={{ fontSize: 10, background: 'rgba(168,85,247,0.12)', color: '#a855f7', borderRadius: 10, padding: '2px 6px' }}>dm sent</span>}
                                  </div>
                                </td>
                                <td style={{ color: '#4b5563', fontSize: 11, whiteSpace: 'nowrap' }}>
                                  {new Date(c.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {commentStats && commentStats.total > 25 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, fontSize: 12.5, color: '#6b7280' }}>
                      <span>Showing page {commentPage} of {Math.ceil(commentStats.total / 25)} ({commentStats.total} total)</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="sdm-btn sdm-btn-secondary"
                          disabled={commentPage <= 1}
                          onClick={() => setCommentPage(p => Math.max(1, p - 1))}
                          style={{ padding: '5px 12px', fontSize: 12 }}
                        >
                          ← Previous
                        </button>
                        <button
                          className="sdm-btn sdm-btn-secondary"
                          disabled={commentPage >= Math.ceil(commentStats.total / 25)}
                          onClick={() => setCommentPage(p => p + 1)}
                          style={{ padding: '5px 12px', fontSize: 12 }}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Tab: Flagged Inbox ── */}
          {activeTab === 'inbox' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f3f4f6', margin: '0 0 4px' }}>⚠️ Flagged Inbox</h2>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                    Comments that need your personal touch. Hot leads are shown first.
                  </p>
                </div>
                <button className="sdm-btn sdm-btn-secondary" onClick={loadFlagged}>↻ Refresh</button>
              </div>

              <div className="sdm-filter-tabs">
                {['pending', 'approved', 'replied', 'rejected', 'all'].map(s => (
                  <button key={s} className={`sdm-filter-tab ${statusFilter === s ? 'active' : ''}`}
                    onClick={() => setStatusFilter(s)}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {s === 'pending' && pendingCount > 0 && <span style={{ marginLeft: 4, background: '#f97316', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 10 }}>{pendingCount}</span>}
                  </button>
                ))}
              </div>

              {inboxLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}><div className="sdm-spinner" /></div>
              ) : flagged.length === 0 ? (
                <div className="sdm-empty">
                  <div className="sdm-empty-icon">✅</div>
                  <p>No flagged comments — inbox is clear!</p>
                </div>
              ) : (
                flagged.map(item => {
                  const colors = CLASSIFICATION_COLORS[item.classification] || CLASSIFICATION_COLORS['unrelated'];
                  const isEditMode = editMode[item.id];
                  return (
                    <div key={item.id} className={`sdm-flagged-card ${item.priority === 'high' ? 'high-priority' : ''}`}>
                      <div className="sdm-flagged-header">
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span className="sdm-username">@{item.commenter_username || 'unknown'}</span>
                            <span className="sdm-classification-badge" style={{ background: colors.bg, color: colors.text, fontSize: 11 }}>
                              {CLASSIFICATION_LABELS[item.classification] || item.classification}
                            </span>
                            {item.lead_score >= 2 && (
                              <span style={{ fontSize: 11, background: 'rgba(249,115,22,0.15)', color: '#f97316', borderRadius: 10, padding: '2px 7px', fontWeight: 600 }}>
                                {LEAD_SCORE_LABELS[item.lead_score]}
                              </span>
                            )}
                            {item.priority === 'high' && (
                              <span style={{ fontSize: 10, background: 'rgba(249,115,22,0.2)', color: '#f97316', borderRadius: 10, padding: '2px 6px' }}>HIGH PRIORITY</span>
                            )}
                          </div>
                          <div className="sdm-flagged-comment">"{item.comment_text}"</div>
                          {item.reasoning && (
                            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>AI note: {item.reasoning}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#4b5563', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {item.status === 'pending' && (
                        <>
                          {/* AI reply preview / editable */}
                          {item.suggested_reply && item.suggested_reply !== 'SKIP' && (
                            <div>
                              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                                AI suggested reply{isEditMode ? ' (editing)' : ''}:
                              </div>
                              {isEditMode ? (
                                <textarea className="sdm-input sdm-textarea"
                                  value={editReplies[item.id] ?? item.suggested_reply}
                                  onChange={e => setEditReplies(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  style={{ minHeight: 80 }} />
                              ) : (
                                <div className="sdm-reply-preview">{editReplies[item.id] ?? item.suggested_reply}</div>
                              )}
                            </div>
                          )}

                          <div className="sdm-flagged-actions">
                            {item.suggested_reply && item.suggested_reply !== 'SKIP' && (
                              <button className="sdm-btn sdm-btn-success" style={{ fontSize: 12 }}
                                onClick={() => flaggedAction(item.id, 'approve')}>
                                ✅ Approve & Post
                              </button>
                            )}
                            <button className="sdm-btn sdm-btn-secondary" style={{ fontSize: 12 }}
                              onClick={() => setEditMode(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                              ✏️ {isEditMode ? 'Cancel Edit' : 'Edit & Reply'}
                            </button>
                            {isEditMode && (
                              <button className="sdm-btn sdm-btn-primary" style={{ fontSize: 12 }}
                                onClick={() => {
                                  flaggedAction(item.id, 'reply', editReplies[item.id] ?? item.suggested_reply);
                                  setEditMode(prev => ({ ...prev, [item.id]: false }));
                                }}>
                                Send Reply
                              </button>
                            )}
                            <button className="sdm-btn sdm-btn-danger" style={{ fontSize: 12 }}
                              onClick={() => flaggedAction(item.id, 'reject')}>
                              ❌ Dismiss
                            </button>
                          </div>
                        </>
                      )}

                      {item.status !== 'pending' && (
                        <div style={{ fontSize: 12.5, color: '#4b5563' }}>
                          Status: <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{item.status}</span>
                          {item.owner_reply && <div style={{ marginTop: 4 }}>Your reply: "{item.owner_reply}"</div>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Tab: DM Feed ── */}
          {activeTab === 'dms' && (
            <div>
              {dmStats && (
                <div className="sdm-stats-row">
                  {[
                    { label: 'Total DMs', value: dmStats.total },
                    { label: 'Auto-Replied', value: dmStats.autoReplied },
                    { label: 'Escalated', value: dmStats.escalated },
                    { label: 'Hot Leads', value: dmStats.hotLeads },
                  ].map(stat => (
                    <div className="sdm-stat-card" key={stat.label}>
                      <div className="sdm-stat-value">{stat.value}</div>
                      <div className="sdm-stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {!config.dmAutoReplyEnabled && (
                <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                  <div>
                    <div style={{ color: '#f97316', fontWeight: 600, fontSize: 13 }}>DM Auto-Reply is disabled</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>Enable it in Control Panel → DM Automation settings</div>
                  </div>
                  <button className="sdm-btn sdm-btn-secondary" style={{ marginLeft: 'auto', fontSize: 12 }}
                    onClick={() => setActiveTab('control')}>
                    Go to Settings
                  </button>
                </div>
              )}

              {dmsLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}><div className="sdm-spinner" /></div>
              ) : dms.length === 0 ? (
                <div className="sdm-empty">
                  <div className="sdm-empty-icon">✉️</div>
                  <p>No DMs processed yet. Enable DM auto-reply and wait for messages.</p>
                </div>
              ) : (
                <div className="sdm-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="sdm-table">
                    <thead>
                      <tr>
                        <th>Sender</th>
                        <th>Message</th>
                        <th>Classification</th>
                        <th>AI Reply</th>
                        <th>Lead</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dms.map(dm => {
                        const colors = CLASSIFICATION_COLORS[dm.classification] || CLASSIFICATION_COLORS['unrelated'];
                        return (
                          <tr key={dm.id}>
                            <td><span className="sdm-username">@{dm.sender_username || dm.sender_id}</span></td>
                            <td style={{ maxWidth: 200, color: '#d1d5db' }}>{dm.message_text}</td>
                            <td>
                              <span className="sdm-classification-badge" style={{ background: colors.bg, color: colors.text, fontSize: 11 }}>
                                {CLASSIFICATION_LABELS[dm.classification] || dm.classification}
                              </span>
                            </td>
                            <td style={{ maxWidth: 200, color: '#9ca3af', fontSize: 12 }}>{dm.ai_reply || '—'}</td>
                            <td>
                              <span style={{ color: LEAD_SCORE_COLORS[dm.lead_score] || '#6b7280', fontWeight: 600, fontSize: 12 }}>
                                {dm.lead_score > 0 ? LEAD_SCORE_LABELS[dm.lead_score] : '—'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {dm.auto_replied && <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.12)', color: '#22c55e', borderRadius: 10, padding: '2px 6px' }}>replied</span>}
                                {dm.escalated && <span style={{ fontSize: 10, background: 'rgba(249,115,22,0.12)', color: '#f97316', borderRadius: 10, padding: '2px 6px' }}>escalated</span>}
                              </div>
                            </td>
                            <td style={{ color: '#4b5563', fontSize: 11, whiteSpace: 'nowrap' }}>
                              {new Date(dm.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Toast */}
        {toast && (
          <div className="sdm-toast" style={{ borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)' }}>
            <span>{toast.type === 'error' ? '❌' : '✅'}</span>
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
