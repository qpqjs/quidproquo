import { TenantMembershipUiSetLoadingPayload } from '../effects/TenantMembershipUiSetLoadingEffect';
import { TenantMembershipUiState } from '../types/TenantMembershipUiState';

export const setLoading = (state: TenantMembershipUiState, payload: TenantMembershipUiSetLoadingPayload): TenantMembershipUiState => ({
  ...state,
  isLoading: payload.isLoading,
});
