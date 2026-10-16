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

interface LemmyConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function LemmyConnectDialog({
  open,
  onClose,
  workspaceId,
  onSuccess,
}: LemmyConnectDialogProps) {
  const [instanceUrl, setInstanceUrl] = useState('lemmy.world');
  const [authMode, setAuthMode] = useState<'password' | 'jwt'>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [jwt, setJwt] = useState('');
  const [community, setCommunity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!instanceUrl.trim()) {
      setError('Please provide a Lemmy instance domain (e.g. lemmy.world).');
      return;
    }

    if (authMode === 'password' && (!username.trim() || !password)) {
      setError('Please enter your Lemmy username/email and password.');
      return;
    }

    if (authMode === 'jwt' && !jwt.trim()) {
      setError('Please enter your Lemmy API token (JWT).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/platform/lemmy/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          instanceUrl: instanceUrl.trim(),
          username: authMode === 'password' ? username.trim() : undefined,
          password: authMode === 'password' ? password : undefined,
          jwt: authMode === 'jwt' ? jwt.trim() : undefined,
          community: community.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Connected to Lemmy as @${data.username}!`);
        onSuccess(data.username || 'Lemmy User');
        onClose();
        setPassword('');
        setJwt('');
      } else {
        setError(data.error || 'Failed to connect to Lemmy. Please verify your details.');
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
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 flex items-center justify-center shadow-sm">
              <PlatformBrandLogo platform="lemmy" size={20} />
            </div>
            Connect Lemmy
          </DialogTitle>
          <DialogDescription>
            Broadcast your posts to Lemmy communities across the Fediverse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-4 pt-2">
          {/* Instance URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Instance Domain
            </label>
            <Input
              placeholder="lemmy.world, lemm.ee, feddit.de, etc."
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              The domain of your Lemmy server (e.g. <code>lemmy.world</code>, <code>sh.itjust.works</code>)
            </p>
          </div>

          {/* Auth Method Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Authentication Method
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 dark:bg-white/5 rounded-lg text-sm">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`py-1.5 px-3 rounded-md font-medium transition-all ${
                  authMode === 'password'
                    ? 'bg-white dark:bg-neutral-800 shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Username &amp; Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('jwt')}
                className={`py-1.5 px-3 rounded-md font-medium transition-all ${
                  authMode === 'jwt'
                    ? 'bg-white dark:bg-neutral-800 shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                API Token (JWT)
              </button>
            </div>
          </div>

          {/* Auth Fields */}
          {authMode === 'password' ? (
            <div className="space-y-3 p-3.5 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Username or Email</label>
                <Input
                  placeholder="Your Lemmy username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 p-3.5 rounded-lg border border-border/50 bg-muted/20">
              <label className="text-sm font-medium">Lemmy JWT / API Token</label>
              <Input
                type="password"
                placeholder="eyJhbGciOi..."
                value={jwt}
                onChange={(e) => setJwt(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Paste an active Lemmy JWT token obtained from your instance session or bot account.
              </p>
            </div>
          )}

          {/* Target Community (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default Community <span className="font-normal lowercase text-muted-foreground/70">(optional)</span>
              </label>
            </div>
            <Input
              placeholder="e.g. general, technology, programming"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              The community to post in (e.g. <code>general</code>). If left blank, Unool will use one of your subscribed communities.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {/* Info card */}
          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/40 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-[#00BC8C]" />
              Federated &amp; Decentralized Publishing
            </div>
            <p>
              Credentials are encrypted using AES-GCM and stored securely to broadcast posts directly to your chosen Lemmy server.
            </p>
            <div className="pt-1">
              <a
                href="https://join-lemmy.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                Learn more about Lemmy <ExternalLink className="h-3 w-3" />
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
              className="bg-[#00BC8C] hover:bg-[#00BC8C]/90 text-white font-medium shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Connect Lemmy
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
