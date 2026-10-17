'use client';

import { useState, useEffect, useCallback } from 'react';
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

const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  positive:        { bg: 'rgba(16,185,129,0.10)', text: '#10b981', dot: '#10b981', border: 'rgba(16,185,129,0.25)' },
  question:        { bg: 'rgba(59,130,246,0.10)', text: '#3b82f6', dot: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
  link_request:    { bg: 'rgba(139,92,246,0.10)', text: '#8b5cf6', dot: '#8b5cf6', border: 'rgba(139,92,246,0.25)' },
  purchase_intent: { bg: 'rgba(245,158,11,0.10)', text: '#f59e0b', dot: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  negative:        { bg: 'rgba(239,68,68,0.10)',  text: '#ef4444', dot: '#ef4444', border: 'rgba(239,68,68,0.25)'  },
  spam:            { bg: 'rgba(107,114,128,0.10)', text: '#9ca3af', dot: '#9ca3af', border: 'rgba(107,114,128,0.2)' },
  harmful:         { bg: 'rgba(220,38,38,0.14)',  text: '#dc2626', dot: '#dc2626', border: 'rgba(220,38,38,0.3)'   },
  unrelated:       { bg: 'rgba(75,85,99,0.08)',   text: '#6b7280', dot: '#6b7280', border: 'rgba(75,85,99,0.2)'   },
  support:         { bg: 'rgba(234,179,8,0.10)',  text: '#eab308', dot: '#eab308', border: 'rgba(234,179,8,0.25)' },
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  positive: 'Positive', question: 'Question', link_request: 'Link Request',
  purchase_intent: 'Purchase Intent', negative: 'Negative', spam: 'Spam',
  harmful: 'Harmful', unrelated: 'Unrelated', support: 'Support',
};

const LEAD_SCORE_LABELS = ['Not a lead', 'Warm', 'Hot', 'Ready to buy'];
const LEAD_SCORE_COLORS = ['#6b7280', '#3b82f6', '#f59e0b', '#10b981'];

const TOGGLE_COLORS: Record<string, string> = {
  autoReplyPositive: 'color-green', autoReplyQuestions: 'color-blue',
  autoReplyLinkRequests: 'color-purple', autoReplyPurchaseIntent: 'color-amber',
  flagNegative: 'color-red', flagSpam: 'color-rose', threadChainingEnabled: 'color-purple',
};

const COMMENT_PRESETS = [
  { label: 'Link Request', text: 'Where can I get this template? Can you send me the link?', caption: 'New workflow template just dropped for engineering teams.' },
  { label: 'Purchase Intent', text: 'How much does this cost? I need this now!', caption: 'Pricing and packages for our enterprise automation suite.' },
  { label: 'Positive Praise', text: 'This workflow completely changed how our team operates!', caption: 'How we scaled our async communication.' },
  { label: 'Feature Question', text: 'Does this integrate with Slack and Supabase out of the box?', caption: 'Deep dive into our modern stack architecture.' },
  { label: 'Complaint', text: "Your tool charged my card twice and support hasn't responded!", caption: 'Product update.' },
  { label: 'Spam Bot', text: 'Invest in Bitcoin now and make 500% ROI in 24 hours! DM me!', caption: 'Weekly newsletter.' },
];

const DM_PRESETS = [
  { label: 'Price Inquiry', text: 'Hey, how much is your course and is there a payment plan?' },
  { label: 'Resource Ask', text: 'Hi! Could you send over the spreadsheet you mentioned in your story?' },
  { label: 'Partnership', text: 'We love your content! Would you be open to a brand collab next month?' },
  { label: 'Angry Issue', text: 'I bought the template 3 days ago and the download link is broken. Fix this.' },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  .sdm-root{min-height:calc(100vh - 100px);background:#080810;color:#e2e0ed;font-family:'Inter',sans-serif;border-radius:20px;border:1px solid rgba(255,255,255,0.07);box-shadow:0 8px 48px rgba(0,0,0,0.4);overflow:hidden;position:relative;}
  .sdm-header{padding:26px 32px 0;background:linear-gradient(180deg,rgba(124,58,237,0.07) 0%,transparent 100%);border-bottom:1px solid rgba(255,255,255,0.055);position:relative;}
  .sdm-header::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(124,58,237,0.6),rgba(219,39,119,0.35),transparent);}
  .sdm-header-inner{max-width:1300px;margin:0 auto;}
  .sdm-title-row{display:flex;align-items:center;gap:14px;margin-bottom:8px;justify-content:space-between;}
  .sdm-logo-mark{width:42px;height:42px;background:linear-gradient(135deg,#7c3aed 0%,#db2777 100%);border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 0 1px rgba(255,255,255,0.08),0 4px 20px rgba(124,58,237,0.45);}
  .sdm-title{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.6px;line-height:1;}
  .sdm-subtitle{font-size:12px;color:rgba(255,255,255,0.35);margin-top:3px;}
  .sdm-tabs{display:flex;gap:2px;margin-top:20px;}
  .sdm-tab{padding:9px 18px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.38);border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.22s;display:flex;align-items:center;gap:7px;white-space:nowrap;position:relative;font-family:'Inter',sans-serif;}
  .sdm-tab:hover{color:rgba(255,255,255,0.7);}
  .sdm-tab.active{color:#fff;border-bottom-color:#7c3aed;}
  .sdm-tab.active::after{content:'';position:absolute;bottom:-1px;left:18px;right:18px;height:2px;background:linear-gradient(90deg,#7c3aed,#db2777);border-radius:2px 2px 0 0;filter:blur(2px);}
  .sdm-tab-badge{background:rgba(124,58,237,0.25);color:#a78bfa;border-radius:20px;padding:1px 7px;font-size:10.5px;font-weight:700;border:1px solid rgba(124,58,237,0.3);}
  .sdm-body{max-width:1300px;margin:0 auto;padding:28px 32px;}

  /* MASTER TOGGLE */
  .sdm-master-toggle{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,rgba(17,16,28,0.9) 0%,rgba(30,20,50,0.7) 100%);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:20px 24px;margin-bottom:24px;transition:all 0.4s ease;}
  .sdm-master-toggle.active{border-color:rgba(124,58,237,0.35);box-shadow:0 0 40px rgba(124,58,237,0.1),inset 0 0 40px rgba(124,58,237,0.04);}
  .sdm-master-pulse{width:10px;height:10px;border-radius:50%;background:#6b7280;transition:all 0.4s ease;flex-shrink:0;}
  .sdm-master-toggle.active .sdm-master-pulse{background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,0.2),0 0 12px rgba(16,185,129,0.4);animation:sdm-pulse 2s ease-in-out infinite;}
  @keyframes sdm-pulse{0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,0.2),0 0 12px rgba(16,185,129,0.4);}50%{box-shadow:0 0 0 6px rgba(16,185,129,0.08),0 0 20px rgba(16,185,129,0.3);}}
  .sdm-toggle-info h3{font-size:14.5px;font-weight:700;color:#f3f4f6;margin:0 0 3px;}
  .sdm-toggle-info p{font-size:12px;color:rgba(255,255,255,0.38);margin:0;}

  /* POWER TOGGLE (master) */
  .sdm-power-toggle{position:relative;width:64px;height:34px;cursor:pointer;flex-shrink:0;}
  .sdm-power-toggle input{display:none;}
  .sdm-power-track{position:absolute;inset:0;background:rgba(255,255,255,0.07);border-radius:17px;border:1.5px solid rgba(255,255,255,0.1);transition:all 0.35s;}
  .sdm-power-toggle input:checked + .sdm-power-track{background:linear-gradient(135deg,#7c3aed,#9d4edd);border-color:rgba(124,58,237,0.8);box-shadow:0 0 0 3px rgba(124,58,237,0.2),0 0 20px rgba(124,58,237,0.4);}
  .sdm-power-thumb{position:absolute;top:4px;left:4px;width:24px;height:24px;background:#fff;border-radius:50%;transition:all 0.35s cubic-bezier(.34,1.56,.64,1);box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;}
  .sdm-power-toggle input:checked ~ .sdm-power-thumb{transform:translateX(30px);}

  /* PILL TOGGLE (comment rows) */
  .sdm-pill-toggle{position:relative;width:38px;height:21px;cursor:pointer;flex-shrink:0;}
  .sdm-pill-toggle input{display:none;}
  .sdm-pill-track{position:absolute;inset:0;border-radius:11px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.09);transition:all 0.28s;}
  .sdm-pill-thumb{position:absolute;top:3px;left:3px;width:13px;height:13px;border-radius:50%;background:rgba(255,255,255,0.5);transition:all 0.28s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 4px rgba(0,0,0,0.4);}
  .sdm-pill-toggle input:checked ~ .sdm-pill-thumb{transform:translateX(17px);background:#fff;}
  .sdm-pill-toggle.color-green input:checked + .sdm-pill-track{background:rgba(16,185,129,0.25);border-color:rgba(16,185,129,0.5);box-shadow:0 0 10px rgba(16,185,129,0.2);}
  .sdm-pill-toggle.color-green input:checked ~ .sdm-pill-thumb{background:#10b981;}
  .sdm-pill-toggle.color-blue input:checked + .sdm-pill-track{background:rgba(59,130,246,0.25);border-color:rgba(59,130,246,0.5);box-shadow:0 0 10px rgba(59,130,246,0.2);}
  .sdm-pill-toggle.color-blue input:checked ~ .sdm-pill-thumb{background:#3b82f6;}
  .sdm-pill-toggle.color-purple input:checked + .sdm-pill-track{background:rgba(139,92,246,0.25);border-color:rgba(139,92,246,0.5);box-shadow:0 0 10px rgba(139,92,246,0.2);}
  .sdm-pill-toggle.color-purple input:checked ~ .sdm-pill-thumb{background:#8b5cf6;}
  .sdm-pill-toggle.color-amber input:checked + .sdm-pill-track{background:rgba(245,158,11,0.25);border-color:rgba(245,158,11,0.5);box-shadow:0 0 10px rgba(245,158,11,0.2);}
  .sdm-pill-toggle.color-amber input:checked ~ .sdm-pill-thumb{background:#f59e0b;}
  .sdm-pill-toggle.color-red input:checked + .sdm-pill-track{background:rgba(239,68,68,0.22);border-color:rgba(239,68,68,0.5);box-shadow:0 0 10px rgba(239,68,68,0.18);}
  .sdm-pill-toggle.color-red input:checked ~ .sdm-pill-thumb{background:#ef4444;}
  .sdm-pill-toggle.color-rose input:checked + .sdm-pill-track{background:rgba(244,63,94,0.22);border-color:rgba(244,63,94,0.5);box-shadow:0 0 10px rgba(244,63,94,0.18);}
  .sdm-pill-toggle.color-rose input:checked ~ .sdm-pill-thumb{background:#f43f5e;}

  /* SEGMENTED TOGGLE (DM section) */
  .sdm-seg-toggle{position:relative;width:44px;height:24px;cursor:pointer;flex-shrink:0;}
  .sdm-seg-toggle input{display:none;}
  .sdm-seg-track{position:absolute;inset:0;border-radius:7px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);transition:all 0.3s;overflow:hidden;}
  .sdm-seg-track::before{content:'';position:absolute;top:0;left:0;width:50%;height:100%;background:rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.1);transition:all 0.3s;}
  .sdm-seg-toggle input:checked + .sdm-seg-track{background:rgba(139,92,246,0.18);border-color:rgba(139,92,246,0.45);}
  .sdm-seg-toggle input:checked + .sdm-seg-track::before{left:50%;background:rgba(139,92,246,0.3);border-right:none;border-left:1px solid rgba(139,92,246,0.3);}
  .sdm-seg-thumb{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:4px;background:rgba(255,255,255,0.7);transition:all 0.3s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 4px rgba(0,0,0,0.3);}
  .sdm-seg-toggle input:checked ~ .sdm-seg-thumb{transform:translateX(20px);background:#a78bfa;box-shadow:0 0 8px rgba(167,139,250,0.5);}

  /* CARDS */
  .sdm-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.055);border-radius:16px;padding:20px 22px;margin-bottom:14px;transition:border-color 0.2s;}
  .sdm-card:hover{border-color:rgba(255,255,255,0.09);}
  .sdm-card.section-comment{border-top:2px solid rgba(59,130,246,0.3);}
  .sdm-card.section-brand{border-top:2px solid rgba(139,92,246,0.3);}
  .sdm-card.section-dm{border-top:2px solid rgba(16,185,129,0.3);}
  .sdm-card.section-rate{border-top:2px solid rgba(245,158,11,0.3);}
  .sdm-card.section-feed{border-top:2px solid rgba(139,92,246,0.3);}
  .sdm-card.section-sim{border-top:2px solid rgba(16,185,129,0.3);}
  .sdm-card-title{font-size:11px;font-weight:700;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
  .sdm-card-title-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
  .sdm-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  @media(max-width:900px){.sdm-grid-2{grid-template-columns:1fr;}.sdm-body{padding:20px 16px;}.sdm-header{padding:20px 16px 0;}}

  /* FORM */
  .sdm-field{margin-bottom:14px;}
  .sdm-label{display:block;font-size:11.5px;font-weight:600;color:rgba(255,255,255,0.45);margin-bottom:6px;}
  .sdm-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:10px 13px;font-size:13px;color:#f3f4f6;font-family:'Inter',sans-serif;transition:all 0.2s;box-sizing:border-box;outline:none;}
  .sdm-input::placeholder{color:rgba(255,255,255,0.2);}
  .sdm-input:focus{border-color:rgba(124,58,237,0.5);background:rgba(255,255,255,0.05);box-shadow:0 0 0 3px rgba(124,58,237,0.1);}
  .sdm-textarea{min-height:90px;resize:vertical;line-height:1.65;}
  .sdm-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
  .sdm-toggle-row:last-child{border-bottom:none;}
  .sdm-toggle-row-label{font-size:13px;color:#d1d5db;font-weight:500;}
  .sdm-toggle-row-desc{font-size:11.5px;color:rgba(255,255,255,0.3);margin-top:2px;}
  .sdm-slider-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
  .sdm-slider{flex:1;-webkit-appearance:none;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;outline:none;cursor:pointer;}
  .sdm-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:#7c3aed;border-radius:50%;cursor:pointer;box-shadow:0 0 0 3px rgba(124,58,237,0.2),0 2px 8px rgba(124,58,237,0.5);}
  .sdm-slider-value{font-size:12.5px;font-weight:700;color:#a78bfa;min-width:48px;text-align:right;}

  /* BUTTONS */
  .sdm-btn{padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 0.2s;display:inline-flex;align-items:center;gap:7px;font-family:'Inter',sans-serif;}
  .sdm-btn-primary{background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,0.3),0 0 0 1px rgba(124,58,237,0.5);}
  .sdm-btn-primary:hover{box-shadow:0 6px 24px rgba(124,58,237,0.45),0 0 0 1px rgba(124,58,237,0.6);transform:translateY(-1px);}
  .sdm-btn-primary:active{transform:translateY(0);}
  .sdm-btn-primary:disabled{opacity:0.45;cursor:not-allowed;transform:none;box-shadow:none;}
  .sdm-btn-secondary{background:rgba(255,255,255,0.06);color:#d1d5db;border:1px solid rgba(255,255,255,0.1);}
  .sdm-btn-secondary:hover{background:rgba(255,255,255,0.09);}
  .sdm-btn-danger{background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);}
  .sdm-btn-danger:hover{background:rgba(239,68,68,0.18);}
  .sdm-btn-success{background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.25);}
  .sdm-btn-success:hover{background:rgba(16,185,129,0.18);}
  .sdm-save-bar{display:flex;justify-content:flex-end;gap:10px;margin-top:10px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);}

  /* SIMULATOR */
  .sdm-sim-layout{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;}
  @media(max-width:900px){.sdm-sim-layout{grid-template-columns:1fr;}}
  .sdm-sim-result{background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.12);border-radius:16px;padding:20px;position:relative;overflow:hidden;}
  .sdm-sim-result::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(16,185,129,0.4),transparent);}
  .sdm-type-pills{display:flex;gap:6px;margin-bottom:16px;}
  .sdm-type-pill{padding:6px 14px;border-radius:20px;font-size:12.5px;font-weight:600;cursor:pointer;border:1.5px solid rgba(255,255,255,0.1);background:transparent;color:rgba(255,255,255,0.4);transition:all 0.2s;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:6px;}
  .sdm-type-pill:hover{color:rgba(255,255,255,0.7);}
  .sdm-type-pill.active{background:rgba(124,58,237,0.2);border-color:rgba(124,58,237,0.5);color:#c4b5fd;box-shadow:0 0 12px rgba(124,58,237,0.15);}
  .sdm-classification-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid transparent;}
  .sdm-confidence-bar-wrap{height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;margin-top:10px;}
  .sdm-confidence-bar{height:100%;background:linear-gradient(90deg,#7c3aed,#10b981);border-radius:2px;transition:width 0.6s ease;}
  .sdm-result-section{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.05);}
  .sdm-result-section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.3);margin-bottom:7px;}
  .sdm-result-reply{font-size:13px;color:#e5e7eb;line-height:1.65;background:rgba(255,255,255,0.04);border-radius:10px;padding:11px 13px;border:1px solid rgba(255,255,255,0.06);}
  .sdm-action-flags{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;}
  .sdm-flag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11.5px;font-weight:600;}
  .sdm-flag-yes{background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.25);}
  .sdm-flag-no{background:rgba(107,114,128,0.1);color:#6b7280;border:1px solid rgba(107,114,128,0.15);}
  .sdm-flag-warn{background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid rgba(245,158,11,0.25);}
  .sdm-presets-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
  .sdm-preset-chip{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:20px;padding:4px 11px;font-size:11.5px;color:rgba(255,255,255,0.55);cursor:pointer;transition:all 0.18s;font-family:'Inter',sans-serif;}
  .sdm-preset-chip:hover{background:rgba(124,58,237,0.14);border-color:rgba(124,58,237,0.35);color:#c4b5fd;}

  /* TABLE */
  .sdm-table{width:100%;border-collapse:collapse;}
  .sdm-table th{text-align:left;font-size:10.5px;font-weight:700;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.08em;padding:10px 13px;border-bottom:1px solid rgba(255,255,255,0.06);white-space:nowrap;}
  .sdm-table td{padding:11px 13px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;vertical-align:top;}
  .sdm-table tr:last-child td{border-bottom:none;}
  .sdm-table tbody tr{transition:background 0.15s;}
  .sdm-table tbody tr:hover td{background:rgba(255,255,255,0.02);}
  .sdm-username{font-weight:700;color:#a78bfa;font-size:12.5px;}

  /* STATS */
  .sdm-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px;}
  @media(max-width:768px){.sdm-stats-row{grid-template-columns:1fr 1fr;}}
  .sdm-stat-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px;text-align:center;transition:all 0.2s;cursor:default;}
  .sdm-stat-card:hover{border-color:rgba(124,58,237,0.2);transform:translateY(-1px);}
  .sdm-stat-value{font-size:28px;font-weight:800;color:#a78bfa;line-height:1;margin-bottom:6px;letter-spacing:-1px;}
  .sdm-stat-label{font-size:11px;color:rgba(255,255,255,0.35);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;}

  /* FILTER TABS */
  .sdm-filter-tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px;}
  .sdm-filter-tab{padding:5px 13px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,0.08);background:transparent;color:rgba(255,255,255,0.38);transition:all 0.18s;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:5px;}
  .sdm-filter-tab.active{background:rgba(124,58,237,0.18);border-color:rgba(124,58,237,0.4);color:#c4b5fd;}
  .sdm-filter-tab:hover{color:rgba(255,255,255,0.7);border-color:rgba(255,255,255,0.15);}

  /* FLAGGED */
  .sdm-flagged-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.065);border-radius:15px;padding:18px 20px;margin-bottom:10px;transition:all 0.2s;}
  .sdm-flagged-card:hover{border-color:rgba(124,58,237,0.22);transform:translateY(-1px);}
  .sdm-flagged-card.high-priority{border-color:rgba(245,158,11,0.25);background:rgba(245,158,11,0.03);}
  .sdm-flagged-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;}
  .sdm-flagged-comment{font-size:13.5px;color:#f3f4f6;line-height:1.55;flex:1;font-style:italic;}
  .sdm-reply-preview{background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.15);border-radius:10px;padding:11px 13px;font-size:13px;color:#d1d5db;line-height:1.6;margin-bottom:10px;}
  .sdm-flagged-actions{display:flex;gap:7px;flex-wrap:wrap;}

  /* MISC */
  .sdm-ig-connected{display:flex;align-items:center;gap:6px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:20px;padding:5px 12px;font-size:12px;color:#34d399;}
  .sdm-ig-dot{width:6px;height:6px;border-radius:50%;background:#10b981;animation:sdm-pulse 2s ease-in-out infinite;}
  .sdm-toast{position:fixed;bottom:24px;right:24px;background:rgba(12,12,20,0.96);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px 18px;font-size:13px;color:#f3f4f6;display:flex;align-items:center;gap:10px;z-index:9999;box-shadow:0 12px 40px rgba(0,0,0,0.6);animation:sdm-toast-in 0.3s cubic-bezier(.34,1.56,.64,1);max-width:340px;backdrop-filter:blur(20px);}
  @keyframes sdm-toast-in{from{opacity:0;transform:translateY(12px) scale(0.95);}to{opacity:1;transform:translateY(0) scale(1);}}
  .sdm-empty{text-align:center;padding:56px 20px;color:rgba(255,255,255,0.25);}
  .sdm-empty p{font-size:13.5px;margin:8px 0 0;}
  .sdm-spinner{width:30px;height:30px;border:2.5px solid rgba(124,58,237,0.15);border-top-color:#7c3aed;border-radius:50%;animation:sdm-spin 0.75s linear infinite;margin:0 auto 14px;}
  @keyframes sdm-spin{to{transform:rotate(360deg);}}
  .sdm-tab-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
  .sdm-tab-heading h2{font-size:17px;font-weight:700;color:#f3f4f6;margin:0 0 4px;letter-spacing:-0.3px;}
  .sdm-tab-heading p{font-size:12.5px;color:rgba(255,255,255,0.35);margin:0;}
  .sdm-warning-banner{background:linear-gradient(135deg,rgba(239,68,68,0.08) 0%,rgba(245,158,11,0.05) 100%);border:1px solid rgba(239,68,68,0.2);border-radius:14px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
  .sdm-info-banner{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.18);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;}
  .sdm-no-workspace{text-align:center;padding:80px 20px;}
  .sdm-pagination{display:flex;align-items:center;justify-content:space-between;margin-top:14px;font-size:12.5px;color:rgba(255,255,255,0.3);}
  .sdm-pagination-btns{display:flex;gap:8px;}
`;

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
  const [igConnection, setIgConnection] = useState<{ status: 'connected' | 'not_connected' | 'expired'; username?: string } | null>(null);
  const [comments, setComments] = useState<CommentLog[]>([]);
  const [commentStats, setCommentStats] = useState<any>(null);
  const [commentFilter, setCommentFilter] = useState('all');
  const [commentSearch, setCommentSearch] = useState('');
  const [commentPage, setCommentPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(false);
  const [dms, setDms] = useState<DmLog[]>([]);
  const [dmStats, setDmStats] = useState<any>(null);
  const [dmsLoading, setDmsLoading] = useState(false);
  const [flagged, setFlagged] = useState<FlaggedComment[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [inboxLoading, setInboxLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [editReplies, setEditReplies] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [simType, setSimType] = useState<'comment' | 'dm'>('comment');
  const [simComment, setSimComment] = useState('');
  const [simCaption, setSimCaption] = useState('');
  const [simDmText, setSimDmText] = useState('');
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [syncingWebhook, setSyncingWebhook] = useState(false);
  const [syncingComments, setSyncingComments] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const syncLiveComments = async () => {
    if (!workspaceId) return;
    setSyncingComments(true);
    try {
      const res = await fetch('/api/instagram/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId }) });
      const data = await res.json();
      if (data.ok) {
        if (data.newCommentsProcessed > 0) {
          showToast(`Synced ${data.newCommentsProcessed} comment${data.newCommentsProcessed > 1 ? 's' : ''} (${data.repliesPosted} auto-replied)!`, 'success');
        } else if (data.totalCommentsExamined > 0) {
          showToast(`Checked ${data.totalCommentsExamined} comments across ${data.mediaCount || 0} posts — all already processed.`, 'success');
        } else if (data.mediaCount === 0) {
          showToast('No Instagram posts found for this account. Ensure account has published posts.', 'error');
        } else {
          showToast(`Checked ${data.mediaCount} post${data.mediaCount > 1 ? 's' : ''}. No new comments found on Instagram.`, 'success');
        }
      } else {
        showToast(data.message || data.error || 'Failed to sync comments', 'error');
      }
    } catch {
      showToast('Error syncing comments with Instagram', 'error');
    } finally {
      setSyncingComments(false);
      loadComments();
    }
  };

  const syncWebhook = async () => {
    if (!workspaceId) return;
    setSyncingWebhook(true);
    try {
      const res = await fetch('/api/instagram/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId }) });
      const data = await res.json();
      if (res.ok && data.success) { showToast('Webhook synced with Meta Graph API'); }
      else { showToast(data.error || 'Failed to sync webhook', 'error'); }
    } catch { showToast('Network error', 'error'); }
    finally { setSyncingWebhook(false); }
  };

  useEffect(() => {
    fetch('/api/platform/connections', { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(data => { if (data?.instagram) setIgConnection(data.instagram); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    fetch(`/api/instagram/automation?workspaceId=${workspaceId}`).then(r => r.json()).then(data => { setConfig(data); setLoading(false); }).catch(() => { setLoading(false); showToast('Failed to load config', 'error'); });
  }, [workspaceId]);

  const loadComments = useCallback(async () => {
    if (!workspaceId) return;
    setFeedLoading(true);
    try {
      const res = await fetch(`/api/instagram/comments?workspaceId=${workspaceId}&page=${commentPage}&limit=25&classification=${commentFilter}`);
      const data = await res.json();
      setComments(data.comments || []); setCommentStats(data.stats || null);
    } finally { setFeedLoading(false); }
  }, [workspaceId, commentPage, commentFilter]);

  const loadFlagged = useCallback(async () => {
    if (!workspaceId) return;
    setInboxLoading(true);
    try {
      const res = await fetch(`/api/instagram/flagged?workspaceId=${workspaceId}&status=${statusFilter}`);
      const data = await res.json();
      setFlagged(data.flagged || []); setPendingCount(data.statusCounts?.pending || 0);
    } finally { setInboxLoading(false); }
  }, [workspaceId, statusFilter]);

  const loadDms = useCallback(async () => {
    if (!workspaceId) return;
    setDmsLoading(true);
    try {
      const res = await fetch(`/api/instagram/dms?workspaceId=${workspaceId}`);
      const data = await res.json();
      setDms(data.dms || []); setDmStats(data.stats || null);
    } finally { setDmsLoading(false); }
  }, [workspaceId]);

  useEffect(() => { if (activeTab === 'feed') loadComments(); }, [activeTab, loadComments]);
  useEffect(() => { if (activeTab === 'inbox') loadFlagged(); }, [activeTab, loadFlagged]);
  useEffect(() => { if (activeTab === 'dms') loadDms(); }, [activeTab, loadDms]);

  useEffect(() => {
    if (!workspaceId) return;
    let channel: any = null;
    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
        const supabase = getSupabaseBrowserClient();
        channel = supabase.channel(`signaldm-live-${workspaceId}`)
          .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'instagram_comment_logs', filter: `workspace_id=eq.${workspaceId}` }, () => { loadComments(); })
          .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'instagram_flagged_comments', filter: `workspace_id=eq.${workspaceId}` }, () => { loadFlagged(); })
          .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'instagram_dm_logs', filter: `workspace_id=eq.${workspaceId}` }, () => { loadDms(); })
          .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'instagram_flagged_dms', filter: `workspace_id=eq.${workspaceId}` }, () => { loadFlagged(); })
          .subscribe((status: string) => { if (status === 'SUBSCRIBED') console.log('[SignalDM] Realtime connected'); });
      } catch (err) { console.warn('[SignalDM] Realtime failed', err); }
    })();
    return () => { if (channel) { import('@/lib/supabase/browser').then(({ getSupabaseBrowserClient }) => { getSupabaseBrowserClient().removeChannel(channel!); }).catch(() => {}); } };
  }, [workspaceId, loadComments, loadFlagged, loadDms]);

  const saveConfig = async () => {
    if (!workspaceId || !config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/instagram/automation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId, ...config }) });
      if (res.ok) showToast('Settings saved'); else showToast('Failed to save', 'error');
    } finally { setSaving(false); }
  };

  const runSimulator = async () => {
    if (!workspaceId) return;
    const inputText = simType === 'comment' ? simComment : simDmText;
    if (!inputText.trim()) return;
    setSimLoading(true); setSimResult(null);
    try {
      const res = await fetch('/api/instagram/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId, commentText: simType === 'comment' ? simComment : undefined, postCaption: simType === 'comment' ? simCaption : undefined, isDmSimulation: simType === 'dm', dmText: simType === 'dm' ? simDmText : undefined }) });
      const data = await res.json(); setSimResult(data);
    } finally { setSimLoading(false); }
  };

  const flaggedAction = async (id: string, action: 'approve' | 'reject' | 'reply', ownerReply?: string) => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/instagram/flagged/${id}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId, action, ownerReply }) });
      if (res.ok) { showToast(action === 'reject' ? 'Dismissed' : 'Reply posted'); loadFlagged(); }
      else { const err = await res.json(); showToast(err.error || 'Action failed', 'error'); }
    } catch { showToast('Network error', 'error'); }
  };

  const updateConfig = (patch: Partial<AutomationConfig>) => { setConfig(prev => prev ? { ...prev, ...patch } : prev); };

  // SVG helpers
  const IcoRefresh = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 116 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M2 12V8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const IcoCheck = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8.5l4 4 8-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const IcoSpin = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ animation: 'sdm-spin 0.75s linear infinite' }}><circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/><path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>;
  const IcoArrow = () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const IcoGrid = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>;
  const IcoPlay = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 5-10 5V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>;
  const IcoMsg = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>;
  const IcoStar = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1L10 6h5L11 9l2 5-5-3-5 3 2-5L1 6h5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
  const IcoMail = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  const IcoSignal = () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="3" stroke="white" strokeWidth="1.8"/><path d="M5 17a8 8 0 0112 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/><path d="M2 20a12 12 0 0118 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/><path d="M8 6a5 5 0 016 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/><path d="M5.5 3.5a9 9 0 0111 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/></svg>;
  const IcoWarn = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#f59e0b" strokeWidth="1.4"/><path d="M9 5v4M9 12v1" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round"/></svg>;

  if (!workspaceId && userCtx?.loading) {
    return (<><style>{CSS}</style><div className="sdm-root" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}><div style={{ textAlign:'center' }}><div className="sdm-spinner" /><p style={{ color:'rgba(255,255,255,0.35)',fontSize:13 }}>Connecting workspace...</p></div></div></>);
  }

  if (!workspaceId) {
    return (<><style>{CSS}</style><div className="sdm-root"><div className="sdm-no-workspace"><svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin:'0 auto 18px',display:'block' }}><circle cx="24" cy="24" r="22" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5"/><path d="M24 14v10l6 6" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><h2 style={{ color:'#a78bfa',marginBottom:8,fontSize:20,fontWeight:700 }}>No workspace found</h2><p style={{ color:'rgba(255,255,255,0.35)',marginBottom:20,fontSize:13 }}>Create or join a workspace to access SignalDM.</p><a href="/dashboard" style={{ display:'inline-block',padding:'9px 22px',borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',fontSize:13,fontWeight:600,textDecoration:'none' }}>Go to Overview</a></div></div></>);
  }

  if (loading || !config) {
    return (<><style>{CSS}</style><div className="sdm-root" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}><div style={{ textAlign:'center' }}><div className="sdm-spinner" /><p style={{ color:'rgba(255,255,255,0.35)',fontSize:13 }}>Loading SignalDM...</p></div></div></>);
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="sdm-root">

        {/* HEADER */}
        <div className="sdm-header">
          <div className="sdm-header-inner">
            <div className="sdm-title-row">
              <div style={{ display:'flex',alignItems:'center',gap:13 }}>
                <div className="sdm-logo-mark"><IcoSignal /></div>
                <div>
                  <div className="sdm-title">SignalDM</div>
                  <div className="sdm-subtitle">Instagram Comment &amp; DM Automation Engine</div>
                </div>
              </div>
              {igConnection && (
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  {igConnection.status === 'connected' ? (
                    <>
                      <div className="sdm-ig-connected"><span className="sdm-ig-dot" /><span style={{ fontWeight:600 }}>@{igConnection.username || 'instagram'}</span><span style={{ color:'rgba(255,255,255,0.35)',fontSize:11 }}>connected</span></div>
                      <button onClick={syncWebhook} disabled={syncingWebhook} style={{ background:'rgba(124,58,237,0.12)',border:'1px solid rgba(124,58,237,0.28)',borderRadius:20,padding:'5px 13px',fontSize:11.5,color:'#c4b5fd',cursor:syncingWebhook?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:5,transition:'all 0.2s',fontFamily:'Inter,sans-serif',fontWeight:600 }}>
                        <IcoRefresh />{syncingWebhook ? 'Syncing...' : 'Sync Webhook'}
                      </button>
                    </>
                  ) : (
                    <a href={`/api/auth/platform/connect?platform=instagram&workspaceId=${workspaceId || ''}`} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.28)',borderRadius:20,padding:'5px 13px',fontSize:12,color:'#f87171',textDecoration:'none',fontWeight:600 }}>
                      <span style={{ width:6,height:6,borderRadius:'50%',background:'#ef4444',display:'inline-block' }} />Not Connected — Connect
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="sdm-tabs">
              {[
                { id:'control',   label:'Control Panel',  icon:<IcoGrid /> },
                { id:'simulator', label:'Live Simulator', icon:<IcoPlay /> },
                { id:'feed',      label:'Comment Feed',   icon:<IcoMsg />,  badge:commentStats?.total },
                { id:'inbox',     label:'Flagged Inbox',  icon:<IcoStar />, badge:pendingCount||undefined },
                { id:'dms',       label:'DM Feed',        icon:<IcoMail />, badge:dmStats?.total },
              ].map(tab => (
                <button key={tab.id} className={`sdm-tab ${activeTab===tab.id?'active':''}`} onClick={() => setActiveTab(tab.id as any)}>
                  {tab.icon}{tab.label}{tab.badge ? <span className="sdm-tab-badge">{tab.badge}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sdm-body">

          {/* CONTROL PANEL */}
          {activeTab === 'control' && (
            <div>
              {igConnection && igConnection.status !== 'connected' && (
                <div className="sdm-warning-banner">
                  <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" style={{ flexShrink:0 }}><circle cx="13" cy="13" r="11.5" stroke="#ef4444" strokeWidth="1.5"/><path d="M13 8v6M13 17v1.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                    <div>
                      <div style={{ color:'#f87171',fontWeight:700,fontSize:13 }}>{igConnection.status==='expired'?'Instagram connection expired':'Instagram not connected'}</div>
                      <div style={{ color:'rgba(255,255,255,0.38)',fontSize:12,marginTop:2 }}>Connect your Instagram Creator or Business account to enable automation.</div>
                    </div>
                  </div>
                  <a href={`/api/auth/platform/connect?platform=instagram&workspaceId=${workspaceId||''}`} style={{ background:'linear-gradient(135deg,#e1306c,#c13584)',color:'#fff',padding:'8px 18px',borderRadius:10,fontSize:12.5,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap' }}>Connect Instagram</a>
                </div>
              )}

              {/* MASTER POWER TOGGLE */}
              <div className={`sdm-master-toggle ${config.enabled?'active':''}`}>
                <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                  <span className="sdm-master-pulse" />
                  <div className="sdm-toggle-info">
                    <h3>SignalDM Automation — {config.enabled?'LIVE':'PAUSED'}</h3>
                    <p>{config.enabled?'Processing comments in real-time. Replies fire after jitter delay.':'Enable to start auto-handling comments. All settings are saved.'}</p>
                  </div>
                </div>
                <label className="sdm-power-toggle">
                  <input type="checkbox" checked={config.enabled} onChange={e => updateConfig({ enabled:e.target.checked })} />
                  <div className="sdm-power-track" />
                  <div className="sdm-power-thumb">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1v4M3 3.2A4 4 0 106 10a4 4 0 001.5-.3" stroke={config.enabled?'#7c3aed':'#9ca3af'} strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                </label>
              </div>

              <div className="sdm-grid-2">
                <div>
                  {/* Comment Automation — PILL toggles */}
                  <div className="sdm-card section-comment">
                    <div className="sdm-card-title"><span className="sdm-card-title-dot" style={{ background:'#3b82f6' }} /><IcoMsg />Comment Automation</div>
                    {[
                      { key:'autoReplyPositive',      label:'Auto-reply positive comments',  desc:'Compliments, praise, emoji reactions' },
                      { key:'autoReplyQuestions',     label:'Auto-reply questions',           desc:'Genuine questions about your content' },
                      { key:'autoReplyLinkRequests',  label:'Auto-reply link requests',       desc:'DM + public reply for link asks' },
                      { key:'autoReplyPurchaseIntent',label:'Auto-reply purchase intent',     desc:'Price inquiries, buying signals' },
                      { key:'flagNegative',           label:'Flag negative comments',         desc:'Route to inbox for human review' },
                      { key:'flagSpam',               label:'Flag spam',                      desc:'Auto-detect bots and spam patterns' },
                      { key:'threadChainingEnabled',  label:'Thread chaining',                desc:'Replies end with a conversation hook' },
                    ].map(({ key,label,desc }) => (
                      <div className="sdm-toggle-row" key={key}>
                        <div><div className="sdm-toggle-row-label">{label}</div><div className="sdm-toggle-row-desc">{desc}</div></div>
                        <label className={`sdm-pill-toggle ${TOGGLE_COLORS[key]||'color-purple'}`}>
                          <input type="checkbox" checked={!!(config as any)[key]} onChange={e => updateConfig({ [key]:e.target.checked } as any)} />
                          <div className="sdm-pill-track" />
                          <div className="sdm-pill-thumb" />
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Rate Limiting */}
                  <div className="sdm-card section-rate">
                    <div className="sdm-card-title"><span className="sdm-card-title-dot" style={{ background:'#f59e0b' }} /><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 4.5V8l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>Rate Limiting &amp; Jitter</div>
                    <div style={{ marginBottom:18 }}>
                      <div className="sdm-label">Max replies per hour</div>
                      <div className="sdm-slider-row"><input type="range" className="sdm-slider" min={5} max={60} value={config.maxRepliesPerHour} onChange={e => updateConfig({ maxRepliesPerHour:parseInt(e.target.value) })} /><div className="sdm-slider-value">{config.maxRepliesPerHour}/hr</div></div>
                    </div>
                    <div>
                      <div className="sdm-label">Reply delay range (jitter)</div>
                      <div style={{ display:'flex',gap:10,alignItems:'center' }}>
                        <input type="range" className="sdm-slider" min={5} max={60} value={config.jitterMinSeconds} onChange={e => updateConfig({ jitterMinSeconds:parseInt(e.target.value) })} />
                        <span className="sdm-slider-value">{config.jitterMinSeconds}s</span>
                        <span style={{ color:'rgba(255,255,255,0.2)',fontSize:13,fontWeight:700 }}>–</span>
                        <input type="range" className="sdm-slider" min={60} max={300} value={config.jitterMaxSeconds} onChange={e => updateConfig({ jitterMaxSeconds:parseInt(e.target.value) })} />
                        <span className="sdm-slider-value">{config.jitterMaxSeconds}s</span>
                      </div>
                      <div style={{ fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:7 }}>Poisson-distributed delay mimics organic human response timing</div>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Brand Voice */}
                  <div className="sdm-card section-brand">
                    <div className="sdm-card-title"><span className="sdm-card-title-dot" style={{ background:'#8b5cf6' }} /><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 10.5s1-1.5 2.5-1.5 2.5 1.5 2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6" cy="7" r="1" fill="currentColor"/><circle cx="10" cy="7" r="1" fill="currentColor"/></svg>Brand Voice</div>
                    <div className="sdm-field"><label className="sdm-label">Link URL (sent via DM for link requests)</label><input type="url" className="sdm-input" placeholder="https://your-link.com/resource" value={config.linkUrl||''} onChange={e => updateConfig({ linkUrl:e.target.value||null })} /></div>
                    <div className="sdm-field"><label className="sdm-label">Brand Persona</label><textarea className="sdm-input sdm-textarea" placeholder={"Witty, direct, lowercase aesthetic. Never formal. Like a founder who's been building for years."} value={config.brandPersona||''} onChange={e => updateConfig({ brandPersona:e.target.value||null })} /></div>
                    <div className="sdm-field"><label className="sdm-label">Custom Instructions</label><textarea className="sdm-input sdm-textarea" placeholder="Never mention competitor X. Always reference the course. Use first names when possible." value={config.customInstructions||''} onChange={e => updateConfig({ customInstructions:e.target.value||null })} /></div>
                  </div>

                  {/* DM Automation — SEGMENTED toggles */}
                  <div className="sdm-card section-dm">
                    <div className="sdm-card-title"><span className="sdm-card-title-dot" style={{ background:'#10b981' }} /><IcoMail />Inbound DM Automation</div>
                    <div className="sdm-toggle-row">
                      <div><div className="sdm-toggle-row-label">Enable DM Auto-Reply</div><div className="sdm-toggle-row-desc">Auto-respond to incoming DMs</div></div>
                      <label className="sdm-seg-toggle"><input type="checkbox" checked={config.dmAutoReplyEnabled} onChange={e => updateConfig({ dmAutoReplyEnabled:e.target.checked })} /><div className="sdm-seg-track" /><div className="sdm-seg-thumb" /></label>
                    </div>
                    <div className="sdm-toggle-row">
                      <div><div className="sdm-toggle-row-label">Escalation Alerts</div><div className="sdm-toggle-row-desc">Flag complex DMs for human follow-up</div></div>
                      <label className="sdm-seg-toggle"><input type="checkbox" checked={config.dmEscalationEnabled} onChange={e => updateConfig({ dmEscalationEnabled:e.target.checked })} /><div className="sdm-seg-track" /><div className="sdm-seg-thumb" /></label>
                    </div>
                    <div className="sdm-field" style={{ marginTop:14 }}>
                      <label className="sdm-label">Max DM replies per hour</label>
                      <div className="sdm-slider-row"><input type="range" className="sdm-slider" min={5} max={50} value={config.dmMaxRepliesPerHour} onChange={e => updateConfig({ dmMaxRepliesPerHour:parseInt(e.target.value) })} /><div className="sdm-slider-value">{config.dmMaxRepliesPerHour}/hr</div></div>
                    </div>
                    <div className="sdm-field"><label className="sdm-label">Welcome Message (first DM from a user)</label><textarea className="sdm-input sdm-textarea" placeholder="Hey! Thanks for reaching out. How can I help you today?" value={config.dmWelcomeMessage||''} onChange={e => updateConfig({ dmWelcomeMessage:e.target.value||null })} /></div>
                    <div className="sdm-field"><label className="sdm-label">Knowledge Base (what to answer DMs with)</label><textarea className="sdm-input sdm-textarea" style={{ minHeight:100 }} placeholder={"FAQ and product info:\n- Course costs $497\n- Includes lifetime access\n- Next cohort starts Nov 1st"} value={config.dmKnowledgeBase||''} onChange={e => updateConfig({ dmKnowledgeBase:e.target.value||null })} /></div>
                  </div>
                </div>
              </div>

              <div className="sdm-save-bar">
                <button className="sdm-btn sdm-btn-primary" onClick={saveConfig} disabled={saving} style={{ minWidth:130,justifyContent:'center' }}>
                  {saving ? <><IcoSpin />Saving...</> : <><IcoCheck />Save Settings</>}
                </button>
              </div>
            </div>
          )}

          {/* SIMULATOR */}
          {activeTab === 'simulator' && (
            <div>
              <div className="sdm-tab-heading"><div><h2>Live Simulator</h2><p>Test how SignalDM handles any comment or DM before going live — nothing is posted.</p></div></div>
              <div className="sdm-sim-layout">
                <div className="sdm-card section-sim">
                  <div className="sdm-type-pills">
                    <button className={`sdm-type-pill ${simType==='comment'?'active':''}`} onClick={() => { setSimType('comment'); setSimResult(null); }}><IcoMsg />Comment</button>
                    <button className={`sdm-type-pill ${simType==='dm'?'active':''}`} onClick={() => { setSimType('dm'); setSimResult(null); }}><IcoMail />Inbound DM</button>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10.5,color:'rgba(255,255,255,0.3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>Quick test scenarios</div>
                    <div className="sdm-presets-row">
                      {(simType==='comment' ? COMMENT_PRESETS : DM_PRESETS).map(preset => (
                        <button key={preset.label} type="button" className="sdm-preset-chip" onClick={() => { if (simType==='comment') { setSimComment(preset.text); if ('caption' in preset && typeof preset.caption==='string') setSimCaption(preset.caption); } else { setSimDmText(preset.text); } }}>{preset.label}</button>
                      ))}
                    </div>
                  </div>
                  {simType==='comment' ? (
                    <>
                      <div className="sdm-field"><label className="sdm-label">Test Comment Text</label><textarea className="sdm-input sdm-textarea" placeholder={'Try: "Where can I get this template?"\nOr: "This changed how our team works"\nOr: "Price gouging tbh"'} value={simComment} onChange={e => setSimComment(e.target.value)} /></div>
                      <div className="sdm-field"><label className="sdm-label">Post Caption (optional context)</label><textarea className="sdm-input sdm-textarea" placeholder="5 things I learned building a SaaS from $0 to $10k MRR..." value={simCaption} onChange={e => setSimCaption(e.target.value)} /></div>
                    </>
                  ) : (
                    <div className="sdm-field"><label className="sdm-label">Inbound DM Text</label><textarea className="sdm-input sdm-textarea" placeholder={'Try: "Hey, how much does the course cost?"\nOr: "Can you send more info?"\nOr: "Is this still available?"'} value={simDmText} onChange={e => setSimDmText(e.target.value)} /></div>
                  )}
                  <button className="sdm-btn sdm-btn-primary" onClick={runSimulator} disabled={simLoading||!(simType==='comment'?simComment:simDmText).trim()} style={{ width:'100%',justifyContent:'center',marginTop:4 }}>
                    {simLoading ? <><IcoSpin />Analyzing...</> : <><IcoArrow />Run Simulation</>}
                  </button>
                </div>
                <div>
                  {!simResult && !simLoading && (
                    <div className="sdm-sim-result" style={{ textAlign:'center',padding:'52px 20px' }}>
                      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ margin:'0 auto 14px',display:'block' }}><circle cx="22" cy="22" r="20" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" strokeDasharray="5 4"/><path d="M16 22h12M22 16v12" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      <p style={{ color:'rgba(255,255,255,0.3)',fontSize:13 }}>Run a simulation to see how SignalDM would respond</p>
                    </div>
                  )}
                  {simLoading && (
                    <div className="sdm-sim-result" style={{ textAlign:'center',padding:'52px 20px' }}><div className="sdm-spinner" /><p style={{ color:'rgba(255,255,255,0.35)',fontSize:13 }}>Classifying intent...</p></div>
                  )}
                  {simResult && !simLoading && (
                    <div className="sdm-sim-result">
                      {simResult.blocked ? (
                        <div>
                          <div style={{ color:'#ef4444',fontWeight:700,marginBottom:8,display:'flex',alignItems:'center',gap:8 }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/><path d="M5 5l6 6M11 5l-6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>Content Blocked</div>
                          <p style={{ color:'rgba(255,255,255,0.4)',fontSize:13 }}>{simResult.reason}</p>
                        </div>
                      ) : (
                        <>
                          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                            {(() => { const cls=simResult.classification; const colors=CLASSIFICATION_COLORS[cls]||CLASSIFICATION_COLORS['unrelated']; return (<span className="sdm-classification-badge" style={{ background:colors.bg,color:colors.text,borderColor:colors.border }}><span style={{ width:6,height:6,borderRadius:'50%',background:colors.dot,display:'inline-block' }} />{CLASSIFICATION_LABELS[cls]||cls}</span>); })()}
                            <span style={{ fontSize:12,color:'rgba(255,255,255,0.35)' }}>{Math.round(simResult.confidence*100)}% confidence</span>
                          </div>
                          <div className="sdm-confidence-bar-wrap"><div className="sdm-confidence-bar" style={{ width:`${simResult.confidence*100}%` }} /></div>
                          <div style={{ marginTop:12,display:'flex',alignItems:'center',gap:8 }}>
                            <span style={{ fontSize:11.5,color:'rgba(255,255,255,0.35)' }}>Lead score:</span>
                            <span style={{ fontWeight:700,color:LEAD_SCORE_COLORS[simResult.leadScore]||'#6b7280',fontSize:13 }}>{LEAD_SCORE_LABELS[simResult.leadScore]||'Unknown'}</span>
                          </div>
                          <div className="sdm-action-flags">
                            <span className={`sdm-flag ${simResult.wouldAutoReply?'sdm-flag-yes':'sdm-flag-no'}`}>{simResult.wouldAutoReply?'✓':'✗'} Auto-reply</span>
                            {simResult.wouldSendDM!==undefined && <span className={`sdm-flag ${simResult.wouldSendDM?'sdm-flag-yes':'sdm-flag-no'}`}>{simResult.wouldSendDM?'✓':'✗'} Send DM</span>}
                            {simResult.wouldFlag && <span className="sdm-flag sdm-flag-warn">Flag for review</span>}
                            {simResult.wouldEscalate && <span className="sdm-flag sdm-flag-warn">Escalate</span>}
                          </div>
                          {simResult.suggestedReply && <div className="sdm-result-section"><div className="sdm-result-section-label">Public Reply</div><div className="sdm-result-reply">{simResult.suggestedReply}</div></div>}
                          {simResult.suggestedDM && <div className="sdm-result-section"><div className="sdm-result-section-label">DM Message</div><div className="sdm-result-reply">{simResult.suggestedDM}</div></div>}
                          {simResult.threadHook && <div className="sdm-result-section"><div className="sdm-result-section-label">Thread Hook</div><div style={{ fontSize:13,color:'#a78bfa',fontStyle:'italic' }}>{simResult.threadHook}</div></div>}
                          <div className="sdm-result-section"><div className="sdm-result-section-label">Reasoning</div><div style={{ fontSize:12.5,color:'rgba(255,255,255,0.35)',lineHeight:1.6 }}>{simResult.reasoning}</div></div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* COMMENT FEED */}
          {activeTab === 'feed' && (
            <div>
              {commentStats && (
                <div className="sdm-stats-row">
                  {[{ label:'Total Processed',value:commentStats.total,color:'#a78bfa' },{ label:'Auto-Replied',value:commentStats.autoReplied,color:'#10b981' },{ label:'DMs Sent',value:commentStats.dmsSent,color:'#3b82f6' },{ label:'Flagged',value:commentStats.flagged,color:'#f59e0b' }].map(s => (
                    <div className="sdm-stat-card" key={s.label}><div className="sdm-stat-value" style={{ color:s.color }}>{s.value}</div><div className="sdm-stat-label">{s.label}</div></div>
                  ))}
                </div>
              )}
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:16 }}>
                <div className="sdm-filter-tabs" style={{ marginBottom:0 }}>
                  {['all','positive','question','link_request','purchase_intent','negative','spam','harmful'].map(f => (
                    <button key={f} className={`sdm-filter-tab ${commentFilter===f?'active':''}`} onClick={() => { setCommentFilter(f); setCommentPage(1); }}>{f==='all'?'All':CLASSIFICATION_LABELS[f]||f}</button>
                  ))}
                </div>
                <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                  <input type="text" className="sdm-input" placeholder="Search comments or @user..." value={commentSearch} onChange={e => setCommentSearch(e.target.value)} style={{ width:210,padding:'7px 12px',fontSize:12.5 }} />
                  <button className="sdm-btn sdm-btn-secondary" onClick={syncLiveComments} disabled={syncingComments||feedLoading} style={{ padding:'7px 13px',fontSize:12 }}>
                    <IcoRefresh />{syncingComments?'Syncing...':'Sync'}
                  </button>
                </div>
              </div>
              {feedLoading ? (<div style={{ textAlign:'center',padding:'48px 0' }}><div className="sdm-spinner" /></div>)
              : comments.length===0 ? (
                <div className="sdm-empty"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin:'0 auto 14px',display:'block' }}><circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/><path d="M14 20h12M20 14v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/></svg><p>No comments yet. Click Sync or wait for comments via webhook.</p></div>
              ) : (
                <>
                  <div className="sdm-card section-feed" style={{ padding:0,overflow:'hidden' }}>
                    <table className="sdm-table">
                      <thead><tr><th>User</th><th>Comment</th><th>Classification</th><th>Reply</th><th>Lead</th><th>Status</th><th>Time</th></tr></thead>
                      <tbody>
                        {comments.filter(c => { if (!commentSearch.trim()) return true; const q=commentSearch.toLowerCase(); return ((c.commenter_username&&c.commenter_username.toLowerCase().includes(q))||(c.comment_text&&c.comment_text.toLowerCase().includes(q))||(c.suggested_reply&&c.suggested_reply.toLowerCase().includes(q))); }).map(c => {
                          const colors=CLASSIFICATION_COLORS[c.classification]||CLASSIFICATION_COLORS['unrelated'];
                          return (
                            <tr key={c.id}>
                              <td><span className="sdm-username">@{c.commenter_username||'—'}</span></td>
                              <td style={{ maxWidth:200,color:'#d1d5db' }}>{c.comment_text}</td>
                              <td><span className="sdm-classification-badge" style={{ background:colors.bg,color:colors.text,borderColor:colors.border,fontSize:11 }}>{CLASSIFICATION_LABELS[c.classification]||c.classification}</span></td>
                              <td style={{ maxWidth:200,color:'rgba(255,255,255,0.38)',fontSize:12 }}>{c.suggested_reply||'—'}</td>
                              <td><span style={{ color:LEAD_SCORE_COLORS[c.lead_score]||'#6b7280',fontWeight:700,fontSize:12 }}>{c.lead_score>0?LEAD_SCORE_LABELS[c.lead_score]:'—'}</span></td>
                              <td><div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                                {c.auto_replied&&<span style={{ fontSize:10,background:'rgba(16,185,129,0.14)',color:'#10b981',borderRadius:10,padding:'2px 7px',fontWeight:700 }}>replied</span>}
                                {c.dm_sent&&<span style={{ fontSize:10,background:'rgba(139,92,246,0.14)',color:'#8b5cf6',borderRadius:10,padding:'2px 7px',fontWeight:700 }}>dm sent</span>}
                                {!c.auto_replied&&!c.dm_sent&&<span style={{ fontSize:10,background:'rgba(107,114,128,0.12)',color:'#9ca3af',borderRadius:10,padding:'2px 7px' }}>{c.classification==='harmful'||c.classification==='spam'?'filtered':'logged'}</span>}
                              </div></td>
                              <td style={{ color:'rgba(255,255,255,0.28)',fontSize:11,whiteSpace:'nowrap' }}>{new Date(c.created_at).toLocaleString(undefined,{ month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {commentStats&&commentStats.total>25&&(
                    <div className="sdm-pagination">
                      <span>Page {commentPage} of {Math.ceil(commentStats.total/25)} — {commentStats.total} total</span>
                      <div className="sdm-pagination-btns">
                        <button className="sdm-btn sdm-btn-secondary" disabled={commentPage<=1} onClick={() => setCommentPage(p => Math.max(1,p-1))} style={{ padding:'5px 13px',fontSize:12 }}>← Prev</button>
                        <button className="sdm-btn sdm-btn-secondary" disabled={commentPage>=Math.ceil(commentStats.total/25)} onClick={() => setCommentPage(p => p+1)} style={{ padding:'5px 13px',fontSize:12 }}>Next →</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* FLAGGED INBOX */}
          {activeTab === 'inbox' && (
            <div>
              <div className="sdm-tab-heading">
                <div><h2>Flagged Inbox</h2><p>Comments and DMs that need your personal touch. Hot leads shown first.</p></div>
                <button className="sdm-btn sdm-btn-secondary" onClick={loadFlagged}><IcoRefresh />Refresh</button>
              </div>
              <div className="sdm-filter-tabs">
                {['pending','approved','replied','rejected','all'].map(s => (
                  <button key={s} className={`sdm-filter-tab ${statusFilter===s?'active':''}`} onClick={() => setStatusFilter(s)}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
                    {s==='pending'&&pendingCount>0&&<span style={{ background:'#f59e0b',color:'#000',borderRadius:10,padding:'0 6px',fontSize:10,fontWeight:800 }}>{pendingCount}</span>}
                  </button>
                ))}
              </div>
              {inboxLoading ? (<div style={{ textAlign:'center',padding:'48px 0' }}><div className="sdm-spinner" /></div>)
              : flagged.length===0 ? (
                <div className="sdm-empty"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin:'0 auto 14px',display:'block' }}><circle cx="20" cy="20" r="18" stroke="rgba(16,185,129,0.35)" strokeWidth="1.5"/><path d="M13 20l5 5 9-10" stroke="rgba(16,185,129,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><p>Inbox clear — no flagged items.</p></div>
              ) : flagged.map(item => {
                const colors=CLASSIFICATION_COLORS[item.classification]||CLASSIFICATION_COLORS['unrelated'];
                const isEditMode=editMode[item.id];
                return (
                  <div key={item.id} className={`sdm-flagged-card ${item.priority==='high'?'high-priority':''}`}>
                    <div className="sdm-flagged-header">
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:7,flexWrap:'wrap' }}>
                          <span className="sdm-username">@{item.commenter_username||'unknown'}</span>
                          <span style={{ fontSize:11,background:item.item_type==='dm'?'rgba(139,92,246,0.16)':'rgba(59,130,246,0.16)',color:item.item_type==='dm'?'#c084fc':'#60a5fa',borderRadius:10,padding:'2px 8px',fontWeight:700 }}>{item.item_type==='dm'?'Escalated DM':'Flagged Comment'}</span>
                          <span className="sdm-classification-badge" style={{ background:colors.bg,color:colors.text,borderColor:colors.border,fontSize:11 }}>{CLASSIFICATION_LABELS[item.classification]||item.classification}</span>
                          {item.lead_score>=2&&<span style={{ fontSize:11,background:'rgba(245,158,11,0.15)',color:'#f59e0b',borderRadius:10,padding:'2px 8px',fontWeight:700 }}>{LEAD_SCORE_LABELS[item.lead_score]}</span>}
                          {item.priority==='high'&&<span style={{ fontSize:10,background:'rgba(245,158,11,0.18)',color:'#f59e0b',borderRadius:10,padding:'2px 7px',fontWeight:800,letterSpacing:'0.03em' }}>HIGH PRIORITY</span>}
                        </div>
                        <div className="sdm-flagged-comment">"{item.comment_text}"</div>
                        {item.reasoning&&<div style={{ fontSize:12,color:'rgba(255,255,255,0.28)',marginTop:5 }}>Note: {item.reasoning}</div>}
                      </div>
                      <div style={{ fontSize:11,color:'rgba(255,255,255,0.25)',whiteSpace:'nowrap',flexShrink:0 }}>{new Date(item.created_at).toLocaleString(undefined,{ month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' })}</div>
                    </div>
                    {item.status==='pending'&&(
                      <>
                        {item.suggested_reply&&item.suggested_reply!=='SKIP'&&(
                          <div>
                            <div style={{ fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:6 }}>Suggested reply{isEditMode?' (editing)':''}:</div>
                            {isEditMode ? <textarea className="sdm-input sdm-textarea" value={editReplies[item.id]??item.suggested_reply} onChange={e => setEditReplies(prev => ({ ...prev,[item.id]:e.target.value }))} style={{ minHeight:80 }} /> : <div className="sdm-reply-preview">{editReplies[item.id]??item.suggested_reply}</div>}
                          </div>
                        )}
                        <div className="sdm-flagged-actions">
                          {item.suggested_reply&&item.suggested_reply!=='SKIP'&&<button className="sdm-btn sdm-btn-success" style={{ fontSize:12 }} onClick={() => flaggedAction(item.id,'approve')}>{item.item_type==='dm'?'Approve & Send DM':'Approve & Post'}</button>}
                          <button className="sdm-btn sdm-btn-secondary" style={{ fontSize:12 }} onClick={() => setEditMode(prev => ({ ...prev,[item.id]:!prev[item.id] }))}>{isEditMode?'Cancel':(item.item_type==='dm'?'Edit & Send DM':'Edit & Reply')}</button>
                          {isEditMode&&<button className="sdm-btn sdm-btn-primary" style={{ fontSize:12 }} onClick={() => { flaggedAction(item.id,'reply',editReplies[item.id]??item.suggested_reply); setEditMode(prev => ({ ...prev,[item.id]:false })); }}>{item.item_type==='dm'?'Send DM':'Send Reply'}</button>}
                          <button className="sdm-btn sdm-btn-danger" style={{ fontSize:12 }} onClick={() => flaggedAction(item.id,'reject')}>Dismiss</button>
                        </div>
                      </>
                    )}
                    {item.status!=='pending'&&<div style={{ fontSize:12.5,color:'rgba(255,255,255,0.3)' }}>Status: <span style={{ textTransform:'capitalize' }}>{item.status}</span>{item.owner_reply&&<div style={{ marginTop:4 }}>Your reply: "{item.owner_reply}"</div>}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* DM FEED */}
          {activeTab === 'dms' && (
            <div>
              {dmStats&&(
                <div className="sdm-stats-row">
                  {[{ label:'Total DMs',value:dmStats.total,color:'#a78bfa' },{ label:'Auto-Replied',value:dmStats.autoReplied,color:'#10b981' },{ label:'Escalated',value:dmStats.escalated,color:'#f59e0b' },{ label:'Hot Leads',value:dmStats.hotLeads,color:'#ef4444' }].map(s => (
                    <div className="sdm-stat-card" key={s.label}><div className="sdm-stat-value" style={{ color:s.color }}>{s.value}</div><div className="sdm-stat-label">{s.label}</div></div>
                  ))}
                </div>
              )}
              {!config.dmAutoReplyEnabled&&(
                <div className="sdm-info-banner">
                  <IcoWarn /><div style={{ flex:1 }}><div style={{ color:'#f59e0b',fontWeight:700,fontSize:13 }}>DM Auto-Reply is disabled</div><div style={{ color:'rgba(255,255,255,0.35)',fontSize:12 }}>Enable it in Control Panel → DM Automation settings</div></div>
                  <button className="sdm-btn sdm-btn-secondary" style={{ fontSize:12 }} onClick={() => setActiveTab('control')}>Open Settings</button>
                </div>
              )}
              {dmsLoading ? (<div style={{ textAlign:'center',padding:'48px 0' }}><div className="sdm-spinner" /></div>)
              : dms.length===0 ? (
                <div className="sdm-empty"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin:'0 auto 14px',display:'block' }}><circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/><path d="M14 20h12M20 14v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/></svg><p>No DMs processed yet. Enable DM auto-reply and wait for messages.</p></div>
              ) : (
                <div className="sdm-card section-dm" style={{ padding:0,overflow:'hidden' }}>
                  <table className="sdm-table">
                    <thead><tr><th>Sender</th><th>Message</th><th>Classification</th><th>Reply</th><th>Lead</th><th>Status</th><th>Time</th></tr></thead>
                    <tbody>
                      {dms.map(dm => {
                        const colors=CLASSIFICATION_COLORS[dm.classification]||CLASSIFICATION_COLORS['unrelated'];
                        return (
                          <tr key={dm.id}>
                            <td><span className="sdm-username">@{dm.sender_username||dm.sender_id}</span></td>
                            <td style={{ maxWidth:200,color:'#d1d5db' }}>{dm.message_text}</td>
                            <td><span className="sdm-classification-badge" style={{ background:colors.bg,color:colors.text,borderColor:colors.border,fontSize:11 }}>{CLASSIFICATION_LABELS[dm.classification]||dm.classification}</span></td>
                            <td style={{ maxWidth:200,color:'rgba(255,255,255,0.38)',fontSize:12 }}>{dm.ai_reply||'—'}</td>
                            <td><span style={{ color:LEAD_SCORE_COLORS[dm.lead_score]||'#6b7280',fontWeight:700,fontSize:12 }}>{dm.lead_score>0?LEAD_SCORE_LABELS[dm.lead_score]:'—'}</span></td>
                            <td><div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                              {dm.auto_replied&&<span style={{ fontSize:10,background:'rgba(16,185,129,0.14)',color:'#10b981',borderRadius:10,padding:'2px 7px',fontWeight:700 }}>replied</span>}
                              {dm.escalated&&<span style={{ fontSize:10,background:'rgba(245,158,11,0.14)',color:'#f59e0b',borderRadius:10,padding:'2px 7px',fontWeight:700 }}>escalated</span>}
                            </div></td>
                            <td style={{ color:'rgba(255,255,255,0.28)',fontSize:11,whiteSpace:'nowrap' }}>{new Date(dm.created_at).toLocaleString(undefined,{ month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' })}</td>
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

        {/* TOAST */}
        {toast&&(
          <div className="sdm-toast" style={{ borderColor:toast.type==='error'?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)' }}>
            {toast.type==='error' ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/><path d="M5 5l6 6M11 5l-6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg> : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#10b981" strokeWidth="1.5"/><path d="M5 8l2.5 2.5 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
