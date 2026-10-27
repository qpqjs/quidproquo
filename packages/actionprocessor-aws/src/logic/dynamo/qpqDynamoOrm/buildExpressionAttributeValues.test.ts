import { KvsQueryCondition, KvsQueryOperationType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { buildExpressionAttributeValues } from './buildExpressionAttributeValues';
import { getValueName } from './getValueName';

const condition = (overrides: Partial<KvsQueryCondition>): KvsQueryCondition => ({
  key: 'age',
  operation: KvsQueryOperationType.Equal,
  ...overrides,
});

describe('buildExpressionAttributeValues', () => {
  it('collects valueA and valueB placeholders, skipping undefined queries', () => {
    const query = condition({ operation: KvsQueryOperationType.Between, valueA: 1, valueB: 9 });

    expect(buildExpressionAttributeValues([query, undefined])).toEqual({
      [getValueName(1)]: { N: '1' },
      [getValueName(9)]: { N: '9' },
    });
  });

  it('returns undefined when there are no values', () => {
    expect(buildExpressionAttributeValues([condition({ operation: KvsQueryOperationType.Exists, valueA: undefined })])).toBeUndefined();
  });

  it('defines a placeholder for every IN value the expression references', () => {
    const query = condition({ operation: KvsQueryOperationType.In, valueA: ['a', 'b'] });

    expect(buildExpressionAttributeValues([query])).toEqual({
      [getValueName('a')]: { S: 'a' },
      [getValueName('b')]: { S: 'b' },
    });
  });
});
