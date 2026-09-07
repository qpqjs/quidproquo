import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askKeyValueStoreUpsertMany, askKeyValueStoreUpsertManyBase } from './askKeyValueStoreUpsertMany';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

describe('askKeyValueStoreUpsertMany', () => {
  it('yields an UpsertMany action with the items and options', () => {
    const items = [{ id: 'user-1' }, { id: 'user-2' }];
    const options = { ifNotExists: true, scope: 'tenant-a' };

    const { action } = captureRequester(askKeyValueStoreUpsertMany('users', items, options));

    expect(action).toEqual({
      type: KeyValueStoreActionType.UpsertMany,
      payload: { keyValueStoreName: 'users', items, options },
    });
  });

  it('leaves options undefined when omitted', () => {
    const { action } = captureRequester(askKeyValueStoreUpsertMany('users', [{ id: 'user-1' }]));

    expect(action.payload).toEqual({ keyValueStoreName: 'users', items: [{ id: 'user-1' }], options: undefined });
  });

  it('namespaces its error enum values under the action type', () => {
    expect(askKeyValueStoreUpsertManyBase.errorType.DuplicateKey).toBe(`${KeyValueStoreActionType.UpsertMany}-DuplicateKey`);
    expect(askKeyValueStoreUpsertManyBase.errorType.Conflict).toBe(`${KeyValueStoreActionType.UpsertMany}-Conflict`);
  });
});
