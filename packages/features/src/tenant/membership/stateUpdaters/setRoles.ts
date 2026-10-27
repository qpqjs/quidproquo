import { TenantMembershipUiSetRolesPayload } from '../effects/TenantMembershipUiSetRolesEffect';
import { TenantMembershipUiState } from '../types/TenantMembershipUiState';

export const setRoles = (state: TenantMembershipUiState, payload: TenantMembershipUiSetRolesPayload): TenantMembershipUiState => ({
  ...state,
  roles: payload.roles,
});
