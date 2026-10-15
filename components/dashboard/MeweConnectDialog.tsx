'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, MessageSquare, ExternalLink, ShieldCheck, KeyRound } from 'lucide-react';
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
  const [clientId, setClientId] = useState('');
  const [appId, setAppId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!appId.trim()) {
      setError('Please provide your MeWe App ID.');
      return;
    }

    if (!apiKey.trim() && !accessToken.trim()) {
      setError('Please provide your MeWe API Key / Secret or Access Token.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/platform/mewe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clientId: clientId.trim() || appId.trim(),
          appId: appId.trim(),
          apiKey: apiKey.trim(),
          accessToken: accessToken.trim() || undefined,
          username: username.trim() || undefined,
          workspaceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Connection failed. Please check your credentials and try again.');
        return;
      }

      toast.success(`MeWe connected successfully as ${data.username}!`);
      onSuccess(data.username);
      onClose();
      // Clear sensitive fields
      setApiKey('');
      setAccessToken('');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-black/95 dark:backdrop-blur-xl border dark:border-white/10 z-[100] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2F435E] text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            Connect MeWe
          </DialogTitle>
          <DialogDescription>
            Connect using your official MeWe Developer credentials: Client ID, App ID, and API Key / Secret.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Client ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Client ID</label>
            <Input
              placeholder="e.g. client_xxxxxxxxxxxx"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your MeWe application Client ID from developer settings.
            </p>
          </div>

          {/* App ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">App ID (X-App-Id)</label>
            <Input
              placeholder="e.g. app_xxxxxxxxxxxx"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your unique application identifier sent in the <code className="text-[11px] bg-muted px-1 py-0.5 rounded">X-App-Id</code> header.
            </p>
          </div>

          {/* API Key / Secret */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">API Key / Secret (X-Api-Key)</label>
            <Input
              type="password"
              placeholder="••••••••••••••••••••••••"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your confidential developer API Key or Client Secret.
            </p>
          </div>

          {/* Access Token (Optional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Access Token <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              type="password"
              placeholder="Bearer apiToken if generated"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              If your MeWe app has generated an API Bearer token, paste it here. Otherwise, your API Key will be used directly.
            </p>
          </div>

          {/* MeWe Username (Optional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              MeWe Username / Handle <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              placeholder="e.g. your_handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Your personal or page username. If omitted, it will be retrieved automatically from the profile API.
            </p>
          </div>

          {/* Security & Info Notice */}
          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/40 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-[#2F435E]" />
              Official Developer API Security
            </div>
            <p>
              Your credentials are encrypted using AES-256-GCM before storage and are only transmitted to official MeWe endpoints (<code className="text-[11px] bg-muted px-1 py-0.5 rounded">mewe.com/api/v1</code>).
            </p>
            <div className="pt-1">
              <a
                href="https://mewe.com/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                MeWe Developer Portal &amp; Documentation <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
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
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#2F435E] hover:bg-[#2F435E]/90 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <KeyRound className="mr-1.5 h-4 w-4" />
                  Connect MeWe
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
