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
import { Loader2, ExternalLink, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface HashnodeConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function HashnodeConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: HashnodeConnectDialogProps) {
  const [personalAccessToken, setPersonalAccessToken] = useState('');
  const [publicationHost, setPublicationHost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = personalAccessToken.trim();
    if (!token) {
      setError('Please enter your Hashnode Personal Access Token (PAT).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/platform/hashnode/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          personalAccessToken: token,
          publicationHost: publicationHost.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Connected to Hashnode as @${data.username}!`);
        onSuccess(data.username || 'Hashnode User');
        onClose();
        setPersonalAccessToken('');
        setPublicationHost('');
      } else {
        setError(data.error || 'Failed to connect to Hashnode. Please verify your token.');
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
            <div className="p-2 rounded-lg bg-[#2962FF] text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            Connect Hashnode
          </DialogTitle>
          <DialogDescription>
            Broadcast technical blogs, guides, and developer stories directly to your Hashnode publication.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-4 pt-2">
          {/* Personal Access Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal Access Token (PAT)
            </label>
            <Input
              type="password"
              placeholder="e.g. 5d8a9b2c-..."
              value={personalAccessToken}
              onChange={(e) => setPersonalAccessToken(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your secret access token generated from your Hashnode Developer Settings.
            </p>
          </div>

          {/* Publication Host / Domain (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Publication Domain or Host <span className="font-normal lowercase text-muted-foreground/70">(optional)</span>
            </label>
            <Input
              placeholder="e.g. blog.yourdomain.com or yourblog.hashnode.dev"
              value={publicationHost}
              onChange={(e) => setPublicationHost(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to automatically connect to your primary publication.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {/* How to get a token guide */}
          <div className="text-xs text-muted-foreground bg-muted/40 p-3.5 rounded-lg border border-border/40 space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-[#2962FF]" />
              How to obtain your Hashnode Token
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
              <li>Log in to Hashnode and click your profile icon &gt; <strong>Account Settings</strong>.</li>
              <li>Navigate to the <strong>Developer</strong> tab in the sidebar.</li>
              <li>Under <strong>Personal Access Token</strong>, click <strong>Generate New Token</strong>.</li>
              <li>Copy and paste your generated token into the field above.</li>
            </ol>
            <div className="pt-1">
              <a
                href="https://hashnode.com/settings/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#2962FF] hover:underline font-medium"
              >
                Open Hashnode Developer Settings <ExternalLink className="h-3 w-3" />
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
              disabled={loading || !personalAccessToken.trim()}
              className="bg-[#2962FF] hover:bg-[#2962FF]/90 text-white font-medium shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Connect Hashnode
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
