import { buildTestQpqConfig, defineKeyValueStore, KeyValueStoreActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getKvsRepository } from '../../../logic/keyValueStore/getKvsRepository';
import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';

// Pins write-through-one-processor-read-through-another at the processor
// level. The sqlite engine makes this hold even across repository instances
// (every handle sees committed data), so unlike in the json-engine days the
// getKvsRepository cache is no longer load-bearing for correctness - this
// guards the processor wiring itself.
describe('KVS processors share one repository instance per service', () => {
  const moduleName = 'shared-kvs-repository-test';
  let runtimePath: string;

  const devServerConfig = () => ({ runtimePath }) as any;
  const qpqConfig = () => buildTestQpqConfig([defineKeyValueStore('widgets', { key: 'id', type: 'string' })], { moduleName });

  beforeEach(() => {
    runtimePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-kvs-shared-'));
  });

  afterEach(async () => {
    await getKvsRepository(qpqConfig(), devServerConfig()).close();
    fs.rmSync(runtimePath, { recursive: true, force: true });
  });

  it('writes through the upsert processor are visible through the get processor', async () => {
    const upsertProcessors = await getKeyValueStoreUpsertActionProcessor(devServerConfig())(qpqConfig(), noopDynamicModuleLoader);
    const getProcessors = await getKeyValueStoreGetActionProcessor(devServerConfig())(qpqConfig(), noopDynamicModuleLoader);

    await invokeProcessor(upsertProcessors[KeyValueStoreActionType.Upsert], {
      keyValueStoreName: 'widgets',
      item: { id: 'w1', name: 'Sprocket' },
    });

    const result = await invokeProcessor(getProcessors[KeyValueStoreActionType.Get], { keyValueStoreName: 'widgets', key: 'w1' });

    expect(resolveActionResult(result)).toEqual({ id: 'w1', name: 'Sprocket' });
  });
});
