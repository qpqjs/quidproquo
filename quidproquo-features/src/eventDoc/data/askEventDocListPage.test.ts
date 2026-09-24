import { KeyValueStoreActionType, KeyValueStoreQueryOptions, KvsQueryOperation, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { askEventDocListPage } from './askEventDocListPage';

type QueryPayload = { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: KeyValueStoreQueryOptions };

const captureListQuery = (): QueryPayload => {
  let captured: QueryPayload | undefined;

  runStory(askEventDocProvideStore({ storeName: 'content', type: 'content' }, askEventDocListPage()), {
    [KeyValueStoreActionType.Query]: (action: { payload: QueryPayload }) => {
      captured = action.payload;
      return { items: [], nextPageKey: undefined };
    },
  });

  return captured!;
};

describe('askEventDocListPage', () => {
  it('reads newest first through the (type, updatedAt) index, which it has to name because it shares the table pk', () => {
    const { keyValueStoreName, keyCondition, options } = captureListQuery();

    expect(keyValueStoreName).toBe('content');
    expect(keyCondition).toEqual({ key: 'type', operation: 'Equal', valueA: 'content' });
    expect(options).toMatchObject({ indexName: 'type', sortAscending: false });
  });
});
