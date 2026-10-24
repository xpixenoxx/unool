'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface ManualIntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId?: string;
  defaultEmail?: string;
}

const POPULAR_REQUESTS = [
  'TikTok',
  'Substack',
  'Beehiiv',
  'WhatsApp',
  'Discord',
  'Ghost',
  'Medium',
  'Behance',
  'Spotify / Apple Podcasts',
];

export function ManualIntegrationDialog({
  open,
  onClose,
  workspaceId = 'current',
  defaultEmail = '',
}: ManualIntegrationDialogProps) {
  const [platformName, setPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [useCase, setUseCase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; name: string } | null>(null);

  const resetForm = () => {
    setSubmittedTicket(null);
    setPlatformName('');
    setPlatformUrl('');
    setUseCase('');
    onClose();
  };

  const handleSelectPreset = (name: string) => {
    setPlatformName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = platformName.trim();
    if (!cleanName) {
      toast.error('Please enter the platform name you want to connect');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/platform/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platformName: cleanName,
          platformUrl: platformUrl.trim() || undefined,
          email: email.trim() || undefined,
          useCase: useCase.trim() || undefined,
          workspaceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmittedTicket({
        id: data.ticketId || `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
        name: cleanName,
      });
      toast.success(`Integration request for ${cleanName} queued!`);
    } catch (err: any) {
      toast.error(err.message || 'Could not submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? resetForm() : null)}>
      <DialogContent className="sm:max-w-xl p-0 border border-[#E8E0D4] bg-[#FFFDF9] text-[#2C241B] shadow-2xl rounded-2xl overflow-hidden z-[100]">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-[#EDE5D8] bg-gradient-to-b from-[#FAF7F2] to-[#FFFDF9]">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C4A265]/15 text-[#8A6726] border border-[#C4A265]/30 text-[10px] font-bold tracking-wider uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4A265] animate-pulse" />
              Platform Integration Queue
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 text-[#8B7355] hover:text-[#2C241B] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C241B]">
            Request a Platform Integration
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#735F48] mt-1 leading-relaxed">
            Tell us where you want to publish. We prioritize and engineer new connectors based on creator community requests.
          </DialogDescription>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {submittedTicket ? (
            /* ═══ SUCCESS STATE ═══ */
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="py-4 text-center space-y-5"
            >
              <div className="mx-auto w-12 h-12 rounded-2xl bg-[#C4A265]/15 border border-[#C4A265]/30 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-[#C4A265]" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#2C241B]">
                  Request Queued for {submittedTicket.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#735F48] max-w-sm mx-auto mt-1">
                  We have added this platform to our core roadmap queue. You will receive an update as soon as the connector enters testing.
                </p>
              </div>

              {/* Ticket Card */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4] text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[#EDE7DD] pb-2">
                  <span className="text-[#8B7355] font-semibold">Tracking Reference</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#E0D5BE] text-[#3D2B1F]">
                    {submittedTicket.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">Platform</span>
                  <span className="font-semibold text-[#2C241B]">{submittedTicket.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">Queue Status</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Prioritized for Development
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-[#2C241B] hover:bg-[#3D2B1F] text-[#FAF7F2] px-6 h-9 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Done
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setPlatformName('');
                    setPlatformUrl('');
                    setUseCase('');
                  }}
                  className="border-[#D8C7A5] hover:bg-[#FAF7F2] text-[#6B5744] h-9 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Request Another Platform
                </Button>
              </div>
            </motion.div>
          ) : (
            /* ═══ CLEAN, FOCUSED REQUEST FORM ═══ */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Platform Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B5744] flex items-center justify-between">
                  <span>Target Platform or Service</span>
                  <span className="text-[10px] text-[#A89886] font-normal">Required</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. TikTok, Substack, Beehiiv, Discord, WhatsApp..."
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="h-10 text-sm bg-white border-[#D8C7A5] text-[#2C241B] placeholder:text-[#A89886] focus-visible:ring-[#C4A265] rounded-xl"
                  autoFocus
                />

                {/* Popular suggestions pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-[#8B7355] font-medium mr-1">Popular:</span>
                  {POPULAR_REQUESTS.map((name) => {
                    const isSelected = platformName.toLowerCase() === name.toLowerCase();
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSelectPreset(name)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C4A265]/20 text-[#63481D] border-[#C4A265] shadow-xs'
                            : 'bg-white hover:bg-[#FAF7F2] text-[#6B5744] border-[#E8E0D4] hover:border-[#D8C7A5]'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile or Channel URL */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B5744] flex items-center justify-between">
                  <span>Channel or Profile Link</span>
                  <span className="text-[10px] text-[#A89886] font-normal">Optional</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. https://substack.com/@yourpublication or @handle"
                  value={platformUrl}
                  onChange={(e) => setPlatformUrl(e.target.value)}
                  className="h-9 text-xs bg-white border-[#D8C7A5] text-[#2C241B] placeholder:text-[#A89886] focus-visible:ring-[#C4A265] rounded-xl"
                />
              </div>

              {/* Contact Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B5744] flex items-center justify-between">
                  <span>Notify Me When Live</span>
                  <span className="text-[10px] text-[#A89886] font-normal">Optional</span>
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs bg-white border-[#D8C7A5] text-[#2C241B] placeholder:text-[#A89886] focus-visible:ring-[#C4A265] rounded-xl"
                />
                <p className="text-[11px] text-[#8B7355]">
                  We will notify you directly as soon as this connector is ready for your account.
                </p>
              </div>

              {/* Specific Workflow or Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B5744] flex items-center justify-between">
                  <span>Primary Workflow or Requirements</span>
                  <span className="text-[10px] text-[#A89886] font-normal">Optional</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell us what you want to publish (e.g. 'Auto-publishing carousels', 'Short videos & reels', 'Newsletter editions')..."
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full text-xs rounded-xl border border-[#D8C7A5] bg-white p-3 text-[#2C241B] placeholder:text-[#A89886] focus:outline-none focus:ring-2 focus:ring-[#C4A265] leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-[#EDE7DD]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-semibold text-[#8B7355] hover:text-[#2C241B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !platformName.trim()}
                  className="h-10 px-5 rounded-xl text-xs font-bold tracking-wide cursor-pointer transition-all bg-gradient-to-r from-[#201912] via-[#2E241B] to-[#3D2B1F] hover:from-[#15100B] hover:via-[#241B13] hover:to-[#2F2116] text-[#FAF7F2] border border-[#C4A265]/50 shadow-md hover:border-[#E5C77A] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Queuing Request…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Integration Request</span>
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
