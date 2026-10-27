import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askKeyValueStoreGetAll, askKeyValueStoreGetAllBase } from './askKeyValueStoreGetAll';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

describe('askKeyValueStoreGetAll', () => {
  it('yields a GetAll action with options', () => {
    const options = { scope: 'scope-a' };

    const { action } = captureRequester(askKeyValueStoreGetAll('users', options));

    expect(action).toEqual({
      type: KeyValueStoreActionType.GetAll,
      payload: { keyValueStoreName: 'users', options },
    });
  });

  it('leaves options undefined when omitted', () => {
    const { action } = captureRequester(askKeyValueStoreGetAll('users'));

    expect(action.payload).toEqual({ keyValueStoreName: 'users', options: undefined });
  });

  it('returns the records the runtime resolves', () => {
    const records = [{ id: 'a' }, { id: 'b' }];

    const { returned } = captureRequester(askKeyValueStoreGetAll('users'), records);

    expect(returned).toEqual(records);
  });

  it('propagates a runtime failure thrown into the requester', () => {
    const requester = askKeyValueStoreGetAll('users');
    requester.next();

    expect(() => requester.throw(new Error('kvs unavailable'))).toThrow('kvs unavailable');
  });

  it('namespaces its error enum values under the action type', () => {
    expect(askKeyValueStoreGetAllBase.errorType.StoreNotFound).toBe(`${KeyValueStoreActionType.GetAll}-StoreNotFound`);
    expect(askKeyValueStoreGetAllBase.errorType.InvalidScope).toBe(`${KeyValueStoreActionType.GetAll}-InvalidScope`);
  });
});
