// Raised when a scope segment fails validation. Scope is an opaque identifier
// (supplied by a higher-level data-partitioning feature) that gets embedded
// into file paths and kvs partition keys, so a malformed one is always
// rejected outright - never normalized - to make escaping a scope impossible
// by construction.
export enum InvalidScopeErrorCode {
  // Empty or whitespace-only scope.
  empty = 'empty',
  // Contains a path separator, '..', or a null byte.
  unsafeCharacters = 'unsafeCharacters',
  // Longer than the allowed maximum (scopes are ids, not payloads).
  tooLong = 'tooLong',
  // A filepath composed under a scope could traverse out of it (absolute
  // path, a '..' segment, or a null byte).
  unsafePath = 'unsafePath',
  // A scoped query whose key condition never constrains the partition key -
  // on value-composed backends (dynamo) it would silently span every scope.
  queryMissingPartitionKey = 'queryMissingPartitionKey',
  // A raw partition-key value containing the scope delimiter: storing it would
  // make the row indistinguishable from another scope's composed data.
  reservedDelimiter = 'reservedDelimiter',
  // The resource is declared `scoped` in config but the call carried no scope.
  // On a drive that would land the object beside every tenant's prefix; on a
  // store it would read or write the unpartitioned rows.
  scopeRequired = 'scopeRequired',
  // The call carried a scope but the resource is not declared `scoped` in
  // config: the data would land under a prefix nothing else on that resource
  // expects, invisible to every unscoped reader.
  notScoped = 'notScoped',
  // An attribute name on a scoped store carrying the reserved marker. Those
  // attributes belong to the backend (its own index bookkeeping); a caller-set
  // one could file the row under another scope's index partition.
  reservedAttribute = 'reservedAttribute',
  // A scoped store's index partition key value that doesn't match the key's
  // declared type.
  indexKeyType = 'indexKeyType',
  // Something a scoped store's index partition key can't support: a non-equality
  // key condition on it, or an update whose result isn't known up front
  // (Increment, Add, Delete, a nested path).
  unsupportedOperation = 'unsupportedOperation',
  // A page key issued under another scope. A page key only continues the
  // listing that issued it; one edited to point elsewhere is refused.
  pageKeyOutOfScope = 'pageKeyOutOfScope',
}

export class InvalidScopeError extends Error {
  constructor(
    public readonly code: InvalidScopeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'InvalidScopeError';
  }
}
