import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { TenantMember } from '../../models/TenantMember';
import { TenantMembershipUiEffect } from '../effects/TenantMembershipUiEffect';
import { TenantMembershipUiSetMembersEffect } from '../effects/TenantMembershipUiSetMembersEffect';

/** Stores the roster. */
export function* askTenantMembershipSetMembers(members: TenantMember[]): AskResponse<void> {
  yield* askStateDispatchEffect<TenantMembershipUiSetMembersEffect>(TenantMembershipUiEffect.SetMembers, { members });
}
