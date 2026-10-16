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
import { Loader2, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformBrandLogo } from '@/components/dashboard/PlatformLogos';

interface DevtoConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function DevtoConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: DevtoConnectDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = apiKey.trim();
    if (!token) {
      setError('Please enter your DEV.to API Key.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/platform/devto/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          apiKey: token,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Connected to DEV.to as @${data.username}!`);
        onSuccess(data.username || 'DEV Creator');
        onClose();
        setApiKey('');
      } else {
        setError(data.error || 'Failed to connect to DEV.to. Please verify your API Key.');
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
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-sm">
              <PlatformBrandLogo platform="devto" size={20} />
            </div>
            Connect DEV Community (dev.to)
          </DialogTitle>
          <DialogDescription>
            Publish technical tutorials, engineering insights, and developer discussions directly to DEV.to.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-4 pt-2">
          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              DEV.to Personal API Key
            </label>
            <Input
              type="password"
              placeholder="e.g. 7f8b9c2a-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Your secret API Key generated from DEV Community extensions settings.
            </p>
          </div>

          {/* Quick instructions banner */}
          <div className="rounded-xl border border-muted bg-muted/40 p-3.5 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              How to get your DEV.to API Key:
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Log in to your account at <strong>dev.to</strong>.</li>
              <li>
                Open{' '}
                <a
                  href="https://dev.to/settings/extensions"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline inline-flex items-center gap-0.5 font-medium hover:text-primary/80"
                >
                  Settings &gt; Extensions
                  <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                </a>
              </li>
              <li>Scroll down to <strong>DEV Community API Keys</strong>.</li>
              <li>Provide a description (e.g. <em>Unool Publisher</em>) and click <strong>Generate API Key</strong>.</li>
              <li>Copy and paste your generated key above.</li>
            </ol>
          </div>

          {error && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          {/* Security badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Tokens are securely encrypted with AES-256-GCM before storage.</span>
          </div>

          {/* Action buttons */}
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
              disabled={loading || !apiKey.trim()}
              className="gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
