'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, Radio, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface KickStreamSetupDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess?: () => void;
}

export function KickStreamSetupDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: KickStreamSetupDialogProps) {
  const [streamUrl, setStreamUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let trimmedUrl = streamUrl.trim().replace(/\/+$/, '');
    const trimmedKey = streamKey.trim().replace(/^\/+/, '');

    if (!trimmedUrl || !trimmedKey) {
      setError('Both Stream URL and Stream Key are required.');
      return;
    }

    if (!trimmedUrl.startsWith('rtmp://') && !trimmedUrl.startsWith('rtmps://')) {
      trimmedUrl = `rtmps://${trimmedUrl}`;
    }

    // Auto-complete port :443 and /app endpoint if missing from Kick dashboard copy
    if (trimmedUrl.startsWith('rtmps://') && !trimmedUrl.includes(':443') && !trimmedUrl.match(/:\d+/)) {
      trimmedUrl = trimmedUrl.replace(/(rtmps:\/\/[^/:]+)/, '$1:443');
    }
    if (!trimmedUrl.endsWith('/app')) {
      trimmedUrl = `${trimmedUrl.replace(/\/+$/, '')}/app`;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/platform/kick/stream-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId,
          streamUrl: trimmedUrl,
          streamKey: trimmedKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save stream settings.');
        return;
      }

      toast.success('Kick Live Streaming configured successfully!');
      onSuccess?.();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-black/95 dark:backdrop-blur-xl border dark:border-white/10 z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#53FC18] text-black">
              <Radio className="w-4 h-4" />
            </div>
            Kick Live Stream Setup
          </DialogTitle>
          <DialogDescription>
            Enter your Kick RTMP Stream details. Unool will use these to stream your pre-recorded videos directly to your Kick channel so they go live and appear under your profile&apos;s Videos tab.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Stream URL</label>
              <a
                href="https://kick.com/dashboard/settings/stream-key"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary flex items-center gap-0.5 hover:underline"
              >
                Find in Kick Dashboard
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Input
              placeholder="rtmps://fa72370bdd22.global-contribute.live-video.net:443/app/"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Stream Key</label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="sk_us_..."
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                disabled={saving}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your stream key is encrypted and securely stored.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Enable Streaming'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
