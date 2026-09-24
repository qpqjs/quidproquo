import { KVS_RESERVED_MARKER, KvsCoreDataType, KvsQueryCondition, KvsQueryOperationType } from 'quidproquo-core';

// Separates the scope from the raw key in a stored partition key value
// ('@@QPQSCOPE@@'). Built on core's KVS_RESERVED_MARKER, which caller pk values
// can never carry, so no raw value can forge it. '::' is unusable: it is qpq's
// own function-runtime separator ('src/path::method') and appears inside
// correlation ids, which the log service stores as partition keys.
export const KVS_SCOPE_DELIMITER = `${KVS_RESERVED_MARKER}SCOPE@@`;

// Compose a scope into a partition key value: `${scope}${KVS_SCOPE_DELIMITER}${rawValue}`.
// Callers validate both first with core's kvs scope rules; the translator does.
export function composeScopedKvsValue(scope: string, rawValue: KvsCoreDataType): string {
  return `${scope}${KVS_SCOPE_DELIMITER}${rawValue}`;
}

// The inverse of composeScopedKvsValue: split a stored partition key value back into the
// scope it was written under and the caller's raw key.
//
// Needed by anything reading a RAW stored key rather than going through a scoped request.
// Change data capture is the case that forced it: a stream record carries the composed pk,
// and the consumer has to re-enter the same scope before it can act on the item. An
// unscoped value has no delimiter and comes back with `scope: undefined`.
export const decomposeScopedKvsValue = (composedValue: string): { scope?: string; rawValue: string } => {
  const at = composedValue.indexOf(KVS_SCOPE_DELIMITER);

  if (at < 0) {
    return { rawValue: composedValue };
  }

  return {
    scope: composedValue.slice(0, at),
    rawValue: composedValue.slice(at + KVS_SCOPE_DELIMITER.length),
  };
};

// Undo composeScopedKvsValue on a value read back from storage, so callers
// never see the composed form. A stored value that doesn't carry the expected
// prefix is returned unchanged (it was written unscoped).
export function stripScopedKvsValue(scope: string, storedValue: KvsCoreDataType): KvsCoreDataType {
  if (typeof storedValue !== 'string') {
    return storedValue;
  }

  const prefix = `${scope}${KVS_SCOPE_DELIMITER}`;
  return storedValue.startsWith(prefix) ? storedValue.slice(prefix.length) : storedValue;
}

// The inverse guard for UNSCOPED Scan / GetAll: exclude rows whose pk carries the
// scope delimiter, so unscoped listings never leak other scopes' (composed) rows.
export function buildKvsScopeExclusionCondition(pkAttributeName: string): KvsQueryCondition {
  return {
    key: pkAttributeName,
    operation: KvsQueryOperationType.NotContains,
    valueA: KVS_SCOPE_DELIMITER,
  };
}

// A begins-with predicate on the partition key attribute, for enforcing scope
// on operations that have no key condition (Scan / GetAll).
export function buildKvsScopeBeginsWithCondition(pkAttributeName: string, scope: string): KvsQueryCondition {
  return {
    key: pkAttributeName,
    operation: KvsQueryOperationType.BeginsWith,
    valueA: `${scope}${KVS_SCOPE_DELIMITER}`,
  };
}
