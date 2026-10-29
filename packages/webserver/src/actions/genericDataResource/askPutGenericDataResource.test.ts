import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askPutGenericDataResource } from './askPutGenericDataResource';
import { GenericDataResourceActionTypeEnum } from './GenericDataResourceActionTypeEnum';

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
