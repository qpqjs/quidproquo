import {
  KvsAdvancedDataType,
  KvsCoreDataType,
  KvsLogicalOperator,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  KvsUpdate,
  KvsUpdateAction,
  KvsUpdateActionType,
} from '../../actions/keyValueStore/types';
import { KeyValueStoreQPQConfigSetting, KvsKey } from '../../config';
import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';

// The kvs scope rules every backend enforces, whatever it does with the scope
// underneath. Some exist only because a backend composes the scope into the
// stored pk (dynamo); they live here so a call that would fail deployed fails
// locally too, and a backend that stores scope differently (sqlite's scope
// column) never has to know how dynamo does it.

/**
 * Reserved for backend bookkeeping. Caller pk values (any store) and attribute
 * names (scoped stores) can't contain it, so a backend marker or attribute built
 * from it can't be forged by caller data.
 */
export const KVS_RESERVED_MARKER = '@@QPQ';

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

// Updates whose resulting value is known up front, so a backend can mirror it.
const MIRRORABLE_UPDATE_ACTIONS = [KvsUpdateActionType.Set, KvsUpdateActionType.SetIfNotExists, KvsUpdateActionType.Remove];

/**
 * On a scoped store, the GSI partition keys other than the table pk (whose
 * stored value already carries the scope), one per attribute. A composing
 * backend partitions these per scope, which is what the item, key condition and
 * update rules below restrict. Empty on an unscoped store.
 */
export const getScopedKvsIndexPartitionKeys = (storeConfig: KeyValueStoreQPQConfigSetting): KvsKey[] => {
  if (!storeConfig.scoped) {
    return [];
  }

  const partitionKeys = storeConfig.indexes.map((index) => index.partitionKey).filter((key) => key.key !== storeConfig.partitionKey.key);

  return partitionKeys.filter((key, position) => partitionKeys.findIndex((other) => other.key === key.key) === position);
};

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

const validateAttributeNamesForScopeOrThrow = (attributeNames: string[]): void => {
  const reservedName = attributeNames.find((attributeName) => attributeName.includes(KVS_RESERVED_MARKER));

  if (reservedName !== undefined) {
    throw new InvalidScopeError(
      InvalidScopeErrorCode.reservedAttribute,
      `Attribute '${reservedName}' contains the reserved marker '${KVS_RESERVED_MARKER}'.`,
    );
  }
};

const describeValueType = (value: unknown): string => {
  if (value === null) {
    return 'null';
  }

  return Array.isArray(value) ? 'array' : typeof value;
};

// The check dynamo makes on a real key attribute, which a composing backend's
// scope-partitioned copy would otherwise skip.
const validateIndexKeyValueOrThrow = (indexKey: KvsKey, value: unknown): void => {
  const matchesDeclaredType = typeof value === indexKey.type && (typeof value !== 'number' || Number.isFinite(value));

  if (!matchesDeclaredType) {
    throw new InvalidScopeError(
      InvalidScopeErrorCode.indexKeyType,
      `Index key '${indexKey.key}' must be a ${indexKey.type} (got ${describeValueType(value)}).`,
    );
  }
};

/**
 * An item written to this store. Its pk passes validateKvsPkValueForScopeOrThrow;
 * under a scope no attribute name carries the reserved marker, and every scoped
 * GSI partition key it sets matches the key's declared type.
 */
export const validateKvsItemForScopeOrThrow = (
  storeConfig: KeyValueStoreQPQConfigSetting,
  scope: string | undefined,
  item: Record<string, any>,
): void => {
  validateKvsPkValueForScopeOrThrow(storeConfig, scope, item[storeConfig.partitionKey.key]);

  if (scope === undefined) {
    return;
  }

  validateAttributeNamesForScopeOrThrow(Object.keys(item));

  // Absent and null both leave the row out of that index, like a real GSI.
  for (const indexKey of getScopedKvsIndexPartitionKeys(storeConfig)) {
    const value = item[indexKey.key];
    if (value !== undefined && value !== null) {
      validateIndexKeyValueOrThrow(indexKey, value);
    }
  }
};

// Every leaf condition in a tree, in traversal order.
const collectConditions = (operation: KvsQueryOperation): KvsQueryCondition[] => {
  if ('conditions' in operation) {
    return (operation as KvsLogicalOperator).conditions.flatMap(collectConditions);
  }

  return [operation as KvsQueryCondition];
};

// A condition's comparison values, each entry of an In list separately.
const getConditionValues = (condition: KvsQueryCondition): KvsAdvancedDataType[] =>
  [condition.valueA, condition.valueB].flatMap((value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]));

const validateScopedPkConditionsOrThrow = (
  storeConfig: KeyValueStoreQPQConfigSetting,
  scope: string,
  operation: KvsQueryOperation,
): KvsQueryCondition[] => {
  const pkConditions = collectConditions(operation).filter((condition) => condition.key === storeConfig.partitionKey.key);

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

type IndexKeyCondition = {
  condition: KvsQueryCondition;
  indexKey: KvsKey;
};

const findScopedIndexKeyConditions = (storeConfig: KeyValueStoreQPQConfigSetting, operation: KvsQueryOperation): IndexKeyCondition[] => {
  const indexKeys = getScopedKvsIndexPartitionKeys(storeConfig);

  return collectConditions(operation).flatMap((condition) =>
    indexKeys.filter((indexKey) => indexKey.key === condition.key).map((indexKey) => ({ condition, indexKey })),
  );
};

// A scoped query that doesn't constrain the pk runs against a GSI, which must
// be one partitioned per scope and constrained with `=` (all a partition key
// takes anyway).
const validateScopedIndexKeyConditionsOrThrow = (storeConfig: KeyValueStoreQPQConfigSetting, operation: KvsQueryOperation): void => {
  const indexKeyConditions = findScopedIndexKeyConditions(storeConfig, operation);

  if (indexKeyConditions.length === 0) {
    throw new InvalidScopeError(
      InvalidScopeErrorCode.queryMissingPartitionKey,
      'A scoped query must constrain the partition key, or an index partition key, in its key condition.',
    );
  }

  for (const { condition, indexKey } of indexKeyConditions) {
    if (condition.operation !== KvsQueryOperationType.Equal) {
      throw new InvalidScopeError(
        InvalidScopeErrorCode.unsupportedOperation,
        `Index partition key '${condition.key}' only supports '${KvsQueryOperationType.Equal}' (got '${condition.operation}').`,
      );
    }

    validateIndexKeyValueOrThrow(indexKey, condition.valueA);
  }
};

/**
 * The reserved marker is rejected in UNSCOPED partition-key comparisons too: a
 * raw value like `acme${KVS_RESERVED_MARKER}SCOPE@@secret` in a pk condition
 * would match (or probe for) scope acme's composed rows on a composing backend.
 */
export function validateUnscopedPkConditionValuesOrThrow(operation: KvsQueryOperation, pkKeyNames: string[]): void {
  const pkConditions = collectConditions(operation).filter((condition) => pkKeyNames.includes(condition.key));

  for (const condition of pkConditions) {
    getConditionValues(condition).forEach((value) => validateRawPkValueForScopeOrThrow(value as KvsCoreDataType));
  }
}

/**
 * Key condition rules. A scoped one must constrain the pk (it would otherwise
 * span every scope) with scopable operations and valid scoped values, or else a
 * scoped GSI partition key with `=`, and can't name a reserved-marker attribute.
 * An unscoped one on a string pk can't carry the reserved marker in a pk
 * comparison.
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

  validateAttributeNamesForScopeOrThrow(collectConditions(operation).map((condition) => condition.key));

  if (validateScopedPkConditionsOrThrow(storeConfig, scope, operation).length === 0) {
    validateScopedIndexKeyConditionsOrThrow(storeConfig, operation);
  }
};

/**
 * Filter rules: under a scope, no reserved-marker attribute, and any pk leg must
 * use a scopable operation and valid values. Unscoped filters are unchecked.
 */
export const validateKvsFilterForScopeOrThrow = (
  storeConfig: KeyValueStoreQPQConfigSetting,
  scope: string | undefined,
  operation?: KvsQueryOperation,
): void => {
  if (scope === undefined || !operation) {
    return;
  }

  validateAttributeNamesForScopeOrThrow(collectConditions(operation).map((condition) => condition.key));
  validateScopedPkConditionsOrThrow(storeConfig, scope, operation);
};

const getRootAttributeName = (update: KvsUpdateAction): string | number | undefined =>
  typeof update.attributePath === 'string' ? update.attributePath : update.attributePath[0];

const validateIndexKeyUpdateOrThrow = (indexKey: KvsKey, update: KvsUpdateAction): void => {
  if (Array.isArray(update.attributePath) && update.attributePath.length > 1) {
    throw new InvalidScopeError(InvalidScopeErrorCode.unsupportedOperation, `Index key '${indexKey.key}' can only be updated as a whole.`);
  }

  if (!MIRRORABLE_UPDATE_ACTIONS.includes(update.action)) {
    throw new InvalidScopeError(
      InvalidScopeErrorCode.unsupportedOperation,
      `'${update.action}' on index key '${indexKey.key}' isn't supported on a scoped store; use Set.`,
    );
  }

  if (update.action !== KvsUpdateActionType.Remove) {
    validateIndexKeyValueOrThrow(indexKey, update.value);
  }
};

/**
 * Update rules. Under a scope no path may start at a reserved-marker attribute,
 * and a scoped GSI partition key can only be Set, SetIfNotExists or Removed as a
 * whole, with a value of its declared type: a composing backend mirrors the new
 * value, so it has to know it up front. Unscoped updates are unchecked.
 */
export const validateKvsUpdatesForScopeOrThrow = (
  storeConfig: KeyValueStoreQPQConfigSetting,
  scope: string | undefined,
  updates: KvsUpdate,
): void => {
  if (scope === undefined) {
    return;
  }

  const indexKeys = getScopedKvsIndexPartitionKeys(storeConfig);

  for (const update of updates) {
    const rootAttributeName = getRootAttributeName(update);
    if (typeof rootAttributeName !== 'string') {
      continue;
    }

    validateAttributeNamesForScopeOrThrow([rootAttributeName]);

    const indexKey = indexKeys.find((key) => key.key === rootAttributeName);
    if (indexKey) {
      validateIndexKeyUpdateOrThrow(indexKey, update);
    }
  }
};
