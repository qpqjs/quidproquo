import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineKeyValueStore, KeyValueStoreActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getKeyValueStoreActionProcessor } from './index';

describe('getKeyValueStoreActionProcessor (index)', () => {
  it('registers a processor for every key value store action type', async () => {
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineKeyValueStore('users', 'pk', ['sk'])]);
    const processors = await getKeyValueStoreActionProcessor(config, {} as any);

    expect(Object.keys(processors).sort()).toEqual(
      [
        KeyValueStoreActionType.Get,
        KeyValueStoreActionType.GetAll,
        KeyValueStoreActionType.Delete,
        KeyValueStoreActionType.Query,
        KeyValueStoreActionType.Scan,
        KeyValueStoreActionType.ScanAllScopes,
        KeyValueStoreActionType.Update,
        KeyValueStoreActionType.Upsert,
        KeyValueStoreActionType.UpsertMany,
      ].sort(),
    );
  });
});
