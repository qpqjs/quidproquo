import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askTenantIdParse } from './askTenantIdParse';
import { askTenantValidateMembership } from './askTenantValidateMembership';
import { composePersonalScope, composeTenantScope, parseStorageScope, StorageScopeType } from './storageScope';

// The inline-function implementation behind TENANT_CONNECTION_SCOPE_RESOLVER_FN:
// the websocket queue's `connectionScopeResolver` hook calls this on EVERY
// Authenticate, and the returned scope is what gets stored on the connection.
// No claim resolves to the user's own personal scope - a tenant-aware
// connection is never left unscoped. A tenant claim (the raw tenant id, as
// the client sends it) is membership-checked; a personal-scope claim is only
// ever accepted as the user's own.
export function* askTenantConnectionScopeResolver(input: { userId: string; requestedScope: string | null }): AskResponse<string> {
  const { userId, requestedScope } = input;

  if (!requestedScope) {
    return composePersonalScope(userId);
  }

  const parsed = parseStorageScope(requestedScope);
  if (parsed?.type === StorageScopeType.personal) {
    if (requestedScope !== composePersonalScope(userId)) {
      return yield* askThrowError(ErrorTypeEnum.Forbidden, `Cannot claim another user's personal scope.`);
    }

    return requestedScope;
  }

  const tenantId = yield* askTenantIdParse(requestedScope);
  const isMember = yield* askTenantValidateMembership(userId, tenantId);
  if (!isMember) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'User is not a member of the requested tenant.');
  }

  return composeTenantScope(tenantId);
}
