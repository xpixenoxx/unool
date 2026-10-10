'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

interface KickConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function KickConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: KickConnectDialogProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/platform/kick/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ webhookUrl, channelName, workspaceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Connection failed. Please try again.');
        return;
      }

      toast.success(`Kick connected successfully!`);
      onSuccess(data.username);
      onClose();
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-black/95 dark:backdrop-blur-xl border dark:border-white/10 z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#53FC18] text-black">
              <Gamepad2 className="w-4 h-4" />
            </div>
            Connect Kick
          </DialogTitle>
          <DialogDescription>
            Kick automated posting requires a Webhook URL configured to send messages to your Kick Channel. 
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Webhook URL</label>
            <Input
              type="url"
              placeholder="https://hooks.zapier.com/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Channel Name</label>
            <Input
              placeholder="Your Kick Channel"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
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
