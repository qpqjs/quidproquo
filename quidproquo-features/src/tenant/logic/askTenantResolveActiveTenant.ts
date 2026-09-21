import { askConfigGetGlobal, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { DEFAULT_TENANT_HEADER_NAME, TENANT_HEADER_NAME_GLOBAL } from '../constants/tenantGlobalNames';
import { TenantId } from '../models/TenantId';
import { askTenantResolveRequestScope } from './askTenantResolveRequestScope';
import { getTenantIdFromScope } from './storageScope';

// The REQUIRED tenant gate: same membership re-check as the request-scope
// resolver, but a request that resolves to a personal scope (no tenant
// header) is a BadRequest - for routes that make no sense without a tenant.
export function* askTenantResolveActiveTenant(event: HTTPEvent): AskResponse<TenantId> {
  const scope = yield* askTenantResolveRequestScope(event);

  const tenantId = getTenantIdFromScope(scope);
  if (!tenantId) {
    const configuredHeaderName = yield* askConfigGetGlobal<string>(TENANT_HEADER_NAME_GLOBAL);
    const headerName = configuredHeaderName || DEFAULT_TENANT_HEADER_NAME;
    return yield* askThrowError(ErrorTypeEnum.BadRequest, `Missing tenant header: ${headerName}`);
  }

  return tenantId;
}
