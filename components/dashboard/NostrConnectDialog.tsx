'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface NostrConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (npub: string) => void;
}

export function NostrConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: NostrConnectDialogProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [npub, setNpub] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/platform/nostr/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ webhookUrl, npub, workspaceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Connection failed. Please try again.');
        return;
      }

      toast.success(`Nostr connected successfully!`);
      onSuccess(data.npub);
      onClose();
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-black/95 dark:backdrop-blur-xl border dark:border-white/10 z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#9B51E0] text-white">
              <Zap className="w-4 h-4" />
            </div>
            Connect Nostr
          </DialogTitle>
          <DialogDescription>
            Nostr automated posting requires a Webhook/Relay URL configured to broadcast posts on your behalf.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Webhook / Relay Gateway URL</label>
            <Input
              type="url"
              placeholder="https://hooks.zapier.com/... or custom relay gateway"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Npub or Username (Handle)</label>
            <Input
              placeholder="npub1... or your handle"
              value={npub}
              onChange={(e) => setNpub(e.target.value)}
              disabled={submitting}
              required
            />
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
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Account'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
