// Raised when a key value store name is not declared in the qpq config. This
// is a MISCONFIGURATION (wrong name, missing define, missing cross-module
// re-declaration), distinct from the runtime table not existing - so it gets
// its own named error that processors map to their action's typed
// StoreNotFound member instead of degrading to a generic error.
export class KvsStoreNotFoundError extends Error {
  constructor(keyValueStoreName: string) {
    super(`Key value store '${keyValueStoreName}' not found in configuration`);
    this.name = 'KvsStoreNotFoundError';
  }
}
