import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { TenantMemberRolesSetRequest } from '../../models/TenantMemberRolesSetRequest';
import { askTenantMembershipSetError } from '../actionCreators/askTenantMembershipSetError';
import { askTenantMemberRolesPut } from '../transport/askTenantMemberRolesPut';
import { askTenantMembershipUiLoadMembers } from './askTenantMembershipUiLoadMembers';

/** Replace a member's roles and grants. Reloads the roster on success; a refusal lands in `error` and the roster is left as it was. Returns whether it succeeded. */
export function* askTenantMembershipUiSetMemberRoles(
  target: TenantClientTarget,
  tenantId: TenantId,
  userId: string,
  assignment: TenantMemberRolesSetRequest,
): AskResponse<boolean> {
  const result = yield* askUiCatch(askTenantMemberRolesPut(target, tenantId, userId, assignment), { askSetError: askTenantMembershipSetError });

  if (!result.success) {
    return false;
  }

  yield* askTenantMembershipUiLoadMembers(target, tenantId);
  return true;
}
