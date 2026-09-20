import { askCatch, askConfigGetGlobal, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, qpqWebServerUtils } from 'quidproquo-webserver';

import { DEFAULT_TENANT_HEADER_NAME, TENANT_HEADER_NAME_GLOBAL } from '../constants/tenantGlobalNames';
import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { TenantResolvedRequest } from '../models/TenantResolvedRequest';
import { askTenantResolveUserId } from './askTenantResolveUserId';
import { composePersonalScope, composeTenantScope } from './storageScope';

/**
 * The request-time gate. A tenant-aware request ALWAYS resolves to a typed scope: TENANT#<id>
 * when the header names a tenant the caller is an enabled member of (Forbidden otherwise),
 * else the caller's own PERSONAL#<userId>. The header is re-checked against the membership
 * table on every request, and the row read for that check is returned so a permission check
 * costs no second read. The header-name global is only set on the tenant feature's own
 * routes; other routes use the default header name.
 */
export function* askTenantResolveRequest(event: HTTPEvent, userDirectoryName?: string): AskResponse<TenantResolvedRequest> {
  const configuredHeaderName = yield* askCatch(askConfigGetGlobal<string>(TENANT_HEADER_NAME_GLOBAL));
  const headerName = (configuredHeaderName.success && configuredHeaderName.result) || DEFAULT_TENANT_HEADER_NAME;

  const userId = yield* askTenantResolveUserId(userDirectoryName);

  const tenantId = qpqWebServerUtils.getHeaderValue(headerName, event.headers);
  if (!tenantId) {
    return { scope: composePersonalScope(userId), userId, tenantId: null, membership: null };
  }

  const membership = yield* askTenantMembershipGet(userId, tenantId);
  if (!membership || membership.disabled) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'User is not a member of the requested tenant.');
  }

  return { scope: composeTenantScope(tenantId), userId, tenantId, membership };
}
