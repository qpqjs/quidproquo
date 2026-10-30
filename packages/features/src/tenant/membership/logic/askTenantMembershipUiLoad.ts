import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askTenantMembershipSetError } from '../actionCreators/askTenantMembershipSetError';
import { askTenantMembershipSetLoading } from '../actionCreators/askTenantMembershipSetLoading';
import { askTenantMembershipSetMembership } from '../actionCreators/askTenantMembershipSetMembership';
import { askTenantMembershipSetRoles } from '../actionCreators/askTenantMembershipSetRoles';
import { askTenantMembershipFetch } from '../transport/askTenantMembershipFetch';
import { askTenantRolesFetch } from '../transport/askTenantRolesFetch';

function* askFetchStanding(target: TenantClientTarget, tenantId: TenantId): AskResponse<void> {
  const membership = yield* askTenantMembershipFetch(target, tenantId);
  const roles = yield* askTenantRolesFetch(target, tenantId);

  yield* askTenantMembershipSetMembership(tenantId, membership);
  yield* askTenantMembershipSetRoles(roles);
}

/** Load the caller's standing in a tenant (selecting it). Call from the selection handler; the roster is loaded separately. */
export function* askTenantMembershipUiLoad(target: TenantClientTarget, tenantId: TenantId): AskResponse<void> {
  yield* askUiCatch(askFetchStanding(target, tenantId), { askSetError: askTenantMembershipSetError, askSetBusy: askTenantMembershipSetLoading });
}
