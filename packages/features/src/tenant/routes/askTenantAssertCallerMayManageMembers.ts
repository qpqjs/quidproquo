import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { TenantPermission } from '../constants/TenantPermission';
import { askTenantMemberHasPermission } from '../logic/askTenantMemberHasPermission';
import { buildTenantPermissionRequirement } from '../logic/roles/buildTenantPermissionRequirement';
import { TenantId } from '../models/TenantId';

/** The gate on the member-management controllers: the caller holds MembersManage in the tenant named by the path. */
export function* askTenantAssertCallerMayManageMembers(tenantId: TenantId, callerUserId: string): AskResponse<void> {
  const allowed = yield* askTenantMemberHasPermission(tenantId, callerUserId, buildTenantPermissionRequirement(TenantPermission.MembersManage));
  if (!allowed) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'You do not have permission to manage members of this tenant.');
  }
}
