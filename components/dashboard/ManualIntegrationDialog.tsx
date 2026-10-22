'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Check,
  Sparkles,
  Link2,
  Rocket,
  BarChart3,
  Bot,
  MessageSquare,
  Webhook,
  Copy,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Send,
  Loader2,
  Flame,
  Zap,
  Compass,
  FileCode,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

interface ManualIntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId?: string;
  defaultEmail?: string;
}

const PRESET_PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵', tag: 'Short Video & Reels', color: 'from-[#000000] to-[#25F4EE]' },
  { id: 'substack', name: 'Substack', icon: '💌', tag: 'Newsletters & Essays', color: 'from-[#FF6719] to-[#FF8C00]' },
  { id: 'beehiiv', name: 'Beehiiv', icon: '🐝', tag: 'Creator Publications', color: 'from-[#ECA824] to-[#FCD34D]' },
  { id: 'ghost', name: 'Ghost', icon: '👻', tag: 'Independent Publishing', color: 'from-[#15171A] to-[#3B4252]' },
  { id: 'discord', name: 'Discord', icon: '💬', tag: 'Server Announcements', color: 'from-[#5865F2] to-[#7983F5]' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📱', tag: 'Channels & Broadcasts', color: 'from-[#25D366] to-[#128C7E]' },
  { id: 'behance', name: 'Behance', icon: '🎨', tag: 'Creative Portfolios', color: 'from-[#0057FF] to-[#00A3FF]' },
  { id: 'spotify', name: 'Spotify / Apple', icon: '🎧', tag: 'Podcasts & Audio', color: 'from-[#1DB954] to-[#1ED760]' },
  { id: 'custom-api', name: 'Custom Webhook / API', icon: '⚡', tag: 'Developer Pipelines', color: 'from-[#8B5CF6] to-[#A78BFA]' },
  { id: 'other', name: 'Other Platform', icon: '✨', tag: 'Tell us anything', color: 'from-[#64748B] to-[#94A3B8]' },
];

const CAPABILITIES = [
  { id: 'publishing', label: 'One-Click Publishing', desc: 'Auto-publish posts & media from Studio', icon: Rocket },
  { id: 'analytics', label: 'Unified Analytics', desc: 'Track views, clicks & engagement', icon: BarChart3 },
  { id: 'adaptation', label: 'AI Voice & Repurposing', desc: 'Auto-tune tone & format for this channel', icon: Bot },
  { id: 'engagement', label: 'Community & DM Alerts', desc: 'Manage comments, triage messages', icon: MessageSquare },
  { id: 'webhook', label: 'Custom Webhooks', desc: 'Trigger external automations on publish', icon: Webhook },
];

const URGENCIES = [
  { id: 'exploring', label: 'Exploring', icon: Compass, desc: 'Planning for upcoming workflow' },
  { id: 'weekly', label: 'High Priority', icon: Zap, desc: 'Actively posting here weekly' },
  { id: 'critical', label: 'Mission Critical', icon: Flame, desc: 'Core blocker for our team' },
];

export function ManualIntegrationDialog({
  open,
  onClose,
  workspaceId = 'current',
  defaultEmail = '',
}: ManualIntegrationDialogProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'webhook'>('request');
  const [selectedPreset, setSelectedPreset] = useState<string>('tiktok');
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([
    'publishing',
    'analytics',
  ]);
  const [urgency, setUrgency] = useState<string>('weekly');
  const [useCase, setUseCase] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; name: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const effectivePlatformName = useMemo(() => {
    if (selectedPreset === 'other' || !selectedPreset) {
      return customPlatformName.trim();
    }
    const found = PRESET_PLATFORMS.find((p) => p.id === selectedPreset);
    return found ? found.name : customPlatformName.trim();
  }, [selectedPreset, customPlatformName]);

  // Form completion calculation for interactive meter
  const completionScore = useMemo(() => {
    let score = 0;
    if (effectivePlatformName) score += 35;
    if (selectedCapabilities.length > 0) score += 25;
    if (urgency) score += 20;
    if (email.trim() || platformUrl.trim() || useCase.trim()) score += 20;
    return Math.min(100, score);
  }, [effectivePlatformName, selectedCapabilities, urgency, email, platformUrl, useCase]);

  const toggleCapability = (id: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePresetClick = (presetId: string) => {
    setSelectedPreset(presetId);
    if (presetId !== 'other') {
      const preset = PRESET_PLATFORMS.find((p) => p.id === presetId);
      if (preset) {
        setCustomPlatformName(preset.name);
      }
    } else {
      setCustomPlatformName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectivePlatformName) {
      toast.error('Please select or specify a platform name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/platform/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platformName: effectivePlatformName,
          platformUrl,
          capabilities: selectedCapabilities,
          urgency,
          useCase,
          email,
          workspaceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmittedTicket({
        id: data.ticketId || `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
        name: effectivePlatformName,
      });
      toast.success(`Request for ${effectivePlatformName} submitted!`);
    } catch (err: any) {
      toast.error(err.message || 'Could not submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyWebhook = () => {
    const url = `https://unool.co/api/webhooks/workspace/${workspaceId}`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    toast.success('Webhook endpoint copied to clipboard');
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const resetForm = () => {
    setSubmittedTicket(null);
    setCustomPlatformName('');
    setSelectedPreset('tiktok');
    setPlatformUrl('');
    setUseCase('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? resetForm() : null)}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 border border-[#E8E0D4] bg-[#FCFBF9] text-[#2C241B] shadow-2xl rounded-2xl z-[100]">
        {/* Dynamic header with ambient glow */}
        <div className="relative overflow-hidden px-6 pt-7 pb-5 border-b border-[#E8E0D4] bg-gradient-to-br from-[#F7F3EC] via-[#FCFBF9] to-[#F3ECE1]">
          {/* Subtle gold radial background glow */}
          <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#C4A265]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#A68B52]/10 blur-2xl" />

          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFE9DD] border border-[#DFCBB0] text-[11px] font-semibold text-[#8B6E3E] tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#C4A265] animate-pulse" />
              Custom Platform Concierge
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-[#EFE8DC] p-0.5 rounded-lg border border-[#E2D8C9]">
              <button
                type="button"
                onClick={() => setActiveTab('request')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'request'
                    ? 'bg-white text-[#2C241B] shadow-xs font-semibold'
                    : 'text-[#8B7355] hover:text-[#2C241B]'
                }`}
              >
                Request Platform
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('webhook')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'webhook'
                    ? 'bg-white text-[#2C241B] shadow-xs font-semibold'
                    : 'text-[#8B7355] hover:text-[#2C241B]'
                }`}
              >
                Instant Webhook
              </button>
            </div>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C241B]">
            {activeTab === 'request'
              ? 'Connect Any Platform to UNOOL'
              : 'Direct Webhook & Custom Automation'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#735F48] mt-1">
            {activeTab === 'request'
              ? 'Want to post or track content somewhere else? Tell us your target channel. We fast-track integrations with the highest creator demand.'
              : 'Need to publish or ingest content right now? Use our live workspace webhook pipeline with Zapier, Make, n8n, or your custom server.'}
          </DialogDescription>

          {/* Interactive Progress Bar */}
          {activeTab === 'request' && !submittedTicket && (
            <div className="mt-4 pt-3 border-t border-[#E8E0D4]/70">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-[#8B7355]">Request Completeness</span>
                <span className="text-[#8B6E3E] font-semibold font-mono">
                  {completionScore}% •{' '}
                  {completionScore < 50
                    ? 'Pick a platform'
                    : completionScore < 85
                    ? 'Looking sharp!'
                    : 'Ready to submit!'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#EAE2D5] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#C4A265] to-[#A68B52] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionScore}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeTab === 'webhook' ? (
            /* ═══ TAB 2: Instant Webhook & Developer Pipeline ═══ */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#F6F1E8] border border-[#E5DBCC]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#EAE0D0] text-[#7A5B2E]">
                      <Webhook className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#2C241B]">
                        Your Workspace Ingestion Webhook
                      </h4>
                      <p className="text-xs text-[#7A6650]">
                        HTTP POST JSON payloads to auto-create drafts or trigger actions.
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 bg-[#FAF8F5] p-2 rounded-lg border border-[#DFD5C4]">
                  <code className="text-xs font-mono text-[#54412F] truncate flex-1 select-all">
                    https://unool.co/api/webhooks/workspace/{workspaceId}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyWebhook}
                    className="h-7 text-xs gap-1 border-[#D5C7B4] bg-white hover:bg-[#F3ECE1]"
                  >
                    {copiedWebhook ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#8B7355]" />
                        Copy URL
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* cURL Example */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] block mb-2">
                  Example cURL Request
                </label>
                <div className="rounded-xl bg-[#1D1814] text-[#EFEBE4] p-3.5 font-mono text-xs overflow-x-auto shadow-inner border border-[#30261E]">
                  <pre>{`curl -X POST https://unool.co/api/webhooks/workspace/${workspaceId} \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "manual",
    "content": "Excited to share our new breakthrough with UNOOL!",
    "status": "draft"
  }'`}</pre>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E8E0D4] flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2C241B]">
                    Want an automated native integration instead?
                  </p>
                  <p className="text-xs text-[#8B7355]">
                    Tell us what platform you use and we'll build an official connector.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setActiveTab('request')}
                  className="bg-[#C4A265] hover:bg-[#B39154] text-white font-medium"
                >
                  Request Platform
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          ) : submittedTicket ? (
            /* ═══ SUCCESS STATE: Interactive Celebratory Ticket ═══ */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="py-6 text-center space-y-4"
            >
              {/* Animated Success Badge */}
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EBF5EE] to-[#D5EAD9] border border-[#A8D5B1] flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-9 h-9 text-[#3A7B4B] animate-bounce" />
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C4A265] text-white text-[10px] font-bold flex items-center justify-center">
                  ★
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#2C241B]">
                  Request Received for {submittedTicket.name}!
                </h3>
                <p className="text-sm text-[#735F48] max-w-md mx-auto mt-1">
                  We've registered your vote in our core roadmap queue. As more creators request{' '}
                  <span className="font-semibold text-[#2C241B]">{submittedTicket.name}</span>, it moves up
                  our deployment priority.
                </p>
              </div>

              {/* Ticket Card */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-[#F7F3EC] border border-[#E2D8C9] text-left">
                <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-2.5 mb-2.5">
                  <span className="text-xs font-semibold text-[#8B7355]">Tracking Ticket</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#DFD3C0] text-[#785E31]">
                    {submittedTicket.id}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#8B7355] block">Platform:</span>
                    <span className="font-medium text-[#2C241B]">{submittedTicket.name}</span>
                  </div>
                  <div>
                    <span className="text-[#8B7355] block">Priority Status:</span>
                    <span className="font-medium text-emerald-700 capitalize flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Queued for Engineering Review
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-[#2C241B] hover:bg-[#42372A] text-white px-6 font-medium"
                >
                  Done
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setCustomPlatformName('');
                  }}
                  className="border-[#D8CABE] hover:bg-[#F2ECE1] text-[#5A4532]"
                >
                  Request Another Platform
                </Button>
              </div>
            </motion.div>
          ) : (
            /* ═══ TAB 1: World-Class Interactive Platform Request Form ═══ */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Platform Quick-Picks */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8B7355] flex items-center justify-between mb-2.5">
                  <span>1. Choose or Type Target Platform</span>
                  <span className="text-[11px] font-normal text-[#A69279]">
                    Click preset or type custom
                  </span>
                </label>

                {/* Preset Pills Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                  {PRESET_PLATFORMS.map((platform) => {
                    const isSelected = selectedPreset === platform.id;
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => handlePresetClick(platform.id)}
                        className={`relative p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white border-[#C4A265] shadow-md ring-2 ring-[#C4A265]/20 scale-[1.02]'
                            : 'bg-[#F9F7F3] border-[#E8E0D4] hover:border-[#D5C8B4] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg">{platform.icon}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#C4A265] text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#2C241B] truncate">
                            {platform.name}
                          </p>
                          <p className="text-[10px] text-[#8B7355] truncate">{platform.tag}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom input field */}
                <div className="relative">
                  <Input
                    placeholder="Enter platform or app name (e.g. Substack, TikTok, Custom App...)"
                    value={customPlatformName}
                    onChange={(e) => {
                      setCustomPlatformName(e.target.value);
                      if (selectedPreset !== 'other') {
                        setSelectedPreset('other');
                      }
                    }}
                    className="bg-white border-[#DFD3C0] text-[#2C241B] placeholder:text-[#A69279] focus-visible:ring-[#C4A265] h-10 text-sm"
                  />
                  {effectivePlatformName && (
                    <span className="absolute right-3 top-2.5 text-xs text-[#8B6E3E] font-medium bg-[#F5EFE2] px-2 py-0.5 rounded border border-[#E2D5BE]">
                      Selected: {effectivePlatformName}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 2: What would you like UNOOL to do? (Capability Chips) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8B7355] flex items-center justify-between mb-2">
                  <span>2. Desired Capabilities</span>
                  <span className="text-[11px] font-normal text-[#A69279]">
                    Select all that apply
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAPABILITIES.map((cap) => {
                    const isChecked = selectedCapabilities.includes(cap.id);
                    const Icon = cap.icon;
                    return (
                      <button
                        key={cap.id}
                        type="button"
                        onClick={() => toggleCapability(cap.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-[#FBF8F2] border-[#C4A265] shadow-xs'
                            : 'bg-white border-[#E8E0D4] hover:border-[#D5C8B4]'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-[#C4A265] text-white'
                              : 'bg-[#F2ECE1] text-[#8B7355]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#2C241B]">
                              {cap.label}
                            </span>
                            {isChecked && (
                              <Check className="w-3.5 h-3.5 text-[#C4A265] flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#8B7355] leading-tight mt-0.5">
                            {cap.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Priority & Target Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8B7355] block mb-1.5">
                    3. Urgency / Importance
                  </label>
                  <div className="space-y-1.5">
                    {URGENCIES.map((u) => {
                      const isSel = urgency === u.id;
                      const UIcon = u.icon;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setUrgency(u.id)}
                          className={`w-full p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                            isSel
                              ? 'bg-white border-[#C4A265] shadow-xs ring-1 ring-[#C4A265]/20 font-medium'
                              : 'bg-[#F9F7F3] border-[#E8E0D4] hover:bg-white text-[#735F48]'
                          }`}
                        >
                          <UIcon
                            className={`w-3.5 h-3.5 ${
                              isSel ? 'text-[#C4A265]' : 'text-[#A69279]'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-[#2C241B]">
                              {u.label}
                            </span>
                            <span className="text-[10px] text-[#8B7355] ml-1.5 hidden sm:inline">
                              ({u.desc})
                            </span>
                          </div>
                          {isSel && <Check className="w-3 h-3 text-[#C4A265]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#8B7355] block mb-1">
                      Your Profile Link / Handle (Optional)
                    </label>
                    <Input
                      placeholder="e.g. @mychannel or https://substack.com/@brand"
                      value={platformUrl}
                      onChange={(e) => setPlatformUrl(e.target.value)}
                      className="bg-white border-[#DFD3C0] text-[#2C241B] placeholder:text-[#A69279] text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#8B7355] block mb-1">
                      Notify Me When Live
                    </label>
                    <Input
                      type="email"
                      placeholder="your.email@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white border-[#DFD3C0] text-[#2C241B] placeholder:text-[#A69279] text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Notes / Specific Request (Optional) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8B7355] block mb-1">
                  Specific Workflow or Requirements (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell us what you're trying to achieve (e.g. 'I want to cross-post my newsletter articles directly into full-bleed carousel posts')..."
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full rounded-lg border border-[#DFD3C0] bg-white p-2.5 text-xs text-[#2C241B] placeholder:text-[#A69279] focus:outline-none focus:ring-2 focus:ring-[#C4A265]/40"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-between border-t border-[#E8E0D4]">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-[#8B7355] hover:text-[#2C241B] font-medium"
                >
                  Cancel
                </button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !effectivePlatformName}
                  className="bg-gradient-to-r from-[#C4A265] to-[#A68B52] hover:from-[#B89657] hover:to-[#967C45] text-white shadow-md font-semibold px-6 text-sm h-10 gap-2 transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Request {effectivePlatformName || 'Platform'} Integration
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
