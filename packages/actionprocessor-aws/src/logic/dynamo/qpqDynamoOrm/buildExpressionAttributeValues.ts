import { flattenKvsQueryConditions, KvsAdvancedDataType, KvsQueryCondition, KvsQueryOperation, KvsQueryOperationType } from 'quidproquo-core';

import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { buildAttributeValue } from './buildAttributeValue';
import { getValueName } from './getValueName';

// IN renders one placeholder per element, every other operation references
// its value(s) whole; the collected values must mirror that exactly or
// DynamoDB rejects the expression.
const getConditionValues = (condition: KvsQueryCondition): (KvsAdvancedDataType | undefined)[] => {
  if (condition.operation === KvsQueryOperationType.In && Array.isArray(condition.valueA)) {
    return condition.valueA;
  }

  return [condition.valueA, condition.valueB];
};

/**
 * Collect the :placeholder -> AttributeValue map for every value referenced by
 * the given query expressions. Returns undefined (not null) when empty so it
 * can feed the optional ExpressionAttributeValues SDK field directly.
 */
export const buildExpressionAttributeValues = (queries: (KvsQueryOperation | undefined)[]): Record<string, AttributeValue> | undefined => {
  const values: Record<string, AttributeValue> = {};

  for (const query of queries) {
    if (!query) {
      continue;
    }

    for (const condition of flattenKvsQueryConditions(query)) {
      for (const value of getConditionValues(condition)) {
        if (value !== undefined) {
          values[getValueName(value)] = buildAttributeValue(value);
        }
      }
    }
  }

  return Object.keys(values).length > 0 ? values : undefined;
};
