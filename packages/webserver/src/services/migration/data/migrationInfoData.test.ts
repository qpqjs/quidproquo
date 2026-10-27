import { KeyValueStoreActionType, kvsEqual, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askGetMigrationBySrcPath, askUpsert } from './migrationInfoData';

const migrationInfo = { srcPath: 'mig/run', deployType: 'Api' } as any;

describe('askGetMigrationBySrcPath', () => {
  it('queries the migrations store by srcPath and returns the first item', () => {
    let captured: any;

    const result = runStory(askGetMigrationBySrcPath('mig/run', 'page-2'), {
      [KeyValueStoreActionType.Query]: (action: any) => {
        captured = action;
        return { items: [migrationInfo] };
      },
    });

    expect(result).toEqual(migrationInfo);
    expect(captured.payload).toEqual({
      keyValueStoreName: 'qpqMigrations',
      keyCondition: kvsEqual('srcPath', 'mig/run'),
      options: { nextPageKey: 'page-2' },
    });
  });

  it('returns undefined when nothing matches', () => {
    const result = runStory(askGetMigrationBySrcPath('mig/run'), {
      [KeyValueStoreActionType.Query]: { items: [] },
    });

    expect(result).toBeUndefined();
  });
});

describe('askUpsert', () => {
  it('upserts the migration info into the migrations store', () => {
    let captured: any;

    runStory(askUpsert(migrationInfo), {
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload).toEqual({
      keyValueStoreName: 'qpqMigrations',
      item: migrationInfo,
      options: undefined,
    });
  });
});
