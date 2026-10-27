/** A query named an index its store doesn't declare. Query processors map it to the action's IndexNotFound. */
export class KvsIndexNotFoundError extends Error {
  readonly code = 'KvsIndexNotFoundError';

  constructor(keyValueStoreName: string, indexName: string) {
    super(`Key value store '${keyValueStoreName}' has no index named '${indexName}'`);
    this.name = 'KvsIndexNotFoundError';
  }
}
