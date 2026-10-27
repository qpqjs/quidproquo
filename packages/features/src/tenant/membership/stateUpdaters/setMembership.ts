import { TenantMembershipUiSetMembershipPayload } from '../effects/TenantMembershipUiSetMembershipEffect';
import { TenantMembershipUiState } from '../types/TenantMembershipUiState';

export const setMembership = (state: TenantMembershipUiState, payload: TenantMembershipUiSetMembershipPayload): TenantMembershipUiState => ({
  ...state,
  tenantId: payload.tenantId,
  membership: payload.membership,
});
