import { KvsLogicalOperatorType, KvsQueryOperation, KvsQueryOperationType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { buildExpressionAttributeNames } from './buildExpressionAttributeNames';
import { getItemName } from './getItemName';

describe('buildExpressionAttributeNames', () => {
  it('maps each item placeholder back to its key, recursing into logical operators', () => {
    const query: KvsQueryOperation = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'age', operation: KvsQueryOperationType.Equal, valueA: 1 },
        { key: 'name', operation: KvsQueryOperationType.Equal, valueA: 'x' },
      ],
    };

    expect(buildExpressionAttributeNames([query])).toEqual({
      [getItemName('age')]: 'age',
      [getItemName('name')]: 'name',
    });
  });

  it('returns undefined when there are no names', () => {
    expect(buildExpressionAttributeNames([undefined])).toBeUndefined();
  });
});
