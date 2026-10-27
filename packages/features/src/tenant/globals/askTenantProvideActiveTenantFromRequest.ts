import { AskResponse } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { askActiveTenantProvide } from '../context/askActiveTenantProvide';
import { askTenantResolveActiveTenant } from '../logic/askTenantResolveActiveTenant';
import { composeTenantScope } from '../logic/storageScope';

// The single wiring point for controllers that REQUIRE a tenant: resolve +
// validate the tenant from the request (BadRequest without a header), then run
// the inner story with the typed tenant scope as ambient context so nested
// logic can use the askTenant* wrappers without threading an id.
export function* askTenantProvideActiveTenantFromRequest<T>(event: HTTPEvent, story: AskResponse<T>): AskResponse<T> {
  const tenantId = yield* askTenantResolveActiveTenant(event);
  return yield* askActiveTenantProvide(composeTenantScope(tenantId), story);
}
