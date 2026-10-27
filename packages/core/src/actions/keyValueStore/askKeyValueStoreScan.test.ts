import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askKeyValueStoreScan, askKeyValueStoreScanBase } from './askKeyValueStoreScan';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

describe('askKeyValueStoreScan', () => {
  it('yields a Scan action with filter condition and next page key', () => {
    const filterCondition = { field: 'status', operation: 'equals', value: 'active' } as any;

    const { action } = captureRequester(askKeyValueStoreScan('users', filterCondition, 'page-2'));

    expect(action).toEqual({
      type: KeyValueStoreActionType.Scan,
      payload: { keyValueStoreName: 'users', filterCondition, nextPageKey: 'page-2' },
    });
  });

  it('leaves filter condition and next page key undefined when omitted', () => {
    const { action } = captureRequester(askKeyValueStoreScan('users'));

    expect(action.payload).toEqual({ keyValueStoreName: 'users', filterCondition: undefined, nextPageKey: undefined });
  });

  it('returns the page the runtime resolves', () => {
    const page = { items: [{ id: 'a' }], nextPageKey: 'page-3' };

    const { returned } = captureRequester(askKeyValueStoreScan('users'), page);

    expect(returned).toEqual(page);
  });

  it('propagates a runtime failure thrown into the requester', () => {
    const requester = askKeyValueStoreScan('users');
    requester.next();

    expect(() => requester.throw(new Error('kvs unavailable'))).toThrow('kvs unavailable');
  });

  it('namespaces its error enum values under the action type', () => {
    expect(askKeyValueStoreScanBase.errorType.StoreNotFound).toBe(`${KeyValueStoreActionType.Scan}-StoreNotFound`);
    expect(askKeyValueStoreScanBase.errorType.InvalidScope).toBe(`${KeyValueStoreActionType.Scan}-InvalidScope`);
  });
});
