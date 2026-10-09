'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExternalLink, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface TelegramConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function TelegramConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: TelegramConnectDialogProps) {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/platform/telegram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ botToken, chatId, workspaceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Connection failed. Please try again.');
        return;
      }

      toast.success(`Telegram connected successfully!`);
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
            <div className="p-1.5 rounded-lg bg-[#229ED9] text-white">
              <Send className="w-4 h-4" />
            </div>
            Connect Telegram
          </DialogTitle>
          <DialogDescription>
            Provide your Telegram Bot Token and the Chat ID to publish to. Make sure your bot is an admin in the channel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Bot Token</label>
            <Input
              type="password"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Create a bot via{' '}
              <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary font-medium hover:underline">
                @BotFather
                <ExternalLink className="w-3 h-3"/>
              </a>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Chat ID</label>
            <Input
              placeholder="@yourchannel or -1001234567890"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
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
