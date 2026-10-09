'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Globe, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MastodonConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function MastodonConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: MastodonConnectDialogProps) {
  const [instanceUrl, setInstanceUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/platform/mastodon/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ instanceUrl, accessToken, workspaceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Connection failed. Please try again.');
        return;
      }

      toast.success(`Mastodon connected as @${data.username}!`);
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
            <div className="p-1.5 rounded-lg bg-[#6364FF] text-white">
              <Globe className="h-4 w-4" />
            </div>
            Connect Mastodon
          </DialogTitle>
          <DialogDescription>
            Provide your Mastodon instance URL and a generated Personal Access Token.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Instance URL</label>
            <Input
              placeholder="mastodon.social"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-xs text-muted-foreground">The domain of your Mastodon server (e.g. mastodon.social)</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Access Token</label>
            <Input
              type="password"
              placeholder="Your Personal Access Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Generate one in{' '}
              <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                Preferences → Development → New Application
              </span>
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
