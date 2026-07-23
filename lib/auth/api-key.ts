import { NextRequest, NextResponse } from 'next/server';
import { SupabaseApiKeyRepository } from '@/lib/repositories/supabase/SupabaseApiKeyRepository';
import { config } from '@/lib/config/schema';
import crypto from 'crypto';

const apiKeyRepository = new SupabaseApiKeyRepository();

export interface ApiKeyAuthContext {
  apiKeyId: string;
  workspaceId: string;
  userId: string;
  scopes: string[];
}

/**
 * Validates an API key from the Authorization header
 * Returns auth context if valid, null otherwise
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyAuthContext | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const key = authHeader.substring(7).trim();
  if (!key) {
    return null;
  }

  // Hash the provided key to look up in database
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const keyRecord = await apiKeyRepository.findByKeyHash(keyHash);
  if (!keyRecord) {
    return null;
  }

  // Check if revoked
  if (keyRecord.revokedAt) {
    return null;
  }

  // Check if expired
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    return null;
  }

  // Update last used timestamp
  await apiKeyRepository.updateLastUsed(keyRecord.id);

  return {
    apiKeyId: keyRecord.id,
    workspaceId: keyRecord.workspaceId,
    userId: keyRecord.userId,
    scopes: keyRecord.scopes,
  };
}

/**
 * Middleware to require API key authentication
 */
export async function requireApiKey(
  request: NextRequest,
  requiredScopes: string[] = []
): Promise<{ auth: ApiKeyAuthContext } | NextResponse> {
  const auth = await validateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Check scopes if required
  if (requiredScopes.length > 0) {
    const hasAllScopes = requiredScopes.every((scope) => auth.scopes.includes(scope));
    if (!hasAllScopes) {
      return NextResponse.json(
        { error: 'Insufficient API key scopes', code: 'FORBIDDEN', required: requiredScopes },
        { status: 403 }
      );
    }
  }

  return { auth };
}

/**
 * Helper to extract workspace ID from API key auth
 */
export function getWorkspaceIdFromApiKey(auth: ApiKeyAuthContext): string {
  return auth.workspaceId;
}