import { buildTestQpqConfig, defineKeyValueStore, KvsUpdateActionType, QPQConfig } from 'quidproquo-core';

import * as fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runKvsRepositoryContractTests } from './kvsRepositoryContractTests';
import { SqliteKvsRepository } from './SqliteKvsRepository';
import { warnIfLegacyJsonKvsStores } from './warnIfLegacyJsonKvsStores';

runKvsRepositoryContractTests('SqliteKvsRepository', (runtimePath, settings) => new SqliteKvsRepository(runtimePath, settings));

// Engine-specific behavior: the on-disk shape (file, tables, columns, indexes)
// and the transactional guarantees the shared contract cannot express without
// knowing the engine.
describe('SqliteKvsRepository storage', () => {
  const openRepos: SqliteKvsRepository[] = [];
  let runtimePath: string;

  const makeRepo = (settings: QPQConfig) => {
    const repo = new SqliteKvsRepository(runtimePath, buildTestQpqConfig(settings));
    openRepos.push(repo);
    return repo;
  };

  const databasePath = () => path.join(runtimePath, 'kvs', 'kvs.db');

  // Second handle onto the same file, for asserting what's actually stored
  // rather than what the repository reports back.
  const inspectDatabase = <T>(inspect: (db: DatabaseSync) => T): T => {
    const db = new DatabaseSync(databasePath());
    try {
      return inspect(db);
    } finally {
      db.close();
    }
  };

  beforeEach(() => {
    runtimePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-kvs-sqlite-'));
  });

  afterEach(async () => {
    while (openRepos.length) {
      await openRepos.pop()!.close();
    }
    fs.rmSync(runtimePath, { recursive: true, force: true });
  });

  it('creates kvs.db under the runtime kvs directory and ignores a legacy database.db', async () => {
    fs.mkdirSync(path.join(runtimePath, 'kvs'), { recursive: true });
    fs.writeFileSync(path.join(runtimePath, 'kvs', 'database.db'), 'not a database this engine should ever open');

    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);
    await repo.upsert('users', { id: 'u1' });

    expect(fs.existsSync(databasePath())).toBe(true);
    expect(await repo.get('users', 'u1')).toEqual({ id: 'u1' });
  });

  it('derives the table name from the owner module, not the application module', async () => {
    const repo = makeRepo([defineKeyValueStore('widgets', { key: 'id', type: 'string' }, [], { owner: { module: 'other-service' } })]);
    await repo.upsert('widgets', { id: 'w1' });

    const tables = inspectDatabase((db) =>
      db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'qpq_kvs_%'`)
        .all()
        .map((row: any) => row.name),
    );
    expect(tables).toEqual(['qpq_kvs_other-service_widgets']);
  });

  it("stores unscoped rows under the '' scope sentinel and scoped rows under their scope name", async () => {
    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);
    await repo.upsert('users', { id: 'u1', name: 'A' });
    await repo.upsert('users', { id: 'u2', name: 'B' }, undefined, 'tenant-a');

    const rows = inspectDatabase((db) => db.prepare(`SELECT scope, pk, data FROM "qpq_kvs_test-module_users" ORDER BY scope`).all() as any[]);
    expect(rows).toEqual([
      { scope: '', pk: 'u1', data: JSON.stringify({ id: 'u1', name: 'A' }) },
      { scope: 'tenant-a', pk: 'u2', data: JSON.stringify({ id: 'u2', name: 'B' }) },
    ]);
  });

  it('stores numeric key values as real numbers in the key columns', async () => {
    const repo = makeRepo([defineKeyValueStore('events', { key: 'pk', type: 'string' }, [{ key: 'sk', type: 'number' }])]);
    await repo.upsert('events', { pk: 'p', sk: 10, kind: 'a' });

    const row = inspectDatabase((db) => db.prepare(`SELECT pk, sk FROM "qpq_kvs_test-module_events"`).get() as any);
    expect(row).toEqual({ pk: 'p', sk: 10 });
    expect(typeof row.sk).toBe('number');
  });

  it('creates an expression index per configured GSI and keeps it through upsert, update and delete', async () => {
    const repo = makeRepo([
      defineKeyValueStore('people', { key: 'id', type: 'string' }, [], {
        indexes: [{ partitionKey: { key: 'email', type: 'string' }, sortKey: { key: 'age', type: 'number' } }],
      }),
    ]);

    await repo.upsert('people', { id: 'u1', email: 'a@x.com', age: 30 });
    await repo.update('people', 'u1', undefined, [{ attributePath: 'email', action: KvsUpdateActionType.Set, value: 'b@x.com' }]);
    await repo.delete('people', 'u1');

    const indexes = inspectDatabase((db) =>
      db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE '%gsi%'`)
        .all()
        .map((row: any) => row.name),
    );
    expect(indexes).toEqual(['qpq_kvs_test-module_people_gsi_email_age']);
  });

  it('rolls the whole upsertMany batch back when a later item fails to serialize', async () => {
    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);

    const circular: any = { id: 'u2' };
    circular.self = circular;

    await expect(repo.upsertMany('users', [{ id: 'u1' }, circular])).rejects.toThrow();
    expect(await repo.get('users', 'u1')).toBeNull();
  });

  it('reads an existing pk#sk row whose pk value itself contains the separator', async () => {
    const repo = makeRepo([defineKeyValueStore('orders', { key: 'pk', type: 'string' }, [{ key: 'sk', type: 'string' }])]);
    await repo.upsert('orders', { pk: 'a#b', sk: 's1', total: 5 });

    // 'a#b#s1' mis-splits into pk 'a', sk 'b#s1'; the concat fallback on the
    // miss path still finds the row.
    expect(await repo.get('orders', 'a#b#s1')).toEqual({ pk: 'a#b', sk: 's1', total: 5 });
    expect(await repo.delete('orders', 'a#b#s1')).toBe(true);
  });

  it('warns about leftover json store files without touching them', () => {
    const legacyFile = path.join(runtimePath, 'kvs', 'test-module', 'users.json');
    fs.mkdirSync(path.dirname(legacyFile), { recursive: true });
    fs.writeFileSync(legacyFile, '{ "items": [] }');

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      warnIfLegacyJsonKvsStores(runtimePath);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('no longer read');
      expect(fs.readFileSync(legacyFile, 'utf-8')).toBe('{ "items": [] }');
    } finally {
      warn.mockRestore();
    }
  });

  it('does not warn when no legacy json store files exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      warnIfLegacyJsonKvsStores(runtimePath);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
