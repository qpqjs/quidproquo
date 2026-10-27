import { AskResponse, askStorageScopeRead } from '@qpqjs/core';

/** The ambient storage scope for this collection's reads and writes (undefined = unscoped). Read per call, not at provide time. */
export function* askEventDocResolveScope(): AskResponse<string | undefined> {
  const scope = yield* askStorageScopeRead();
  return scope ?? undefined;
}
