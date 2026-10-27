import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askKeyValueStoreUpdate, askKeyValueStoreUpdateBase } from './askKeyValueStoreUpdate';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

describe('askKeyValueStoreUpdate', () => {
  it('yields an Update action with updates, key, sort key and options', () => {
    const updates = { set: { name: 'new' } } as any;
    const options = { scope: 'scope-a' };

    const { action } = captureRequester(askKeyValueStoreUpdate('users', updates, 'user-1', 'sort-1', options));

    expect(action).toEqual({
      type: KeyValueStoreActionType.Update,
      payload: { keyValueStoreName: 'users', key: 'user-1', sortKey: 'sort-1', updates, options },
    });
  });

  it('leaves sort key and options undefined when omitted', () => {
    const updates = { set: { name: 'new' } } as any;

    const { action } = captureRequester(askKeyValueStoreUpdate('users', updates, 'user-1'));

    expect(action.payload).toEqual({ keyValueStoreName: 'users', key: 'user-1', sortKey: undefined, updates, options: undefined });
  });

  it('returns the updated record the runtime resolves', () => {
    const updates = { set: { name: 'new' } } as any;

    const { returned } = captureRequester(askKeyValueStoreUpdate('users', updates, 'user-1'), { id: 'user-1', name: 'new' });

    expect(returned).toEqual({ id: 'user-1', name: 'new' });
  });

  it('propagates a runtime failure thrown into the requester', () => {
    const updates = { set: { name: 'new' } } as any;

    const requester = askKeyValueStoreUpdate('users', updates, 'user-1');
    requester.next();

    expect(() => requester.throw(new Error('kvs unavailable'))).toThrow('kvs unavailable');
  });

  it('carries a write condition through in the options', () => {
    const updates = { set: { name: 'new' } } as any;
    const condition = { key: 'headEventId', operation: 'LessThan', valueA: 7 } as any;

    const { action } = captureRequester(askKeyValueStoreUpdate('users', updates, 'user-1', undefined, { condition }));

    expect(action.payload.options).toEqual({ condition });
  });

  it('namespaces its error enum values under the action type', () => {
    expect(askKeyValueStoreUpdateBase.errorType.StoreNotFound).toBe(`${KeyValueStoreActionType.Update}-StoreNotFound`);
    expect(askKeyValueStoreUpdateBase.errorType.InvalidScope).toBe(`${KeyValueStoreActionType.Update}-InvalidScope`);
    expect(askKeyValueStoreUpdateBase.errorType.ConditionFailed).toBe(`${KeyValueStoreActionType.Update}-ConditionFailed`);
  });
});
