import { askConfigGetGlobal, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { askTenantMemberHasPermission } from '../../tenant/logic/askTenantMemberHasPermission';
import { askTenantResolveRequest } from '../../tenant/logic/askTenantResolveRequest';
import { TenantId } from '../../tenant/models/TenantId';
import { TENANT_EMAIL_USER_DIRECTORY_GLOBAL } from '../constants/tenantEmailGlobalNames';
import { TenantEmailPermission } from '../constants/TenantEmailPermission';

/**
 * The inbox routes' gate: a tenant header is required (inboxes belong to tenants, never to a
 * person) and the caller needs InboxesManage there. Returns the tenant and caller.
 */
export function* askTenantEmailRequest(event: HTTPEvent): AskResponse<{ tenantId: TenantId; userId: string }> {
  const userDirectoryName = yield* askConfigGetGlobal<string>(TENANT_EMAIL_USER_DIRECTORY_GLOBAL);
  const { tenantId, userId } = yield* askTenantResolveRequest(event, userDirectoryName);

  if (tenantId === null) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'Email inboxes belong to a tenant: select one.');
  }

  const allowed = yield* askTenantMemberHasPermission(tenantId, userId, {
    permission: TenantEmailPermission.InboxesManage,
    resourceId: tenantId,
    resourceKind: null,
  });
  if (!allowed) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, `Missing permission: ${TenantEmailPermission.InboxesManage}`);
  }

  return { tenantId, userId };
}
