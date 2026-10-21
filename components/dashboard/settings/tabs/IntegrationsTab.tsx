'use client';

import { useState, useEffect } from 'react';
import { Terminal, Key, Webhook, Key as KeyIcon, Loader2, Trash, Trash2, Check, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { SectionHeading, SettingRow, PCard, PCardHead, PCardBody, SectionCard } from './shared';

type ApiKeyScope = 'posts:read' | 'posts:write' | 'analytics:read' | 'profile:write' | 'webhooks:manage';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  revoked: boolean;
}

const ALL_SCOPES: { value: ApiKeyScope; label: string; description: string }[] = [
  { value: 'posts:read', label: 'Posts: Read', description: 'Read posts and drafts' },
  { value: 'posts:write', label: 'Posts: Write', description: 'Create, update, publish posts' },
  { value: 'analytics:read', label: 'Analytics: Read', description: 'View analytics and engagement data' },
  { value: 'profile:write', label: 'Profile: Write', description: 'Update profile, links, proof points' },
  { value: 'webhooks:manage', label: 'Webhooks: Manage', description: 'Configure and manage webhook endpoints' },
];

interface IntegrationsTabProps {
  onLoadKeys: () => Promise<void>;
}

export function IntegrationsTab({ onLoadKeys }: IntegrationsTabProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<ApiKeyScope[]>(['posts:read', 'posts:write']);
  const [newKeyExpiresDays, setNewKeyExpiresDays] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [newKeyPlaintext, setNewKeyPlaintext] = useState<string>('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    setApiKeysLoading(true);
    try {
      const res = await fetch('/api/keys', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch {
      // ignore
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) { toast.error('Key name is required'); return; }
    if (newKeyScopes.length === 0) { toast.error('Select at least one scope'); return; }
    setCreatingKey(true);
    try {
      const expiresAt = newKeyExpiresDays
        ? new Date(Date.now() + parseInt(newKeyExpiresDays) * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newKeyName, scopes: newKeyScopes, expiresAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');
      setNewKeyPlaintext(data.plaintextKey);
      setShowNewKey(data.key.id);
      setNewKeyName('');
      setNewKeyScopes(['posts:read', 'posts:write']);
      setNewKeyExpiresDays('');
      setCreateDialogOpen(false);
      await loadApiKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'revoke' }),
      });
      if (res.ok) {
        toast.success('API key revoked');
        await loadApiKeys();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke key');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Permanently delete this API key? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/keys/${keyId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        toast.success('API key deleted');
        await loadApiKeys();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete key');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete key');
    }
  };

  const handleCopyKey = (key: string, keyId?: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Key copied to clipboard');
    if (keyId) setCopiedKeyId(keyId);
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Terminal}
        title="Integrations"
        subtitle="Programmatic access via API keys and real-time event delivery via webhooks."
      />

      {/* API Keys */}
      <PCard>
        <PCardHead>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                API Keys
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keys are hashed and shown only once at creation.
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs cursor-pointer"
                >
                  <Key className="h-3 w-3" />
                  New Key
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Name your key and select its permissions. The full key is shown only once.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="key-name" className="text-xs font-semibold">
                      Key Name
                    </Label>
                    <Input
                      id="key-name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production Server, CI/CD Pipeline"
                      className="mt-1.5 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Scopes (Permissions)</Label>
                    <div className="space-y-1.5 mt-2">
                      {ALL_SCOPES.map((scope) => (
                        <label
                          key={scope.value}
                          className="flex items-center gap-3 p-2.5 border rounded-xl hover:bg-accent cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={newKeyScopes.includes(scope.value)}
                            onCheckedChange={(checked) =>
                              setNewKeyScopes(
                                checked
                                  ? [...newKeyScopes, scope.value]
                                  : newKeyScopes.filter((s) => s !== scope.value),
                              )
                            }
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{scope.label}</p>
                            <p className="text-xs text-muted-foreground">{scope.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="key-expires" className="text-xs font-semibold">
                      Expires In (Days){' '}
                      <span className="font-normal text-muted-foreground">optional</span>
                    </Label>
                    <Input
                      id="key-expires"
                      type="number"
                      min="1"
                      max="365"
                      value={newKeyExpiresDays}
                      onChange={(e) => setNewKeyExpiresDays(e.target.value)}
                      placeholder="Never expires"
                      className="mt-1.5 h-9 text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={creatingKey}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    disabled={creatingKey}
                    className="bg-[#3D2B1F] hover:bg-[#2a1e15] text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                  >
                    {creatingKey ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Key'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </PCardHead>

        <PCardBody>
          {/* Plaintext Key reveal dialog */}
          {showNewKey && (
            <Dialog open={!!showNewKey} onOpenChange={() => setShowNewKey(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    Key Created Successfully
                  </DialogTitle>
                  <DialogDescription>
                    Copy this key now — it cannot be recovered after closing.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="relative">
                    <Input
                      value={newKeyPlaintext}
                      readOnly
                      className="font-mono text-sm pr-12 bg-zinc-50 dark:bg-zinc-800"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 cursor-pointer"
                      onClick={() => handleCopyKey(newKeyPlaintext, showNewKey)}
                    >
                      {copiedKeyId === showNewKey ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <strong>Important:</strong> Store this key securely. It cannot be recovered.
                      Prefix:{' '}
                      <code className="font-mono text-[10px]">uk_live_...</code>
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowNewKey(null)}
                    className="w-full bg-[#3D2B1F] hover:bg-[#2a1e15] text-white cursor-pointer"
                  >
                    I&apos;ve Saved This Key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* API Key list */}
          {apiKeysLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <KeyIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-[#3D2B1F] dark:text-zinc-100">
                No API keys yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first key to get programmatic access.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#3D2B1F] dark:text-zinc-100 truncate">
                        {key.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold px-1.5 py-0 ${
                          key.revoked
                            ? 'border-red-200 text-red-600 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-900/20'
                            : key.expiresAt && new Date(key.expiresAt) < new Date()
                              ? 'border-amber-200 text-amber-600 bg-amber-50 dark:border-amber-800 dark:text-amber-400'
                              : 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20'
                        }`}
                      >
                        {key.revoked
                          ? 'Revoked'
                          : key.expiresAt && new Date(key.expiresAt) < new Date()
                            ? 'Expired'
                            : 'Active'}
                      </Badge>
                      <code className="text-[10px] font-mono text-muted-foreground">
                        {key.keyPrefix}
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-1">
                      <span>
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                      {key.lastUsedAt && (
                        <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                      )}
                      {key.expiresAt && (
                        <span>Expires {new Date(key.expiresAt).toLocaleDateString()}</span>
                      )}
                      {key.scopes.length > 0 && (
                        <span>
                          {key.scopes.length} scope{key.scopes.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {!key.revoked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
                        className="h-7 text-xs cursor-pointer"
                      >
                        <Trash className="mr-1 h-3 w-3" />
                        Revoke
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteKey(key.id)}
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PCardBody>
      </PCard>

      {/* Webhooks */}
      <PCard>
        <PCardHead>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Webhooks
          </p>
        </PCardHead>
        <PCardBody>
          <SectionCard
            icon={Webhook}
            title="Webhook Configuration"
            description={
              <>
                Receive real-time HTTP POST events when posts publish, fail, or analytics
                update. Requires a key with the{' '}
                <code className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                  webhooks:manage
                </code>{' '}
                scope.
              </>
            }
            action={
              <p className="text-xs text-muted-foreground italic">
                Full webhook management coming in v1.1.
              </p>
            }
          />
        </PCardBody>
      </PCard>
    </div>
  );
}