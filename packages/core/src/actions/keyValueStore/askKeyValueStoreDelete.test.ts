import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askKeyValueStoreDelete } from './askKeyValueStoreDelete';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

describe('askKeyValueStoreDelete', () => {
  it('yields a Delete action with key, sort key and options', () => {
    const options = { scope: 'scope-a' };

    const { action } = captureRequester(askKeyValueStoreDelete('users', 'user-1', 'sort-1', options));

    expect(action).toEqual({
      type: KeyValueStoreActionType.Delete,
      payload: { keyValueStoreName: 'users', key: 'user-1', sortKey: 'sort-1', options },
    });
  });

  it('leaves sort key and options undefined when omitted', () => {
    const { action } = captureRequester(askKeyValueStoreDelete('users', 'user-1'));

    expect(action.payload).toEqual({ keyValueStoreName: 'users', key: 'user-1', sortKey: undefined, options: undefined });
  });

  it('propagates a runtime failure thrown into the requester', () => {
    const requester = askKeyValueStoreDelete('users', 'user-1');
    requester.next();

    expect(() => requester.throw(new Error('kvs unavailable'))).toThrow('kvs unavailable');
  });

  it('namespaces its error enum values under the action type', () => {
    expect(askKeyValueStoreDelete.errorType.StoreNotFound).toBe(`${KeyValueStoreActionType.Delete}-StoreNotFound`);
    expect(askKeyValueStoreDelete.errorType.InvalidScope).toBe(`${KeyValueStoreActionType.Delete}-InvalidScope`);
  });
});
