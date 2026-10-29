import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getKeyValueStoreActionProcessor } from './getKeyValueStoreActionProcessor';
import { getKeyValueStoreDeleteActionProcessor } from './getKeyValueStoreDeleteActionProcessor';
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';
import { getKeyValueStoreGetAllActionProcessor } from './getKeyValueStoreGetAllActionProcessor';
import { getKeyValueStoreQueryActionProcessor } from './getKeyValueStoreQueryActionProcessor';
import { getKeyValueStoreScanActionProcessor } from './getKeyValueStoreScanActionProcessor';
import { getKeyValueStoreScanAllScopesActionProcessor } from './getKeyValueStoreScanAllScopesActionProcessor';
import { getKeyValueStoreUpdateActionProcessor } from './getKeyValueStoreUpdateActionProcessor';
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';
import { getKeyValueStoreUpsertManyActionProcessor } from './getKeyValueStoreUpsertManyActionProcessor';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getKeyValueStoreActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getKeyValueStoreDeleteActionProcessor(qpqConfig, dynamicModuleLoader),
      getKeyValueStoreGetActionProcessor(qpqConfig, dynamicModuleLoader),
      getKeyValueStoreGetAllActionProcessor(qpqConfig, dynamicModuleLoader),
      getKeyValueStoreUpsertActionProcessor(qpqConfig, dynamicModuleLoader),
      getKeyValueStoreUpsertManyActionProcessor(qpqConfig, dynamicModuleLoader),
      getKeyValueStoreUpdateActionProcessor(qpqConfig, dynamicModuleLoader),
      getKeyValueStoreQueryActionProcessor(qpqConfig, dynamicModuleLoader),
      getKeyValueStoreScanActionProcessor(qpqConfig, dynamicModuleLoader),
      getKeyValueStoreScanAllScopesActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getKeyValueStoreActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
