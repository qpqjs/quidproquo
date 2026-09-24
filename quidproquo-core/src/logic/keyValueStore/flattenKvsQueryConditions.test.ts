import { describe, expect, it } from 'vitest';

import { KvsLogicalOperatorType, KvsQueryCondition, KvsQueryOperationType } from '../../actions/keyValueStore/types';
import { flattenKvsQueryConditions } from './flattenKvsQueryConditions';

const ageCondition: KvsQueryCondition = { key: 'age', operation: KvsQueryOperationType.Equal, valueA: 1 };
const nameCondition: KvsQueryCondition = { key: 'name', operation: KvsQueryOperationType.Equal, valueA: 'x' };

describe('flattenKvsQueryConditions', () => {
  it('returns a leaf condition as a single-element list', () => {
    expect(flattenKvsQueryConditions(ageCondition)).toEqual([ageCondition]);
  });

  it('flattens nested logical operators in traversal order', () => {
    const query = {
      operation: KvsLogicalOperatorType.And,
      conditions: [ageCondition, { operation: KvsLogicalOperatorType.Or, conditions: [nameCondition] }],
    };

    expect(flattenKvsQueryConditions(query)).toEqual([ageCondition, nameCondition]);
  });
});
