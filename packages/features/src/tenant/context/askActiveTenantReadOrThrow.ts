import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askActiveTenantRead } from './askActiveTenantRead';

// Throw if unprovided: scoped storage access without an active scope must
// never silently fall through to unscoped data. The value is the typed scope
// (TENANT#<id> or PERSONAL#<userId>) - use askTenantReadActiveTenantId when a
// tenant IDENTITY is needed rather than a partition.
export function* askActiveTenantReadOrThrow(): AskResponse<string> {
  const scope = yield* askActiveTenantRead();

  if (!scope) {
    return yield* askThrowError(
      ErrorTypeEnum.Forbidden,
      'No active scope was provided. Wrap the call in askActiveTenantProvide(scope, ...) or resolve it from the request.',
    );
  }

  return scope;
}
