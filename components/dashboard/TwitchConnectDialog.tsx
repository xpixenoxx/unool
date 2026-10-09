'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExternalLink, Loader2, Twitch } from 'lucide-react';
import { toast } from 'sonner';

interface TwitchConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function TwitchConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: TwitchConnectDialogProps) {
  const [accessToken, setAccessToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/platform/twitch/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken, clientId, workspaceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Connection failed. Please try again.');
        return;
      }

      toast.success(`Twitch connected successfully!`);
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
            <div className="p-1.5 rounded-lg bg-[#9146FF] text-white">
              <Twitch className="w-4 h-4" />
            </div>
            Connect Twitch
          </DialogTitle>
          <DialogDescription>
            Provide your Twitch App Client ID and a User Access Token.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Client ID</label>
            <Input
              placeholder="Your client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Access Token</label>
            <Input
              type="password"
              placeholder="Your access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Find this in{' '}
              <a href="https://dev.twitch.tv/console" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary font-medium hover:underline">
                Twitch Developer Console
                <ExternalLink className="w-3 h-3"/>
              </a>
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
