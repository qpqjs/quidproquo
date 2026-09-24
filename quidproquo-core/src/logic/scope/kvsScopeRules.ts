import {
  KvsAdvancedDataType,
  KvsCoreDataType,
  KvsLogicalOperator,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
} from '../../actions/keyValueStore/types';
import { KeyValueStoreQPQConfigSetting } from '../../config';
import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';

// The kvs scope rules every backend enforces, whatever it does with the scope
// underneath. Some exist only because a backend composes the scope into the
// stored pk (dynamo); they live here so a call that would fail deployed fails
// locally too, and a backend that stores scope differently (sqlite's scope
// column) never has to know how dynamo does it.

/**
 * Reserved for backend bookkeeping inside stored pk values; caller pk values
 * can't contain it, so a backend marker built from it can't be forged by a raw
 * value.
 */
export const KVS_RESERVED_MARKER = '@@QPQSCOPE@@';

// Operations a scoped partition key condition may use: equality and ordering
// still hold within one scope when every stored pk in it shares the scope as a
// prefix. NotEqual, Contains, Exists and friends would not.
const SCOPABLE_PK_OPERATIONS = [
  KvsQueryOperationType.Equal,
  KvsQueryOperationType.BeginsWith,
  KvsQueryOperationType.LessThan,
  KvsQueryOperationType.LessThanOrEqual,
  KvsQueryOperationType.GreaterThan,
  KvsQueryOperationType.GreaterThanOrEqual,
  KvsQueryOperationType.Between,
  KvsQueryOperationType.In,
];

/**
 * Reject a raw pk value carrying the reserved marker: it would read back
 * ambiguously and could collide with (or forge) another scope's stored value.
 * Non-string values pass.
 */
export function validateRawPkValueForScopeOrThrow(rawValue: KvsCoreDataType): void {
  if (typeof rawValue === 'string' && rawValue.includes(KVS_RESERVED_MARKER)) {
    throw new InvalidScopeError(
      InvalidScopeErrorCode.reservedDelimiter,
      `Partition key values must not contain the reserved marker '${KVS_RESERVED_MARKER}'.`,
    );
  }
}

/** A scoped store needs a string partition key; reject before any read or write rather than silently matching nothing. */
export function validateScopeSupportedForPartitionKeyType(partitionKeyType: string): void {
  if (partitionKeyType !== 'string') {
    throw new InvalidScopeError(
      InvalidScopeErrorCode.unsafeCharacters,
      `Scope is only supported on stores with a string partition key (got '${partitionKeyType}').`,
    );
  }
}

/**
 * A pk value on a call against this store. Under a scope it must be a string;
 * on any string-pk store it can't carry the reserved marker (unscoped too, where
 * a marked value could read another scope's rows on a composing backend).
 */
export const validateKvsPkValueForScopeOrThrow = (
  storeConfig: KeyValueStoreQPQConfigSetting,
  scope: string | undefined,
  value: KvsCoreDataType,
): void => {
  if (scope !== undefined && typeof value !== 'string') {
    throw new InvalidScopeError(InvalidScopeErrorCode.unsafeCharacters, 'Scope is only supported on string partition key values.');
  }

  if (scope !== undefined || storeConfig.partitionKey.type === 'string') {
    validateRawPkValueForScopeOrThrow(value);
  }
};

// Every pk condition in a tree, in traversal order.
const collectPkConditions = (operation: KvsQueryOperation, pkAttributeName: string): KvsQueryCondition[] => {
  if ('conditions' in operation) {
    return (operation as KvsLogicalOperator).conditions.flatMap((child) => collectPkConditions(child, pkAttributeName));
  }

  const condition = operation as KvsQueryCondition;
  return condition.key === pkAttributeName ? [condition] : [];
};

// A condition's comparison values, each entry of an In list separately.
const getConditionValues = (condition: KvsQueryCondition): KvsAdvancedDataType[] =>
  [condition.valueA, condition.valueB].flatMap((value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]));

const validateScopedPkConditionsOrThrow = (
  storeConfig: KeyValueStoreQPQConfigSetting,
  scope: string,
  operation: KvsQueryOperation,
): KvsQueryCondition[] => {
  const pkConditions = collectPkConditions(operation, storeConfig.partitionKey.key);

  for (const condition of pkConditions) {
    if (!SCOPABLE_PK_OPERATIONS.includes(condition.operation)) {
      throw new InvalidScopeError(
        InvalidScopeErrorCode.unsafeCharacters,
        `Operation '${condition.operation}' on the partition key cannot be scoped.`,
      );
    }

    for (const value of getConditionValues(condition)) {
      validateKvsPkValueForScopeOrThrow(storeConfig, scope, value as KvsCoreDataType);
    }
  }

  return pkConditions;
};

/**
 * The reserved marker is rejected in UNSCOPED partition-key comparisons too: a
 * raw value like `acme${KVS_RESERVED_MARKER}secret` in a pk condition would match
 * (or probe for) scope acme's composed rows on a composing backend.
 */
export function validateUnscopedPkConditionValuesOrThrow(operation: KvsQueryOperation, pkKeyNames: string[]): void {
  const pkConditions = pkKeyNames.flatMap((pkKeyName) => collectPkConditions(operation, pkKeyName));

  for (const condition of pkConditions) {
    getConditionValues(condition).forEach((value) => validateRawPkValueForScopeOrThrow(value as KvsCoreDataType));
  }
}

/**
 * Key condition rules. A scoped one must constrain the pk (it would otherwise
 * span every scope), with scopable operations and valid scoped values. An
 * unscoped one on a string pk can't carry the reserved marker in a pk comparison.
 */
export const validateKvsKeyConditionForScopeOrThrow = (
  storeConfig: KeyValueStoreQPQConfigSetting,
  scope: string | undefined,
  operation: KvsQueryOperation,
): void => {
  if (scope === undefined) {
    if (storeConfig.partitionKey.type === 'string') {
      validateUnscopedPkConditionValuesOrThrow(operation, [storeConfig.partitionKey.key]);
    }
    return;
  }

  if (validateScopedPkConditionsOrThrow(storeConfig, scope, operation).length === 0) {
    throw new InvalidScopeError(
      InvalidScopeErrorCode.queryMissingPartitionKey,
      'A scoped query must constrain the partition key in its key condition.',
    );
  }
};

/** Filter rules: under a scope, any pk leg must use a scopable operation and valid values. Unscoped filters are unchecked. */
export const validateKvsFilterForScopeOrThrow = (
  storeConfig: KeyValueStoreQPQConfigSetting,
  scope: string | undefined,
  operation?: KvsQueryOperation,
): void => {
  if (scope !== undefined && operation) {
    validateScopedPkConditionsOrThrow(storeConfig, scope, operation);
  }
};
