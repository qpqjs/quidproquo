import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askPutGenericDataResource } from './askPutGenericDataResource';
import { askScanGenericDataResource } from './askScanGenericDataResource';
import GenericDataResourceActionTypeEnum from './GenericDataResourceActionTypeEnum';

describe('askPutGenericDataResource', () => {
  it('yields a Put action with the table name and item', () => {
    const item = { id: '1' };
    const { action } = captureRequester(askPutGenericDataResource('widgets', item));

    expect(action).toEqual({
      type: GenericDataResourceActionTypeEnum.Put,
      payload: { tableName: 'widgets', item },
    });
  });
});

describe('askScanGenericDataResource', () => {
  it('yields a Scan action with the table name and max items', () => {
    const { action } = captureRequester(askScanGenericDataResource('widgets', 10));

    expect(action).toEqual({
      type: GenericDataResourceActionTypeEnum.Scan,
      payload: { tableName: 'widgets', maxItems: 10 },
    });
  });

  it('returns the scanned items the runtime resolves', () => {
    const items = [{ id: '1' }];
    const { returned } = captureRequester(askScanGenericDataResource('widgets', 10), items);

    expect(returned).toBe(items);
  });
});
