import {
  getScopedKvsIndexPartitionKeys,
  KeyValueStoreQPQConfigSetting,
  KvsCoreDataType,
  KvsKey,
  KvsLogicalOperatorType,
  KvsQueryOperation,
  KvsUpdate,
  KvsUpdateAction,
  KvsUpdateActionType,
  validateKvsFilterForScopeOrThrow,
  validateKvsItemForScopeOrThrow,
  validateKvsKeyConditionForScopeOrThrow,
  validateKvsPkValueForScopeOrThrow,
  validateKvsUpdatesForScopeOrThrow,
} from 'quidproquo-core';

import { composeScopedKvsIndexValue, getScopedKvsIndexAttributeName, stripScopedKvsIndexAttributes } from './scopedKvsIndexAttribute';
import { composeScopedKvsIndexKeyCondition, composeScopedKvsQueryOperation, stripScopedKvsItem } from './scopedKvsQueryOperation';
import { buildKvsScopeBeginsWithCondition, buildKvsScopeExclusionCondition, composeScopedKvsValue } from './scopedKvsValue';

/**
 * Everything dynamo needs to scope one store, in one object. DynamoDB has no
 * notion of scope, so the scope is composed into the stored pk value; the pk
 * appears in a different shape per action - a bare key, a field inside the
 * item, buried in a condition tree, or absent entirely - so each shape gets one
 * method instead of each processor wiring the low-level helpers. Every method
 * runs core's kvs scope rules before composing.
 *
 * A scoped store's GSIs are keyed on hidden scope-composed copies of their
 * partition keys (see scopedKvsIndexAttribute): item and update keep the copies
 * in step with their sources, keyCondition points an index query at its copy,
 * and strip drops them.
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
  /** Upsert: clone the item with its pk field prefixed and its hidden index copies set. */
  item: <T extends Record<string, any>>(item: T) => T;
  /** Query: rewrite pk conditions, and the partition key condition of the chosen GSI (`indexName`), to the stored form. */
  keyCondition: (operation: KvsQueryOperation, indexName?: string) => KvsQueryOperation;
  /** Optional filter: rewrite any pk legs; non-pk conditions untouched. */
  filter: (operation?: KvsQueryOperation) => KvsQueryOperation | undefined;
  /** Scan/GetAll: AND a begins_with scope predicate onto the caller's filter. */
  scanFilter: (operation?: KvsQueryOperation) => KvsQueryOperation | undefined;
  /** Update: mirror writes to GSI partition keys onto their hidden copies. */
  update: (updates: KvsUpdate) => KvsUpdate;
  /** Reads: strip the prefix and hidden index copies off a returned item (null/undefined passthrough). */
  strip: <T>(item: T) => T;
};

const createUnscopedTranslator = (storeConfig: KeyValueStoreQPQConfigSetting): ScopedKvsTranslator => {
  const pkAttributeName = storeConfig.partitionKey.key;

  const guardedKey = (key: KvsCoreDataType): KvsCoreDataType => {
    validateKvsPkValueForScopeOrThrow(storeConfig, undefined, key);
    return key;
  };

  const guardedItem = <T extends Record<string, any>>(item: T): T => {
    validateKvsItemForScopeOrThrow(storeConfig, undefined, item);
    return item;
  };

  const guardedKeyCondition = (operation: KvsQueryOperation): KvsQueryOperation => {
    validateKvsKeyConditionForScopeOrThrow(storeConfig, undefined, operation);
    return operation;
  };

  const guardedUpdates = (updates: KvsUpdate): KvsUpdate => {
    validateKvsUpdatesForScopeOrThrow(storeConfig, undefined, updates);
    return updates;
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
    update: guardedUpdates,
    strip: (item) => item,
  };
};

// Validated by validateKvsUpdatesForScopeOrThrow first, so an index key update here is a whole-attribute
// Set, SetIfNotExists or Remove with a correctly typed value.
const mirrorIndexKeyUpdate = (scope: string, update: KvsUpdateAction, indexKeys: KvsKey[]): KvsUpdateAction[] => {
  const rootAttributeName = typeof update.attributePath === 'string' ? update.attributePath : update.attributePath[0];
  const indexKey = indexKeys.find((key) => key.key === rootAttributeName);
  if (!indexKey) {
    return [update];
  }

  const hiddenAttributeName = getScopedKvsIndexAttributeName(indexKey.key);
  if (update.action === KvsUpdateActionType.Remove) {
    return [update, { attributePath: hiddenAttributeName, action: KvsUpdateActionType.Remove }];
  }

  // SetIfNotExists mirrors safely because the hidden copy exists exactly when its source does.
  return [
    update,
    { attributePath: hiddenAttributeName, action: update.action, value: composeScopedKvsIndexValue(scope, update.value as KvsCoreDataType) },
  ];
};

const createScopedTranslator = (scope: string, storeConfig: KeyValueStoreQPQConfigSetting): ScopedKvsTranslator => {
  const pkAttributeName = storeConfig.partitionKey.key;
  const indexKeys = getScopedKvsIndexPartitionKeys(storeConfig);

  const composeKey = (key: KvsCoreDataType): KvsCoreDataType => {
    validateKvsPkValueForScopeOrThrow(storeConfig, scope, key);
    return composeScopedKvsValue(scope, key);
  };

  const composeItem = <T extends Record<string, any>>(item: T): T => {
    validateKvsItemForScopeOrThrow(storeConfig, scope, item);

    const composed: Record<string, any> = { ...item, [pkAttributeName]: composeScopedKvsValue(scope, item[pkAttributeName]) };

    // Sparse, like a real GSI: a row without the source attribute gets no hidden copy and stays out of that index.
    for (const indexKey of indexKeys) {
      const value = item[indexKey.key];
      if (value !== undefined && value !== null) {
        composed[getScopedKvsIndexAttributeName(indexKey.key)] = composeScopedKvsIndexValue(scope, value);
      }
    }

    return composed as T;
  };

  const composeKeyCondition = (operation: KvsQueryOperation, indexName?: string): KvsQueryOperation => {
    validateKvsKeyConditionForScopeOrThrow(storeConfig, scope, operation);

    const withComposedPk = composeScopedKvsQueryOperation(scope, operation, pkAttributeName);
    const indexKey = indexKeys.find((key) => key.key === indexName);

    return indexKey ? composeScopedKvsIndexKeyCondition(scope, withComposedPk, indexKey.key) : withComposedPk;
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

  const composeUpdates = (updates: KvsUpdate): KvsUpdate => {
    validateKvsUpdatesForScopeOrThrow(storeConfig, scope, updates);
    return updates.flatMap((update) => mirrorIndexKeyUpdate(scope, update, indexKeys));
  };

  const strip = <T>(item: T): T =>
    item && typeof item === 'object'
      ? (stripScopedKvsIndexAttributes(stripScopedKvsItem(scope, item as Record<string, any>, pkAttributeName)) as unknown as T)
      : item;

  return {
    key: composeKey,
    item: composeItem,
    keyCondition: composeKeyCondition,
    filter: composeFilter,
    scanFilter: scopeScan,
    update: composeUpdates,
    strip,
  };
};

/** The translator for one store and scope (undefined for unscoped). Callers validate the scope against the store first; getScopedKvsTranslatorOrThrow does. */
export const createScopedKvsTranslator = (scope: string | undefined, storeConfig: KeyValueStoreQPQConfigSetting): ScopedKvsTranslator =>
  scope === undefined ? createUnscopedTranslator(storeConfig) : createScopedTranslator(scope, storeConfig);
