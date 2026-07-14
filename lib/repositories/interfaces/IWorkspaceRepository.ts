export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'team';
  settings: Record<string, unknown>;
  createdAt: Date;
}

export interface IUserRepository {
  findById(id: string): Promise<Workspace['ownerId'] | null>;
  findByEmail(email: string): Promise<Workspace['ownerId'] | null>;
  create(userId: string, email: string, name?: string): Promise<void>;
}

export interface IWorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  create(input: CreateWorkspaceInput): Promise<Workspace>;
  update(id: string, data: Partial<Workspace>): Promise<Workspace>;
}

export interface CreateWorkspaceInput {
  name: string;
  ownerId: string;
  plan?: 'free' | 'pro' | 'team';
}