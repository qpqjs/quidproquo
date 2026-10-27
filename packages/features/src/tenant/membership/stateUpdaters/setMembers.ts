import { TenantMembershipUiSetMembersPayload } from '../effects/TenantMembershipUiSetMembersEffect';
import { TenantMembershipUiState } from '../types/TenantMembershipUiState';

export const setMembers = (state: TenantMembershipUiState, payload: TenantMembershipUiSetMembersPayload): TenantMembershipUiState => ({
  ...state,
  members: payload.members,
});
