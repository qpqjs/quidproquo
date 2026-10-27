import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askKeyValueStoreGet, askKeyValueStoreGetBase } from './askKeyValueStoreGet';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

describe('askKeyValueStoreGet', () => {
  it('yields a Get action for the key', () => {
    const options = { scope: 'scope-a' };

    const { action } = captureRequester(askKeyValueStoreGet('users', 'user-1', options));

    expect(action).toEqual({
      type: KeyValueStoreActionType.Get,
      payload: { keyValueStoreName: 'users', key: 'user-1', options },
    });
  });

  it('leaves options undefined when omitted', () => {
    const { action } = captureRequester(askKeyValueStoreGet('users', 'user-1'));

    expect(action.payload).toEqual({ keyValueStoreName: 'users', key: 'user-1', options: undefined });
  });

  it('returns the record the runtime resolves', () => {
    const { returned } = captureRequester(askKeyValueStoreGet('users', 'user-1'), { id: 'user-1' });

    expect(returned).toEqual({ id: 'user-1' });
  });

  it('propagates a runtime failure thrown into the requester', () => {
    const requester = askKeyValueStoreGet('users', 'user-1');
    requester.next();

    expect(() => requester.throw(new Error('kvs unavailable'))).toThrow('kvs unavailable');
  });

  it('namespaces its error enum values under the action type', () => {
    expect(askKeyValueStoreGetBase.errorType.StoreNotFound).toBe(`${KeyValueStoreActionType.Get}-StoreNotFound`);
    expect(askKeyValueStoreGetBase.errorType.InvalidScope).toBe(`${KeyValueStoreActionType.Get}-InvalidScope`);
  });
});
