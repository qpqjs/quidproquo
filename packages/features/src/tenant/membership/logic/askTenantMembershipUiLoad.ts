import { askCatch, AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askUITenantMembershipSetError } from '../actionCreators/askUITenantMembershipSetError';
import { askUITenantMembershipSetLoading } from '../actionCreators/askUITenantMembershipSetLoading';
import { askUITenantMembershipSetMembership } from '../actionCreators/askUITenantMembershipSetMembership';
import { askUITenantMembershipSetRoles } from '../actionCreators/askUITenantMembershipSetRoles';
import { askTenantMembershipFetch } from '../transport/askTenantMembershipFetch';
import { askTenantRolesFetch } from '../transport/askTenantRolesFetch';

function* askFetchStanding(target: TenantClientTarget, tenantId: TenantId): AskResponse<void> {
  const membership = yield* askTenantMembershipFetch(target, tenantId);
  const roles = yield* askTenantRolesFetch(target, tenantId);

  yield* askUITenantMembershipSetMembership(tenantId, membership);
  yield* askUITenantMembershipSetRoles(roles);
}

/** Load the caller's standing in a tenant (selecting it). Call from the selection handler; the roster is loaded separately. */
export function* askTenantMembershipUiLoad(target: TenantClientTarget, tenantId: TenantId): AskResponse<void> {
  yield* askUITenantMembershipSetLoading(true);
  yield* askUITenantMembershipSetError(null);

  const result = yield* askCatch(askFetchStanding(target, tenantId), askUITenantMembershipSetLoading(false));

  if (!result.success) {
    yield* askUITenantMembershipSetError(result.error.errorText);
  }
}
