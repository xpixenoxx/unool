'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, ExternalLink, ShieldCheck, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ListmonkConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function ListmonkConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: ListmonkConnectDialogProps) {
  const [instanceUrl, setInstanceUrl] = useState('');
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [listId, setListId] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!instanceUrl.trim()) {
      setError('Please provide your Listmonk instance URL or domain (e.g. listmonk.example.com).');
      return;
    }

    if (!username.trim()) {
      setError('Please enter your Listmonk API username.');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter your Listmonk API key or password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/platform/listmonk/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          instanceUrl: instanceUrl.trim(),
          username: username.trim(),
          apiKey: apiKey.trim(),
          listId: listId.trim() || undefined,
          sendImmediately,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Connected to Listmonk as ${data.username}!`);
        onSuccess(data.username || 'Listmonk');
        onClose();
        setApiKey('');
      } else {
        setError(data.error || 'Failed to connect to Listmonk. Please verify your details.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-black/95 dark:backdrop-blur-xl border dark:border-white/10 z-[100] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-[#0045ff] text-white flex items-center justify-center shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            Connect Listmonk
          </DialogTitle>
          <DialogDescription>
            Broadcast newsletter campaigns and stories to your Listmonk mailing lists.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-4 pt-2">
          {/* Instance URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Instance URL or Domain
            </label>
            <Input
              placeholder="e.g. newsletter.yourdomain.com or https://listmonk.app"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              The public address of your self-hosted Listmonk instance.
            </p>
          </div>

          {/* API Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              API Username
            </label>
            <Input
              placeholder="e.g. listmonk or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your Listmonk admin or API username (from Settings &gt; Users).
            </p>
          </div>

          {/* API Key / Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              API Key or Password
            </label>
            <Input
              type="password"
              placeholder="••••••••••••••••••••••••"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your Listmonk API token or user password for Basic Auth.
            </p>
          </div>

          {/* Target List ID (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target List ID <span className="font-normal lowercase text-muted-foreground/70">(optional)</span>
              </label>
            </div>
            <Input
              placeholder="e.g. 1 (leave blank for first active list)"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              List ID from your Listmonk Lists dashboard. If left blank, Unool automatically publishes to your first active list.
            </p>
          </div>

          {/* Send Behavior Toggle */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
            <input
              type="checkbox"
              id="sendImmediately"
              checked={sendImmediately}
              onChange={(e) => setSendImmediately(e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="sendImmediately" className="text-sm cursor-pointer select-none">
              <span className="font-medium text-foreground">Send newsletter immediately upon publishing</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                When enabled, the campaign starts broadcasting to subscribers immediately. When disabled, campaigns are saved as drafts in Listmonk for your manual review.
              </p>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {/* Info card */}
          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/40 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-[#0045ff]" />
              Secure Newsletter Broadcasting
            </div>
            <p>
              Your credentials are encrypted using AES-GCM and stored securely to create and dispatch newsletter campaigns through your Listmonk instance.
            </p>
            <div className="pt-1">
              <a
                href="https://listmonk.app/docs/apis/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                Learn more about Listmonk APIs <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0045ff] hover:bg-[#0045ff]/90 text-white font-medium shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Connect Listmonk
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
