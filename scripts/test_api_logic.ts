import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { SupabasePlatformRepository } from '../lib/repositories/supabase/SupabasePlatformRepository';
import { SUPPORTED_PLATFORMS } from '../lib/platforms';

async function testRouteLogic() {
  const workspaceId = '77029ac6-24db-45cd-9d04-48abe73e8ac6'; // from dump
  const userId = '851724d6-4fc4-441b-96e9-6f97405c3bd2'; // from dump

  const platformRepository = new SupabasePlatformRepository();
  let connections = await platformRepository.findByWorkspaceAndUser(workspaceId, userId);
  console.log('Strategy 1 Found:', connections.length);
  
  if (connections.length === 0 && userId !== workspaceId) {
    const fallbackConnections = await platformRepository.findByWorkspaceAndUser(userId, userId);
    console.log('Strategy 2 Found:', fallbackConnections.length);
    if (fallbackConnections.length > 0) {
      connections = fallbackConnections;
    }
  }

  const result: Record<string, any> = {};
  for (const platform of SUPPORTED_PLATFORMS) {
    result[platform] = { platform, status: 'not_connected' };
  }

  for (const conn of connections) {
    const now = new Date();
    const expiresAt = conn.expiresAt ? new Date(conn.expiresAt) : null;
    const isExpired = expiresAt && expiresAt <= now;
    
    result[conn.platform] = {
      platform: conn.platform,
      status: isExpired ? 'expired' : 'connected',
      username: conn.username ?? undefined,
      connectedAt: conn.createdAt?.toISOString(),
      expiresAt: conn.expiresAt?.toISOString(),
    };
  }

  console.log('Final API response:', JSON.stringify({ connections: result }, null, 2));
}

testRouteLogic().catch(console.error);
