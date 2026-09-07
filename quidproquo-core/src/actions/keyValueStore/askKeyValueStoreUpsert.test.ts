import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askKeyValueStoreUpsert, askKeyValueStoreUpsertBase } from './askKeyValueStoreUpsert';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

describe('askKeyValueStoreUpsert', () => {
  it('yields an Upsert action with the item and options', () => {
    const item = { id: 'user-1', name: 'Ada' };
    const options = { ttlInSeconds: 3600 };

    const { action } = captureRequester(askKeyValueStoreUpsert('users', item, options));

    expect(action).toEqual({
      type: KeyValueStoreActionType.Upsert,
      payload: { keyValueStoreName: 'users', item, options },
    });
  });

  it('leaves options undefined when omitted', () => {
    const item = { id: 'user-1', name: 'Ada' };

    const { action } = captureRequester(askKeyValueStoreUpsert('users', item));

    expect(action.payload).toEqual({ keyValueStoreName: 'users', item, options: undefined });
  });

  it('returns the upserted item the runtime resolves', () => {
    const item = { id: 'user-1', name: 'Ada' };

    const { returned } = captureRequester(askKeyValueStoreUpsert('users', item), item);

    expect(returned).toEqual(item);
  });

  it('propagates a runtime failure thrown into the requester', () => {
    const requester = askKeyValueStoreUpsert('users', { id: 'user-1' });
    requester.next();

    expect(() => requester.throw(new Error('kvs unavailable'))).toThrow('kvs unavailable');
  });

  it('namespaces its error enum values under the action type', () => {
    expect(askKeyValueStoreUpsertBase.errorType.StoreNotFound).toBe(`${KeyValueStoreActionType.Upsert}-StoreNotFound`);
    expect(askKeyValueStoreUpsertBase.errorType.InvalidScope).toBe(`${KeyValueStoreActionType.Upsert}-InvalidScope`);
    expect(askKeyValueStoreUpsertBase.errorType.Conflict).toBe(`${KeyValueStoreActionType.Upsert}-Conflict`);
    expect(askKeyValueStoreUpsertBase.errorType.WriteContention).toBe(`${KeyValueStoreActionType.Upsert}-WriteContention`);
  });
});
