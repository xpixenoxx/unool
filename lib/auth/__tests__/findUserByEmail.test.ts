import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockListUsers = vi.fn();
const mockGetUserById = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    rpc: (...args: any[]) => mockRpc(...args),
    auth: {
      admin: {
        listUsers: (...args: any[]) => mockListUsers(...args),
        getUserById: (...args: any[]) => mockGetUserById(...args),
      },
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  findUserByEmail,
  AuthUserLookupError,
  LIST_USERS_PER_PAGE,
  LIST_USERS_MAX_PAGES,
  AUTH_USER_LOOKUP_RPC,
  __resetFindUserByEmailCache,
} from '../findUserByEmail';

const makeUsers = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({
    id: `id-${from + i}`,
    email: `user${from + i}@example.com`,
  }));

/** Simulates a project with `total` users and a server that honours page/perPage. */
function installPagedBackend(total: number) {
  mockListUsers.mockImplementation(async ({ page = 1, perPage = 50 } = {}) => {
    const start = (page - 1) * perPage + 1;
    const end = Math.min(total, page * perPage);
    const users = start > total ? [] : makeUsers(start, end);
    return { data: { users, aud: 'authenticated' }, error: null };
  });
}

describe('findUserByEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListUsers.mockReset();
    mockGetUserById.mockReset();
    mockRpc.mockReset();
    __resetFindUserByEmailCache();
    // Default: RPC not deployed
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function' },
    });
  });

  it('finds user #51 (beyond the default perPage of 50)', async () => {
    installPagedBackend(1500);
    const user = await findUserByEmail('user51@example.com');
    expect(user?.id).toBe('id-51');
    // never uses the default (no-arg) call
    expect(mockListUsers).toHaveBeenCalledWith({ page: 1, perPage: LIST_USERS_PER_PAGE });
  });

  it('finds user #1001 on the second page', async () => {
    installPagedBackend(1500);
    const user = await findUserByEmail('user1001@example.com');
    expect(user?.id).toBe('id-1001');
    expect(mockListUsers).toHaveBeenCalledTimes(2);
    expect(mockListUsers).toHaveBeenLastCalledWith({ page: 2, perPage: LIST_USERS_PER_PAGE });
  });

  it('returns null when not found and stops after the short last page', async () => {
    installPagedBackend(1500);
    const user = await findUserByEmail('nobody@example.com');
    expect(user).toBeNull();
    expect(mockListUsers).toHaveBeenCalledTimes(2); // 1000 + 500 (short page)
  });

  it('stops on an empty page when the total is an exact multiple of perPage', async () => {
    installPagedBackend(2000);
    expect(await findUserByEmail('nobody@example.com')).toBeNull();
    expect(mockListUsers).toHaveBeenCalledTimes(3); // 1000 + 1000 + empty
  });

  it('is case-insensitive and trims input / ignores stored case', async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: 'u-1', email: 'Mixed.Case@Example.com' }] },
      error: null,
    });
    expect((await findUserByEmail('  MIXED.case@example.COM '))?.id).toBe('u-1');
  });

  it('returns null for empty input without calling the API', async () => {
    expect(await findUserByEmail('   ')).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockListUsers).not.toHaveBeenCalled();
  });

  it('throws (never "not found") when listUsers errors', async () => {
    mockListUsers.mockResolvedValue({ data: { users: [] }, error: { message: 'boom' } });
    await expect(findUserByEmail('a@b.com')).rejects.toBeInstanceOf(AuthUserLookupError);
  });

  it('throws when the hard page cap is reached without a conclusion', async () => {
    mockListUsers.mockImplementation(async () => ({
      data: { users: makeUsers(1, LIST_USERS_PER_PAGE) },
      error: null,
    }));
    await expect(findUserByEmail('nobody@example.com')).rejects.toBeInstanceOf(AuthUserLookupError);
    expect(mockListUsers).toHaveBeenCalledTimes(LIST_USERS_MAX_PAGES);
  });

  it('honours server nextPage hints when the server caps perPage', async () => {
    mockListUsers
      .mockResolvedValueOnce({ data: { users: makeUsers(1, 500), nextPage: 2 }, error: null })
      .mockResolvedValueOnce({ data: { users: makeUsers(501, 700), nextPage: null }, error: null });
    expect((await findUserByEmail('user650@example.com'))?.id).toBe('id-650');
    expect(mockListUsers).toHaveBeenCalledTimes(2);
  });

  describe('RPC fast path', () => {
    it('uses the RPC + getUserById and skips the scan when the RPC hits', async () => {
      mockRpc.mockResolvedValue({ data: 'id-1234', error: null });
      mockGetUserById.mockResolvedValue({
        data: { user: { id: 'id-1234', email: 'user1234@example.com' } },
        error: null,
      });
      const user = await findUserByEmail('User1234@Example.com');
      expect(user?.id).toBe('id-1234');
      expect(mockRpc).toHaveBeenCalledWith(AUTH_USER_LOOKUP_RPC, { p_email: 'user1234@example.com' });
      expect(mockGetUserById).toHaveBeenCalledWith('id-1234');
      expect(mockListUsers).not.toHaveBeenCalled();
    });

    it('treats an RPC null result as authoritative "not found"', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });
      expect(await findUserByEmail('x@y.com')).toBeNull();
      expect(mockListUsers).not.toHaveBeenCalled();
    });

    it.each(['PGRST202', '42883'])('falls back to the paged scan when RPC is missing (%s)', async (code) => {
      mockRpc.mockResolvedValue({ data: null, error: { code, message: 'missing' } });
      installPagedBackend(1500);
      expect((await findUserByEmail('user1001@example.com'))?.id).toBe('id-1001');
      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockListUsers).toHaveBeenCalledTimes(2);
    });

    it('does not re-probe a missing RPC on every call', async () => {
      installPagedBackend(10);
      await findUserByEmail('user1@example.com');
      await findUserByEmail('user2@example.com');
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });

    it('falls back to the scan on unexpected RPC errors and when getUserById fails', async () => {
      installPagedBackend(60);
      mockRpc.mockResolvedValueOnce({ data: null, error: { code: 'XX000', message: 'internal' } });
      expect((await findUserByEmail('user51@example.com'))?.id).toBe('id-51');

      __resetFindUserByEmailCache();
      mockRpc.mockResolvedValueOnce({ data: 'id-52', error: null });
      mockGetUserById.mockResolvedValueOnce({ data: { user: null }, error: { message: 'nope' } });
      expect((await findUserByEmail('user52@example.com'))?.id).toBe('id-52');
    });

    it('falls back to the scan when the RPC throws', async () => {
      mockRpc.mockRejectedValueOnce(new Error('network'));
      installPagedBackend(60);
      expect((await findUserByEmail('user55@example.com'))?.id).toBe('id-55');
    });
  });
});
