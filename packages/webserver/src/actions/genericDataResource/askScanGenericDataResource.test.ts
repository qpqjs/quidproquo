import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askScanGenericDataResource } from './askScanGenericDataResource';
import { GenericDataResourceActionTypeEnum } from './GenericDataResourceActionTypeEnum';

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
