import { KvsAdvancedDataType, KvsCoreDataType, KvsLogicalOperator, KvsQueryCondition, KvsQueryOperation } from 'quidproquo-core';

import { composeScopedKvsIndexValue, getScopedKvsIndexAttributeName } from './scopedKvsIndexAttribute';
import { composeScopedKvsValue, stripScopedKvsValue } from './scopedKvsValue';

const composeScopedConditionValue = (scope: string, value: KvsAdvancedDataType | undefined): KvsAdvancedDataType | undefined => {
  if (value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => composeScopedKvsValue(scope, entry as KvsCoreDataType));
  }

  return composeScopedKvsValue(scope, value as KvsCoreDataType);
};

/**
 * Rewrite every partition-key condition in a query tree so its comparison values carry the scope
 * prefix, matching how scoped items are stored. Callers validate the tree first with core's
 * validateKvsKeyConditionForScopeOrThrow / validateKvsFilterForScopeOrThrow; the translator does.
 */
export function composeScopedKvsQueryOperation(scope: string, operation: KvsQueryOperation, pkAttributeName: string): KvsQueryOperation {
  if ('conditions' in operation) {
    const logicalOperator = operation as KvsLogicalOperator;

    return {
      ...logicalOperator,
      conditions: logicalOperator.conditions.map((child) => composeScopedKvsQueryOperation(scope, child, pkAttributeName)),
    };
  }

  const condition = operation as KvsQueryCondition;
  if (condition.key !== pkAttributeName) {
    return condition;
  }

  return {
    ...condition,
    valueA: composeScopedConditionValue(scope, condition.valueA),
    valueB: composeScopedConditionValue(scope, condition.valueB) as KvsQueryCondition['valueB'],
  };
}

/**
 * Point a scoped GSI's partition key conditions at its hidden attribute, with the scope-composed value, so
 * the query reads only this scope's partition. Callers validate the tree first (core's
 * validateKvsKeyConditionForScopeOrThrow allows only `=` on it); the translator does.
 */
export function composeScopedKvsIndexKeyCondition(scope: string, operation: KvsQueryOperation, indexAttributeName: string): KvsQueryOperation {
  if ('conditions' in operation) {
    const logicalOperator = operation as KvsLogicalOperator;

    return {
      ...logicalOperator,
      conditions: logicalOperator.conditions.map((child) => composeScopedKvsIndexKeyCondition(scope, child, indexAttributeName)),
    };
  }

  const condition = operation as KvsQueryCondition;
  if (condition.key !== indexAttributeName) {
    return condition;
  }

  return {
    ...condition,
    key: getScopedKvsIndexAttributeName(indexAttributeName),
    valueA: composeScopedKvsIndexValue(scope, condition.valueA as KvsCoreDataType),
  };
}

// Shallow-clone an item read from storage, stripping the scope prefix off its
// partition key attribute so callers never see the composed form.
export function stripScopedKvsItem<T extends Record<string, any>>(scope: string, item: T, pkAttributeName: string): T {
  const storedValue = item[pkAttributeName];
  const strippedValue = stripScopedKvsValue(scope, storedValue);

  return strippedValue === storedValue ? item : { ...item, [pkAttributeName]: strippedValue };
}
