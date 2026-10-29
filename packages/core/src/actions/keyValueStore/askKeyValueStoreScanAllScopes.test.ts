import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askKeyValueStoreScanAllScopes, askKeyValueStoreScanAllScopesBase } from './askKeyValueStoreScanAllScopes';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

describe('askKeyValueStoreScanAllScopes', () => {
  it('yields a ScanAllScopes action carrying the store, filter, page key and options', () => {
    const filterCondition = { key: 'status', operation: 'Equal', valueA: 'open' } as any;
    const { action } = captureRequester(askKeyValueStoreScanAllScopes('orders', filterCondition, 'page-2', { limit: 10 }));

    expect(action).toEqual({
      type: KeyValueStoreActionType.ScanAllScopes,
      payload: { keyValueStoreName: 'orders', filterCondition, nextPageKey: 'page-2', options: { limit: 10 } },
    });
  });

  it("returns the page the runtime resolves, typed to the caller's item", () => {
    const page = { items: [{ scope: 'tenant-a', item: { id: '1' } }], nextPageKey: undefined };
    const { returned } = captureRequester(askKeyValueStoreScanAllScopes<{ id: string }>('orders'), page);

    expect(returned).toEqual(page);
  });

  it("carries the base requester's error catalog", () => {
    expect(askKeyValueStoreScanAllScopes.errorType).toBe(askKeyValueStoreScanAllScopesBase.errorType);
  });
});
