import { KvsLogicalOperatorType, KvsQueryOperation, KvsQueryOperationType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { isKvsQueryCondition } from './isKvsQueryCondition';

describe('isKvsQueryCondition', () => {
  it('accepts a leaf condition and rejects a logical operator', () => {
    const condition: KvsQueryOperation = { key: 'age', operation: KvsQueryOperationType.Equal, valueA: 1 };
    const logical: KvsQueryOperation = { operation: KvsLogicalOperatorType.And, conditions: [condition] };

    expect(isKvsQueryCondition(condition)).toBe(true);
    expect(isKvsQueryCondition(logical)).toBe(false);
  });
});
