export type ApiKeyScope =
  | 'posts:read'
  | 'posts:write'
  | 'analytics:read'
  | 'profile:read'
  | 'profile:write'
  | 'webhooks:read'
  | 'webhooks:write'
  | 'workspace:read'
  | 'workspace:write';

export interface ApiKey {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyInput {
  workspaceId: string;
  userId: string;
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: Date;
}

export interface CreateApiKeyResult {
  apiKey: ApiKey;
  plaintextKey: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  scopes?: ApiKeyScope[];
  expiresAt?: Date | null;
}

export interface IApiKeyRepository {
  create(
    input: CreateApiKeyInput,
    plaintextKey: string,
    keyHash: string,
    encryptedKey: string
  ): Promise<CreateApiKeyResult>;
  findById(id: string): Promise<ApiKey | null>;
  findByWorkspaceId(workspaceId: string): Promise<ApiKey[]>;
  findByKeyHash(keyHash: string): Promise<ApiKey | null>;
  updateLastUsed(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}