import { buildTestQpqConfig, defineKeyValueStore, KeyValueStoreActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { closeAllKvsRepositories } from '../../../logic/keyValueStore/getKvsRepository';
import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';

// The original stale-read repro at the level it was reported: a store owned
// by service A and read by service B (ca's userTenantLinks under a tenanted
// flow route). A write through A must be visible through B's repository
// instance, including after B has already read the store once - the json
// engine served its first-read snapshot forever.
describe('cross-service KVS visibility', () => {
  const ownerModule = 'cross-vis-service-a';
  const readerModule = 'cross-vis-service-b';

  let runtimePath: string;

  const linksStore = () => defineKeyValueStore('userLinks', { key: 'id', type: 'string' }, [], { owner: { module: ownerModule } });

  const devServerConfig = () => ({ runtimePath }) as any;
  const ownerConfig = () => buildTestQpqConfig([linksStore()], { moduleName: ownerModule });
  const readerConfig = () => buildTestQpqConfig([linksStore()], { moduleName: readerModule });

  beforeEach(() => {
    runtimePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-kvs-cross-'));
  });

  afterEach(async () => {
    // Also clears the per-service cache, so a later test gets fresh instances
    // over its own runtime path rather than these closed ones.
    await closeAllKvsRepositories();
    fs.rmSync(runtimePath, { recursive: true, force: true });
  });

  it('a write through the owner service is visible through the reader service, even after the reader has already read', async () => {
    const upsertProcessors = await getKeyValueStoreUpsertActionProcessor(devServerConfig())(ownerConfig(), noopDynamicModuleLoader);
    const getProcessors = await getKeyValueStoreGetActionProcessor(devServerConfig())(readerConfig(), noopDynamicModuleLoader);
    const upsert = upsertProcessors[KeyValueStoreActionType.Upsert];
    const get = getProcessors[KeyValueStoreActionType.Get];

    await invokeProcessor(upsert, { keyValueStoreName: 'userLinks', item: { id: 'link-1', member: true } });

    const firstRead = await invokeProcessor(get, { keyValueStoreName: 'userLinks', key: 'link-1' });
    expect(resolveActionResult(firstRead)).toEqual({ id: 'link-1', member: true });

    // The actual bug: the reader has already touched the store; a later
    // write through the owner must still come back, not a stale snapshot.
    await invokeProcessor(upsert, { keyValueStoreName: 'userLinks', item: { id: 'link-2', member: true } });

    const secondRead = await invokeProcessor(get, { keyValueStoreName: 'userLinks', key: 'link-2' });
    expect(resolveActionResult(secondRead)).toEqual({ id: 'link-2', member: true });
  });
});
