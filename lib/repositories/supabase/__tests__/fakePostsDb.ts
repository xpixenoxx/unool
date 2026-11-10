/**
 * Minimal in-memory stand-in for the supabase `posts` table, used to prove
 * compare-and-set semantics. Each query executes synchronously inside `then`
 * (find matching rows + apply patch in one step), which mirrors the atomicity of a
 * single Postgres `UPDATE ... WHERE` statement: two concurrent updates can never both
 * match the same pre-image.
 */
export type Row = Record<string, any>;

export const fakePostsDb: { rows: Row[]; updateCalls: number } = { rows: [], updateCalls: 0 };

export function resetFakePostsDb(rows: Row[]) {
  fakePostsDb.rows = rows.map((r) => ({ ...r }));
  fakePostsDb.updateCalls = 0;
}

function builder() {
  const filters: Array<(r: Row) => boolean> = [];
  let patch: Row | null = null;
  const b: any = {
    update(p: Row) {
      patch = p;
      return b;
    },
    select() {
      return b;
    },
    eq(col: string, val: unknown) {
      filters.push((r) => r[col] === val);
      return b;
    },
    lte(col: string, val: string) {
      filters.push((r) => r[col] <= val);
      return b;
    },
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      try {
        fakePostsDb.updateCalls++;
        const matched = fakePostsDb.rows.filter((r) => filters.every((f) => f(r)));
        if (patch) for (const r of matched) Object.assign(r, patch);
        return Promise.resolve({ data: matched.map((r) => ({ ...r })), error: null }).then(resolve, reject);
      } catch (e) {
        return Promise.reject(e).then(resolve, reject);
      }
    },
  };
  return b;
}

export const fakeSupabase = {
  from(_table: string) {
    return builder();
  },
};

export function postRow(overrides: Row = {}): Row {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    profile_id: 'prof-1',
    workspace_id: 'ws-test',
    content: 'hello',
    status: 'scheduled',
    scheduled_at: new Date(Date.now() - 60_000).toISOString(),
    published_at: null,
    adaptation_prompt_version: null,
    version: 1,
    qstash_message_id: null,
    schedule_strategy: 'simultaneous',
    arc_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}
