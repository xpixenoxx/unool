'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Key, Shield, Bell, Palette, Trash2, User, Lock, LogOut, CheckCircle, AlertCircle, Copy, Eye, EyeOff, ChevronDown, ChevronUp, Trash, Check } from 'lucide-react';
import { toast } from 'sonner';

type TabValue = 'account' | 'security' | 'notifications' | 'appearance' | 'danger';

interface Workspace {
  id: string;
  name: string;
  plan: string;
}

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

type ApiKeyScope = 'posts:read' | 'posts:write' | 'analytics:read' | 'profile:write' | 'webhooks:manage';

const ALL_SCOPES: { value: ApiKeyScope; label: string; description: string }[] = [
  { value: 'posts:read', label: 'Posts: Read', description: 'Read posts and drafts' },
  { value: 'posts:write', label: 'Posts: Write', description: 'Create, update, publish posts' },
  { value: 'analytics:read', label: 'Analytics: Read', description: 'View analytics and engagement data' },
  { value: 'profile:write', label: 'Profile: Write', description: 'Update profile, links, proof points' },
  { value: 'webhooks:manage', label: 'Webhooks: Manage', description: 'Configure and manage webhook endpoints' },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabValue>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [oauthBanner, setOauthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<ApiKeyScope[]>(['posts:read', 'posts:write']);
  const [newKeyExpiresDays, setNewKeyExpiresDays] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [newKeyPlaintext, setNewKeyPlaintext] = useState<string>('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const connected = searchParams.get('connected');
  const error = searchParams.get('error');
  const description = searchParams.get('description');

  useEffect(() => {
    if (connected) {
      const platformName = connected.charAt(0).toUpperCase() + connected.slice(1);
      setOauthBanner({ type: 'success', message: `${platformName} connected successfully!` });
      toast.success(`${platformName} connected!`);
    } else if (error) {
      const msg = description
        ? decodeURIComponent(description)
        : error === 'redis_unconfigured'
          ? 'Redis (Upstash) is not configured. Platform connections require Redis for OAuth state.'
          : error === 'invalid_state'
            ? 'OAuth session expired. Please try connecting again.'
            : `Connection failed: ${error}`;
      setOauthBanner({ type: 'error', message: msg });
      toast.error('Connection failed', { description: msg });
    }
  }, [connected, error, description]);

  useEffect(() => {
    loadWorkspace();
    loadApiKeys();
  }, []);

  const loadWorkspace = async () => {
    try {
      const res = await fetch('/api/workspace', { credentials: 'include' });
      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
        setWorkspaceName(data.workspace.name);
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    setApiKeysLoading(true);
    try {
      const res = await fetch('/api/keys', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch {
      // Ignore errors
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleSaveWorkspace = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: workspaceName }),
      });
      if (res.ok) {
        toast.success('Workspace name updated');
      } else {
        toast.error('Failed to update workspace');
      }
    } catch {
      toast.error('Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Key name is required');
      return;
    }
    if (newKeyScopes.length === 0) {
      toast.error('Select at least one scope');
      return;
    }

    setCreatingKey(true);
    try {
      const expiresAt = newKeyExpiresDays ? new Date(Date.now() + parseInt(newKeyExpiresDays) * 24 * 60 * 60 * 1000).toISOString() : undefined;

      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newKeyName,
          scopes: newKeyScopes,
          expiresAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create key');
      }

      // Show the plaintext key in a dialog
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
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

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

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Key copied to clipboard');
  };

  const handleSignOut = async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/signup';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <Card>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, workspace, and preferences</p>
      </div>

      {/* OAuth Result Banner */}
      {oauthBanner && (
        <Alert variant={oauthBanner.type === 'error' ? 'destructive' : 'default'} className={oauthBanner.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}>
          {oauthBanner.type === 'success'
            ? <CheckCircle className="h-4 w-4 text-green-600" />
            : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{oauthBanner.message}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabValue)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account"><User className="mr-2 h-4 w-4" /> Account</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="danger"><Trash2 className="mr-2 h-4 w-4 text-destructive" /> Danger Zone</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Workspace Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="My Workspace"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-tier">Plan</Label>
                  <Input
                    id="plan-tier"
                    value={workspace?.plan || 'free'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <Button onClick={handleSaveWorkspace} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Workspace Name'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your API keys for programmatic access to Unool.
              </p>

              {/* Create Key Dialog */}
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Key className="mr-2 h-4 w-4" />
                    Create New Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Give your key a name and select the permissions it needs. The full key will only be shown once.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production Server, CI/CD Pipeline"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Scopes (Permissions)</Label>
                      <div className="space-y-2 mt-1">
                        {ALL_SCOPES.map((scope) => (
                          <label
                            key={scope.value}
                            className="flex items-center gap-2 p-2 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={newKeyScopes.includes(scope.value)}
                              onCheckedChange={(checked) =>
                                setNewKeyScopes(checked
                                  ? [...newKeyScopes, scope.value]
                                  : newKeyScopes.filter((s) => s !== scope.value))
                              }
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{scope.label}</p>
                              <p className="text-xs text-muted-foreground">{scope.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="key-expires">Expires In (Days, Optional)</Label>
                      <Input
                        id="key-expires"
                        type="number"
                        min="1"
                        max="365"
                        value={newKeyExpiresDays}
                        onChange={(e) => setNewKeyExpiresDays(e.target.value)}
                        placeholder="Never expires"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creatingKey}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateKey} disabled={creatingKey}>
                      {creatingKey ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Key'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Show New Key Dialog */}
              {showNewKey && (
                <Dialog open={!!showNewKey} onOpenChange={() => setShowNewKey(null)}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Your New API Key</DialogTitle>
                      <DialogDescription className="text-destructive">
                        <AlertCircle className="mr-1 h-3 w-3 inline" />
                        This is the only time this key will be displayed. Save it securely now.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                        <span className="flex-1">{newKeyPlaintext}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyKey(newKeyPlaintext)}
                          disabled={copiedKeyId === showNewKey}
                        >
                          {copiedKeyId === showNewKey ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Keys are prefixed with <code>uk_live_</code> for identification.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setShowNewKey(null)}>I've Saved This Key</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* API Keys List */}
              {apiKeysLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 border rounded-lg animate-pulse bg-muted" />
                  ))}
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                  <p>No API keys yet.</p>
                  <Button asChild className="mt-2">
                    <DialogTrigger><Dialog><DialogTrigger>Create your first key</DialogTrigger></Dialog></DialogTrigger>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className={`border rounded-xl p-4 transition-all ${
                        key.revoked ? 'bg-muted/50 border-dashed opacity-60' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg font-mono text-xs">
                              {key.keyPrefix}••••••••
                            </span>
                            <h4 className="font-medium truncate">{key.name}</h4>
                            {key.revoked && (
                              <Badge variant="secondary">Revoked</Badge>
                            )}
                            {key.expiresAt && !key.revoked && new Date(key.expiresAt) < new Date() && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                            {!key.revoked && !key.expiresAt && <Badge variant="outline">Active</Badge>}
                            {!key.revoked && key.expiresAt && new Date(key.expiresAt) >= new Date() && (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {key.scopes.map((scope) => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-4">
                            <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                            {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                            {key.expiresAt && <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {key.revoked ? (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteKey(key.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeKey(key.id)}
                                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                              >
                                Revoke
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteKey(key.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Magic Link Authentication</p>
                  <p className="text-sm text-muted-foreground">Sign in with email links (no passwords)</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">Manage your logged-in devices</p>
                </div>
                <Button variant="ghost" size="sm">View Sessions</Button>
              </div>
            </CardContent          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage OAuth connections for publishing. Configure in the Platform Connections section on the Dashboard.
              </p>
              <Button variant="outline" asChild>
                <a href="/dashboard">Go to Platform Connections</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose how you want to be notified about activity on your posts and profile.
              </p>
              <div className="space-y-3">
                {[
                  { id: 'publish_success', label: 'Publish Success', description: 'When a post is published successfully' },
                  { id: 'publish_failure', label: 'Publish Failure', description: 'When a post fails to publish' },
                  { id: 'engagement', label: 'Engagement Alerts', description: 'Likes, comments, shares on your posts' },
                  { id: 'profile_views', label: 'Profile Views', description: 'Daily/weekly profile view summaries' },
                  { id: 'webhook_events', label: 'Webhook Events', description: 'Incoming webhook notifications from platforms' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Dashboard Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose your preferred dashboard appearance. This is separate from your public profile theme.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <Button
                    key={theme}
                    variant="outline"
                    className="flex flex-col items-center gap-2 p-4 h-auto"
                  >
                    <div className={`w-12 h-12 rounded-lg border-2 ${theme === 'system' ? 'bg-gradient-to-br from-blue-500 to-purple-500' : theme === 'dark' ? 'bg-gray-900' : 'bg-white' }`} />
                    <span className="capitalize">{theme}</span>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Theme selection will be saved in v1.1. Currently uses system preference.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Public Profile Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Customize how your public profile looks at {workspace?.name || 'yourname'}.unool.co
              </p>
              <Button variant="outline" asChild>
                <a href="/dashboard/presence">Edit in Presence Tab</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="mt-6 space-y-6">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h4 className="font-medium text-destructive mb-1">Delete Workspace</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your workspace and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={() => alert('Workspace deletion not yet implemented')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Workspace
                </Button>
              </div>

              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h4 className="font-medium text-destructive mb-1">Sign Out Everywhere</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Invalidate all active sessions and require re-authentication on all devices.
                </p>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out Everywhere
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}