import {
  KeyValueStoreQPQConfigSetting,
  KvsCoreDataType,
  KvsLogicalOperatorType,
  KvsQueryOperation,
  validateKvsFilterForScopeOrThrow,
  validateKvsKeyConditionForScopeOrThrow,
  validateKvsPkValueForScopeOrThrow,
} from 'quidproquo-core';

import { composeScopedKvsQueryOperation, stripScopedKvsItem } from './scopedKvsQueryOperation';
import { buildKvsScopeBeginsWithCondition, buildKvsScopeExclusionCondition, composeScopedKvsValue } from './scopedKvsValue';

/**
 * Everything dynamo needs to scope one store, in one object. DynamoDB has no
 * notion of scope, so the scope is composed into the stored pk value; the pk
 * appears in a different shape per action - a bare key, a field inside the
 * item, buried in a condition tree, or absent entirely - so each shape gets one
 * method instead of each processor wiring the low-level helpers. Every method
 * runs core's kvs scope rules before composing.
 *
 * Unscoped requests get a near-identity translator, so processors never branch
 * on `scope === undefined`. On a string pk it still guards the scope boundary in
 * both directions: scanFilter excludes scope-composed rows (an unscoped
 * Scan/GetAll over a mixed table would otherwise return every scope's rows with
 * the scope-composed pk values un-stripped), and the rules reject raw pk values
 * carrying the reserved marker (an unscoped value of `acme${DELIMITER}secret`
 * would read or forge scope acme's composed rows).
 */
export type ScopedKvsTranslator = {
  /** Get/Update/Delete: prefix a bare key value. */
  key: (key: KvsCoreDataType) => KvsCoreDataType;
  /** Upsert: clone the item with its pk field prefixed. */
  item: <T extends Record<string, any>>(item: T) => T;
  /** Query: rewrite pk conditions to the composed form; throws if none exist. */
  keyCondition: (operation: KvsQueryOperation) => KvsQueryOperation;
  /** Optional filter: rewrite any pk legs; non-pk conditions untouched. */
  filter: (operation?: KvsQueryOperation) => KvsQueryOperation | undefined;
  /** Scan/GetAll: AND a begins_with scope predicate onto the caller's filter. */
  scanFilter: (operation?: KvsQueryOperation) => KvsQueryOperation | undefined;
  /** Reads: strip the prefix off a returned item (null/undefined passthrough). */
  strip: <T>(item: T) => T;
};

const createUnscopedTranslator = (storeConfig: KeyValueStoreQPQConfigSetting): ScopedKvsTranslator => {
  const pkAttributeName = storeConfig.partitionKey.key;

  const guardedKey = (key: KvsCoreDataType): KvsCoreDataType => {
    validateKvsPkValueForScopeOrThrow(storeConfig, undefined, key);
    return key;
  };

  const guardedItem = <T extends Record<string, any>>(item: T): T => {
    validateKvsPkValueForScopeOrThrow(storeConfig, undefined, item[pkAttributeName]);
    return item;
  };

  const guardedKeyCondition = (operation: KvsQueryOperation): KvsQueryOperation => {
    validateKvsKeyConditionForScopeOrThrow(storeConfig, undefined, operation);
    return operation;
  };

  const excludeScopedRows = (operation?: KvsQueryOperation): KvsQueryOperation | undefined => {
    // Only a string pk can hold composed values, so only then can an unscoped scan meet another scope's rows.
    if (storeConfig.partitionKey.type !== 'string') {
      return operation;
    }

    const exclusion = buildKvsScopeExclusionCondition(pkAttributeName);
    return operation ? { operation: KvsLogicalOperatorType.And, conditions: [exclusion, operation] } : exclusion;
  };

  return {
    key: guardedKey,
    item: guardedItem,
    keyCondition: guardedKeyCondition,
    filter: (operation) => operation,
    scanFilter: excludeScopedRows,
    strip: (item) => item,
  };
};

const createScopedTranslator = (scope: string, storeConfig: KeyValueStoreQPQConfigSetting): ScopedKvsTranslator => {
  const pkAttributeName = storeConfig.partitionKey.key;

  const composeKey = (key: KvsCoreDataType): KvsCoreDataType => {
    validateKvsPkValueForScopeOrThrow(storeConfig, scope, key);
    return composeScopedKvsValue(scope, key);
  };

  const composeKeyCondition = (operation: KvsQueryOperation): KvsQueryOperation => {
    validateKvsKeyConditionForScopeOrThrow(storeConfig, scope, operation);
    return composeScopedKvsQueryOperation(scope, operation, pkAttributeName);
  };

  const composeFilter = (operation?: KvsQueryOperation): KvsQueryOperation | undefined => {
    if (!operation) {
      return operation;
    }

    validateKvsFilterForScopeOrThrow(storeConfig, scope, operation);
    return composeScopedKvsQueryOperation(scope, operation, pkAttributeName);
  };

  const scopeScan = (operation?: KvsQueryOperation): KvsQueryOperation | undefined => {
    const scopeCondition = buildKvsScopeBeginsWithCondition(pkAttributeName, scope);
    const rewritten = composeFilter(operation);

    return rewritten ? { operation: KvsLogicalOperatorType.And, conditions: [scopeCondition, rewritten] } : scopeCondition;
  };

  const strip = <T>(item: T): T =>
    item && typeof item === 'object' ? (stripScopedKvsItem(scope, item as Record<string, any>, pkAttributeName) as unknown as T) : item;

  return {
    key: composeKey,
    item: (item) => ({ ...item, [pkAttributeName]: composeKey(item[pkAttributeName]) }),
    keyCondition: composeKeyCondition,
    filter: composeFilter,
    scanFilter: scopeScan,
    strip,
  };
};

/** The translator for one store and scope (undefined for unscoped). Callers validate the scope against the store first; getScopedKvsTranslatorOrThrow does. */
export const createScopedKvsTranslator = (scope: string | undefined, storeConfig: KeyValueStoreQPQConfigSetting): ScopedKvsTranslator =>
  scope === undefined ? createUnscopedTranslator(storeConfig) : createScopedTranslator(scope, storeConfig);
