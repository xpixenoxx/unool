import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { SupabaseApiKeyRepository } from '@/lib/repositories/supabase/SupabaseApiKeyRepository';
import { config } from '@/lib/config/schema';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const apiKeyRepository = new SupabaseApiKeyRepository();
const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

const KEY_PREFIX = 'uk_live_';
const KEY_LENGTH = 32; // 32 bytes = 256 bits

function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(KEY_LENGTH);
  return `${KEY_PREFIX}${randomBytes.toString('base64url')}`;
}

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function encryptApiKey(key: string): string {
  const encryptionKey = config.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY not configured');
  }
  const key = Buffer.from(encryptionKey, 'base64');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await apiKeyRepository.findByWorkspaceId(auth.workspaceId);

    // Filter out revoked keys for UI display
    const activeKeys = keys.filter((k) => !k.revokedAt);

    return NextResponse.json({
      keys: activeKeys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        scopes: k.scopes,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        expiresAt: k.expiresAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
        revoked: !!k.revokedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, scopes, expiresInDays } = body as {
      name?: string;
      scopes?: string[];
      expiresInDays?: number;
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const validScopes = [
      'posts:read',
      'posts:write',
      'analytics:read',
      'profile:read',
      'profile:write',
      'webhooks:read',
      'webhooks:write',
      'workspace:read',
      'workspace:write',
    ];

    const providedScopes = (scopes || []).filter((s) => validScopes.includes(s));
    if (providedScopes.length === 0) {
      return NextResponse.json({ error: 'At least one valid scope is required' }, { status: 400 });
    }

    let expiresAt: Date | undefined;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const plaintextKey = generateApiKey();
    const keyHash = hashApiKey(plaintextKey);
    const encryptedKey = encryptApiKey(plaintextKey);

    const result = await apiKeyRepository.create(
      {
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        name: name.trim(),
        scopes: providedScopes,
        expiresAt,
      },
      plaintextKey,
      keyHash,
      encryptedKey
    );

    return NextResponse.json({
      key: {
        id: result.apiKey.id,
        name: result.apiKey.name,
        keyPrefix: result.apiKey.keyPrefix,
        scopes: result.apiKey.scopes,
        expiresAt: result.apiKey.expiresAt?.toISOString() ?? null,
        createdAt: result.apiKey.createdAt.toISOString(),
      },
      plaintextKey: result.plaintextKey,
      // IMPORTANT: This is the only time the full key is shown!
      warning: 'Save this key now. It will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}