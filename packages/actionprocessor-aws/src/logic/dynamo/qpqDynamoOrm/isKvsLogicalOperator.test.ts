import { KvsLogicalOperatorType, KvsQueryOperation, KvsQueryOperationType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { isKvsLogicalOperator } from './isKvsLogicalOperator';

describe('isKvsLogicalOperator', () => {
  it('accepts a logical operator and rejects a leaf condition', () => {
    const condition: KvsQueryOperation = { key: 'age', operation: KvsQueryOperationType.Equal, valueA: 1 };
    const logical: KvsQueryOperation = { operation: KvsLogicalOperatorType.Or, conditions: [condition] };

    expect(isKvsLogicalOperator(logical)).toBe(true);
    expect(isKvsLogicalOperator(condition)).toBe(false);
  });
});
