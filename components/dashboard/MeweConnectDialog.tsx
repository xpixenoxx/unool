'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface MeweConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function MeweConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: MeweConnectDialogProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/platform/mewe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ webhookUrl, username, workspaceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Connection failed. Please try again.');
        return;
      }

      toast.success(`MeWe connected successfully!`);
      onSuccess(data.username);
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
            <div className="p-1.5 rounded-lg bg-[#FF0000] text-white">
              <Hash className="w-4 h-4" />
            </div>
            Connect MeWe
          </DialogTitle>
          <DialogDescription>
            MeWe automated posting requires a Webhook URL configured to send posts on your behalf.
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
            <label className="text-sm font-medium">Username (Handle)</label>
            <Input
              placeholder="Your MeWe handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
