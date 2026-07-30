'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Linkedin, Twitter, MessageSquare, Facebook, Instagram, Phone, CheckCircle, AlertCircle, Unlink2, Link2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { platformAdapters, SUPPORTED_PLATFORMS } from '@/lib/platforms';

type Platform = typeof SUPPORTED_PLATFORMS[number];

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

// Platform display configuration - maps platform ID to display info
const PLATFORM_DISPLAY_CONFIG: Record<Platform, { icon: React.ElementType; name: string; color: string; description: string; available: boolean }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', color: 'bg-blue-600', description: 'Professional posts & articles', available: true },
  x: { icon: Twitter, name: 'X (Twitter)', color: 'bg-gray-800', description: 'Posts, threads & media', available: true },
  threads: { icon: MessageSquare, name: 'Threads', color: 'bg-black', description: 'Text, images & replies', available: true },
  facebook: { icon: Facebook, name: 'Facebook Pages', color: 'bg-blue-700', description: 'Pages posts with media', available: true },
  whatsapp: { icon: Phone, name: 'WhatsApp Status', color: 'bg-green-600', description: 'Status updates (24h)', available: true },
  instagram: { icon: Instagram, name: 'Instagram', color: 'bg-pink-600', description: 'Feed, Reels & Stories', available: false },
  manual: { icon: Link2, name: 'Manual / Other', color: 'bg-gray-600', description: 'Copy-paste to any platform', available: true },
};

export function PlatformConnections({ workspaceId }: PlatformConnectionsProps) {
  // Get only platforms that have adapters implemented
  const connectablePlatforms = useMemo(() =>
    SUPPORTED_PLATFORMS.filter(p => platformAdapters[p] && PLATFORM_DISPLAY_CONFIG[p].available) as Platform[],
    []
  );

  // Initialize connections state for all connectable platforms
  const initialConnections = useMemo(() => {
    const conn: Record<Platform, PlatformConnection> = {} as Record<Platform, PlatformConnection>;
    connectablePlatforms.forEach(p => {
      conn[p] = { platform: p, status: 'not_connected' };
    });
    return conn;
  }, [connectablePlatforms]);

  const [connections, setConnections] = useState<Record<Platform, PlatformConnection>>(initialConnections);
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
          // Merge server connections with local state (preserve platforms not in server response)
          setConnections(prev => ({
            ...prev,
            ...data.connections,
          }));
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
    const config = PLATFORM_DISPLAY_CONFIG[platform];
    if (!confirm(`Disconnect ${config.name}?`)) return;

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
        toast.success(`${config.name} disconnected`);
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectablePlatforms.map(p => (
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

        {/* Connectable platforms */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {connectablePlatforms.map(platform => {
            const config = PLATFORM_DISPLAY_CONFIG[platform];
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
                      <p className="text-xs text-muted-foreground">{config.description}</p>
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

        {/* Coming soon platforms */}
        {SUPPORTED_PLATFORMS
          .filter(p => !connectablePlatforms.includes(p))
          .map(platform => {
            const config = PLATFORM_DISPLAY_CONFIG[platform];
            return (
              <div
                key={platform}
                className="border border-dashed rounded-xl p-4 bg-muted/30 opacity-60"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`p-2 rounded-lg ${config.color} text-white`}>
                    <config.icon className="w-5 h-5" />
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{config.name}</h3>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Coming soon — Meta App Review required</span>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}
