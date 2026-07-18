'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Linkedin, Twitter, MessageSquare, CheckCircle, AlertCircle, Unlink2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

type Platform = 'linkedin' | 'x' | 'threads';

interface PlatformConnection {
  platform: Platform;
  status: 'connected' | 'expired' | 'not_connected' | 'error';
  username?: string;
  connectedAt?: string;
  expiresAt?: string;
}

interface PlatformConnectionsProps {
  workspaceId: string;
}

const PLATFORM_CONFIG: Record<Platform, { icon: React.ElementType; name: string; color: string }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', color: 'bg-gray-800' },
  threads: { icon: MessageSquare, name: 'Threads', color: 'bg-black' },
};

export function PlatformConnections({ workspaceId }: PlatformConnectionsProps) {
  const [connections, setConnections] = useState<Record<Platform, PlatformConnection>>({
    linkedin: { platform: 'linkedin', status: 'not_connected' },
    x: { platform: 'x', status: 'not_connected' },
    threads: { platform: 'threads', status: 'not_connected' },
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [disconnecting, setDisconnecting] = useState<Platform | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/platform/connections', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.connections) {
          setConnections(data.connections);
        }
      }
    } catch {
      // Ignore - use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: Platform) => {
    setConnecting(platform);
    window.location.href = `/api/auth/platform/connect?platform=${platform}&workspaceId=${workspaceId}`;
  };

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`Disconnect ${PLATFORM_CONFIG[platform].name}?`)) return;

    setDisconnecting(platform);
    try {
      const res = await fetch(`/api/platform/connections/${platform}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setConnections(prev => ({
          ...prev,
          [platform]: { platform, status: 'not_connected' },
        }));
        toast.success(`${PLATFORM_CONFIG[platform].name} disconnected`);
      } else {
        toast.error('Failed to disconnect');
      }
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Platform Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {(['linkedin', 'x', 'threads'] as Platform[]).map(p => (
              <div key={p} className="p-3 border rounded-lg animate-pulse bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Platform Connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your social accounts to enable one-click publishing.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {(['linkedin', 'x', 'threads'] as Platform[]).map(platform => {
            const config = PLATFORM_CONFIG[platform];
            const connection = connections[platform];
            const Icon = config.icon;
            const isConnected = connection.status === 'connected';
            const isExpired = connection.status === 'expired';
            const isError = connection.status === 'error';

            return (
              <div
                key={platform}
                className={`border rounded-xl p-4 transition-all ${
                  isConnected ? 'border-green-200 bg-green-50' :
                  isExpired ? 'border-yellow-200 bg-yellow-50' :
                  isError ? 'border-red-200 bg-red-50' :
                  'border-muted/50 bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg ${config.color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{config.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isConnected ? 'Connected' :
                         isExpired ? 'Token expired' :
                         isError ? 'Connection error' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isConnected ? 'default' : isExpired ? 'secondary' : isError ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle className="mr-1 h-2.5 w-2.5" />
                        Connected
                      </>
                    ) : isExpired ? (
                      <>
                        <AlertCircle className="mr-1 h-2.5 w-2.5" />
                        Expired
                      </>
                    ) : isError ? (
                      <>
                        <AlertCircle className="mr-1 h-2.5 w-2.5" />
                        Error
                      </>
                    ) : (
                      'Not connected'
                    )}
                  </Badge>
                </div>

                {isConnected && connection.username && (
                  <p className="text-sm text-muted-foreground mb-3">
                    @{connection.username}
                  </p>
                )}

                <div className="flex gap-2">
                  {isConnected || isExpired ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDisconnect(platform)}
                      disabled={disconnecting === platform}
                    >
                      {disconnecting === platform ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Unlink2 className="mr-1 h-3 w-3" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleConnect(platform)}
                      disabled={connecting === platform}
                    >
                      {connecting === platform ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}