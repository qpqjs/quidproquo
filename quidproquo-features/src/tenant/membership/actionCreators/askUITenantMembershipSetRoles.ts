import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { TenantRoleOption } from '../../models/TenantRoleOption';
import { TenantMembershipUiEffect } from '../effects/TenantMembershipUiEffect';
import { TenantMembershipUiSetRolesEffect } from '../effects/TenantMembershipUiSetRolesEffect';

/** Stores the role picker. */
export function* askUITenantMembershipSetRoles(roles: TenantRoleOption[]): AskResponse<void> {
  yield* askStateDispatchEffect<TenantMembershipUiSetRolesEffect>(TenantMembershipUiEffect.SetRoles, { roles });
}
