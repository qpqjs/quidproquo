import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { eventDocPermission } from '../../eventDoc/constants/eventDocPermissions';
import { askEventDocResolveUserId } from '../../eventDoc/globals/askEventDocResolveUserId';
import { EventDocAuthoriseInput } from '../../eventDoc/types/EventDocAuthoriseInput';
import { askTenantReadActiveTenantId } from '../context/askTenantReadActiveTenantId';
import { buildTenantPermissionRequirement } from './roles/buildTenantPermissionRequirement';
import { askTenantMemberHasPermission } from './askTenantMemberHasPermission';

/**
 * The inline-function implementation behind TENANT_EVENT_DOC_AUTHORISER_FN: inside a tenant
 * scope the caller must hold `eventDoc:<store>:<action>`. A personal scope has no second
 * party to protect and runs ungated.
 */
export function* askTenantEventDocAuthoriser(input: EventDocAuthoriseInput): AskResponse<void> {
  const tenantId = yield* askTenantReadActiveTenantId();
  if (!tenantId) {
    return;
  }

  const userId = yield* askEventDocResolveUserId();
  const permission = eventDocPermission(input.storeName, input.action);

  const allowed = yield* askTenantMemberHasPermission(tenantId, userId, buildTenantPermissionRequirement(permission));
  if (!allowed) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, `Missing permission: ${permission}`);
  }
}
