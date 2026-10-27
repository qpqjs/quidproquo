import { AskResponse } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { askTenantResolveRequestScope } from './askTenantResolveRequestScope';

// The inline-function implementation behind TENANT_SCOPE_RESOLVER_FN: the
// eventDoc feature's generic `scopeResolver` hook calls this with the request
// so any collection can be tenant-scoped without eventDoc knowing about
// tenants. Always a typed scope (TENANT#<id> or PERSONAL#<userId>), never
// null - a tenant-aware collection never reads or writes unscoped data.
export function* askTenantScopeResolver(input: { event: HTTPEvent }): AskResponse<string> {
  return yield* askTenantResolveRequestScope(input.event);
}
