import {
  buildTestQpqConfig,
  defineKeyValueStore,
  isErroredActionResult,
  KeyValueStoreActionType,
  kvsKey,
  noopDynamicModuleLoader,
  resolveActionResult,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreScanAllScopesActionProcessor } from './getKeyValueStoreScanAllScopesActionProcessor';

// The point of this action is that it sees what an ordinary scan deliberately cannot. If it
// ever quietly stops crossing scopes, or stops short, a migration would report success having
// skipped data — so completeness is what these pin down.

const { repo } = vi.hoisted(() => ({
  repo: { get: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn(), getAll: vi.fn(), listScopes: vi.fn() },
}));

vi.mock('../../../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;
const qpqConfig = buildTestQpqConfig([defineKeyValueStore('store', kvsKey('id', 'string'))]);

const rawScanPage = async (nextPageKey?: string) => {
  const processors = await getKeyValueStoreScanAllScopesActionProcessor(devServerConfig)(qpqConfig, noopDynamicModuleLoader);

  return invokeProcessor(processors[KeyValueStoreActionType.ScanAllScopes], { keyValueStoreName: 'store', nextPageKey });
};

const scanPage = async (nextPageKey?: string) => resolveActionResult(await rawScanPage(nextPageKey)) as any;

// What a caller must actually do, and therefore what the tests should exercise.
const drain = async () => {
  const all: any[] = [];
  let pageKey: string | undefined = undefined;
  let guard = 0;

  do {
    const page = await scanPage(pageKey);
    all.push(...page.items);
    pageKey = page.nextPageKey;

    if (++guard > 50) {
      throw new Error('scan did not terminate');
    }
  } while (pageKey);

  return all;
};

describe('getKeyValueStoreScanAllScopesActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads every scope AND the unscoped partition, tagging each row', async () => {
    repo.listScopes.mockResolvedValue(['tenant-a', 'tenant-b']);
    repo.scan.mockImplementation(async (_store: string, _filter: unknown, _page: unknown, _limit: unknown, scope?: string) => ({
      items: [{ id: `${scope ?? 'none'}-1` }],
      nextPageKey: undefined,
    }));

    expect(await drain()).toEqual([
      // Unscoped first: it is a real partition, not an absence.
      { scope: undefined, item: { id: 'none-1' } },
      { scope: 'tenant-a', item: { id: 'tenant-a-1' } },
      { scope: 'tenant-b', item: { id: 'tenant-b-1' } },
    ]);
  });

  it('pages WITHIN a partition, resuming where it left off', async () => {
    repo.listScopes.mockResolvedValue([]);
    repo.scan.mockImplementation(async (_store: string, _filter: unknown, inner?: string) =>
      inner === 'p2' ? { items: [{ id: 'b' }], nextPageKey: undefined } : { items: [{ id: 'a' }], nextPageKey: 'p2' },
    );

    expect((await drain()).map((entry) => entry.item.id)).toEqual(['a', 'b']);
  });

  it('pages ACROSS partitions, so a partial drain never looks finished', async () => {
    // The property that matters: the first call must NOT come back with an undefined page key
    // while tenants remain unread, or a caller that trusts it stops early.
    repo.listScopes.mockResolvedValue(['tenant-a']);
    repo.scan.mockImplementation(async (_store: string, _filter: unknown, _page: unknown, _limit: unknown, scope?: string) => ({
      items: [{ id: `${scope ?? 'none'}-1` }],
      nextPageKey: undefined,
    }));

    const first = await scanPage();
    expect(first.nextPageKey).toBeDefined();

    expect((await drain()).map((entry) => entry.scope)).toEqual([undefined, 'tenant-a']);
  });

  it('skips empty partitions rather than handing back empty pages', async () => {
    repo.listScopes.mockResolvedValue(['empty-a', 'empty-b', 'tenant-c']);
    repo.scan.mockImplementation(async (_store: string, _filter: unknown, _page: unknown, _limit: unknown, scope?: string) => ({
      items: scope === 'tenant-c' ? [{ id: 'c-1' }] : [],
      nextPageKey: undefined,
    }));

    const all = await drain();

    expect(all).toEqual([{ scope: 'tenant-c', item: { id: 'c-1' } }]);
  });

  it('errors on an unreadable page key instead of reporting the scan complete', async () => {
    // An empty successful page is indistinguishable from "that was everything", so a key it
    // cannot make sense of has to surface as a failure rather than a quiet end.
    repo.listScopes.mockResolvedValue([]);
    repo.scan.mockResolvedValue({ items: [], nextPageKey: undefined });

    expect(isErroredActionResult(await rawScanPage('not-base64-json'))).toBe(true);
  });
});
