import {
  KeyValueStoreQPQConfigSetting,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
} from 'quidproquo-core';

import { getNestedValue } from './applyKvsUpdates';

// 'pk' and 'sk' are literal key names the query DSL uses to mean "the store's
// configured partition/sort key attribute", not real attribute names - the
// same aliases buildKvsKeyNarrowing recognizes when it maps them to the
// sqlite key columns.
const getConditionValue = (item: any, key: string, storeConfig: KeyValueStoreQPQConfigSetting): any => {
  if (key === 'pk') {
    return item[storeConfig.partitionKey.key];
  }
  if (key === 'sk') {
    return storeConfig.sortKeys.length > 0 ? item[storeConfig.sortKeys[0].key] : undefined;
  }
  return getNestedValue(item, key.split('.'));
};

const evaluateCondition = (item: any, condition: KvsQueryCondition, storeConfig: KeyValueStoreQPQConfigSetting): boolean => {
  const value = getConditionValue(item, condition.key, storeConfig);

  switch (condition.operation) {
    case KvsQueryOperationType.Equal:
      return value === condition.valueA;

    case KvsQueryOperationType.NotEqual:
      return value !== condition.valueA;

    case KvsQueryOperationType.LessThan:
      return value !== undefined && value !== null && value < (condition.valueA as any);

    case KvsQueryOperationType.LessThanOrEqual:
      return value !== undefined && value !== null && value <= (condition.valueA as any);

    case KvsQueryOperationType.GreaterThan:
      return value !== undefined && value !== null && value > (condition.valueA as any);

    case KvsQueryOperationType.GreaterThanOrEqual:
      return value !== undefined && value !== null && value >= (condition.valueA as any);

    case KvsQueryOperationType.Between:
      return value !== undefined && value !== null && value >= (condition.valueA as any) && value <= (condition.valueB as any);

    case KvsQueryOperationType.BeginsWith:
      return typeof value === 'string' && value.startsWith(String(condition.valueA));

    case KvsQueryOperationType.Contains:
      return typeof value === 'string' && value.includes(String(condition.valueA));

    case KvsQueryOperationType.NotContains:
      return typeof value !== 'string' || !value.includes(String(condition.valueA));

    case KvsQueryOperationType.In:
      return (condition.valueA as any[]).includes(value);

    case KvsQueryOperationType.Exists:
      return value !== undefined && value !== null;

    case KvsQueryOperationType.NotExists:
      return value === undefined || value === null;

    default:
      throw new Error(`Unsupported query operation: ${condition.operation}`);
  }
};

// Throws eagerly on an unsupported operation type, independent of what data
// (if any) is in the store, so a bad query fails loudly even against an empty
// store.
export const validateKvsQueryOperation = (operation: KvsQueryOperation): void => {
  if ('conditions' in operation) {
    (operation as KvsLogicalOperator).conditions.forEach(validateKvsQueryOperation);
    return;
  }

  const condition = operation as KvsQueryCondition;
  if (!Object.values(KvsQueryOperationType).includes(condition.operation)) {
    throw new Error(`Unsupported query operation: ${condition.operation}`);
  }
};

// The query-semantics authority: every candidate row passes through here,
// whatever SQL narrowing ran first, so there is exactly one implementation of
// the operators to keep correct (see buildKvsKeyNarrowing).
export const evaluateKvsQueryOperation = (item: any, operation: KvsQueryOperation, storeConfig: KeyValueStoreQPQConfigSetting): boolean => {
  if ('conditions' in operation) {
    const logicalOp = operation as KvsLogicalOperator;
    const results = logicalOp.conditions.map((condition) => evaluateKvsQueryOperation(item, condition, storeConfig));
    return logicalOp.operation === KvsLogicalOperatorType.And ? results.every(Boolean) : results.some(Boolean);
  }

  return evaluateCondition(item, operation as KvsQueryCondition, storeConfig);
};
