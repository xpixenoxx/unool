'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformBrandLogo } from '@/components/dashboard/PlatformLogos';

interface SlackConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function SlackConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: SlackConnectDialogProps) {
  const [accessToken, setAccessToken] = useState('');
  const [channel, setChannel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/platform/slack/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken, channel, workspaceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Connection failed. Please try again.');
        return;
      }

      toast.success(`Slack connected successfully!`);
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
            <div className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 flex items-center justify-center">
              <PlatformBrandLogo platform="slack" size={18} />
            </div>
            Connect Slack
          </DialogTitle>
          <DialogDescription>
            Provide your Slack OAuth Token and the Channel name you want to publish to.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Access Token</label>
            <Input
              type="password"
              placeholder="xoxp-... or xoxb-..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Find this in{' '}
              <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary font-medium hover:underline">
                Slack API Dashboard → OAuth & Permissions
                <ExternalLink className="w-3 h-3"/>
              </a>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Default Channel</label>
            <Input
              placeholder="general"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-xs text-muted-foreground">The channel to post to (without the #)</p>
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
