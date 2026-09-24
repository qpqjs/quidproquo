import { KvsCoreDataType, KvsQueryOperation } from '../../actions/keyValueStore/types';
import { KeyValueStoreQPQConfigSetting, QPQConfig } from '../../config';
import { getKeyValueStoreByName } from '../../qpqCoreUtils';
import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';
import {
  validateKvsKeyConditionForScopeOrThrow,
  validateKvsPkValueForScopeOrThrow,
  validateScopeSupportedForPartitionKeyType,
} from './kvsScopeRules';
import { KvsStoreNotFoundError } from './KvsStoreNotFoundError';
import { validateScopeSegment } from './validateScopeSegment';

// THE shared scope gate for every kvs backend (dynamo, dev-server sqlite, ...):
// resolve the store's config and validate the call's scope against it. How a
// backend stores the scope is its own business; the rules they all enforce are
// in kvsScopeRules, so backends can never drift apart on validation.

// Store lookup with the typed misconfiguration error (never a bare throw).
export const resolveKvsStoreConfigOrThrow = (qpqConfig: QPQConfig, keyValueStoreName: string): KeyValueStoreQPQConfigSetting => {
  const storeConfig = getKeyValueStoreByName(qpqConfig, keyValueStoreName);
  if (!storeConfig) {
    throw new KvsStoreNotFoundError(keyValueStoreName);
  }

  return storeConfig;
};

// Every backend calls this on every call, scoped or not: the store's `scoped`
// flag and the call's scope must agree, so a scoped store can never be reached
// without one and an unscoped store never gains a hidden partition.
// Scan-all-scopes is the one deliberate exception and does not go through here.
export const assertKvsScopeRequirementOrThrow = (qpqConfig: QPQConfig, keyValueStoreName: string, scope: string | undefined): void => {
  const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);

  if (storeConfig.scoped && scope === undefined) {
    throw new InvalidScopeError(
      InvalidScopeErrorCode.scopeRequired,
      `Key value store '${keyValueStoreName}' is scoped; every call must carry a scope.`,
    );
  }

  if (!storeConfig.scoped && scope !== undefined) {
    throw new InvalidScopeError(
      InvalidScopeErrorCode.notScoped,
      `Key value store '${keyValueStoreName}' is not scoped; declare it scoped or drop the scope.`,
    );
  }
};

/**
 * Store lookup plus every store-level scope rule: the call's scope matches the
 * store's `scoped` flag, and a scope is a valid segment on a string-pk store.
 * Backends call it once per request before touching data.
 */
export const resolveScopedKvsStoreOrThrow = (
  qpqConfig: QPQConfig,
  keyValueStoreName: string,
  scope: string | undefined,
): KeyValueStoreQPQConfigSetting => {
  const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);
  assertKvsScopeRequirementOrThrow(qpqConfig, keyValueStoreName, scope);

  if (scope !== undefined) {
    validateScopeSegment(scope);
    validateScopeSupportedForPartitionKeyType(storeConfig.partitionKey.type);
  }

  return storeConfig;
};

// Row-partitioned backends (dev-server sqlite): the scope is a column, so the
// same validations apply, but all the backend needs back is the real partition
// key attribute name.
export const resolveScopedPkAttributeOrThrow = (qpqConfig: QPQConfig, keyValueStoreName: string, scope: string): string => {
  const storeConfig = resolveKvsStoreConfigOrThrow(qpqConfig, keyValueStoreName);

  validateScopeSegment(scope);
  validateScopeSupportedForPartitionKeyType(storeConfig.partitionKey.type);

  return storeConfig.partitionKey.key;
};

// Request-level checks for backends that keep the scope out of stored values
// (dev-server sqlite stores keys and items raw; the scope just picks the rows).
// They run the same rules a composing backend runs, so a call that fails
// deployed fails locally too.

export const validateScopedKvsKeyOrThrow = (
  qpqConfig: QPQConfig,
  keyValueStoreName: string,
  scope: string | undefined,
  key: KvsCoreDataType,
): void => {
  validateKvsPkValueForScopeOrThrow(resolveScopedKvsStoreOrThrow(qpqConfig, keyValueStoreName, scope), scope, key);
};

export const validateScopedKvsItemOrThrow = (
  qpqConfig: QPQConfig,
  keyValueStoreName: string,
  scope: string | undefined,
  item: Record<string, any>,
): void => {
  const storeConfig = resolveScopedKvsStoreOrThrow(qpqConfig, keyValueStoreName, scope);
  validateKvsPkValueForScopeOrThrow(storeConfig, scope, (item ?? {})[storeConfig.partitionKey.key]);
};

export const validateScopedKvsKeyConditionOrThrow = (
  qpqConfig: QPQConfig,
  keyValueStoreName: string,
  scope: string | undefined,
  keyCondition: KvsQueryOperation,
): void => {
  validateKvsKeyConditionForScopeOrThrow(resolveScopedKvsStoreOrThrow(qpqConfig, keyValueStoreName, scope), scope, keyCondition);
};
