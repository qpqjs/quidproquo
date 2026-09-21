import {
  buildTestQpqConfig,
  defineKeyValueStore,
  KeyValueStoreActionType,
  kvsKey,
  KvsStreamEventType,
  noopDynamicModuleLoader,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreDeleteActionProcessor } from './getKeyValueStoreDeleteActionProcessor';
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';

// The dev server stands in for a change stream, and the thing worth pinning is that a write
// actually reaches the handler — otherwise `go:dev` silently stops projecting and everything
// looks healthy right up until someone reads a stale summary.

const { repo } = vi.hoisted(() => ({
  repo: { get: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn() },
}));

vi.mock('../../../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

const { emitted } = vi.hoisted(() => ({ emitted: vi.fn() }));

vi.mock('../../../logic/kvsStream', () => ({
  emitKvsStreamEvent: (...args: unknown[]) => {
    emitted(...args);
    return Promise.resolve();
  },
}));

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;

const STREAMED = 'streamed';
const PLAIN = 'plain';
const STREAMED_SCOPED = 'streamed-scoped';

type StreamedRow = { pk: string; sk: string; body?: string };

const testQpqConfig = buildTestQpqConfig([
  defineKeyValueStore<StreamedRow>(STREAMED, kvsKey('pk', 'string'), [kvsKey('sk', 'string')], {
    onStream: { runtime: '/entry/kvsStream/project::project' as any, coalesceByPartitionKey: true },
  }),
  defineKeyValueStore(PLAIN, kvsKey('pk', 'string')),
  defineKeyValueStore<StreamedRow>(STREAMED_SCOPED, kvsKey('pk', 'string'), [kvsKey('sk', 'string')], {
    onStream: { runtime: '/entry/kvsStream/project::project' as any, coalesceByPartitionKey: true },
    scoped: true,
  }),
]);

const upsert = async (keyValueStoreName: string, item: Record<string, unknown>, scope?: string) => {
  const processors = await getKeyValueStoreUpsertActionProcessor(devServerConfig)(testQpqConfig, noopDynamicModuleLoader);

  return invokeProcessor(processors[KeyValueStoreActionType.Upsert], { keyValueStoreName, item, options: scope ? { scope } : undefined });
};

const remove = async (keyValueStoreName: string, key: string, sortKey?: string) => {
  const processors = await getKeyValueStoreDeleteActionProcessor(devServerConfig)(testQpqConfig, noopDynamicModuleLoader);

  return invokeProcessor(processors[KeyValueStoreActionType.Delete], { keyValueStoreName, key, sortKey });
};

// emitKvsStreamEvent(qpqConfig, session, emission)
const lastEmission = () => emitted.mock.calls[emitted.mock.calls.length - 1][2];

describe('dev server kvs stream emission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.get.mockResolvedValue(null);
    repo.upsert.mockImplementation(async (_store: string, item: unknown) => item);
    repo.delete.mockResolvedValue(true);
  });

  it('emits an Insert with the item and its keys when a new row is written', async () => {
    await upsert(STREAMED, { pk: 'doc-1', sk: '0001', body: 'hello' });

    expect(emitted).toHaveBeenCalledTimes(1);
    expect(lastEmission()).toEqual({
      keyValueStoreName: STREAMED,
      eventType: KvsStreamEventType.Insert,
      scope: undefined,
      // Only the store's declared key attributes, as a real stream record carries.
      keys: { pk: 'doc-1', sk: '0001' },
      newImage: { pk: 'doc-1', sk: '0001', body: 'hello' },
      oldImage: undefined,
    });
  });

  it('calls it a Modify, with the prior image, when the row already existed', async () => {
    repo.get.mockResolvedValue({ pk: 'doc-1', sk: '0001', body: 'before' });

    await upsert(STREAMED, { pk: 'doc-1', sk: '0001', body: 'after' });

    expect(lastEmission().eventType).toBe(KvsStreamEventType.Modify);
    expect(lastEmission().oldImage).toEqual({ pk: 'doc-1', sk: '0001', body: 'before' });
  });

  it('passes the scope through, so the handler re-enters the right tenant', async () => {
    await upsert(STREAMED_SCOPED, { pk: 'doc-1', sk: '0001' }, 'tenant-a');

    expect(lastEmission().scope).toBe('tenant-a');
    // Locally the backend partitions by scope at the file level, so keys stay raw.
    expect(lastEmission().keys.pk).toBe('doc-1');
  });

  it('emits a Remove carrying what was deleted', async () => {
    repo.get.mockResolvedValue({ pk: 'doc-1', sk: '0001', body: 'gone' });

    await remove(STREAMED, 'doc-1', '0001');

    expect(lastEmission()).toMatchObject({
      eventType: KvsStreamEventType.Remove,
      keys: { pk: 'doc-1', sk: '0001' },
      oldImage: { pk: 'doc-1', sk: '0001', body: 'gone' },
    });
  });

  it('emits for every store, leaving it to the emitter to ignore ones with no handler', async () => {
    // The emitter is the single place that knows whether a store declared onStream; the
    // processors stay dumb so a new stream config needs no change here.
    await upsert(PLAIN, { pk: 'doc-1' });

    expect(emitted).toHaveBeenCalledTimes(1);
    expect(lastEmission().keyValueStoreName).toBe(PLAIN);
  });
});
