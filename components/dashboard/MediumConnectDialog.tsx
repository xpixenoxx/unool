'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface MediumConnectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: (username: string) => void;
}

export function MediumConnectDialog({ open, onClose, workspaceId, onSuccess }: MediumConnectDialogProps) {
  const [integrationToken, setIntegrationToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    const token = integrationToken.trim();
    if (!token) {
      toast.error('Please enter your Medium Integration Token');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/auth/platform/medium/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          integrationToken: token,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Connected to Medium successfully!');
        onSuccess(data.username || 'Medium User');
        onClose();
        setIntegrationToken('');
      } else {
        toast.error(data.error || 'Failed to connect to Medium');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-black text-white">
              <FileText className="w-5 h-5" />
            </div>
            Connect Medium
          </DialogTitle>
          <DialogDescription>
            Medium uses Integration Tokens to publish articles. You can create one in your Medium settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Integration Token</label>
            <Input
              placeholder="e.g. 2a4b...c5f"
              value={integrationToken}
              onChange={(e) => setIntegrationToken(e.target.value)}
              type="password"
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p className="font-medium text-foreground mb-1">How to get a token:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open Medium and click your avatar (top right).</li>
              <li>Go to <strong>Settings</strong> &gt; <strong>Security and Apps</strong>.</li>
              <li>Scroll down to <strong>Integration tokens</strong>.</li>
              <li>Enter a description like "Unool" and generate a token.</li>
            </ol>
            <a href="https://medium.com/me/settings/security" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-primary hover:underline">
              Go to Medium Settings <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={loading || !integrationToken.trim()} className="bg-black hover:bg-black/90 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
