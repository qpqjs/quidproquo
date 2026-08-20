import { buildTestQpqConfig, defineKeyValueStore } from 'quidproquo-core';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { JsonKvsRepository } from './JsonKvsRepository';
import { runKvsRepositoryContractTests } from './kvsRepositoryContractTests';

runKvsRepositoryContractTests('JsonKvsRepository', (runtimePath, settings) => new JsonKvsRepository(runtimePath, settings));

describe('JsonKvsRepository persistence', () => {
  const openRepos: JsonKvsRepository[] = [];
  let runtimePath: string;

  const makeRepo = (settings: Parameters<typeof buildTestQpqConfig>[0]) => {
    const repo = new JsonKvsRepository(runtimePath, buildTestQpqConfig(settings));
    openRepos.push(repo);
    return repo;
  };

  beforeEach(() => {
    runtimePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-kvs-json-'));
  });

  afterEach(async () => {
    while (openRepos.length) {
      await openRepos.pop()!.close();
    }
    fs.rmSync(runtimePath, { recursive: true, force: true });
  });

  const storeFilePath = () => path.join(runtimePath, 'kvs', 'test-module', 'users.json');

  it('writes a one-row-per-line JSON file containing the items after a flush', async () => {
    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);
    await repo.upsert('users', { id: 'u1', name: 'Joe' });
    await repo.flush();

    // Streamed item-by-item (see writeStoreFile): compact rows, one per line, so the
    // serialized size of the whole store never passes through a single JSON.stringify.
    const raw = fs.readFileSync(storeFilePath(), 'utf-8');
    expect(raw).toBe('{\n  "items": [\n    {"id":"u1","name":"Joe"}\n  ]\n}\n');
    expect(JSON.parse(raw)).toEqual({ items: [{ id: 'u1', name: 'Joe' }] });
  });

  it('sees previously flushed data after restarting with a fresh repository instance', async () => {
    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);
    await repo.upsert('users', { id: 'u1', name: 'Joe' });
    await repo.close();

    const settings = buildTestQpqConfig([defineKeyValueStore('users', { key: 'id', type: 'string' })]);
    const restarted = new JsonKvsRepository(runtimePath, settings);
    openRepos.push(restarted);

    expect(await restarted.get('users', 'u1')).toEqual({ id: 'u1', name: 'Joe' });
  });

  it('throws an error naming the file when the on-disk JSON is corrupt', async () => {
    fs.mkdirSync(path.dirname(storeFilePath()), { recursive: true });
    fs.writeFileSync(storeFilePath(), '{ not valid json');

    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);

    await expect(repo.get('users', 'u1')).rejects.toThrow(storeFilePath());
  });

  it('debounces multiple mutations within the flush window into a single write', async () => {
    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);

    await repo.upsert('users', { id: 'u1', count: 0 });
    await repo.upsert('users', { id: 'u1', count: 1 });
    await repo.upsert('users', { id: 'u1', count: 2 });

    expect(fs.existsSync(storeFilePath())).toBe(false);

    await repo.flush();

    expect(JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8'))).toEqual({ items: [{ id: 'u1', count: 2 }] });
  });

  it('flushes on its own after the debounce window elapses, with no explicit flush() call', async () => {
    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);
    await repo.upsert('users', { id: 'u1', name: 'Joe' });

    expect(fs.existsSync(storeFilePath())).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8'))).toEqual({ items: [{ id: 'u1', name: 'Joe' }] });
  });

  it('a second flush() is a no-op once nothing is dirty', async () => {
    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);
    await repo.upsert('users', { id: 'u1', name: 'Joe' });
    await repo.flush();

    await expect(repo.flush()).resolves.toBeUndefined();
    expect(JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8'))).toEqual({ items: [{ id: 'u1', name: 'Joe' }] });
  });

  it('coalesces a flush() that lands while another flush() for the same store is already writing', async () => {
    const repo = makeRepo([defineKeyValueStore('users', { key: 'id', type: 'string' })]);
    await repo.upsert('users', { id: 'u1', count: 0 });

    const first = repo.flush();
    const second = repo.flush();
    await Promise.all([first, second]);

    expect(JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8'))).toEqual({ items: [{ id: 'u1', count: 0 }] });
  });

  it('routes a store file under its configured owner module rather than the default application module', async () => {
    const repo = makeRepo([defineKeyValueStore('widgets', { key: 'id', type: 'string' }, [], { owner: { module: 'other-service' } })]);
    await repo.upsert('widgets', { id: 'w1' });
    await repo.flush();

    expect(fs.existsSync(path.join(runtimePath, 'kvs', 'other-service', 'widgets.json'))).toBe(true);
  });
});
