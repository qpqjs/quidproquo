import { askCatch, AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { TenantMemberRolesSetRequest } from '../../models/TenantMemberRolesSetRequest';
import { askUITenantMembershipSetError } from '../actionCreators/askUITenantMembershipSetError';
import { askTenantMemberRolesPut } from '../transport/askTenantMemberRolesPut';
import { askTenantMembershipUiLoadMembers } from './askTenantMembershipUiLoadMembers';

/** Replace a member's roles and grants. Reloads the roster on success; a refusal lands in `error` and the roster is left as it was. Returns whether it succeeded. */
export function* askTenantMembershipUiSetMemberRoles(
  target: TenantClientTarget,
  tenantId: TenantId,
  userId: string,
  assignment: TenantMemberRolesSetRequest,
): AskResponse<boolean> {
  yield* askUITenantMembershipSetError(null);

  const result = yield* askCatch(askTenantMemberRolesPut(target, tenantId, userId, assignment));

  if (!result.success) {
    yield* askUITenantMembershipSetError(result.error.errorText);
    return false;
  }

  yield* askTenantMembershipUiLoadMembers(target, tenantId);
  return true;
}
