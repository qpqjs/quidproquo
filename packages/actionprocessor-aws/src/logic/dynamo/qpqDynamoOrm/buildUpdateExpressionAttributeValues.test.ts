import { KvsUpdate, KvsUpdateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { buildUpdateExpressionAttributeValues } from './buildUpdateExpressionAttributeValues';
import { getValueName } from './getValueName';

describe('buildUpdateExpressionAttributeValues', () => {
  it('collects value and defaultValue placeholders', () => {
    const updates: KvsUpdate = [{ attributePath: 'count', action: KvsUpdateActionType.Increment, value: 1, defaultValue: 0 }];

    expect(buildUpdateExpressionAttributeValues(updates)).toEqual({
      [getValueName(1)]: { N: '1' },
      [getValueName(0)]: { N: '0' },
    });
  });

  it('returns undefined when no updates carry a value', () => {
    expect(buildUpdateExpressionAttributeValues([{ attributePath: 'old', action: KvsUpdateActionType.Remove }])).toBeUndefined();
  });
});
